import { expect,it } from 'vitest';
import { parseQuantityDraft } from '../../src/features/cart/draft';
it.each([['1',20,1],['10',20,10],['2',2,2],['0',20,null],['-1',20,null],['1.5',20,null],['11',20,null],['3',2,null],['',20,null],[' ',20,null],['one',20,null],['1e0',20,null],['1',0,null]])('validates non-authoritative quantity draft %s at stock %s', (value,stock,expected)=>{
  expect(parseQuantityDraft(value,stock)).toBe(expected);
});
