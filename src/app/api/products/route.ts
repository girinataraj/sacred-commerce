import { parseCatalogueQuery } from '../../../features/catalogue/schemas';
import { listProducts } from '../../../features/catalogue/service';
import { publicCatalogueResponse } from '../../../features/catalogue/http';
export const dynamic='force-dynamic';
export async function GET(request:Request) { return publicCatalogueResponse(()=>listProducts(parseCatalogueQuery(new URL(request.url).searchParams))); }
