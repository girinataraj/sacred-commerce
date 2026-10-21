'use client';
import {useEffect,useRef,useState} from 'react';
import {ShopIcon} from './icons';
export function AddButton({onAdd,disabled,label='Add to demo cart',className='button button-primary'}:{onAdd:()=>boolean;disabled:boolean;label?:string;className?:string}){
 const [added,setAdded]=useState(false);const timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
 useEffect(()=>()=>clearTimeout(timer.current),[]);
 return <button type="button" className={`${className} sc-add-button`} aria-label={label} disabled={disabled} data-added={added} onClick={()=>{
  if(!onAdd())return;
  clearTimeout(timer.current);setAdded(true);timer.current=setTimeout(()=>setAdded(false),2000);
 }}>{added?<><span aria-hidden="true">Added ✓</span></>:<>{label}<ShopIcon name="bag"/></>}</button>;
}
