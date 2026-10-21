import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  // Vitest externalizes server-only with its default (client) entry. Resolve
  // exactly its real server-condition entry; Prisma and PostgreSQL stay real.
  resolve: { alias: { 'server-only': fileURLToPath(new URL('./node_modules/server-only/empty.js', import.meta.url)) } },
  test: { include: ['tests/integration/**/*.test.ts'], fileParallelism: false, testTimeout: 15000, hookTimeout: 15000 },
});
