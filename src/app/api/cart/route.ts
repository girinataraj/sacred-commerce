import type { NextRequest } from 'next/server';
import { createCartHandlers } from '../../../features/cart/http';
export const runtime='nodejs';
const handlers=createCartHandlers();
export async function GET(request:NextRequest) {return handlers.get(request);}
export async function DELETE(request:NextRequest) {return handlers.clear(request);}
