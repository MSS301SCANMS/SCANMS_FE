import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import puppeteer from 'puppeteer-core';
const base=process.env.GHN_UI_TEST_URL;
const executablePath='C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
test('profile writes verify persisted fields and unsupported commands never report success', {skip:!base||!existsSync(executablePath),timeout:30000},async()=>{
 assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
 const browser=await puppeteer.launch({executablePath,headless:true});
 try{
  const page=await browser.newPage();let dropFields=true;let user={userId:'fixture-user',fullName:'Before',phoneNumber:'0900000000',roles:['USER'],status:'ACTIVE',gender:'OTHER',dateOfBirth:null};const writes=[];
  await page.evaluateOnNewDocument(()=>{localStorage.setItem('token','isolated-audit-profile');localStorage.setItem('user',JSON.stringify({id:'fixture-user',fullName:'Before',role:'CUSTOMER'}));});
  await page.setRequestInterception(true);page.on('request',request=>{void(async()=>{
   const url=new URL(request.url());
   if(url.pathname.startsWith('/api/')){
    const headers={'Access-Control-Allow-Origin':new URL(base).origin,'Access-Control-Allow-Credentials':'true','Access-Control-Allow-Headers':'authorization,content-type','Access-Control-Allow-Methods':'GET,PATCH,OPTIONS'};
    if(request.method()==='OPTIONS')return request.respond({status:204,headers});
    let result=[];
    if(url.pathname.endsWith('/users/me')){
     if(request.method()==='PATCH'){const body=JSON.parse(request.postData());writes.push(body);if(!dropFields)user={...user,...body};}
     result=user;
    }else if(url.pathname.includes('/seller-orders/')&&url.pathname.endsWith('/status')){
     assert.equal(request.method(),'PATCH');result={sellerOrderId:'fixture-order',status:'SHIPPED'};
    }else assert.equal(request.method(),'GET','unsupported methods must not send partial profile or money writes');
    return request.respond({status:200,headers,contentType:'application/json',body:JSON.stringify({result})});
   }
   if(url.origin!==new URL(base).origin&&!['data:','blob:'].includes(url.protocol))return request.abort();return request.continue();
  })().catch(()=>{if(!request.isInterceptResolutionHandled())void request.abort();});});
  await page.goto(`${base}/login`);await page.waitForFunction(()=>!!document.querySelector('#root'));
  const failed=await page.evaluate(async()=>{const {customerService}=await import('/src/services/customer.service.ts');try{await customerService.updateProfile({fullName:'After',gender:'FEMALE',dateOfBirth:'1999-07-08'});return null;}catch(error){return error.message;}});
  assert.match(failed,/chưa lưu đầy đủ/);assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('user')).fullName),'Before');
  dropFields=false;
  const saved=await page.evaluate(async()=>{const {customerService}=await import('/src/services/customer.service.ts');return customerService.updateProfile({fullName:'After',gender:'FEMALE',dateOfBirth:'1999-07-08'});});
  assert.equal(saved.dateOfBirth,'1999-07-08');assert.equal(saved.gender,'FEMALE');assert.equal(writes[1].dateOfBirth,'1999-07-08');
  const errors=await page.evaluate(async()=>{
   const {customerService}=await import('/src/services/customer.service.ts');const {commissionRulesService}=await import('/src/services/commission-rules.service.ts');
   const operations=[()=>customerService.verifyIdentity({fullName:'Test',idCardNumber:'000000000001',address:'Test'}),()=>commissionRulesService.updateStatus('store','policy',true),()=>commissionRulesService.restoreRule('store','policy'),()=>commissionRulesService.previewBonus('store','1000000')];
   return Promise.all(operations.map(async operation=>{try{await operation();return false;}catch{return true;}}));
  });assert.deepEqual(errors,[true,true,true,true]);assert.equal(writes.length,2);
  const trackingError=await page.evaluate(async()=>{
   const {orderService}=await import('/src/services/order.service.ts');
   try{await orderService.updateOrderFulfillment('fixture-order',{status:'SHIPPING',trackingNumber:'FIXTURE-TRACKING'});return null;}catch(error){return error.message;}
  });assert.match(trackingError,/thông tin vận đơn chưa lưu/,'partial order update must not report full success');
 }finally{await browser.close();}
});
