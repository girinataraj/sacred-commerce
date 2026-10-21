import { afterAll, describe, expect, it } from 'vitest';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../src/generated/prisma/client';
import { seedCatalogue } from '../../prisma/seed-catalogue';
import { Client } from 'pg';
import { randomUUID } from 'node:crypto';

const url = process.env.TEST_DATABASE_URL;
if (!url) throw new Error('Use the isolated integration runner.');
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url, max: 2 }) });
afterAll(async () => { await db.$disconnect(); });

describe('safe repeatable original catalogue seeding', () => {
  it('persists the twenty original records and thirteen collection memberships', async () => {
    await seedCatalogue(db);
    expect(await db.product.count({ where: { sku: { startsWith: 'SC-' } } })).toBe(20);
    expect(await db.productCollection.count()).toBe(13);
    expect(await db.productCollection.count({ where: { featured: true } })).toBe(4);
    expect(await db.category.count({ where: { slug: { in: ['ritual-essentials', 'natural-living', 'home-craft', 'books-gifts'] } } })).toBe(4);
  });
  it('reruns without replacing changed stock, current prices or audit history', async () => {
    await seedCatalogue(db);
    const product = await db.product.findUniqueOrThrow({ where: { slug: 'cotton-everyday-pouch' } });
    try {
    await db.product.update({ where: { id: product.id }, data: { stock: 7, pricePaise: 35900, version: { increment: 1 } } });
    const movementsBefore = await db.inventoryMovement.count();
    const ownerId = randomUUID();
    const authFixture = new Client({ connectionString: url });
    await authFixture.connect();
    await authFixture.query('INSERT INTO auth.users (id) VALUES ($1)', [ownerId]);
    await authFixture.end();
    const owner = await db.profile.create({ data: { id: ownerId } });
    const cart = await db.cart.create({ data: { userId: owner.id } });
    const order = await db.order.create({ data: {
      reference: `SEED-${randomUUID()}`, userId: owner.id, cartId: cart.id,
      sourceCartRevision: 0, idempotencyKey: randomUUID(), requestHash: 'synthetic-fixture',
      status: 'PAYMENT_FAILED', subtotalPaise: 34900, totalPaise: 34900, addressSnapshot: { synthetic: true },
      items: { create: { productId: product.id, skuSnapshot: product.sku, nameSnapshot: product.name, unitPricePaise: 34900, quantity: 1, lineTotalPaise: 34900 } },
      payment: { create: { outcome: 'DECLINED', reasonCode: 'SIMULATED_DECLINE', amountPaise: 34900 } },
    } });
    const audit = await db.auditEvent.create({ data: { actorId: owner.id, entityId: order.id, action: 'TEST_FIXTURE', safeChange: { synthetic: true } } });
    await seedCatalogue(db);
    expect(await db.product.findUnique({ where: { id: product.id } })).toMatchObject({ stock: 7, pricePaise: 35900, version: 1 });
    expect(await db.product.count({ where: { sku: { startsWith: 'SC-' } } })).toBe(20);
    expect(await db.inventoryMovement.count()).toBe(movementsBefore);
    expect(await db.order.findUnique({ where: { id: order.id } })).toMatchObject({ status: 'PAYMENT_FAILED', totalPaise: 34900 });
    expect(await db.orderItem.findFirst({ where: { orderId: order.id } })).toMatchObject({ unitPricePaise: 34900, quantity: 1 });
    expect(await db.paymentAttempt.findUnique({ where: { orderId: order.id } })).toMatchObject({ outcome: 'DECLINED', amountPaise: 34900 });
    expect(await db.auditEvent.findUnique({ where: { id: audit.id } })).not.toBeNull();
    } finally {
      // Seed replay deliberately preserves edits. Restore this test's edit so
      // later suites see their original fixture regardless of file ordering.
      await db.product.update({where:{id:product.id},data:{stock:product.stock,pricePaise:product.pricePaise,version:product.version}});
    }
  });
});
