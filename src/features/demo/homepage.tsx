'use client';

import Link from 'next/link';
import type {ReactNode} from 'react';
import {ProductImage,PriceBlock,AvailabilityLabel} from '../../components/ui/product-card';
import {demoProducts,demoCategories,type DemoCart} from './model';
import {getProductVisual,productImageAlt} from './product-visuals';
import {categoryStories} from './content';
import {ShopIcon} from './icons';
import styles from './homepage.module.css';
import {StillnessEdit} from './stillness';
import {AddButton} from './add-button';

type Product=(typeof demoProducts)[number];
const galleryIds=['SC-001','SC-002','SC-008','SC-011','SC-016'];
const gallery=galleryIds.map(id=>demoProducts.find(p=>p.id===id)!);
const vase=demoProducts.find(p=>p.slug==='terracotta-bud-vase')!;
const bell=demoProducts.find(p=>p.slug==='brass-table-bell')!;
const seasonalCount=demoProducts.filter(p=>p.seasonal).length;

function Artwork({product,priority=false,sizes='(max-width: 767px) 90vw, 40vw'}:{product:Product;priority?:boolean;sizes?:string}){
 const visual=getProductVisual(product.slug);
 return <ProductImage src={visual.src} alt={productImageAlt(product.name,visual)} priority={priority} sizes={sizes}/>;
}

export function EditorialHome({cart,onAdd,feedback}:{cart:DemoCart;onAdd:(id:string)=>boolean;feedback:ReactNode}){
 return <main id="main-content" tabIndex={-1} className={`${styles.page} ha-home`}>
  <section className={styles.hero} aria-labelledby="ha-hero-title">
   <div className={styles.heroCopy}>
    <p className={styles.label}><span aria-hidden="true" className={styles.square}/>An independent collection · 2026</p>
    <h1 id="ha-hero-title">Make room<br/>for <em>meaning.</em></h1>
    <p className={styles.intro}>Objects for small rituals, thoughtful spaces and a life lived with intention.</p>
    <div className={styles.heroActions}><Link prefetch={false} className={styles.primary} href="/products">Explore Shop<ShopIcon name="arrow"/></Link><Link prefetch={false} className={styles.textLink} href="/collections/navratri-2026">Navratri 2026<ShopIcon name="arrow"/></Link></div>
    <p className={styles.heroNote}>Original fictional products.<br/>A real invitation to explore.</p>
   </div>
   <figure className={styles.heroComposition}>
    <div className={styles.heroBackdrop}/>
    <Link prefetch={false} href={`/products/${vase.slug}`} className={styles.heroVase} aria-label={`View ${vase.name}`}><Artwork product={vase} priority sizes="(max-width: 767px) 70vw, 38vw"/></Link>
    <Link prefetch={false} href={`/products/${bell.slug}`} className={styles.heroBell} aria-label={`View ${bell.name}`}><Artwork product={bell} sizes="(max-width: 767px) 35vw, 18vw"/></Link>
    <figcaption><span>Object study / {vase.id}</span><span>{vase.name}</span></figcaption>
    <p className={styles.verticalNote} aria-hidden="true">Earth · texture · everyday</p>
   </figure>
   <div className={styles.heroFoot}><span>{demoProducts.length} original offerings</span><span>Browser-saved guest cart</span><Link prefetch={false} href="/demo-guide">Simulated checkout · No real payment<ShopIcon name="arrow"/></Link></div>
  </section>

  <section className={`${styles.intentions} ha-intentions`} aria-labelledby="ha-intentions-title">
   <div className={styles.sectionHeading}><div><p className={styles.label}>A directory for the everyday</p><h2 id="ha-intentions-title">Shop by Intention</h2></div><p>Start with a moment.<br/>Find something that belongs in it.</p></div>
   <ol className={styles.directory}>{Object.entries(demoCategories).map(([slug,name],i)=>{
    const story=categoryStories[slug];const product=demoProducts.find(p=>p.slug===story.product)!;
    const count=demoProducts.filter(p=>p.categorySlug===slug).length;
    return <li key={slug} className={`${styles.intention} ${i===0?styles.intentionFeatured:''} ha-intention-row`}>
     <Link prefetch={false} href={`/categories/${slug}`}>
      <span className={styles.directoryNumber} aria-hidden="true">0{i+1}</span>
      <div className={styles.directoryCopy}><span className={styles.label}>{count} offerings / {i===0?'For a quiet beginning':i===1?'For a gentler pace':i===2?'For your space':'For a thought'}</span><h3>{name}</h3><p>{story.line}</p><span className={styles.directoryAction}>Shop category<ShopIcon name="arrow"/></span></div>
      <div className={styles.directoryImage}><Artwork product={product} sizes={i===0?'(max-width: 767px) 80vw, 35vw':'(max-width: 767px) 25vw, 10vw'}/></div>
     </Link>
    </li>;
   })}</ol>
  </section>

  <section className={styles.gallery} aria-labelledby="ha-gallery-title">
   <div className={styles.sectionHeading}><div><p className={styles.label}>The considered edit / Five starting points</p><h2 id="ha-gallery-title">Curated Offerings</h2></div><Link prefetch={false} href="/products" className={styles.textLink}>View all {demoProducts.length} offerings<ShopIcon name="arrow"/></Link></div>
   <div className={styles.feedback}>{feedback}</div>
   <div className={styles.galleryGrid}>{gallery.map((product,i)=><article key={product.id} data-product-id={product.id} className={`${styles.galleryPiece} ${styles[`piece${i+1}`]} ha-gallery-piece`}>
    <Link prefetch={false} href={`/products/${product.slug}`} className={styles.galleryImage} tabIndex={-1} aria-label={`View ${product.name}`}><span className={styles.objectLabel}>{product.material} / {product.id}</span><Artwork product={product} sizes="(max-width: 599px) 90vw, (max-width: 1023px) 45vw, 30vw"/></Link>
    <div className={styles.productCopy}><p className={styles.label}>{demoCategories[product.categorySlug]}</p><div className={styles.productTitle}><h3><Link prefetch={false} href={`/products/${product.slug}`}>{product.name}</Link></h3><PriceBlock {...product}/></div><AvailabilityLabel stock={product.stock}/><div className={styles.productActions}><AddButton className={styles.addButton} label="Add to Cart" onAdd={()=>onAdd(product.id)} disabled={!product.stock||(cart[product.id]??0)>=product.stock}/><Link prefetch={false} href={`/products/${product.slug}`}>View Details<ShopIcon name="arrow"/></Link></div></div>
   </article>)}<aside className={styles.galleryNote}><span className={styles.label}>A note on this collection</span><span className={styles.noteSymbol} aria-hidden="true">✳</span><h3>Fictional objects.<br/>Thoughtful choices.</h3><p>These original illustrations and product records belong to an independent interview project. Explore freely; every purchase is simulated.</p><Link prefetch={false} href="/demo-guide" className={styles.textLink}>How the demo works<ShopIcon name="arrow"/></Link></aside></div>
  </section>

  <StillnessEdit/>

  <section className={`${styles.season} ha-season`} aria-labelledby="ha-season-title">
   <div className={styles.seasonInner}><div className={styles.seasonArt}>
    <div className={styles.seasonPrimary}><Artwork product={gallery[0]} sizes="(max-width: 767px) 75vw, 35vw"/></div>
    <div className={styles.seasonSecondary}><Artwork product={demoProducts.find(p=>p.slug==='brass-tea-light-holder')!} sizes="(max-width: 767px) 32vw, 18vw"/></div>
    <p className={styles.seasonCaption}>The seasonal edit / Clay, brass &amp; cotton</p>
   </div><div className={styles.seasonCopy}><p className={styles.label}>Navratri 2026 / A season of light</p><h2 id="ha-season-title">Small rituals.<br/><em>A little radiance.</em></h2><p>A considered gathering of {seasonalCount} fictional offerings, drawn from the existing collection. Follow the materials, the colours, or simply your curiosity.</p><Link prefetch={false} className={styles.lightButton} href="/collections/navratri-2026">Explore Navratri 2026<ShopIcon name="arrow"/></Link><p className={styles.seasonDisclosure}>Shop individual products. No bundles, real payments or deliveries.</p></div></div>
  </section>

  <section className={styles.philosophy} aria-labelledby="ha-philosophy-title"><p className={styles.label}>Our point of view</p><h2 id="ha-philosophy-title">Good design leaves room<br/>for the <em>everyday.</em></h2><div className={styles.philosophyBody}><span className={styles.philosophyRule}/><p>A quieter way to discover things. Clear prices, useful details and room to choose at your own pace. Sacred Commerce explores how a thoughtful digital experience can serve those small decisions.</p><p>Independent, fictional and transparent by design. No affiliation with Isha Foundation or Isha Life. No invented artisan stories or certifications.</p></div><Link prefetch={false} href="/about" className={styles.textLink}>Read our demo story<ShopIcon name="arrow"/></Link></section>
 </main>;
}
