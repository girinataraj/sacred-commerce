import { defineConfig, devices } from '@playwright/test';
const production = process.env.STOREFRONT_PRODUCTION === 'true';
export default defineConfig({
  testDir:'./tests/storefront', retries:0, workers:1,
  reporter:[['list'],['json',{outputFile:'.local/t03-storefront.json'}]],
  use:{baseURL:'http://127.0.0.1:3102',trace:'off',screenshot:'off',video:'off'},
  projects:[{name:production ? 'chromium-local-production-pg':'chromium-local-development-pg',use:{...devices['Desktop Chrome']}}],
  webServer:{command:`npm run ${production ? 'start':'dev'} -- --port 3102`,url:'http://127.0.0.1:3102',reuseExistingServer:false,env:{APP_ORIGIN:'http://127.0.0.1:3102',NEXT_PUBLIC_SUPABASE_URL:'',NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'',DIRECT_URL:'',TEST_DATABASE_URL:'',TEST_APP_DATABASE_URL:'',STOREFRONT_LOCK_DATABASE_URL:'',STOREFRONT_TEST_OWNED:''}},
});
