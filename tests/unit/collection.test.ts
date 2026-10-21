import { expect,it } from 'vitest';
import { collectionQuery } from '../../src/features/collections/schemas';

it('locks a seasonal query to the route while preserving valid refinements',()=>{
  expect(collectionQuery('navratri-2026',{maxPricePaise:'99999',intent:'gifting',page:'2'})).toMatchObject({collection:'navratri-2026',intent:'gifting',maxPricePaise:99999,page:2});
});
it('rejects forged conflicting collection context rather than silently broadening results',()=>{
  expect(()=>collectionQuery('navratri-2026',{collection:'other-collection'})).toThrow();
});
it('rejects duplicate scope and invalid budgets through the existing query contract',()=>{
  expect(()=>collectionQuery('navratri-2026',{collection:['navratri-2026','other']})).toThrow();
  expect(()=>collectionQuery('navratri-2026',{minPricePaise:'100000',maxPricePaise:'99999'})).toThrow();
});
