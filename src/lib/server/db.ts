import 'server-only';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';

const state = globalThis as unknown as { commerceDb?: PrismaClient };

export function getDb(): PrismaClient {
  if(process.env.SACRED_DEMO_MODE==='true')throw new Error('Database access is disabled in the self-contained demo.');
  if (state.commerceDb) return state.commerceDb;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('Server database configuration is missing.');
  const adapter = new PrismaPg({ connectionString, max: 2, connectionTimeoutMillis: 5000, idleTimeoutMillis: 10000 });
  const db = new PrismaClient({ adapter });
  state.commerceDb = db;
  return db;
}
