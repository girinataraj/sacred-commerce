import type { PrismaClient } from '../src/generated/prisma/client';
import { catalogueSeed } from './seed-data';

export async function seedCatalogue(db: PrismaClient): Promise<void> {
  await db.$transaction(async (tx) => {
    const categories = new Map<string, string>();
    for (const [slug, name] of [
      ['ritual-essentials','Ritual Essentials'], ['natural-living','Natural Living'],
      ['home-craft','Home & Craft'], ['books-gifts','Books & Gifts'],
    ]) {
      const category = await tx.category.upsert({ where: { slug }, update: {}, create: { slug, name } });
      categories.set(slug, category.id);
    }
    const collection = await tx.collection.upsert({ where: { slug: 'navratri-2026' }, update: {}, create: { slug: 'navratri-2026', title: 'Navratri 2026' } });
    let seasonalPosition = 0;
    for (const [index, item] of catalogueSeed.entries()) {
      const { seasonal, categorySlug, ...data } = item;
      const sku = `SC-${String(index + 1).padStart(3, '0')}`;
      const existing = await tx.product.findUnique({ where: { sku } });
      const product = existing ?? await tx.product.create({ data: {
        ...data, sku, categoryId: categories.get(categorySlug)!, featured: [0,5,6,10].includes(index),
        imagePath: '/products/demo-placeholder.svg', imageAlt: `Original neutral demo illustration for ${item.name}; not a product photograph`,
      } });
      if (!existing && item.stock > 0) {
        await tx.inventoryMovement.create({ data: { productId: product.id, delta: item.stock, balanceAfter: item.stock, reason: 'INITIAL_SEED' } });
      }
      if (seasonal) {
        await tx.productCollection.upsert({ where: { productId_collectionId: { productId: product.id, collectionId: collection.id } }, update: {}, create: {
          productId: product.id, collectionId: collection.id, position: seasonalPosition, featured: [0,5,6,10].includes(index),
        } });
        seasonalPosition++;
      }
    }
  }, { timeout: 15000 });
}
