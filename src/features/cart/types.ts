export type CartAvailability='AVAILABLE'|'INACTIVE'|'OUT_OF_STOCK'|'INSUFFICIENT_STOCK';
export type CartLineDTO=Readonly<{
  productId:string; slug:string; name:string; imagePath:string; imageAlt:string;
  quantity:number; unitPricePaise:number; compareAtPricePaise:number|null; lineTotalPaise:number;
  stock:number; active:boolean; version:number; availability:CartAvailability; canPurchase:boolean;
}>;
export type CartDTO=Readonly<{
  id:string; revision:number; items:readonly CartLineDTO[]; canCheckout:boolean;
  subtotalPaise:number; shippingPaise:number; taxPaise:number; totalPaise:number; currency:'INR';
}>;
