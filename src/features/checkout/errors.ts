import 'server-only';
import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { errorResponse,privateResponse } from '../../lib/server/errors';
import type { QuoteDTO } from './types';
const messages={EMPTY_CART:'Your cart is empty. Add an offering before checking out.',CART_REVISION_CONFLICT:'Your cart changed. Reload it and review a new quote.',CART_CONTEXT_CHANGED:'Your sign-in changed. Reload your cart and review a new quote.',PRODUCT_UNAVAILABLE:'An offering is no longer available. Review your cart.',INSUFFICIENT_STOCK:'The requested quantity is unavailable. Review your cart.',QUOTE_STALE:'Prices or availability changed. Review a new quote before purchasing.',IDEMPOTENCY_CONFLICT:'This attempt key was already used for different details. Recover its original result before starting a new purchase.',VALIDATION_FAILED:'Check the delivery details and attempt information.',RETRY_EXHAUSTED:'Your purchase could not be confirmed because of concurrent changes. Look up or retry the same attempt key.'} as const;
export class CheckoutError extends Error {
  readonly status:number;
  constructor(public readonly code:keyof typeof messages,public readonly fieldErrors?:Record<string,string[]>,public readonly quote?:QuoteDTO){super(messages[code]);this.status=code==='VALIDATION_FAILED'?422:code==='RETRY_EXHAUSTED'?503:409;}
}
export function checkoutErrorResponse(error:unknown):NextResponse {
  if(!(error instanceof CheckoutError))return errorResponse(error);
  return privateResponse(NextResponse.json({error:{code:error.code,message:error.message,...(error.fieldErrors?{fieldErrors:error.fieldErrors}:{}),...(error.quote?{quote:error.quote}:{}),...(!['IDEMPOTENCY_CONFLICT','VALIDATION_FAILED','RETRY_EXHAUSTED'].includes(error.code)?{reviewRequired:true}:{})},requestId:randomUUID()},{status:error.status}));
}
