'use client';

import Link from 'next/link';
import type { SeedProduct } from '../../../prisma/seed-data';
import { AvailabilityLabel, PriceBlock, ProductImage } from '../../components/ui/product-card';
import { demoCategories, type DemoCart } from './model';
import { getProductVisual, productImageAlt } from './product-visuals';
import {AddButton} from './add-button';

export function DemoCatalogueFilters({ seasonal, category, query }: {
  seasonal: boolean;
  category: string | undefined;
  query: Record<string, string>;
}) {
  const action = seasonal ? '/collections/navratri-2026' : '/products';
  return (
    <form className="demo-filters" action={action} aria-label="Product filters">
      <p className="demo-filter-heading">Search &amp; refine</p>
      <div className="demo-filter-fields">
        <label className="demo-filter-search">Search
          <input name="q" type="search" placeholder="Find a product or material" maxLength={80} defaultValue={query.q ?? ''} />
        </label>
        <label className="demo-filter-category">Category
          <select name="category" defaultValue={category ?? ''}>
            <option value="">All categories</option>
            {Object.entries(demoCategories).map(([slug, name]) => <option key={slug} value={slug}>{name}</option>)}
          </select>
        </label>
        <label>Budget up to ₹
          <input name="budget" type="number" min="1" inputMode="numeric" placeholder="Any amount" defaultValue={query.budget ?? ''} />
        </label>
        <label>Sort
          <select name="sort" defaultValue={query.sort ?? ''}>
            <option value="">Curated order</option>
            <option value="low">Price: low to high</option>
            <option value="high">Price: high to low</option>
          </select>
        </label>
      </div>
      <div className="demo-filter-footer">
        <label className="demo-stock-filter"><input name="stock" type="checkbox" value="1" defaultChecked={!!query.stock} /> In stock only</label>
        <div className="demo-filter-actions">
          <Link prefetch={false} href={action}>Reset</Link>
          <button className="button button-primary">Find products</button>
        </div>
      </div>
    </form>
  );
}

export function DemoProductGrid({ products, cart, onAdd }: {
  products: Array<SeedProduct & { id: string }>;
  cart: DemoCart;
  onAdd: (id: string) => boolean;
}) {
  return <div className="product-grid demo-product-grid">{products.map(product => {
    const visual = getProductVisual(product.slug);
    return <article className="product-card" key={product.id}>
      <Link prefetch={false} className="product-image-link" href={`/products/${product.slug}`} tabIndex={-1} aria-label={`${product.name}, view product details`}>
        <ProductImage src={visual.src} alt={productImageAlt(product.name, visual)} sizes="(max-width: 767px) calc((100vw - 44px) / 2), (max-width: 1023px) calc((100vw - 80px) / 3), (max-width: 1360px) calc((100vw - 152px) / 4), 302px" />
      </Link>
      <div className="product-card-copy">
        <p className="product-category">{demoCategories[product.categorySlug]}</p>
        <h3><Link prefetch={false} href={`/products/${product.slug}`}>{product.name}</Link></h3>
        <PriceBlock {...product} />
        <AvailabilityLabel stock={product.stock} />
        <AddButton disabled={!product.stock || (cart[product.id] ?? 0) >= product.stock} onAdd={() => onAdd(product.id)}/>
      </div>
    </article>;
  })}</div>;
}
