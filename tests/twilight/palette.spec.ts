import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const key='sacred-commerce-appearance-v1';
async function inspectPalette(page:import('@playwright/test').Page,mode:string){
 const leaks=await page.evaluate(mode=>{
  function forbidden(color:string){const m=color.match(/^rgba?\(([^)]+)\)/);if(!m)return false;const values=m[1].split(',').map(Number);if(values.length===4&&values[3]===0)return false;const [r,g,b]=values.map(n=>n/255),max=Math.max(r,g,b),min=Math.min(r,g,b),delta=max-min;if(delta<.035||delta/(max||1)<.12)return false;let hue=max===r?(g-b)/delta:max===g?(b-r)/delta+2:(r-g)/delta+4;hue=(hue*60+360)%360;return mode==='light'?hue>=185&&hue<=280:hue>=65&&hue<=175;}
  const found:string[]=[];for(const n of document.querySelectorAll('body,body *')){if(n.closest('svg')||n.tagName==='IMG'||n.tagName==='PICTURE')continue;const s=getComputedStyle(n);if(s.display==='none'||s.visibility==='hidden')continue;for(const pseudo of [null,'::before','::after']){const c=pseudo?getComputedStyle(n,pseudo):s;if(pseudo&&c.content==='none')continue;for(const color of [c.backgroundColor,...(c.backgroundImage.match(/rgba?\([^)]+\)/g)??[])])if(forbidden(color))found.push(`${n.tagName}.${n.className}${pseudo??''}: ${color}`);}}
  return [...new Set(found)];
 },mode);expect(leaks).toEqual([]);
 for(const img of await page.locator('img').all())expect(await img.evaluate(n=>getComputedStyle(n).filter)).toBe('none');
}
for(const mode of ['light','twilight'])for(const width of [320,390,768,1440,1920])test(`${mode==='light'?'Light':'Moonlight'} approved palette, responsive and axe at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:1000});await page.addInitScript(({key,mode})=>localStorage.setItem(key,mode),{key,mode});await page.goto('/');await expect(page.getByRole('switch',{name:'Moonlight appearance'})).toHaveAttribute('aria-checked',String(mode==='twilight'));await inspectPalette(page,mode);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 const start=await page.locator('#stillness-edit').evaluate(n=>({background:getComputedStyle(n).backgroundColor,before:getComputedStyle(n,'::before').backgroundImage,after:getComputedStyle(n,'::after').backgroundImage}));expect(start.background).toBe(mode==='light'?'rgb(28, 56, 43)':'rgb(11, 20, 38)');expect(start.before).toContain('linear-gradient');expect(start.after).toContain(mode==='light'?'rgb(28, 56, 43)':'rgb(20, 30, 54)');await page.locator('#stillness-edit').scrollIntoViewIfNeeded();expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze()).violations).toEqual([]);
});
for(const mode of ['light','twilight'])for(const route of ['/products','/collections/navratri-2026','/categories/ritual-essentials','/products/clay-festival-lamp','/cart','/checkout','/about','/demo-guide','/privacy','/account'])test(`${mode==='light'?'Light':'Moonlight'} surfaces and feedback on ${route}`,async({page})=>{
 await page.addInitScript(({key,mode})=>{localStorage.setItem(key,mode);localStorage.setItem('sacred-commerce-standalone-demo-cart-v1','{"SC-001":1}');},{key,mode});await page.goto(route);await expect(page.getByRole('link',{name:'Cart (1)',exact:true})).toBeVisible();await inspectPalette(page,mode);expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations).toEqual([]);
 if(route==='/products/clay-festival-lamp'){await page.getByRole('button',{name:'Add to demo cart'}).click();await expect(page.getByRole('status')).toContainText('2');await inspectPalette(page,mode);await page.getByRole('button',{name:'Add to demo cart'}).hover();await inspectPalette(page,mode);}
 if(route==='/checkout'){await page.getByLabel('Simulation outcome').selectOption('declined');await page.getByRole('button',{name:'Complete simulated purchase'}).click();await expect(page.getByRole('status')).toContainText('declined');await inspectPalette(page,mode);}
});
for(const mode of ['light','twilight'])test(`${mode==='light'?'Light':'Moonlight'} drawer palette and keyboard focus`,async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.addInitScript(({key,mode})=>localStorage.setItem(key,mode),{key,mode});await page.goto('/');await page.getByRole('button',{name:'Open shop menu'}).click();await inspectPalette(page,mode);expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);await page.keyboard.press('Escape');await expect(page.getByRole('button',{name:'Open shop menu'})).toBeFocused();
});
