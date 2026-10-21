import type { Metadata } from 'next';
import './globals.css';
import '../features/demo/storefront.css';
import localFont from 'next/font/local';
import { AppHeader } from '../components/layout/app-header';
import { AppFooter } from '../components/layout/footer';
import { DemoHeader } from '../features/demo/store';
const editorial=localFont({ src:'../../public/fonts/cormorant-garamond/latin-variable.woff2',variable:'--font-editorial',display:'swap',weight:'300 700',fallback:['Georgia'] });
const body=localFont({ src:'../../public/fonts/manrope/latin-variable.woff2',variable:'--font-body',display:'swap',weight:'200 800',fallback:['Arial'] });

export const metadata: Metadata = {
  title: 'Sacred Commerce — independent interview demo',
  description: 'Independent interview demo. Simulated purchases only. Not an official Isha Life store.',
};
export const runtime = 'nodejs';

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className={`${editorial.variable} ${body.variable}`}><body className={process.env.SACRED_DEMO_MODE==='true'?'sc-theme':undefined}><a className="skip-link" href="#main-content">Skip to content</a>{process.env.SACRED_DEMO_MODE==='true'?<DemoHeader/>:<AppHeader />}{children}<AppFooter demo={process.env.SACRED_DEMO_MODE==='true'} /></body></html>;
}
