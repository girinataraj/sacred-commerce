import type { SVGProps } from 'react';

export function ShopIcon({ name, ...props }: SVGProps<SVGSVGElement> & { name: 'leaf' | 'bag' | 'menu' | 'arrow' | 'check' | 'spark' }) {
  const paths = {
    leaf: <><path d="M12 21V8m0 7C3 15 3 7 3 7s9-1 9 8Zm0-3c8 0 9-9 9-9s-9-1-9 9Z" /></>,
    bag: <><path d="M5 7h14l1 14H4L5 7Z" /><path d="M8 8V6a4 4 0 0 1 8 0v2" /></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
    arrow: <><path d="M4 12h15m-6-6 6 6-6 6" /></>,
    check: <><path d="m5 12 4 4L19 6" /></>,
    spark: <><path d="m12 2 2.6 7.4L22 12l-7.4 2.6L12 22l-2.6-7.4L2 12l7.4-2.6L12 2Z" /></>,
  };
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name]}</svg>;
}
