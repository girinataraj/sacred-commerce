import {createAdminHandlers} from '../../../../features/admin/http';
export const runtime='nodejs';
import {NextRequest} from 'next/server';
export async function GET(request:NextRequest){return createAdminHandlers().orders(request);}
