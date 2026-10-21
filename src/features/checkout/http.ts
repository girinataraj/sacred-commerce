import 'server-only';
import { randomUUID } from 'node:crypto';
import { NextRequest,NextResponse } from 'next/server';
import type { PrismaClient } from '../../generated/prisma/client';
import { createRequestSupabase } from '../../lib/supabase/server';
import { getDb } from '../../lib/server/db';
import { createIdentityService,type Actor } from '../../lib/server/identity-core';
import { EntryError,privateResponse } from '../../lib/server/errors';
import { readMutationJson } from '../../lib/server/origin';
import { getOrder,listOwnOrders } from '../orders/service';
import { quoteCheckout,commitCheckout,getAttempt } from './service';
import { uuidSchema,orderListSchema } from './schemas';
import { checkoutErrorResponse } from './errors';
import type { CheckoutResult } from './types';
export function createCheckoutHandlers(makeContext=createRequestSupabase,database:()=>PrismaClient=getDb){
  type Context=ReturnType<typeof makeContext>;
  type Operation=(actor:Actor,db:PrismaClient,context?:string)=>Promise<unknown>;
  function handler(prepare:(request:NextRequest,id?:string)=>Promise<Operation>,commit=false,listing=false){
    return async(request:NextRequest,id?:string)=>{
      let context:Context|undefined;
      try{
        if(!listing&&new URL(request.url).search)throw new EntryError(400);
        const operation=await prepare(request,id);context=makeContext(request);const db=database();
        const actor=await createIdentityService(()=>context!.client.auth.getUser(),db).requireActor();
        const data=await operation(actor,db,request.headers.get('x-cart-context')??undefined);
        const status=commit&&!(data as CheckoutResult).replayed?201:200;
        return context.apply(privateResponse(NextResponse.json({data,requestId:randomUUID()},{status})));
      }catch(error){const response=checkoutErrorResponse(error);return context?context.apply(response):response;}
    };
  }
  function pathId(value:string|undefined){const result=uuidSchema.safeParse(value);if(!result.success)throw new EntryError(400);return result.data;}
  return {
    quote:handler(async request=>{const input=await readMutationJson(request,32768);return(actor,db,context)=>quoteCheckout(actor,input,db,context);}),
    commit:handler(async request=>{const input=await readMutationJson(request,32768);return(actor,db,context)=>commitCheckout(actor,input,db,context);},true),
    attempt:handler(async(_request,key)=>{const id=pathId(key);return async(actor,db)=>{const result=await getAttempt(actor,id,db);if(!result)throw new EntryError(404);return result;};}),
    order:handler(async(_request,key)=>{const id=pathId(key);return(actor,db)=>getOrder(actor,id,db);}),
    orders:handler(async request=>{
      const search=new URL(request.url).searchParams;const input:Record<string,number>={};
      for(const [key,value]of search){if(!['page','pageSize'].includes(key)||search.getAll(key).length!==1||!/^\d{1,5}$/.test(value))throw new EntryError(400);input[key]=Number(value);}
      const parsed=orderListSchema.safeParse(input);if(!parsed.success)throw new EntryError(400);
      return(actor,db)=>listOwnOrders(actor,parsed.data,db);
    },false,true),
  };
}
