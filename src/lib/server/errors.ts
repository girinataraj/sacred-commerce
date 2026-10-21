import 'server-only';
import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';

const messages = {
  400: 'This request could not be read. Send valid JSON and try again.',
  401: 'Your session is unavailable. Please sign in again.',
  403: 'This action is not permitted.',
  404: 'This resource is unavailable.',
  413: 'This request is too large.',
  415: 'Send this request as JSON.',
  422: 'Check the information and try again.',
  429: 'Too many attempts. Please wait and try again.',
  503: 'Sign-in or data services are temporarily unavailable. Please try again.',
} as const;
export class EntryError extends Error {
  constructor(public readonly status: keyof typeof messages, public readonly kind?: 'credentials', public readonly retryAfter?: number) { super(messages[status]); }
}
export function privateResponse(response: NextResponse): NextResponse {
  response.headers.set('Cache-Control', 'private, no-store');
  response.headers.set('Vary', 'Cookie');
  return response;
}
export function errorResponse(error: unknown): NextResponse {
  const status = error instanceof EntryError ? error.status : 503;
  const codes={ 400:'BAD_REQUEST',401:'UNAUTHENTICATED',403:'FORBIDDEN',404:'NOT_FOUND',413:'PAYLOAD_TOO_LARGE',415:'UNSUPPORTED_MEDIA_TYPE',422:'VALIDATION_FAILED',429:'THROTTLED',503:'SERVICE_UNAVAILABLE' };
  const message=error instanceof EntryError && error.kind==='credentials' ? 'Sign-in details were not accepted. Check your email and password.' : messages[status];
  const response=privateResponse(NextResponse.json({ error:{ code:codes[status],message },requestId:randomUUID() },{ status }));
  if (status===429 && error instanceof EntryError && error.retryAfter) response.headers.set('Retry-After',String(error.retryAfter));
  return response;
}
export function successResponse(data: unknown): NextResponse { return privateResponse(NextResponse.json({ data,requestId:randomUUID() })); }
