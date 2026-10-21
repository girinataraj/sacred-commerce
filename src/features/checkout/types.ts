import type { Address } from './schemas';
import type { OrderDTO,PaymentDTO } from '../orders/types';
export type QuoteLine={productId:string;sku:string;name:string;quantity:number;unitPricePaise:number;lineTotalPaise:number;version:number;stock:number;active:boolean};
export type QuoteDTO={cartId:string;cartRevision:number;digest:string;lines:QuoteLine[];currency:'INR';subtotalPaise:number;shippingPaise:number;taxPaise:number;totalPaise:number};
export type CheckoutResult={order:OrderDTO;payment:PaymentDTO;replayed:boolean};
export type { Address };
