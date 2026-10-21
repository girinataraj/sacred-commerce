import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
test('TC01 — Open the homepage → Homepage loads successfully (local PostgreSQL)',async ({page}) => {
  await page.goto('/'); await expect(page.getByRole('heading',{name:'Sacred Commerce',exact:true,level:1})).toBeVisible();
  await expect(page.locator('.category-tile')).toHaveCount(4); await expect(page.locator('#featured-products .product-card')).toHaveCount(4);
  await expect(page.getByText('Independent interview demo · Simulated purchases only.')).toBeVisible();
});
test('TC02 — Search for a product → Matching products are displayed (local PostgreSQL)',async ({page}) => {
  await page.goto('/'); await page.locator('.header-search').getByRole('searchbox',{name:'Search products',exact:true}).fill('Forest Cotton Stole');
  await page.locator('.header-search').getByRole('button',{name:'Submit search products'}).click();
  await expect(page).toHaveURL(/q=Forest/); await expect(page.locator('.catalogue-results .product-card')).toHaveCount(1);
  await expect(page.locator('.catalogue-results').getByRole('link',{name:'Forest Cotton Stole',exact:true})).toBeVisible();
});
test('case-insensitive search, combined filters and public API validation use real records',async ({request}) => {
  const lower=await (await request.get('/api/products?q=cotton')).json(); const upper=await (await request.get('/api/products?q=COTTON')).json();
  expect(lower.data.items.map((p:{id:string})=>p.id)).toEqual(upper.data.items.map((p:{id:string})=>p.id)); expect(lower.data.total).toBeGreaterThan(0);
  const filtered=await request.get('/api/products?category=ritual-essentials&occasion=navratri&intent=home&minPricePaise=30000&maxPricePaise=100000&inStock=true&onOffer=true');
  expect(filtered.status()).toBe(200); expect((await filtered.json()).data.items.map((p:{slug:string})=>p.slug)).toEqual(['terracotta-incense-stand']);
  for (const params of ['minPricePaise=900&maxPricePaise=100','minPricePaise=-1','active=false','q=&q=b']) expect((await request.get(`/api/products?${params}`)).status()).toBe(400);
  const detail=await request.get('/api/products/forest-cotton-stole'); expect(detail.headers()['cache-control']).toContain('no-store');
  expect((await detail.json()).data).toMatchObject({pricePaise:80000,stock:18,savingsPaise:20000});
  expect((await request.get('/api/products/missing-product')).status()).toBe(404);
  expect((await request.post('/api/products',{data:{stock:999}})).status()).toBe(405);
});
test('filters persist in URL, paginate and sort, clear results and recover from zero matches',async ({page}) => {
  await page.goto('/products'); await expect(page.getByRole('status',{name:'Catalogue result count'})).toContainText('20 products');
  await page.getByRole('link',{name:'Next page',exact:true}).click(); await expect(page).toHaveURL(/page=2/); await expect(page.locator('.product-card')).toHaveCount(8);
  await page.getByLabel('Sort products').selectOption('price_desc'); await expect(page).toHaveURL(/sort=price_desc/); await expect(page).not.toHaveURL(/page=2/);
  await expect(page.getByLabel('Sort products')).toBeFocused();
  await page.goto('/products?q=no-such-original-product'); await expect(page.getByRole('heading',{name:'No products match your choices'})).toBeVisible();
  await page.getByRole('link',{name:'Clear filters',exact:true}).last().click(); await expect(page.getByRole('status',{name:'Catalogue result count'})).toContainText('20 products');
});
test('budget forms preserve prior results on invalid ranges and apply meaningful filters',async ({page}) => {
  await page.goto('/products'); await page.getByLabel('Minimum price (INR)').fill('1000'); await page.getByLabel('Maximum price (INR)').fill('100');
  await page.getByRole('button',{name:'Apply filters',exact:true}).click(); await expect(page.getByRole('alert').filter({hasText:'minimum price'})).toBeVisible(); await expect(page.locator('.product-card')).toHaveCount(12);
  await page.getByLabel('Minimum price (INR)').fill('300'); await page.getByLabel('Maximum price (INR)').fill('1000');
  await page.getByLabel('Category filter').selectOption('ritual-essentials'); await page.getByLabel('Occasion').selectOption('navratri'); await page.getByLabel('Purchasing intent').selectOption('home');
  await page.getByLabel('In-stock products only').check(); await page.getByLabel('Demo offers only').check(); await page.getByRole('button',{name:'Apply filters',exact:true}).click();
  await expect(page.locator('.product-card')).toHaveCount(1); await expect(page).toHaveURL(/minPricePaise=30000/);
  await page.reload(); await expect(page.getByLabel('Maximum price (INR)')).toHaveValue('1000');
  const chips=await page.locator('.filter-chips').boundingBox(); const count=await page.locator('#catalogue-result-count').boundingBox();
  expect(chips).not.toBeNull(); expect(count).not.toBeNull(); expect(count!.y-(chips!.y+chips!.height)).toBeLessThan(80);
  await page.screenshot({path:'.local/t03-regression-screenshots/desktop-filtered.png',fullPage:true});
  await page.getByRole('link',{name:'Clear filters',exact:true}).last().click(); await expect(page.locator('.product-card')).toHaveCount(12);
  await page.goBack(); await expect(page).toHaveURL(/minPricePaise=30000/); await expect(page.locator('.product-card')).toHaveCount(1);
});
test('category pages show their real records, retain scope on clear, and unknown categories return 404',async ({page,request}) => {
  await page.goto('/categories/books-gifts'); await expect(page.getByRole('heading',{name:'Books & Gifts',exact:true,level:1})).toBeVisible(); await expect(page.locator('.product-card')).toHaveCount(5);
  await page.goto('/categories/books-gifts?q=no-such-product'); await page.getByRole('link',{name:'Clear filters',exact:true}).last().click();
  await expect(page).toHaveURL(/\/categories\/books-gifts$/); await expect(page.locator('.product-card')).toHaveCount(5);
  expect((await request.get('/categories/not-a-category')).status()).toBe(404);
});
test('detail uses DB attributes, related products and sign-in-required quantities; zero stock cannot purchase',async ({page,request}) => {
  await page.goto('/products/forest-cotton-stole'); await expect(page.getByRole('heading',{name:'Forest Cotton Stole',exact:true,level:1})).toBeVisible();
  await expect(page.getByText('180 × 60 cm',{exact:true})).toBeVisible(); await expect(page.locator('#related-products .product-card')).toHaveCount(4);
  await page.getByRole('button',{name:'Increase quantity'}).click(); await expect(page.getByRole('spinbutton',{name:'Quantity',exact:true})).toHaveValue('2');
  await expect(page.getByRole('link',{name:'Sign in to add to cart',exact:true}).first()).toHaveAttribute('href','/login?next=%2Fproducts%2Fforest-cotton-stole');
  await page.goto('/products/brass-wick-spoon'); await expect(page.locator('.detail-copy').getByText('Out of stock',{exact:true})).toBeVisible();
  await expect(page.getByRole('spinbutton',{name:'Quantity',exact:true})).toBeDisabled(); await expect(page.getByRole('button',{name:'Unavailable — out of stock'})).toBeDisabled();
  expect((await request.get('/products/missing-product')).status()).toBe(404);
});
test('inactive HTTP/detail exclusion and actual product image failure recover safely',async ({page,request})=>{
  const search=await (await request.get('/api/products?q=Hidden%20Browser%20Fixture')).json(); expect(search.data.total).toBe(0);
  expect((await request.get('/api/products/hidden-browser-fixture')).status()).toBe(404); expect((await request.get('/products/hidden-browser-fixture')).status()).toBe(404);
  await page.route('**/products/demo-placeholder.svg',route=>route.abort());
  await page.goto('/products/brass-wick-spoon'); await expect(page.locator('.detail-image').getByText('Image unavailable',{exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Unavailable — out of stock'})).toBeDisabled();
});
test('mobile search/navigation, filter draft cancel, apply and pending state remain usable',async ({page})=>{
  await page.setViewportSize({width:390,height:844}); await page.goto('/');
  await page.locator('.mobile-search').getByRole('searchbox',{name:'Search products',exact:true}).fill('Cotton');
  await page.locator('.mobile-search').getByRole('button',{name:'Submit search products'}).click(); await expect(page).toHaveURL(/q=Cotton/);
  await page.getByRole('button',{name:'Open navigation'}).click(); const menu=page.getByRole('dialog',{name:'Explore Sacred Commerce'});
  await menu.getByRole('link',{name:'Books & gifts'}).click(); await expect(menu).not.toBeVisible(); await expect(page.getByRole('heading',{name:'Books & Gifts',level:1})).toBeVisible();
  await page.goto('/products'); const trigger=page.getByRole('button',{name:'Open product filters'}); await trigger.click();
  const dialog=page.getByRole('dialog',{name:'Filter products'}); await dialog.getByLabel('Maximum price (INR)').fill('300');
  await dialog.getByRole('button',{name:'Close product filters'}).click(); await trigger.click(); await expect(dialog.getByLabel('Maximum price (INR)')).toHaveValue('');
  await dialog.getByLabel('Maximum price (INR)').fill('300'); await dialog.getByLabel('In-stock products only').check();
  await page.route('**/products?**',async route=>{await new Promise(resolve=>setTimeout(resolve,1000)); await route.continue();});
  await dialog.getByRole('button',{name:'Apply filters',exact:true}).click(); await expect(page.getByText('Updating products…',{exact:true})).toBeVisible();
  await expect(page).toHaveURL(/maxPricePaise=30000/); await expect(dialog).not.toBeVisible();
  const products=await (await page.request.get('/api/products?maxPricePaise=30000&inStock=true')).json(); await expect(page.locator('.product-card')).toHaveCount(products.data.items.length);
  await expect(page.getByRole('button',{name:'Open product filters'})).toBeFocused();
  await page.screenshot({path:'.local/t03-regression-screenshots/mobile-filtered.png',fullPage:true});
});
for (const width of [360,390,768,1440]) test(`responsive storefront/keyboard/accessibility at ${width}px`,async ({page}) => {
  await page.setViewportSize({width,height:900}); await page.goto('/'); await expect(page.locator('.category-tile')).toHaveCount(4); await page.evaluate(()=>document.fonts.ready);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect((await new AxeBuilder({page}).include('main').include('.site-header').include('.site-footer').withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze()).violations).toEqual([]);
  await page.screenshot({path:`.local/t03-regression-screenshots/home-${width}.png`,fullPage:true});
  await page.screenshot({path:`.local/t03-regression-screenshots/home-first-${width}.png`});
  await page.goto('/products'); await expect(page.locator('.product-card')).toHaveCount(12);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const failures=await page.locator('main a[href],main button,main input,main select').evaluateAll(elements=>elements.filter(el=>{const target=el.matches('input[type=checkbox]') ? el.closest('label')??el:el; const r=target.getBoundingClientRect();return r.width>0 && r.height>0 && (r.width<43.5 || r.height<43.5);}).map(el=>el.tagName)); expect(failures).toEqual([]);
  expect((await new AxeBuilder({page}).include('main').include('.site-header').include('.site-footer').withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze()).violations).toEqual([]);
  await page.screenshot({path:`.local/t03-regression-screenshots/catalogue-${width}.png`,fullPage:true});
  if (width<1024) {
    const trigger=page.getByRole('button',{name:'Open product filters'}); await trigger.click(); const dialog=page.getByRole('dialog',{name:'Filter products'}); await expect(dialog).toBeVisible();
    expect((await new AxeBuilder({page}).include('dialog[open]').withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze()).violations).toEqual([]);
    await page.screenshot({path:`.local/t03-regression-screenshots/filter-drawer-${width}.png`});
    for(let index=0;index<16;index++) {await page.keyboard.press('Tab'); expect(await dialog.evaluate(el=>el.contains(document.activeElement))).toBe(true);}
    await page.keyboard.press('Escape'); await expect(trigger).toBeFocused();
  }
  await page.goto('/products/forest-cotton-stole'); await expect(page.getByRole('heading',{name:'Forest Cotton Stole',level:1})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect((await new AxeBuilder({page}).include('main').withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze()).violations).toEqual([]);
  await page.screenshot({path:`.local/t03-regression-screenshots/detail-${width}.png`,fullPage:true});
  await page.goto('/categories/natural-living'); await expect(page.locator('.product-card')).toHaveCount(5);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:`.local/t03-regression-screenshots/category-${width}.png`,fullPage:true});
});
