'use client';
import {useCallback,useEffect,useRef,useState,type FormEvent} from 'react';
import {useRouter} from 'next/navigation';
import {Button,ActionLink} from '../../components/ui/button';
import {FormField} from '../../components/ui/form-field';
import {EmptyState,ErrorPanel} from '../../components/ui/feedback';
import {subscribeAuthChanges} from '../../lib/auth-events';
import {requestCart,CartRequestError} from '../cart/client';
import type {CartDTO} from '../cart/types';
import {addressSchema,type Address,type CommitInput} from '../checkout/schemas';
import {clearPending,freezeAttempt,isDefiniteRejection,loadPending,savePending} from '../checkout/attempt';
import type {CheckoutResult,QuoteDTO} from '../checkout/types';
import {requestCustomer,CustomerRequestError} from './api';
import {checkoutResultSchema,quoteResponseSchema,sessionSchema} from './contracts';
import {PrivateLoading,PurchaseSummary,SignInNotice} from './shared';

const blank:Address={name:'',email:'',phone:'',line1:'',line2:'',city:'',state:'',pin:'',country:'IN'};
const demo:Address={name:'Demo Shopper',email:'shopper@example.test',phone:'9000000000',line1:'12 Fictional Garden Lane',line2:'Demo address only',city:'Coimbatore',state:'Tamil Nadu',pin:'641001',country:'IN'};
const fields:{key:Exclude<keyof Address,'country'>;label:string;autoComplete:string;type?:string;max:number;hint?:string}[]=[
  {key:'name',label:'Full name',autoComplete:'name',max:80},
  {key:'email',label:'Email',autoComplete:'email',type:'email',max:254,hint:'Demo only. No confirmation email will be sent.'},
  {key:'phone',label:'Phone',autoComplete:'tel-national',type:'tel',max:10,hint:'Ten digits, without a country code.'},
  {key:'line1',label:'Address line 1',autoComplete:'address-line1',max:120},
  {key:'line2',label:'Address line 2',autoComplete:'address-line2',max:120},
  {key:'city',label:'City',autoComplete:'address-level2',max:80},
  {key:'state',label:'State',autoComplete:'address-level1',max:80},
  {key:'pin',label:'PIN code',autoComplete:'postal-code',max:6,hint:'Six digits, starting from 1–9.'},
];
function failure(cause:unknown){return cause instanceof CustomerRequestError?cause:cause instanceof CartRequestError?new CustomerRequestError(cause.status,cause.code,cause.message):new CustomerRequestError(503,'SERVICE_UNAVAILABLE','Your saved cart could not be loaded. Please retry.');}
export function CheckoutExperience(){
  const router=useRouter();
  const [cart,setCart]=useState<CartDTO|null>(null),[address,setAddress]=useState<Address>(blank),[mode,setMode]=useState<'SUCCESS'|'DECLINE'>('SUCCESS');
  const [quote,setQuote]=useState<QuoteDTO|null>(null),[errors,setErrors]=useState<Record<string,string>>({}),[error,setError]=useState<CustomerRequestError|null>(null);
  const [hasPayload,setHasPayload]=useState(false),[loading,setLoading]=useState(true),[pending,setPending]=useState(false),[unknown,setUnknown]=useState(false),[key,setKey]=useState<string|null>(null),[declined,setDeclined]=useState<CheckoutResult|null>(null);
  const epoch=useRef(0),busy=useRef(false),identity=useRef<string|null>(null),payload=useRef<CommitInput|null>(null),outcomeHeading=useRef<HTMLHeadingElement>(null);
  useEffect(()=>{if(!loading&&(declined||unknown))outcomeHeading.current?.focus();},[declined,unknown,loading]);
  useEffect(()=>{if(quote&&!pending)document.getElementById('confirm-purchase')?.focus();},[quote,pending]);
  const invalidate=useCallback(()=>{epoch.current++;identity.current=null;payload.current=null;setHasPayload(false);busy.current=false;setCart(null);setQuote(null);setAddress(blank);setErrors({});setKey(null);setUnknown(false);setDeclined(null);setLoading(false);setPending(false);setError(new CustomerRequestError(401,'ACCOUNT_CHANGED','Your sign-in changed. Reload checkout to continue with the current account.'));},[]);
  const accept=useCallback(async(result:CheckoutResult,generation:number,cartId:string,attemptKey:string)=>{
    // Re-authorize before exposing the result after an uncertain or delayed request.
    const [session,fresh]=await Promise.all([requestCustomer('/api/auth/session',sessionSchema),requestCart('/api/cart','GET')]);
    if(generation!==epoch.current)return;
    if(session.actor.userId!==identity.current||fresh.id!==cartId){invalidate();return;}
    setUnknown(false);setQuote(null);
    if(result.payment.outcome==='SUCCEEDED'){clearPending(cartId,attemptKey);router.replace(`/orders/${result.order.id}`);}
    else {setDeclined(result);setCart(fresh);}
  },[invalidate,router]);
  const lookup=useCallback(async(attemptKey:string,generation:number,cartId:string)=>{
    setUnknown(true);setError(null);
    try{await accept(await requestCustomer(`/api/checkout/attempts/${attemptKey}`,checkoutResultSchema),generation,cartId,attemptKey);}
    catch(cause){if(generation!==epoch.current)return;const err=failure(cause);if(err.status===401){invalidate();return;}setError(new CustomerRequestError(err.status,err.code,err.status===404?'No saved result is visible yet. This attempt is still unconfirmed; do not start another purchase.':'We cannot confirm the result yet. Keep this attempt and check again.'));}
  },[accept,invalidate]);
  const boot=useCallback(()=>{
    const generation=++epoch.current;
    return requestCustomer('/api/auth/session',sessionSchema).then(async session=>{const fresh=await requestCart('/api/cart','GET');if(generation!==epoch.current)return;identity.current=session.actor.userId;setError(null);setQuote(null);setUnknown(false);setDeclined(null);setKey(null);payload.current=null;setHasPayload(false);setCart(fresh);const saved=loadPending(fresh.id);if(saved){setKey(saved);await lookup(saved,generation,fresh.id);}})
      .catch(cause=>{if(generation===epoch.current){setCart(null);setError(failure(cause));}})
      .finally(()=>{if(generation===epoch.current)setLoading(false);});
  },[lookup]);
  function reloadCheckout(){setLoading(true);setCart(null);setQuote(null);setError(null);void boot();}
  useEffect(()=>{void boot();const lifecycle=epoch;const unsub=subscribeAuthChanges(invalidate);const check=()=>{const generation=epoch.current;void requestCustomer('/api/auth/session',sessionSchema).then(session=>{if(generation===epoch.current&&identity.current&&session.actor.userId!==identity.current)invalidate();},()=>{if(generation===epoch.current)invalidate();});};const restored=(event:PageTransitionEvent)=>{if(event.persisted)check();};window.addEventListener('focus',check);window.addEventListener('pageshow',restored);return()=>{lifecycle.current++;unsub();window.removeEventListener('focus',check);window.removeEventListener('pageshow',restored);};},[boot,invalidate]);
  function edit(next:Address){setAddress(next);setQuote(null);setErrors({});setError(null);}
  async function review(event:FormEvent){
    event.preventDefault();if(busy.current||unknown||declined||!cart)return;
    const parsed=addressSchema.safeParse(address);setError(null);
    if(!parsed.success){const messages:Record<string,string>={};for(const issue of parsed.error.issues)messages[String(issue.path[0])]='Please enter a valid '+(fields.find(field=>field.key===issue.path[0])?.label.toLowerCase()??'value')+'.';setErrors(messages);setError(new CustomerRequestError(422,'VALIDATION_FAILED','Check your delivery details. Correct the highlighted fields to continue.'));document.getElementById(`delivery-${Object.keys(messages)[0]}`)?.focus();return;}
    busy.current=true;setPending(true);setQuote(null);const generation=epoch.current;
    try{const data=await requestCustomer('/api/checkout/quote',quoteResponseSchema,{body:{cartRevision:cart.revision,address:parsed.data},cartId:cart.id});if(generation===epoch.current){setAddress(parsed.data);setErrors({});setQuote(data);}}
    catch(cause){if(generation===epoch.current){const err=failure(cause);if(err.status===401||err.code==='CART_CONTEXT_CHANGED')invalidate();else setError(err);}}
    finally{if(generation===epoch.current){busy.current=false;setPending(false);}}
  }
  async function send(frozen:CommitInput,cartId:string){
    const generation=epoch.current;setError(null);setPending(true);busy.current=true;
    let durableResultReceived=false;
    try{const result=await requestCustomer('/api/checkout',checkoutResultSchema,{body:frozen,cartId});durableResultReceived=true;await accept(result,generation,cartId,frozen.idempotencyKey);}
    catch(cause){if(generation!==epoch.current)return;const err=failure(cause);if(err.status===401||err.code==='CART_CONTEXT_CHANGED'){
        // A direct verified rejection precedes the transaction. A later failed
        // presentation authorization must keep the already-durable attempt.
        if(!durableResultReceived&&((err.status===401&&err.code==='UNAUTHENTICATED')||err.code==='CART_CONTEXT_CHANGED'))clearPending(cartId,frozen.idempotencyKey);
        invalidate();return;}
      if(isDefiniteRejection(err.status,err.code)){clearPending(cartId,frozen.idempotencyKey);payload.current=null;setHasPayload(false);setKey(null);setQuote(null);setUnknown(false);setError(err);}
      else{setQuote(null);setUnknown(true);await lookup(frozen.idempotencyKey,generation,cartId);}}
    finally{if(generation===epoch.current){busy.current=false;setPending(false);}}
  }
  function confirm(){if(busy.current||!quote||!cart||unknown)return;try{const frozen=freezeAttempt({address,cartRevision:quote.cartRevision,quoteDigest:quote.digest,simulationMode:mode,idempotencyKey:crypto.randomUUID()});savePending(cart.id,frozen.idempotencyKey);payload.current=frozen;setHasPayload(true);setKey(frozen.idempotencyKey);void send(frozen,cart.id);}catch{setQuote(null);setError(new CustomerRequestError(503,'RECOVERY_STORAGE_UNAVAILABLE','Recovery storage is unavailable or another attempt is unresolved. No new purchase was sent. Enable session storage and reload checkout.'));}}
  async function checkAgain(){if(busy.current||!key||!cart)return;busy.current=true;setPending(true);const generation=epoch.current;await lookup(key,generation,cart.id);if(generation===epoch.current){busy.current=false;setPending(false);}}
  async function newAttempt(){if(!cart||!key||!declined)return;clearPending(cart.id,key);setAddress(declined.order.address);await boot();}
  if(loading)return <PrivateLoading label="Loading your private checkout"/>;
  if(!cart)return error?.status===401?<SignInNotice next="/checkout" message={error.message}/>:<ErrorPanel title="Checkout is unavailable" action={<Button onClick={reloadCheckout}>Reload checkout</Button>}>{error?.message??'Your saved cart could not be loaded.'}</ErrorPanel>;
  if(declined)return <section className="customer-panel"><p className="eyebrow">Saved simulated outcome</p><h2 ref={outcomeHeading} tabIndex={-1}>Simulated payment declined</h2><p role="status">No real money was charged. No purchase was confirmed. Your cart remains saved and stock was not deducted.</p><p>Attempt reference: {declined.order.reference}</p><div className="customer-actions"><ActionLink href={`/orders/${declined.order.id}`} tone="secondary">View saved attempt</ActionLink><Button onClick={()=>void newAttempt()}>Try another simulated attempt</Button></div></section>;
  if(unknown)return <section className="customer-panel" aria-busy={pending}><p className="eyebrow">Same-attempt recovery</p><h2 ref={outcomeHeading} tabIndex={-1}>Purchase result is not confirmed yet</h2><p role="status">A delayed response does not tell us whether the purchase completed. We will check this same attempt; do not place another order.</p>{error&&<p role="alert">{error.message}</p>}<div className="customer-actions"><Button disabled={pending} onClick={()=>void checkAgain()}>Check status again</Button>{hasPayload&&<Button tone="secondary" disabled={pending} onClick={()=>void send(payload.current!,cart.id)}>Retry same attempt</Button>}<ActionLink href="/orders" tone="quiet">View my orders</ActionLink></div><p className="field-hint">After a reload, recovery uses status lookup only. Delivery details are never stored in browser recovery storage. If this remains unresolved, keep this tab and seek demo support.</p></section>;
  if(!cart.items.length)return <EmptyState title="Your cart is empty" action={<ActionLink href="/products">Explore offerings</ActionLink>}>Add an offering before reviewing checkout.</EmptyState>;
  return <><div className="demo-notice"><strong>Independent interview demo.</strong> Use fictional details only. No money is charged and nothing is delivered.</div>{error&&<ErrorPanel title="Please review before continuing" action={<Button type="button" onClick={reloadCheckout} disabled={pending}>Reload current cart</Button>}>{error.message} Review a fresh quote before confirming.</ErrorPanel>}
    <div className="checkout-layout" aria-busy={pending}><form onSubmit={event=>void review(event)} noValidate className="customer-panel delivery-form"><p className="eyebrow">01 · Demo delivery</p><h2>Your delivery details</h2><p>India only · Free demo delivery · No additional demo tax</p><Button type="button" tone="secondary" disabled={pending} onClick={()=>edit(demo)}>Use fictional demo details</Button><div className="delivery-fields">{fields.map(field=><FormField key={field.key} id={`delivery-${field.key}`} label={field.label} required={field.key!=='line2'} autoComplete={field.autoComplete} type={field.type??'text'} inputMode={field.key==='pin'||field.key==='phone'?'numeric':undefined} maxLength={field.max} hint={field.hint} value={address[field.key]} error={errors[field.key]} disabled={pending} onChange={event=>edit({...address,[field.key]:event.target.value})}/>)}</div><p>Country: India</p><fieldset disabled={pending} className="simulation-choice"><legend>02 · Choose a simulated payment outcome</legend><p>No card details or real payment gateway.</p>{(['SUCCESS','DECLINE'] as const).map(value=><label key={value}><input type="radio" name="simulation" value={value} checked={mode===value} onChange={()=>{setMode(value);setQuote(null);}}/>{value==='SUCCESS'?'Simulate success':'Simulate decline'}</label>)}</fieldset><Button type="submit" disabled={pending||!cart.canCheckout}>{pending?'Checking…':'Review order'}</Button>{!cart.canCheckout&&<p className="field-error">Some quantities are unavailable. <a href="/cart">Review your cart</a> before checkout.</p>}</form>
    <div className="checkout-review"><p className="eyebrow">03 · Review & confirm</p><PurchaseSummary title={quote?'Review your order':'Your saved choices'} lines={quote?.lines??cart.items} amounts={quote??cart} reviewed={!!quote}/>{quote?<section className="customer-panel final-review"><h2>Ready to confirm?</h2><p>Deliver to {address.name}, {address.line1}, {address.city} {address.pin}. Simulated outcome: {mode==='SUCCESS'?'success':'decline'}.</p><p>Editing details or payment mode requires another review. Stock is checked when you confirm.</p><Button id="confirm-purchase" type="button" disabled={pending} onClick={confirm}>{pending?'Confirming same attempt…':'Confirm simulated purchase'}</Button></section>:<p className="field-hint">Complete delivery details and select Review order to obtain current prices and availability.</p>}<ActionLink href="/cart" tone="quiet">Return to cart</ActionLink></div></div></>;
}
