import {defineConfig} from '@playwright/test';
import homepage from './playwright.homepage-redesign.config';
export default defineConfig({
 ...homepage,
 testMatch:['stillness-edit/**/*.spec.ts','homepage-redesign/**/*.spec.ts','live-demo/**/*.spec.ts'],
 outputDir:'.local/stillness-edit/test-artifacts',
 reporter:[['list'],['json',{outputFile:'.local/stillness-edit/results.json'}],['html',{outputFolder:'.local/stillness-edit/report',open:'never'}]],
 projects:[{name:'stillness-local-review'}],
});
