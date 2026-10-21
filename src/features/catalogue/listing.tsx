import { ActionLink } from '../../components/ui/button';
import { EmptyState } from '../../components/ui/feedback';
import { ProductCard } from '../../components/ui/product-card';
import { CatalogueControls } from './filters';
import { CatalogueFailure } from './recovery';
import { catalogueHref,type CatalogueQuery } from './schemas';
import { listProducts,listCategories,getFilterMetadata } from './service';
export async function CatalogueListing({query,path='/products',lockedCategory=false,lockedCollection=false,resultAnchor=''}:{query:CatalogueQuery;path?:string;lockedCategory?:boolean;lockedCollection?:boolean;resultAnchor?:string}) {
  let data;
  try { const [products,categories,metadata]=await Promise.all([listProducts(query),listCategories(),getFilterMetadata(undefined,lockedCollection ? query.collection:undefined)]); data={products,categories,metadata}; }
  catch {return <CatalogueFailure/>;}
  const {products,categories,metadata}=data;
  const forUrl=(values:Partial<CatalogueQuery>)=>lockedCategory ? {...values,category:undefined}:values;
  const resetHref=catalogueHref(lockedCollection ? {collection:query.collection}:{},path)+resultAnchor;
  const emptyCollection=lockedCollection && !products.total && !query.q && !query.category && !query.occasion && !query.intent && !query.inStock && !query.onOffer && query.minPricePaise===undefined && query.maxPricePaise===undefined;
  return <div className="catalogue-layout"><CatalogueControls query={query} path={path} lockedCategory={lockedCategory} categories={categories} metadata={metadata} resetHref={resetHref} resultAnchor={resultAnchor}/><section className="catalogue-results" aria-label="Catalogue results"><h2 className="sr-only">Products</h2><p id="catalogue-result-count" tabIndex={-1} role="status" aria-label="Catalogue result count" className="result-count">{products.total} {products.total===1 ? 'product':'products'}{products.total>0 && products.items.length>0 ? ` · Showing ${(products.page-1)*products.pageSize+1}–${(products.page-1)*products.pageSize+products.items.length}`:''}</p>
    {products.items.length ? <div className="product-grid">{products.items.map(product=><ProductCard key={product.id} product={product}/>)}</div> : <EmptyState title={products.total ? 'This page is empty':emptyCollection ? 'This demo collection has no available listings yet':'No products match your choices'} action={<ActionLink tone="secondary" href={products.total ? catalogueHref(forUrl({...query,page:1}),path)+resultAnchor:emptyCollection ? '/products':resetHref}>{products.total ? 'Go to first page':emptyCollection ? 'Browse all products':'Clear filters'}</ActionLink>}>{products.total ? 'Your matching products are on an earlier page. Return to the first page to see them.':emptyCollection ? 'Explore our other original demo listings, or return to this collection later.':'Try a wider budget, a different search, or clear a filter. Your choices have not changed any stock.'}</EmptyState>}
    {products.pageCount>1 && <nav className="pagination" aria-label="Product pages">{products.page>1 && <ActionLink tone="secondary" href={catalogueHref(forUrl({...query,page:Math.min(products.page-1,products.pageCount)}),path)+resultAnchor}>Previous page</ActionLink>}<span>Page {products.page} of {products.pageCount}</span>{products.page<products.pageCount && <ActionLink tone="secondary" href={catalogueHref(forUrl({...query,page:products.page+1}),path)+resultAnchor}>Next page</ActionLink>}</nav>}
  </section></div>;
}
export function InvalidCatalogueQuery({path='/products'}:{path?:string}) {return <section className="catalogue-recovery"><h2>Check your filters</h2><p role="alert" className="field-error">Use valid search options and a minimum price no greater than the maximum price.</p><ActionLink href={path} tone="secondary">Clear invalid filters</ActionLink></section>;}
