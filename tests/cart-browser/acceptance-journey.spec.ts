import {test,expect,type Page} from '@playwright/test';
import {Client} from 'pg';
import AxeBuilder from '@axe-core/playwright';
import {mkdirSync,writeFileSync} from 'node:fs';
import {testActors} from '../support/actors';
const url=process.env.CART_FIXTURE_DATABASE_URL;
if(process.env.CART_BROWSER_TEST_OWNED!=='true'||!url||new URL(url).hostname!=='127.0.0.1'||new URL(url).pathname!=='/sacred_commerce_test')throw Error('Owned disposable loopback fixture required');
const db=new Client({connectionString:url}),ids=testActors.map(a=>a.id);
let pid:string;
const evidence=process.env.CART_PRODUCTION==='true'?'docs/qa/evidence/t09':'.local/t09-journey-captures';
test.beforeAll(async()=>{await db.connect();pid=(await db.query('SELECT id FROM commerce."Product" WHERE slug=$1',['cotton-everyday-pouch'])).rows[0].id;});
async function clean(){
 await db.query('DELETE FROM commerce."AuditEvent" WHERE "actorId"=ANY($1::uuid[])',[ids]);
 for(const table of ['InventoryMovement','PaymentAttempt','OrderItem'])await db.query('DELETE FROM commerce."'+table+'" WHERE "orderId" IN (SELECT id FROM commerce."Order" WHERE "userId"=ANY($1::uuid[]))',[ids]);
 await db.query('DELETE FROM commerce."InventoryMovement" WHERE "actorId"=ANY($1::uuid[])',[ids]);
 await db.query('DELETE FROM commerce."Order" WHERE "userId"=ANY($1::uuid[])',[ids]);
 await db.query('DELETE FROM commerce."CartItem" WHERE "cartId" IN (SELECT id FROM commerce."Cart" WHERE "userId"=ANY($1::uuid[]))',[ids]);
 await db.query('DELETE FROM commerce."Cart" WHERE "userId"=ANY($1::uuid[])',[ids]);
 await db.query('DELETE FROM commerce."RequestBucket" WHERE "userId"=ANY($1::uuid[])',[ids]);
 await db.query('DELETE FROM commerce."LoginRequestBucket"');
 await db.query('UPDATE commerce."Product" SET stock=20,version=0,active=true,"pricePaise"=34900 WHERE id=$1',[pid]);
}
test.beforeEach(clean);test.afterAll(async()=>{await clean();await db.end();});
type Vitals={lcpMs:number|null;cls:number;supported:boolean;shifts?:unknown[]};
type MetricsWindow=Window & {__t09Vitals?:Vitals};
async function inspect(page:Page,label:string){
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 for(const control of await page.locator('main button,main input:not([type=checkbox]):not([type=radio]),main select,main a.button').all()){
  if(await control.isVisible()){const box=await control.boundingBox();expect(box?.height,label+' target '+await control.getAttribute('aria-label')).toBeGreaterThanOrEqual(43.5);expect(box?.width,label+' target width').toBeGreaterThanOrEqual(43.5);}
 }
 const axe=await new AxeBuilder({page}).include('main').analyze();expect(axe.violations,label+' axe').toEqual([]);
}
async function navigation(page:Page){const button=page.getByRole('button',{name:'Open navigation'});if(await button.isVisible())await button.click();}
async function signIn(page:Page,admin=false){
 await page.getByLabel('Email',{exact:true}).fill(admin?'admin@example.test':'customer-a@example.test');
 await page.getByLabel('Password',{exact:true}).fill(process.env.CART_TEST_PASSWORD!);
 await page.getByRole('button',{name:'Sign in',exact:true}).click();
 await expect.poll(()=>new URL(page.url()).pathname).not.toBe('/login');
}
for(const width of [360,390,768,1440])test('TC10 full customer and admin journey at '+width+'px (Chromium emulation)',async({page})=>{
 test.setTimeout(60000);await page.setViewportSize({width,height:900});await page.emulateMedia({reducedMotion:'reduce'});
 await page.addInitScript(()=>{
  const values:Vitals={lcpMs:null,cls:0,shifts:[],supported:PerformanceObserver.supportedEntryTypes.includes('largest-contentful-paint')&&PerformanceObserver.supportedEntryTypes.includes('layout-shift')};
  (window as MetricsWindow).__t09Vitals=values;
  if(PerformanceObserver.supportedEntryTypes.includes('largest-contentful-paint'))new PerformanceObserver(list=>{for(const entry of list.getEntries())values.lcpMs=entry.startTime;}).observe({type:'largest-contentful-paint',buffered:true});
  let start=0,last=0,session=0;
  if(PerformanceObserver.supportedEntryTypes.includes('layout-shift'))new PerformanceObserver(list=>{for(const item of list.getEntries()){const e=item as PerformanceEntry&{hadRecentInput:boolean;value:number};if(e.hadRecentInput)continue;if(e.startTime-last<1000&&e.startTime-start<5000)session+=e.value;else{session=e.value;start=e.startTime;}last=e.startTime;values.cls=Math.max(values.cls,session);const attributed=e as typeof e & {sources?:{node?:Element;previousRect:DOMRectReadOnly;currentRect:DOMRectReadOnly}[]};values.shifts!.push({atMs:e.startTime,value:e.value,scrollY,sources:attributed.sources?.map(x=>({tag:x.node?.tagName,className:String(x.node?.className??""),from:{x:x.previousRect.x,y:x.previousRect.y,w:x.previousRect.width,h:x.previousRect.height},to:{x:x.currentRect.x,y:x.currentRect.y,w:x.currentRect.width,h:x.currentRect.height}}))});}}).observe({type:'layout-shift',buffered:true});
 });
 const measurements:unknown[]=[];
 const measure=async(label:string)=>{await page.evaluate(()=>new Promise<void>(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r()))));measurements.push(await page.evaluate(name=>{const n=performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;return {page:name,vitals:(window as MetricsWindow).__t09Vitals??null,ttfbMs:n.responseStart-n.requestStart,domContentLoadedMs:n.domContentLoadedEventEnd,loadEventMs:n.loadEventEnd};},label));};
 await page.goto('/');await expect(page.getByRole('heading',{name:'Sacred Commerce',exact:true})).toBeVisible();await inspect(page,'homepage');await measure('homepage');await page.screenshot({path:evidence+'/home-'+width+'.png',fullPage:true});
 await navigation(page);await page.getByRole('link',{name:'Navratri 2026',exact:true}).click();await expect.poll(()=>new URL(page.url()).pathname).toBe('/collections/navratri-2026');await expect(page.locator('.product-card').first()).toBeVisible();await page.reload();await expect(page.locator('.product-card').first()).toBeVisible();await inspect(page,'seasonal collection');await measure('seasonal document');
 const search=page.locator(await page.locator('.header-search').isVisible()?'.header-search':'.mobile-search');await search.getByRole('searchbox',{name:'Search products',exact:true}).fill('Cotton Everyday Pouch');await search.getByRole('button',{name:'Submit search products'}).click();
 await expect.poll(()=>new URL(page.url()).pathname).toBe('/products');await expect.poll(()=>new URL(page.url()).searchParams.get('q')).toBe('Cotton Everyday Pouch');await expect(page.locator('.catalogue-results .product-card')).toHaveCount(1);await expect(page.locator('.catalogue-results').getByRole('link',{name:'Forest Cotton Stole',exact:true})).toHaveCount(0);await expect(page.locator('.catalogue-results .product-card').getByRole('link',{name:'Cotton Everyday Pouch',exact:true})).toBeVisible();await inspect(page,'catalogue');await page.locator('.catalogue-results .product-card').getByRole('link',{name:'Cotton Everyday Pouch',exact:true}).click();await expect(page.getByRole('heading',{name:'Cotton Everyday Pouch',level:1,exact:true})).toHaveText('Cotton Everyday Pouch');await page.reload();await expect(page.getByRole('heading',{name:'Cotton Everyday Pouch',level:1,exact:true})).toHaveText('Cotton Everyday Pouch');await inspect(page,'product detail');await measure('product document');
 await page.getByRole('link',{name:'Sign in to add to cart',exact:true}).first().click();await expect.poll(()=>new URL(page.url()).pathname).toBe('/login');await signIn(page);await expect(page.getByRole('heading',{name:'Cotton Everyday Pouch',level:1,exact:true})).toHaveText('Cotton Everyday Pouch');await page.getByRole('button',{name:'Add to cart',exact:true}).click();await page.getByRole('link',{name:'View cart',exact:true}).first().click();
 const line=page.getByRole('article',{name:'Cotton Everyday Pouch',exact:true});await expect(line).toBeVisible();const quantity=line.getByRole('spinbutton',{name:'Quantity for Cotton Everyday Pouch',exact:true});await quantity.fill('2');await line.getByRole('button',{name:'Update quantity'}).click();await expect(quantity).toHaveValue('2');await expect(page.getByRole('region',{name:'Order summary'}).getByText('₹698',{exact:true}).last()).toBeVisible();
 await quantity.fill('0');await line.getByRole('button',{name:'Update quantity'}).click();await expect(line.getByText(/Choose a whole quantity/)).toBeVisible();await expect(quantity).toHaveValue('2');await expect(quantity).toBeFocused();await inspect(page,'cart');
 await page.getByRole('link',{name:'Continue to checkout',exact:true}).click();await expect.poll(()=>new URL(page.url()).pathname).toBe('/checkout');await page.reload();await expect(page.getByRole('button',{name:'Review order',exact:true})).toBeVisible();await inspect(page,'checkout form');await measure('checkout document');await page.getByRole('button',{name:'Review order',exact:true}).click();await expect(page.locator('main').getByRole('alert')).toContainText('Check your delivery details');await expect(page.getByLabel('Full name',{exact:false})).toBeFocused();
 await page.getByRole('button',{name:'Use fictional demo details'}).click();await page.getByRole('button',{name:'Review order',exact:true}).click();const confirm=page.getByRole('button',{name:'Confirm simulated purchase',exact:true});await expect(confirm).toBeFocused();await inspect(page,'checkout review');await page.screenshot({path:evidence+'/review-'+width+'.png',fullPage:true});
 const started=performance.now();await confirm.click();await expect(page.getByRole('heading',{name:'Your simulated order is confirmed',exact:true})).toBeVisible();const id=new URL(page.url()).pathname.split('/').at(-1)!;const saved=(await db.query('SELECT status,"totalPaise" FROM commerce."Order" WHERE id=$1',[id])).rows[0];expect(saved).toMatchObject({status:'CONFIRMED',totalPaise:69800});measurements.push({page:'confirmation',clickToVisibleMs:performance.now()-started,metric:'UI outcome latency, not document LCP'});await inspect(page,'confirmation');await page.screenshot({path:evidence+'/confirmation-'+width+'.png',fullPage:true});
 await page.goto('/orders');await expect(page.locator('.order-card')).toHaveCount(1);await inspect(page,'order history');await page.goto('/account');await expect(page.getByRole('heading',{name:'Your private demo account'})).toBeVisible();await inspect(page,'account');
 await navigation(page);await page.getByRole('button',{name:'Sign out',exact:true}).click();await expect.poll(()=>new URL(page.url()).pathname).toBe('/login');await signIn(page,true);await navigation(page);await page.getByRole('link',{name:'Administration',exact:true}).click();await page.getByRole('button',{name:'Products',exact:true}).click();const adminProduct=page.getByRole('article',{name:'Cotton Everyday Pouch',exact:true});
 for(const [delta,reason] of [[-18,'Demo stock reconciliation'],[5,'Verified demo stock receipt']] as const){await adminProduct.getByRole('button',{name:'Manage product'}).click();await page.getByLabel('Stock adjustment').fill(String(delta));await page.getByLabel('Adjustment reason').fill(reason);await page.getByRole('button',{name:'Apply stock adjustment'}).click();await expect(page.getByRole('status').filter({hasText:'Stock adjusted'})).toBeVisible();await expect(adminProduct).toContainText('Stock: '+(delta===5?5:0));}
 expect((await db.query('SELECT stock FROM commerce."Product" WHERE id=$1',[pid])).rows[0].stock).toBe(5);
 await page.getByRole('button',{name:'Orders',exact:true}).click();const order=page.getByRole('article').filter({hasText:id.toUpperCase()});await expect(order).toContainText('CONFIRMED');await inspect(page,'admin orders');await order.getByRole('button',{name:'Mark simulated shipped'}).click();await expect(order).toContainText('SHIPPED');
 await page.getByRole('button',{name:'Audit',exact:true}).click();await expect(page.getByRole('heading',{name:'INVENTORY ADJUSTED'})).toHaveCount(2);await inspect(page,'admin audit');await page.screenshot({path:evidence+'/admin-'+width+'.png',fullPage:true});
 await page.goto('/products?q=Cotton+Everyday+Pouch');await expect(page.locator('.product-card').filter({has:page.getByRole('heading',{name:'Cotton Everyday Pouch',exact:true})})).toContainText('In stock');
 mkdirSync('.local',{recursive:true});writeFileSync('.local/t09-render-'+width+'.json',JSON.stringify({executedAt:new Date().toISOString(),width,production:process.env.CART_PRODUCTION==='true',emulation:true,measurements,limitation:'Unthrottled local Chromium/loopback, observations only; independently reloaded homepage/seasonal/product/checkout document LCP/CLS and click-to-confirmation latency, not hosted Web Vitals or commercial uplift.'},null,2)+'\n');
});
test('checkout loading avoids a large viewport shift after a delayed private cart response',async({page})=>{
 await page.setViewportSize({width:360,height:900});
 await page.goto('/products/cotton-everyday-pouch');await page.getByRole('link',{name:'Sign in to add to cart',exact:true}).first().click();await expect.poll(()=>new URL(page.url()).pathname).toBe('/login');await signIn(page);
 await page.getByRole('button',{name:'Add to cart',exact:true}).click();await expect(page.getByRole('link',{name:'View cart',exact:true}).first()).toBeVisible();
 await page.addInitScript(()=>{(window as MetricsWindow).__t09Vitals={lcpMs:null,cls:0,supported:true};let sum=0;new PerformanceObserver(list=>{for(const item of list.getEntries()){const e=item as PerformanceEntry&{hadRecentInput:boolean;value:number};if(!e.hadRecentInput)sum+=e.value;}(window as MetricsWindow).__t09Vitals!.cls=sum;}).observe({type:'layout-shift',buffered:true});});
 let release!:()=>void;const gate=new Promise<void>(r=>release=r);
 await page.route('**/api/cart',async route=>{const response=await route.fetch();await gate;await route.fulfill({response});});
 try{await page.goto('/checkout');await expect(page.getByText('Loading your private checkout…',{exact:true})).toBeVisible();await page.waitForFunction(()=>performance.now()>650);release();await expect(page.getByRole('button',{name:'Review order',exact:true})).toBeVisible();await page.evaluate(()=>new Promise<void>(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r()))));const cls=await page.evaluate(()=>(window as MetricsWindow).__t09Vitals!.cls);mkdirSync('.local',{recursive:true});writeFileSync('.local/t09-checkout-loading-shift.json',JSON.stringify({executedAt:new Date().toISOString(),width:360,production:process.env.CART_PRODUCTION==='true',controlledCartDelayMs:650,cls,limit:0.1,limitation:'One controlled local viewport probe; not hosted field CLS.'},null,2)+'\n');expect(cls).toBeLessThanOrEqual(0.1);}finally{release();}
});
