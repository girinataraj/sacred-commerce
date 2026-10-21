import 'server-only';
import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { CatalogueQueryError } from './schemas';
import { CatalogueNotFound } from './service';
export async function publicCatalogueResponse(work:()=>Promise<unknown>):Promise<NextResponse> {
  const requestId=randomUUID();
  try { return NextResponse.json({data:await work(),requestId},{headers:{'Cache-Control':'no-store'}}); }
  catch(error) {
    const status=error instanceof CatalogueQueryError ? 400 : error instanceof CatalogueNotFound ? 404 : 503;
    return NextResponse.json({error:{code:status===400 ? 'BAD_REQUEST' : status===404 ? 'NOT_FOUND':'SERVICE_UNAVAILABLE',message:status===400 ? 'Check your search and filter values.' : status===404 ? 'This listing is unavailable.' : 'Product data is temporarily unavailable. Please try again.',...(error instanceof CatalogueQueryError ? {fieldErrors:error.fieldErrors} : {})},requestId},{status,headers:{'Cache-Control':'no-store'}});
  }
}
