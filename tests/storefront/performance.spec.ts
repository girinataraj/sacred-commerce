import { mkdirSync,writeFileSync } from 'node:fs';
import { expect,test } from '@playwright/test';
test('records a bounded warm local catalogue latency probe without claiming deployed performance',async ({request})=>{
  expect((await request.get('/api/products?pageSize=24')).status()).toBe(200);
  const samples:number[]=[];
  for(let index=0;index<20;index++) {const started=performance.now(); const response=await request.get('/api/products?pageSize=24'); expect(response.status()).toBe(200); expect((await response.json()).data.total).toBe(20); samples.push(Number((performance.now()-started).toFixed(2)));}
  const ordered=[...samples].sort((a,b)=>a-b); mkdirSync('.local',{recursive:true});
  writeFileSync('.local/t03-regression-performance.json',JSON.stringify({executedAt:new Date().toISOString(),mode:process.env.STOREFRONT_PRODUCTION==='true' ? 'local next start with real PostgreSQL':'local next dev with real PostgreSQL',samples:20,warmupRequests:1,durationsMs:samples,p50Ms:ordered[9],p95Ms:ordered[18],maxMs:ordered[19],deployed:false,limitation:'Loopback-only API probe; excludes real network/cold starts/browser rendering. No deployed performance or conversion uplift claimed.'},null,2)+'\n');
});
