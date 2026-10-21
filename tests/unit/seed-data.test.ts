import { describe, expect, it } from 'vitest';
import { catalogueSeed } from '../../prisma/seed-data';

describe('original demo catalogue fixtures', () => {
  it('provides twenty products, thirteen seasonal members and named acceptance fixtures', () => {
    expect(catalogueSeed).toHaveLength(20);
    expect(catalogueSeed.filter((item) => item.seasonal)).toHaveLength(13);
    expect(catalogueSeed.find((item) => item.slug === 'cotton-everyday-pouch'))
      .toMatchObject({ pricePaise: 34900, stock: 20 });
    expect(catalogueSeed.find((item) => item.slug === 'brass-wick-spoon')?.stock).toBe(0);
    expect(catalogueSeed.find((item) => item.slug === 'brass-table-bell')?.stock).toBe(1);
    expect(catalogueSeed.find((item) => item.slug === 'forest-cotton-stole'))
      .toMatchObject({ pricePaise: 80000, compareAtPricePaise: 100000 });
  });
});
