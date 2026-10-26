import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync,mkdirSync } from 'node:fs';
import puppeteer from 'puppeteer-core';
const base=process.env.GHN_UI_TEST_URL;
const executablePath='C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
test('KOL review shows all sections, blocks incomplete approvals and fits desktop/mobile', {skip:!base||!existsSync(executablePath),timeout:40000},async()=>{
 assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
 const browser=await puppeteer.launch({executablePath,headless:true});
 try{
  const page=await browser.newPage();await page.setViewport({width:1440,height:1000});let complete=false;const errors=[],writes=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.evaluateOnNewDocument(()=>{localStorage.setItem('token','isolated-kol-review');localStorage.setItem('user',JSON.stringify({id:'manager',role:'SYSTEM_MANAGER',fullName:'Manager'}));localStorage.setItem('scanms-active-workspace','admin');localStorage.setItem('scanms-current-role','admin');});
  await page.setRequestInterception(true);
  page.on('request',request=>{void(async()=>{
   const url=new URL(request.url());
   if(url.pathname==='/fixture-kol.svg')return request.respond({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200"><rect width="300" height="200" fill="#f4e8d4"/></svg>'});
   if(url.pathname.startsWith('/api/')){
    const headers={'Access-Control-Allow-Origin':new URL(base).origin,'Access-Control-Allow-Credentials':'true','Access-Control-Allow-Headers':'authorization,content-type','Access-Control-Allow-Methods':'GET,OPTIONS'};
    if(request.method()==='OPTIONS')return request.respond({status:204,headers});
    if(request.method()!=='GET'){writes.push(request.url());return request.abort();}
    let result=[];
    if(url.pathname.endsWith('/users'))result={userId:'manager',roles:['MANAGER'],status:'ACTIVE',fullName:'Manager'};
    if(url.pathname.endsWith('/collaborators'))result=[{collaboratorId:'fixture-kol',userId:'kol-user',approvalStatus:'PENDING',createdAt:'2026-10-21T06:00:00Z',...(complete?{applicationData:{idCardNumber:'000000000001',bankName:'Ngân hàng kiểm thử',bankAccountNumber:'00000001',bankAccountName:'KOL TEST',channelName:'Kênh kiểm thử',platform:'TIKTOK',channelUrl:'https://example.test/channel',frontCardUrl:`${base}/fixture-kol.svg`,backCardUrl:`${base}/fixture-kol.svg`,channelProofUrl:`${base}/fixture-kol.svg`,followerCount:15000}}:{})}];
    return request.respond({status:200,headers,contentType:'application/json',body:JSON.stringify({result})});
   }
   if(url.origin!==new URL(base).origin&&!['data:','blob:'].includes(url.protocol))return request.abort();return request.continue();
  })().catch(error=>{errors.push(error.message);if(!request.isInterceptResolutionHandled())void request.abort();});});
  await page.goto(`${base}/admin/kyc-approval`);await page.waitForSelector('[data-application-tab=kol]');await page.click('[data-application-tab=kol]');await page.waitForSelector('[aria-label="Danh sách hồ sơ KOL"] tbody button');await page.click('[aria-label="Danh sách hồ sơ KOL"] tbody button');await page.waitForSelector('.kol-review-dialog');
  assert.equal((await page.$$('.kol-review-dialog .kyc-kol-section')).length,3);
  assert.equal((await page.$$('.kol-review-dialog details')).length,0,'sections must stay open for review');
  assert.equal(await page.$eval('.kyc-kol-footer button:last-child',element=>element.disabled),true);
  assert.equal((await page.$$('.kyc-kol-missing-tag')).length,7);
  await page.click('.kyc-kol-footer button:first-child');await page.waitForSelector('.kol-review-dialog textarea');await page.click('.kyc-kol-footer button:first-child');assert.equal(writes.length,0,'blank rejection cannot be submitted');
  await page.evaluate(()=>[...document.querySelectorAll('.kol-review-dialog button')].find(button=>button.textContent==='Hủy từ chối').click());
  await page.click('.kol-review-dialog button[aria-label="Đóng cửa sổ"]');
  complete=true;await page.click('[aria-label="Làm mới danh sách hồ sơ"]');await page.waitForFunction(()=>!document.querySelector('[aria-label="Làm mới danh sách hồ sơ"]').disabled);await page.click('[aria-label="Danh sách hồ sơ KOL"] tbody button');await page.waitForSelector('.kol-review-dialog');
  assert.equal(await page.$eval('.kyc-kol-footer button:last-child',element=>element.disabled),false);
  assert.match(await page.$eval('.kyc-kol-bank',element=>element.textContent),/00000001/);
  await page.click('.kol-review-dialog .kyc-document-image');await page.waitForSelector('img[alt="Chi tiết tài liệu"]');await page.click('[aria-label="Đóng ảnh phóng to"]');
  mkdirSync('.qa-artifacts/kol-review',{recursive:true});
  for(const width of [1440,868,390]){
   await page.setViewport({width,height:1000});
   const geometry=await page.$eval('.kol-review-dialog',element=>({overflow:element.children[1].scrollWidth-element.children[1].clientWidth,bottom:element.getBoundingClientRect().bottom,footer:element.lastElementChild.getBoundingClientRect().bottom,height:innerHeight}));assert.ok(geometry.overflow<=1&&geometry.bottom<=geometry.height&&geometry.footer<=geometry.bottom);
   await page.screenshot({path:`.qa-artifacts/kol-review/review-${width}.png`});
  }
  assert.deepEqual(errors,[]);assert.equal(writes.length,0);
 }finally{await browser.close();}
});
