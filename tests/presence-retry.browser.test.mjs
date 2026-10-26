import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import puppeteer from 'puppeteer-core';
const base=process.env.GHN_UI_TEST_URL;
const executablePath='C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
test('presence stops missing-API retries and backs off server failures without faking online', {skip:!base||!existsSync(executablePath),timeout:30000},async()=>{
 assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
 const browser=await puppeteer.launch({executablePath,headless:true});
 try{
  const page=await browser.newPage();let status=404;const pulses=[];
  await page.evaluateOnNewDocument(()=>{
   localStorage.setItem('token','fixture-presence-1');localStorage.setItem('user',JSON.stringify({id:'shop-owner',role:'SHOP_MANAGER',fullName:'Fixture shop'}));
   const now=Date.now.bind(Date);window.__clockAdvance=0;Date.now=()=>now()+window.__clockAdvance;
  });
  await page.setRequestInterception(true);page.on('request',request=>{void(async()=>{
   const url=new URL(request.url());
   if(url.pathname.startsWith('/api/')){
    const headers={'Access-Control-Allow-Origin':new URL(base).origin,'Access-Control-Allow-Credentials':'true','Access-Control-Allow-Headers':'authorization,content-type','Access-Control-Allow-Methods':'GET,POST,OPTIONS'};
    if(request.method()==='OPTIONS')return request.respond({status:204,headers});
    let result=[];let code=200;
    if(url.pathname.endsWith('/stores/my-store/presence')){assert.equal(request.method(),'POST');pulses.push(request.headers().authorization);code=status;}
    else assert.equal(request.method(),'GET','no other business mutation is allowed');
    if(url.pathname.endsWith('/users'))result={userId:'shop-owner',roles:['SHOP_OWNER'],fullName:'Fixture shop',status:'ACTIVE'};
    return request.respond({status:code,headers,contentType:'application/json',body:JSON.stringify({result,message:'Fixture response'})});
   }
   if(url.origin!==new URL(base).origin&&!['data:','blob:'].includes(url.protocol))return request.abort();return request.continue();
  })().catch(()=>{if(!request.isInterceptResolutionHandled())void request.abort();});});
  await page.goto(`${base}/login`);await page.waitForNetworkIdle({idleTime:400});assert.ok(pulses.length>0);const first=pulses.length;
  await page.evaluate(()=>{window.__clockAdvance+=120000;window.dispatchEvent(new Event('focus'));});await page.waitForNetworkIdle({idleTime:250});assert.equal(pulses.length,first,'404 must not be retried each heartbeat');
  status=500;
  await page.evaluate(()=>{localStorage.setItem('token','fixture-presence-2');window.dispatchEvent(new Event('auth-user-updated'));});await page.waitForNetworkIdle({idleTime:250});assert.equal(pulses.length,first+1);
  await page.evaluate(()=>{window.__clockAdvance+=25000;window.dispatchEvent(new Event('focus'));});await page.waitForNetworkIdle({idleTime:250});assert.equal(pulses.length,first+1,'500 must back off beyond normal heartbeat');
  await page.evaluate(()=>{window.__clockAdvance+=40000;window.dispatchEvent(new Event('focus'));});await page.waitForNetworkIdle({idleTime:250});assert.equal(pulses.length,first+2);
  assert.equal(pulses.at(-1),'Bearer fixture-presence-2');
 }finally{await browser.close();}
});
