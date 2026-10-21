import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const key='sacred-commerce-standalone-demo-cart-v1';
const appearance='sacred-commerce-appearance-v1';
test('theme toggle changes the actual canvas and persists',async({page})=>{
 await page.goto('/');const toggle=page.getByRole('switch',{name:'Twilight appearance'});await expect(toggle).toBeVisible({timeout:1500});
 const before=await page.locator('body').evaluate(n=>getComputedStyle(n).backgroundColor);await toggle.click();await expect(toggle).toBeChecked();
 expect(await page.locator('body').evaluate(n=>getComputedStyle(n).backgroundColor)).not.toBe(before);await page.getByRole('link',{name:'Explore Shop',exact:true}).click();await expect(toggle).toBeChecked();await page.reload();await expect(toggle).toBeChecked();
 expect(await page.evaluate(k=>localStorage.getItem(k),appearance)).toBe('twilight');await toggle.click();await page.reload();await expect(toggle).not.toBeChecked();
});
test('successful additions show temporary Added without changing cart when reset',async({page})=>{
 await page.goto('/');const button=page.locator('[data-product-id="SC-001"]').getByRole('button',{name:'Add to Cart'});await button.click();await expect(button).toContainText('Added',{timeout:1500});await expect(button).toBeFocused();
 await expect(button).toHaveText('Add to Cart',{timeout:3500});await page.goto('/cart');await expect(page.getByLabel('Quantity for Clay Festival Lamp')).toHaveValue('1');
});
test('floating cart uses live authoritative quantities and hides on purchase routes',async({page})=>{
 await page.goto('/');await expect(page.getByRole('link',{name:'Open guest cart, 0 items'})).toBeVisible({timeout:1500});
 await page.locator('[data-product-id="SC-001"]').getByRole('button',{name:'Add to Cart'}).click();const shortcut=page.getByRole('link',{name:'Open guest cart, 1 item',exact:true});await expect(shortcut).toBeVisible();await shortcut.focus();await expect(shortcut).toBeFocused();await shortcut.press('Enter');await expect(page).toHaveURL(/\/cart$/);await expect(page.locator('.sc-floating-cart')).toHaveCount(0);
 await page.getByRole('button',{name:'Increase Clay Festival Lamp'}).click();await page.goto('/products');await expect(page.getByRole('link',{name:'Open guest cart, 2 items'})).toBeVisible();
 await page.goto('/cart');await page.getByRole('button',{name:'Clear cart'}).click();await page.goto('/products');await expect(page.getByRole('link',{name:'Open guest cart, 0 items'})).toBeVisible();
});
test('Stillness reserves decorative background fades outside its content',async({page})=>{
 await page.goto('/');const section=page.locator('#stillness-edit');const values=await section.evaluate(n=>['::before','::after'].map(p=>{const s=getComputedStyle(n,p);return {content:s.content,image:s.backgroundImage,events:s.pointerEvents,height:parseFloat(s.height)};}));
 for(const value of values){expect(value.image).toContain('linear-gradient');expect(value.events).toBe('none');expect(value.height).toBeGreaterThan(40);}
});
test('route transition is CSS-only and not replayed by cart updates',async({page})=>{
 await page.goto('/');const route=page.locator('.demo-route-enter');await expect(route).toBeVisible({timeout:1500});expect(await route.evaluate(n=>getComputedStyle(n).animationName)).toBe('sc-route-in');
 await page.waitForTimeout(300);const elapsed=await route.evaluate(n=>n.getAnimations().map(a=>a.startTime));await page.locator('[data-product-id="SC-001"]').getByRole('button',{name:'Add to Cart'}).click();expect(await route.evaluate(n=>n.getAnimations().map(a=>a.startTime))).toEqual(elapsed);
 await page.getByRole('link',{name:'Explore Shop',exact:true}).click();await expect(page).toHaveURL(/\/products$/);await expect(page.locator('h1')).toBeVisible();await page.goBack();await expect(page.locator('h1')).toHaveText(/Make room\s*for meaning\./);
});
test('reduced motion removes all decorative route, feedback and badge motion',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');expect(await page.locator('main').evaluate(n=>[n,...n.querySelectorAll('*')].filter(el=>{const s=getComputedStyle(el);return s.animationName!=='none'&&parseFloat(s.animationDuration)>0;}).length)).toBe(0);
});
test('rapid additions, limits and shared button feedback preserve exact totals',async({page})=>{
 await page.goto('/products/clay-festival-lamp');const add=page.getByRole('button',{name:'Add to demo cart'});await add.evaluate(button=>{for(let i=0;i<5;i++)(button as HTMLButtonElement).click();});await expect(page.getByRole('link',{name:'Cart (5)',exact:true})).toBeVisible();await expect(add).toContainText('Added');
 await page.goto('/products');const bell=page.locator('.product-card').filter({has:page.getByRole('heading',{name:'Brass Table Bell',exact:true})});await bell.getByRole('button',{name:'Add to demo cart'}).click();await expect(bell.getByRole('button')).toBeDisabled();await page.goto('/cart');await expect(page.getByLabel('Quantity for Clay Festival Lamp')).toHaveValue('5');await expect(page.getByText('Total: ₹1,794.00',{exact:true})).toBeVisible();
});
test('blocked storage leaves appearance, feedback and memory-only shopping usable',async({page})=>{
 await page.addInitScript(()=>{Storage.prototype.getItem=function(){throw new DOMException('Blocked','SecurityError');};Storage.prototype.setItem=function(){throw new DOMException('Blocked','SecurityError');};});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/products/clay-festival-lamp');await page.getByRole('switch',{name:'Twilight appearance'}).click();await expect(page.getByRole('switch')).toBeChecked();await page.getByRole('button',{name:'Add to demo cart'}).click();await page.getByRole('link',{name:'Cart (1)',exact:true}).click();await expect(page.getByLabel('Quantity for Clay Festival Lamp')).toHaveValue('1');expect(errors).toEqual([]);
});
test('saved Twilight is applied before hydration without console mismatches',async({page})=>{
 await page.addInitScript(k=>localStorage.setItem(k,'twilight'),appearance);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto('/products',{waitUntil:'domcontentloaded'});expect(await page.locator('html').getAttribute('data-demo-theme')).toBe('twilight');await expect(page.getByRole('switch')).toBeChecked();await page.reload();await expect(page.getByRole('switch')).toBeChecked();expect(errors).toEqual([]);
});
test('navigation clears transient Added feedback and badge reflects remove and checkout',async({page})=>{
 await page.goto('/products/clay-festival-lamp');await page.getByRole('button',{name:'Add to demo cart'}).click();await expect(page.getByRole('button',{name:'Add to demo cart'})).toContainText('Added');await page.goto('/products');await expect(page.getByRole('button',{name:'Add to demo cart'}).first()).toHaveText('Add to demo cart');
 await page.goto('/cart');await page.getByRole('button',{name:'Remove',exact:true}).click();await page.goto('/');await expect(page.getByRole('link',{name:'Open guest cart, 0 items'})).toBeVisible();
 await page.locator('[data-product-id="SC-001"]').getByRole('button',{name:'Add to Cart'}).click();await page.goto('/checkout');await expect(page.locator('.sc-floating-cart')).toHaveCount(0);await page.getByRole('button',{name:'Complete simulated purchase'}).click();await expect(page.getByRole('heading',{name:'Demo order confirmation'})).toBeVisible();await page.goto('/');await expect(page.getByRole('link',{name:'Open guest cart, 0 items'})).toBeVisible();
});
test('floating shortcut stays clear of action controls and disappears with the mobile drawer',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');const floating=page.locator('.sc-floating-cart');await expect(floating).toBeVisible();
 await page.evaluate(()=>{const link=document.querySelector('.sc-floating-cart')!;const r=link.getBoundingClientRect();const blocker=document.createElement('button');blocker.textContent='Temporary overlap probe';blocker.id='overlap-probe';Object.assign(blocker.style,{position:'fixed',left:`${r.left}px`,top:`${r.top}px`,width:`${r.width}px`,height:`${r.height}px`});document.querySelector('main')!.append(blocker);dispatchEvent(new Event('scroll'));});
 await expect.poll(()=>page.evaluate(()=>{const a=document.querySelector('.sc-floating-cart')!.getBoundingClientRect(),b=document.querySelector('#overlap-probe')!.getBoundingClientRect();return !(a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top);})).toBe(true);
 await page.getByRole('button',{name:'Open shop menu'}).click();await expect(page.locator('.sc-floating-cart')).toHaveCount(0);await page.keyboard.press('Escape');await expect(page.getByRole('button',{name:'Open shop menu'})).toBeFocused();
});
test('another tab updates the floating badge using the existing cart storage event',async({page,context})=>{
 await page.goto('/products');const other=await context.newPage();await other.goto('/');await other.evaluate(k=>localStorage.setItem(k,'{"SC-001":3,"SC-002":1}'),key);await expect(page.locator('.sc-floating-count')).toHaveText('4');await other.evaluate(k=>localStorage.removeItem(k),key);await expect(page.locator('.sc-floating-count')).toHaveText('0');await other.close();
});
test('Twilight declined and successful simulations retain accurate feedback and quantities',async({page})=>{
 await page.goto('/');await page.getByRole('switch').click();await page.evaluate(k=>localStorage.setItem(k,'{"SC-001":2}'),key);await page.goto('/checkout');await page.getByLabel('Simulation outcome').selectOption('declined');await page.getByRole('button',{name:'Complete simulated purchase'}).click();await expect(page.getByRole('status')).toContainText('declined');await expect(page.getByLabel('Quantity for Clay Festival Lamp')).toHaveValue('2');expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
 await page.getByLabel('Simulation outcome').selectOption('success');await page.getByRole('button',{name:'Complete simulated purchase'}).click();await expect(page.getByRole('heading',{name:'Demo order confirmation'})).toBeFocused();await expect(page.getByRole('status')).not.toContainText('declined');expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);await expect(page.getByRole('link',{name:'Cart (0)',exact:true})).toBeVisible();
});
for(const mode of ['light','twilight'])for(const width of [320,360,390,768,1024,1440,1920])test(`${mode} layout and accessible focus at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:1000});await page.goto('/');if(mode==='twilight')await page.getByRole('switch',{name:'Twilight appearance'}).click();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.keyboard.press('Tab');await page.getByRole('switch').focus();await expect(page.getByRole('switch')).toBeFocused();expect(await page.getByRole('switch').evaluate(n=>getComputedStyle(n).outlineStyle)).not.toBe('none');
 if([320,390,1440].includes(width)){const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();expect(result.violations).toEqual([]);}
 const section=page.locator('#stillness-edit');await section.scrollIntoViewIfNeeded();await expect(section.getByRole('link',{name:'Explore Ritual Essentials'})).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
for(const route of ['/products','/products/clay-festival-lamp','/cart','/checkout'])test(`Twilight contrast and form visibility on ${route}`,async({page})=>{
 await page.goto('/');await page.getByRole('switch',{name:'Twilight appearance'}).click();await page.evaluate(k=>localStorage.setItem(k,'{"SC-001":1}'),key);await page.goto(route);expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations).toEqual([]);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
