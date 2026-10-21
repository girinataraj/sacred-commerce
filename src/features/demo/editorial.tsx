'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { ProductImage, PriceBlock, AvailabilityLabel } from '../../components/ui/product-card';
import { demoProducts, demoCategories, type DemoCart } from './model';
import { getProductVisual, productImageAlt } from './product-visuals';
import { DemoProductGrid } from './catalogue';
import { categoryStories, productStories } from './content';
import { ShopIcon } from './icons';

type DemoProduct = (typeof demoProducts)[number];

export function CartArtwork({ product }: { product: DemoProduct }) {
  const visual = getProductVisual(product.slug);
  return <Link prefetch={false} href={`/products/${product.slug}`} className="sc-cart-art" tabIndex={-1} aria-label={`View ${product.name}`}><ProductImage src={visual.src} alt={visual.description} sizes="112px" /></Link>;
}

export function PageLead({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return <div className="sc-page-lead"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1>{children && <p className="sc-lead">{children}</p>}</div>;
}

export function DemoHome({ cart, onAdd, feedback }: { cart: DemoCart; onAdd: (id: string) => void; feedback: ReactNode }) {
  return <main id="main-content" tabIndex={-1} className="container demo-main sc-home">
    <section className="sc-home-hero" aria-label="A considered everyday">
      <div className="sc-hero-copy"><p className="eyebrow">Small rituals · Considered living</p><h1>Everyday objects.<br /><em>A little more meaning.</em></h1><p className="sc-lead">Warm materials. Quiet details. Thoughtful little things for the moments that make a day your own.</p><div className="sc-hero-actions"><Link prefetch={false} className="button button-primary" href="/products">Explore the shop<ShopIcon name="arrow" /></Link><Link prefetch={false} className="sc-text-link" href="/collections/navratri-2026">Discover Navratri 2026</Link></div><p className="sc-hero-caption">An original collection of fictional offerings.</p></div>
      <figure className="sc-hero-image"><ProductImage src="/editorial/considered-living.svg" alt="Original editorial illustration of a terracotta vessel, green leaves and folded cloth in a quiet alcove." priority sizes="(max-width: 767px) calc(100vw - 32px), 50vw" /><figcaption>Earth, texture &amp; a moment of stillness.</figcaption></figure>
    </section>
    <div className="sc-values-strip"><span><ShopIcon name="leaf" />20 original offerings</span><span>Natural-material inspiration</span><span>Guest cart · Simulated checkout</span></div>{feedback}
    <section className="sc-section" aria-labelledby="sc-categories-title"><div className="sc-section-heading"><div><p className="eyebrow">Find your everyday</p><h2 id="sc-categories-title">A place for every small ritual.</h2></div><p>Four collections, connected by a considered point of view.</p></div><div className="sc-category-grid">{Object.entries(demoCategories).map(([slug, name]) => {
      const story = categoryStories[slug]; const visual = getProductVisual(story.product);
      return <Link prefetch={false} href={`/categories/${slug}`} className="sc-category-tile" key={slug}><div className="sc-category-art"><ProductImage src={visual.src} alt={visual.description} sizes="(max-width: 767px) 45vw, 25vw" /></div><div><p>{name}</p><span>{story.line}</span></div><ShopIcon name="arrow" /></Link>;
    })}</div></section>
    <section className="sc-section" aria-labelledby="sc-curated-title"><div className="sc-section-heading"><div><p className="eyebrow">The considered edit</p><h2 id="sc-curated-title">A few things to begin with.</h2></div><Link prefetch={false} className="sc-text-link" href="/products">View all 20 offerings<ShopIcon name="arrow" /></Link></div><DemoProductGrid products={demoProducts.filter(product => ['SC-001', 'SC-007', 'SC-011', 'SC-016'].includes(product.id))} cart={cart} onAdd={onAdd} /></section>
    <section className="sc-season-story"><div><p className="eyebrow">A season of light · Navratri 2026</p><h2>Gather a little warmth.</h2><p>Clay, brass and soft woven textures. Explore thirteen fictional offerings in our seasonal edit.</p><Link prefetch={false} className="button button-secondary" href="/collections/navratri-2026">Explore the collection<ShopIcon name="arrow" /></Link></div><ProductImage src="/editorial/navratri-season.svg" alt="Original Navratri still life with an abstract terracotta lamp, vessel and leaves." sizes="(max-width: 767px) 100vw, 40vw" /></section>
    <section className="sc-home-ending"><p className="eyebrow">A note from the studio</p><h2>Good design leaves room<br />for the everyday.</h2><p>Sacred Commerce is an independent exploration of objects, rituals and thoughtful digital experiences. Everything here is imagined; every purchase is a simulation.</p><Link prefetch={false} className="sc-text-link" href="/about">Read our demo story<ShopIcon name="arrow" /></Link></section>
  </main>;
}

export function DemoProductDetail({ product, cart, onAdd, feedback }: { product: DemoProduct; cart: DemoCart; onAdd: () => void; feedback: ReactNode }) {
  const visual = getProductVisual(product.slug);
  const related = demoProducts.filter(item => item.categorySlug === product.categorySlug && item.id !== product.id).slice(0, 4);
  return <main id="main-content" tabIndex={-1} className="container demo-main sc-product-page">
    <nav className="sc-breadcrumb" aria-label="Breadcrumb"><Link prefetch={false} href="/products">All products</Link><span aria-hidden="true">/</span><Link prefetch={false} href={`/categories/${product.categorySlug}`}>{demoCategories[product.categorySlug]}</Link></nav>
    <div className="demo-detail"><ProductImage src={visual.src} alt={productImageAlt(product.name, visual)} priority sizes="(max-width: 767px) calc(100vw - 32px), 50vw" /><section className="sc-product-copy"><p className="eyebrow">{demoCategories[product.categorySlug]}</p><h1>{product.name}</h1><PriceBlock {...product} /><AvailabilityLabel stock={product.stock} /><p className="sc-product-story">{productStories[product.slug]}</p><div className="sc-product-purchase"><button className="button button-primary" disabled={!product.stock || (cart[product.id] ?? 0) >= product.stock} onClick={onAdd}>Add to demo cart<ShopIcon name="bag" /></button>{feedback}<Link prefetch={false} className="sc-text-link" href="/cart">View your guest cart<ShopIcon name="arrow" /></Link></div><p className="sc-product-demo-note">Original fictional product · No stock reserved or real delivery.</p><div className="sc-product-facts"><h2>The thoughtful details</h2><dl>{[['Material', product.material], ['Dimensions', product.dimensions], ['Included', product.includedContents], ['Care', product.care]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></div></section></div>
    <section className="sc-section" aria-labelledby="sc-related-title"><div className="sc-section-heading"><div><p className="eyebrow">Keep exploring</p><h2 id="sc-related-title">A few kindred things.</h2></div><Link prefetch={false} className="sc-text-link" href={`/categories/${product.categorySlug}`}>View the collection<ShopIcon name="arrow" /></Link></div><div className="sc-related-grid">{related.map(item => {
      const art = getProductVisual(item.slug);
      return <article key={item.id}><Link prefetch={false} href={`/products/${item.slug}`} className="sc-related-art" tabIndex={-1} aria-label={`View ${item.name}`}><ProductImage src={art.src} alt={art.description} sizes="(max-width: 767px) 45vw, 25vw" /></Link><h3><Link prefetch={false} href={`/products/${item.slug}`}>{item.name}</Link></h3><PriceBlock {...item} /></article>;
    })}</div></section>
  </main>;
}

export function GuestExperience() {
  return <main id="main-content" tabIndex={-1} className="container demo-main sc-state-page"><section className="sc-state-panel"><span className="sc-state-symbol"><ShopIcon name="leaf" /></span><p className="eyebrow">A warm welcome, as a guest</p><h1>Guest demo experience</h1><p className="sc-lead">Everything you need to explore, without an account.</p><p>Real authentication, customer orders and admin operations are disabled until the database integration is verified.</p><div className="sc-hero-actions"><Link prefetch={false} className="button button-primary" href="/products">Explore products<ShopIcon name="arrow" /></Link><Link prefetch={false} className="sc-text-link" href="/demo-guide">How the demo works</Link></div><p className="sc-state-caption">A browser-saved guest cart · No real payments or deliveries</p></section></main>;
}
