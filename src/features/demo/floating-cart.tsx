'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {useEffect,useRef,useState,useSyncExternalStore,type CSSProperties} from 'react';
import {ShopIcon} from './icons';
const noSubscribe=()=>()=>{};
export function FloatingCart({count,menuOpen}:{count:number;menuOpen:boolean}){
 const pathname=usePathname();const mounted=useSyncExternalStore(noSubscribe,()=>true,()=>false);
 const link=useRef<HTMLAnchorElement>(null);const [lift,setLift]=useState<number|null>(0);
 const hidden=!mounted||menuOpen||pathname==='/cart'||pathname==='/checkout';
 useEffect(()=>{
  if(hidden)return;let frame=0;
  const measure=()=>{frame=0;const node=link.current;if(!node||document.activeElement===node)return;const r=node.getBoundingClientRect();
   const previousLift=parseFloat(node.style.getPropertyValue('--sc-cart-lift'))||0;
   const baseBottom=innerHeight-r.bottom-previousLift;
   const controls=Array.from(document.querySelectorAll<HTMLElement>('main a, main button, main input, main select, main textarea, main .price-block, main .availability, footer a')).filter(control=>!control.querySelector('img')).map(control=>control.getBoundingClientRect());
   // Product imagery is an obstacle too; find the nearest clear vertical gap.
   const images=Array.from(document.querySelectorAll<HTMLElement>('[data-product-id] .product-image, .product-card .product-image, .demo-detail > .product-image')).map(image=>image.getBoundingClientRect());
   const obstacles=[...controls,...images].filter(c=>c.width>0&&c.height>0&&c.bottom>0&&c.top<innerHeight&&c.left<r.right+8&&c.right>r.left-8);
   const baselineBottom=innerHeight-baseBottom;
   const offsets=[0,72,144,...obstacles.flatMap(c=>[baselineBottom-c.top+8,baselineBottom-c.bottom-r.height-8])].filter(offset=>offset>=0&&baselineBottom-offset-r.height>=16).sort((a,b)=>a-b);
   const safe=offsets.find(offset=>{const bottom=baselineBottom-offset,top=bottom-r.height;return !obstacles.some(c=>c.top<bottom+8&&c.bottom>top-8);});
   setLift(previous=>previous===(safe??null)?previous:(safe??null));
  };
  const schedule=()=>{if(!frame)frame=requestAnimationFrame(measure);};
  measure();window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule);
  const observer=new ResizeObserver(schedule);observer.observe(document.body);
  return()=>{cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule);};
 },[hidden,pathname,count]);
 if(hidden)return null;
 return <Link ref={link} prefetch={false} href="/cart" className="sc-floating-cart" style={{'--sc-cart-lift':`${lift??0}px`} as CSSProperties} data-obstructed={lift===null} aria-hidden={lift===null||undefined} tabIndex={lift===null?-1:0} aria-label={`Open guest cart, ${count} ${count===1?'item':'items'}`}><ShopIcon name="bag"/><span key={count} className="sc-floating-count" aria-hidden="true">{count}</span></Link>;
}
