import { afterAll, expect, it } from 'vitest';
import { getDb } from '../../src/lib/server/db';

afterAll(async () => { await getDb().$disconnect(); });
it('the actual server-only Prisma adapter queries the migrated commerce database', async () => {
  const db = getDb();
  expect(getDb()).toBe(db);
  const result = await db.$queryRaw<{ value: number }[]>`SELECT 1::int AS value`;
  expect(result).toEqual([{ value: 1 }]);
  const tables = await db.$queryRaw<{ count: number }[]>`SELECT COUNT(*)::int AS count FROM information_schema.tables WHERE table_schema='commerce'`;
  // Thirteen T01 commerce tables plus T02's anonymous login security bucket.
  expect(tables).toEqual([{ count: 14 }]);
});
