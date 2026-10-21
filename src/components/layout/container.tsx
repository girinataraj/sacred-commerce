import type { ReactNode } from 'react';
export function Container({ children,className='' }: { children:ReactNode; className?:string }) { return <div className={`container ${className}`}>{children}</div>; }
export function SectionHeader({ eyebrow,title,description }: { eyebrow?:string; title:string; description?:string }) { return <div className="section-heading">{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h2>{title}</h2>{description && <p>{description}</p>}</div>; }
