import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Client } from 'pg';

const connectionString = process.env.TEST_DATABASE_URL;
if (!connectionString) throw new Error('Use npm run test:integration for the isolated database.');
const db = new Client({ connectionString });
const customer = randomUUID();
const category = randomUUID();
const product = randomUUID();
const cart = randomUUID();

beforeAll(async () => {
  await db.connect();
  await db.query('INSERT INTO auth.users (id) VALUES ($1)', [customer]);
  await db.query('INSERT INTO commerce."Profile" (id,"updatedAt") VALUES ($1,NOW())', [customer]);
  await db.query('INSERT INTO commerce."Category" (id,slug,name,"updatedAt") VALUES ($1,$2,$3,NOW())', [category, `test-${category}`, 'Test category']);
  await db.query(`INSERT INTO commerce."Product" (id,"categoryId",sku,slug,name,description,"imagePath","imageAlt","pricePaise",stock,material,dimensions,care,"includedContents","occasionTags","intentTags","updatedAt")
    VALUES ($1,$2,$3,$3,'Fixture','Original test fixture','/products/demo-placeholder.svg','Demo illustration',34900,5,'Cotton','10 cm','Dry clean','One item',ARRAY['everyday'],ARRAY['gifting'],NOW())`, [product, category, `test-${product}`]);
  await db.query('INSERT INTO commerce."Cart" (id,"userId","updatedAt") VALUES ($1,$2,NOW())', [cart, customer]);
});
afterAll(async () => { await db.end(); });

describe('migrated PostgreSQL commerce invariants', () => {
  it('installs commerce tables in the private schema', async () => {
    const result = await db.query("SELECT COUNT(*)::int AS count FROM information_schema.tables WHERE table_schema='commerce'");
    expect(result.rows[0].count).toBe(14); // T01 core13 + T02 login security bucket.
  });
  it('rejects a profile without a Supabase Auth user', async () => {
    await expect(db.query('INSERT INTO commerce."Profile" (id,"updatedAt") VALUES ($1,NOW())', [randomUUID()])).rejects.toMatchObject({ code: '23503' });
  });
  it('rejects negative stock at the database boundary', async () => {
    try {
      await expect(db.query('UPDATE commerce."Product" SET stock=-1 WHERE id=$1', [product])).rejects.toMatchObject({ code: '23514' });
    } finally { await db.query('UPDATE commerce."Product" SET stock=5 WHERE id=$1', [product]); }
  });
  it('rejects comparison prices equal to selling price', async () => {
    try {
      await expect(db.query('UPDATE commerce."Product" SET "compareAtPricePaise"="pricePaise" WHERE id=$1', [product])).rejects.toMatchObject({ code: '23514' });
    } finally { await db.query('UPDATE commerce."Product" SET "compareAtPricePaise"=NULL WHERE id=$1', [product]); }
  });
  it('rejects SQL NULL occasion tags rather than allowing UNKNOWN check results', async () => {
    try {
      await expect(db.query('UPDATE commerce."Product" SET "occasionTags"=NULL WHERE id=$1', [product])).rejects.toMatchObject({ code: '23502' });
    } finally { await db.query('UPDATE commerce."Product" SET "occasionTags"=ARRAY[\'everyday\'] WHERE id=$1', [product]); }
  });
  it('rejects SQL NULL intent tags rather than allowing UNKNOWN check results', async () => {
    try {
      await expect(db.query('UPDATE commerce."Product" SET "intentTags"=NULL WHERE id=$1', [product])).rejects.toMatchObject({ code: '23502' });
    } finally { await db.query('UPDATE commerce."Product" SET "intentTags"=ARRAY[\'gifting\'] WHERE id=$1', [product]); }
  });
  it('rejects invalid quantity even through direct SQL', async () => {
    try {
      await expect(db.query('INSERT INTO commerce."CartItem" (id,"cartId","productId",quantity,"updatedAt") VALUES ($1,$2,$3,0,NOW())', [randomUUID(), cart, product])).rejects.toMatchObject({ code: '23514' });
    } finally { await db.query('DELETE FROM commerce."CartItem" WHERE "cartId"=$1 AND quantity=0', [cart]); }
  });
  it('allows only one line per cart/product', async () => {
    await db.query('INSERT INTO commerce."CartItem" (id,"cartId","productId",quantity,"updatedAt") VALUES ($1,$2,$3,1,NOW())', [randomUUID(), cart, product]);
    await expect(db.query('INSERT INTO commerce."CartItem" (id,"cartId","productId",quantity,"updatedAt") VALUES ($1,$2,$3,1,NOW())', [randomUUID(), cart, product])).rejects.toMatchObject({ code: '23505' });
  });
  it('allows only one cart per customer', async () => {
    await expect(db.query('INSERT INTO commerce."Cart" (id,"userId","updatedAt") VALUES ($1,$2,NOW())', [randomUUID(), customer])).rejects.toMatchObject({ code: '23505' });
  });

  async function createOrder(status: string, key: string, revision: number) {
    return db.query(`INSERT INTO commerce."Order" (id,reference,"userId","cartId","sourceCartRevision","idempotencyKey","requestHash",status,currency,"subtotalPaise","shippingPaise","taxPaise","totalPaise","addressSnapshot","updatedAt")
      VALUES ($1,$2,$3,$4,$5,$6,'test-hash',$7,'INR',34900,0,0,34900,'{}',NOW())`, [randomUUID(), `TEST-${randomUUID()}`, customer, cart, revision, key, status]);
  }
  it('enforces actor-scoped idempotency key uniqueness', async () => {
    const key = randomUUID();
    await createOrder('PAYMENT_FAILED', key, 1);
    await expect(createOrder('PAYMENT_FAILED', key, 1)).rejects.toMatchObject({ code: '23505' });
  });
  it('permits failed attempts but only one successful order per cart revision', async () => {
    await createOrder('PAYMENT_FAILED', randomUUID(), 10);
    await createOrder('PAYMENT_FAILED', randomUUID(), 10);
    await createOrder('CONFIRMED', randomUUID(), 10);
    await expect(createOrder('SHIPPED', randomUUID(), 10)).rejects.toMatchObject({ code: '23505' });
  });
  it('rejects inconsistent order totals', async () => {
    await expect(db.query(`INSERT INTO commerce."Order" (id,reference,"userId","cartId","sourceCartRevision","idempotencyKey","requestHash",status,"subtotalPaise","totalPaise","addressSnapshot","updatedAt")
      VALUES ($1,$2,$3,$4,20,$5,'test-hash','PAYMENT_FAILED',34900,1,'{}',NOW())`, [randomUUID(), `TEST-${randomUUID()}`, customer, cart, randomUUID()])).rejects.toMatchObject({ code: '23514' });
  });
});
