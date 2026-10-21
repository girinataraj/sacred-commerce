import 'server-only';
import { createHash } from 'node:crypto';
import type { Prisma } from '../../generated/prisma/client';
import { cartAmounts } from '../cart/money';
import { CheckoutError } from './errors';
import type { QuoteDTO,QuoteLine } from './types';
import type { CommitInput } from './schemas';
export type LockedCart={id:string;revision:number};
type LockedProduct={id:string;sku:string;name:string;pricePaise:number;version:number;stock:number;active:boolean};
export function canonicalRequestHash(input:CommitInput):string {
  return hash({cartRevision:input.cartRevision,quoteDigest:input.quoteDigest,address:input.address,simulationMode:input.simulationMode});
}
function hash(value:unknown){return createHash('sha256').update(JSON.stringify(value)).digest('hex');}
export async function lockedQuote(tx:Prisma.TransactionClient,cart:LockedCart):Promise<QuoteDTO>{
  const items=await tx.cartItem.findMany({where:{cartId:cart.id},orderBy:{productId:'asc'}});
  if(!items.length)throw new CheckoutError('EMPTY_CART');
  if(items.length>20)throw new CheckoutError('VALIDATION_FAILED');
  const lines:QuoteLine[]=[];
  // Cart protects membership. Lock each Product in the same stable UUID order.
  for(const item of items){
    const [product]=await tx.$queryRaw<LockedProduct[]>`SELECT id,sku,name,"pricePaise",version,stock,active FROM commerce."Product" WHERE id=${item.productId}::uuid FOR UPDATE`;
    if(!product||!product.active)throw new CheckoutError('PRODUCT_UNAVAILABLE');
    if(!Number.isInteger(item.quantity)||item.quantity<1||item.quantity>10)throw new CheckoutError('VALIDATION_FAILED');
    if(product.stock<item.quantity)throw new CheckoutError('INSUFFICIENT_STOCK');
    lines.push({productId:product.id,sku:product.sku,name:product.name,quantity:item.quantity,unitPricePaise:product.pricePaise,lineTotalPaise:product.pricePaise*item.quantity,version:product.version,stock:product.stock,active:product.active});
  }
  const totals=cartAmounts(lines.map(line=>({pricePaise:line.unitPricePaise,quantity:line.quantity})));
  // Text facts are part of review too; stock changes conservatively invalidate it.
  const contents={cartId:cart.id,cartRevision:cart.revision,lines,...totals};
  return {...contents,digest:hash(contents)};
}
