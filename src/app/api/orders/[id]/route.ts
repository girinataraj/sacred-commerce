import type { NextRequest } from 'next/server';
import { createCheckoutHandlers } from '../../../../features/checkout/http';
export const runtime='nodejs';
const handlers=createCheckoutHandlers();
export async function GET(request:NextRequest,context:{params:Promise<{id:string}>}){return handlers.order(request,(await context.params).id);}
