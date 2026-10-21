import { catalogueSeed } from '../../../prisma/seed-data';
export const demoCategories:Record<string,string>={'ritual-essentials':'Ritual Essentials','natural-living':'Natural Living','home-craft':'Home & Craft','books-gifts':'Books & Gifts'};
export const demoProducts=catalogueSeed.map((p,i)=>({...p,id:`SC-${String(i+1).padStart(3,'0')}`}));
export type DemoCart=Record<string,number>;
export function normalizeDemoCart(value:unknown):DemoCart {
 if(!value || typeof value!=='object' || Array.isArray(value))return {};
 const cart:DemoCart={};
 for(const p of demoProducts){const qty=(value as Record<string,unknown>)[p.id];if(typeof qty==='number'&&Number.isSafeInteger(qty)&&qty>0&&p.stock>0)cart[p.id]=Math.min(qty,p.stock);}
 return cart;
}
export function demoTotal(value:unknown):number {const cart=normalizeDemoCart(value);return demoProducts.reduce((total,p)=>total+p.pricePaise*(cart[p.id]??0),0);}
export function demoApiBlocked(enabled:boolean,pathname:string){return enabled&&(pathname==='/api'||pathname.startsWith('/api/'));}
