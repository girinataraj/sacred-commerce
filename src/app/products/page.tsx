import { Breadcrumbs } from '../../components/ui/breadcrumbs';
import { CatalogueListing,InvalidCatalogueQuery } from '../../features/catalogue/listing';
import { parseCatalogueQuery,type QueryInput } from '../../features/catalogue/schemas';
import { CatalogueLoading } from '../../features/catalogue/loading';
export const dynamic='force-dynamic';
export default async function ProductsPage({searchParams}:{searchParams:Promise<Exclude<QueryInput,URLSearchParams>>}) {
  let query; try {query=parseCatalogueQuery(await searchParams);} catch {return <main id="main-content" tabIndex={-1} className="container storefront-page"><h1>Explore the catalogue</h1><InvalidCatalogueQuery/></main>;}
  return <main id="main-content" tabIndex={-1} className="container storefront-page"><Breadcrumbs items={[{label:'Home',href:'/'},{label:'Products'}]}/><div className="page-introduction"><p className="eyebrow">Original objects · Thoughtful choices</p><h1>Explore the catalogue</h1><p>Find a thoughtful demo item by budget, occasion or intention.</p></div><Suspense fallback={<CatalogueLoading/>}><CatalogueListing query={query}/></Suspense></main>;
}
import { Suspense } from 'react';
