import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync,mkdirSync,writeFileSync } from 'node:fs';
import puppeteer from 'puppeteer-core';
const base=process.env.GHN_UI_TEST_URL;
const executablePath=process.env.GHN_UI_BROWSER_PATH||'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
test('KOL application restores submitted data, supplements legacy record and preserves form on failed save', {skip:!base||!existsSync(executablePath),timeout:45000},async()=>{
 assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
 const browser=await puppeteer.launch({executablePath,headless:true});
 mkdirSync('.qa-artifacts/kol-application',{recursive:true});
 const file='.qa-artifacts/kol-application/fixture.png';writeFileSync(file,Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZQmcAAAAASUVORK5CYII=','base64'));
 try{
  const page=await browser.newPage();await page.setViewport({width:1440,height:1000});
  let application={collaboratorId:'existing-kol',userId:'applicant',approvalStatus:'PENDING',createdAt:'2026-10-21T06:00:00Z'};
  let failSave=true,dropDetails=false,failRead=false;const writes=[],errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.evaluateOnNewDocument(()=>{localStorage.setItem('token','isolated-kol-applicant');localStorage.setItem('user',JSON.stringify({id:'applicant',role:'CUSTOMER',fullName:'Applicant'}));localStorage.setItem('scanms-active-workspace','customer');localStorage.setItem('scanms-current-role','customer');});
  await page.setRequestInterception(true);page.on('request',request=>{void(async()=>{
   const url=new URL(request.url());
   if(url.pathname.startsWith('/fixture-'))return request.respond({contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZQmcAAAAASUVORK5CYII=','base64')});
   if(url.pathname.startsWith('/api/')){
    const headers={'Access-Control-Allow-Origin':new URL(base).origin,'Access-Control-Allow-Credentials':'true','Access-Control-Allow-Headers':'authorization,content-type','Access-Control-Allow-Methods':'GET,POST,OPTIONS'};
    if(request.method()==='OPTIONS')return request.respond({status:204,headers});
    let result=[],status=200,message;
    if(url.pathname.endsWith('/users'))result={userId:'applicant',roles:['USER'],status:'ACTIVE',fullName:'Applicant'};
    if(url.pathname.endsWith('/collaborators/me')){result=application;if(failRead){status=503;message='Dịch vụ hồ sơ KOL đang bận.';}}
    if(url.pathname.endsWith('/upload/image'))result={secureUrl:`${base}/fixture-${writes.length}-${Date.now()}.png`};
    else if(request.method()!=='GET'){
     assert.ok(url.pathname.endsWith('/collaborators/application'));
     const body=JSON.parse(request.postData());writes.push(body);
     if(failSave){status=503;message='Chưa lưu được hồ sơ KOL kiểm thử.';}
     else{application={...application,applicationData:dropDetails?{}:{...body,submittedAt:'2026-10-21T07:00:00Z'}};result=application;}
    }
    return request.respond({status,headers,contentType:'application/json',body:JSON.stringify({code:status,result,message})});
   }
   if(url.origin!==new URL(base).origin&&!['data:','blob:'].includes(url.protocol))return request.abort();return request.continue();
  })().catch(error=>{errors.push(error.message);if(!request.isInterceptResolutionHandled())void request.abort();});});
  await page.goto(`${base}/customer/upgrade`);await page.waitForSelector('[aria-label="Hồ sơ KOL đã nộp"]');
  assert.equal(await page.$('#partner-upgrade-form'),null,'pending record must not display a blank form');
  assert.match(await page.$eval('[aria-label="Hồ sơ KOL đã nộp"]',element=>element.textContent),/Hồ sơ cũ mới lưu trạng thái/);
  await page.evaluate(()=>[...document.querySelectorAll('button')].find(button=>button.textContent.includes('Bổ sung hồ sơ KOL')).click());
  await page.waitForSelector('#kol-channel-name');
  await page.click('#kol-platform');await page.evaluate(()=>[...document.querySelectorAll('[role=listbox] button')].find(button=>button.textContent==='TikTok').click());
  for(const [id,value] of Object.entries({'kol-channel-name':'Kênh kiểm thử','kol-channel-url':'https://example.test/channel','kol-followers':'12345','kol-id':'000000000001','kol-account':'00000001','kol-account-name':'KOL TEST','kol-bio':'Nội dung kiểm thử'}))await page.type(`#${id}`,value);
  await page.evaluate(()=>[...document.querySelectorAll('#partner-upgrade-form button')].find(button=>button.textContent.includes('Chọn ngân hàng')).click());await page.waitForSelector('dialog[open] button[aria-label^="Vietcombank,"]');await page.click('dialog[open] button[aria-label^="Vietcombank,"]');
  for(const input of await page.$$('.upgrade-document input[type=file]'))await input.uploadFile(file);
  await page.waitForFunction(()=>document.querySelectorAll('.upgrade-document-body.has-image').length===3);
  const submit='#partner-upgrade-form button[type=submit]';await page.click(submit);await page.waitForFunction(()=>document.body.textContent.includes('Chưa lưu được hồ sơ KOL kiểm thử.'));
  assert.equal(await page.$eval('#kol-channel-name',input=>input.value),'Kênh kiểm thử');assert.equal((await page.$$('.upgrade-document-body.has-image')).length,3);
  failSave=false;dropDetails=true;await page.click(submit);await page.waitForFunction(()=>document.body.textContent.includes('Máy chủ chưa lưu đầy đủ hồ sơ KOL'));
  assert.ok(await page.$('#partner-upgrade-form'),'old backend must not produce a false success');
  dropDetails=false;await page.click(submit);await page.waitForSelector('[aria-label="Hồ sơ KOL đã nộp"]');
  assert.match(await page.$eval('[aria-label="Hồ sơ KOL đã nộp"]',element=>element.textContent),/Kênh kiểm thử/);
  assert.equal(writes[2].bankAccountNumber,'00000001');assert.equal(writes[2].followerCount,12345);assert.equal('userId' in writes[2],false);
  await page.reload();await page.waitForSelector('[aria-label="Hồ sơ KOL đã nộp"]');
  assert.match(await page.$eval('[aria-label="Hồ sơ KOL đã nộp"]',element=>element.textContent),/00000001/);assert.equal((await page.$$('[aria-label="Hồ sơ KOL đã nộp"] img')).length,3);
  await page.evaluate(()=>[...document.querySelectorAll('button')].find(button=>button.textContent.includes('Cập nhật hồ sơ KOL')).click());await page.waitForSelector('#kol-channel-name');assert.equal(await page.$eval('#kol-channel-name',input=>input.value),'Kênh kiểm thử');assert.equal((await page.$$('.upgrade-document-body.has-image')).length,3);
  await page.reload();await page.waitForSelector('[aria-label="Hồ sơ KOL đã nộp"]');await page.screenshot({path:'.qa-artifacts/kol-application/pending.png',fullPage:true});
  failRead=true;await page.click('[aria-label="Kiểm tra trạng thái KOL"]');await page.waitForSelector('[role=alert]');assert.equal(await page.$('#partner-upgrade-form'),null,'outage must not reset application into a new form');
  failRead=false;await page.click('[role=alert] button');await page.waitForSelector('[aria-label="Hồ sơ KOL đã nộp"]');
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
});
