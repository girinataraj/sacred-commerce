import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir } from 'node:fs/promises';

const widths = [320,360,390,768,1024,1440,1920];
const key = 'sacred-commerce-standalone-demo-cart-v1';
const journeys = ['/', '/products', '/categories/natural-living', '/collections/navratri-2026', '/products/clay-festival-lamp', '/cart', '/checkout', '/login', '/about', '/demo-guide', '/privacy', '/products?q=not-a-product'];

test('cold-load content does not shift the visible footer', async ({ browser }, testInfo) => {
  const samples = [];
  for (const width of [390,1440]) for (const path of ['/','/products','/products/clay-festival-lamp','/checkout']) {
    const context = await browser.newContext({ viewport: { width, height: 1000 } });
    const page = await context.newPage();
    await page.addInitScript(() => {
      const state = window as Window & { storefrontCLS?: number };
      state.storefrontCLS = 0;
      new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          const shift = entry as PerformanceEntry & { value: number; hadRecentInput: boolean };
          if (!shift.hadRecentInput) state.storefrontCLS! += shift.value;
        }
      }).observe({ type: 'layout-shift', buffered: true });
    });
    await page.goto(`http://127.0.0.1:3111${path}`, { waitUntil: 'networkidle' });
    const cls = await page.evaluate(() => (window as Window & { storefrontCLS?: number }).storefrontCLS);
    expect(cls).toBeDefined();
    samples.push({ width, path, cls });
    await context.close();
  }
  await testInfo.attach('cold-load-layout-shift', { body: JSON.stringify(samples), contentType: 'application/json' });
  expect(Math.max(...samples.map(sample => sample.cls!))).toBeLessThan(0.1);
});

test('native select options remain readable without truncation at every width', async ({ page }) => {
  for (const width of widths) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/');
    await page.evaluate(storageKey => localStorage.setItem(storageKey, '{"SC-001":1}'), key);
    for (const path of ['/products','/checkout']) {
      await page.goto(path, { waitUntil: 'networkidle' });
      const clipped = await page.locator('main select').evaluateAll(selects => selects.flatMap(element => {
        const select = element as HTMLSelectElement;
        const style = getComputedStyle(select);
        const canvas = document.createElement('canvas').getContext('2d')!;
        canvas.font = style.font;
        const available = select.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight) - 20;
        return [...select.options].filter(option => canvas.measureText(option.text).width > available).map(option => option.text);
      }));
      expect(clipped, `${width}px ${path}`).toEqual([]);
    }
  }
});

for (const width of widths) {
  test(`${width}px complete journey layout and footer`, async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/');
    await page.evaluate(storageKey => localStorage.setItem(storageKey, '{"SC-001":2,"SC-007":1}'), key);
    const exceptions: string[] = [];
    page.on('pageerror', error => exceptions.push(error.message));
    const measurements = [];
    for (const path of journeys) {
      await page.goto(path, { waitUntil: 'networkidle' });
      await expect(page.locator('main h1')).toHaveCount(1);
      for (const image of await page.locator('img').all()) {
        await image.scrollIntoViewIfNeeded();
        await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
      }
      const result = await page.evaluate(() => {
        const visible = [...document.querySelectorAll<HTMLElement>('header a, header button, main input, main select, main textarea, main button, footer a')].filter(el => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden');
        return { overflow: document.documentElement.scrollWidth - innerWidth, outOfBounds: visible.filter(el => { const r = el.getBoundingClientRect(); return r.left < -1 || r.right > innerWidth + 1; }).map(el => el.textContent?.trim() || el.getAttribute('aria-label')) };
      });
      measurements.push({ path, ...result });
      expect(result, path).toEqual({ overflow: 0, outOfBounds: [] });
      if (['/','/checkout','/privacy'].includes(path)) {
        const axe = await new AxeBuilder({ page }).analyze();
        await testInfo.attach(`axe-${path.replaceAll('/','-')}`, { body: JSON.stringify(axe.violations), contentType: 'application/json' });
        expect(axe.violations, `${width}px ${path}`).toEqual([]);
      }
    }
    expect(exceptions).toEqual([]);
    await mkdir('docs/qa/final-storefront/responsive', { recursive: true });
    await page.locator('footer').screenshot({ path: `docs/qa/final-storefront/responsive/footer-${width}.png` });
    await testInfo.attach('layout-measurements', { body: JSON.stringify(measurements), contentType: 'application/json' });
  });
}

test('every footer destination renders its intended page', async ({ page }, testInfo) => {
  await page.goto('/');
  const paths = [...new Set(await page.locator('footer a').evaluateAll(links => links.map(link => link.getAttribute('href')!)))];
  const results = [];
  for (const path of paths) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    const h1 = await page.locator('main h1').innerText();
    expect(h1).not.toMatch(/unavailable|not found/i);
    if (['/about','/demo-guide','/privacy'].includes(path)) await expect(page.locator('.sc-info-sections section')).toHaveCount(path === '/about' ? 3 : 4);
    results.push({ path, status: response?.status(), h1 });
  }
  expect(paths.length).toBe(11);
  await testInfo.attach('footer-destinations', { body: JSON.stringify(results, null, 2), contentType: 'application/json' });
});

for (const path of ['/about','/demo-guide','/privacy','/products?q=not-a-product','/login','/this-page-does-not-exist']) {
  test(`axe and meaningful title: ${path}`, async ({ page }, testInfo) => {
    await page.goto(path);
    await expect(page).toHaveTitle(/Sacred Commerce/);
    const results = await new AxeBuilder({ page }).analyze();
    await testInfo.attach('axe', { body: JSON.stringify(results.violations), contentType: 'application/json' });
    expect(results.violations).toEqual([]);
    if (path.includes('does-not-exist')) await expect(page.getByRole('heading', { name: 'This listing is unavailable' })).toBeVisible();
  });
}

test('mobile menu traps keyboard focus, closes on Escape and navigates', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 812 });
  await page.goto('/');
  const trigger = page.getByRole('button', { name: 'Open shop menu' });
  await trigger.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', { name: 'Explore the shop' });
  await expect(dialog).toBeVisible();
  await expect(page.getByRole('button', { name: 'Close shop menu' })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(dialog.getByRole('link', { name: 'How this demo works' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Close shop menu' })).toBeFocused();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await dialog.getByRole('link', { name: 'Natural Living', exact: true }).click();
  await expect(page).toHaveURL(/categories\/natural-living/);
  await expect(dialog).not.toBeVisible();
});

test('checkout invalid field focus and decline/confirmation remain accessible', async ({ page }, testInfo) => {
  await page.goto('/');
  await page.evaluate(storageKey => localStorage.setItem(storageKey, '{"SC-001":1}'), key);
  await page.goto('/checkout');
  await page.getByLabel('Fictional email').fill('invalid');
  await page.getByRole('button', { name: 'Complete simulated purchase' }).click();
  await expect(page.getByLabel('Fictional email')).toBeFocused();
  await page.getByLabel('Fictional email').fill('fictional@example.test');
  await page.getByLabel('Simulation outcome').selectOption('declined');
  await page.getByRole('button', { name: 'Complete simulated purchase' }).click();
  await expect(page.getByRole('status')).toContainText('Simulated payment declined');
  const declined = await new AxeBuilder({ page }).analyze();
  await page.getByLabel('Simulation outcome').selectOption('success');
  await page.getByRole('button', { name: 'Complete simulated purchase' }).click();
  await expect(page.getByRole('heading', { name: 'Demo order confirmation' })).toBeVisible();
  const confirmed = await new AxeBuilder({ page }).analyze();
  await testInfo.attach('axe-states', { body: JSON.stringify({ declined: declined.violations, confirmed: confirmed.violations }), contentType: 'application/json' });
  expect([...declined.violations,...confirmed.violations]).toEqual([]);
});
