import type { Address } from '../checkout/schemas';
export type PaymentDTO={id:string;outcome:'SUCCEEDED'|'DECLINED';reasonCode:string;amountPaise:number;currency:string};
export type OrderSummary={id:string;reference:string;status:'PAYMENT_FAILED'|'CONFIRMED'|'SHIPPED'|'DELIVERED';sourceCartRevision:number;currency:string;subtotalPaise:number;shippingPaise:number;taxPaise:number;totalPaise:number;createdAt:string};
export type OrderDTO=OrderSummary&{address:Address;items:{productId:string;skuSnapshot:string;nameSnapshot:string;unitPricePaise:number;quantity:number;lineTotalPaise:number}[];payment:PaymentDTO};
