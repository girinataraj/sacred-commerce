import { config } from 'dotenv';
import { defineConfig, devices } from '@playwright/test';
config({ path:['.env.hosted-tests.local','.env.local'],quiet:true });
// Intentionally fail configuration rather than silently skip a hosted gate.
const names=['AUTH_TEST_BASE_URL','AUTH_TEST_PROJECT_REF','AUTH_TEST_CUSTOMER_A_EMAIL','AUTH_TEST_CUSTOMER_A_PASSWORD','AUTH_TEST_CUSTOMER_B_EMAIL','AUTH_TEST_CUSTOMER_B_PASSWORD','AUTH_TEST_ADMIN_EMAIL','AUTH_TEST_ADMIN_PASSWORD','NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'];
if (process.env.AUTH_TEST_ENV!=='development' || names.some(name => !process.env[name])) throw new Error('Hosted Auth tests require privately configured, explicitly designated development accounts and target.');
if (new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname!==`${process.env.AUTH_TEST_PROJECT_REF}.supabase.co`) throw new Error('Hosted Auth project confirmation does not match.');
if (process.env.AUTH_TEST_CUSTOMER_A_EMAIL!=='customer-a@example.test' || process.env.AUTH_TEST_CUSTOMER_B_EMAIL!=='customer-b@example.test' || process.env.AUTH_TEST_ADMIN_EMAIL!=='admin@example.test') throw new Error('Hosted tests accept only the designated synthetic demo accounts.');
export default defineConfig({
  testDir:'./tests/hosted-auth',workers:1,fullyParallel:false,retries:0,
  reporter:[['list']],
  use:{ baseURL:process.env.AUTH_TEST_BASE_URL,trace:'off',screenshot:'off',video:'off' },
  projects:[{ name:'chromium-hosted-auth',use:{ ...devices['Desktop Chrome'] } }],
  // No webServer/deploy/provision step. Owner starts the configured app first.
});
