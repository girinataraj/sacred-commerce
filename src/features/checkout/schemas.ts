import { z } from 'zod';
export const uuidSchema=z.uuid().transform(value=>value.toLowerCase());
const revision=z.number().int().min(0).max(2147483646);
export const addressSchema=z.strictObject({
  name:z.string().trim().min(2).max(80),email:z.email().trim().max(254),
  phone:z.string().trim().regex(/^\d{10}$/),line1:z.string().trim().min(5).max(120),
  line2:z.string().trim().max(120).default(''),city:z.string().trim().min(2).max(80),
  state:z.string().trim().min(2).max(80),pin:z.string().trim().regex(/^[1-9]\d{5}$/),country:z.literal('IN'),
});
export const quoteSchema=z.strictObject({cartRevision:revision,address:addressSchema});
export const commitSchema=quoteSchema.extend({idempotencyKey:uuidSchema,quoteDigest:z.string().regex(/^[a-f0-9]{64}$/),simulationMode:z.enum(['SUCCESS','DECLINE'])});
export const orderListSchema=z.strictObject({page:z.number().int().min(1).max(10000).default(1),pageSize:z.number().int().min(1).max(24).default(12)});
export type Address=z.infer<typeof addressSchema>;
export type CommitInput=z.infer<typeof commitSchema>;
