'use client';
import {useCallback} from 'react';
import {Button,ActionLink} from '../../components/ui/button';
import {EmptyState,ErrorPanel} from '../../components/ui/feedback';
import {cartPrice} from '../cart/client';
import {requestCustomer} from './api';
import {orderPageSchema,orderSchema,sessionSchema} from './contracts';
import {usePrivateResource} from './resource';
import {PrivateLoading,PurchaseSummary,SignInNotice} from './shared';
import type {OrderDTO} from '../orders/types';

function date(value:string){return new Intl.DateTimeFormat('en-IN',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Kolkata'}).format(new Date(value))+' IST';}
function status(order:Pick<OrderDTO,'status'>){return ({CONFIRMED:'Confirmed · simulated payment succeeded',PAYMENT_FAILED:'Not confirmed · simulated payment declined',SHIPPED:'Shipped',DELIVERED:'Delivered'})[order.status];}
export function OrderExperience({id}:{id:string}){
  const read=useCallback((signal?:AbortSignal)=>requestCustomer(`/api/orders/${id}`,orderSchema,{signal}),[id]);const {data,loading,error,reload}=usePrivateResource(read);
  if(loading)return <PrivateLoading label="Loading your saved order"/>;
  if(error)return error.status===401?<SignInNotice next={`/orders/${id}`}/>:<ErrorPanel title={error.status===404?'Order unavailable':'Your order could not be loaded'} action={<><Button onClick={reload}>Check again</Button><ActionLink href="/orders" tone="secondary">My orders</ActionLink></>}>{error.status===404?'This order is unavailable for your account. Check the reference or return to your own orders.':error.message}</ErrorPanel>;
  if(!data)return null;
  const failed=data.status==='PAYMENT_FAILED';
  return <><section className="order-outcome customer-panel"><p className="eyebrow">Saved purchase · Independent demo</p><h2>{failed?'Simulated payment declined':'Your simulated order is confirmed'}</h2><p>{failed?'No purchase was confirmed. Your cart was preserved and stock was not deducted.':'Your order and successful simulated payment are saved. No real payment was taken and no delivery or email will be sent.'}</p><dl className="order-facts"><div><dt>Order reference</dt><dd>{data.reference}</dd></div><div><dt>Placed</dt><dd>{date(data.createdAt)}</dd></div><div><dt>Status</dt><dd>{status(data)}</dd></div></dl><div className="customer-actions"><ActionLink href="/orders">My orders</ActionLink><ActionLink href={failed?'/checkout':'/products'} tone="secondary">{failed?'Return to checkout':'Continue shopping'}</ActionLink></div></section><div className="checkout-layout order-detail"><PurchaseSummary title="Saved order details" lines={data.items.map(item=>({name:item.nameSnapshot,...item}))} amounts={data} reviewed/><section className="customer-panel"><p className="eyebrow">Saved delivery details</p><h2>Demo destination</h2><address>{data.address.name}<br/>{data.address.line1}<br/>{data.address.line2&&<>{data.address.line2}<br/></>}{data.address.city}, {data.address.state} {data.address.pin}<br/>India<br/>{data.address.email}<br/>{data.address.phone}</address><p className="field-hint">Snapshot saved with this order. This is a fictional delivery for the interview demo.</p><p>Simulated payment: {data.payment.outcome==='SUCCEEDED'?'Succeeded':'Declined'}</p></section></div></>;
}
export function OrderHistory({page}:{page:number}){
  const read=useCallback(async(signal?:AbortSignal)=>{const result=await requestCustomer(`/api/orders?page=${page}&pageSize=6`,orderPageSchema,{signal});const details=await Promise.all(result.items.map(item=>requestCustomer(`/api/orders/${item.id}`,orderSchema,{signal})));return {...result,items:details.map(({address: _address,...order})=>{void _address;return order;})};},[page]);
  const {data,loading,error,reload}=usePrivateResource(read);
  if(loading)return <PrivateLoading label="Loading your order history"/>;
  if(error)return error.status===401?<SignInNotice next={`/orders?page=${page}`}/>:<ErrorPanel title="Your orders could not be loaded" action={<Button onClick={reload}>Retry loading orders</Button>}>{error.message}</ErrorPanel>;
  if(!data)return null;
  return <>{!data.items.length?<EmptyState title={page===1?'Your story starts with a thoughtful choice':'No orders on this page'} action={<ActionLink href={page===1?'/products':'/orders'}>{page===1?'Explore offerings':'Return to first page'}</ActionLink>}>{page===1?'Your confirmed orders and declined simulated attempts will appear here.':'Choose an earlier page to view saved orders.'}</EmptyState>:<><p className="field-hint">Newest first · {data.total} saved {data.total===1?'order or attempt':'orders and attempts'} · Page {page}</p><div className="order-list">{data.items.map(order=><article className="customer-panel order-card" key={order.id}><div className="order-card-heading"><div><p className="eyebrow">{date(order.createdAt)}</p><h2>{order.reference}</h2></div><strong>{cartPrice(order.totalPaise)}</strong></div><p className={`order-badge${order.status==='PAYMENT_FAILED'?' declined':''}`}>{status(order)}</p><ul>{order.items.map(item=><li key={item.productId}>{item.nameSnapshot} × {item.quantity}</li>)}</ul><ActionLink href={`/orders/${order.id}`} tone="secondary">View order details</ActionLink></article>)}</div></>}
  <nav aria-label="Order history pages" className="customer-actions">{page>1&&<ActionLink href={`/orders?page=${page-1}`} tone="secondary">Previous page</ActionLink>}{page*6<data.total&&<ActionLink href={`/orders?page=${page+1}`} tone="secondary">Next page</ActionLink>}</nav></>;
}
export function AccountExperience(){
  const read=useCallback((signal?:AbortSignal)=>requestCustomer('/api/auth/session',sessionSchema,{signal}),[]);const {data,loading,error,reload}=usePrivateResource(read);
  if(loading)return <PrivateLoading label="Checking your private account"/>;
  if(error)return error.status===401?<SignInNotice next="/account"/>:<ErrorPanel title="Your account could not be loaded" action={<Button onClick={reload}>Retry</Button>}>{error.message}</ErrorPanel>;
  if(!data)return null;
  return <div className="account-grid"><section className="customer-panel"><p className="eyebrow">Welcome back</p><h2>Your private demo account</h2><p>Account ending {data.actor.userId.slice(-8)}. Your cart and orders belong to this signed-in account.</p><p>No real customer information is required. Use the Sign out control in the account navigation when you finish.</p><ActionLink href="/orders">View my orders</ActionLink></section><section className="customer-panel"><p className="eyebrow">Continue your journey</p><h2>Your saved choices</h2><p>Review current stock and prices in your persistent cart, or discover the seasonal collection.</p><div className="customer-actions"><ActionLink href="/cart" tone="secondary">View my cart</ActionLink><ActionLink href="/collections/navratri-2026" tone="quiet">Explore Navratri 2026</ActionLink></div></section></div>;
}
