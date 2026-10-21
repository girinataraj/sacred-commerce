'use client';
import { useId, useState } from 'react';
import { Button } from './button';
export function SearchField({ label='Search products',initialValue='',onSearch,disabled=false,pending=false,notice,maxLength=100 }: { label?:string; initialValue?:string; onSearch?:(query:string)=>void; disabled?:boolean; pending?:boolean; notice?:string; maxLength?:number }) {
  const id=useId(); const [value,setValue]=useState(initialValue);
  return <form className="search-field" role="search" aria-label={label} onSubmit={event => { event.preventDefault(); if (!disabled && !pending && onSearch) onSearch(value.trim()); }}>
    <label htmlFor={id} className="sr-only">{label}</label><div className="search-control"><span aria-hidden="true" className="search-symbol">⌕</span><input id={id} type="search" value={value} placeholder="Find something thoughtful" onChange={event => setValue(event.target.value)} disabled={disabled || pending} maxLength={maxLength} aria-describedby={notice ? `${id}-notice` : undefined} />{value && !disabled && <button type="button" className="icon-button" aria-label={`Clear ${label.toLowerCase()}`} onClick={() => setValue('')}>×</button>}<Button tone="quiet" type="submit" disabled={disabled || !onSearch} pending={pending} aria-label={`Submit ${label.toLowerCase()}`}>Search</Button></div>{notice && <p id={`${id}-notice`} className="search-notice">{notice}</p>}
  </form>;
}
