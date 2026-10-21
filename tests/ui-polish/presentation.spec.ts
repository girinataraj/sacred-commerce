import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { catalogueSeed } from '../../prisma/seed-data';
import { createHash } from 'node:crypto';
import { mkdir } from 'node:fs/promises';

test('catalogue serves twenty distinct decoded local product illustrations', async ({ page, request }) => {
  await page.goto('/products');
  const images = page.locator('.product-card img');
  await expect(images).toHaveCount(20);
  const sources: string[] = [];
  for (const image of await images.all()) {
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 0)).toBe(true);
    const source = await image.getAttribute('src');
    const url = new URL(source!, page.url());
    const asset = url.pathname === '/_next/image' ? url.searchParams.get('url')! : url.pathname;
    expect(asset).toMatch(/^\/products\/[a-z-]+\.webp$/);
    expect(await image.getAttribute('alt')).toMatch(/illustration.*: .{20,}/i);
    sources.push(asset);
  }
  expect(new Set(sources).size).toBe(20);
  const digests = [];
  for (const source of sources) {
    const response = await request.get(source);
    expect(response.status()).toBe(200);
    const body = await response.body();
    expect(body.length).toBeLessThan(160_000);
    digests.push(createHash('sha256').update(body).digest('hex'));
  }
  expect(new Set(digests).size).toBe(20);
});

test('SC-QA-001 disclosure is included in the banner landmark', async ({ page }) => {
  await page.goto('/products');
  await expect(page.getByRole('banner').getByText(/SELF-CONTAINED DEMO/)).toBeVisible();
  const result = await new AxeBuilder({ page }).withRules(['region']).analyze();
  expect(result.violations).toEqual([]);
});

for (const viewport of [
  { name: 'small-mobile', width: 320, height: 812 },
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 1000 },
]) {
  test(`${viewport.name} readable aligned cards and structured filters`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/products');
    const layout = await page.evaluate(() => {
      const cards = [...document.querySelectorAll<HTMLElement>('.product-card')];
      return {
        overflow: document.documentElement.scrollWidth > innerWidth,
        titleSizes: cards.map(card => parseFloat(getComputedStyle(card.querySelector('h3')!).fontSize)),
        rows: cards.map(card => ({
          top: Math.round(card.getBoundingClientRect().top),
          actionBottom: Math.round(card.querySelector('button')!.getBoundingClientRect().bottom),
        })),
      };
    });
    expect(layout.overflow).toBe(false);
    expect(Math.min(...layout.titleSizes)).toBeGreaterThanOrEqual(16);
    for (const rowTop of new Set(layout.rows.map(row => row.top))) {
      const bottoms = layout.rows.filter(row => row.top === rowTop).map(row => row.actionBottom);
      expect(Math.max(...bottoms) - Math.min(...bottoms)).toBeLessThanOrEqual(1);
    }
    await page.getByLabel('Search', { exact: true }).fill('cotton');
    await page.getByLabel('Category').selectOption('natural-living');
    await page.getByLabel('In stock only').check();
    await page.getByRole('button', { name: 'Find products' }).click();
    await expect(page.locator('.product-card')).toHaveCount(4);
    await page.getByRole('link', { name: 'Reset', exact: true }).click();
    await expect(page.locator('.product-card')).toHaveCount(20);
    await expect(page.getByLabel('Search', { exact: true })).toHaveValue('');
    await expect(page.getByLabel('Category')).toHaveValue('');
    await mkdir('docs/qa/polish/screenshots', { recursive: true });
    for (const image of await page.locator('.product-card img').all()) {
      await image.scrollIntoViewIfNeeded();
      await expect.poll(() => image.evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 0)).toBe(true);
    }
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({ path: `docs/qa/polish/screenshots/after-${viewport.name}.png`, fullPage: true });
    await page.screenshot({ path: `docs/qa/polish/screenshots/after-${viewport.name}-viewport.png` });
    await page.locator('.product-grid').screenshot({ path: `docs/qa/polish/screenshots/after-${viewport.name}-grid.png` });
  });
}

test('every detail page uses its matching catalogue illustration', async ({ page }) => {
  await page.goto('/products');
  const catalogue = await page.locator('.product-card').evaluateAll(cards => cards.map(card => ({
    href: card.querySelector('h3 a')!.getAttribute('href'),
    alt: card.querySelector('img')!.getAttribute('alt'),
  })));
  for (const product of catalogueSeed) {
    await page.goto(`/products/${product.slug}`);
    const image = page.locator('.demo-detail img');
    await expect(image).toHaveAttribute('alt', catalogue.find(card => card.href === `/products/${product.slug}`)!.alt!);
    await expect.poll(() => image.evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 0)).toBe(true);
  }
});

for (const path of ['/', '/products', '/products/clay-festival-lamp', '/cart', '/checkout']) {
  test(`axe zero violations for ${path}`, async ({ page }, testInfo) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('sacred-commerce-standalone-demo-cart-v1', '{"SC-001":1}'));
    await page.goto(path);
    const result = await new AxeBuilder({ page }).analyze();
    await testInfo.attach('axe', { body: JSON.stringify(result.violations, null, 2), contentType: 'application/json' });
    expect(result.violations).toEqual([]);
  });
}
