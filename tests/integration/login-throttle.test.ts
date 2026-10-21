import { randomBytes } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../src/generated/prisma/client';
import { afterAll, afterEach, expect, it, vi } from 'vitest';
import { consumeLoginRequest } from '../../src/lib/server/login-throttle';
const db=new PrismaClient({ adapter:new PrismaPg({ connectionString:process.env.TEST_APP_DATABASE_URL! }) });
afterAll(() => db.$disconnect()); afterEach(() => vi.unstubAllEnvs());
it('persists a concurrency-safe login limit with no raw email/password storage',async () => {
  vi.stubEnv('AUTH_THROTTLE_SECRET',randomBytes(32).toString('hex'));
  const now=new Date('2026-10-14T11:00:00Z');
  const results=await Promise.all(Array.from({ length:10 },() => consumeLoginRequest(db,'customer-a@example.test',now)));
  expect(results.filter(result => result.allowed)).toHaveLength(5);
  const rows=await db.$queryRaw<{ keyHash:string }[]>`SELECT "keyHash" FROM commerce."LoginRequestBucket"`;
  expect(rows.length).toBeGreaterThan(0); expect(rows.every(row => /^[a-f0-9]{64}$/.test(row.keyHash))).toBe(true);
  expect((await consumeLoginRequest(db,'CUSTOMER-A@example.test',now)).allowed).toBe(false);
  expect((await consumeLoginRequest(db,'customer-a@example.test',new Date('2026-10-14T11:01:00Z'))).allowed).toBe(true);
});
it('fails closed when the server throttle secret is missing',async () => {
  vi.stubEnv('AUTH_THROTTLE_SECRET',''); await expect(consumeLoginRequest(db,'customer-a@example.test')).rejects.toMatchObject({ status:503 });
});
