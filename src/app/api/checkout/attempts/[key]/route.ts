import type { NextRequest } from 'next/server';
import { createCheckoutHandlers } from '../../../../../features/checkout/http';
export const runtime='nodejs';
const handlers=createCheckoutHandlers();
export async function GET(request:NextRequest,context:{params:Promise<{key:string}>}){return handlers.attempt(request,(await context.params).key);}
