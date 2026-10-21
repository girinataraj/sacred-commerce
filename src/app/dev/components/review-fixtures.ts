import type { ProductDTO } from '../../../features/catalogue/types';
import { catalogueSeed } from '../../../../prisma/seed-data';
const slugs=['forest-cotton-stole','clay-festival-lamp','brass-table-bell','brass-wick-spoon'];
export const reviewProducts:readonly ProductDTO[]=slugs.map((slug,index) => {
  const seed=catalogueSeed.find(record => record.slug===slug)!;
  const savings=seed.compareAtPricePaise ? seed.compareAtPricePaise-seed.pricePaise : null;
  return { ...seed,id:`7eb42b00-73aa-4111-8000-00000000010${index}`,category:{ id:seed.categorySlug==='natural-living' ? '7eb42b00-73aa-4111-8000-000000000200' : '7eb42b00-73aa-4111-8000-000000000201',slug:seed.categorySlug,name:seed.categorySlug.replaceAll('-',' ') },version:0,active:true,featured:true,imagePath:'/products/demo-placeholder.svg',imageAlt:'Original botanical demo illustration, not a product photograph.',collectionSlugs:seed.seasonal ? ['navratri-2026'] : [],savingsPaise:savings,savingsPercent:savings && seed.compareAtPricePaise ? Math.floor(savings*100/seed.compareAtPricePaise) : null,availability:seed.stock===0 ? 'Out of stock' : seed.stock<=3 ? `Only ${seed.stock} available` : 'In stock' };
});
