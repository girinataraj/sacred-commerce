import {NextRequest} from 'next/server';
import {createAdminHandlers} from '../../../../../features/admin/http';
export const runtime='nodejs';
export async function PATCH(request:NextRequest,{params}:{params:Promise<{id:string}>}){return createAdminHandlers().patch(request,(await params).id);}
