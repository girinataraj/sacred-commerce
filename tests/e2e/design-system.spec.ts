import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
test('development component review exposes working controls and truthful states',async ({ page }) => {
  await page.goto('/dev/components');
  await expect(page.getByRole('heading',{ name:'A considered beginning',level:1 })).toBeVisible();
  await expect(page.getByText('Demo reference price',{ exact:false }).first()).toBeVisible();
  await page.getByRole('searchbox',{ name:'Review product search' }).fill('cotton');
  await page.getByRole('button',{ name:'Submit review product search' }).click();
  await expect(page.getByRole('status').filter({ hasText:'Review search submitted: cotton' })).toBeVisible();
  await page.getByRole('button',{ name:'Increase review quantity' }).click();
  await expect(page.getByRole('spinbutton',{ name:'Review quantity' })).toHaveValue('2');
  await expect(page.getByRole('button',{ name:'Unavailable action' })).toBeDisabled();
  await page.getByRole('button',{ name:'Clear example filters' }).click();
  await expect(page.getByRole('status').filter({ hasText:'Example filters cleared.' })).toBeVisible();
  await page.getByRole('button',{ name:'Retry example' }).click();
  await expect(page.getByRole('status').filter({ hasText:'Example retry requested.' })).toBeVisible();
});
for (const width of [360,390,768,1440]) test(`responsive visual and accessibility review at ${width}px`,async ({ page }) => {
  await page.setViewportSize({ width,height:900 }); await page.goto('/dev/components');
  if (width>=1024) await expect(page.getByRole('button',{ name:'Open navigation' })).not.toBeVisible();
  else await expect(page.getByRole('button',{ name:'Open navigation' })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await page.locator('.fallback-example').scrollIntoViewIfNeeded();
  await expect(page.getByText('Image unavailable',{ exact:true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  const failures=await page.locator('.site-header a[href],.site-header button,.site-header input,#main-content a[href],#main-content button,#main-content input,#main-content select,.site-footer a[href]').evaluateAll(elements => elements.filter(el => { const r=el.getBoundingClientRect(); return r.width>0 && r.height>0 && (r.width<43.5 || r.height<43.5); }).map(el => ({ element:el.tagName,name:el.textContent?.trim() || el.getAttribute('aria-label'),width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height })));
  expect(failures).toEqual([]);
  const a11y=await new AxeBuilder({ page }).include('#main-content').include('.site-header').include('.site-footer').withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
  expect(a11y.violations).toEqual([]);
  await page.locator('#main-content').focus();
  await page.evaluate(() => window.scrollTo(0,0));
  await page.screenshot({ path:`.local/design-system-screenshots/first-view-${width}.png` });
  await page.screenshot({ path:`.local/design-system-screenshots/review-${width}.png`,fullPage:true });
  await page.locator('#product-states').screenshot({ path:`.local/design-system-screenshots/products-${width}.png` });
});
test('invalid quantity is preserved as a local draft with an explanatory error',async ({ page }) => {
  await page.goto('/dev/components'); const field=page.getByRole('spinbutton',{ name:'Review quantity' });
  await field.fill('-1'); await expect(field).toHaveValue('-1'); await expect(field).toHaveAttribute('aria-invalid','true');
  await expect(page.getByText('Enter a whole quantity from 1 to 10. This draft has not been saved.')).toBeVisible();
  await expect(page.getByRole('button',{ name:'Increase review quantity' })).toBeDisabled();
});
test('image source changes recover failures and reject disallowed replacements without a request',async ({ page }) => {
  const disallowed:string[]=[]; page.on('request',request => { if (request.url().includes('example.invalid')) disallowed.push(request.url()); });
  await page.goto('/dev/components'); const example=page.locator('.fallback-example'); await example.scrollIntoViewIfNeeded();
  await expect(example.getByText('Image unavailable',{ exact:true })).toBeVisible();
  await page.getByRole('button',{ name:'Recover review image' }).click(); await expect(example.locator('img')).toBeVisible();
  await page.getByRole('button',{ name:'Review disallowed image' }).click(); await expect(example.getByText('Image unavailable',{ exact:true })).toBeVisible();
  expect(disallowed).toEqual([]);
});
test('drawer Apply and backdrop close restore focus; reduced motion removes animation',async ({ page }) => {
  await page.setViewportSize({ width:768,height:900 }); await page.emulateMedia({ reducedMotion:'reduce' }); await page.goto('/dev/components');
  const trigger=page.getByRole('button',{ name:'Open review drawer' }); await trigger.click();
  const dialog=page.getByRole('dialog',{ name:'Review filter drawer' }); await expect(dialog).toBeVisible();
  expect((await new AxeBuilder({ page }).include('dialog[open]').withTags(['wcag2a','wcag2aa']).analyze()).violations).toEqual([]);
  await page.getByRole('button',{ name:'Apply example choices' }).click(); await expect(trigger).toBeFocused();
  await trigger.click(); await page.mouse.click(8,200); await expect(dialog).not.toBeVisible(); await expect(trigger).toBeFocused();
  expect(await page.locator('.skeleton').first().evaluate(el => getComputedStyle(el).animationName)).toBe('none');
});
test('mobile drawer contains focus, closes with Escape and restores its trigger',async ({ page }) => {
  await page.setViewportSize({ width:390,height:844 });
  await page.goto('/dev/components');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link',{ name:'Skip to content' })).toBeFocused();
  await page.keyboard.press('Enter'); await expect(page.locator('#main-content')).toBeFocused();
  const trigger=page.getByRole('button',{ name:'Open navigation' });
  await trigger.click();
  const dialog=page.getByRole('dialog',{ name:'Explore Sacred Commerce' });
  await expect(dialog).toBeVisible();
  for (let index=0; index<9; index++) { await page.keyboard.press('Tab'); expect(await dialog.evaluate(el => el.contains(document.activeElement))).toBe(true); }
  for (let index=0; index<9; index++) { await page.keyboard.press('Shift+Tab'); expect(await dialog.evaluate(el => el.contains(document.activeElement))).toBe(true); }
  await page.keyboard.press('Escape'); await expect(dialog).not.toBeVisible(); await expect(trigger).toBeFocused();
  expect(await trigger.evaluate(el => getComputedStyle(el).outlineWidth)).toBe('2px');
});
