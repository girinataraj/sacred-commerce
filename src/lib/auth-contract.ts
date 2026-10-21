import { z } from 'zod';
export function safeReturnPath(value: unknown): string {
  if (typeof value !== 'string' || value.length > 1000 || !value.startsWith('/') || value.startsWith('//') || /[\\\s\u0000-\u001f\u007f]|%/i.test(value)) return '/';
  const url = new URL(value, 'https://local.invalid');
  if (url.origin !== 'https://local.invalid' || /^\/(login|api)(\/|$)/.test(url.pathname)) return '/';
  return url.pathname + url.search + url.hash;
}
export const loginSchema = z.object({ email: z.email().max(254), password: z.string().min(1).max(256), next: z.string().max(1000).optional() }).strict();
