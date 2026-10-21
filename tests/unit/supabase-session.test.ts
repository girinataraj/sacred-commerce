import { randomBytes } from 'node:crypto';
import { afterEach, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { createRequestSupabase } from '../../src/lib/supabase/server';
const id = '7eb42b00-73aa-4111-8000-000000000001';
afterEach(() => vi.unstubAllEnvs());
function provider() {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://synthetic.supabase.co');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_synthetic-test-only');
  let expired = false;
  let unavailable = false;
  let refreshes = 0;
  const password = randomBytes(24).toString('hex');
  const user = { id, aud: 'authenticated', role: 'authenticated', email: 'customer@example.test', app_metadata: {}, user_metadata: { role: 'ADMIN' }, created_at: new Date().toISOString() };
  const token = () => ['synthetic', Buffer.from(JSON.stringify({ sub: id, exp: Math.floor(Date.now()/1000) + 3600 })).toString('base64url'), randomBytes(24).toString('hex')].join('.');
  const fakeFetch: typeof fetch = async (input, init) => {
    if (unavailable) return Response.json({ message: 'provider unavailable' },{ status: 503 });
    const url = String(input);
    if (url.includes('/token')) {
      const body = JSON.parse(String(init?.body));
      if (url.includes('grant_type=password') && body.password !== password) return Response.json({ code: 'invalid_credentials', message: 'Invalid login credentials' },{ status: 400 });
      if (url.includes('grant_type=refresh_token')) { refreshes++; expired=false; }
      return Response.json({ user, access_token: token(), refresh_token: randomBytes(24).toString('hex'), token_type: 'bearer', expires_in: expired ? -60 : 3600 });
    }
    if (url.includes('/logout')) return new Response(null,{ status: 204 });
    if (url.endsWith('/user')) return Response.json(user);
    return Response.json({ message: 'unexpected endpoint' },{ status: 400 });
  };
  return { password, fakeFetch, expire: () => { expired=true; }, outage: () => { unavailable=true; }, refreshes: () => refreshes };
}
function context(fakeFetch: typeof fetch, cookie?: string) {
  return createRequestSupabase(new NextRequest('https://demo.example.test/api/auth/session', { headers: cookie ? { Cookie: cookie } : {} }), fakeFetch);
}
it('uses real SSR SDK to sign in and emit HttpOnly secure private cookies (simulated provider)', async () => {
  const p = provider(); const c = context(p.fakeFetch);
  expect((await c.client.auth.signInWithPassword({ email: 'customer@example.test', password: p.password })).error).toBeNull();
  const response = c.apply(NextResponse.json({ ok: true }));
  expect(response.cookies.getAll().length).toBeGreaterThan(0);
  expect(response.cookies.getAll().every(cookie => cookie.httpOnly && cookie.secure && cookie.sameSite === 'lax')).toBe(true);
  expect(response.headers.get('Cache-Control')).toContain('no-store');
  const cookie = response.cookies.getAll().map(c => `${c.name}=${c.value}`).join('; ');
  const second = context(p.fakeFetch,cookie);
  expect((await second.client.auth.getUser()).data.user?.id).toBe(id);
  expect((await second.client.auth.signOut({ scope: 'local' })).error).toBeNull();
  expect(second.apply(NextResponse.json({ ok: true })).cookies.getAll().every(c => c.maxAge === 0)).toBe(true);
});
it('rejects invalid credentials through real SDK (simulated provider)', async () => {
  const p=provider(); const c=context(p.fakeFetch);
  expect((await c.client.auth.signInWithPassword({ email:'customer@example.test',password:randomBytes(12).toString('hex') })).error?.status).toBe(400);
});
it('refreshes expired sessions and forwards replacement cookies/cache headers (simulated provider)', async () => {
  const p=provider(); p.expire(); const first=context(p.fakeFetch);
  await first.client.auth.signInWithPassword({ email:'customer@example.test',password:p.password });
  const cookie = first.apply(NextResponse.json({})).cookies.getAll().map(c => `${c.name}=${c.value}`).join('; ');
  const second=context(p.fakeFetch,cookie);
  expect((await second.client.auth.getUser()).data.user?.id).toBe(id);
  expect(p.refreshes()).toBe(1);
  expect(second.apply(NextResponse.json({})).headers.get('Cache-Control')).toContain('no-store');
});
it('rejects secret-key configuration before creating a client', () => {
  const p=provider(); vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY','sb_secret_forbidden');
  expect(() => context(p.fakeFetch)).toThrow();
});
