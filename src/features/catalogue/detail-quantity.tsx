'use client';
import Link from 'next/link';
import { useCallback,useEffect,useRef,useState,useSyncExternalStore } from 'react';
import { QuantityControl } from '../../components/ui/quantity-control';
import { Button,ActionLink } from '../../components/ui/button';
import { requestCart,CartRequestError,cartPrice } from '../cart/client';
import { parseQuantityDraft } from '../cart/draft';
import { safeReturnPath } from '../../lib/auth-contract';
import { subscribeAuthChanges } from '../../lib/auth-events';
export function DetailQuantity({stock,productId,slug,pricePaise}:{stock:number;productId:string;slug:string;pricePaise:number}) {
  const [draft,setValue]=useState<string|null>(null);const [revision,setRevision]=useState<number|null>(null);
  const [cartId,setCartId]=useState<string|null>(null);const epoch=useRef(0);
  const [checking,setChecking]=useState(stock>0);const [pending,setPending]=useState(false);const busy=useRef(false);
  const [message,setMessage]=useState('');const [error,setError]=useState('');const [review,setReview]=useState(false);const [added,setAdded]=useState(false);
  const anchor=useRef<HTMLDivElement>(null);const [sticky,setSticky]=useState(false);
  const storageKey=`sacred-product-quantity:${productId}`;const max=Math.min(10,stock);
  const stored=useSyncExternalStore(subscribeDraft,()=>readDraft(storageKey),()=>null);
  const value=draft??(stored&&parseQuantityDraft(stored,stock)!==null?stored:'1');
  const valid=parseQuantityDraft(value,stock)!==null;
  const next=safeReturnPath(`/products/${slug}`);const signIn=`/login?next=${encodeURIComponent(next)}`;
  const read=useCallback((signal?:AbortSignal)=>{const generation=epoch.current;return requestCart('/api/cart','GET',undefined,signal).then(cart=>{if(!signal?.aborted&&generation===epoch.current){setRevision(cart.revision);setCartId(cart.id);}},cause=>{if(!signal?.aborted&&generation===epoch.current){setRevision(null);setCartId(null);if(!(cause instanceof CartRequestError&&cause.status===401))setError(cause instanceof Error?cause.message:'Cart is unavailable. Please retry.');}}).finally(()=>{if(!signal?.aborted&&generation===epoch.current)setChecking(false);});},[]);
  async function load(){setChecking(true);setError('');setReview(false);await read();}
  useEffect(()=>{
    const controller=new AbortController();if(stock>0)void read(controller.signal);
    const unsubscribe=subscribeAuthChanges(change=>{epoch.current++;controller.abort();busy.current=false;setPending(false);setChecking(false);setRevision(null);setCartId(null);setAdded(false);setMessage('');setReview(change==='SIGNED_IN');setError(change==='SIGNED_IN'?'Your sign-in changed. Reload your cart before adding.':'');});
    return()=>{controller.abort();unsubscribe();};
  },[read,stock]);
  useEffect(()=>{const target=anchor.current;if(!target)return;const observer=new IntersectionObserver(([entry])=>setSticky(!entry.isIntersecting&&entry.boundingClientRect.top<0));observer.observe(target);return()=>observer.disconnect();},[]);
  function change(nextValue:string){setValue(nextValue);setAdded(false);setMessage('');try{if(parseQuantityDraft(nextValue,stock)!==null)sessionStorage.setItem(storageKey,nextValue);}catch{/* Optional draft only. */}}
  async function add() {
    if(busy.current||revision===null||cartId===null||!valid||review)return;
    busy.current=true;setPending(true);setError('');setMessage('');setAdded(false);
    const generation=epoch.current;
    try {const cart=await requestCart('/api/cart/items','POST',{productId,quantity:parseQuantityDraft(value,stock),expectedRevision:revision},undefined,cartId);if(generation!==epoch.current)return;setRevision(cart.revision);setCartId(cart.id);setAdded(true);setMessage('Added to your cart.');try{sessionStorage.removeItem(storageKey);}catch{/* Optional draft only. */}}
    catch(cause){if(generation!==epoch.current)return;const failure=cause instanceof CartRequestError?cause:null;setError(failure?.message??'Your add could not be confirmed. Reload your cart before trying again.');if(failure?.status===401||failure?.code==='CART_CONTEXT_CHANGED'){setRevision(null);setCartId(null);}if(failure?.status!==401)setReview(true);}
    finally{if(generation===epoch.current){busy.current=false;setPending(false);}}
  }
  const action=()=>stock===0?<Button disabled>Unavailable — out of stock</Button>:checking?<Button disabled>Checking sign-in…</Button>:review&&revision===null?<Button disabled>Reload cart before adding</Button>:revision===null?<Link className="button button-primary" href={signIn}>Sign in to add to cart</Link>:<Button onClick={()=>void add()} pending={pending} disabled={!valid||review}>{pending?'Adding to cart…':'Add to cart'}</Button>;
  return <div className="detail-quantity"><div ref={anchor}><QuantityControl value={value} onChange={change} max={stock} disabled={stock===0||pending} error={stock>0&&!valid?`Choose a whole quantity from 1 to ${max}. This draft has not been saved.`:undefined}/><div className="purchase-actions">{action()}{added&&<ActionLink href="/cart" tone="secondary">View cart</ActionLink>}</div></div>
    <p className="field-hint">{stock===0?'This demo item is unavailable. Browse related items below.':revision===null?'Sign in is required. Your selected quantity is a draft; adding remains your choice after sign-in.':'Your cart is saved to your account. Items are not reserved until a purchase is confirmed.'}</p>
    <p role="status" aria-live="polite" className="cart-status">{message}</p>{error&&<div role="alert" className="purchase-error"><p>{error}</p><Button tone="secondary" onClick={()=>void load()} disabled={checking||pending}>{review?'Reload cart':'Retry cart connection'}</Button>{review&&<ActionLink href="/cart" tone="quiet">Review saved cart</ActionLink>}</div>}
    {sticky&&<div className="mobile-purchase-bar" aria-label="Product purchase controls"><div><strong>{cartPrice(pricePaise)}</strong><span>Quantity {value}</span></div>{action()}{error&&<p>{error}</p>}{added&&<Link href="/cart">View cart</Link>}</div>}
  </div>;
}
function readDraft(key:string):string|null {try{return sessionStorage.getItem(key);}catch{return null;}}
function subscribeDraft(callback:()=>void){window.addEventListener('storage',callback);return()=>window.removeEventListener('storage',callback);}
