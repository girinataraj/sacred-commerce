import { notFound } from 'next/navigation';
import { Breadcrumbs } from '../../../components/ui/breadcrumbs';
import { ProductImage,PriceBlock,AvailabilityLabel,ProductCard } from '../../../components/ui/product-card';
import { SectionHeader } from '../../../components/layout/container';
import { getProduct,getProductIdentity,getRelatedProducts,CatalogueNotFound } from '../../../features/catalogue/service';
import type { ProductDTO } from '../../../features/catalogue/types';
import { DetailLoading,RelatedLoading } from '../../../features/catalogue/loading';
import { CatalogueFailure } from '../../../features/catalogue/recovery';
import { DetailQuantity } from '../../../features/catalogue/detail-quantity';
import { ActionLink } from '../../../components/ui/button';
export const dynamic='force-dynamic';
export default async function ProductPage({params}:{params:Promise<{slug:string}>}) {
  let identity; try {identity=await getProductIdentity((await params).slug);} catch(error) {if(error instanceof CatalogueNotFound) notFound(); return <main id="main-content" tabIndex={-1} className="container storefront-page"><h1>Product information</h1><CatalogueFailure/></main>;}
  return <main id="main-content" tabIndex={-1} className="container storefront-page"><Suspense fallback={<DetailLoading name={identity.name}/>}><ProductContents slug={identity.slug}/></Suspense></main>;
}
import { Suspense } from 'react';
async function ProductContents({slug}:{slug:string}) {
  let product; try {product=await getProduct(slug);} catch(error) {if(error instanceof CatalogueNotFound) return <><h1>This listing is unavailable</h1><p>This listing changed while it was loading.</p><ActionLink href="/products">Browse products</ActionLink></>; return <><h1>Product information</h1><CatalogueFailure/></>;}
  return <><Breadcrumbs items={[{label:'Home',href:'/'},{label:product.category.name,href:`/categories/${product.category.slug}`},{label:product.name}]}/><div className="product-detail"><div className="detail-image"><ProductImage src={product.imagePath} alt={product.imageAlt} priority/><p className="field-hint">Original demo illustration, not a product photograph.</p></div><section className="detail-copy"><p className="eyebrow">{product.category.name}</p><h1>{product.name}</h1><PriceBlock pricePaise={product.pricePaise} compareAtPricePaise={product.compareAtPricePaise}/><AvailabilityLabel stock={product.stock}/><p className="detail-description">{product.description}</p><DetailQuantity key={product.id} stock={product.stock} productId={product.id} slug={product.slug} pricePaise={product.pricePaise}/><p className="detail-delivery">Free demo delivery · No additional demo tax · Simulated purchases only.</p></section></div><section className="product-information"><h2>The details, thoughtfully laid out</h2><dl><div><dt>Material</dt><dd>{product.material}</dd></div><div><dt>Size</dt><dd>{product.dimensions}</dd></div><div><dt>Included contents</dt><dd>{product.includedContents}</dd></div><div><dt>Care</dt><dd>{product.care}</dd></div></dl></section><section id="related-products" className="home-section"><SectionHeader title="More in this collection of choices" description={`Explore other active ${product.category.name.toLowerCase()} listings.`}/><Suspense fallback={<RelatedLoading/>}><RelatedProducts product={product}/></Suspense></section></>;
}
async function RelatedProducts({product}:{product:ProductDTO}) {
  let related; try {related=await getRelatedProducts(product);} catch {return <CatalogueFailure title="Related products could not be loaded"/>;}
  return related.length>0 ? <div className="product-grid">{related.map(item=><ProductCard key={item.id} product={item}/>)}</div>:<p>No other active listings in this category yet.</p>;
}
