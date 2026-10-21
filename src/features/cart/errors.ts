import 'server-only';
import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { privateResponse, errorResponse } from '../../lib/server/errors';
const messages={
  CART_REVISION_CONFLICT:'Your cart changed. Reload it before trying again.',
  CART_CONTEXT_CHANGED:'Your sign-in changed. Reload your cart before making another change.',
  INSUFFICIENT_STOCK:'The requested quantity is unavailable. Review the current stock.',
  PRODUCT_UNAVAILABLE:'This product is no longer available. You can remove it from your cart.',
  CART_LIMIT_REACHED:'Your cart can contain up to 20 different products. Remove one before adding another.',
  NOT_FOUND:'This resource is unavailable.',
  VALIDATION_FAILED:'Check the information and try again.',
} as const;
export class CartError extends Error {
  readonly status:404|409|422;
  constructor(public readonly code:keyof typeof messages,public readonly fieldErrors?:Record<string,string[]>) {
    super(messages[code]); this.status=code==='NOT_FOUND'?404:code==='VALIDATION_FAILED'?422:409;
  }
}
export function cartErrorResponse(error:unknown):NextResponse {
  if (!(error instanceof CartError)) return errorResponse(error);
  return privateResponse(NextResponse.json({error:{code:error.code,message:error.message,...(error.fieldErrors?{fieldErrors:error.fieldErrors}:{})},requestId:randomUUID()},{status:error.status}));
}
