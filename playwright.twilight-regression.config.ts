import {defineConfig} from '@playwright/test';
import base from './playwright.twilight.config';
export default defineConfig({...base,testMatch:['twilight/**/*.spec.ts','homepage-redesign/**/*.spec.ts','stillness-edit/**/*.spec.ts','live-demo/**/*.spec.ts'],reporter:[['list'],['json',{outputFile:'.local/twilight/final-results.json'}]]});
