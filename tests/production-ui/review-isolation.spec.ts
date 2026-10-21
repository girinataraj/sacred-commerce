import { expect, test } from '@playwright/test';
test('production hides the component review and controlled fixtures',async ({ request }) => {
  const response=await request.get('/dev/components'); expect(response.status()).toBe(404);
  const html=await response.text(); expect(html).not.toContain('Development component review'); expect(html).not.toContain('Forest Cotton Stole');
});
test('production shell and sign-in remain available with local fonts and no remote font requests',async ({ page }) => {
  const remoteFonts:string[]=[]; page.on('request',request => { if (/fonts\.google|fonts\.gstatic/.test(request.url())) remoteFonts.push(request.url()); });
  await page.goto('/'); await expect(page.getByRole('heading',{ name:'Sacred Commerce',level:1 })).toBeVisible();
  await page.getByRole('link',{ name:'Sign in to the demo',exact:true }).first().click();
  await expect(page.getByRole('heading',{ name:'Sign in to Sacred Commerce' })).toBeVisible(); expect(remoteFonts).toEqual([]);
});
