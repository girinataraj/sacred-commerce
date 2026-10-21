import { collectionQuery } from '../../../../features/collections/schemas';
import { getCollection } from '../../../../features/collections/service';
import { publicCatalogueResponse } from '../../../../features/catalogue/http';
export const dynamic='force-dynamic';
export async function GET(request:Request,{params}:{params:Promise<{slug:string}>}) {
  return publicCatalogueResponse(async()=>{const {slug}=await params; return getCollection(slug,collectionQuery(slug,new URL(request.url).searchParams));});
}
