import {commitSchema,uuidSchema} from './schemas';
import type {CommitInput} from './schemas';
type Store=Pick<Storage,'getItem'|'setItem'|'removeItem'>;
const prefix='sacred-checkout-attempt:';
function storeOrThrow(store?:Store):Store {return store??window.sessionStorage;}
function storageKey(cartId:string){return prefix+uuidSchema.parse(cartId);}
export function loadPending(cartId:string,store?:Store):string|null {
  const value=storeOrThrow(store).getItem(storageKey(cartId));
  if(value===null)return null;
  return uuidSchema.parse(value);
}
export function savePending(cartId:string,key:string,store?:Store):void {
  const storage=storeOrThrow(store),valid=uuidSchema.parse(key),current=loadPending(cartId,storage);
  if(current!==null&&current!==valid)throw Error('An unresolved attempt already exists.');
  storage.setItem(storageKey(cartId),valid);
  if(loadPending(cartId,storage)!==valid)throw Error('Recovery information could not be saved.');
}
export function clearPending(cartId:string,key:string,store?:Store):void {
  try{const storage=storeOrThrow(store);if(loadPending(cartId,storage)===key)storage.removeItem(storageKey(cartId));}catch{/* A retained durable key is safe to recover again. */}
}
export function freezeAttempt(input:unknown):CommitInput {
  const parsed=commitSchema.parse(input);Object.freeze(parsed.address);return Object.freeze(parsed);
}
export function isDefiniteRejection(status:number,code:string):boolean {
  return (status===409&&['QUOTE_STALE','INSUFFICIENT_STOCK','PRODUCT_UNAVAILABLE','CART_REVISION_CONFLICT','EMPTY_CART'].includes(code))||[400,403,413,415,422,429].includes(status);
}
