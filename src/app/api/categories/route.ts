import { listCategories } from '../../../features/catalogue/service';
import { publicCatalogueResponse } from '../../../features/catalogue/http';
export const dynamic='force-dynamic';
export async function GET() { return publicCatalogueResponse(()=>listCategories()); }
