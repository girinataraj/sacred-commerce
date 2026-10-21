import { describe, expect, it } from 'vitest';
import { parseCatalogueQuery, priceDraftToPaise } from '../../src/features/catalogue/schemas';
describe('catalogue transport validation',() => {
  it('defaults to bounded featured pagination and normalizes text',() => {
    expect(parseCatalogueQuery({q:'  Cotton  '})).toMatchObject({q:'Cotton',sort:'featured',page:1,pageSize:12,inStock:false,onOffer:false});
  });
  it('accepts the combined approved filter contract',() => expect(parseCatalogueQuery(new URLSearchParams('category=natural-living&occasion=everyday&intent=gifting&minPricePaise=19900&maxPricePaise=100000&inStock=true&onOffer=true&sort=price_desc&page=2&pageSize=4'))).toMatchObject({category:'natural-living',minPricePaise:19900,maxPricePaise:100000,page:2,pageSize:4,inStock:true,onOffer:true}));
  it.each(['minPricePaise=-1','minPricePaise=1.5','minPricePaise=10000001','minPricePaise=200&maxPricePaise=100','inStock=1','sort=random','page=0','page=10001','pageSize=25','occasion=unknown','intent=unknown','active=false','active=','category=../admin','q=a&q=b','q=&q=b'])('rejects invalid query %s',query => expect(() => parseCatalogueQuery(new URLSearchParams(query))).toThrow());
  it('rejects overlong searches and duplicate page-prop arrays',() => {
    expect(() => parseCatalogueQuery({q:'x'.repeat(81)})).toThrow(); expect(() => parseCatalogueQuery({page:['1','2']})).toThrow();
  });
  it.each([['199.50',19950],['0',0],['100000',10000000],['',undefined]])('converts INR draft %s without losing paise', (value,result) => expect(priceDraftToPaise(value)).toBe(result));
  it.each(['-1','NaN','1.234','1e3','100000.01'])('rejects invalid INR draft %s',value => expect(() => priceDraftToPaise(value)).toThrow());
});
