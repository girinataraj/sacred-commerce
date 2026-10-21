import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  globalIgnores(['.next/**', '.local/**', 'src/generated/**', 'playwright-report/**', 'test-results/**', 'docs/qa/polish/local-report/**', 'docs/qa/final-storefront/local-report/**']),
]);
