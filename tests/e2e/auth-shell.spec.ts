import { randomBytes } from 'node:crypto';
import { expect, test } from '@playwright/test';
test.use({ trace:'off',screenshot:'off',video:'off' });
test('header reflects sign-in and sign-out across navigation (UI-only intercepted Auth)',async ({ page }) => {
  let signedIn=false;
  await page.route('**/api/auth/session',route => route.fulfill({ status:signedIn ? 200 : 401,json:signedIn ? { data:{ actor:{ userId:'7eb42b00-73aa-4111-8000-000000000001',role:'CUSTOMER' } } } : { error:{ message:'Sign in' } } }));
  await page.route('**/api/auth/login',route => { signedIn=true; return route.fulfill({ json:{ data:{ next:'/' } } }); });
  await page.route('**/api/auth/logout',route => { signedIn=false; return route.fulfill({ json:{ data:{ signedOut:true } } }); });
  await page.goto('/login'); await page.getByLabel('Email').fill('customer@example.test'); await page.getByLabel('Password').fill(randomBytes(16).toString('hex'));
  await page.getByRole('button',{ name:'Sign in',exact:true }).click(); await expect(page).toHaveURL(/\/$/);
  await page.getByRole('button',{ name:'Sign out',exact:true }).click(); await expect(page).toHaveURL(/\/login$/);
  await expect(page.locator('.header-actions').getByRole('link',{ name:'Sign in',exact:true })).toBeVisible();
  await expect(page.getByRole('button',{ name:'Sign out',exact:true })).not.toBeVisible();
});
test('mobile account navigation closes the drawer and releases scroll',async ({ page }) => {
  await page.setViewportSize({ width:390,height:844 }); await page.goto('/');
  await page.getByRole('button',{ name:'Open navigation' }).click();
  const dialog=page.getByRole('dialog',{ name:'Explore Sacred Commerce' }); await dialog.getByRole('link',{ name:'Sign in',exact:true }).click();
  await expect(page).toHaveURL(/\/login$/); await expect(dialog).not.toBeVisible();
  await expect(page.getByLabel('Email')).toBeVisible(); expect(await page.evaluate(() => document.body.style.overflow)).not.toBe('hidden');
  await page.getByRole('button',{ name:'Open navigation' }).click();
  await dialog.getByRole('link',{ name:'Sign in',exact:true }).click(); await expect(dialog).not.toBeVisible();
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe('hidden');
});
test('same-path sign-out updates header presentation (UI-only intercepted Auth)',async ({ page }) => {
  let signedIn=true;
  await page.route('**/api/auth/session',route => route.fulfill({status:signedIn ? 200:401,json:signedIn ? {data:{actor:{userId:'7eb42b00-73aa-4111-8000-000000000001',role:'CUSTOMER'}}}:{error:{message:'Sign in'}}}));
  await page.route('**/api/auth/logout',route => { signedIn=false; return route.fulfill({json:{data:{signedOut:true}}}); });
  await page.goto('/login'); await page.getByRole('button',{name:'Sign out',exact:true}).click();
  await expect(page.locator('.header-actions').getByRole('link',{name:'Sign in',exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Sign out',exact:true})).not.toBeVisible();
});
test('mobile same-path sign-out refreshes desktop account after resize (UI-only intercepted Auth)',async ({ page }) => {
  let signedIn=true;
  await page.route('**/api/auth/session',route => route.fulfill({status:signedIn ? 200:401,json:signedIn ? {data:{actor:{userId:'7eb42b00-73aa-4111-8000-000000000001',role:'CUSTOMER'}}}:{error:{message:'Sign in'}}}));
  await page.route('**/api/auth/logout',route => { signedIn=false; return route.fulfill({json:{data:{signedOut:true}}}); });
  await page.setViewportSize({width:390,height:844}); await page.goto('/login');
  await page.getByRole('button',{name:'Open navigation'}).click(); const dialog=page.getByRole('dialog',{name:'Explore Sacred Commerce'});
  await dialog.getByRole('button',{name:'Sign out',exact:true}).click();
  await expect(dialog).not.toBeVisible();
  await page.setViewportSize({width:1440,height:900});
  await expect(page.locator('.header-actions').getByRole('link',{name:'Sign in',exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Sign out',exact:true})).not.toBeVisible();
});
