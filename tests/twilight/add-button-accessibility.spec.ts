import {test,expect} from '@playwright/test';

for(const mode of ['light','twilight'])for(const variant of [
 {name:'homepage',route:'/',selector:'[data-product-id="SC-001"] .sc-add-button',label:'Add to Cart'},
 {name:'product detail',route:'/products/clay-festival-lamp',selector:'main .sc-add-button',label:'Add to demo cart'},
])test(`${mode} ${variant.name} accessible name follows normal and Added labels`,async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.addInitScript(theme=>localStorage.setItem('sacred-commerce-appearance-v1',theme),mode);
 await page.goto(variant.route);
 const add=page.locator(variant.selector);
 await expect(add).toHaveText(variant.label);
 await expect(add).toHaveAccessibleName(variant.label);
 await add.click();
 await expect(add).toHaveText('Added ✓');
 await expect(add).toHaveAccessibleName('Added ✓',{timeout:1000});
 await expect(add).toBeFocused();
 const status=page.getByRole('status');
 await expect(status).toHaveText('Clay Festival Lamp: 1 in your demo cart.');
 await expect(status).toHaveAttribute('aria-live','polite');
 await expect(status).toHaveAttribute('aria-atomic','true');
 await page.waitForTimeout(1100);
 await expect(add).toHaveAccessibleName('Added ✓');
 await add.click();
 await expect(status).toHaveText('Clay Festival Lamp: 2 in your demo cart.');
 await page.waitForTimeout(1100);
 await expect(add).toHaveText('Added ✓');
 await expect(add).toHaveAccessibleName('Added ✓');
 await expect(add).toHaveText(variant.label,{timeout:2000});
 await expect(add).toHaveAccessibleName(variant.label);
 await expect(page.locator('.sc-floating-count')).toHaveText('2');
 await page.goto('/cart');
 await expect(page.getByLabel('Quantity for Clay Festival Lamp')).toHaveValue('2');
 await expect(page.getByText('Total: ₹398.00',{exact:true})).toBeVisible();
});
