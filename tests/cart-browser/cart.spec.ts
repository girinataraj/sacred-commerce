import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { Client } from 'pg';
import { testActors } from '../support/actors';
const url=process.env.CART_FIXTURE_DATABASE_URL;
if(process.env.CART_BROWSER_TEST_OWNED!=='true'||!url||new URL(url).hostname!=='127.0.0.1'||new URL(url).pathname!=='/sacred_commerce_test')throw Error('Owned loopback fixture required');
const owner=new Client({connectionString:url});
const path='/products/cotton-everyday-pouch';
const lines=(page:Page)=>page.getByRole('article',{name:'Cotton Everyday Pouch',exact:true});
const summary=(page:Page)=>page.getByRole('region',{name:'Order summary'});
const evidence=process.env.CART_PRODUCTION==='true'?'.local/t06-cart-regression':'.local/t05-dev-captures';
test.beforeAll(()=>owner.connect());
test.afterAll(()=>owner.end());
test.beforeEach(async()=>{
  const ids=testActors.map(a=>a.id);
  await owner.query('DELETE FROM commerce."CartItem" WHERE "cartId" IN (SELECT id FROM commerce."Cart" WHERE "userId"=ANY($1::uuid[]))',[ids]);
  await owner.query('DELETE FROM commerce."Cart" WHERE "userId"=ANY($1::uuid[])',[ids]);
  await owner.query('DELETE FROM commerce."LoginRequestBucket"');
  await owner.query('UPDATE commerce."Product" SET active=true,stock=20,"pricePaise"=34900 WHERE slug=\'cotton-everyday-pouch\'');
});
async function login(page:Page,next='/products',customer='a') {
  await page.goto(`/login?next=${encodeURIComponent(next)}`);
  await page.getByLabel('Email',{exact:true}).fill(`customer-${customer}@example.test`);
  await page.getByLabel('Password',{exact:true}).fill(process.env.CART_TEST_PASSWORD!);
  await page.getByRole('button',{name:'Sign in',exact:true}).click();
  await expect(page).toHaveURL(new RegExp(next.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'$'));
}
async function add(page:Page,quantity=1,slug='cotton-everyday-pouch') {
  await page.goto(`/products/${slug}`);
  await page.getByLabel('Quantity',{exact:true}).fill(String(quantity));
  await page.getByRole('button',{name:'Add to cart',exact:true}).click();
  await expect(page.getByRole('link',{name:'View cart',exact:true}).first()).toBeVisible();
}
async function openPopulated(page:Page,quantity=1) {await login(page);await add(page,quantity);await page.getByRole('link',{name:'View cart',exact:true}).first().click();await expect(lines(page)).toBeVisible();}
test('local simulated provider uses real login/session/logout routes and database CUSTOMER role',async({page})=>{
  await login(page);const response=await page.request.get('/api/auth/session');expect(response.status()).toBe(200);expect((await response.json()).data.actor).toEqual({userId:testActors[0].id,role:'CUSTOMER'});
  await page.locator('.desktop-account').getByRole('button',{name:'Sign out',exact:true}).click();await expect(page).toHaveURL(/\/login$/);expect((await page.request.get('/api/auth/session')).status()).toBe(401);
});
test('TC03 — Add a product to the cart → Product appears in the cart',async({page})=>{
  await openPopulated(page);await expect(lines(page).getByRole('link',{name:'Cotton Everyday Pouch',exact:true})).toBeVisible();await expect(summary(page).getByText('₹349',{exact:true}).last()).toBeVisible();
  expect((await (await page.request.get('/api/cart')).json()).data.items[0].quantity).toBe(1);
});
test('TC04 — Increase the quantity → Total price updates correctly',async({page})=>{
  await openPopulated(page);const line=lines(page);await line.getByRole('button',{name:'Increase quantity for Cotton Everyday Pouch'}).click();await line.getByRole('button',{name:'Update quantity'}).click();await expect(summary(page).getByText('₹698',{exact:true}).last()).toBeVisible();
  await page.reload();await expect(line.getByRole('spinbutton',{name:'Quantity for Cotton Everyday Pouch',exact:true})).toHaveValue('2');expect((await (await page.request.get('/api/cart')).json()).data.totalPaise).toBe(69800);
});
test('TC05 — Enter an invalid quantity → Invalid quantity is rejected',async({page})=>{
  await openPopulated(page);const line=lines(page);const input=line.getByRole('spinbutton',{name:'Quantity for Cotton Everyday Pouch',exact:true});
  for(const value of ['0','-1','1.5','11']) {await input.fill(value);await line.getByRole('button',{name:'Update quantity'}).click();await expect(line.getByText(/Choose a whole quantity/)).toBeVisible();await expect(input).toHaveValue('1');await expect(input).toBeFocused();await expect(summary(page).getByText('₹349',{exact:true}).last()).toBeVisible();}
  const cart=(await (await page.request.get('/api/cart')).json()).data;expect(cart.revision).toBe(1);expect(cart.items[0].quantity).toBe(1);
});
test('guest keeps a safe quantity draft through login, returns to product and must explicitly add',async({page})=>{
  await page.goto(path);await page.getByLabel('Quantity',{exact:true}).fill('3');await page.getByRole('link',{name:'Sign in to add to cart',exact:true}).first().click();
  await page.getByLabel('Email',{exact:true}).fill('customer-a@example.test');await page.getByLabel('Password',{exact:true}).fill(process.env.CART_TEST_PASSWORD!);await page.getByRole('button',{name:'Sign in',exact:true}).click();
  await expect(page).toHaveURL(new RegExp(path+'$'));await expect(page.getByLabel('Quantity',{exact:true})).toHaveValue('3');
  expect((await (await page.request.get('/api/cart')).json()).data.items).toEqual([]);
  await page.getByRole('button',{name:'Add to cart',exact:true}).click();await page.getByRole('link',{name:'View cart',exact:true}).first().click();await expect(summary(page).getByText('₹1,047',{exact:true}).last()).toBeVisible();
});
test('cart persists after real local sign-out/sign-in while separate customer sees their own empty cart',async({page,browser})=>{
  await openPopulated(page,3);await page.reload();await expect(summary(page).getByText('₹1,047',{exact:true}).last()).toBeVisible();
  await page.locator('.desktop-account').getByRole('button',{name:'Sign out',exact:true}).click();await expect(page).toHaveURL(/\/login$/);await login(page,'/cart');await expect(lines(page)).toBeVisible();await expect(summary(page).getByText('₹1,047',{exact:true}).last()).toBeVisible();
  const context=await browser.newContext({ignoreHTTPSErrors:true});const second=await context.newPage();try{await login(second,'/cart','b');await expect(second.getByRole('heading',{name:'Your cart is waiting for something thoughtful'})).toBeVisible();expect((await (await second.request.get('/api/cart')).json()).data.items).toEqual([]);}finally{await context.close();}
});
test('decrease, absolute update, remove and clear use persisted server results and useful empty recovery',async({page})=>{
  await openPopulated(page,3);const line=lines(page);await line.getByRole('button',{name:'Decrease quantity for Cotton Everyday Pouch'}).click();await line.getByRole('button',{name:'Update quantity'}).click();await expect(summary(page).getByText('₹698',{exact:true}).last()).toBeVisible();
  await line.getByRole('spinbutton',{name:'Quantity for Cotton Everyday Pouch',exact:true}).fill('4');await line.getByRole('button',{name:'Update quantity'}).click();await expect(summary(page).getByText('₹1,396',{exact:true}).last()).toBeVisible();
  await line.getByRole('button',{name:'Remove Cotton Everyday Pouch',exact:true}).click();await expect(page.getByRole('heading',{name:'Your cart is waiting for something thoughtful'})).toBeVisible();
  await add(page);await page.goto('/cart');await page.getByRole('button',{name:'Clear cart',exact:true}).click();await expect(page.getByRole('heading',{name:'Your cart is waiting for something thoughtful'})).toBeVisible();await expect(page.getByRole('link',{name:'Explore Navratri'})).toBeVisible();
});
test('real seeded ₹349×3 + ₹199×2 gives ₹1,445 and two seasonal ₹800 stoles give ₹1,600',async({page})=>{
  await login(page);await add(page,3);await add(page,2,'clay-festival-lamp');await page.goto('/cart');await expect(summary(page).getByText('₹1,445',{exact:true}).last()).toBeVisible();
  await page.getByRole('button',{name:'Clear cart',exact:true}).click();await expect(page.getByRole('heading',{name:'Your cart is waiting for something thoughtful'})).toBeVisible();await add(page,2,'forest-cotton-stole');await page.goto('/cart');await expect(summary(page).getByText('₹1,600',{exact:true}).last()).toBeVisible();
  await expect(summary(page).getByText('Demo delivery: Free',{exact:true})).toBeVisible();await expect(summary(page).getByText('Additional demo tax: ₹0',{exact:true})).toBeVisible();await expect(summary(page).getByRole('link',{name:'Continue to checkout'})).toHaveAttribute('href','/checkout');expect((await (await page.request.get('/api/cart')).json()).data.totalPaise).toBe(160000);
});
test('out-of-stock/inactive retained cart lines explain recovery and remain removable',async({page})=>{
  await openPopulated(page,3);await owner.query('UPDATE commerce."Product" SET stock=0 WHERE slug=\'cotton-everyday-pouch\'');await page.reload();await expect(lines(page).getByText(/Out of stock/)).toBeVisible();await expect(lines(page).getByRole('button',{name:'Update quantity'})).toBeDisabled();
  await owner.query('UPDATE commerce."Product" SET active=false WHERE slug=\'cotton-everyday-pouch\'');await page.reload();await expect(lines(page).getByText(/No longer available/)).toBeVisible();await page.screenshot({caret:'initial',path:`${evidence}/unavailable-cart.png`,fullPage:true});
  await lines(page).getByRole('button',{name:'Remove Cotton Everyday Pouch',exact:true}).click();await expect(page.getByRole('heading',{name:'Your cart is waiting for something thoughtful'})).toBeVisible();
});
test('two real browser tabs surface a stale revision and require explicit Reload cart',async({page,context})=>{
  await openPopulated(page);const second=await context.newPage();try{await second.goto('/cart');await expect(lines(second)).toBeVisible();await lines(page).getByRole('spinbutton',{name:'Quantity for Cotton Everyday Pouch',exact:true}).fill('2');await lines(page).getByRole('button',{name:'Update quantity'}).click();await expect(summary(page).getByText('₹698',{exact:true}).last()).toBeVisible();
    await lines(second).getByRole('spinbutton',{name:'Quantity for Cotton Everyday Pouch',exact:true}).fill('3');await lines(second).getByRole('button',{name:'Update quantity'}).click();await expect(second.locator('main').getByRole('alert')).toContainText(/cart changed/i);await expect(summary(second).getByText('₹349',{exact:true}).last()).toBeVisible();await second.getByRole('button',{name:'Reload cart',exact:true}).click();await expect(lines(second).getByRole('spinbutton',{name:'Quantity for Cotton Everyday Pouch',exact:true})).toHaveValue('2');await expect(summary(second).getByText('₹698',{exact:true}).last()).toBeVisible();
  }finally{await second.close();}
});
test('insufficient stock remains explained and stale stock rejection restores confirmed totals until review',async({page})=>{
  await openPopulated(page,3);await owner.query('UPDATE commerce."Product" SET stock=2 WHERE slug=\'cotton-everyday-pouch\'');await page.reload();await expect(lines(page).getByText('Only 2 available. Reduce the quantity or remove this item.')).toBeVisible();
  const input=lines(page).getByRole('spinbutton',{name:'Quantity for Cotton Everyday Pouch',exact:true});await input.fill('2');await lines(page).getByRole('button',{name:'Update quantity'}).click();await expect(summary(page).getByText('₹698',{exact:true}).last()).toBeVisible();
  await owner.query('UPDATE commerce."Product" SET stock=1 WHERE slug=\'cotton-everyday-pouch\'');await lines(page).getByRole('button',{name:'Update quantity'}).click();await expect(page.locator('main').getByRole('alert')).toContainText('requested quantity is unavailable');await expect(summary(page).getByText('₹698',{exact:true}).last()).toBeVisible();
  await page.getByRole('button',{name:'Reload cart',exact:true}).click();await expect(lines(page).getByText('Only 1 available. Reduce the quantity or remove this item.')).toBeVisible();await input.fill('1');await lines(page).getByRole('button',{name:'Update quantity'}).click();await expect(summary(page).getByText('₹349',{exact:true}).last()).toBeVisible();
});
test('network failure preserves confirmed quantity/total and Reload cart recovers real persisted state',async({page})=>{
  await openPopulated(page);await page.route('**/api/cart/items/*',route=>route.request().method()==='PATCH'?route.abort():route.continue());await lines(page).getByRole('spinbutton',{name:'Quantity for Cotton Everyday Pouch',exact:true}).fill('2');await lines(page).getByRole('button',{name:'Update quantity'}).click();await expect(page.locator('main').getByRole('alert')).toContainText(/could not|connection/i);await expect(lines(page).getByRole('spinbutton',{name:'Quantity for Cotton Everyday Pouch',exact:true})).toHaveValue('1');await expect(summary(page).getByText('₹349',{exact:true}).last()).toBeVisible();await page.screenshot({caret:'initial',path:`${evidence}/failed-mutation.png`,fullPage:true});
  await page.unroute('**/api/cart/items/*');await page.getByRole('button',{name:'Reload cart',exact:true}).click();await expect(lines(page)).toBeVisible();expect((await (await page.request.get('/api/cart')).json()).data.items[0].quantity).toBe(1);
});
test('expired local session prompts safe sign-in without reporting a successful mutation',async({page,context})=>{
  await openPopulated(page);await context.clearCookies();await lines(page).getByRole('spinbutton',{name:'Quantity for Cotton Everyday Pouch',exact:true}).fill('2');await lines(page).getByRole('button',{name:'Update quantity'}).click();await expect(page.getByRole('link',{name:'Sign in to view your cart'})).toHaveAttribute('href','/login?next=%2Fcart');await expect(page.getByText('Quantity updated.',{exact:true})).toHaveCount(0);await expect(lines(page)).toHaveCount(0);
});
test('slow actual PostgreSQL cart request shows loading then saved data, not invented empty state',async({page})=>{
  await openPopulated(page);const blocker=new Client({connectionString:url});await blocker.connect();try{await blocker.query('BEGIN');await blocker.query('SELECT id FROM commerce."Cart" WHERE "userId"=$1 FOR UPDATE',[testActors[0].id]);await page.reload({waitUntil:'domcontentloaded'});await expect(page.getByRole('status',{name:'Loading your cart'})).toBeVisible();await page.screenshot({caret:'initial',path:`${evidence}/loading-cart.png`,fullPage:true});await blocker.query('COMMIT');await expect(lines(page)).toBeVisible();}finally{await blocker.query('ROLLBACK');await blocker.end();}
});
test('unavailable cart API is a retryable failure, not an empty cart',async({page})=>{
  await login(page);await page.route('**/api/cart',route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:{code:'SERVICE_UNAVAILABLE',message:'Cart data services are temporarily unavailable.'},requestId:'test-outage'})}));await page.goto('/cart');await expect(page.locator('main').getByRole('alert')).toContainText('temporarily unavailable');await expect(page.getByRole('heading',{name:'Your cart is waiting for something thoughtful'})).toHaveCount(0);await page.screenshot({caret:'initial',path:`${evidence}/failed-load.png`,fullPage:true});await page.unroute('**/api/cart');await page.getByRole('button',{name:'Retry loading cart'}).click();await expect(page.getByRole('heading',{name:'Your cart is waiting for something thoughtful'})).toBeVisible();await page.screenshot({caret:'initial',path:`${evidence}/empty-cart.png`,fullPage:true});
});
test('a stalled initial cart request reaches a bounded retryable error',async({page})=>{
  await login(page);await page.route('**/api/cart',()=>{});await page.goto('/cart');await expect(page.getByRole('status',{name:'Loading your cart'})).toBeVisible();await expect(page.locator('main').getByRole('alert')).toContainText('could not be confirmed',{timeout:20000});await expect(page.getByRole('heading',{name:'Your cart is waiting for something thoughtful'})).toHaveCount(0);await page.unroute('**/api/cart');await page.getByRole('button',{name:'Retry loading cart'}).click();await expect(page.getByRole('heading',{name:'Your cart is waiting for something thoughtful'})).toBeVisible();
});
test('pending add prevents accidental duplicate requests; unavailable detail cannot purchase',async({page})=>{
  await login(page);await page.goto(path);await expect(page.getByRole('button',{name:'Add to cart',exact:true})).toBeEnabled();
  let release!:()=>void;const gate=new Promise<void>(resolve=>release=resolve);let posts=0;
  await page.route('**/api/cart/items',async route=>{posts++;await gate;await route.continue();});
  await page.getByRole('button',{name:'Add to cart',exact:true}).click();await expect(page.getByRole('button',{name:'Adding to cart…'})).toBeDisabled();release();await expect(page.getByRole('link',{name:'View cart',exact:true}).first()).toBeVisible();expect(posts).toBe(1);expect((await (await page.request.get('/api/cart')).json()).data.items[0].quantity).toBe(1);
  await page.goto('/products/brass-wick-spoon');await expect(page.getByRole('button',{name:'Unavailable — out of stock'})).toBeDisabled();
});
test('lost response after a committed add requires review and never silently repeats the increment',async({page})=>{
  await login(page);await page.goto(path);await expect(page.getByRole('button',{name:'Add to cart',exact:true})).toBeEnabled();
  await page.route('**/api/cart/items',async route=>{await route.fetch();await route.abort();});
  await page.getByRole('button',{name:'Add to cart',exact:true}).click();await expect(page.locator('main').getByRole('alert')).toContainText(/could not be confirmed/);await expect(page.getByRole('button',{name:'Add to cart',exact:true})).toBeDisabled();
  const cart=(await (await page.request.get('/api/cart')).json()).data;expect(cart.revision).toBe(1);expect(cart.items[0].quantity).toBe(1);
  await page.getByRole('link',{name:'Review saved cart'}).click();await expect(lines(page)).toBeVisible();await expect(summary(page).getByText('₹349',{exact:true}).last()).toBeVisible();
});
test('cart image failure is honest and removal returns keyboard focus to the status',async({page})=>{
  await login(page);await add(page);await page.route('**/products/demo-placeholder.svg',route=>route.abort());await page.goto('/cart');await expect(lines(page).getByRole('img',{name:/Image unavailable/})).toBeVisible();
  for(const width of [390,1280]){await page.setViewportSize({width,height:900});const frame=await lines(page).locator('.cart-thumbnail').boundingBox();const label=await lines(page).locator('.image-fallback>span:last-child').boundingBox();expect(label!.y+label!.height).toBeLessThanOrEqual(frame!.y+frame!.height);expect(label!.x).toBeGreaterThanOrEqual(frame!.x);expect(label!.x+label!.width).toBeLessThanOrEqual(frame!.x+frame!.width);await page.screenshot({caret:'initial',path:`${evidence}/cart-image-fallback${width===390?'-390':''}.png`,fullPage:true});}
  await lines(page).getByRole('button',{name:'Remove Cotton Everyday Pouch',exact:true}).click();await expect(page.locator('#cart-feedback')).toBeFocused();await expect(page.locator('#cart-feedback')).toContainText('removed');
});
test('empty cart recovery actions retain the shared spacing and accessible target size',async({page})=>{
  await login(page,'/cart');const first=page.getByRole('link',{name:'Browse products',exact:true});const second=page.getByRole('link',{name:'Explore Navratri',exact:true});await expect(first).toBeVisible();const a=await first.boundingBox(),b=await second.boundingBox();expect(b!.x-(a!.x+a!.width)).toBeGreaterThanOrEqual(11.5);expect(a!.height).toBeGreaterThanOrEqual(43.5);expect(b!.height).toBeGreaterThanOrEqual(43.5);
});
test('changed selling prices require a visible accessible re-review notice',async({page})=>{
  await openPopulated(page);await owner.query('UPDATE commerce."Product" SET "pricePaise"=40000 WHERE slug=\'cotton-everyday-pouch\'');
  await lines(page).getByRole('spinbutton',{name:'Quantity for Cotton Everyday Pouch',exact:true}).fill('2');await lines(page).getByRole('button',{name:'Update quantity'}).click();await expect(summary(page).getByText('₹800',{exact:true}).last()).toBeVisible();await expect(page.locator('#cart-feedback')).toContainText('Prices changed for Cotton Everyday Pouch');
});
test('account changes in another tab invalidate private cart state before further actions',async({page,context})=>{
  await openPopulated(page);const second=await context.newPage();try{await login(second,'/products','b');await add(second,1,'clay-festival-lamp');await expect(page.locator('main').getByRole('alert')).toContainText(/sign-in changed/i);await expect(lines(page)).toHaveCount(0);await page.getByRole('button',{name:'Reload cart',exact:true}).click();await expect(page.getByRole('article',{name:'Clay Festival Lamp',exact:true})).toBeVisible();}finally{await second.close();}
});
test('server cart context rejects equal-revision account switching even without a browser notification',async({page,context})=>{
  await page.addInitScript(()=>Object.defineProperty(window,'BroadcastChannel',{value:undefined}));await openPopulated(page);const second=await context.newPage();try{await login(second,'/products','b');await add(second,1,'clay-festival-lamp');await page.getByRole('button',{name:'Clear cart',exact:true}).click();await expect(page.locator('main').getByRole('alert')).toContainText(/sign-in changed/i);await expect(lines(page)).toHaveCount(0);const cart=(await (await second.request.get('/api/cart')).json()).data;expect(cart.revision).toBe(1);expect(cart.items[0].slug).toBe('clay-festival-lamp');}finally{await second.close();}
});
test('an old in-flight mutation response cannot restore private data after account switching',async({page,context})=>{
  await openPopulated(page);let release!:()=>void;const gate=new Promise<void>(resolve=>release=resolve);let committed=false;
  await page.route('**/api/cart/items/*',async route=>{const response=await route.fetch();committed=true;await gate;await route.fulfill({response});});
  await lines(page).getByRole('spinbutton',{name:'Quantity for Cotton Everyday Pouch',exact:true}).fill('2');await lines(page).getByRole('button',{name:'Update quantity'}).click();await expect.poll(()=>committed).toBe(true);
  const second=await context.newPage();try{await login(second,'/products','b');await add(second,1,'clay-festival-lamp');await expect(lines(page)).toHaveCount(0);const response=page.waitForResponse(result=>result.request().method()==='PATCH');release();await (await response).finished();await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));await expect(lines(page)).toHaveCount(0);await expect(page.locator('main').getByRole('alert')).toContainText(/sign-in changed/i);}finally{release();await second.close();}
});
test('mobile purchase bar shares the quantity and safe add action without covering product information',async({page})=>{
  await page.setViewportSize({width:390,height:780});await login(page);await page.goto(path);await expect(page.getByRole('button',{name:'Add to cart',exact:true})).toBeEnabled();await page.getByLabel('Quantity',{exact:true}).fill('2');await page.locator('.product-information').evaluate(element=>element.scrollIntoView({block:'start'}));
  const bar=page.locator('.mobile-purchase-bar');await expect(bar).toBeVisible();await expect(bar.getByText('Quantity 2',{exact:true})).toBeVisible();await bar.getByRole('button',{name:'Add to cart',exact:true}).click();await expect(bar.getByRole('link',{name:'View cart',exact:true})).toBeVisible();
  for(const control of await bar.locator('a,button').all()){const box=await control.boundingBox();expect(box!.height).toBeGreaterThanOrEqual(43.5);}
  expect((await new AxeBuilder({page}).include('main').withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze()).violations).toEqual([]);expect((await (await page.request.get('/api/cart')).json()).data.items[0].quantity).toBe(2);await page.screenshot({caret:'initial',path:`${evidence}/mobile-purchase-bar.png`,fullPage:true});
});
for(const width of [360,390,768,1440])test(`premium cart, keyboard and mobile interaction at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:900});await openPopulated(page,2);const line=lines(page);await expect(line.getByRole('spinbutton',{name:'Quantity for Cotton Everyday Pouch',exact:true})).toHaveValue('2');
  await line.getByRole('button',{name:'Increase quantity for Cotton Everyday Pouch'}).focus();await page.keyboard.press('Enter');await line.getByRole('button',{name:'Update quantity'}).click();await expect(summary(page).getByText('₹1,047',{exact:true}).last()).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  for(const control of await page.locator('.cart-layout button,.cart-layout input,.cart-layout a').all()){if(await control.isVisible()){const box=await control.boundingBox();expect(box!.height).toBeGreaterThanOrEqual(43.5);}}
  expect((await new AxeBuilder({page}).include('main').include('.site-header').include('.site-footer').withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze()).violations).toEqual([]);
  await page.screenshot({caret:'initial',path:`${evidence}/cart-${width}.png`,fullPage:true});await page.screenshot({caret:'initial',path:`${evidence}/first-view-${width}.png`});
});
