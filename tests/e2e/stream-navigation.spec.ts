import {test,expect,type Request} from '@playwright/test';
import {writeFileSync,mkdirSync} from 'node:fs';
test.use({trace:'off',screenshot:'off',video:'off'});
test('instrument sign-out navigation and cancelled RSC responses without hiding server diagnostics',async({page})=>{
 const startedAt=new Date().toISOString(),started=Date.now();
 const events:{atMs:number;kind:string;path:string;rsc:boolean;detail?:string}[]=[];
 const record=(kind:string,request:Request)=>{const url=new URL(request.url());if(url.origin!=='http://127.0.0.1:3100')return;events.push({atMs:Date.now()-started,kind,path:url.pathname,rsc:url.searchParams.has('_rsc'),...(kind==='requestfailed'?{detail:request.failure()?.errorText}:{})});};
 page.on('request',request=>record('request',request));page.on('requestfailed',request=>record('requestfailed',request));page.on('requestfinished',request=>record('requestfinished',request));
 await page.route('**/api/auth/session',route=>route.fulfill({json:{data:{actor:{userId:'7eb42b00-73aa-4111-8000-000000000001',role:'CUSTOMER'}}}}));
 await page.route('**/api/auth/logout',route=>route.fulfill({json:{data:{signedOut:true}}}));
 await page.goto('/');await expect(page.getByRole('heading',{name:'Sacred Commerce',exact:true})).toBeVisible();await page.getByRole('button',{name:'Sign out',exact:true}).click();
 await expect.poll(()=>new URL(page.url()).pathname).toBe('/login');await expect(page.getByRole('heading',{name:'Sign in to Sacred Commerce'})).toBeVisible();
 mkdirSync('.local',{recursive:true});writeFileSync('.local/t09-stream-navigation.json',JSON.stringify({startedAt,endedAt:new Date().toISOString(),simulatedUiOnly:true,events,limitation:'Browser navigation evidence only; server log correlation does not establish framework root cause.'},null,2)+'\n');
});
