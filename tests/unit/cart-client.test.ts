import { afterEach,expect,it,vi } from 'vitest';
import { cartPrice,requestCart } from '../../src/features/cart/client';
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals();});
it.each([[0,'₹0'],[19950,'₹199.50'],[144500,'₹1,445'],[160000,'₹1,600'],[2000000000,'₹2,00,00,000']])('formats the supplied authoritative %s paise without losing precision',(paise,formatted)=>expect(cartPrice(paise)).toBe(formatted));
it('a caller cancellation signal does not remove the deadline from a stalled initial GET',async()=>{
  const timeout=AbortSignal.timeout.bind(AbortSignal);
  vi.spyOn(AbortSignal,'timeout').mockImplementation(()=>timeout(10));
  vi.stubGlobal('fetch',(_input:unknown,init:RequestInit)=>new Promise((_resolve,reject)=>init.signal!.addEventListener('abort',()=>reject(Error('transport stalled')),{once:true})));
  await expect(requestCart('/api/cart','GET',undefined,new AbortController().signal)).rejects.toMatchObject({code:'NETWORK_UNCERTAIN'});
},500);
