'use client';
import { useId } from 'react';
export function QuantityControl({ label='Quantity',value,onChange,max,disabled=false,error }: { label?:string; value:string; onChange:(value:string)=>void; max:number; disabled?:boolean; error?:string }) {
  const number=Number(value); const unavailable=disabled || !Number.isInteger(max) || max<1;
  const canStep=Number.isInteger(number) && number>=1 && number<=Math.min(10,max);
  const id=useId();
  return <div className="quantity-field"><label htmlFor={id}>{label}</label><div className="quantity-control"><button type="button" aria-label={`Decrease ${label.toLowerCase()}`} disabled={unavailable || !canStep || number<=1} onClick={() => onChange(String(number-1))}>−</button><input id={id} type="number" inputMode="numeric" min={1} max={Math.min(10,max)} step={1} value={value} disabled={unavailable} onChange={event => onChange(event.target.value)} aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined} /><button type="button" aria-label={`Increase ${label.toLowerCase()}`} disabled={unavailable || !canStep || number>=Math.min(10,max)} onClick={() => onChange(String(number+1))}>+</button></div>{error && <p className="field-error" id={`${id}-error`}>{error}</p>}</div>;
}
