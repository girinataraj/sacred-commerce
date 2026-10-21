import type {z} from 'zod';
export class CustomerRequestError extends Error {
  constructor(public readonly status:number,public readonly code:string,message:string,public readonly fieldErrors?:Record<string,string[]>){super(message);}
}
export async function requestCustomer<T>(path:string,schema:z.ZodType<T>,options:{body?:unknown;signal?:AbortSignal;cartId?:string}={}):Promise<T>{
  let response:Response;
  try{response=await fetch(path,{method:options.body===undefined?'GET':'POST',cache:'no-store',headers:options.body===undefined?undefined:{'Content-Type':'application/json',...(options.cartId?{'X-Cart-Context':options.cartId}:{})},body:options.body===undefined?undefined:JSON.stringify(options.body),signal:options.signal?AbortSignal.any([options.signal,AbortSignal.timeout(15000)]):AbortSignal.timeout(15000)});}
  catch{throw new CustomerRequestError(0,'NETWORK_UNCERTAIN','The response could not be confirmed. Check this same attempt before starting another purchase.');}
  let envelope;
  try{envelope=await response.json();}catch{throw new CustomerRequestError(503,'INVALID_RESPONSE','The response could not be confirmed. Check the same attempt again.');}
  if(!response.ok)throw new CustomerRequestError(response.status,envelope.error?.code??'SERVICE_UNAVAILABLE',envelope.error?.message??'Private data services are temporarily unavailable. Please retry.',envelope.error?.fieldErrors);
  const parsed=schema.safeParse(envelope.data);
  if(!parsed.success)throw new CustomerRequestError(503,'INVALID_RESPONSE','The saved result could not be verified. Please check again.');
  return parsed.data;
}
