import { config } from 'dotenv';
import { defineConfig } from 'prisma/config';

config({ path: '.env.local', quiet: true });
config({ path: '.env', quiet: true });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations', seed: 'tsx prisma/seed.ts' },
  // Generate/validate/build do not need a live database or a secret.
  // Migration/seed commands enforce DIRECT_URL through their entry points.
  datasource: { url: process.env.DIRECT_URL ?? 'postgresql://localhost:5432/unconfigured' },
});
