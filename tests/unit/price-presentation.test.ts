import { expect, it } from 'vitest';
import { presentPrice } from '../../src/lib/price-presentation';
it('presents the supplied selling price with truthful demo comparison arithmetic',() => {
  expect(presentPrice(80000,100000)).toEqual({ selling:'₹800',reference:'₹1,000',saving:'₹200',percent:20 });
});
it.each([null,80000,70000,NaN])('hides absent or invalid reference %s',reference => { expect(presentPrice(80000,reference)?.reference).toBeNull(); expect(presentPrice(80000,reference)?.selling).toBe('₹800'); });
it('preserves paise without silently rounding a price',() => expect(presentPrice(19950,null)?.selling).toBe('₹199.50'));
it.each([NaN,-1,0,1.5])('fails closed for invalid supplied price %s',price => expect(presentPrice(price,null)).toBeNull());
