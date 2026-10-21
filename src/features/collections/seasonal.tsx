import Link from 'next/link';
import { SectionHeader } from '../../components/layout/container';
import { ProductCard,ProductCardSkeleton } from '../../components/ui/product-card';
import { CatalogueFailure } from '../catalogue/recovery';
import { getCollectionDiscovery } from './service';

export async function SeasonalDiscovery({slug}:{slug:string}) {
  let discovery;
  try {discovery=await getCollectionDiscovery(slug);} catch {return <CatalogueFailure title="Seasonal discovery could not be loaded"/>;}
  return <><section className="seasonal-section"><SectionHeader eyebrow="Choose your starting point" title="Three ways to begin" description="Find a little meaning in the everyday. Each edit brings together individual products from this collection."/>
    <nav aria-label="Seasonal shopping journeys" className="seasonal-journeys">{discovery.journeys.map(journey=><Link className="seasonal-journey" key={journey.title} href={journey.href}><h3>{journey.title}</h3><span aria-hidden="true">↗</span><p>{journey.description}</p><small>{journey.count ? `${journey.count} matching ${journey.count===1 ? 'listing':'listings'}`:'No matching listings yet'}</small></Link>)}</nav>
  </section>{discovery.featured.length>0 && <section id="seasonal-featured" className="seasonal-section"><SectionHeader eyebrow="The seasonal edit" title="A few considered offerings" description="An introduction to the collection, chosen for this original demo."/>
    <div className="product-grid">{discovery.featured.map(product=><ProductCard key={product.id} product={product}/>)}</div>
  </section>}</>;
}
export function SeasonalDiscoveryLoading() {return <section className="seasonal-section" role="status" aria-label="Loading seasonal discovery"><p>Preparing the seasonal edit…</p><div className="seasonal-journeys" aria-hidden="true">{Array.from({length:3},(_,index)=><div key={index} className="journey-loading skeleton"/>)}</div><div className="product-grid">{Array.from({length:4},(_,index)=><ProductCardSkeleton key={index}/>)}</div></section>;}
