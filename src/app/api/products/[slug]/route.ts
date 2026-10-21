import { getProduct } from '../../../../features/catalogue/service';
import { publicCatalogueResponse } from '../../../../features/catalogue/http';
export const dynamic='force-dynamic';
export async function GET(_request:Request,{params}:{params:Promise<{slug:string}>}) { return publicCatalogueResponse(async()=>getProduct((await params).slug)); }
