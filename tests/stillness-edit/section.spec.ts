import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const body='Inspired by Shiva as Adiyogi, the First Yogi. An invitation to discover moments of reflection, simplicity and conscious living.';
test('Stillness Edit is integrated between the existing gallery and Navratri',async({page})=>{
 await page.goto('/',{waitUntil:'networkidle'});const section=page.getByRole('region',{name:'Beyond the noise, there is stillness.'});
 await expect(section).toBeVisible();await expect(section.getByRole('heading',{level:2})).toHaveText('Beyond the noise, there is stillness.');await expect(section.getByText(body,{exact:true})).toBeVisible();
 await expect(page.getByRole('heading',{level:1})).toHaveText('Make roomfor meaning.');
 const order=await page.locator('main>section').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('aria-labelledby')));const at=order.indexOf('stillness-edit-title');expect(order[at-1]).toBe('ha-gallery-title');expect(order[at+1]).toBe('ha-season-title');
 await expect(section.getByRole('link',{name:'Explore Ritual Essentials',exact:true})).toHaveAttribute('href','/categories/ritual-essentials');await expect(section.getByRole('link',{name:'Discover our philosophy'})).toHaveAttribute('href','/about');await expect(section.getByRole('button')).toHaveCount(0);await expect(section.locator('.product-card')).toHaveCount(0);
});
for(const width of [320,360,390,768,1024,1440])test(`Stillness layout and accessibility at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:1000});await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/',{waitUntil:'networkidle'});const section=page.locator('#stillness-edit');await section.scrollIntoViewIfNeeded();
 for(const image of await section.locator('img').all()){await expect.poll(()=>image.evaluate((n:HTMLImageElement)=>n.complete&&n.naturalWidth>0)).toBe(true);const asset=new URL((await image.getAttribute('src'))!,page.url());expect(asset.origin).toBe(new URL(page.url()).origin);expect(asset.pathname).toMatch(/^\/editorial\/stillness-[a-z-]+\.svg$/);}
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 const axe=await new AxeBuilder({page}).include('#stillness-edit').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(axe.violations).toEqual([]);
 await section.getByRole('link',{name:'Explore Ritual Essentials',exact:true}).focus();await expect(section.getByRole('link',{name:'Explore Ritual Essentials',exact:true})).toBeFocused();await page.keyboard.press('Tab');await expect(section.getByRole('link',{name:'Discover our philosophy'})).toBeFocused();
 expect(await section.locator('*').evaluateAll(nodes=>nodes.some(n=>{const s=getComputedStyle(n);return s.animationName!=='none'&&parseFloat(s.animationDuration)>0.01;}))).toBe(false);
});
test('Stillness CTA leads into the existing catalogue and shopping flow',async({page})=>{
 await page.goto('/');await page.getByRole('region',{name:'Beyond the noise, there is stillness.'}).getByRole('link',{name:'Explore Ritual Essentials',exact:true}).click();await expect(page).toHaveURL(/\/categories\/ritual-essentials$/);await expect(page.locator('.product-card')).toHaveCount(5);
 const lamp=page.locator('.product-card').filter({hasText:'Clay Festival Lamp'});await lamp.getByRole('button',{name:'Add to demo cart'}).click();await page.goto('/cart');await expect(page.getByLabel('Quantity for Clay Festival Lamp')).toHaveValue('1');await page.reload();await expect(page.getByLabel('Quantity for Clay Festival Lamp')).toHaveValue('1');
});
test('original artwork is lightweight, lazy and reserves stable layout space',async({page,request})=>{
 const assets=['/editorial/stillness-mountains.svg','/editorial/stillness-study.svg'];let bytes=0;
 for(const asset of assets){const response=await request.get(asset);expect(response.status()).toBe(200);const text=await response.text();bytes+=Buffer.byteLength(text);expect(text).not.toMatch(/<script|<foreignObject|<image\b|https:\/\//i);}
 expect(bytes).toBeLessThan(16000);
 await page.addInitScript(()=>{const state=window as Window&{stillnessCLS?:number};state.stillnessCLS=0;new PerformanceObserver(list=>{for(const entry of list.getEntries()){const shift=entry as PerformanceEntry&{value:number;hadRecentInput:boolean};if(!shift.hadRecentInput)state.stillnessCLS!+=shift.value;}}).observe({type:'layout-shift',buffered:true});});
 await page.goto('/',{waitUntil:'networkidle'});const section=page.locator('#stillness-edit');for(const image of await section.locator('img').all())await expect(image).toHaveAttribute('loading','lazy');
 await section.scrollIntoViewIfNeeded();for(const image of await section.locator('img').all())await image.evaluate(async(n:HTMLImageElement)=>{await n.decode();});
 expect(await page.evaluate(()=>(window as Window&{stillnessCLS?:number}).stillnessCLS)).toBeLessThan(0.1);
});
