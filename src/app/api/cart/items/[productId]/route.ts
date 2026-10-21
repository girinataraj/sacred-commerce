import type { NextRequest } from 'next/server';
import { createCartHandlers } from '../../../../../features/cart/http';
export const runtime='nodejs';
const handlers=createCartHandlers();
type Context={params:Promise<{productId:string}>};
export async function PATCH(request:NextRequest,context:Context) {return handlers.set(request,(await context.params).productId);}
export async function DELETE(request:NextRequest,context:Context) {return handlers.remove(request,(await context.params).productId);}
