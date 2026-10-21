import { config } from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { seedCatalogue } from './seed-catalogue';

config({ path: '.env.local', quiet: true });
config({ path: '.env', quiet: true });
if (!process.env.DIRECT_URL) throw new Error('DIRECT_URL must be configured privately before catalogue seeding.');
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL, max: 2 }) });
try {
  await seedCatalogue(db);
  console.log('Original catalogue seed applied without resetting existing inventory or order history.');
} catch {
  console.error('Catalogue seeding failed; inspect the private database configuration and migration status.');
  process.exitCode = 1;
} finally { await db.$disconnect(); }
