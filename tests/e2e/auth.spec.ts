import { randomBytes } from 'node:crypto';
import { expect, test } from '@playwright/test';
test.use({ trace: 'off', screenshot: 'off', video: 'off' });
test('login shows synthetic-account disclosure and useful field validation', async ({ page }) => {
  await page.goto('/login?next=https://evil.test');
  await expect(page.getByRole('heading',{ name:'Sign in to Sacred Commerce' })).toBeVisible();
  await expect(page.getByText('Use only your privately provided demo account.')).toBeVisible();
  await page.getByRole('button',{ name:'Sign in',exact:true }).click();
  await expect(page.locator('#login-error')).toContainText('Enter a valid email and password');
});
test('missing configuration fails closed with recovery message', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('customer@example.test');
  await page.getByLabel('Password').fill(randomBytes(16).toString('hex'));
  await page.getByRole('button',{ name:'Sign in',exact:true }).click();
  await expect(page.locator('#login-error')).toContainText('temporarily unavailable');
  await expect(page).toHaveURL(/\/login$/);
});
test('auth routes reject cross-origin, malformed and privileged payloads before provider access', async ({ request }) => {
  const base = 'http://127.0.0.1:3100';
  expect((await request.post('/api/auth/login',{ headers:{ Origin:'https://evil.test' }, data:{} })).status()).toBe(403);
  expect((await request.post('/api/auth/logout',{ headers:{ Origin:base,'Content-Type':'text/plain' }, data:'{}' })).status()).toBe(415);
  expect((await request.post('/api/auth/login',{ headers:{ Origin:base }, data:{ email:'customer@example.test',password:randomBytes(16).toString('hex'),role:'ADMIN' } })).status()).toBe(422);
});
test('protected identity endpoints reveal no identity when configuration is missing', async ({ request }) => {
  for (const path of ['/api/auth/session','/api/auth/admin-access']) {
    const r = await request.get(path);
    expect(r.status()).toBe(503);
    expect(r.headers()['cache-control']).toContain('no-store');
    expect(await r.text()).not.toMatch(/DATABASE_URL|postgresql|password|stack|sb_secret/);
  }
});
test('sign-out UI completes navigation (UI-only intercepted session)', async ({ page }) => {
  await page.route('**/api/auth/session',route => route.fulfill({ json:{ data:{ actor:{ userId:'7eb42b00-73aa-4111-8000-000000000001',role:'CUSTOMER' } } } }));
  await page.route('**/api/auth/logout',route => route.fulfill({ json:{ data:{ signedOut:true } } }));
  await page.goto('/');
  await page.getByRole('button',{ name:'Sign out',exact:true }).click();
  await expect(page).toHaveURL(/\/login$/);
});
test('sign-out UI exposes recovery on failure (UI-only intercepted session)', async ({ page }) => {
  await page.route('**/api/auth/session',route => route.fulfill({ json:{ data:{ actor:{ userId:'7eb42b00-73aa-4111-8000-000000000001',role:'CUSTOMER' } } } }));
  await page.route('**/api/auth/logout',route => route.fulfill({ status:503,json:{ error:{ message:'Service unavailable' } } }));
  await page.goto('/');
  await page.getByRole('button',{ name:'Sign out',exact:true }).click();
  await expect(page.getByText('Sign-out could not be completed. Please try again.')).toBeVisible();
});
