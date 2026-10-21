'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { Drawer } from '../../components/ui/drawer';
import { demoCategories } from './model';
import { ShopIcon } from './icons';
import {AppearanceToggle} from './appearance';
import {FloatingCart} from './floating-cart';

export function StorefrontHeader({ count }: { count: number }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return <header className="site-header demo-header sc-header">
    <div className="demo-disclosure"><span className="sc-disclosure-dot" />SELF-CONTAINED DEMO <span aria-hidden="true">·</span> Simulated purchases only</div>
    <div className="container">
      <div className="header-row">
        <Link prefetch={false} className="wordmark sc-wordmark" href="/"><ShopIcon name="leaf" /><span className="sc-brand-copy">Sacred Commerce<span>Objects for considered living</span></span></Link>
        <p className="sc-header-note">Small rituals. A little more meaning.</p>
        <div className="sc-header-actions">
          <AppearanceToggle/>
          <button type="button" className="sc-menu-button" aria-label="Open shop menu" aria-haspopup="dialog" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}><ShopIcon name="menu" /><span>Menu</span></button>
          <Link prefetch={false} className="button button-secondary sc-cart-link" href="/cart"><ShopIcon name="bag" /><span>Cart ({count})</span></Link>
        </div>
      </div>
      <nav className="demo-nav" aria-label="Shop navigation">
        <Link prefetch={false} href="/">Home</Link>
        <Link prefetch={false} href="/products">Shop all</Link>
        <Link prefetch={false} className="sc-season-link" href="/collections/navratri-2026"><ShopIcon name="spark" />Navratri 2026</Link>
        {Object.entries(demoCategories).map(([slug, name]) => <Link prefetch={false} className="sc-category-nav" key={slug} href={`/categories/${slug}`}>{name}</Link>)}
      </nav>
    </div>
    <Drawer open={menuOpen} onClose={() => setMenuOpen(false)} title="Explore the shop" closeLabel="Close shop menu">
      <p className="sc-drawer-intro">A few thoughtful things for your everyday.</p>
      <nav className="sc-drawer-links" aria-label="Mobile shop navigation">
        {[['/', 'Home'], ['/products', 'Shop all'], ['/collections/navratri-2026', 'Navratri 2026'], ...Object.entries(demoCategories).map(([slug, name]) => [`/categories/${slug}`, name])].map(([href, label]) => <Link prefetch={false} key={href} href={href} onClick={() => setMenuOpen(false)}>{label}<ShopIcon name="arrow" /></Link>)}
      </nav>
      <Link prefetch={false} href="/demo-guide" onClick={() => setMenuOpen(false)}>How this demo works</Link>
      <p className="sc-drawer-note">Fictional products, a browser-saved cart and a clearly marked simulated checkout.</p>
    </Drawer>
    <Suspense fallback={null}><FloatingCart count={count} menuOpen={menuOpen}/></Suspense>
  </header>;
}
