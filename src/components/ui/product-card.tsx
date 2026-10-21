'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import type { ProductDTO } from '../../features/catalogue/types';
import { presentPrice } from '../../lib/price-presentation';
export function PriceBlock({ pricePaise,compareAtPricePaise }: Pick<ProductDTO,'pricePaise'|'compareAtPricePaise'>) {
  const price=presentPrice(pricePaise,compareAtPricePaise);
  if (!price) return <p className="field-error">Price unavailable</p>;
  return <div className="price-block"><span className="selling-price">{price.selling}</span>{price.reference && <><span className="reference-price">Demo reference price <s>{price.reference}</s></span><span className="saving-label">Save {price.saving} ({price.percent}%) — demo offer</span></>}</div>;
}
export function AvailabilityLabel({ stock }: { stock:number }) {
  const valid=Number.isSafeInteger(stock) && stock>=0;
  return <p className={`availability ${stock===0 || !valid ? 'unavailable' : ''}`}><span aria-hidden="true" className="availability-dot" />{!valid ? 'Availability unavailable' : stock===0 ? 'Out of stock' : stock<=3 ? `Only ${stock} available` : 'In stock'}</p>;
}
export function ProductImage({ src,alt,priority=false,sizes="(max-width: 767px) 46vw, (max-width: 1023px) 30vw, 25vw" }: { src:string; alt:string; priority?:boolean; sizes?:string }) {
  return <ProductImageFrame key={src} src={src} alt={alt} priority={priority} sizes={sizes} />;
}
function ProductImageFrame({ src,alt,priority,sizes }: { src:string; alt:string; priority:boolean; sizes:string }) {
  const allowed=/^\/(products|editorial)\/[a-z0-9-]+\.(svg|png|webp|jpg)$/.test(src);
  const [failed,setFailed]=useState(false); const [loaded,setLoaded]=useState(false);
  return <div className={`product-image ${loaded ? 'image-ready' : ''}`}>{!allowed || failed ? <div className="image-fallback" role="img" aria-label={`${alt}. Image unavailable.`}><span aria-hidden="true">◇</span><span>Image unavailable</span></div> : <Image src={src} alt={alt} fill sizes={sizes} preload={priority} onLoad={() => setLoaded(true)} onError={() => setFailed(true)} />}</div>;
}
export function ProductCard({ product,href }: { product:ProductDTO; href?:string }) {
  return <article className="product-card"><Link href={href ?? `/products/${product.slug}`} className="product-image-link" tabIndex={-1} aria-label={`${product.name}, view product details`}><ProductImage src={product.imagePath} alt={product.imageAlt} /></Link><div className="product-card-copy"><p className="product-category">{product.category.name}</p><h3><Link href={href ?? `/products/${product.slug}`}>{product.name}</Link></h3><PriceBlock pricePaise={product.pricePaise} compareAtPricePaise={product.compareAtPricePaise} /><AvailabilityLabel stock={product.stock} /></div></article>;
}
export function ProductCardSkeleton() { return <div className="product-card skeleton-card" aria-hidden="true"><div className="product-image skeleton" /><div className="skeleton skeleton-line" /><div className="skeleton skeleton-line short" /></div>; }
