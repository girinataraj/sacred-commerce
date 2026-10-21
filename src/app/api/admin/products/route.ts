import {createAdminHandlers} from '../../../../features/admin/http';
export const runtime='nodejs';
import {NextRequest} from 'next/server';
export async function GET(request:NextRequest){return createAdminHandlers().products(request);}
export async function POST(request:NextRequest){return createAdminHandlers().create(request);}
