import { test, expect, type Page, type TestInfo } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { catalogueSeed } from '../../prisma/seed-data';

const publicPages = [
  ['home', '/'],
  ['products', '/products'],
  ['seasonal collection', '/collections/navratri-2026'],
  ['ritual category', '/categories/ritual-essentials'],
  ['natural category', '/categories/natural-living'],
  ['home category', '/categories/home-craft'],
  ['books category', '/categories/books-gifts'],
  ['cart', '/cart'],
  ['checkout', '/checkout'],
  ['login boundary', '/login'],
  ['account boundary', '/account'],
  ['admin boundary', '/admin'],
  ['orders boundary', '/orders'],
] as const;

const storageKey = 'sacred-commerce-standalone-demo-cart-v1';

function captureRuntimeProblems(page: Page) {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const failedRequests: string[] = [];
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('requestfailed', request => {
    const failure = request.failure()?.errorText ?? 'unknown failure';
    const url = request.url();
    // Next.js may cancel speculative RSC prefetches when the document settles or
    // a test context closes. The browser reports these as ERR_ABORTED even though
    // the visible navigation and assets completed successfully.
    if (failure === 'net::ERR_ABORTED' && url.includes('_rsc=')) return;
    failedRequests.push(`${request.method()} ${url} :: ${failure}`);
  });
  return { consoleErrors, pageErrors, failedRequests };
}

async function expectHealthyDocument(page: Page) {
  await expect(page.locator('main#main-content')).toBeVisible();
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.getByText(/SELF-CONTAINED DEMO/)).toBeVisible();
  await expect(page.locator('img')).toHaveCount(await page.locator('img').count());
  // Below-fold images are intentionally lazy; verify actual decoding after exposure.
  for (const image of await page.locator('img').all()) {
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 0)).toBe(true);
  }
  const brokenImages = await page.locator('img').evaluateAll(images =>
    images.filter(image => !(image as HTMLImageElement).complete || (image as HTMLImageElement).naturalWidth === 0)
      .map(image => (image as HTMLImageElement).currentSrc),
  );
  expect(brokenImages, 'Images with no decoded pixels').toEqual([]);
}

async function clearCart(page: Page) {
  await page.goto('/');
  await page.evaluate(key => localStorage.removeItem(key), storageKey);
  await page.reload();
}

async function seedCart(page: Page, cart: Record<string, number> = { 'SC-001': 1 }) {
  await page.goto('/');
  await page.evaluate(([key, value]) => localStorage.setItem(key, value), [storageKey, JSON.stringify(cart)]);
  await page.reload();
}

async function attachJson(testInfo: TestInfo, name: string, value: unknown) {
  await testInfo.attach(name, { body: Buffer.from(JSON.stringify(value, null, 2)), contentType: 'application/json' });
}

test.describe('public-page smoke, assets, and runtime health', () => {
  for (const [name, path] of publicPages) {
    test(`${name} renders without browser or network errors`, async ({ page }) => {
      const problems = captureRuntimeProblems(page);
      const response = await page.goto(path, { waitUntil: 'networkidle' });
      expect(response?.status(), `${path} document status`).toBe(200);
      await expectHealthyDocument(page);
      expect(problems.consoleErrors, 'Console errors').toEqual([]);
      expect(problems.pageErrors, 'Uncaught page exceptions').toEqual([]);
      expect(problems.failedRequests, 'Failed network requests').toEqual([]);
    });
  }

  test('navigation links and typography are usable', async ({ page }) => {
    await page.goto('/');
    const nav = page.getByRole('navigation', { name: 'Shop navigation' });
    await expect(nav.getByRole('link', { name: 'Shop all' })).toHaveAttribute('href', '/products');
    await expect(nav.getByRole('link', { name: 'Navratri 2026' })).toHaveAttribute('href', '/collections/navratri-2026');
    const fonts = await page.evaluate(() => ({
      status: document.fonts.status,
      body: getComputedStyle(document.body).fontFamily,
      heading: getComputedStyle(document.querySelector('h1')!).fontFamily,
    }));
    expect(fonts.status).toBe('loaded');
    expect(fonts.body).not.toBe(fonts.heading);
    expect(fonts.body.toLowerCase()).toContain('body');
    expect(fonts.heading.toLowerCase()).toContain('editorial');
  });

  test('all discovered internal links return a non-error document', async ({ page, request }, testInfo) => {
    const discovered = new Set<string>();
    for (const path of ['/', '/products', '/collections/navratri-2026']) {
      await page.goto(path);
      for (const href of await page.locator('a[href]').evaluateAll(links => links.map(link => (link as HTMLAnchorElement).href))) {
        const url = new URL(href);
        if (url.origin === new URL(page.url()).origin && !url.hash) discovered.add(`${url.pathname}${url.search}`);
      }
    }
    const results: Array<{ path: string; status: number }> = [];
    for (const path of [...discovered].sort()) {
      const response = await request.get(path);
      results.push({ path, status: response.status() });
    }
    await attachJson(testInfo, 'internal-link-statuses', results);
    expect(results.filter(result => result.status >= 400), 'Broken internal links').toEqual([]);
  });
});

test.describe('all 20 product detail pages', () => {
  for (const product of catalogueSeed) {
    test(`${product.name} detail is complete`, async ({ page }) => {
      const problems = captureRuntimeProblems(page);
      const response = await page.goto(`/products/${product.slug}`, { waitUntil: 'networkidle' });
      expect(response?.status()).toBe(200);
      await expect(page.getByRole('heading', { level: 1, name: product.name })).toBeVisible();
      await expect(page.getByText(product.material, { exact: true })).toBeVisible();
      await expect(page.getByText(product.dimensions, { exact: true })).toBeVisible();
      await expect(page.getByRole('img', { name: `Original demo illustration for ${product.name}` })).toBeVisible();
      const add = page.getByRole('button', { name: 'Add to demo cart' });
      if (product.stock === 0) await expect(add).toBeDisabled();
      else await expect(add).toBeEnabled();
      expect(problems.consoleErrors).toEqual([]);
      expect(problems.pageErrors).toEqual([]);
      expect(problems.failedRequests).toEqual([]);
    });
  }
});

test.describe('catalogue search, filters, and sorting', () => {
  test.beforeEach(async ({ page }) => { await clearCart(page); });

  test('search finds a matching product', async ({ page }) => {
    await page.goto('/products');
    await page.getByLabel('Search').fill('neem');
    await page.getByRole('button', { name: 'Find products' }).click();
    await expect(page.getByRole('heading', { level: 2, name: '1 original offerings' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Neem Wood Comb', exact: true })).toBeVisible();
  });

  test('category and in-stock filters compose', async ({ page }) => {
    await page.goto('/products');
    await page.getByLabel('Category').selectOption('ritual-essentials');
    await page.getByLabel('In stock only').check();
    await page.getByRole('button', { name: 'Find products' }).click();
    await expect(page.getByRole('heading', { level: 2, name: '4 original offerings' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Brass Wick Spoon' })).toHaveCount(0);
  });

  test('budget and ascending sort constrain and order results', async ({ page }) => {
    await page.goto('/products');
    await page.getByLabel('Budget up to ₹').fill('300');
    await page.getByLabel('Sort').selectOption('low');
    await page.getByRole('button', { name: 'Find products' }).click();
    // A streamed native GET navigation can return before its product list arrives.
    await expect(page.getByRole('heading', { level: 2, name: '8 original offerings' })).toBeVisible();
    await expect(page.locator('.product-card .selling-price')).toHaveCount(8);
    const prices = await page.locator('.product-card .selling-price').allTextContents();
    const values = prices.map(value => Number(value.replace(/[^0-9.]/g, '')));
    expect(values.length).toBeGreaterThan(1);
    expect(values.every(value => value <= 300)).toBe(true);
    expect(values).toEqual([...values].sort((a, b) => a - b));
  });

  test('high-to-low sort works', async ({ page }) => {
    await page.goto('/products?sort=high');
    const prices = (await page.locator('.product-card .selling-price').allTextContents()).map(value => Number(value.replace(/[^0-9.]/g, '')));
    expect(prices).toEqual([...prices].sort((a, b) => b - a));
  });

  test('empty result and reset affordance are shown', async ({ page }) => {
    await page.goto('/products?q=no-such-sacred-product');
    await expect(page.getByRole('heading', { level: 2, name: '0 original offerings' })).toBeVisible();
    await expect(page.getByText('No matching products. Try another search or reset the filters.')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Reset' })).toHaveAttribute('href', '/products');
  });
});

test.describe('cart stock rules and persistence', () => {
  test.beforeEach(async ({ page }) => { await clearCart(page); });

  test('add, refresh persistence, update, remove, and clear all work', async ({ page }) => {
    await page.goto('/products/clay-festival-lamp');
    await page.getByRole('button', { name: 'Add to demo cart' }).click();
    await expect(page.getByRole('link', { name: 'Cart (1)' })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('link', { name: 'Cart (1)' })).toBeVisible();
    await page.getByRole('link', { name: 'Cart (1)' }).click();
    await page.getByRole('button', { name: 'Increase Clay Festival Lamp' }).click();
    await expect(page.getByLabel('Quantity for Clay Festival Lamp')).toHaveValue('2');
    await page.getByRole('button', { name: 'Decrease Clay Festival Lamp' }).click();
    await expect(page.getByLabel('Quantity for Clay Festival Lamp')).toHaveValue('1');
    await page.getByRole('button', { name: 'Remove' }).click();
    await expect(page.getByRole('heading', { level: 2, name: 'Your cart is empty' })).toBeVisible();

    await seedCart(page, { 'SC-001': 1, 'SC-002': 1 });
    await page.goto('/cart');
    await page.getByRole('button', { name: 'Clear cart' }).click();
    await expect(page.getByRole('heading', { level: 2, name: 'Your cart is empty' })).toBeVisible();
  });

  test('maximum stock cannot be exceeded', async ({ page }) => {
    await seedCart(page, { 'SC-002': 1 });
    await page.goto('/cart');
    await expect(page.getByLabel('Quantity for Brass Table Bell')).toHaveValue('1');
    await expect(page.getByRole('button', { name: 'Increase Brass Table Bell' })).toBeDisabled();
    await page.getByLabel('Quantity for Brass Table Bell').fill('2');
    await expect(page.getByText('Choose a whole quantity between 1 and the available demo stock.')).toBeVisible();
    await page.reload();
    await expect(page.getByLabel('Quantity for Brass Table Bell')).toHaveValue('1');
  });

  test('stale over-stock local data is capped and unavailable product is excluded', async ({ page }) => {
    await seedCart(page, { 'SC-001': 999, 'SC-004': 1 });
    await page.goto('/cart');
    await expect(page.getByLabel('Quantity for Clay Festival Lamp')).toHaveValue('25');
    await expect(page.getByRole('link', { name: 'Brass Wick Spoon' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Increase Clay Festival Lamp' })).toBeDisabled();
  });
});

test.describe('simulated checkout', () => {
  test.beforeEach(async ({ page }) => { await seedCart(page); });

  test('native validation blocks incomplete checkout', async ({ page }) => {
    await page.goto('/checkout');
    const name = page.getByLabel('Fictional recipient');
    await name.fill('');
    await page.getByRole('button', { name: 'Complete simulated purchase' }).click();
    expect(await name.evaluate((input: HTMLInputElement) => input.validity.valueMissing)).toBe(true);
    await expect(page.getByRole('heading', { name: 'Demo order confirmation' })).toHaveCount(0);
  });

  test('decline preserves the cart', async ({ page }) => {
    await page.goto('/checkout');
    await page.getByLabel('Simulation outcome').selectOption('declined');
    await page.getByRole('button', { name: 'Complete simulated purchase' }).click();
    await expect(page.getByText(/Simulated payment declined/)).toBeVisible();
    await expect(page.getByRole('link', { name: 'Cart (1)' })).toBeVisible();
  });

  test('success confirms without a real transaction and clears cart', async ({ page }) => {
    await page.goto('/checkout');
    await page.getByRole('button', { name: 'Complete simulated purchase' }).click();
    await expect(page.getByRole('heading', { name: 'Demo order confirmation' })).toBeVisible();
    await expect(page.getByText(/No payment taken, no stock changed, and no order saved/)).toBeVisible();
    await expect(page.getByText(/^Simulation reference: DEMO-[A-Z0-9]{8}$/)).toBeVisible();
    await expect(page.getByRole('link', { name: 'Cart (0)' })).toBeVisible();
  });
});

test.describe('responsive and keyboard behaviour', () => {
  for (const viewport of [
    { name: 'mobile', width: 390, height: 844 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1440, height: 900 },
  ]) {
    test(`${viewport.name} catalogue has no horizontal page overflow`, async ({ page }, testInfo) => {
      await page.setViewportSize(viewport);
      await page.goto('/products');
      await expect(page.locator('h1')).toBeVisible();
      const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
      await attachJson(testInfo, `${viewport.name}-dimensions`, dimensions);
      expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
      await page.screenshot({ path: testInfo.outputPath(`${viewport.name}-catalogue.png`), fullPage: true });
    });
  }

  test('keyboard users can reveal and activate skip navigation', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Skip to content' });
    await expect(skip).toBeFocused();
    await expect(skip).toBeVisible();
    await skip.press('Enter');
    await expect(page).toHaveURL(/#main-content$/);
  });
});

test.describe('automated accessibility', () => {
  for (const [name, path] of [
    ['home', '/'],
    ['catalogue', '/products'],
    ['product detail', '/products/clay-festival-lamp'],
    ['cart', '/cart'],
    ['checkout', '/checkout'],
  ] as const) {
    test(`${name} has no serious or critical axe violations`, async ({ page }, testInfo) => {
      if (path === '/cart' || path === '/checkout') await seedCart(page);
      await page.goto(path);
      const results = await new AxeBuilder({ page }).analyze();
      await attachJson(testInfo, `${name}-axe`, results.violations);
      expect(results.violations.filter(violation => ['serious', 'critical'].includes(violation.impact ?? '')), 'Serious/critical axe violations').toEqual([]);
    });
  }
});

test.describe('demo security boundary and basic performance', () => {
  test('backend APIs are read-only unavailable and protected pages remain guest-only', async ({ request, page }, testInfo) => {
    const paths = ['/api', '/api/products', '/api/cart', '/api/auth/session', '/api/admin', '/api/orders'];
    const results = [];
    for (const path of paths) {
      const response = await request.get(path);
      results.push({ path, status: response.status(), body: await response.text() });
    }
    await attachJson(testInfo, 'backend-boundary', results);
    expect(results.every(result => result.status === 503)).toBe(true);
    expect(results.every(result => result.body.includes('disabled'))).toBe(true);
    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: 'Guest demo experience' })).toBeVisible();
    await expect(page.getByText(/authentication, customer orders and admin operations are disabled/i)).toBeVisible();
  });

  test('key pages meet a generous loading threshold and expose navigation timing', async ({ page }, testInfo) => {
    const observations = [];
    for (const path of ['/', '/products', '/products/clay-festival-lamp', '/cart']) {
      const started = Date.now();
      await page.goto(path, { waitUntil: 'networkidle' });
      const wallMs = Date.now() - started;
      const timing = await page.evaluate(() => {
        const entry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return { responseStart: entry.responseStart, domContentLoaded: entry.domContentLoadedEventEnd, load: entry.loadEventEnd };
      });
      observations.push({ path, wallMs, ...timing });
    }
    await attachJson(testInfo, 'performance-observations', observations);
    expect(Math.max(...observations.map(item => item.wallMs))).toBeLessThan(10_000);
  });
});
