import 'server-only';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { publicSupabaseConfig } from './config';
import { privateResponse } from '../server/errors';

const boundedFetch: typeof fetch = (input, init) => fetch(input, { ...init, signal: init?.signal ? AbortSignal.any([init.signal,AbortSignal.timeout(8000)]) : AbortSignal.timeout(8000) });
function options(secure: boolean) { return { httpOnly: true, secure, sameSite: 'lax' as const, path: '/' }; }
export function createRequestSupabase(request: NextRequest, fetcher: typeof fetch = boundedFetch) {
  const { url, key } = publicSupabaseConfig();
  const pending = new Map<string, { name: string; value: string; options: CookieOptions }>();
  const responseHeaders = new Headers();
  const client = createServerClient(url, key, {
    global: { fetch: fetcher },
    cookieOptions: options(process.env.NODE_ENV === 'production' || new URL(request.url).protocol === 'https:'),
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(values, headers) {
        for (const cookie of values) { request.cookies.set(cookie.name,cookie.value); pending.set(cookie.name,cookie); }
        for (const [name,value] of Object.entries(headers)) responseHeaders.set(name,value);
      },
    },
  });
  return { client, apply(response: NextResponse) {
    privateResponse(response);
    for (const cookie of pending.values()) response.cookies.set(cookie.name,cookie.value,cookie.options);
    responseHeaders.forEach((value,name) => response.headers.set(name,value));
    return response;
  } };
}
// Server Components read cookies. The proxy performs refresh cookie writes.
export async function createServerSupabase() {
  const { url, key } = publicSupabaseConfig();
  const store = await cookies();
  return createServerClient(url,key,{ global: { fetch: boundedFetch }, cookieOptions: options(process.env.NODE_ENV === 'production'), cookies: { getAll: () => store.getAll(), setAll() {} } });
}
