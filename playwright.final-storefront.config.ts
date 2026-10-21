import { defineConfig } from '@playwright/test';
import polish from './playwright.polish.config';

export default defineConfig({
  ...polish,
  testMatch: ['ui-polish/**/*.spec.ts', 'live-demo/**/*.spec.ts', 'final-storefront/**/*.spec.ts'],
  outputDir: 'docs/qa/final-storefront/test-artifacts',
  reporter: [['list'], ['json', { outputFile: 'docs/qa/final-storefront/results.json' }], ['html', { outputFolder: 'docs/qa/final-storefront/local-report', open: 'never' }]],
});
