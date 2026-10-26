import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import puppeteer from 'puppeteer-core';
const base=process.env.GHN_UI_TEST_URL,executablePath=process.env.GHN_UI_BROWSER_PATH;
test('Spring livestream loads its real products, recognizes the invited KOL and routes buyers to variant selection with source',{
 skip:!base||!executablePath||!existsSync(executablePath),timeout:40000,
},async()=>{
 const origin=new URL(base).origin;assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
 const browser=await puppeteer.launch({executablePath,headless:true});
 let page,buyer=false;const errors=[];
 try{
  page=await browser.newPage();page.setDefaultTimeout(15000);
  page.on('pageerror',e=>{if(!e.message.includes('WebSocket closed without opened'))errors.push(e.message)});
  await page.evaluateOnNewDocument(()=>{const viewer=new URLSearchParams(location.search).has('viewer');localStorage.clear();sessionStorage.clear();localStorage.setItem('token','live-fixture-only');localStorage.setItem('user',JSON.stringify(viewer?{id:'buyer-user',fullName:'Buyer',role:'CUSTOMER',roles:['USER']}:{id:'kol-user',fullName:'Test KOL',role:'COLLABORATOR',roles:['KOL_CTV']}));localStorage.setItem('scanms-active-workspace',viewer?'customer':'kol');localStorage.setItem('scanms-current-role',viewer?'customer':'kol');});
  await page.setRequestInterception(true);
  page.on('request',request=>{
   const url=new URL(request.url());
   if(url.pathname.startsWith('/api/')){
    const headers={'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Credentials':'true','Access-Control-Allow-Headers':request.headers()['access-control-request-headers']||'authorization,content-type','Access-Control-Allow-Methods':'GET,OPTIONS'};
    if(request.method()==='OPTIONS')return request.respond({status:204,headers});
    if(request.method()!=='GET')return request.abort();
    let result=[];
    if(url.pathname.endsWith('/livestreams/spring-live'))result={livestreamId:'spring-live',storeId:'store-a',title:'Clothing live',status:'LIVE',startedAt:'2026-10-23T01:00:00',productRefs:{productIds:['shirt-a']},collaboratorRefs:{collaboratorIds:['kol-a']},participantRefs:{creatorName:'Invited KOL',collaboratorResponses:{'kol-a':'ACCEPTED'}}};
    if(url.pathname.endsWith('/stores/public/id/store-a'))result={id:'store-a',name:'Real clothing store'};
    if(url.pathname.endsWith('/collaborators'))result=[{collaboratorId:'kol-a',userId:'kol-user',approvalStatus:'APPROVED'}];
    if(url.pathname.endsWith('/shirt-a/landing'))result={product:{id:'shirt-a',title:'Cotton shirt from API',price:269000,stockQuantity:10,variants:[{id:'variant-a',stockQuantity:10,price:269000,isActive:true}]}};
    if(url.pathname.endsWith('/users'))result={userId:buyer?'buyer-user':'kol-user',fullName:buyer?'Buyer':'Test KOL',roles:[buyer?'USER':'KOL_CTV'],status:'ACTIVE'};
    return request.respond({status:200,headers,contentType:'application/json',body:JSON.stringify({code:200,result})});
   }
   if(url.origin!==origin&&!['data:','blob:'].includes(url.protocol))return request.abort();return request.continue();
  });
  await page.goto(origin+'/live/spring-live',{waitUntil:'domcontentloaded'});
  await page.waitForSelector('.live-room-header');
  assert.match(await page.$eval('.live-room-header',n=>n.textContent),/Real clothing store/);
  await page.waitForSelector('button.live-room-camera');
  assert.match(await page.$eval('[aria-label="Sản phẩm đang giới thiệu"]',n=>n.textContent),/Cotton shirt from API/);
  const price=await page.$eval('.live-product-prices',n=>n.textContent);assert.match(price,/269[.,]000/);assert.doesNotMatch(price,/228[.,]650/);
  assert.deepEqual(errors,[]);
  buyer=true;
  await page.evaluate(()=>{localStorage.setItem('user',JSON.stringify({id:'buyer-user',role:'CUSTOMER',roles:['USER'],fullName:'Buyer'}));localStorage.setItem('scanms-active-workspace','customer');localStorage.setItem('scanms-current-role','customer');});
  await page.goto(origin+'/live/spring-live?viewer=1',{waitUntil:'domcontentloaded'});
  await page.waitForSelector('.live-product-buy');
  await page.click('.live-product-buy');
  await page.waitForFunction(()=>location.pathname==='/products/shirt-a');
  assert.equal(new URL(page.url()).searchParams.get('live'),'spring-live');
 }catch(error){console.error('Live room fixture:',errors,await page?.evaluate(()=>document.body.innerText.slice(0,1800)));throw error;}finally{await browser.close();}
});
