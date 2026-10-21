import { test,expect,type Page } from '@playwright/test';
import { Client } from 'pg';
import { testActors } from '../support/actors';
const url=process.env.CART_FIXTURE_DATABASE_URL;
if(process.env.CART_BROWSER_TEST_OWNED!=='true'||!url||new URL(url).hostname!=='127.0.0.1'||new URL(url).pathname!=='/sacred_commerce_test')throw Error('Owned loopback fixture required');
const owner=new Client({connectionString:url});
const userId=testActors[0].id;
const address={name:'Demo Shopper',email:'shopper@example.test',phone:'9000000000',line1:'12 Demo Garden Road',city:'Coimbatore',state:'Tamil Nadu',pin:'641001',country:'IN'};
test.beforeAll(()=>owner.connect());
async function clean(){
  await owner.query('DELETE FROM commerce."InventoryMovement" WHERE "orderId" IN (SELECT id FROM commerce."Order" WHERE "userId"=$1)',[userId]);
  await owner.query('DELETE FROM commerce."PaymentAttempt" WHERE "orderId" IN (SELECT id FROM commerce."Order" WHERE "userId"=$1)',[userId]);
  await owner.query('DELETE FROM commerce."OrderItem" WHERE "orderId" IN (SELECT id FROM commerce."Order" WHERE "userId"=$1)',[userId]);
  await owner.query('DELETE FROM commerce."Order" WHERE "userId"=$1',[userId]);
  await owner.query('DELETE FROM commerce."CartItem" WHERE "cartId" IN (SELECT id FROM commerce."Cart" WHERE "userId"=$1)',[userId]);
  await owner.query('DELETE FROM commerce."Cart" WHERE "userId"=$1',[userId]);
  await owner.query('DELETE FROM commerce."RequestBucket" WHERE "userId"=$1',[userId]);
  await owner.query('DELETE FROM commerce."LoginRequestBucket"');
  await owner.query('UPDATE commerce."Product" SET stock=20 WHERE slug=\'cotton-everyday-pouch\'');
}
test.beforeEach(clean);test.afterAll(async()=>{await clean();await owner.end();});
async function login(page:Page){await page.goto('/login?next=%2Fproducts%2Fcotton-everyday-pouch');await page.getByLabel('Email',{exact:true}).fill('customer-a@example.test');await page.getByLabel('Password',{exact:true}).fill(process.env.CART_TEST_PASSWORD!);await page.getByRole('button',{name:'Sign in',exact:true}).click();await expect(page).toHaveURL(/\/products\/cotton-everyday-pouch$/);await page.getByRole('button',{name:'Add to cart',exact:true}).click();await expect(page.getByRole('link',{name:'View cart',exact:true}).first()).toBeVisible();}
async function payload(page:Page){const response=await page.request.post('/api/checkout/quote',{headers:{origin:new URL(page.url()).origin},data:{cartRevision:1,address}});expect(response.status()).toBe(200);const quote=(await response.json()).data;return {idempotencyKey:crypto.randomUUID(),cartRevision:1,quoteDigest:quote.digest,address,simulationMode:'SUCCESS'};}
test('actual Next routes commit a simulated purchase, recover a lost response, and expose only own order',async({page,browser})=>{
  await login(page);const input=await payload(page);const headers={origin:new URL(page.url()).origin};
  // Discard the first actual committed response to model lost presentation.
  expect((await page.request.post('/api/checkout',{headers,data:input})).status()).toBe(201);
  const lookup=await page.request.get(`/api/checkout/attempts/${input.idempotencyKey}`);expect(lookup.status()).toBe(200);const result=(await lookup.json()).data;expect(result).toMatchObject({order:{status:'CONFIRMED',totalPaise:34900},payment:{outcome:'SUCCEEDED'},replayed:true});
  expect((await page.request.post('/api/checkout',{headers,data:input})).status()).toBe(200);expect((await (await page.request.get(`/api/orders/${result.order.id}`)).json()).data.items[0]).toMatchObject({quantity:1,unitPricePaise:34900});expect((await (await page.request.get('/api/orders')).json()).data.total).toBe(1);
  const state=await owner.query('SELECT stock FROM commerce."Product" WHERE slug=\'cotton-everyday-pouch\'');expect(state.rows[0].stock).toBe(19);const movement=await owner.query('SELECT delta,"balanceAfter" FROM commerce."InventoryMovement" WHERE "orderId"=$1',[result.order.id]);expect(movement.rows).toEqual([{delta:-1,balanceAfter:19}]);expect((await (await page.request.get('/api/cart')).json()).data.items).toEqual([]);
  const anonymous=await browser.newContext({ignoreHTTPSErrors:true});try{expect((await anonymous.request.get(page.url().replace(/\/products\/.*/,`/api/orders/${result.order.id}`))).status()).toBe(401);}finally{await anonymous.close();}
});
test('actual Next decline remains failed and replayable with cart intact, with origin/input validation',async({page})=>{
  await login(page);const input={...await payload(page),simulationMode:'DECLINE'};const headers={origin:new URL(page.url()).origin};
  const response=await page.request.post('/api/checkout',{headers,data:input});expect(response.status()).toBe(201);expect((await response.json()).data).toMatchObject({order:{status:'PAYMENT_FAILED'},payment:{outcome:'DECLINED'}});expect((await page.request.post('/api/checkout',{headers,data:input})).status()).toBe(200);expect((await (await page.request.get('/api/cart')).json()).data.items).toHaveLength(1);
  expect((await page.request.post('/api/checkout',{headers:{origin:'https://evil.example.test'},data:input})).status()).toBe(403);expect((await page.request.post('/api/checkout/quote',{headers,data:{cartRevision:1,address:{}}})).status()).toBe(422);
  expect((await page.request.get(`/api/checkout/attempts/${crypto.randomUUID()}`)).status()).toBe(404);
  expect((await owner.query('SELECT stock FROM commerce."Product" WHERE slug=\'cotton-everyday-pouch\'')).rows[0].stock).toBe(20);
});
