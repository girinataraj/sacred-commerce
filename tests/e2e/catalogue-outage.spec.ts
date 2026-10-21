import { expect,test } from '@playwright/test';
test('missing database is a service error with query-preserving retry, not zero matches',async ({page,request})=>{
  const response=await request.get('/api/products?q=cotton'); expect(response.status()).toBe(503);
  const body=await response.json(); expect(body.error.code).toBe('SERVICE_UNAVAILABLE'); expect(JSON.stringify(body)).not.toMatch(/DATABASE_URL|postgresql|Prisma|password/);
  await page.goto('/products?q=cotton&maxPricePaise=100000'); await expect(page.getByRole('heading',{name:'Products could not be loaded'})).toBeVisible();
  await expect(page.getByRole('heading',{name:'No products match your choices'})).not.toBeVisible();
  await page.getByRole('button',{name:'Retry catalogue',exact:true}).click(); await expect(page).toHaveURL(/q=cotton.*maxPricePaise=100000/);
  await expect(page.getByRole('heading',{name:'Products could not be loaded'})).toBeVisible();
});
test('invalid catalogue URL provides safe recovery without exposing data',async ({page,request})=>{
  expect((await request.get('/api/products?minPricePaise=50000&maxPricePaise=100')).status()).toBe(400);
  await page.goto('/products?minPricePaise=50000&maxPricePaise=100'); await expect(page.getByRole('heading',{name:'Check your filters'})).toBeVisible();
  await page.getByRole('link',{name:'Clear invalid filters'}).click(); await expect(page).toHaveURL(/\/products$/);
});
