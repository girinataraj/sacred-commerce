import { expect,test } from '@playwright/test';
test('seasonal dependency outage exposes safe retry rather than invented empty collection',async({page,request})=>{
  const response=await request.get('/api/collections/navratri-2026'); expect(response.status()).toBe(503); expect(JSON.stringify(await response.json())).not.toMatch(/DATABASE_URL|Prisma|postgresql|password/);
  await page.goto('/collections/navratri-2026?collection=navratri-2026&intent=gifting'); await expect(page.getByRole('heading',{name:'Seasonal collection could not be loaded'})).toBeVisible();
  await expect(page.getByRole('heading',{name:'This demo collection has no available listings yet'})).not.toBeVisible(); await page.getByRole('button',{name:'Retry catalogue',exact:true}).click(); await expect(page).toHaveURL(/collection=navratri-2026.*intent=gifting/);
});
