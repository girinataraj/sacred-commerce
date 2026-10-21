import Link from 'next/link';
import { demoCategories } from './model';
import { ShopIcon } from './icons';

export function DemoFooter() {
  return <footer className="site-footer sc-footer">
    <div className="container">
      <div className="sc-footer-invitation"><p>Find a little more meaning<br /><em>in the everyday.</em></p><Link prefetch={false} href="/products">Explore all offerings<ShopIcon name="arrow" /></Link></div>
      <div className="sc-footer-grid">
        <div className="sc-footer-brand"><Link prefetch={false} href="/" className="sc-footer-wordmark"><ShopIcon name="leaf" /><span>Sacred Commerce</span></Link><p>A quiet exploration of everyday rituals, natural textures and thoughtful gifts.</p><span className="sc-footer-badge">Independent design demo</span></div>
        <nav aria-label="Footer shop"><h2>The shop</h2><Link prefetch={false} href="/products">All offerings</Link><Link prefetch={false} href="/collections/navratri-2026">Navratri 2026</Link>{Object.entries(demoCategories).map(([slug, name]) => <Link prefetch={false} key={slug} href={`/categories/${slug}`}>{name}</Link>)}</nav>
        <nav aria-label="Footer information"><h2>Good to know</h2><Link prefetch={false} href="/about">Our demo story</Link><Link prefetch={false} href="/demo-guide">How this demo works</Link><Link prefetch={false} href="/privacy">Privacy &amp; local data</Link><Link prefetch={false} href="/cart">Your guest cart</Link></nav>
        <div className="sc-footer-honesty"><h2>A considered demonstration</h2><p>Original fictional products. Purchases are simulated: no payments, deliveries or saved database orders.</p><p>Explore freely. Use fictional details at checkout.</p></div>
      </div>
      <div className="sc-footer-bottom"><p>© 2026 Sacred Commerce · An independent interview project.</p><p>No affiliation with Isha Foundation or Isha Life.</p><Link prefetch={false} href="/privacy">Privacy</Link></div>
    </div>
  </footer>;
}
