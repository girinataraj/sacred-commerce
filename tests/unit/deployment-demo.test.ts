import {describe,it,expect} from 'vitest';
import {demoProducts,normalizeDemoCart,demoTotal} from '../../src/features/demo/model';
describe('self-contained deployment demo',()=>{
 it('contains only20original demo products,13seasonal',()=>{expect(demoProducts).toHaveLength(20);expect(demoProducts.filter(p=>p.seasonal)).toHaveLength(13);});
 it('rejects malformed quantities, unknown products and out-of-stock items',()=>{expect(normalizeDemoCart({'SC-001':0,'SC-002':1.5,'SC-004':1,unknown:2})).toEqual({});});
 it('caps stale quantities at demo stock and computes authoritative fixture prices',()=>{const cart=normalizeDemoCart({'SC-001':99,'SC-002':1});expect(cart).toEqual({'SC-001':25,'SC-002':1});expect(demoTotal(cart)).toBe(25*19900+79900);});
 it('recovers from corrupt local storage',()=>{expect(normalizeDemoCart(null)).toEqual({});expect(normalizeDemoCart([])).toEqual({});expect(demoTotal({})).toBe(0);});
});
import {demoApiBlocked} from '../../src/features/demo/model';
describe('demo backend isolation',()=>{
 it('blocks Auth, checkout, cart and admin API prefixes',()=>{for(const path of ['/api','/api/auth/login','/api/checkout','/api/cart/items','/api/admin/products'])expect(demoApiBlocked(true,path)).toBe(true);expect(demoApiBlocked(false,'/api/checkout')).toBe(false);});
 it('disables the actual database factory in demo mode',async()=>{const old=process.env.SACRED_DEMO_MODE;process.env.SACRED_DEMO_MODE='true';try{const {getDb}=await import('../../src/lib/server/db');expect(()=>getDb()).toThrow('Database access is disabled');}finally{if(old===undefined)delete process.env.SACRED_DEMO_MODE;else process.env.SACRED_DEMO_MODE=old;}});
});
