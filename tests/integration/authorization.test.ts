import { Client } from 'pg';
import { beforeAll, afterAll, expect, it } from 'vitest';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../src/generated/prisma/client';
import { createIdentityService } from '../../src/lib/server/identity-core';
import { testActors } from '../support/actors';
import { consumeCheckoutRequest } from '../../src/lib/server/throttle';
const owner = new Client({ connectionString: process.env.TEST_DATABASE_URL });
const runtime = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.TEST_APP_DATABASE_URL! }) });
beforeAll(() => owner.connect());
afterAll(async () => { await owner.end(); await runtime.$disconnect(); });
const serviceFor = (id: string) => createIdentityService(async () => ({ data: { user: { id, user_metadata: { role: 'ADMIN' } } }, error: null }), runtime);
it('creates a non-login least-privilege role', async () => {
  const result = await owner.query("SELECT rolcanlogin,rolsuper,rolbypassrls,rolcreaterole FROM pg_roles WHERE rolname='commerce_app'");
  expect(result.rows).toEqual([{ rolcanlogin: false, rolsuper: false, rolbypassrls: false, rolcreaterole: false }]);
});
it('loads roles from PostgreSQL and ignores editable user metadata', async () => {
  expect(await serviceFor(testActors[0].id).requireActor()).toEqual({ userId:testActors[0].id,role:'CUSTOMER' });
  const s = serviceFor(testActors[2].id); await expect(s.requireAdmin(await s.requireActor())).resolves.toBeUndefined();
});
it('denies customer admin access and cross-user resource access', async () => {
  const s = serviceFor(testActors[0].id); const a = await s.requireActor();
  await expect(s.requireAdmin(a)).rejects.toMatchObject({ status: 403 });
  expect(() => s.assertOwnership(a, testActors[1].id)).toThrow();
});
it('denies forged actors supplied directly by a caller', async () => {
  const s = serviceFor(testActors[0].id);
  await expect(s.requireAdmin({ userId: testActors[2].id, role: 'ADMIN' })).rejects.toMatchObject({ status: 401 });
});
it.each([401,403])('rejects expired or forged provider identity (%s)', async (status) => {
  const s = createIdentityService(async () => ({ data: { user: { id: testActors[2].id } }, error: { status } }), runtime);
  await expect(s.requireActor()).rejects.toMatchObject({ status: 401 });
});
it('rejects anonymous identity', async () => { await expect(createIdentityService(async () => ({ data: { user: null }, error: null }),runtime).requireActor()).rejects.toMatchObject({ status: 401 }); });
it('fails closed on identity provider outages', async () => { await expect(createIdentityService(async () => { throw new Error('sensitive provider error'); },runtime).requireActor()).rejects.toMatchObject({ status: 503 }); });
it('refuses privileged migration credentials at the identity boundary', async () => {
  const privileged = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.TEST_DATABASE_URL! }) });
  try { await expect(createIdentityService(async () => ({ data: { user: { id: testActors[0].id } }, error: null }),privileged).requireActor()).rejects.toMatchObject({ status: 503 }); }
  finally { await privileged.$disconnect(); }
});
it('refuses an accidentally over-granted runtime profile-role permission', async () => {
  await owner.query('GRANT UPDATE(role) ON commerce."Profile" TO commerce_test_login');
  try { await expect(serviceFor(testActors[0].id).requireActor()).rejects.toMatchObject({ status:503 }); }
  finally { await owner.query('REVOKE UPDATE(role) ON commerce."Profile" FROM commerce_test_login'); }
});
it('fresh admin verification detects a role revoked after actor creation', async () => {
  const s=serviceFor(testActors[2].id); const actor=await s.requireActor();
  await owner.query('UPDATE commerce."Profile" SET role=\'CUSTOMER\' WHERE id=$1',[testActors[2].id]);
  try { await expect(s.requireAdmin(actor)).rejects.toMatchObject({ status:403 }); }
  finally { await owner.query('UPDATE commerce."Profile" SET role=\'ADMIN\' WHERE id=$1',[testActors[2].id]); }
});
it('representative protected handlers prevent reading or modifying another customer resource',async () => {
  const id='7eb42b00-73aa-4111-8000-000000000099';
  await owner.query('INSERT INTO commerce."Cart"(id,"userId","updatedAt") VALUES ($1,$2,NOW())',[id,testActors[1].id]);
  const s=serviceFor(testActors[0].id);
  async function protectedHandler(write: boolean) {
    const actor=await s.requireActor();
    const resource=await runtime.cart.findUniqueOrThrow({ where:{ id } });
    s.assertOwnership(actor,resource.userId);
    return write ? runtime.cart.update({ where:{ id },data:{ revision:{ increment:1 } } }) : resource;
  }
  await expect(protectedHandler(false)).rejects.toMatchObject({ status:404 });
  await expect(protectedHandler(true)).rejects.toMatchObject({ status:404 });
  expect((await runtime.cart.findUniqueOrThrow({ where:{ id } })).revision).toBe(0);
  await owner.query('DELETE FROM commerce."Cart" WHERE id=$1',[id]);
});
it('ordinary first access creates a CUSTOMER profile using restricted columns', async () => {
  const id = '7eb42b00-73aa-4111-8000-000000000010';
  await owner.query('INSERT INTO auth.users(id) VALUES ($1)', [id]);
  expect(await serviceFor(id).requireActor()).toEqual({ userId:id, role: 'CUSTOMER' });
});
it('runtime cannot elevate role or access auth credentials', async () => {
  await expect(runtime.$executeRaw`UPDATE commerce."Profile" SET role='ADMIN' WHERE id=${testActors[0].id}::uuid`).rejects.toThrow();
  await expect(runtime.$queryRaw`SELECT * FROM auth.users`).rejects.toThrow();
  await expect(runtime.$executeRaw`CREATE TABLE commerce.forbidden(id int)`).rejects.toThrow();
  await expect(runtime.$executeRaw`INSERT INTO commerce."Profile"(id,role,"updatedAt") VALUES (${testActors[0].id}::uuid,'ADMIN',NOW()) ON CONFLICT DO NOTHING`).rejects.toThrow();
});
it('runtime has read-only access to seeded categories, collections and memberships',async () => {
  const rows=await runtime.$queryRaw<{ name:string; readable:boolean; insertable:boolean; updatable:boolean; deletable:boolean }[]>`
    SELECT name,has_table_privilege(current_user,'commerce.'||quote_ident(name),'SELECT') AS readable,
      has_table_privilege(current_user,'commerce.'||quote_ident(name),'INSERT') AS insertable,
      has_table_privilege(current_user,'commerce.'||quote_ident(name),'UPDATE') AS updatable,
      has_table_privilege(current_user,'commerce.'||quote_ident(name),'DELETE') AS deletable
    FROM unnest(ARRAY['Category','Collection','ProductCollection']) AS name`;
  expect(rows).toHaveLength(3);
  expect(rows.every(row => row.readable && !row.insertable && !row.updatable && !row.deletable)).toBe(true);
});
it.each(['anon','authenticated'])('browser database role %s cannot query commerce', async (role) => {
  await owner.query('BEGIN');
  try { await owner.query(`SET LOCAL ROLE ${role}`); await expect(owner.query('SELECT * FROM commerce."Order"')).rejects.toMatchObject({ code: '42501' }); }
  finally { await owner.query('ROLLBACK'); }
});
it('atomically enforces checkout quota across concurrent requests and process clients', async () => {
  const s = serviceFor(testActors[1].id); const actor = await s.requireActor();
  const now = new Date('2026-10-14T10:00:15Z');
  const results = await Promise.all(Array.from({ length: 20 }, () => consumeCheckoutRequest(runtime,actor,now,10)));
  expect(results.filter(r => r.allowed)).toHaveLength(10);
  expect(results.filter(r => !r.allowed).every(r => r.retryAfter === 45)).toBe(true);
  const alternate = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.TEST_APP_DATABASE_URL! }) });
  try { expect((await consumeCheckoutRequest(alternate,actor,now,10)).allowed).toBe(false); }
  finally { await alternate.$disconnect(); }
  expect((await consumeCheckoutRequest(runtime,actor,new Date('2026-10-14T10:01:00Z'),10)).allowed).toBe(true);
});
it('fails closed when the database is unavailable', async () => {
  const unavailable = new PrismaClient({ adapter: new PrismaPg({ connectionString: 'postgresql://invalid@127.0.0.1:1/unavailable', connectionTimeoutMillis: 100 }) });
  try { await expect(createIdentityService(async () => ({ data: { user: { id: testActors[0].id } }, error: null }),unavailable).requireActor()).rejects.toMatchObject({ status: 503 }); }
  finally { await unavailable.$disconnect(); }
});
