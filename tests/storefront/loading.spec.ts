import { Client } from 'pg';
import { expect,test } from '@playwright/test';
for (const scenario of [
  {path:'/products',table:'Product',label:'Loading products',ready:'Explore the catalogue'},
  {path:'/categories/books-gifts',table:'Product',label:'Loading products',ready:'Books & Gifts'},
  {path:'/products/forest-cotton-stole',table:'Category',label:'Loading product details',ready:'Forest Cotton Stole'},
]) test(`real delayed PostgreSQL shows accessible loading for ${scenario.path}`,async ({page})=>{
  const connectionString=process.env.STOREFRONT_LOCK_DATABASE_URL;
  if(!connectionString || process.env.STOREFRONT_TEST_OWNED!=='true' || new URL(connectionString).hostname!=='127.0.0.1') throw new Error('Use the owned disposable PostgreSQL runner.');
  const lock=new Client({connectionString}); await lock.connect();
  try {
    await lock.query('BEGIN'); await lock.query(`LOCK TABLE commerce."${scenario.table}" IN ACCESS EXCLUSIVE MODE`);
    await page.goto(scenario.path,{waitUntil:'commit',timeout:4000});
    await expect(page.getByRole('status',{name:scenario.label,exact:true})).toBeVisible();
    await page.screenshot({caret:'initial',path:`.local/t03-regression-screenshots/loading-${scenario.table.toLowerCase()}-${scenario.path.includes('categories') ? 'category':scenario.label==='Loading products' ? 'catalogue':'detail'}.png`});
    await lock.query('COMMIT');
    await expect(page.getByRole('status',{name:scenario.label,exact:true})).not.toBeVisible();
    await expect(page.getByRole('heading',{name:scenario.ready,exact:true,level:1})).toBeVisible();
    if(scenario.label==='Loading products') await expect(page.locator('.product-card').first()).toBeVisible();
    else await expect(page.locator('.detail-copy .selling-price')).toHaveText('₹800');
  } finally { await lock.query('ROLLBACK'); await lock.end(); }
});
