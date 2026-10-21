import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {expect,it,vi} from 'vitest';
import CheckoutLoading from '../../src/app/checkout/loading';
it('checkout navigation loading preserves the checkout introduction and main landmark',()=>{
 vi.stubGlobal('React',React);
 try{const html=renderToStaticMarkup(React.createElement(CheckoutLoading));expect(html).toContain('id="main-content"');expect(html).toContain('A thoughtful checkout');expect(html).toContain('Review current prices and your fictional delivery details before a simulated purchase.');}
 finally{vi.unstubAllGlobals();}
});
