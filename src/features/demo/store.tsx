'use client';
import {useEffect,useRef,useState,useSyncExternalStore,type FormEvent} from 'react';
import Link from 'next/link';
import {demoProducts,demoCategories,normalizeDemoCart,demoTotal,type DemoCart} from './model';
import {EditorialHero} from '../../components/ui/editorial-hero';
import {PriceBlock} from '../../components/ui/product-card';
import {DemoCatalogueFilters,DemoProductGrid} from './catalogue';
import {StorefrontHeader} from './header';
import {DemoHome,DemoProductDetail,GuestExperience,PageLead,CartArtwork} from './editorial';
import {informationPages,InformationPage} from './information';
import {categoryStories} from './content';
import {ShopIcon} from './icons';
const key='sacred-commerce-standalone-demo-cart-v1';let memory='{}',memoryOnly=false;
function snapshot(){if(memoryOnly)return memory;try{return localStorage.getItem(key)??'{}';}catch{return memory;}}
function subscribe(change:()=>void){window.addEventListener('storage',change);window.addEventListener('demo-cart',change);return()=>{window.removeEventListener('storage',change);window.removeEventListener('demo-cart',change);};}
function readCart(raw:string):DemoCart{try{return normalizeDemoCart(JSON.parse(raw));}catch{return {};}}
function useCart(){return readCart(useSyncExternalStore(subscribe,snapshot,()=>'{}'));}
function saveCart(cart:DemoCart){memory=JSON.stringify(normalizeDemoCart(cart));try{localStorage.setItem(key,memory);memoryOnly=false;}catch{memoryOnly=true;/* Memory-only cart remains available while the page is open. */}window.dispatchEvent(new Event('demo-cart'));}
const money=(paise:number)=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}).format(paise/100);
export function DemoHeader(){const cart=useCart();return <StorefrontHeader count={Object.values(cart).reduce((a,b)=>a+b,0)}/>;}
export function DemoStore({path,query}:{path:string;query:Record<string,string>}){
 const cart=useCart();const [message,setMessage]=useState('');const [confirmation,setConfirmation]=useState('');
 const [emptyQuantity,setEmptyQuantity]=useState('');
 const completed=useRef(false),confirmationHeading=useRef<HTMLHeadingElement>(null);
 useEffect(()=>{if(confirmation)confirmationHeading.current?.focus();},[confirmation]);
 function checkout(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(completed.current)return;
  const form=event.currentTarget;
  for(const name of ['name','address']){
   const field=form.elements.namedItem(name) as HTMLInputElement|HTMLTextAreaElement;
   field.setCustomValidity(field.value.trim()?'':name==='name'?'Enter a fictional recipient, not just spaces.':'Enter a fictional address, not just spaces.');
   if(!field.reportValidity())return;
  }
  const current=readCart(snapshot());
  if(!Object.keys(current).length||JSON.stringify(current)!==JSON.stringify(cart)){
   setMessage('Your cart changed. Return to your cart before continuing.');
   window.dispatchEvent(new Event('demo-cart'));
   return;
  }
  if(new FormData(form).get('result')==='declined'){
   setMessage('Simulated payment declined. Your cart is preserved; choose success to try the simulation again.');
   return;
  }
  // Synchronous guard also covers two submit events in the same React batch.
  completed.current=true;
  setMessage('');
  setConfirmation(`DEMO-${crypto.randomUUID().slice(0,8).toUpperCase()}`);
  saveCart({});
 }
 const total=demoTotal(cart),items=demoProducts.filter(p=>cart[p.id]);
 function quantity(id:string,qty:number){const p=demoProducts.find(p=>p.id===id);if(!p||!Number.isSafeInteger(qty)||qty<1||qty>p.stock){setMessage('Choose a whole quantity between 1 and the available demo stock.');return false;}saveCart({...readCart(snapshot()),[id]:qty});setMessage(`${p.name}: ${qty} in your demo cart${qty===p.stock?' — demo stock limit reached':''}.`);return true;}
 function add(id:string){const current=readCart(snapshot());return quantity(id,(current[id]??0)+1);}
 const notice=<p className="demo-delivery-note">Sample prices &amp; stock. Simulated purchases only. <Link prefetch={false} href="/demo-guide">How the demo works</Link></p>;
 const feedback=<p className="demo-message" data-tone={/declined|Choose|changed/.test(message)?"error":"success"} role="status" aria-live="polite" aria-atomic="true">{message}</p>;
 if(Object.hasOwn(informationPages,path))return <InformationPage path={path as keyof typeof informationPages}/>;
 if(path==='/')return <DemoHome cart={cart} onAdd={add} feedback={feedback}/>;
 if(['/login','/account','/admin'].some(p=>path===p||path.startsWith(p+'/'))||path.startsWith('/orders'))return <GuestExperience/>;
 if(path==='/cart'||path==='/checkout')return <main id="main-content" tabIndex={-1} className={`container demo-main sc-purchase-page ${path==='/checkout'?'sc-checkout-page':'sc-cart-page'}`}><div className="sc-purchase-heading"><PageLead eyebrow="Your considered selection" title={path==='/cart'?'Your demo cart':'Simulated checkout'}>{path==='/cart'?'Small choices, gathered in one place. Your guest cart stays in this browser.':'Try the final step with fictional details. No payment, delivery or database order.'}</PageLead><nav className="sc-purchase-steps" aria-label="Purchase steps"><Link prefetch={false} href="/cart" aria-current={path==='/cart'?'step':undefined}>01 · Cart</Link><span aria-hidden="true">—</span><span aria-current={path==='/checkout'?'step':undefined}>02 · Simulation</span></nav></div>{feedback}{confirmation?<section className="demo-panel sc-confirmation-panel"><span className="sc-state-symbol"><ShopIcon name="check"/></span><p className="eyebrow">A thoughtful little journey</p><h2 ref={confirmationHeading} tabIndex={-1}>Demo order confirmation</h2><p>Simulation reference: {confirmation}</p><p>Simulated purchase successful. No payment taken, no stock changed, and no order saved to the database.</p><Link prefetch={false} className="button button-primary" href="/products">Continue exploring</Link></section>:!items.length?<section className="demo-panel sc-empty-cart"><span className="sc-state-symbol"><ShopIcon name="bag"/></span><p className="eyebrow">Room for something thoughtful</p><h2>Your cart is empty</h2><p>Explore the collection and gather a few favourites.</p><Link prefetch={false} className="button button-primary" href="/products">Discover your favourites</Link></section>:<div className="demo-checkout-grid"><section aria-label="Cart items" className="sc-cart-selection"><h2 className="sc-selection-heading">Your selection <span>{items.length} {items.length===1?'offering':'offerings'}</span></h2>{items.map(p=><article className="demo-cart-row" key={p.id}><CartArtwork product={p}/><h3 className="sc-cart-name"><Link prefetch={false} href={`/products/${p.slug}`}>{p.name}</Link></h3><PriceBlock {...p}/><label className="sc-cart-quantity">Quantity<input aria-label={`Quantity for ${p.name}`} type="number" min="1" max={p.stock} step="1" value={emptyQuantity===p.id?'':cart[p.id]} onBlur={()=>setEmptyQuantity('')} onChange={e=>{if(e.target.value===''){setEmptyQuantity(p.id);return;}setEmptyQuantity('');quantity(p.id,Number(e.target.value));}}/></label><div className="demo-actions"><button className="button button-secondary" disabled={cart[p.id]<=1} aria-label={`Decrease ${p.name}`} onClick={()=>quantity(p.id,cart[p.id]-1)}>−</button><button className="button button-secondary" disabled={cart[p.id]>=p.stock} aria-label={`Increase ${p.name}`} onClick={()=>quantity(p.id,cart[p.id]+1)}>+</button><button className="button button-quiet" onClick={()=>{const next={...cart};delete next[p.id];saveCart(next);setMessage('Item removed.');}}>Remove</button></div><p className="sc-line-total">Line total: {money(p.pricePaise*cart[p.id])}</p></article>)}<button className="button button-secondary" onClick={()=>{saveCart({});setMessage('Cart cleared.');}}>Clear cart</button></section><aside className="demo-panel sc-purchase-summary"><h2>Order summary</h2><p>Subtotal: {money(total)}</p><p>Demo delivery: ₹0 · Additional tax: ₹0</p><p className="demo-total">Total: {money(total)}</p>{path==='/cart'?<Link prefetch={false} className="button button-primary" href="/checkout">Continue to demo checkout</Link>:<form className="demo-form" onSubmit={checkout}><label>Fictional recipient<input name="name" required maxLength={80} onInput={e=>e.currentTarget.setCustomValidity('')} defaultValue="Demo shopper" autoComplete="off"/></label><label>Fictional email<input name="email" type="email" required defaultValue="demo@example.test" autoComplete="off"/></label><label>Fictional delivery address<textarea name="address" required maxLength={200} onInput={e=>e.currentTarget.setCustomValidity('')} defaultValue="Demo address — no delivery" autoComplete="off"/></label><label>Simulation outcome<select name="result"><option value="success">Simulated success</option><option value="declined">Simulated decline</option></select></label><button className="button button-primary" type="submit">Complete simulated purchase</button></form>}</aside></div>}</main>;
 const product=path.startsWith('/products/')?demoProducts.find(p=>p.slug===path.split('/')[2]):undefined;

 if(product)return <DemoProductDetail product={product} cart={cart} onAdd={()=>add(product.id)} feedback={feedback}/>;
 const seasonal=path.startsWith('/collections/');const category=path.startsWith('/categories/')?path.split('/')[2]:query.category;
 let products=demoProducts.filter(p=>(!seasonal||p.seasonal)&&(!category||p.categorySlug===category)&&(!query.q||`${p.name} ${p.description} ${p.material}`.toLowerCase().includes(query.q.toLowerCase()))&&(!query.stock||p.stock>0)&&(!query.budget||p.pricePaise<=Number(query.budget)*100));
 if(query.sort==='low')products=[...products].sort((a,b)=>a.pricePaise-b.pricePaise);if(query.sort==='high')products=[...products].sort((a,b)=>b.pricePaise-a.pricePaise);
 const story=category?categoryStories[category]:undefined;
 return <main id="main-content" tabIndex={-1} className="container demo-main sc-catalogue-page">{seasonal?<div className="sc-collection-hero"><EditorialHero eyebrow="A season of light · Navratri 2026" title="A little light, thoughtfully chosen." description="Warm brass, earthy clay and woven textures. Thirteen fictional offerings, gathered for a season of small rituals." primary={{label:'Explore the collection',href:'#demo-products'}} secondary={{label:'Shop all offerings',href:'/products'}} image="/editorial/navratri-season.svg" imageAlt="Original Navratri still life with an abstract lamp, terracotta vase and green leaves."/></div>:<PageLead eyebrow={category?'The collections':'The whole collection'} title={category?demoCategories[category]??'Products':'Discover considered living'}>{story?.description??'Twenty original offerings for quiet rituals, thoughtful spaces and meaningful little gifts.'}</PageLead>}{notice}<DemoCatalogueFilters key={JSON.stringify(query)} seasonal={seasonal} category={category} query={query}/><section id="demo-products" aria-label="Demo product catalogue"><div className="sc-results-heading"><h2>{products.length} original offerings</h2><p>{query.q?`Results for “${query.q}”`:story?.line??'A little something for your everyday.'}</p></div>{feedback}{!products.length?<div className="sc-empty-search"><ShopIcon name="leaf"/><h3>A different search, perhaps.</h3><p>No matching products. Try another search or reset the filters.</p><Link prefetch={false} className="sc-text-link" href="/products">Explore all offerings<ShopIcon name="arrow"/></Link></div>:<DemoProductGrid products={products} cart={cart} onAdd={add}/>}</section></main>;
}
