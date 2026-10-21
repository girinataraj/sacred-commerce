import { afterAll,expect,it } from 'vitest';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../src/generated/prisma/client';
import { parseCatalogueQuery } from '../../src/features/catalogue/schemas';
import { getCollection,getCollectionDiscovery,getCollectionIdentity } from '../../src/features/collections/service';
import { getFilterMetadata } from '../../src/features/catalogue/service';

const reader=new PrismaClient({adapter:new PrismaPg({connectionString:process.env.TEST_APP_DATABASE_URL!,max:2})});
const owner=new PrismaClient({adapter:new PrismaPg({connectionString:process.env.TEST_DATABASE_URL!,max:2})});
afterAll(async()=>{await reader.$disconnect();await owner.$disconnect();});
const query=(values:Record<string,string>={})=>parseCatalogueQuery(values);
it('reads the actual active collection and13 members through the existing runtime role',async()=>{
  expect(await reader.product.count()).toBe(20); expect(await reader.productCollection.count()).toBe(13);
  expect(await getCollectionIdentity('navratri-2026',reader)).toMatchObject({slug:'navratri-2026',title:'Navratri 2026'});
  const result=await getCollection('navratri-2026',query({pageSize:'24'}),reader);
  expect(result.products.total).toBe(13); expect(result.products.items).toHaveLength(13);
  expect(result.products.items.some(p=>p.slug==='neem-wood-comb')).toBe(false);
});
it('uses membership featured and position for seasonal ranking rather than global product flags',async()=>{
  const collection=await owner.collection.findUniqueOrThrow({where:{slug:'navratri-2026'}});
  const product=await owner.product.findUniqueOrThrow({where:{slug:'quiet-moments-journal'}});
  const previous=await owner.productCollection.findUniqueOrThrow({where:{productId_collectionId:{productId:product.id,collectionId:collection.id}}});
  await owner.productCollection.update({where:{productId_collectionId:{productId:product.id,collectionId:collection.id}},data:{featured:true,position:1}});
  try {
    const result=await getCollection('navratri-2026',query({pageSize:'24'}),reader);
    expect(result.products.items.slice(0,5).map(p=>p.slug)).toEqual(['clay-festival-lamp','quiet-moments-journal','cotton-everyday-pouch','forest-cotton-stole','handcrafted-ceramic-bowl']);
    const lamp=await reader.product.findUniqueOrThrow({where:{slug:'clay-festival-lamp'}});
    await owner.productCollection.update({where:{productId_collectionId:{productId:product.id,collectionId:collection.id}},data:{position:0}});
    expect((await getCollection('navratri-2026',query(),reader)).products.items.slice(0,2).map(p=>p.id)).toEqual([lamp.id,product.id].sort());
    expect((await getCollectionDiscovery('navratri-2026',reader)).featured.some(p=>p.id===product.id)).toBe(true);
  } finally {await owner.productCollection.update({where:{productId_collectionId:{productId:product.id,collectionId:collection.id}},data:{featured:previous.featured,position:previous.position}});}
});
it('returns four membership-featured offers and independently specified curation counts and limits',async()=>{
  const discovery=await getCollectionDiscovery('navratri-2026',reader);
  expect(discovery.featured.map(p=>p.slug)).toEqual(['clay-festival-lamp','cotton-everyday-pouch','forest-cotton-stole','handcrafted-ceramic-bowl']);
  expect(discovery.journeys.map(j=>[j.title,j.count])).toEqual([['Ritual Essentials',5],['Gifts Under ₹1,000',8],['Home for the Season',5]]);
  const gifts=await getCollection('navratri-2026',query({intent:'gifting',maxPricePaise:'99999',pageSize:'24'}),reader);
  expect(gifts.products.items.every(p=>p.pricePaise<100000 && p.intentTags.includes('gifting') && p.collectionSlugs.includes('navratri-2026'))).toBe(true);
  expect(gifts.products.items.some(p=>p.slug==='woven-table-runner')).toBe(false);
});
it('combines scoped refinements with sorting and stable disjoint pagination',async()=>{
  const first=await getCollection('navratri-2026',query({sort:'price_asc',pageSize:'4'}),reader);
  const next=await getCollection('navratri-2026',query({sort:'price_asc',pageSize:'4',page:'2'}),reader);
  expect(first.products.total).toBe(13); expect(first.products.items.map(p=>p.pricePaise)).toEqual([12900,19900,24900,24900]);
  expect(next.products.items.some(p=>first.products.items.some(a=>a.id===p.id))).toBe(false);
  expect((await getCollection('navratri-2026',query({sort:'name_asc'}),reader)).products.items.slice(0,3).map(p=>p.name)).toEqual(['Brass Table Bell','Brass Tea-Light Holder','Brass Wick Spoon']);
  expect((await getCollection('navratri-2026',query({sort:'price_desc'}),reader)).products.items.slice(0,4).map(p=>p.pricePaise)).toEqual([149900,89900,80000,79900]);
  const filtered=await getCollection('navratri-2026',query({category:'ritual-essentials',intent:'home',occasion:'navratri',inStock:'true',onOffer:'true',minPricePaise:'30000',maxPricePaise:'100000'}),reader);
  expect(filtered.products.items.map(p=>p.slug)).toEqual(['terracotta-incense-stand']);
});
it('excludes inactive products from seasonal results, featured and journey counts',async()=>{
  const product=await owner.product.findUniqueOrThrow({where:{slug:'clay-festival-lamp'}}); await owner.product.update({where:{id:product.id},data:{active:false}});
  try {expect((await getCollection('navratri-2026',query(),reader)).products.total).toBe(12); const discovery=await getCollectionDiscovery('navratri-2026',reader); expect(discovery.featured.some(p=>p.id===product.id)).toBe(false); expect(discovery.journeys[0].count).toBe(4);}
  finally {await owner.product.update({where:{id:product.id},data:{active:true}});}
});
it('returns404 for unknown/inactive collections and honest zero results for a real empty collection',async()=>{
  await expect(getCollectionIdentity('no-such-collection',reader)).rejects.toThrow('unavailable');
  const collection=await owner.collection.create({data:{slug:'empty-seasonal-test',title:'Empty test'}});
  try {expect((await getCollection(collection.slug,query(),reader)).products.total).toBe(0); const discovery=await getCollectionDiscovery(collection.slug,reader); expect(discovery.featured).toHaveLength(0); expect(discovery.journeys.every(j=>j.count===0)).toBe(true); await owner.collection.update({where:{id:collection.id},data:{active:false}}); await expect(getCollection(collection.slug,query(),reader)).rejects.toThrow('unavailable');}
  finally {await owner.collection.delete({where:{id:collection.id}});}
});
it('retains exact selling/reference/savings and truthful zero stock without discounting selling price again',async()=>{
  const result=await getCollection('navratri-2026',query({pageSize:'24'}),reader);
  expect(result.products.items.find(p=>p.slug==='forest-cotton-stole')).toMatchObject({pricePaise:80000,compareAtPricePaise:100000,savingsPaise:20000,savingsPercent:20});
  expect(result.products.items.find(p=>p.slug==='brass-wick-spoon')).toMatchObject({stock:0,availability:'Out of stock',compareAtPricePaise:null,savingsPaise:null,savingsPercent:null});
});
it('shows seasonal facets from member metadata rather than unrelated catalogue tags',async()=>{
  expect((await getFilterMetadata(reader,'navratri-2026')).occasions).toEqual(['everyday','navratri']);
});
it('excludes exactly₹1000 from Gifts Under₹1000 without changing stored selling-price arithmetic',async()=>{
  const previous=await owner.product.findUniqueOrThrow({where:{slug:'forest-cotton-stole'}});
  await owner.product.update({where:{id:previous.id},data:{pricePaise:100000,compareAtPricePaise:null}});
  try {const discovery=await getCollectionDiscovery('navratri-2026',reader); expect(discovery.journeys[1].count).toBe(7); const current=await reader.product.findUniqueOrThrow({where:{id:previous.id}}); expect(current.pricePaise).toBe(100000);}
  finally {await owner.product.update({where:{id:previous.id},data:{pricePaise:previous.pricePaise,compareAtPricePaise:previous.compareAtPricePaise}});}
});
