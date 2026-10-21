import type { CartDTO } from './types';
export class CartRequestError extends Error {
  constructor(public readonly status:number,public readonly code:string,message:string){super(message);}
}
export async function requestCart(path='/api/cart',method='GET',body?:unknown,signal?:AbortSignal,cartContext?:string):Promise<CartDTO> {
  let response:Response;
  try {response=await fetch(path,{method,cache:'no-store',headers:body===undefined?undefined:{'Content-Type':'application/json',...(cartContext?{'X-Cart-Context':cartContext}:{})},body:body===undefined?undefined:JSON.stringify(body),signal:signal?AbortSignal.any([signal,AbortSignal.timeout(15000)]):AbortSignal.timeout(15000)});}
  catch {throw new CartRequestError(0,'NETWORK_UNCERTAIN','The request could not be confirmed. Check your connection and reload your cart before trying again.');}
  let result;
  try {result=await response.json();}catch{throw new CartRequestError(response.status,'INVALID_RESPONSE','The cart response could not be confirmed. Reload your cart before trying again.');}
  if(!response.ok)throw new CartRequestError(response.status,result.error?.code??'SERVICE_UNAVAILABLE',result.error?.message??'Cart services are temporarily unavailable. Please try again.');
  if(!result.data||!Array.isArray(result.data.items)||!Number.isInteger(result.data.revision))throw new CartRequestError(503,'INVALID_RESPONSE','Cart data is unavailable. Reload your cart before trying again.');
  return result.data;
}
const inr=new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',minimumFractionDigits:0,maximumFractionDigits:2});
const fractionalInr=new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',minimumFractionDigits:2,maximumFractionDigits:2});
export function cartPrice(paise:number):string{return (paise%100===0?inr:fractionalInr).format(paise/100);}
