'use client';
import { useEffect, useId, useRef, type ReactNode } from 'react';
export function Drawer({ open,onClose,title,children,closeLabel='Close panel' }: { open:boolean; onClose:()=>void; title:string; children:ReactNode; closeLabel?:string }) {
  const ref=useRef<HTMLDialogElement>(null); const id=useId();
  useEffect(() => {
    if (!open || !ref.current) return;
    const dialog=ref.current; const trigger=document.activeElement as HTMLElement | null; const overflow=document.body.style.overflow;
    document.body.style.overflow='hidden'; dialog.showModal(); dialog.querySelector<HTMLButtonElement>('button')?.focus();
    return () => { dialog.close(); document.body.style.overflow=overflow; if (trigger?.isConnected) trigger.focus(); };
  },[open]);
  return <dialog ref={ref} className="drawer" aria-labelledby={id} aria-modal="true" onKeyDown={event => {
    if (event.key!=='Tab') return;
    const controls=Array.from(event.currentTarget.querySelectorAll<HTMLElement>('a[href]:not([tabindex="-1"]),button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')).filter(el => el.getClientRects().length>0);
    const first=controls[0]; const last=controls.at(-1);
    if (!first || !last) { event.preventDefault(); return; }
    if (event.shiftKey && document.activeElement===first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement===last) { event.preventDefault(); first.focus(); }
  }} onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { const rect=event.currentTarget.getBoundingClientRect(); if (event.target===event.currentTarget && (event.clientX<rect.left || event.clientX>rect.right || event.clientY<rect.top || event.clientY>rect.bottom)) onClose(); }}>
    <div className="drawer-heading"><h2 id={id}>{title}</h2><button type="button" className="icon-button" aria-label={closeLabel} onClick={onClose}>×</button></div><div className="drawer-content">{children}</div>
  </dialog>;
}
