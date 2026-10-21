import 'server-only';
import type { PrismaClient,Prisma } from '../../generated/prisma/client';
import { getDb } from '../../lib/server/db';
import { assertActor,type Actor } from '../../lib/server/identity-core';
import { EntryError } from '../../lib/server/errors';
import { uuidSchema,orderListSchema,addressSchema } from '../checkout/schemas';
import { parseCheckout } from '../checkout/validation';
import { CheckoutError } from '../checkout/errors';
import type { OrderDTO,OrderSummary } from './types';
export const orderInclude={items:{orderBy:{productId:'asc'}},payment:true} satisfies Prisma.OrderInclude;
type SavedOrder=Prisma.OrderGetPayload<{include:typeof orderInclude}>;
function summary(row:Prisma.OrderGetPayload<object>):OrderSummary{return {id:row.id,reference:row.reference,status:row.status,sourceCartRevision:row.sourceCartRevision,currency:row.currency,subtotalPaise:row.subtotalPaise,shippingPaise:row.shippingPaise,taxPaise:row.taxPaise,totalPaise:row.totalPaise,createdAt:row.createdAt.toISOString()};}
export function orderSnapshot(row:SavedOrder):OrderDTO {
  const payment=row.payment;const address=addressSchema.safeParse(row.addressSnapshot);
  if(!payment||!address.success||!row.items.length||payment.amountPaise!==row.totalPaise||payment.currency!==row.currency||row.items.reduce((sum,item)=>sum+item.lineTotalPaise,0)!==row.subtotalPaise||(row.status==='PAYMENT_FAILED')!==(payment.outcome==='DECLINED'))throw new EntryError(503);
  return {...summary(row),address:address.data,items:row.items.map(({productId,skuSnapshot,nameSnapshot,unitPricePaise,quantity,lineTotalPaise})=>({productId,skuSnapshot,nameSnapshot,unitPricePaise,quantity,lineTotalPaise})),payment:{id:payment.id,outcome:payment.outcome,reasonCode:payment.reasonCode,amountPaise:payment.amountPaise,currency:payment.currency}};
}
export async function getOrder(actor:Actor,id:unknown,database?:PrismaClient):Promise<OrderDTO>{
  assertActor(actor);const orderId=parseCheckout(uuidSchema,id);
  try{const row=await (database??getDb()).order.findFirst({where:{id:orderId,userId:actor.userId},include:orderInclude});if(!row)throw new EntryError(404);return orderSnapshot(row);}
  catch(error){if(error instanceof EntryError)throw error;throw new EntryError(503);}
}
export async function listOwnOrders(actor:Actor,input:unknown={},database?:PrismaClient){
  assertActor(actor);const query=parseCheckout(orderListSchema,input);
  try{const db=database??getDb();const [items,total]=await db.$transaction([db.order.findMany({where:{userId:actor.userId},include:orderInclude,orderBy:[{createdAt:'desc'},{id:'desc'}],skip:(query.page-1)*query.pageSize,take:query.pageSize}),db.order.count({where:{userId:actor.userId}})],{isolationLevel:'RepeatableRead'});return {items:items.map(row=>{orderSnapshot(row);return summary(row);}),total,...query};}
  catch(error){if(error instanceof EntryError||error instanceof CheckoutError)throw error;throw new EntryError(503);}
}
