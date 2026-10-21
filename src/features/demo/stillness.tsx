import Link from 'next/link';
import {ProductImage} from '../../components/ui/product-card';
import {ShopIcon} from './icons';
import styles from './stillness.module.css';

export function StillnessEdit(){
 return <section id="stillness-edit" className={styles.section} aria-labelledby="stillness-edit-title">
  <div className={styles.inner}>
   <div className={styles.masthead}><p>The Stillness Edit</p><span>Original editorial study</span></div>
   <div className={styles.introduction}>
    <h2 id="stillness-edit-title">Beyond the noise,{' '}<br/>there is <em>stillness.</em></h2>
    <div className={styles.copy}><p>Inspired by Shiva as Adiyogi, the First Yogi. An invitation to discover moments of reflection, simplicity and conscious living.</p><div className={styles.actions}><Link prefetch={false} className={styles.primary} href="/categories/ritual-essentials">Explore Ritual Essentials<ShopIcon name="arrow"/></Link><Link prefetch={false} className={styles.secondary} href="/about">Discover our philosophy<ShopIcon name="arrow"/></Link></div></div>
   </div>
   <div className={styles.artworks}>
    <figure className={styles.landscape}><div className={styles.mountainImage}><ProductImage src="/editorial/stillness-mountains.svg" alt="Original imagined landscape of layered midnight-indigo mountains, pale mist and a small crescent moon; not a photograph of a specific place." sizes="(max-width: 767px) calc(100vw - 48px), (max-width: 1023px) 55vw, 54vw"/></div><figcaption><span>An imagined horizon</span><span>Original illustration / 01</span></figcaption></figure>
    <figure className={styles.study}><div className={styles.studyImage}><ProductImage src="/editorial/stillness-study.svg" alt="Original abstract still life of dark textured stone, rounded pebbles, a brass-coloured shallow vessel and a curved stem; not a product listing." sizes="(max-width: 767px) calc(100vw - 96px), (max-width: 1023px) 35vw, 32vw"/></div><figcaption><span>Quiet form, warm light</span><span>Original illustration / 02</span></figcaption></figure>
   </div>
   <p className={styles.footnote}>An independent fictional project. Concept artwork, not additional products. No affiliation with Isha Foundation or Isha Life.</p>
  </div>
 </section>;
}
