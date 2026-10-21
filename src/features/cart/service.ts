import 'server-only';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { PrismaClient, Prisma } from '../../generated/prisma/client';
import { getDb } from '../../lib/server/db';
import { assertActor, type Actor } from '../../lib/server/identity-core';
import { EntryError } from '../../lib/server/errors';
import { CartError } from './errors';
import { addCartSchema, setCartInputSchema, removeCartInputSchema, revisionSchema } from './schemas';
import { cartAmounts } from './money';
import type { CartDTO, CartAvailability } from './types';

type Tx=Prisma.TransactionClient;
type LockedCart={id:string;revision:number};
function validate<T>(schema:z.ZodType<T>,input:unknown):T {
  const parsed=schema.safeParse(input);
  if (!parsed.success) throw new CartError('VALIDATION_FAILED',z.flattenError(parsed.error).fieldErrors as Record<string,string[]>);
  return parsed.data;
}
async function snapshot(tx:Tx,cart:LockedCart):Promise<CartDTO> {
  const lines=await tx.cartItem.findMany({where:{cartId:cart.id},include:{product:true},orderBy:[{createdAt:'asc'},{productId:'asc'}]});
  const items=lines.map(({quantity,product:p})=>{
    const availability:CartAvailability=!p.active?'INACTIVE':p.stock===0?'OUT_OF_STOCK':p.stock<quantity?'INSUFFICIENT_STOCK':'AVAILABLE';
    return {productId:p.id,slug:p.slug,name:p.name,imagePath:p.imagePath,imageAlt:p.imageAlt,quantity,
      unitPricePaise:p.pricePaise,compareAtPricePaise:p.compareAtPricePaise,lineTotalPaise:p.pricePaise*quantity,
      stock:p.stock,active:p.active,version:p.version,availability,canPurchase:availability==='AVAILABLE'};
  });
  return {...cart,items,...cartAmounts(items.map(item=>({pricePaise:item.unitPricePaise,quantity:item.quantity}))),canCheckout:items.length>0&&items.every(item=>item.canPurchase)};
}
async function withCart(actor:Actor,database:PrismaClient|undefined,expectedRevision:number|undefined,operation?:(tx:Tx,cart:LockedCart)=>Promise<boolean>):Promise<CartDTO> {
  // Only identity-core can issue an Actor. A structurally similar browser object is not trusted.
  assertActor(actor);
  try {
    const db=database??getDb();
    return await db.$transaction(async tx=>{
      // Unique ownership plus DO NOTHING makes simultaneous first access safe.
      await tx.$executeRaw`INSERT INTO commerce."Cart"(id,"userId","updatedAt") VALUES(${randomUUID()}::uuid,${actor.userId}::uuid,NOW()) ON CONFLICT ("userId") DO NOTHING`;
      const [cart]=await tx.$queryRaw<LockedCart[]>`SELECT id,revision FROM commerce."Cart" WHERE "userId"=${actor.userId}::uuid FOR UPDATE`;
      if (!cart) throw new EntryError(503);
      if (expectedRevision!==undefined && expectedRevision!==cart.revision) throw new CartError('CART_REVISION_CONFLICT');
      if (operation && await operation(tx,cart)) {
        const updated=await tx.cart.update({where:{id:cart.id},data:{revision:{increment:1}},select:{revision:true}});
        cart.revision=updated.revision;
      }
      return snapshot(tx,cart);
    },{isolationLevel:'ReadCommitted',maxWait:5000,timeout:5000});
  } catch(error) {
    if(error instanceof CartError || error instanceof EntryError) throw error;
    throw new EntryError(503);
  }
}
async function lockedProduct(tx:Tx,productId:string) {
  // Every cart writer takes Cart BEFORE Product, matching future checkout locks.
  const rows=await tx.$queryRaw<{id:string;stock:number;active:boolean}[]>`SELECT id,stock,active FROM commerce."Product" WHERE id=${productId}::uuid FOR UPDATE`;
  if(!rows[0]) throw new CartError('NOT_FOUND');
  if(!rows[0].active) throw new CartError('PRODUCT_UNAVAILABLE');
  return rows[0];
}
function checkQuantity(quantity:number,stock:number) {
  if(quantity>10) throw new CartError('VALIDATION_FAILED',{quantity:['Choose a whole number from 1 to 10.']});
  if(quantity>stock) throw new CartError('INSUFFICIENT_STOCK');
}
export async function getCart(actor:Actor,db?:PrismaClient):Promise<CartDTO> { return withCart(actor,db,undefined); }
export async function addCartItem(actor:Actor,input:unknown,db?:PrismaClient):Promise<CartDTO> {
  assertActor(actor); const value=validate(addCartSchema,input);
  return withCart(actor,db,value.expectedRevision,async(tx,cart)=>{
    const product=await lockedProduct(tx,value.productId);
    const where={cartId_productId:{cartId:cart.id,productId:product.id}};
    const existing=await tx.cartItem.findUnique({where});
    const quantity=(existing?.quantity??0)+value.quantity; checkQuantity(quantity,product.stock);
    if(!existing && await tx.cartItem.count({where:{cartId:cart.id}})>=20) throw new CartError('CART_LIMIT_REACHED');
    if(existing) await tx.cartItem.update({where,data:{quantity}});
    else await tx.cartItem.create({data:{cartId:cart.id,productId:product.id,quantity}});
    return true;
  });
}
export async function setCartQuantity(actor:Actor,input:unknown,db?:PrismaClient):Promise<CartDTO> {
  assertActor(actor); const value=validate(setCartInputSchema,input);
  return withCart(actor,db,value.expectedRevision,async(tx,cart)=>{
    const where={cartId_productId:{cartId:cart.id,productId:value.productId}};
    const existing=await tx.cartItem.findUnique({where});
    if(!existing) throw new CartError('NOT_FOUND');
    const product=await lockedProduct(tx,value.productId); checkQuantity(value.quantity,product.stock);
    if(existing.quantity===value.quantity) return false;
    await tx.cartItem.update({where,data:{quantity:value.quantity}}); return true;
  });
}
export async function removeCartItem(actor:Actor,input:unknown,db?:PrismaClient):Promise<CartDTO> {
  assertActor(actor); const value=validate(removeCartInputSchema,input);
  return withCart(actor,db,value.expectedRevision,async(tx,cart)=>{
    const deleted=await tx.cartItem.deleteMany({where:{cartId:cart.id,productId:value.productId}}); return deleted.count>0;
  });
}
export async function clearCart(actor:Actor,input:unknown,db?:PrismaClient):Promise<CartDTO> {
  assertActor(actor); const value=validate(revisionSchema,input);
  return withCart(actor,db,value.expectedRevision,async(tx,cart)=>{
    const deleted=await tx.cartItem.deleteMany({where:{cartId:cart.id}}); return deleted.count>0;
  });
}
