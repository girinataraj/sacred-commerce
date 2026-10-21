import 'server-only';
import type { PrismaClient } from '../../generated/prisma/client';
import type { CatalogueQuery } from '../catalogue/schemas';
import type { ProductDTO,ProductPage } from '../catalogue/types';
import { getDb } from '../../lib/server/db';
import { CatalogueNotFound,listProducts,listCollectionFeaturedProducts } from '../catalogue/service';
import { catalogueHref } from '../catalogue/schemas';
import { collectionQuery } from './schemas';
type CollectionIdentity=Readonly<{id:string;slug:string;title:string}>;
type Journey=Readonly<{title:string;description:string;href:string;count:number}>;
export async function getCollectionIdentity(slug:string,suppliedDb?:PrismaClient):Promise<CollectionIdentity> {
  if(slug.length>80 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new CatalogueNotFound();
  const collection=await (suppliedDb ?? getDb()).collection.findFirst({where:{slug,active:true},select:{id:true,slug:true,title:true}});
  if(!collection) throw new CatalogueNotFound();
  return collection;
}
export async function getCollection(slug:string,query:CatalogueQuery,suppliedDb?:PrismaClient):Promise<{collection:CollectionIdentity;products:ProductPage}> {
  const scoped=collectionQuery(slug,Object.fromEntries(Object.entries(query).filter(([,value])=>value!==undefined).map(([key,value])=>[key,String(value)])));
  const collection=await getCollectionIdentity(slug,suppliedDb);
  return {collection,products:await listProducts(scoped,suppliedDb)};
}
export async function getCollectionDiscovery(slug:string,suppliedDb?:PrismaClient):Promise<{featured:readonly ProductDTO[];journeys:readonly Journey[]}> {
  await getCollectionIdentity(slug,suppliedDb);
  const groups=[
    {title:'Ritual Essentials',description:'Simple objects for your seasonal setting.',filters:{category:'ritual-essentials'}},
    {title:'Gifts Under ₹1,000',description:'Thoughtful gestures, within a considered budget.',filters:{intent:'gifting',maxPricePaise:'99999'}},
    {title:'Home for the Season',description:'Texture and quiet details for shared spaces.',filters:{intent:'home'}},
  ];
  const [featured,journeys]=await Promise.all([listCollectionFeaturedProducts(slug,suppliedDb),Promise.all(groups.map(async group=>{
    const scoped=collectionQuery(slug,group.filters); const result=await listProducts({...scoped,pageSize:1},suppliedDb);
    return {title:group.title,description:group.description,count:result.total,href:catalogueHref(scoped,`/collections/${slug}`)+'#collection-products'};
  }))]);
  return {featured,journeys};
}
