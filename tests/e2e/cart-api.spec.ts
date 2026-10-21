import { expect, test } from '@playwright/test';
const origin='http://127.0.0.1:3100';
const id='7eb42b00-73aa-4111-8000-000000000001';
test('cart routes fail closed with private sanitized errors when private setup is absent',async({request})=>{
  const responses=[await request.get('/api/cart'),await request.post('/api/cart/items',{headers:{Origin:origin},data:{productId:id,quantity:1,expectedRevision:0}}),await request.patch(`/api/cart/items/${id}`,{headers:{Origin:origin},data:{quantity:1,expectedRevision:0}}),await request.delete(`/api/cart/items/${id}`,{headers:{Origin:origin},data:{expectedRevision:0}}),await request.delete('/api/cart',{headers:{Origin:origin},data:{expectedRevision:0}})];
  for(const response of responses) { expect(response.status()).toBe(503); expect(response.headers()['cache-control']).toBe('private, no-store'); const body=await response.json(); expect(body.error.code).toBe('SERVICE_UNAVAILABLE'); expect(body).not.toHaveProperty('data'); expect(JSON.stringify(body)).not.toMatch(/DATABASE_URL|postgresql|password|stack|sb_secret/); }
});
test('cart HTTP rejects cross-origin, spoofed, oversized and malformed requests before unavailable identity',async({request})=>{
  expect((await request.post('/api/cart/items',{headers:{Origin:'https://evil.test'},data:{}})).status()).toBe(403);
  expect((await request.patch(`/api/cart/items/${id}`,{headers:{Origin:origin},data:{quantity:0,expectedRevision:0}})).status()).toBe(422);
  expect((await request.post('/api/cart/items',{headers:{Origin:origin},data:{productId:id,quantity:1,expectedRevision:0,userId:id}})).status()).toBe(422);
  expect((await request.delete('/api/cart',{headers:{Origin:origin,'Content-Type':'text/plain'},data:'{}'})).status()).toBe(415);
  expect((await request.post('/api/cart/items',{headers:{Origin:origin,'Content-Type':'application/json'},data:Buffer.from('{')})).status()).toBe(400);
  expect((await request.post('/api/cart/items',{headers:{Origin:origin,'Content-Type':'application/json'},data:' '.repeat(32769)})).status()).toBe(413);
  expect((await request.delete('/api/cart/items/not-a-uuid',{headers:{Origin:origin},data:{expectedRevision:0}})).status()).toBe(400);
  expect((await request.get(`/api/cart?userId=${id}`)).status()).toBe(400);
  expect((await request.put('/api/cart',{headers:{Origin:origin},data:{expectedRevision:0}})).status()).toBe(405);
});
