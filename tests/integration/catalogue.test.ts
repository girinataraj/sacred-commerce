import { afterAll, expect, it } from 'vitest';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../src/generated/prisma/client';
import { parseCatalogueQuery } from '../../src/features/catalogue/schemas';
import { getProduct, getProductIdentity, getRelatedProducts, listProducts, listCategories, listFeaturedProducts, getFilterMetadata } from '../../src/features/catalogue/service';
const reader = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.TEST_APP_DATABASE_URL!, max:2 }) });
const owner = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.TEST_DATABASE_URL!, max:2 }) });
afterAll(async () => { await reader.$disconnect(); await owner.$disconnect(); });
const query = (input:Record<string,string>={}) => parseCatalogueQuery(input);
it('reads the twenty active original records and four category counts with the least-privilege runtime role',async () => {
  expect((await listProducts(query({pageSize:'24'}),reader)).total).toBe(20);
  const categories=await listCategories(reader); expect(categories).toHaveLength(4);
  expect(categories.reduce((total,category) => total+category.productCount,0)).toBe(20);
});
it('matches case-insensitive name/description searches without SQL wildcard expansion',async () => {
  const lower=await listProducts(query({q:'cotton',pageSize:'24'}),reader);
  const upper=await listProducts(query({q:'COTTON',pageSize:'24'}),reader);
  expect(lower.items.map(p=>p.id)).toEqual(upper.items.map(p=>p.id)); expect(lower.total).toBeGreaterThan(0);
  expect(lower.items.every(p=>`${p.name} ${p.description}`.toLowerCase().includes('cotton'))).toBe(true);
  expect((await listProducts(query({q:'%'}),reader)).total).toBe(0);
  expect((await listProducts(query({q:"' OR 1=1 --"}),reader)).total).toBe(0);
});
it('combines category, occasion, intent, budget, stock and valid demo-offer restrictions with AND',async () => {
  const results=await listProducts(query({category:'ritual-essentials',occasion:'navratri',intent:'home',minPricePaise:'30000',maxPricePaise:'100000',inStock:'true',onOffer:'true'}),reader);
  expect(results.total).toBe(1); expect(results.items[0]).toMatchObject({slug:'terracotta-incense-stand',pricePaise:39900,stock:15});
});
it('sorts deterministically and paginates disjoint results without inflating totals',async () => {
  const first=await listProducts(query({sort:'price_asc',pageSize:'5'}),reader);
  const second=await listProducts(query({sort:'price_asc',pageSize:'5',page:'2'}),reader);
  expect(first.total).toBe(20); expect(first.items).toHaveLength(5); expect(second.items).toHaveLength(5);
  expect(second.items.some(p=>first.items.some(previous=>previous.id===p.id))).toBe(false);
  const all=await listProducts(query({sort:'price_asc',pageSize:'24'}),reader);
  expect(all.items.map(p=>p.pricePaise)).toEqual(all.items.map(p=>p.pricePaise).sort((a,b)=>a-b));
  expect((await listProducts(query({sort:'price_desc',pageSize:'24'}),reader)).items.map(p=>p.pricePaise)).toEqual([...all.items].reverse().map(p=>p.pricePaise));
  for (let index=1;index<all.items.length;index++) if (all.items[index].pricePaise===all.items[index-1].pricePaise) expect(all.items[index].id>all.items[index-1].id).toBe(true);
  expect((await listProducts(query({page:'99'}),reader)).items).toEqual([]);
});
it('excludes inactive products from search, featured, detail, related products and counts',async () => {
  const product=await owner.product.findUniqueOrThrow({where:{slug:'forest-cotton-stole'}});
  await owner.product.update({where:{id:product.id},data:{active:false}});
  try {
    expect((await listProducts(query({q:'Forest Cotton Stole'}),reader)).total).toBe(0);
    expect((await listFeaturedProducts(reader)).some(p=>p.id===product.id)).toBe(false);
    await expect(getProduct(product.slug,reader)).rejects.toThrow('unavailable');
    await expect(getProductIdentity(product.slug,reader)).rejects.toThrow('unavailable');
    expect((await getRelatedProducts(await getProduct('neem-wood-comb',reader),reader)).some(p=>p.id===product.id)).toBe(false);
    expect((await listCategories(reader)).find(c=>c.slug==='natural-living')?.productCount).toBe(4);
  } finally { await owner.product.update({where:{id:product.id},data:{active:true}}); }
});
it('hydrates actual product attributes/version/prices, out-of-stock and derived offer facts without private fields',async () => {
  const product=await getProduct('forest-cotton-stole',reader);
  expect(await getProductIdentity(product.slug,reader)).toEqual({id:product.id,slug:product.slug,name:product.name});
  expect(product).toMatchObject({pricePaise:80000,compareAtPricePaise:100000,savingsPaise:20000,savingsPercent:20,material:'Cotton',dimensions:'180 × 60 cm'});
  expect(product).not.toHaveProperty('sku'); expect(product).not.toHaveProperty('createdAt');
  expect((await getProduct('brass-wick-spoon',reader)).stock).toBe(0);
  expect((await listProducts(query({inStock:'true'}),reader)).items.every(p=>p.stock>0)).toBe(true);
  expect(await listFeaturedProducts(reader)).toHaveLength(4);
});
it('returns actual active tag metadata and at most four active same-category related products',async () => {
  const metadata=await getFilterMetadata(reader); expect(metadata.occasions).toContain('navratri'); expect(metadata.intents).toContain('reading');
  const product=await getProduct('clay-festival-lamp',reader); const related=await getRelatedProducts(product,reader);
  expect(related).toHaveLength(4); expect(related.every(p=>p.category.id===product.category.id && p.id!==product.id && p.active)).toBe(true);
  await expect(getProduct('missing-product',reader)).rejects.toThrow('unavailable');
});
it('reads current stock and prices on each request without mutating inventory',async () => {
  const before=await owner.product.findUniqueOrThrow({where:{slug:'neem-wood-comb'}});
  await owner.product.update({where:{id:before.id},data:{stock:3,pricePaise:30900,version:{increment:1}}});
  try { expect(await getProduct(before.slug,reader)).toMatchObject({stock:3,pricePaise:30900,version:before.version+1}); }
  finally { await owner.product.update({where:{id:before.id},data:{stock:before.stock,pricePaise:before.pricePaise,version:before.version}}); }
});
