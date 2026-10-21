import { Suspense } from 'react';
import Link from 'next/link';
import { EditorialHero } from '../components/ui/editorial-hero';
import { SectionHeader } from '../components/layout/container';
import { ProductCard,ProductCardSkeleton } from '../components/ui/product-card';
import { EmptyState } from '../components/ui/feedback';
import { ActionLink } from '../components/ui/button';
import { listCategories,listFeaturedProducts,getFilterMetadata } from '../features/catalogue/service';
import { CatalogueFailure } from '../features/catalogue/recovery';
export const dynamic='force-dynamic';
export default function HomePage() {
  return <main id="main-content" tabIndex={-1} className="container storefront-home"><div className="home-hero"><EditorialHero eyebrow="Everyday rituals · Considered living" title="Sacred Commerce" description="Thoughtful objects for your home, your daily rituals and meaningful gifts." primary={{label:'Shop all products',href:'/products'}}/></div><Suspense fallback={<HomeDiscoveryLoading/>}><HomeDiscovery/></Suspense><div className="demo-delivery-note"><h2>Clear costs. Considered choices.</h2><p>Demo delivery is free, with no additional demo tax. Original fictional products; no real purchase or delivery takes place.</p></div></main>;
}
async function HomeDiscovery() {
  let data;
  try { const [categories,featured,metadata]=await Promise.all([listCategories(),listFeaturedProducts(),getFilterMetadata()]); data={categories,featured,metadata}; }
  catch {return <CatalogueFailure title="Product discovery is temporarily unavailable"/>;}
  const labels:Record<string,string>={gifting:'Thoughtful gifts',home:'Objects for home',reading:'Space to reflect',self_care:'Everyday care',ritual:'Ritual essentials'};
  return <><section id="categories" className="home-section"><SectionHeader title="Find your starting point"/><div className="category-grid">{data.categories.map(category=><Link className="category-tile" key={category.id} href={`/categories/${category.slug}`}><span>{category.name}</span><small>{category.productCount} products</small><span aria-hidden="true">↗</span></Link>)}</div>{data.categories.length===0 && <p>No categories have been listed yet.</p>}</section><section id="featured-products" className="home-section"><SectionHeader eyebrow="A few considered choices" title="Featured in our demo"/><div className="product-grid">{data.featured.map(product=><ProductCard key={product.id} product={product}/>)}</div>{data.featured.length===0 && <EmptyState title="No featured products yet" action={<ActionLink href="/products">Browse all products</ActionLink>}>Explore the full catalogue for current demo listings.</EmptyState>}</section><aside className="seasonal-preview"><p className="eyebrow">Navratri 2026</p><h2>A thoughtful season of celebration</h2><p>Discover an original seasonal edit, with ritual essentials, considered gifts and objects for home.</p><ActionLink href="/collections/navratri-2026" tone="secondary">Explore Navratri 2026</ActionLink></aside><section className="home-section"><SectionHeader title="Shop with an intention"/><div className="intention-links">{data.metadata.intents.map(intent=><ActionLink key={intent} tone="secondary" href={`/products?intent=${encodeURIComponent(intent)}`}>{labels[intent]??intent}</ActionLink>)}</div></section></>;
}
function HomeDiscoveryLoading() {return <section className="home-section" role="status" aria-label="Loading product discovery"><p>Loading current products and categories…</p><div className="product-grid">{Array.from({length:4},(_,index)=><ProductCardSkeleton key={index}/>)}</div></section>;}
