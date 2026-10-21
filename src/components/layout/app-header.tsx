'use client';
import Link from 'next/link';
import { usePathname,useRouter } from 'next/navigation';
import { useState } from 'react';
import AuthControls from '../auth-controls';
import { Container } from './container';
import { SearchField } from '../ui/search-field';
import { Drawer } from '../ui/drawer';
const categories=[{label:'Ritual essentials',slug:'ritual-essentials'},{label:'Natural living',slug:'natural-living'},{label:'Home & craft',slug:'home-craft'},{label:'Books & gifts',slug:'books-gifts'}];
export function AppHeader({ cartCount }: { cartCount?:number }) {
  const pathname=usePathname();
  return <HeaderFrame key={pathname} pathname={pathname} cartCount={cartCount} />;
}
function HeaderFrame({ pathname,cartCount }: { pathname:string; cartCount?:number }) {
  const [open,setOpen]=useState(false); const router=useRouter();
  const [accountRevision,setAccountRevision]=useState(0);
  const signedOut=() => { setOpen(false); setAccountRevision(revision => revision+1); };
  const review=process.env.NODE_ENV==='development' && pathname==='/dev/components';
  const items=[{label:'Navratri 2026',slug:null},...categories];
  const links=(mobile=false) => <nav aria-label={mobile ? 'Mobile shop navigation' : 'Shop navigation'} className={mobile ? 'mobile-links' : 'desktop-links'}><Link href={review ? '#top' : '/'} onClick={() => setOpen(false)}>Home</Link><Link href="/products" onClick={() => setOpen(false)}>Shop all</Link>{items.map(item => <Link key={item.label} href={review ? '#product-states':item.slug ? `/categories/${item.slug}`:'/collections/navratri-2026'} onClick={() => setOpen(false)}>{item.label}</Link>)}</nav>;
  return <><div className="demo-disclosure">Independent interview demo · Simulated purchases only.</div><header className="site-header"><Container><div className="header-row"><button type="button" className="icon-button menu-trigger" aria-label="Open navigation" aria-expanded={open} onClick={() => setOpen(true)}><span aria-hidden="true">☰</span></button><Link href="/" className="wordmark" aria-label="Sacred Commerce home">Sacred Commerce<span>Considered living</span></Link><div className="header-search"><SearchField maxLength={80} onSearch={query => router.push(`/products${query ? `?q=${encodeURIComponent(query)}` : ''}`)} /></div><div className="header-actions"><div className="desktop-account"><AuthControls key={accountRevision} onSignedOut={signedOut} /></div><Link href="/cart" className="cart-label" aria-label="Cart">Cart{cartCount!==undefined && Number.isSafeInteger(cartCount) && cartCount>=0 ? ` (${cartCount})` : ''}</Link></div></div>{links()}<div className="mobile-search"><SearchField maxLength={80} onSearch={query => router.push(`/products${query ? `?q=${encodeURIComponent(query)}` : ''}`)} /></div></Container></header><MobileMenu open={open} onClose={() => setOpen(false)}>{links(true)}{open && <AuthControls key={accountRevision} onSignedOut={signedOut} onNavigate={() => setOpen(false)} />}</MobileMenu></>;
}
export function MobileMenu({ open,onClose,children }: { open:boolean; onClose:()=>void; children:React.ReactNode }) { return <Drawer open={open} onClose={onClose} title="Explore Sacred Commerce" closeLabel="Close navigation"><p className="eyebrow">Thoughtful choices, at your pace</p>{children}<p className="drawer-note">Independent demo. No real purchases or deliveries.</p></Drawer>; }
