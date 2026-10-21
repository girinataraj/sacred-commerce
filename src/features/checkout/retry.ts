import 'server-only';
import { randomInt } from 'node:crypto';
import type { PrismaClient,Prisma } from '../../generated/prisma/client';
import { EntryError } from '../../lib/server/errors';
import { isSerializationConflict } from '../../lib/server/transaction-conflicts';
import { CheckoutError } from './errors';
export async function serializable<T>(db:PrismaClient,work:(tx:Prisma.TransactionClient)=>Promise<T>):Promise<T>{
  for(let attempt=0;attempt<3;attempt++){
    try{return await db.$transaction(work,{isolationLevel:'Serializable',maxWait:5000,timeout:5000});}
    catch(error){
      if(error instanceof CheckoutError||error instanceof EntryError)throw error;
      if(!isSerializationConflict(error))throw new EntryError(503);
      if(attempt===2)throw new CheckoutError('RETRY_EXHAUSTED');
      await new Promise(resolve=>setTimeout(resolve,randomInt(5,21)*(attempt+1)));
    }
  }
  throw new CheckoutError('RETRY_EXHAUSTED');
}
