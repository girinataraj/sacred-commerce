import { defineConfig, devices } from '@playwright/test';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
const production=process.env.CART_PRODUCTION==='true';
if(process.env.CART_BROWSER_TEST_OWNED!=='true')throw Error('Use the owned integration runner --cart-browser');
export default defineConfig({
  testDir:'./tests/cart-browser',workers:1,retries:0,fullyParallel:false,
  reporter:[['list'],['json',{outputFile:'.local/t05-cart-browser.json'}]],
  use:{baseURL:process.env.CART_TEST_APP_ORIGIN!,ignoreHTTPSErrors:true,trace:'off',screenshot:'off',video:'off'},
  projects:[{name:production?'cart-local-production-pg-simulated-auth':'cart-local-dev-pg-simulated-auth',use:{...devices['Desktop Chrome']}}],
  webServer:{command:`npm run ${production?'start':'dev'} -- --port 3103`,url:'http://127.0.0.1:3103',reuseExistingServer:false,
    env:{NODE_OPTIONS:`--import="${pathToFileURL(resolve('tests/support/cart-auth-preload.mjs')).href}"`,
      APP_ORIGIN:process.env.CART_TEST_APP_ORIGIN!,DATABASE_URL:process.env.DATABASE_URL!,
      NEXT_PUBLIC_SUPABASE_URL:'https://sacred-cart-test.supabase.co',NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_synthetic-cart-test-only',
      AUTH_THROTTLE_SECRET:process.env.CART_TEST_THROTTLE_SECRET!,CART_BROWSER_TEST_OWNED:'true',CART_TEST_PROVIDER_URL:process.env.CART_TEST_PROVIDER_URL!,
      DIRECT_URL:'',TEST_DATABASE_URL:'',TEST_APP_DATABASE_URL:'',CART_FIXTURE_DATABASE_URL:'',CART_TEST_PASSWORD:'',CART_TEST_THROTTLE_SECRET:''}},
});
