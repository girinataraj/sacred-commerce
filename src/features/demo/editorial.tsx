'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { ProductImage, PriceBlock, AvailabilityLabel } from '../../components/ui/product-card';
import { demoProducts, demoCategories, type DemoCart } from './model';
import { getProductVisual, productImageAlt } from './product-visuals';
import { productStories } from './content';
import { ShopIcon } from './icons';
import {AddButton} from './add-button';

type DemoProduct = (typeof demoProducts)[number];

export function CartArtwork({ product }: { product: DemoProduct }) {
  const visual = getProductVisual(product.slug);
  return <Link prefetch={false} href={`/products/${product.slug}`} className="sc-cart-art" tabIndex={-1} aria-label={`View ${product.name}`}><ProductImage src={visual.src} alt={visual.description} sizes="112px" /></Link>;
}

export function PageLead({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return <div className="sc-page-lead"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1>{children && <p className="sc-lead">{children}</p>}</div>;
}

export {EditorialHome as DemoHome} from './homepage';

export function DemoProductDetail({ product, cart, onAdd, feedback }: { product: DemoProduct; cart: DemoCart; onAdd: () => boolean; feedback: ReactNode }) {
  const visual = getProductVisual(product.slug);
  const related = demoProducts.filter(item => item.categorySlug === product.categorySlug && item.id !== product.id).slice(0, 4);
  return <main id="main-content" tabIndex={-1} className="container demo-main sc-product-page">
    <nav className="sc-breadcrumb" aria-label="Breadcrumb"><Link prefetch={false} href="/products">All products</Link><span aria-hidden="true">/</span><Link prefetch={false} href={`/categories/${product.categorySlug}`}>{demoCategories[product.categorySlug]}</Link></nav>
    <div className="demo-detail"><ProductImage src={visual.src} alt={productImageAlt(product.name, visual)} priority sizes="(max-width: 767px) calc(100vw - 32px), 50vw" /><section className="sc-product-copy"><p className="eyebrow">{demoCategories[product.categorySlug]}</p><h1>{product.name}</h1><PriceBlock {...product} /><AvailabilityLabel stock={product.stock} /><p className="sc-product-story">{productStories[product.slug]}</p><div className="sc-product-purchase"><AddButton disabled={!product.stock || (cart[product.id] ?? 0) >= product.stock} onAdd={onAdd}/>{feedback}<Link prefetch={false} className="sc-text-link" href="/cart">View your guest cart<ShopIcon name="arrow" /></Link></div><p className="sc-product-demo-note">Original fictional product · No stock reserved or real delivery.</p><div className="sc-product-facts"><h2>The thoughtful details</h2><dl>{[['Material', product.material], ['Dimensions', product.dimensions], ['Included', product.includedContents], ['Care', product.care]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></div></section></div>
    <section className="sc-section" aria-labelledby="sc-related-title"><div className="sc-section-heading"><div><p className="eyebrow">Keep exploring</p><h2 id="sc-related-title">A few kindred things.</h2></div><Link prefetch={false} className="sc-text-link" href={`/categories/${product.categorySlug}`}>View the collection<ShopIcon name="arrow" /></Link></div><div className="sc-related-grid">{related.map(item => {
      const art = getProductVisual(item.slug);
      return <article key={item.id}><Link prefetch={false} href={`/products/${item.slug}`} className="sc-related-art" tabIndex={-1} aria-label={`View ${item.name}`}><ProductImage src={art.src} alt={art.description} sizes="(max-width: 767px) 45vw, 25vw" /></Link><h3><Link prefetch={false} href={`/products/${item.slug}`}>{item.name}</Link></h3><PriceBlock {...item} /></article>;
    })}</div></section>
  </main>;
}

export function GuestExperience() {
  return <main id="main-content" tabIndex={-1} className="container demo-main sc-state-page"><section className="sc-state-panel"><span className="sc-state-symbol"><ShopIcon name="leaf" /></span><p className="eyebrow">A warm welcome, as a guest</p><h1>Guest demo experience</h1><p className="sc-lead">Everything you need to explore, without an account.</p><p>Real authentication, customer orders and admin operations are disabled until the database integration is verified.</p><div className="sc-hero-actions"><Link prefetch={false} className="button button-primary" href="/products">Explore products<ShopIcon name="arrow" /></Link><Link prefetch={false} className="sc-text-link" href="/demo-guide">How the demo works</Link></div><p className="sc-state-caption">A browser-saved guest cart · No real payments or deliveries</p></section></main>;
}
