import { randomBytes } from 'node:crypto';
import { afterAll, afterEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../src/generated/prisma/client';
import { createAuthHandlers } from '../../src/lib/server/auth-handlers';
import { createRequestSupabase } from '../../src/lib/supabase/server';
import { testActors } from '../support/actors';
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.TEST_APP_DATABASE_URL! }) });
afterAll(() => db.$disconnect());
afterEach(() => { vi.unstubAllEnvs(); vi.useRealTimers(); });
function setup() {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL','https://synthetic.supabase.co');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY','sb_publishable_synthetic-test-only');
  vi.stubEnv('APP_ORIGIN','https://demo.example.test');
  vi.stubEnv('AUTH_THROTTLE_SECRET',randomBytes(32).toString('hex'));
  const password=randomBytes(24).toString('hex');
  const tokens = new Map<string,string>();
  let outage=false; let providerThrottled=false;
  const fakeFetch: typeof fetch = async (input,init) => {
    if (outage) return Response.json({ message:'provider unavailable' },{ status:503 });
    if (providerThrottled) return Response.json({ message:'provider quota' },{ status:429 });
    const url = String(input);
    if (url.includes('/token')) {
      const body=JSON.parse(String(init?.body));
      if (body.password!==password) return Response.json({ code:'invalid_credentials',message:'Bad credentials' },{ status:400 });
      const id=body.email==='admin@example.test' ? testActors[2].id : testActors[0].id;
      const user={ id,aud:'authenticated',role:'authenticated',email:body.email,app_metadata:{},user_metadata:{ role:'ADMIN' },created_at:new Date().toISOString() };
      const token=['synthetic',Buffer.from(JSON.stringify({ sub:id,exp:Math.floor(Date.now()/1000)+3600 })).toString('base64url'),randomBytes(24).toString('hex')].join('.');
      tokens.set(token,id);
      return Response.json({ user,access_token:token,refresh_token:randomBytes(24).toString('hex'),expires_in:3600,token_type:'bearer' });
    }
    if (url.includes('/logout')) return new Response(null,{ status:204 });
    const id=tokens.get(new Headers(init?.headers).get('Authorization')?.replace('Bearer ','') ?? '');
    return id ? Response.json({ id,aud:'authenticated',role:'authenticated',app_metadata:{},user_metadata:{ role:'ADMIN' },created_at:new Date().toISOString() }) : Response.json({ message:'Invalid token' },{ status:401 });
  };
  const handlers=createAuthHandlers(r => createRequestSupabase(r,fakeFetch),() => db);
  const request=(path: string,body?: unknown,cookie?: string,origin='https://demo.example.test') => new NextRequest(`https://demo.example.test/api/auth/${path}`,{ method:body===undefined ? 'GET' : 'POST',headers:{ Origin:origin,'Content-Type':'application/json',...(cookie ? { Cookie:cookie } : {}) },...(body===undefined ? {} : { body:JSON.stringify(body) }) });
  return { password,handlers,request,outage:() => { outage=true; },providerThrottle:() => { providerThrottled=true; } };
}
it.each(['customer@example.test','admin@example.test'])('login/session/logout enforce DB roles for %s (simulated provider; real PostgreSQL)', async email => {
  const s=setup();
  const login=await s.handlers.login(s.request('login',{ email,password:s.password,next:'/products/lamp' }));
  expect(login.status).toBe(200); expect((await login.json()).data).toEqual({ next:'/products/lamp' });
  const cookie=login.cookies.getAll().map(c => `${c.name}=${c.value}`).join('; ');
  const session=await s.handlers.session(s.request('session',undefined,cookie));
  expect(session.status).toBe(200);
  expect((await session.json()).data.actor.role).toBe(email.startsWith('admin') ? 'ADMIN' : 'CUSTOMER');
  const admin=await s.handlers.adminAccess(s.request('admin-access',undefined,cookie));
  expect(admin.status).toBe(email.startsWith('admin') ? 200 : 403);
  const logout=await s.handlers.logout(s.request('logout',{},cookie));
  expect(logout.status).toBe(200); expect(logout.cookies.getAll().every(c => c.maxAge===0)).toBe(true);
});
it('rejects invalid credentials without leaking provider or request data', async () => {
  const s=setup(); const result=await s.handlers.login(s.request('login',{ email:'customer@example.test',password:randomBytes(12).toString('hex') }));
  expect(result.status).toBe(401); expect(await result.text()).not.toMatch(/Bad credentials|customer@|stack/);
});
it('rejects anonymous session and forged session cookie', async () => {
  const s=setup();
  expect((await s.handlers.session(s.request('session'))).status).toBe(401);
  expect((await s.handlers.session(s.request('session',undefined,'sb-synthetic-auth-token=forged'))).status).toBe(401);
});
it('denies role injection and cross-origin login/logout before touching identity', async () => {
  const s=setup();
  expect((await s.handlers.login(s.request('login',{ email:'customer@example.test',password:s.password,role:'ADMIN' }))).status).toBe(422);
  expect((await s.handlers.logout(s.request('logout',{},undefined,'https://evil.test'))).status).toBe(403);
});
it('returns a sanitized service failure during provider outage', async () => {
  const s=setup(); s.outage(); const result=await s.handlers.login(s.request('login',{ email:'customer@example.test',password:s.password }));
  expect(result.status).toBe(503); expect(await result.text()).not.toContain('provider unavailable');
});
it('persistent login quota returns429 with Retry-After before another Auth attempt',async () => {
  vi.useFakeTimers({ toFake:['Date'] }); vi.setSystemTime(new Date('2026-10-14T12:00:15Z'));
  const s=setup();
  for (let attempt=0; attempt<5; attempt++) expect((await s.handlers.login(s.request('login',{ email:'customer@example.test',password:randomBytes(12).toString('hex') }))).status).toBe(401);
  const result=await s.handlers.login(s.request('login',{ email:'customer@example.test',password:s.password }));
  expect(result.status).toBe(429); expect(result.headers.get('Retry-After')).toBe('45');
});
it('provider quota failures include a conservative retry hint without provider details',async () => {
  const s=setup(); s.providerThrottle();
  const result=await s.handlers.login(s.request('login',{ email:'customer@example.test',password:s.password }));
  expect(result.status).toBe(429); expect(result.headers.get('Retry-After')).toBe('60');
  expect(await result.text()).not.toContain('provider quota');
});
