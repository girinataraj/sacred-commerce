import 'server-only';
import { z } from 'zod';
import { CheckoutError } from './errors';
export function parseCheckout<T>(schema:z.ZodType<T>,input:unknown):T {
  const parsed=schema.safeParse(input);
  if(!parsed.success){const fields:Record<string,string[]>={};for(const issue of parsed.error.issues){const key=issue.path.join('.')||'input';(fields[key]??=[]).push(issue.message);}throw new CheckoutError('VALIDATION_FAILED',fields);}
  return parsed.data;
}
