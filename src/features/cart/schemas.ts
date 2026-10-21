import { z } from 'zod';
export const productIdSchema=z.uuid();
const quantity=z.number().int().min(1).max(10);
const expectedRevision=z.number().int().min(0).max(2147483647);
export const revisionSchema=z.object({expectedRevision}).strict();
export const addCartSchema=z.object({productId:productIdSchema,quantity,expectedRevision}).strict();
export const setCartSchema=z.object({quantity,expectedRevision}).strict();
export const setCartInputSchema=setCartSchema.extend({productId:productIdSchema}).strict();
export const removeCartInputSchema=revisionSchema.extend({productId:productIdSchema}).strict();
