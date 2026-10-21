import type { ReactNode } from 'react';
export function EmptyState({ title,children,action }: { title:string; children:ReactNode; action:ReactNode }) {
  return <div className="feedback empty-state"><span aria-hidden="true" className="feedback-symbol">◇</span><h3>{title}</h3><p>{children}</p><div className="feedback-action">{action}</div></div>;
}
export function ErrorPanel({ title='Something could not be loaded',children,action }: { title?:string; children:ReactNode; action:ReactNode }) {
  return <div className="feedback error-panel" role="alert"><span aria-hidden="true" className="feedback-symbol">!</span><h3>{title}</h3><p>{children}</p><div className="feedback-action">{action}</div></div>;
}
