import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync,mkdirSync } from 'node:fs';
import puppeteer from 'puppeteer-core';
const base=process.env.GHN_UI_TEST_URL;
const executablePath=process.env.GHN_UI_BROWSER_PATH||'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
test('manager return queue uses real records, late response filter, evidence and guarded decisions', {skip:!base||!existsSync(executablePath),timeout:45000},async()=>{
 assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
 const browser=await puppeteer.launch({executablePath,headless:true});
 try{
  const page=await browser.newPage();await page.setViewport({width:1440,height:1000});
  await page.evaluateOnNewDocument(()=>{localStorage.setItem('token','isolated-manager-return-fixture');localStorage.setItem('user',JSON.stringify({id:'manager',role:'SYSTEM_MANAGER',fullName:'Manager kiểm thử'}));localStorage.setItem('scanms-active-workspace','admin');localStorage.setItem('scanms-current-role','admin');});
  const errors=[],writes=[],reads=[];let failRead=false,failWrite=true;
  const common={orderId:'order-test',sellerOrderId:'seller-test',orderItemId:'item-test',storeId:'store-test',storeName:'Shop kiểm thử',customerName:'Khách kiểm thử',customerPhone:'0900000000',productName:'Sản phẩm kiểm thử',quantity:1,refundAmountVnd:50000,status:'REQUESTED',reason:'Sản phẩm bị hư hỏng khi nhận hàng',evidenceRefs:{images:[`${base}/fixture-return.svg`]},requestedAt:new Date(Date.now()-49*3600000).toISOString(),decisionReason:null,shopResponse:null};
  let rows=[{...common,returnRequestId:'return-late'},{...common,returnRequestId:'return-responded',shopResponse:{response:'Shop đã kiểm tra ảnh khách gửi và xin bổ sung bằng chứng.',imageUrls:[`${base}/fixture-return.svg`],submittedAt:new Date().toISOString()}},{...common,returnRequestId:'return-recent',requestedAt:new Date().toISOString()}];
  await page.setRequestInterception(true);page.on('pageerror',error=>{if(!error.message.includes('WebSocket closed without opened'))errors.push(error.message)});
  page.on('request',request=>{void(async()=>{
   const url=new URL(request.url());
   if(url.pathname==='/fixture-return.svg')return request.respond({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150"><rect width="200" height="150" fill="#f4e8d4"/></svg>'});
   if(url.pathname.startsWith('/api/')){
    reads.push(url.pathname);
    const headers={'Access-Control-Allow-Origin':new URL(base).origin,'Access-Control-Allow-Credentials':'true','Access-Control-Allow-Headers':'authorization,content-type','Access-Control-Allow-Methods':'GET,POST,OPTIONS'};
    if(request.method()==='OPTIONS')return request.respond({status:204,headers});
    let status=200,result=[],message;
    if(url.pathname.endsWith('/users/me'))result={userId:'manager',roles:['MANAGER'],fullName:'Manager kiểm thử',status:'ACTIVE'};
    if(url.pathname.endsWith('/returns/manager')){result=rows;if(failRead){status=503;message='Dịch vụ đổi trả kiểm thử đang bận.';}}
    if(request.method()!=='GET'){
     assert.match(url.pathname,/\/returns\/manager\/return-(late|responded|recent)\/decision$/);
     const body=JSON.parse(request.postData());writes.push(body);
     if(failWrite){status=503;message='Chưa lưu được quyết định kiểm thử.';}
     else{const row=rows.find(row=>url.pathname.includes(row.returnRequestId));row.status=body.status;row.decisionReason=body.notes;row.resolvedAt=new Date().toISOString();result={returnRequestId:row.returnRequestId,status:row.status};}
    }
    return request.respond({status,headers,contentType:'application/json',body:JSON.stringify({code:status,result,message})});
   }
   if(url.origin!==new URL(base).origin&&!['data:','blob:'].includes(url.protocol))return request.abort();return request.continue();
  })().catch(error=>{errors.push(error.message);if(!request.isInterceptResolutionHandled())void request.abort();});});
  await page.goto(`${base}/admin/return-disputes`);await page.waitForSelector('.mr-list tbody tr');
  assert.equal((await page.$$('.mr-list tbody tr')).length,3);
  assert.equal(await page.$eval('.mr-stats button:nth-child(2) strong',element=>element.textContent),'1','only an unanswered request older than 48h is late');
  await page.click('.mr-stats button:nth-child(2)');assert.equal((await page.$$('.mr-list tbody tr')).length,1);
  await page.click('.mr-list tbody button');await page.waitForSelector('.mr-review-body');
  await page.click('.mr-review-footer .mr-primary');await page.waitForSelector('.mr-decision textarea');
  assert.equal(await page.$eval('.mr-decision button[type=submit]',element=>element.disabled),true);
  await page.type('.mr-decision textarea','Chấp thuận theo bằng chứng sản phẩm bị hư hỏng.');
  await page.click('.mr-decision button[type=submit]');await page.waitForSelector('.mr-decision [role=alert]');
  assert.ok(await page.$('.mr-decision textarea'),'failure preserves the review and written notes');
  failWrite=false;await page.click('.mr-decision button[type=submit]');await page.waitForSelector('.mr-decision',{hidden:true});
  await page.waitForFunction(()=>document.querySelector('.mr-review-footer').textContent.includes('Đã duyệt'));
  assert.equal(await page.$('.mr-review-footer .mr-primary'),null,'resolved request cannot be decided again');
  await page.click('.mr-review button[aria-label="Đóng cửa sổ"]');
  assert.equal(await page.$eval('.mr-stats button:nth-child(2) strong',element=>element.textContent),'0');
  await page.select('[aria-label="Trạng thái đổi trả"]','ALL');
  await page.click('[aria-label="Xem hồ sơ return-responded"]');
  assert.match(await page.$eval('.mr-review-body',element=>element.textContent),/Shop đã kiểm tra ảnh/);
  assert.equal((await page.$$('.mr-review .mr-evidence a')).length,2);
  mkdirSync('.qa-artifacts/manager-returns',{recursive:true});
  for(const width of [1440,868,390]){
   await page.setViewport({width,height:1000});
   assert.ok(await page.$eval('.mr-review-body',element=>element.scrollWidth-element.clientWidth<=1));
   const bounds=await page.$eval('.mr-review-footer',element=>({bottom:element.getBoundingClientRect().bottom,height:window.innerHeight}));assert.ok(bounds.bottom<=bounds.height);
   await page.screenshot({path:`.qa-artifacts/manager-returns/review-${width}.png`});
  }
  await page.click('.mr-review button[aria-label="Đóng cửa sổ"]');
  for(const width of [1440,390]){await page.setViewport({width,height:1000});assert.ok(await page.$eval('.manager-returns',element=>element.scrollWidth-element.clientWidth<=1));await page.screenshot({path:`.qa-artifacts/manager-returns/list-${width}.png`,fullPage:true});}
  failRead=true;await page.click('[aria-label="Làm mới yêu cầu đổi trả"]');await page.waitForSelector('.manager-returns [role=alert]');assert.equal(await page.$('.mr-list'),null);
  failRead=false;rows=[];await page.click('.mr-error button');await page.waitForSelector('.mr-list .mr-state');
  assert.match(await page.$eval('.mr-list',element=>element.textContent),/Không có yêu cầu phù hợp/);
  assert.equal(writes.length,2);assert.deepEqual(errors,[]);
  assert.equal(reads.includes('/api/v1/users/admin'),false,'Manager prewarming must not request the Admin-only account directory');
 }finally{await browser.close();}
});
