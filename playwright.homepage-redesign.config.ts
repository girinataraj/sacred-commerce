import { defineConfig } from '@playwright/test';
import baseline from './playwright.final-storefront.config';
export default defineConfig({
 ...baseline,
 testMatch:['live-demo/**/*.spec.ts','ui-polish/**/*.spec.ts','final-storefront/**/*.spec.ts','homepage-redesign/**/*.spec.ts'],
 outputDir:'.local/homepage-redesign/test-artifacts',
 reporter:[['list'],['json',{outputFile:'.local/homepage-redesign/results.json'}],['html',{outputFolder:'.local/homepage-redesign/report',open:'never'}]],
 use:{...baseline.use,channel:'chrome'},
 projects:[{name:'homepage-local-review'}],
 webServer:{command:'npm run start -- --port 3111',url:'http://127.0.0.1:3111',cwd:import.meta.dirname,reuseExistingServer:process.env.POLISH_REUSE_SERVER==='true',env:{SACRED_DEMO_MODE:'true'}},
});
