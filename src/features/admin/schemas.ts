import {z} from 'zod';
import {occasions,intents} from '../catalogue/schemas';
export const adminImages=['/products/demo-placeholder.svg'] as const;
const text=(max:number)=>z.string().trim().min(1).max(max);
const tags=<T extends readonly [string,...string[]]>(values:T)=>z.array(z.enum(values)).min(1).max(5).refine(v=>new Set(v).size===v.length,'Use unique tags.');
export const productFields=z.strictObject({categoryId:z.uuid(),sku:text(80).regex(/^[A-Za-z0-9-]+$/),slug:text(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),name:text(120),description:text(2000),imagePath:z.enum(adminImages),imageAlt:text(200),pricePaise:z.number().int().min(1).max(10000000),compareAtPricePaise:z.number().int().min(1).max(10000000).nullable(),material:text(80),dimensions:text(80),care:text(400),includedContents:text(200),occasionTags:tags(occasions),intentTags:tags(intents),active:z.boolean(),featured:z.boolean()});
export const productSchema=productFields.refine(v=>v.compareAtPricePaise===null||v.compareAtPricePaise>v.pricePaise,{path:['compareAtPricePaise'],message:'Demo reference price must exceed selling price.'});
export const patchSchema=productFields.partial().extend({expectedVersion:z.number().int().min(0).max(2147483646)}).refine(v=>Object.keys(v).length>1,'Choose a product field to update.');
export const inventorySchema=z.strictObject({delta:z.number().int().min(-10000).max(10000).refine(v=>v!==0),expectedVersion:z.number().int().min(0).max(2147483646),reason:text(240).min(3)});
export const statusSchema=z.strictObject({expectedStatus:z.enum(['PAYMENT_FAILED','CONFIRMED','SHIPPED','DELIVERED']),nextStatus:z.enum(['SHIPPED','DELIVERED'])});
export const listSchema=z.strictObject({page:z.coerce.number().int().min(1).max(10000).default(1),status:z.enum(['PAYMENT_FAILED','CONFIRMED','SHIPPED','DELIVERED']).optional(),stock:z.enum(['low','zero']).optional()});
export type AdminProductInput=z.infer<typeof productSchema>;

export const adminProductSchema=productFields.extend({id:z.uuid(),stock:z.number().int().nonnegative(),version:z.number().int().nonnegative(),collections:z.array(z.object({collection:z.object({title:z.string()})}))}).strip();
