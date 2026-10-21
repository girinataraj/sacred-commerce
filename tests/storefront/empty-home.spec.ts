import { Client } from 'pg';
import { expect,test } from '@playwright/test';
test('real empty active catalogue gives honest home/catalogue recovery without invented cards',async ({page})=>{
  const connectionString=process.env.STOREFRONT_LOCK_DATABASE_URL;
  if(!connectionString || process.env.STOREFRONT_TEST_OWNED!=='true' || new URL(connectionString).hostname!=='127.0.0.1') throw new Error('Use the owned disposable PostgreSQL runner.');
  const owner=new Client({connectionString}); await owner.connect();
  const before=await owner.query<{id:string;active:boolean}>(`SELECT id,active FROM commerce."Product" WHERE sku LIKE 'SC-%'`);
  try {
    await owner.query('UPDATE commerce."Product" SET active=false WHERE id=ANY($1::uuid[])',[before.rows.map(row=>row.id)]);
    await page.goto('/'); await expect(page.getByRole('heading',{name:'No featured products yet'})).toBeVisible(); await expect(page.locator('.product-card')).toHaveCount(0);
    await page.getByRole('link',{name:'Browse all products',exact:true}).click(); await expect(page.getByRole('heading',{name:'No products match your choices'})).toBeVisible(); await expect(page.locator('.product-card')).toHaveCount(0);
    await page.screenshot({path:'.local/t03-regression-screenshots/empty-catalogue.png',fullPage:true});
  } finally { for(const row of before.rows) await owner.query('UPDATE commerce."Product" SET active=$2 WHERE id=$1',[row.id,row.active]); await owner.end(); }
});
