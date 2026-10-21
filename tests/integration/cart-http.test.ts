import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, afterEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../src/generated/prisma/client';
import { createCartHandlers } from '../../src/features/cart/http';
import { createRequestSupabase } from '../../src/lib/supabase/server';
const db=new PrismaClient({adapter:new PrismaPg({connectionString:process.env.TEST_APP_DATABASE_URL!})});
const owner=new PrismaClient({adapter:new PrismaPg({connectionString:process.env.TEST_DATABASE_URL!})});
const ids=[randomUUID(),randomUUID()]; let productId:string;
const origin='https://demo.example.test';
beforeAll(async()=>{
  for(const id of ids) { await owner.$executeRaw`INSERT INTO auth.users(id) VALUES(${id}::uuid)`; await owner.profile.create({data:{id}}); }
  productId=(await owner.product.findUniqueOrThrow({where:{slug:'cotton-everyday-pouch'}})).id;
});
beforeEach(async()=>{
  vi.stubEnv('APP_ORIGIN',origin); vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL','https://synthetic.supabase.co'); vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY','sb_publishable_synthetic-test-only');
  await owner.cartItem.deleteMany({where:{cart:{userId:{in:ids}}}}); await owner.cart.deleteMany({where:{userId:{in:ids}}});
});
afterEach(()=>vi.unstubAllEnvs());
afterAll(async()=>{
  await owner.cartItem.deleteMany({where:{cart:{userId:{in:ids}}}}); await owner.cart.deleteMany({where:{userId:{in:ids}}}); await owner.profile.deleteMany({where:{id:{in:ids}}});
  for(const id of ids) await owner.$executeRaw`DELETE FROM auth.users WHERE id=${id}::uuid`;
  await db.$disconnect(); await owner.$disconnect();
});
// Inject only the unavailable hosted provider boundary. The actual SSR client,
// verified identity, HTTP validation, Prisma services and PostgreSQL stay real.
function handlers(id:string|null=ids[0],database=()=>db) {
  const fetcher:typeof fetch=async()=>id?Response.json({id,aud:'authenticated',role:'authenticated',app_metadata:{},user_metadata:{role:'ADMIN'},created_at:'2026-10-15T00:00:00Z'}):Response.json({message:'Invalid token'},{status:401});
  return createCartHandlers(request=>{
    const context=createRequestSupabase(request,fetcher);
    // Explicitly injected verifier result, never an application env/auth bypass.
    context.client.auth.getUser=async()=>id?{data:{user:{id} as never},error:null}:{data:{user:null},error:{status:401} as never};
    return context;
  },database);
}
function request(method='GET',body?:unknown,headers:Record<string,string>={}) {
  return new NextRequest(`${origin}/api/cart`,{method,headers:{origin,'content-type':'application/json',...headers},...(body===undefined?{}:{body:typeof body==='string'?body:JSON.stringify(body)})});
}
it('serves private persisted carts across independent verified requests with standard envelopes',async()=>{
  const h=handlers(); let response=await h.get(request()); expect(response.status).toBe(200); expect(response.headers.get('Cache-Control')).toBe('private, no-store'); expect(response.headers.get('Vary')).toContain('Cookie');
  const empty=await response.json(); expect(empty.requestId).toMatch(/^[\da-f-]{36}$/); expect(empty.data.items).toEqual([]);
  response=await h.add(request('POST',{productId,quantity:3,expectedRevision:0})); expect(response.status).toBe(200);
  expect((await (await handlers().get(request())).json()).data).toMatchObject({revision:1,totalPaise:104700});
  response=await h.set(request('PATCH',{quantity:2,expectedRevision:1}),productId); expect(response.status).toBe(200); expect((await response.json()).data.totalPaise).toBe(69800);
  expect((await h.remove(request('DELETE',{expectedRevision:2}),productId)).status).toBe(200);
  expect((await h.clear(request('DELETE',{expectedRevision:3}))).status).toBe(200);
});
it('rejects anonymous reads and every mutation before commerce changes',async()=>{
  const h=handlers(null);
  for(const response of [await h.get(request()),await h.add(request('POST',{productId,quantity:1,expectedRevision:0})),await h.set(request('PATCH',{quantity:1,expectedRevision:0}),productId),await h.remove(request('DELETE',{expectedRevision:0}),productId),await h.clear(request('DELETE',{expectedRevision:0}))]) {expect(response.status).toBe(401);expect(response.headers.get('Cache-Control')).toBe('private, no-store');}
  expect(await db.cart.count({where:{userId:{in:ids}}})).toBe(0);
});
it('never selects another customer cart from URL, body or spoofed headers',async()=>{
  await handlers(ids[1]).add(request('POST',{productId,quantity:2,expectedRevision:0}));
  const h=handlers();
  expect((await h.add(request('POST',{productId,quantity:1,expectedRevision:0,userId:ids[1]}))).status).toBe(422);
  const own=await h.get(new NextRequest(`${origin}/api/cart?userId=${ids[1]}`,{headers:{'x-user-id':ids[1],'x-role':'ADMIN'}}));
  expect(own.status).toBe(400);
  expect((await h.set(request('PATCH',{quantity:1,expectedRevision:0}),productId)).status).toBe(404);
  expect((await (await handlers(ids[1]).get(request())).json()).data).toMatchObject({revision:1,totalPaise:69800});
});
it.each([{userId:'bad'},{role:'ADMIN'},{actor:{userId:'bad'}},{cartId:'bad'},{unitPricePaise:1},{quantity:'2'}])('rejects mass assignment or coercion %j',async extra=>{
  const response=await handlers().add(request('POST',{productId,quantity:1,expectedRevision:0,...extra})); expect(response.status).toBe(422); expect((await response.json()).error.code).toBe('VALIDATION_FAILED');
  expect(await db.cart.count({where:{userId:ids[0]}})).toBe(0);
});
it('guards every mutation against cross-origin and cross-site before identity/config use',async()=>{
  const h=handlers();
  const headers:Record<string,string>[]=[{origin:'https://evil.test'},{origin:'null'},{'sec-fetch-site':'cross-site'}];
  for(const header of headers) {
    const req=()=>request('DELETE',{expectedRevision:0},header);
    expect((await h.add(req())).status).toBe(403); expect((await h.set(req(),productId)).status).toBe(403); expect((await h.remove(req(),productId)).status).toBe(403); expect((await h.clear(req())).status).toBe(403);
  }
});
it('rejects malformed, oversized, wrong-content-type, unknown fields and malformed path IDs',async()=>{
  const h=handlers();
  expect((await h.add(request('POST','{'))).status).toBe(400);
  expect((await h.add(request('POST',{}, {'content-type':'text/plain'}))).status).toBe(415);
  expect((await h.add(request('POST',' '.repeat(32769)))).status).toBe(413);
  expect((await h.add(request('POST',{}, {'content-length':'32769'}))).status).toBe(413);
  expect((await h.set(request('PATCH',{quantity:1,expectedRevision:0,productId}),productId)).status).toBe(422);
  expect((await h.remove(request('DELETE',{expectedRevision:0}),'not-a-uuid')).status).toBe(400);
  expect((await h.clear(request('DELETE',{expectedRevision:0,role:'ADMIN'}))).status).toBe(422);
});
it('returns a recoverable409 revision conflict with no overwrite',async()=>{
  const h=handlers(); await h.add(request('POST',{productId,quantity:1,expectedRevision:0}));
  const response=await h.set(request('PATCH',{quantity:2,expectedRevision:0}),productId);
  expect(response.status).toBe(409); expect((await response.json()).error.code).toBe('CART_REVISION_CONFLICT');
  expect((await (await h.get(request())).json()).data).toMatchObject({revision:1,totalPaise:34900});
});
it('returns sanitized private503 rather than false success when the runtime DB is unavailable',async()=>{
  const h=handlers(ids[0],()=>{throw new Error('private postgres credential must never escape');});
  const response=await h.add(request('POST',{productId,quantity:1,expectedRevision:0}));
  expect(response.status).toBe(503); expect(response.headers.get('Cache-Control')).toBe('private, no-store'); const body=await response.json(); expect(body).not.toHaveProperty('data'); expect(JSON.stringify(body)).not.toMatch(/credential|postgres|stack/);
});
it('cart context from a previously displayed account cannot mutate the current account even at the same revision',async()=>{
  const a=await (await handlers(ids[0]).add(request('POST',{productId,quantity:1,expectedRevision:0}))).json();
  await handlers(ids[1]).add(request('POST',{productId,quantity:2,expectedRevision:0}));
  const response=await handlers(ids[1]).clear(request('DELETE',{expectedRevision:1},{'X-Cart-Context':a.data.id}));
  expect(response.status).toBe(409);expect((await response.json()).error.code).toBe('CART_CONTEXT_CHANGED');
  expect((await (await handlers(ids[1]).get(request())).json()).data).toMatchObject({revision:1,totalPaise:69800});
});
