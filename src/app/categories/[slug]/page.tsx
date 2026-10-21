import { notFound } from 'next/navigation';
import { Breadcrumbs } from '../../../components/ui/breadcrumbs';
import { CatalogueListing,InvalidCatalogueQuery } from '../../../features/catalogue/listing';
import { parseCatalogueQuery,type QueryInput } from '../../../features/catalogue/schemas';
import { getCategory,CatalogueNotFound } from '../../../features/catalogue/service';
import { CatalogueFailure } from '../../../features/catalogue/recovery';
import { CatalogueLoading } from '../../../features/catalogue/loading';
export const dynamic='force-dynamic';
export default async function CategoryPage({params,searchParams}:{params:Promise<{slug:string}>;searchParams:Promise<Exclude<QueryInput,URLSearchParams>>}) {
  const {slug}=await params; const path=`/categories/${encodeURIComponent(slug)}`;
  let query; try {const raw=await searchParams; query=parseCatalogueQuery(raw); if(query.category && query.category!==slug) throw new Error('Conflicting category'); query={...query,category:slug};}
  catch {return <main id="main-content" tabIndex={-1} className="container storefront-page"><h1>Category choices</h1><InvalidCatalogueQuery path={path}/></main>;}
  let category; try {category=await getCategory(slug);} catch(error) {if(error instanceof CatalogueNotFound) notFound(); return <main id="main-content" tabIndex={-1} className="container storefront-page"><h1>Category choices</h1><CatalogueFailure/></main>;}
  return <main id="main-content" tabIndex={-1} className="container storefront-page"><Breadcrumbs items={[{label:'Home',href:'/'},{label:'Products',href:'/products'},{label:category.name}]}/><div className="page-introduction"><p className="eyebrow">Find what speaks to you</p><h1>{category.name}</h1><p>Original fictional listings. Refine these choices by budget, occasion or intention.</p></div><Suspense fallback={<CatalogueLoading/>}><CatalogueListing query={query} path={path} lockedCategory/></Suspense></main>;
}
import { Suspense } from 'react';
