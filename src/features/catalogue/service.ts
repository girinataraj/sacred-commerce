import 'server-only';
import type { Prisma, PrismaClient } from '../../generated/prisma/client';
import { getDb } from '../../lib/server/db';
import { parseCatalogueQuery, type CatalogueQuery } from './schemas';
import type { CategoryDTO, FilterMetadata, ProductDTO, ProductPage } from './types';

const include = { category:true, collections:{ where:{ collection:{ active:true } }, select:{ collection:{ select:{ slug:true } } } } } as const;
type RecordWithCategory = Prisma.ProductGetPayload<{ include:typeof include }>;
export class CatalogueNotFound extends Error { constructor() { super('This product or category is unavailable.'); } }
function hydrate(product: RecordWithCategory): ProductDTO {
  const reference = product.compareAtPricePaise !== null && product.compareAtPricePaise > product.pricePaise ? product.compareAtPricePaise : null;
  const savings = reference === null ? null : reference-product.pricePaise;
  return {
    id:product.id, slug:product.slug, name:product.name, description:product.description,
    category:{ id:product.category.id, slug:product.category.slug, name:product.category.name },
    pricePaise:product.pricePaise, compareAtPricePaise:reference, stock:product.stock, version:product.version,
    active:product.active, featured:product.featured, imagePath:product.imagePath, imageAlt:product.imageAlt,
    material:product.material, dimensions:product.dimensions, care:product.care, includedContents:product.includedContents,
    occasionTags:product.occasionTags, intentTags:product.intentTags,
    collectionSlugs:product.collections.map(member=>member.collection.slug), savingsPaise:savings,
    savingsPercent:savings === null || reference === null ? null : Math.floor(savings*100/reference),
    availability:product.stock===0 ? 'Out of stock' : product.stock<=3 ? `Only ${product.stock} available` : 'In stock',
  };
}
// Escape LIKE wildcards so search is literal substring matching, not a pattern language.
const literal = (value:string) => value.replace(/[\\%_]/g,'\\$&');
export async function listProducts(query: CatalogueQuery, suppliedDb?: PrismaClient): Promise<ProductPage> {
  // Services validate too; type annotations never authorize untrusted runtime input.
  const valid = parseCatalogueQuery(new URLSearchParams(Object.entries(query).filter(([,value])=>value!==undefined).map(([key,value])=>[key,String(value)])));
  const db = suppliedDb ?? getDb();
  const where: Prisma.ProductWhereInput = {
    active:true,
    ...(valid.q ? { OR:[{name:{contains:literal(valid.q),mode:'insensitive'}},{description:{contains:literal(valid.q),mode:'insensitive'}}] } : {}),
    ...(valid.category ? {category:{slug:valid.category}} : {}),
    ...(valid.collection ? {collections:{some:{collection:{slug:valid.collection,active:true}}}} : {}),
    ...(valid.occasion ? {occasionTags:{has:valid.occasion}} : {}),
    ...(valid.intent ? {intentTags:{has:valid.intent}} : {}),
    ...(valid.minPricePaise!==undefined || valid.maxPricePaise!==undefined ? {pricePaise:{gte:valid.minPricePaise,lte:valid.maxPricePaise}} : {}),
    ...(valid.inStock ? {stock:{gt:0}} : {}),
    ...(valid.onOffer ? {compareAtPricePaise:{not:null,gt:db.product.fields.pricePaise}} : {}),
  };
  if(valid.collection && valid.sort==='featured') {
    const [total,members]=await db.$transaction([
      db.product.count({where}),
      db.productCollection.findMany({where:{collection:{slug:valid.collection,active:true},product:where},include:{product:{include}},orderBy:[{featured:'desc'},{position:'asc'},{productId:'asc'}],take:valid.pageSize,skip:(valid.page-1)*valid.pageSize}),
    ],{isolationLevel:'RepeatableRead'});
    return {items:members.map(member=>hydrate(member.product)),total,page:valid.page,pageSize:valid.pageSize,pageCount:Math.ceil(total/valid.pageSize)};
  }
  const orderBy: Prisma.ProductOrderByWithRelationInput[] = valid.sort==='price_asc' ? [{pricePaise:'asc'},{id:'asc'}] : valid.sort==='price_desc' ? [{pricePaise:'desc'},{id:'asc'}] : valid.sort==='name_asc' ? [{name:'asc'},{id:'asc'}] : [{featured:'desc'},{name:'asc'},{id:'asc'}];
  const [total,records] = await db.$transaction([
    db.product.count({where}),
    db.product.findMany({where,include,orderBy,take:valid.pageSize,skip:(valid.page-1)*valid.pageSize}),
  ], {isolationLevel:'RepeatableRead'});
  return {items:records.map(hydrate),total,page:valid.page,pageSize:valid.pageSize,pageCount:Math.ceil(total/valid.pageSize)};
}
export async function getProduct(slug:string, suppliedDb?:PrismaClient):Promise<ProductDTO> {
  if (slug.length>120 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new CatalogueNotFound();
  const db = suppliedDb ?? getDb();
  const product = await db.product.findFirst({where:{slug,active:true},include});
  if (!product) throw new CatalogueNotFound();
  return hydrate(product);
}
export async function listCategories(suppliedDb?:PrismaClient):Promise<readonly CategoryDTO[]> {
  const db = suppliedDb ?? getDb();
  const records = await db.category.findMany({orderBy:[{name:'asc'},{id:'asc'}],include:{_count:{select:{products:{where:{active:true}}}}}});
  return records.map(category=>({id:category.id,slug:category.slug,name:category.name,productCount:category._count.products}));
}
export async function getCategory(slug:string,suppliedDb?:PrismaClient):Promise<Omit<CategoryDTO,'productCount'>> {
  const db=suppliedDb ?? getDb();
  const category=await db.category.findUnique({where:{slug},select:{id:true,slug:true,name:true}});
  if (!category) throw new CatalogueNotFound();
  return category;
}
// Minimal existence/name read before a streamed detail boundary preserves normal
// missing/inactive HTTP404 responses. Full current facts are read in the body.
export async function getProductIdentity(slug:string,suppliedDb?:PrismaClient):Promise<Pick<ProductDTO,'id'|'slug'|'name'>> {
  if(slug.length>120 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new CatalogueNotFound();
  const db=suppliedDb ?? getDb();
  const product=await db.product.findFirst({where:{slug,active:true},select:{id:true,slug:true,name:true}});
  if(!product) throw new CatalogueNotFound();
  return product;
}
export async function listFeaturedProducts(suppliedDb?:PrismaClient):Promise<readonly ProductDTO[]> {
  const db = suppliedDb ?? getDb();
  return (await db.product.findMany({where:{active:true,featured:true},include,orderBy:[{name:'asc'},{id:'asc'}],take:4})).map(hydrate);
}
export async function listCollectionFeaturedProducts(slug:string,suppliedDb?:PrismaClient):Promise<readonly ProductDTO[]> {
  const db=suppliedDb ?? getDb();
  const members=await db.productCollection.findMany({where:{collection:{slug,active:true},featured:true,product:{active:true}},include:{product:{include}},orderBy:[{position:'asc'},{productId:'asc'}],take:4});
  return members.map(member=>hydrate(member.product));
}
export async function getRelatedProducts(product:ProductDTO,suppliedDb?:PrismaClient):Promise<readonly ProductDTO[]> {
  const db = suppliedDb ?? getDb();
  return (await db.product.findMany({where:{active:true,categoryId:product.category.id,id:{not:product.id}},include,orderBy:[{name:'asc'},{id:'asc'}],take:4})).map(hydrate);
}
export async function getFilterMetadata(suppliedDb?:PrismaClient,collection?:string):Promise<FilterMetadata> {
  const db = suppliedDb ?? getDb();
  const records = await db.product.findMany({where:{active:true,...(collection ? {collections:{some:{collection:{slug:collection,active:true}}}}:{})},select:{occasionTags:true,intentTags:true}});
  return {occasions:[...new Set(records.flatMap(product=>product.occasionTags))].sort(),intents:[...new Set(records.flatMap(product=>product.intentTags))].sort()};
}
