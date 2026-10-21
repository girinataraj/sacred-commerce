import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {demoProducts,demoCategories} from '../../src/features/demo/model';
test('editorial hero, numbered intention directory and varied real-product gallery',async({page})=>{
 await page.goto('/');
 await expect(page.getByRole('heading',{level:1,name:'Make room for meaning.'})).toBeVisible();
 await expect(page.getByRole('link',{name:'Explore Shop',exact:true})).toHaveAttribute('href','/products');
 await expect(page.locator('.ha-intention-row')).toHaveCount(4);
 for(const [slug,name] of Object.entries(demoCategories))await expect(page.locator('.ha-intentions').getByRole('link',{name:new RegExp(name)})).toHaveAttribute('href',`/categories/${slug}`);
 const pieces=page.locator('.ha-gallery-piece');await expect(pieces).toHaveCount(5);
 for(const piece of await pieces.all()){
  const sku=await piece.getAttribute('data-product-id');const p=demoProducts.find(item=>item.id===sku)!;
  await expect(piece.getByRole('heading',{name:p.name})).toBeVisible();
  await expect(piece.locator('.selling-price')).toHaveText(new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(p.pricePaise/100));
  await expect(piece.getByRole('link',{name:'View Details'})).toHaveAttribute('href',`/products/${p.slug}`);
  await expect(piece.getByRole('button',{name:'Add to Cart'})).toBeEnabled();
 }
 await expect(page.locator('.ha-season').getByRole('link',{name:'Explore Navratri 2026'})).toHaveAttribute('href','/collections/navratri-2026');
});
for(const width of [320,360,390,768,1024,1440])test(`editorial layout and accessible homepage at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:1000});await page.goto('/');
 for(const img of await page.locator('main img').all()){await img.scrollIntoViewIfNeeded();await expect.poll(()=>img.evaluate((node:HTMLImageElement)=>node.complete&&node.naturalWidth>0)).toBe(true);}
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 expect(await page.locator('meta[name="viewport"]').getAttribute('content')).not.toMatch(/user-scalable=no|maximum-scale=1/);
 if(width===390||width===1440){const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(result.violations).toEqual([]);}
});
test('editorial gallery uses the existing guest cart and quantity safeguards',async({page})=>{
 await page.goto('/');const lamp=page.locator('[data-product-id="SC-001"]');await lamp.getByRole('button',{name:'Add to Cart'}).click();await expect(page.getByRole('status')).toContainText('Clay Festival Lamp: 1');
 await page.reload();await page.goto('/cart');await expect(page.getByLabel('Quantity for Clay Festival Lamp')).toHaveValue('1');
 await page.goto('/');await page.evaluate(()=>localStorage.setItem('sacred-commerce-standalone-demo-cart-v1',JSON.stringify({'SC-001':25})));await page.reload();await expect(page.locator('[data-product-id="SC-001"]').getByRole('button',{name:'Add to Cart'})).toBeDisabled();
});
test('editorial keyboard access, valid footer and reduced motion',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/',{waitUntil:'networkidle'});await page.keyboard.press('Tab');await expect(page.getByRole('link',{name:'Skip to content'})).toBeFocused();await page.keyboard.press('Enter');await expect(page.getByRole('main')).toBeFocused();
 for(const path of ['/products','/collections/navratri-2026','/about','/demo-guide','/privacy','/cart'])expect(await page.locator(`footer a[href="${path}"]`).count()).toBeGreaterThan(0);
 const bad=await page.locator('main *').evaluateAll(nodes=>nodes.filter(n=>{const s=getComputedStyle(n);return s.animationName!=='none'&&parseFloat(s.animationDuration)>0.01;}).length);expect(bad).toBe(0);
});
