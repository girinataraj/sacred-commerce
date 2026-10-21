import { expect,it } from 'vitest';
const schemas=await import('../../src/features/checkout/schemas').catch(()=>({addressSchema:undefined,quoteSchema:undefined,commitSchema:undefined}));
const payments=await import('../../src/features/checkout/payment-simulator').catch(()=>({simulatePayment:undefined}));
const address={name:'Demo Shopper',email:'shopper@example.test',phone:'9000000000',line1:'12 Demo Garden Road',line2:'',city:'Coimbatore',state:'Tamil Nadu',pin:'641001',country:'IN'};
it('accepts and trims bounded synthetic delivery details',()=>expect(schemas.addressSchema?.safeParse({...address,name:' Demo Shopper '}).data).toEqual(address));
it.each(['name','email','phone','line1','city','state','pin','country'])('requires address field %s',field=>{const value={...address} as Record<string,unknown>;delete value[field];expect(schemas.addressSchema?.safeParse(value).success).toBe(false);});
it.each([{name:'x'},{email:'bad'},{phone:'9000'},{line1:'short'.repeat(30)},{city:'x'},{state:'x'},{pin:'012345'},{country:'US'},{line2:'x'.repeat(121)},{name:'x'.repeat(81)},{email:'x'.repeat(250)+'@test.example'}])('rejects invalid or oversized address %j',bad=>expect(schemas.addressSchema?.safeParse({...address,...bad}).success).toBe(false));
it('quote validates address and refuses client totals/ownership',()=>{
  expect(schemas.quoteSchema?.safeParse({cartRevision:1,address}).success).toBe(true);
  expect(schemas.quoteSchema?.safeParse({cartRevision:1}).success).toBe(false);
  expect(schemas.quoteSchema?.safeParse({cartRevision:1,address,totalPaise:1,userId:'fake'}).success).toBe(false);
});
const commit={idempotencyKey:'cb344951-abaf-4ef5-835e-372d76281f24',cartRevision:1,quoteDigest:'a'.repeat(64),address,simulationMode:'SUCCESS'};
it('accepts only bounded exact commit fields and normalizes canonical address',()=>expect(schemas.commitSchema?.safeParse({...commit,address:{...address,line2:undefined}}).success).toBe(true));
it.each([{idempotencyKey:'bad'},{cartRevision:-1},{cartRevision:'1'},{quoteDigest:'x'},{simulationMode:'DECLINED'},{simulationMode:'SUCCEEDED'},{status:'CONFIRMED'},{userId:'spoof'},{totalPaise:1},{address:{...address,role:'ADMIN'}}])('rejects commit spoof or invalid value %j',bad=>expect(schemas.commitSchema?.safeParse({...commit,...bad}).success).toBe(false));
it.each([['SUCCESS','SUCCEEDED','SIMULATED_SUCCESS'],['DECLINE','DECLINED','SIMULATED_DECLINE']] as const)('deterministic %s is a server-only simulated outcome',(mode,outcome,reasonCode)=>expect(payments.simulatePayment?.(mode)).toEqual({outcome,reasonCode}));
