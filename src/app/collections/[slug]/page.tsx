import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { Breadcrumbs } from '../../../components/ui/breadcrumbs';
import { EditorialHero } from '../../../components/ui/editorial-hero';
import { SectionHeader } from '../../../components/layout/container';
import { CatalogueListing,InvalidCatalogueQuery } from '../../../features/catalogue/listing';
import { CatalogueFailure } from '../../../features/catalogue/recovery';
import { CatalogueLoading } from '../../../features/catalogue/loading';
import { CatalogueNotFound } from '../../../features/catalogue/service';
import { catalogueHref,type QueryInput } from '../../../features/catalogue/schemas';
import { collectionQuery } from '../../../features/collections/schemas';
import { getCollectionIdentity } from '../../../features/collections/service';
import { SeasonalDiscovery,SeasonalDiscoveryLoading } from '../../../features/collections/seasonal';

export const dynamic='force-dynamic';
export default async function CollectionPage({params,searchParams}:{params:Promise<{slug:string}>;searchParams:Promise<Exclude<QueryInput,URLSearchParams>>}) {
  const {slug}=await params;
  let collection;
  try {collection=await getCollectionIdentity(slug);} catch(error) {
    if(error instanceof CatalogueNotFound) notFound();
    return <main id="main-content" tabIndex={-1} className="container storefront-page"><h1>Seasonal collection</h1><CatalogueFailure title="Seasonal collection could not be loaded"/></main>;
  }
  const path=`/collections/${collection.slug}`; const resetHref=catalogueHref({collection:collection.slug},path)+'#collection-products';
  let query;
  try {query=collectionQuery(collection.slug,await searchParams);} catch {return <main id="main-content" tabIndex={-1} className="container storefront-page"><h1>{collection.title}</h1><InvalidCatalogueQuery path={resetHref}/></main>;}
  return <main id="main-content" tabIndex={-1} className="container seasonal-page"><Breadcrumbs items={[{label:'Home',href:'/'},{label:collection.title}]}/>
    <div className="seasonal-hero"><EditorialHero eyebrow={`${collection.title} · The Sacred Commerce edit`} title="A thoughtful season of celebration" description="Gather simple objects for your space, your daily rituals and the people you hold close. An original seasonal collection of fictional demo products." primary={{label:'Shop the collection',href:'#collection-products'}} image="/editorial/navratri-season.svg" imageAlt="Original seasonal illustration of a terracotta vessel, abstract lamp and leaves in an alcove; not product photography."/></div>
    <Suspense fallback={<SeasonalDiscoveryLoading/>}><SeasonalDiscovery slug={collection.slug}/></Suspense>
    <section id="collection-products" tabIndex={-1} className="seasonal-section seasonal-products"><SectionHeader eyebrow="Find what speaks to you" title="Explore the whole collection" description="Refine by budget, category or intention. Current prices and stock are shown with every listing."/>
      <Suspense fallback={<CatalogueLoading/>}><CatalogueListing query={query} path={path} lockedCollection resultAnchor="#collection-products"/></Suspense>
    </section>
    <aside className="seasonal-note" aria-label="Thoughtful gifting and clear costs"><div><h2>Consider the little details</h2><p>Read the material, size, care and included contents on each product page. Each listing is an individual item; the collection is an edit, not a bundled purchase.</p></div><div><h2>A clear beginning</h2><p>Free demo delivery. No additional demo tax. Reference prices are fictional demo comparisons. No real purchase or delivery takes place.</p></div></aside>
  </main>;
}
