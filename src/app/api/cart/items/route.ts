import type { NextRequest } from 'next/server';
import { createCartHandlers } from '../../../../features/cart/http';
export const runtime='nodejs';
const handlers=createCartHandlers();
export async function POST(request:NextRequest) {return handlers.add(request);}
