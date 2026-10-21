import { z } from 'zod';

export const occasions = ['navratri', 'housewarming', 'everyday'] as const;
export const intents = ['gifting', 'ritual', 'home', 'reading', 'self_care'] as const;
const slug = z.string().max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const integer = (max: number, min = 0) => z.string().regex(/^\d{1,8}$/).transform(Number).pipe(z.number().int().min(min).max(max));
const boolean = z.enum(['true', 'false']).transform(value => value === 'true');
const schema = z.strictObject({
  q: z.string().trim().max(80).default(''), category: slug.optional(), collection: slug.optional(),
  occasion: z.enum(occasions).optional(), intent: z.enum(intents).optional(),
  minPricePaise: integer(10000000).optional(), maxPricePaise: integer(10000000).optional(),
  inStock: boolean.default(false), onOffer: boolean.default(false),
  sort: z.enum(['featured', 'name_asc', 'price_asc', 'price_desc']).default('featured'),
  page: integer(10000, 1).default(1), pageSize: integer(24, 1).default(12),
}).refine(query => query.minPricePaise === undefined || query.maxPricePaise === undefined || query.minPricePaise <= query.maxPricePaise, { path: ['maxPricePaise'], message: 'Minimum price must not exceed maximum price.' });
export type CatalogueQuery = z.output<typeof schema>;
export type QueryInput = URLSearchParams | Record<string, string | string[] | undefined>;
export class CatalogueQueryError extends Error {
  constructor(public readonly fieldErrors: Record<string, string> = {}) {
    super('Check your filters. Use valid search options and a minimum price no greater than the maximum.');
  }
}
export function parseCatalogueQuery(input: QueryInput): CatalogueQuery {
  const values: Record<string, string> = {};
  const seen = new Set<string>();
  const entries = input instanceof URLSearchParams ? [...input.entries()] : Object.entries(input);
  if (new TextEncoder().encode(JSON.stringify(entries)).byteLength > 4096) throw new CatalogueQueryError({ query: 'Use a shorter query.' });
  for (const [key, value] of entries) {
    if (!Object.hasOwn(schema.shape, key) || seen.has(key) || Array.isArray(value)) throw new CatalogueQueryError({ [key]: 'Use one valid value for each filter.' });
    seen.add(key);
    // Empty form options mean no restriction, not a zero-price constraint.
    if (value !== undefined && value !== '') values[key] = value;
  }
  const result = schema.safeParse(values);
  if (!result.success) {
    const fields = Object.fromEntries(result.error.issues.map(issue => [String(issue.path[0] ?? 'query'), 'Check this filter value.']));
    throw new CatalogueQueryError(fields);
  }
  return result.data;
}
export function priceDraftToPaise(input: string): number | undefined {
  const value = input.trim();
  if (!value) return undefined;
  if (!/^\d{1,6}(?:\.\d{1,2})?$/.test(value)) throw new CatalogueQueryError({ price: 'Enter a nonnegative INR amount with at most two decimal places.' });
  const [rupees, fraction = ''] = value.split('.');
  const paise = Number(rupees) * 100 + Number(fraction.padEnd(2, '0'));
  if (paise > 10000000) throw new CatalogueQueryError({ price: 'Maximum demo price is ₹1,00,000.' });
  return paise;
}
export function catalogueHref(query: Partial<CatalogueQuery>, path = '/products'): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === '' || value === false || (key === 'page' && value === 1) || (key === 'sort' && value === 'featured')) continue;
    params.set(key, String(value));
  }
  return path + (params.size ? `?${params}` : '');
}
