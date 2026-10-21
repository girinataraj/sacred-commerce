import {NextRequest} from 'next/server';
import {createAdminHandlers} from '../../../../../../features/admin/http';
export const runtime='nodejs';
export async function POST(request:NextRequest,{params}:{params:Promise<{id:string}>}){return createAdminHandlers().inventory(request,(await params).id);}
