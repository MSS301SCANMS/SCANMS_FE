import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import puppeteer from 'puppeteer-core';
const base=process.env.GHN_UI_TEST_URL,executablePath=process.env.GHN_UI_BROWSER_PATH;
test('approved KOL keeps shopping workspace and opens the correct invitation tab only after refreshed roles authorize it',{
 skip:!base||!executablePath||!existsSync(executablePath),timeout:40000,
},async()=>{
 const origin=new URL(base).origin;assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
 const browser=await puppeteer.launch({executablePath,headless:true});let page,grant=false,refreshes=0;const errors=[];
 try{
  page=await browser.newPage();page.setDefaultTimeout(10000);await page.setViewport({width:1440,height:1000});
  page.on('pageerror',error=>{if(!error.message.includes('WebSocket closed without opened'))errors.push(error.message)});
  await page.evaluateOnNewDocument(()=>{if(localStorage.getItem('token'))return;localStorage.setItem('token','approved-kol-old-token');localStorage.setItem('refresh_token','fixture-refresh');localStorage.setItem('scanms-session-id','approved-kol-fixture');localStorage.setItem('user',JSON.stringify({id:'kol-user',role:'CUSTOMER',roles:['USER'],fullName:'Fixture KOL'}));localStorage.setItem('scanms-current-role','customer');localStorage.setItem('scanms-active-workspace','customer');});
  await page.setRequestInterception(true);
  page.on('request',request=>{
   const url=new URL(request.url());
   if(url.pathname.startsWith('/api/')){
    const headers={'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Credentials':'true','Access-Control-Allow-Headers':request.headers()['access-control-request-headers']||'authorization,content-type','Access-Control-Allow-Methods':'GET,POST,OPTIONS'};
    const respond=result=>request.respond({status:200,headers,contentType:'application/json',body:JSON.stringify({code:200,result})});
    if(request.method()==='OPTIONS')return request.respond({status:204,headers});
    if(url.pathname.endsWith('/auth/refresh-token')){refreshes++;return respond({access_token:grant?'approved-kol-current-token':'approved-kol-no-role-token',refresh_token:'fixture-rotated-refresh',expires_in:3600})}
    if(url.pathname.endsWith('/users'))return respond({userId:'kol-user',roles:grant?['USER','KOL_CTV']:['USER'],fullName:'Fixture KOL',status:'ACTIVE'});
    if(url.pathname.endsWith('/collaborators/me'))return respond({collaboratorId:'kol-a',userId:'kol-user',approvalStatus:'APPROVED',applicationData:{platform:'TIKTOK',channelName:'Fixture approved KOL',channelUrl:'https://example.test/kol',followerCount:28},createdAt:'2026-10-23T04:00:00'});
    if(url.pathname.endsWith('/referrals/invitations/mine'))return respond([{id:'invite-one',storeId:'store-a',storeName:'Shop invitation fixture',collaboratorId:'kol-a',collaboratorName:'Fixture approved KOL',productId:null,productName:null,message:'Invitation from shop',status:'PENDING',createdAt:'2026-10-23T04:00:00'}]);
    if(url.pathname.endsWith('/livestreams'))return respond([{livestreamId:'invite-live',storeId:'store-a',title:'Livestream invitation fixture',status:'SCHEDULED',scheduledAt:'2026-10-23T04:00:00',participantRefs:{creatorName:'Fixture approved KOL',inviteStatus:'PENDING',endsAt:'2026-10-23T06:00:00Z'},collaboratorRefs:{collaboratorIds:['kol-a']},productRefs:{productIds:[]}}]);
    return respond([]);
   }
   if(url.origin!==origin&&!['data:','blob:'].includes(url.protocol))return request.abort();return request.continue();
  });
  const banner='[aria-label="Không gian KOL đã được duyệt"]';
  const clickText=text=>page.evaluate(text=>[...document.querySelectorAll('button')].find(button=>button.textContent.trim()===text).click(),text);
  await page.goto(origin+'/customer/upgrade',{waitUntil:'domcontentloaded'});await page.waitForSelector(banner);
  assert.match(await page.$eval('.workspace-sidebar',node=>node.innerText),/MUA SẮM|Mua sắm/);
  assert.match(await page.$eval(banner,node=>node.textContent),/đang ở không gian mua sắm/);
  await clickText('Lời mời hợp tác từ shop');
  await page.waitForFunction(()=>document.body.innerText.includes('quyền KOL chưa được đồng bộ'));
  assert.equal(new URL(page.url()).pathname,'/customer/upgrade','approved application alone cannot bypass authorization');
  assert.equal(await page.evaluate(()=>localStorage.getItem('scanms-active-workspace')),'customer');
  grant=true;
  await page.$$eval(banner+' button',buttons=>{buttons[0].click();buttons[0].click()});
  await page.waitForSelector('[aria-label="Lời mời hợp tác từ shop"]');
  assert.equal(new URL(page.url()).searchParams.get('tab'),'invitations');
  assert.equal(await page.evaluate(()=>localStorage.getItem('scanms-active-workspace')),'kol');
  assert.match(await page.$eval('[aria-label="Lời mời hợp tác từ shop"]',node=>node.textContent),/Shop invitation fixture/);
  assert.equal(refreshes,2,'rapid duplicate clicks must not repeat refresh or navigation');
  assert.equal(await page.$eval('.workspace-sidebar',node=>node.dataset.workspaceRole),'COLLABORATOR');
  await page.goto(origin+'/customer/upgrade',{waitUntil:'domcontentloaded'});await page.waitForSelector(banner);
  await clickText('Lời mời livestream');
  await page.waitForFunction(()=>document.body.innerText.includes('Livestream invitation fixture'));
  assert.equal(new URL(page.url()).searchParams.get('tab'),'live');
  assert.equal(await page.$eval('#marketing-toolkit-hub',node=>node.dataset.activeTab),'live');
  assert.deepEqual(errors,[]);
 }catch(error){console.error('Approved KOL entry fixture:',errors,await page?.evaluate(()=>document.body.innerText.slice(-1600)));throw error}finally{await browser.close()}
});
