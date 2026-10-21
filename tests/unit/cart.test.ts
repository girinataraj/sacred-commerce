import { expect, it } from 'vitest';
import { addCartSchema, setCartSchema, revisionSchema } from '../../src/features/cart/schemas';
import { cartAmounts } from '../../src/features/cart/money';
const id='7eb42b00-73aa-4111-8000-000000000001';
it('uses integer selling prices for ₹349×3 + ₹199×2 = ₹1,445',() => {
  expect(cartAmounts([{pricePaise:34900,quantity:3},{pricePaise:19900,quantity:2}])).toEqual({subtotalPaise:144500,shippingPaise:0,taxPaise:0,totalPaise:144500,currency:'INR'});
});
it('never subtracts a display-only demo reference price from the selling price',() => {
  const seasonal={pricePaise:80000,compareAtPricePaise:100000,quantity:2};
  expect(cartAmounts([seasonal]).totalPaise).toBe(160000);
  expect(cartAmounts([]).totalPaise).toBe(0);
});
it('keeps the maximum bounded cart total exact and within the PostgreSQL money range',()=>{
  expect(cartAmounts(Array.from({length:20},()=>({pricePaise:10000000,quantity:10}))).totalPaise).toBe(2000000000);
});
it.each([0,-1,1.5,'2',11,null,true])('rejects invalid quantity %s without coercion',quantity => {
  expect(addCartSchema.safeParse({productId:id,quantity,expectedRevision:0}).success).toBe(false);
  expect(setCartSchema.safeParse({quantity,expectedRevision:0}).success).toBe(false);
});
it('accepts only UUID product IDs, integer revisions and explicitly allowed properties',() => {
  expect(addCartSchema.safeParse({productId:id,quantity:10,expectedRevision:0}).success).toBe(true);
  for (const extra of [{userId:id},{role:'ADMIN'},{pricePaise:1},{cartId:id},{actor:{userId:id}}]) expect(addCartSchema.safeParse({productId:id,quantity:1,expectedRevision:0,...extra}).success).toBe(false);
  for (const expectedRevision of [-1,0.5,'0',2147483648]) expect(revisionSchema.safeParse({expectedRevision}).success).toBe(false);
  expect(addCartSchema.safeParse({productId:'bad',quantity:1,expectedRevision:0}).success).toBe(false);
});
