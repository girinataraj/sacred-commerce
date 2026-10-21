import { expect,test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { Client } from 'pg';
const path='/collections/navratri-2026';
const results=(page:import('@playwright/test').Page)=>page.locator('#collection-products .catalogue-results');

test('seasonal landing uses13 real active members, four ranked featured records and real detail links',async({page,request})=>{
  const response=await request.get('/api/collections/navratri-2026?pageSize=24'); expect(response.status()).toBe(200);
  const body=await response.json(); expect(body.data.collection.title).toBe('Navratri 2026'); expect(body.data.products.total).toBe(13);
  expect(body.data.products.items.every((p:{active:boolean;collectionSlugs:string[]})=>p.active && p.collectionSlugs.includes('navratri-2026'))).toBe(true);
  expect(body.data.products.items.map((p:{slug:string})=>p.slug)).not.toContain('neem-wood-comb');
  expect((await request.post('/api/collections/navratri-2026',{data:{stock:999}})).status()).toBe(405);
  await page.goto(path); await expect(page.getByRole('heading',{name:'A thoughtful season of celebration',level:1})).toBeVisible();
  await expect(page.locator('#seasonal-featured .product-card')).toHaveCount(4); await expect(results(page).locator('.product-card')).toHaveCount(12);
  await expect(results(page).getByRole('status',{name:'Catalogue result count'})).toContainText('13 products');
  const card=page.locator('#seasonal-featured .product-card').filter({hasText:'Forest Cotton Stole'});
  await expect(card.locator('.selling-price')).toHaveText('₹800'); await expect(card.locator('.saving-label')).toHaveText('Save ₹200 (20%) — demo offer'); await expect(card.locator('.reference-price')).toContainText('Demo reference price');
  await card.getByRole('link',{name:'Forest Cotton Stole',exact:true}).click(); await expect(page).toHaveURL(/\/products\/forest-cotton-stole$/); await page.goBack(); await expect(page).toHaveURL(new RegExp(path));
});
test('curated journeys use category, gifting budget and home intent without leaving the collection',async({page,request})=>{
  await page.goto(path); const journeys=page.getByRole('navigation',{name:'Seasonal shopping journeys'});
  for(const [name,count] of [['Ritual Essentials',5],['Gifts Under ₹1,000',8],['Home for the Season',5]] as const) {
    const entry=journeys.getByRole('link',{name:new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'))});
    if(name==='Gifts Under ₹1,000') {await entry.focus(); await page.keyboard.press('Enter');} else await entry.click();
    await expect(page).toHaveURL(/collection=navratri-2026/); await expect(results(page).locator('.product-card')).toHaveCount(count);
    const url=new URL(page.url()); const response=await (await request.get('/api/collections/navratri-2026?'+url.searchParams)).json();
    expect(response.data.products.items.every((p:{collectionSlugs:string[]})=>p.collectionSlugs.includes('navratri-2026'))).toBe(true);
    if(name==='Gifts Under ₹1,000') expect(response.data.products.items.every((p:{pricePaise:number;intentTags:string[]})=>p.pricePaise<100000 && p.intentTags.includes('gifting'))).toBe(true);
    if(name==='Ritual Essentials') expect(response.data.products.items.every((p:{category:{slug:string}})=>p.category.slug==='ritual-essentials')).toBe(true);
    if(name==='Home for the Season') expect(response.data.products.items.every((p:{intentTags:string[]})=>p.intentTags.includes('home'))).toBe(true);
    await page.goBack(); await expect(results(page).locator('.product-card')).toHaveCount(12);
  }
});
test('collection filters, clearing, sort, pagination, reload and Back retain URL scope',async({page})=>{
  await page.goto(path); await page.getByLabel('Maximum price (INR)').fill('1000'); await page.getByLabel('In-stock products only').check();
  await page.getByRole('button',{name:'Apply filters',exact:true}).click(); await expect(page).toHaveURL(/collection=navratri-2026/); await expect(page).toHaveURL(/maxPricePaise=100000/);
  await page.getByLabel('Sort products').selectOption('price_desc'); await expect(page).toHaveURL(/sort=price_desc/); await expect(page.getByLabel('Sort products')).toBeFocused();
  await page.reload(); await expect(page.getByLabel('Maximum price (INR)')).toHaveValue('1000');
  await page.getByLabel('In-stock products only').uncheck(); await page.getByRole('button',{name:'Apply filters',exact:true}).click(); await expect(page).toHaveURL(/collection=navratri-2026/); await expect(page).not.toHaveURL(/inStock=true/); await expect(results(page).locator('.product-card')).toHaveCount(12);
  await page.getByRole('link',{name:'Clear filters',exact:true}).last().click(); await expect(page).toHaveURL(/collection=navratri-2026/); await expect(results(page).locator('.product-card')).toHaveCount(12);
  await page.getByRole('link',{name:'Next page',exact:true}).click(); await expect(page).toHaveURL(/page=2/); await expect(results(page).locator('.product-card')).toHaveCount(1);
  await page.goBack(); await expect(results(page).locator('.product-card')).toHaveCount(12);
  await page.goBack(); await expect(page).toHaveURL(/maxPricePaise=100000/); await expect(page).toHaveURL(/sort=price_desc/); await expect(page.getByLabel('Maximum price (INR)')).toHaveValue('1000'); await expect(page.getByLabel('Sort products')).toHaveValue('price_desc');
  await page.goto(path+'?q=not-a-real-listing'); await expect(page.getByRole('heading',{name:'No products match your choices'})).toBeVisible();
  await page.getByRole('link',{name:'Clear filters',exact:true}).last().click(); await expect(page).toHaveURL(/collection=navratri-2026/); await expect(results(page).locator('.product-card')).toHaveCount(12);
});
test('seasonal routes reject unknown, inactive and forged collection context safely',async({page,request})=>{
  expect((await request.get('/collections/not-a-collection')).status()).toBe(404); expect((await request.get('/api/collections/not-a-collection')).status()).toBe(404);
  expect((await request.get('/api/collections/navratri-2026?collection=other')).status()).toBe(400);
  await page.goto(path+'?collection=other'); await expect(page.getByRole('heading',{name:'Check your filters'})).toBeVisible();
  await page.getByRole('link',{name:'Clear invalid filters'}).click(); await expect(page).toHaveURL(/collection=navratri-2026/);
});
test('seasonal stock and image failures remain truthful without enabling purchase',async({page})=>{
  await page.route('**/products/demo-placeholder.svg',route=>route.abort()); await page.route('**/editorial/navratri-season.svg',route=>route.abort());
  await page.goto(path+'?q=Brass+Wick+Spoon'); await expect(page.locator('.seasonal-hero').getByText('Image unavailable',{exact:true})).toBeVisible();
  const card=results(page).locator('.product-card'); await expect(card.locator('.availability')).toHaveText('Out of stock'); await expect(card.getByText('Image unavailable',{exact:true})).toBeVisible(); await expect(card.locator('.saving-label')).toHaveCount(0);
  await card.getByRole('link',{name:'Brass Wick Spoon',exact:true}).click(); await expect(page.getByRole('button',{name:'Unavailable — out of stock'})).toBeDisabled();
});
for(const width of [360,390,768,1440]) test(`seasonal premium layout, navigation, keyboard and accessibility at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:900}); await page.goto('/');
  if(width<1024) await page.getByRole('button',{name:'Open navigation'}).click();
  const navigation=width<1024 ? page.getByRole('dialog',{name:'Explore Sacred Commerce'}):page.getByRole('navigation',{name:'Shop navigation',exact:true});
  await navigation.getByRole('link',{name:'Navratri 2026',exact:true}).click(); await expect(page).toHaveURL(new RegExp(path));
  await expect(page.locator('#seasonal-featured .product-card')).toHaveCount(4); await expect(results(page).locator('.product-card')).toHaveCount(12); await page.evaluate(()=>document.fonts.ready);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const smallTargets=await page.locator('main a[href],main button,main input,main select').evaluateAll(elements=>elements.filter(el=>{const target=el.matches('input[type=checkbox]') ? el.closest('label')??el:el; const r=target.getBoundingClientRect();return r.width>0 && r.height>0 && (r.width<43.5 || r.height<43.5);}).map(el=>el.tagName)); expect(smallTargets).toEqual([]);
  const hero=await page.locator('.seasonal-hero .editorial-hero').boundingBox(); const cta=await page.locator('.seasonal-hero').getByRole('link',{name:'Shop the collection'}).boundingBox();
  expect(hero).not.toBeNull(); expect(cta).not.toBeNull(); expect(cta!.y+cta!.height).toBeLessThanOrEqual(hero!.y+hero!.height);
  expect((await new AxeBuilder({page}).include('main').include('.site-header').include('.site-footer').withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze()).violations).toEqual([]);
  await page.screenshot({path:`.local/t03a-regression-screenshots/collection-${width}.png`,fullPage:true}); await page.screenshot({path:`.local/t03a-regression-screenshots/first-view-${width}.png`});
  await page.locator('.seasonal-hero').getByRole('link',{name:'Shop the collection'}).click(); await expect(page).toHaveURL(/#collection-products$/);
  if(width<1024) {
    const trigger=page.getByRole('button',{name:'Open product filters'}); await trigger.click(); const dialog=page.getByRole('dialog',{name:'Filter products'});
    await expect(dialog).toBeVisible(); for(let index=0;index<16;index++) {await page.keyboard.press('Tab'); expect(await dialog.evaluate(el=>el.contains(document.activeElement))).toBe(true);}
    expect((await new AxeBuilder({page}).include('dialog[open]').withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze()).violations).toEqual([]);
    await dialog.getByLabel('Maximum price (INR)').fill('800'); await dialog.getByRole('button',{name:'Apply filters',exact:true}).click(); await expect(dialog).not.toBeVisible(); await expect(page).toHaveURL(/collection=navratri-2026/); await expect(trigger).toBeFocused();
    await trigger.click(); await page.keyboard.press('Escape'); await expect(trigger).toBeFocused();
    await page.screenshot({path:`.local/t03a-regression-screenshots/mobile-filtered-${width}.png`,fullPage:true});
  }
});
test('real empty/inactive seasonal collection recovers without showing nonmembers or fallback featured cards',async({page,request})=>{
  const connectionString=process.env.STOREFRONT_LOCK_DATABASE_URL;
  if(!connectionString || process.env.STOREFRONT_TEST_OWNED!=='true' || new URL(connectionString).hostname!=='127.0.0.1') throw new Error('Use owned disposable runner.');
  const owner=new Client({connectionString}); await owner.connect();
  const members=await owner.query<{id:string;active:boolean}>(`SELECT p.id,p.active FROM commerce."Product" p JOIN commerce."ProductCollection" m ON m."productId"=p.id JOIN commerce."Collection" c ON c.id=m."collectionId" WHERE c.slug='navratri-2026'`);
  try {
    await owner.query('UPDATE commerce."Product" SET active=false WHERE id=ANY($1::uuid[])',[members.rows.map(p=>p.id)]);
    await page.goto(path); await expect(page.getByRole('heading',{name:'This demo collection has no available listings yet'})).toBeVisible(); await expect(page.locator('.product-card')).toHaveCount(0); await expect(page.locator('#seasonal-featured')).toHaveCount(0);
    await page.screenshot({path:'.local/t03a-regression-screenshots/empty-collection.png',fullPage:true});
    await owner.query(`UPDATE commerce."Collection" SET active=false WHERE slug='navratri-2026'`);
    expect((await request.get(path)).status()).toBe(404); expect((await request.get('/api/collections/navratri-2026')).status()).toBe(404);
  } finally {
    await owner.query(`UPDATE commerce."Collection" SET active=true WHERE slug='navratri-2026'`);
    for(const member of members.rows) await owner.query('UPDATE commerce."Product" SET active=$2 WHERE id=$1',[member.id,member.active]); await owner.end();
  }
});
test('real delayed seasonal queries stream honest loading while the editorial entry remains available',async({page})=>{
  const connectionString=process.env.STOREFRONT_LOCK_DATABASE_URL;
  if(!connectionString || process.env.STOREFRONT_TEST_OWNED!=='true' || new URL(connectionString).hostname!=='127.0.0.1') throw new Error('Use owned disposable runner.');
  const owner=new Client({connectionString}); await owner.connect();
  try {await owner.query('BEGIN'); await owner.query('LOCK TABLE commerce."Product" IN ACCESS EXCLUSIVE MODE'); await page.goto(path,{waitUntil:'commit',timeout:4000});
    await expect(page.getByRole('status',{name:'Loading seasonal discovery'})).toBeVisible(); await expect(page.getByRole('status',{name:'Loading products',exact:true})).toBeVisible(); await expect(page.getByRole('heading',{name:'A thoughtful season of celebration',level:1})).toBeVisible();
    await page.screenshot({caret:'initial',path:'.local/t03a-regression-screenshots/loading-collection.png'}); await owner.query('COMMIT'); await expect(results(page).locator('.product-card')).toHaveCount(12);
  } finally {await owner.query('ROLLBACK');await owner.end();}
});
