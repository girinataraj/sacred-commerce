'use client';
import Link from 'next/link';
import { useCallback,useEffect,useRef,useState,type FormEvent } from 'react';
import { Button,ActionLink } from '../../components/ui/button';
import { EmptyState,ErrorPanel } from '../../components/ui/feedback';
import { ProductImage } from '../../components/ui/product-card';
import { QuantityControl } from '../../components/ui/quantity-control';
import { requestCart,CartRequestError,cartPrice } from './client';
import { parseQuantityDraft } from './draft';
import type { CartDTO,CartLineDTO } from './types';
import { subscribeAuthChanges } from '../../lib/auth-events';
export function CartLoading(){return <div role="status" aria-label="Loading your cart" className="cart-layout cart-loading"><div><p>Loading your saved cart…</p>{[1,2].map(item=><div className="cart-skeleton" key={item} aria-hidden="true"><div className="skeleton"/><div className="skeleton skeleton-line"/></div>)}</div><div className="skeleton cart-summary-skeleton" aria-hidden="true"/></div>;}
export function CartExperience() {
  const [cart,setCart]=useState<CartDTO|null>(null);const [loading,setLoading]=useState(true);
  const [error,setError]=useState<CartRequestError|null>(null);const [pending,setPending]=useState(false);const busy=useRef(false);
  const [message,setMessage]=useState('');const feedback=useRef<HTMLParagraphElement>(null);
  const epoch=useRef(0);
  const read=useCallback((signal?:AbortSignal)=>{const generation=epoch.current;return requestCart('/api/cart','GET',undefined,signal).then(data=>{if(!signal?.aborted&&generation===epoch.current)setCart(data);},cause=>{if(!signal?.aborted&&generation===epoch.current){setError(cause instanceof CartRequestError?cause:new CartRequestError(503,'SERVICE_UNAVAILABLE','Your cart could not be loaded. Please retry.'));setCart(null);}}).finally(()=>{if(!signal?.aborted&&generation===epoch.current)setLoading(false);});},[]);
  async function load(){setLoading(true);setError(null);setMessage('');await read();}
  useEffect(()=>{const controller=new AbortController();void read(controller.signal);const unsubscribe=subscribeAuthChanges(change=>{epoch.current++;controller.abort();busy.current=false;setPending(false);setLoading(false);setMessage('');setCart(null);setError(new CartRequestError(change==='SIGNED_OUT'?401:409,'CART_CONTEXT_CHANGED','Your sign-in changed in another tab. Reload your cart to continue.'));});return()=>{controller.abort();unsubscribe();};},[read]);
  async function mutate(path:string,method:string,body:Record<string,unknown>,notice:string):Promise<boolean>{
    if(busy.current||!cart||error||loading)return false;
    busy.current=true;setPending(true);setError(null);setMessage('');
    const generation=epoch.current;
    try{const data=await requestCart(path,method,{...body,expectedRevision:cart.revision},undefined,cart.id);if(generation!==epoch.current)return false;const changed=data.items.filter(item=>{const before=cart.items.find(previous=>previous.productId===item.productId);return before&&before.unitPricePaise!==item.unitPricePaise;});setCart(data);setMessage(notice+(changed.length?` Prices changed for ${changed.map(item=>item.name).join(', ')}. Please review the current prices.`:''));feedback.current?.focus();return true;}
    catch(cause){if(generation!==epoch.current)return false;const failure=cause instanceof CartRequestError?cause:new CartRequestError(503,'SERVICE_UNAVAILABLE','The change could not be confirmed. Reload your cart.');setError(failure);if(failure.status===401||failure.code==='CART_CONTEXT_CHANGED')setCart(null);return false;}
    finally{if(generation===epoch.current){busy.current=false;setPending(false);}}
  }
  if(!cart&&loading)return <CartLoading/>;
  if(!cart&&error)return error.status===401?<div className="cart-sign-in"><p className="eyebrow">Saved to your account</p><h2>Sign in to see your saved cart</h2><p>Your session is unavailable. Sign in to continue; no change was confirmed.</p><ActionLink href="/login?next=%2Fcart">Sign in to view your cart</ActionLink><ActionLink href="/products" tone="quiet">Continue shopping</ActionLink></div>:<ErrorPanel title={error.code==='CART_CONTEXT_CHANGED'?'Your sign-in changed':'Your cart could not be loaded'} action={<Button onClick={()=>void load()}>{error.code==='CART_CONTEXT_CHANGED'?'Reload cart':'Retry loading cart'}</Button>}>{error.message}</ErrorPanel>;
  if(!cart)return null;
  return <><p ref={feedback} id="cart-feedback" tabIndex={-1} role="status" aria-live="polite" className="cart-status">{message}</p>
    {error&&<ErrorPanel title={error.status===409?'Please review your saved cart':'Your change could not be confirmed'} action={<Button onClick={()=>void load()} disabled={loading}>Reload cart</Button>}>{error.message} Your last confirmed quantities and totals are shown.</ErrorPanel>}
    {cart.items.length===0?<EmptyState title="Your cart is waiting for something thoughtful" action={<><ActionLink href="/products">Browse products</ActionLink><ActionLink href="/collections/navratri-2026" tone="secondary">Explore Navratri</ActionLink></>}>Explore original demo offerings, then add what feels right for you.</EmptyState>:<div className="cart-layout" aria-busy={pending||loading}>
      <section aria-label="Cart items" className="cart-items"><div className="cart-list-heading"><p>{cart.items.length} {cart.items.length===1?'offering':'offerings'} in your cart</p><Button tone="quiet" disabled={pending||loading||!!error} onClick={()=>void mutate('/api/cart','DELETE',{},'Your cart has been cleared.')}>Clear cart</Button></div>
        {cart.items.map(item=><CartLine key={`${item.productId}:${cart.revision}`} item={item} disabled={pending||loading||!!error} onSave={quantity=>mutate(`/api/cart/items/${item.productId}`,'PATCH',{quantity},'Quantity updated.')} onRemove={()=>mutate(`/api/cart/items/${item.productId}`,'DELETE',{},`${item.name} removed from your cart.`)}/>)}
        <ActionLink href="/products" tone="quiet">Continue shopping</ActionLink>
      </section>
      <section className="cart-summary" aria-label="Order summary"><p className="eyebrow">A considered choice</p><h2>Order summary</h2><dl><div><dt>Subtotal</dt><dd>{cartPrice(cart.subtotalPaise)}</dd></div></dl><p>Demo delivery: Free</p><p>Additional demo tax: ₹0</p><dl className="cart-grand-total"><div><dt>Total</dt><dd>{cartPrice(cart.totalPaise)}</dd></div></dl><p className="field-hint">Your total reflects the listed selling prices. Demo reference prices are fictional comparisons.</p>
        {!cart.canCheckout&&<p className="cart-stock-note">Review the marked items. Remove unavailable products or choose a quantity within current stock.</p>}
        {cart.canCheckout&&!error&&!loading?<ActionLink href="/checkout">Continue to checkout</ActionLink>:<Button disabled>Review cart before checkout</Button>}<p className="field-hint">Simulated purchases only. No real money is charged. Your cart does not reserve inventory.</p>
      </section>
    </div>}
  </>;
}
function CartLine({item,disabled,onSave,onRemove}:{item:CartLineDTO;disabled:boolean;onSave:(quantity:number)=>Promise<boolean>;onRemove:()=>Promise<boolean>}) {
  const [draft,setDraft]=useState(String(item.quantity));const [error,setError]=useState('');const form=useRef<HTMLFormElement>(null);
  async function submit(event:FormEvent){event.preventDefault();const quantity=parseQuantityDraft(draft,item.stock);if(quantity===null){setError(`Choose a whole quantity from 1 to ${Math.min(10,item.stock)}. Your saved quantity has not changed.`);setDraft(String(item.quantity));form.current?.querySelector('input')?.focus();return;}setError('');if(!await onSave(quantity)){setDraft(String(item.quantity));form.current?.querySelector('input')?.focus();}}
  const status=item.availability==='INACTIVE'?'No longer available. Remove this item to continue.':item.availability==='OUT_OF_STOCK'?'Out of stock. Remove this item or return later.':item.availability==='INSUFFICIENT_STOCK'?`Only ${item.stock} available. Reduce the quantity or remove this item.`:`${item.stock} currently available`;
  return <article className="cart-line" aria-labelledby={`cart-product-${item.productId}`}><div className="cart-thumbnail"><ProductImage src={item.imagePath} alt={item.imageAlt}/></div><div className="cart-line-copy"><h2 id={`cart-product-${item.productId}`}><Link href={`/products/${item.slug}`}>{item.name}</Link></h2><p className={!item.canPurchase?'field-error':'cart-availability'}>{status}</p><p className="cart-unit-price">{cartPrice(item.unitPricePaise)} <span>each</span></p><form ref={form} onSubmit={event=>void submit(event)} noValidate className="cart-quantity-form"><QuantityControl label={`Quantity for ${item.name}`} value={draft} onChange={value=>{setDraft(value);setError('');}} max={item.stock} disabled={disabled||!item.active||item.stock===0} error={error}/><Button type="submit" tone="secondary" disabled={disabled||!item.active||item.stock===0}>Update quantity</Button><p className="field-hint">Update quantity to save your changes.</p></form><Button tone="quiet" aria-label={`Remove ${item.name}`} disabled={disabled} onClick={()=>void onRemove()}>Remove</Button></div><div className="cart-line-total"><span>Line total</span><strong>{cartPrice(item.lineTotalPaise)}</strong></div></article>;
}
