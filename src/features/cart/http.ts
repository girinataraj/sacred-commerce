import 'server-only';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import type { PrismaClient } from '../../generated/prisma/client';
import { createRequestSupabase } from '../../lib/supabase/server';
import { getDb } from '../../lib/server/db';
import { createIdentityService, type Actor } from '../../lib/server/identity-core';
import { EntryError, successResponse } from '../../lib/server/errors';
import { readMutationJson } from '../../lib/server/origin';
import { CartError, cartErrorResponse } from './errors';
import { addCartSchema, setCartSchema, revisionSchema, productIdSchema } from './schemas';
import { getCart, addCartItem, setCartQuantity, removeCartItem, clearCart } from './service';
import type { CartDTO } from './types';

export function createCartHandlers(makeContext=createRequestSupabase,database:()=>PrismaClient=getDb) {
  type Context=ReturnType<typeof makeContext>;
  type Operation=(actor:Actor,db:PrismaClient)=>Promise<CartDTO>;
  function parse<T>(schema:z.ZodType<T>,input:unknown):T {
    const parsed=schema.safeParse(input);
    if(!parsed.success) throw new CartError('VALIDATION_FAILED',z.flattenError(parsed.error).fieldErrors as Record<string,string[]>);
    return parsed.data;
  }
  function handler(prepare:(request:NextRequest,productId?:string)=>Promise<Operation>) {
    return async(request:NextRequest,productId?:string)=>{
      let context:Context|undefined;
      try {
        // No identity/ownership selectors or other query parameters in this contract.
        if(new URL(request.url).search) throw new EntryError(400);
        const operation=await prepare(request,productId);
        context=makeContext(request);
        const db=database();
        const actor=await createIdentityService(()=>context!.client.auth.getUser(),db).requireActor();
        const expectedCart=request.headers.get('x-cart-context');
        if(request.method!=='GET'&&expectedCart!==null){
          if(!productIdSchema.safeParse(expectedCart).success)throw new EntryError(400);
          // A freshness precondition only: the header never selects an owner or
          // grants access. Identity selects the current immutable owner/cart.
          const own=await db.cart.findUnique({where:{userId:actor.userId},select:{id:true}});
          if(own?.id!==expectedCart)throw new CartError('CART_CONTEXT_CHANGED');
        }
        return context.apply(successResponse(await operation(actor,db)));
      } catch(error) {
        const response=cartErrorResponse(error); return context?context.apply(response):response;
      }
    };
  }
  function pathId(value:string|undefined) {
    const parsed=productIdSchema.safeParse(value); if(!parsed.success) throw new EntryError(400); return parsed.data;
  }
  return {
    get:handler(async()=>getCart),
    add:handler(async request=>{const input=parse(addCartSchema,await readMutationJson(request,32768));return(actor,db)=>addCartItem(actor,input,db);}),
    set:handler(async(request,id)=>{const input=parse(setCartSchema,await readMutationJson(request,32768));const productId=pathId(id);return(actor,db)=>setCartQuantity(actor,{...input,productId},db);}),
    remove:handler(async(request,id)=>{const input=parse(revisionSchema,await readMutationJson(request,32768));const productId=pathId(id);return(actor,db)=>removeCartItem(actor,{...input,productId},db);}),
    clear:handler(async request=>{const input=parse(revisionSchema,await readMutationJson(request,32768));return(actor,db)=>clearCart(actor,input,db);}),
  };
}
