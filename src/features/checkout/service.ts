import 'server-only';
import { randomUUID } from 'node:crypto';
import type { PrismaClient,Prisma } from '../../generated/prisma/client';
import { getDb } from '../../lib/server/db';
import { assertActor,type Actor } from '../../lib/server/identity-core';
import { EntryError } from '../../lib/server/errors';
import { consumeCheckoutRequest } from '../../lib/server/throttle';
import { orderInclude,orderSnapshot } from '../orders/service';
import { quoteSchema,commitSchema,uuidSchema } from './schemas';
import { parseCheckout } from './validation';
import { CheckoutError } from './errors';
import { serializable } from './retry';
import { lockedQuote,canonicalRequestHash,type LockedCart } from './quote';
import { simulatePayment } from './payment-simulator';
import type { CheckoutResult,QuoteDTO } from './types';
async function lockCart(tx:Prisma.TransactionClient,actor:Actor):Promise<LockedCart>{
  const [cart]=await tx.$queryRaw<LockedCart[]>`SELECT id,revision FROM commerce."Cart" WHERE "userId"=${actor.userId}::uuid FOR UPDATE`;
  if(!cart)throw new CheckoutError('EMPTY_CART');return cart;
}
function checkCart(cart:LockedCart,revision:number,context?:string){
  if(context!==undefined&&cart.id!==context)throw new CheckoutError('CART_CONTEXT_CHANGED');
  if(cart.revision!==revision)throw new CheckoutError('CART_REVISION_CONFLICT');
}
function checkedContext(context?:string){if(context!==undefined&&!uuidSchema.safeParse(context).success)throw new EntryError(400);return context?.toLowerCase();}
function checkoutDb(database?:PrismaClient){try{return database??getDb();}catch{throw new EntryError(503);}}
export async function quoteCheckout(actor:Actor,input:unknown,database?:PrismaClient,context?:string):Promise<QuoteDTO>{
  assertActor(actor);const value=parseCheckout(quoteSchema,input);const cartContext=checkedContext(context);
  return serializable(checkoutDb(database),async tx=>{const cart=await lockCart(tx,actor);checkCart(cart,value.cartRevision,cartContext);return lockedQuote(tx,cart);});
}
export async function commitCheckout(actor:Actor,input:unknown,database?:PrismaClient,context?:string):Promise<CheckoutResult>{
  assertActor(actor);const value=parseCheckout(commitSchema,input);const cartContext=checkedContext(context);const requestHash=canonicalRequestHash(value);
  return serializable(checkoutDb(database),async tx=>{
    const cart=await lockCart(tx,actor);
    const previous=await tx.order.findUnique({where:{userId_idempotencyKey:{userId:actor.userId,idempotencyKey:value.idempotencyKey}},include:orderInclude});
    if(previous){if(previous.requestHash!==requestHash)throw new CheckoutError('IDEMPOTENCY_CONFLICT');const order=orderSnapshot(previous);return {order,payment:order.payment,replayed:true};}
    checkCart(cart,value.cartRevision,cartContext);
    const throttle=await consumeCheckoutRequest(tx,actor);if(!throttle.allowed)throw new EntryError(429,undefined,throttle.retryAfter);
    const quote=await lockedQuote(tx,cart);
    if(quote.digest!==value.quoteDigest)throw new CheckoutError('QUOTE_STALE',undefined,quote);
    const payment=simulatePayment(value.simulationMode);const id=randomUUID();
    await tx.order.create({data:{id,reference:`SC-${id.toUpperCase()}`,userId:actor.userId,cartId:cart.id,sourceCartRevision:cart.revision,idempotencyKey:value.idempotencyKey,requestHash,status:payment.outcome==='SUCCEEDED'?'CONFIRMED':'PAYMENT_FAILED',currency:'INR',subtotalPaise:quote.subtotalPaise,shippingPaise:0,taxPaise:0,totalPaise:quote.totalPaise,addressSnapshot:value.address,items:{create:quote.lines.map(line=>({productId:line.productId,skuSnapshot:line.sku,nameSnapshot:line.name,unitPricePaise:line.unitPricePaise,quantity:line.quantity,lineTotalPaise:line.lineTotalPaise}))},payment:{create:{...payment,amountPaise:quote.totalPaise,currency:'INR'}}}});
    if(payment.outcome==='SUCCEEDED'){
      for(const line of quote.lines){
        const changed=await tx.product.updateMany({where:{id:line.productId,active:true,version:line.version,stock:{gte:line.quantity}},data:{stock:{decrement:line.quantity},version:{increment:1}}});
        if(changed.count!==1)throw new CheckoutError('INSUFFICIENT_STOCK');
        await tx.inventoryMovement.create({data:{productId:line.productId,orderId:id,actorId:actor.userId,delta:-line.quantity,balanceAfter:line.stock-line.quantity,reason:'SIMULATED_PURCHASE'}});
      }
      await tx.cartItem.deleteMany({where:{cartId:cart.id}});await tx.cart.update({where:{id:cart.id},data:{revision:{increment:1}}});
    }
    const order=orderSnapshot(await tx.order.findUniqueOrThrow({where:{id},include:orderInclude}));return {order,payment:order.payment,replayed:false};
  });
}
export async function getAttempt(actor:Actor,key:unknown,database?:PrismaClient):Promise<CheckoutResult|null>{
  assertActor(actor);const idempotencyKey=parseCheckout(uuidSchema,key);
  try{const previous=await (database??getDb()).order.findUnique({where:{userId_idempotencyKey:{userId:actor.userId,idempotencyKey}},include:orderInclude});if(!previous)return null;const order=orderSnapshot(previous);return {order,payment:order.payment,replayed:true};}
  catch(error){if(error instanceof EntryError)throw error;throw new EntryError(503);}
}
