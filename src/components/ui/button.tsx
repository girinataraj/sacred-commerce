import Link from 'next/link';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
type Tone='primary'|'secondary'|'quiet';
export function Button({ tone='primary',pending=false,children,className='',disabled,...props }: ButtonHTMLAttributes<HTMLButtonElement> & { tone?:Tone; pending?:boolean }) {
  return <button {...props} disabled={disabled || pending} aria-busy={pending || undefined} className={`button button-${tone} ${className}`}>{children}{pending && <span className="button-progress" aria-hidden="true" />}</button>;
}
export function ActionLink({ href,children,tone='primary' }: { href:string; children:ReactNode; tone?:Tone }) {
  return <Link href={href} className={`button button-${tone}`}>{children}</Link>;
}
