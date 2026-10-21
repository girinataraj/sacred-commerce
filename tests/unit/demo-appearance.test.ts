import {describe,it,expect} from 'vitest';
import {runInNewContext} from 'node:vm';
import {normalizeAppearance,appearanceBootstrap} from '../../src/features/demo/appearance-model';
describe('demo appearance preference',()=>{
 it('accepts only the supported enum and defaults to Light',()=>{expect(normalizeAppearance('twilight')).toBe('twilight');for(const value of [null,undefined,'dark','Light',{},'twilight;alert(1)'])expect(normalizeAppearance(value)).toBe('light');});
 it.each(['light','twilight','unexpected'])('bootstrap validates stored %s without inserting arbitrary values',value=>{const document={documentElement:{dataset:{} as Record<string,string>}};runInNewContext(appearanceBootstrap,{document,localStorage:{getItem:()=>value}});expect(document.documentElement.dataset.demoTheme).toBe(value==='twilight'?'twilight':'light');});
 it('bootstrap remains usable when storage access throws',()=>{const document={documentElement:{dataset:{} as Record<string,string>}};expect(()=>runInNewContext(appearanceBootstrap,{document,get localStorage(){throw Error('blocked');}})).not.toThrow();expect(document.documentElement.dataset.demoTheme).toBe('light');});
});
