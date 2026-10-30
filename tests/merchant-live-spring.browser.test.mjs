import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import puppeteer from 'puppeteer-core';
const base=process.env.GHN_UI_TEST_URL,executablePath=process.env.GHN_UI_BROWSER_PATH;
test('shop creates a Spring session with owned products and accepted KOL, then starts and ends through real endpoint contracts',{
 skip:!base||!executablePath||!existsSync(executablePath),timeout:40000,
},async()=>{
 const origin=new URL(base).origin;assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
 const browser=await puppeteer.launch({executablePath,headless:true});let page;const writes=[],errors=[];let sessions=[];
 try{
  page=await browser.newPage();page.setDefaultTimeout(10000);await page.setViewport({width:1440,height:1000});await page.emulateTimezone('Asia/Ho_Chi_Minh');
  await page.evaluateOnNewDocument(()=>{
    const NativeDate=Date;window.__advanceNow=0;
    window.Date=class extends NativeDate{constructor(...args){super(...(args.length?args:[NativeDate.parse('2026-10-23T07:30:20Z')+window.__advanceNow]))}static now(){return NativeDate.parse('2026-10-23T07:30:20Z')+window.__advanceNow}};
  });
  page.on('pageerror',e=>{if(!e.message.includes('WebSocket closed without opened'))errors.push(e.message)});
  await page.evaluateOnNewDocument(()=>{localStorage.clear();localStorage.setItem('token','isolated-merchant-live-fixture');localStorage.setItem('user',JSON.stringify({id:'owner',role:'SHOP_MANAGER',roles:['SHOP_OWNER'],fullName:'Fixture owner'}));localStorage.setItem('scanms-current-role','shop');localStorage.setItem('scanms-active-workspace','shop');localStorage.setItem('current_store_id','stale-not-owned-store');});
  await page.setRequestInterception(true);
  page.on('request',request=>{
   const url=new URL(request.url());
   if(url.pathname.startsWith('/api/')){
    const headers={'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Credentials':'true','Access-Control-Allow-Headers':request.headers()['access-control-request-headers']||'authorization,content-type','Access-Control-Allow-Methods':'GET,POST,PATCH,OPTIONS'};
    const respond=(result,status=200)=>request.respond({status,headers,contentType:'application/json',body:JSON.stringify({code:status,result})});
    if(request.method()==='OPTIONS')return request.respond({status:204,headers});
    if(request.method()!=='GET')writes.push({method:request.method(),path:url.pathname,body:request.postData()?JSON.parse(request.postData()):null});
    if(url.pathname.endsWith('/users'))return respond({userId:'owner',roles:['SHOP_OWNER'],fullName:'Fixture owner',status:'ACTIVE'});
    if(url.pathname.endsWith('/stores/mine'))return respond([{storeId:'store-a',name:'Fixture clothing shop',approvalStatus:'APPROVED'}]);
    if(url.pathname.endsWith('/products'))return respond([{productId:'shirt-a',storeId:'store-a',name:'Cotton test shirt',priceVnd:269000,status:'ACTIVE',imageRefs:{primary:'/assets/placeholder-product.svg'}},{productId:'other-product',storeId:'store-b',name:'Wrong store product',priceVnd:999000,status:'ACTIVE'}]);
    if(url.pathname.endsWith('/product-variants'))return respond([{variantId:'variant-a',productId:'shirt-a',sku:'SHIRT-L',size:'L',color:'Blue',priceVnd:269000,status:'ACTIVE',stockQuantity:100}]);
    if(url.pathname.endsWith('/product-images'))return respond([]);
    if(url.pathname.endsWith('/collaborators'))return respond([{collaboratorId:'kol-a',userId:'kol-user',approvalStatus:'APPROVED',applicationData:null}]);
    if(url.pathname.endsWith('/referrals/invitations/catalog'))return respond({storeId:'store-a',storeName:'Fixture clothing shop',products:[],creators:[{id:'kol-a',name:'Accepted clothing KOL',platform:'TIKTOK',followers:28,channelUrl:'https://example.test/approved-channel'},{id:'no-partnership',name:'KOL without accepted partnership',platform:'YOUTUBE',followers:2000,channelUrl:'https://example.test/other-channel'}]});
    if(url.pathname.endsWith('/referrals/invitations/shop'))return respond([{id:'invite-a',storeId:'store-a',collaboratorId:'kol-a',status:'ACCEPTED'},{id:'wrong-store',storeId:'store-b',collaboratorId:'no-partnership',status:'ACCEPTED'}]);
    if(url.pathname.endsWith('/livestreams')&&request.method()==='POST'){
     const body=JSON.parse(request.postData());sessions=[{...body,livestreamId:'created-live',status:'SCHEDULED',participantRefs:{...body.participantRefs,inviteStatus:'PENDING'}}];return respond(sessions[0],201);
    }
    if(url.pathname.endsWith('/livestreams'))return respond(sessions);
    if(url.pathname.endsWith('/livestreams/created-live/start')){sessions[0].status='LIVE';return new Promise(resolve=>setTimeout(()=>resolve(respond(sessions[0])),150));}
    if(url.pathname.endsWith('/livestreams/created-live/end')){sessions[0].status='ENDED';return respond(sessions[0]);}
    return respond([]);
   }
   if(url.origin!==origin&&!['data:','blob:'].includes(url.protocol))return request.abort();return request.continue();
  });
  const clickText=text=>page.evaluate(text=>[...document.querySelectorAll('button')].find(button=>button.textContent.trim()===text).click(),text);
  await page.goto(origin+'/merchant/live-sessions',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.body.innerText.includes('Chưa có phiên livestream nào'));
  await clickText('Tạo phiên live ngay');
  await page.waitForFunction(()=>document.body.innerText.includes('Accepted clothing KOL'));
  assert.match(await page.evaluate(()=>[...document.querySelectorAll('button')].find(button=>button.textContent.includes('Accepted clothing KOL')).textContent),/28 người theo dõi.*TIKTOK/,'use channel details from the safe catalog, not the redacted collaborators list');
  assert.equal(await page.$eval('[role="img"][aria-label="Accepted clothing KOL"]',node=>node.textContent.trim()),'A','missing avatar must use initials instead of an unrelated person');
  assert.equal(await page.evaluate(()=>document.body.innerText.includes('KOL without accepted partnership')),false);
  assert.equal(await page.evaluate(()=>document.body.innerText.includes('Wrong store product')),false);
  await page.evaluate(()=>[...document.querySelectorAll('button')].find(button=>button.textContent.includes('Accepted clothing KOL')).click());
  await page.type('input[placeholder="Ví dụ: Mega Live Deal sốc tối nay"]','Clothing camera session');
  await page.type('#live-products-section input[type="text"]','Blue');
  await page.waitForSelector('#live-products-section input[type="checkbox"]');
  assert.match(await page.$eval('#live-products-section',node=>node.innerText),/269\.000/,'Spring priceVnd and SKU search must be normalized');
  await page.click('#live-products-section input[type="checkbox"]');
  await page.click('[aria-label="Chọn thời gian bắt đầu"]');
  assert.equal(await page.$eval('button[aria-label="13 giờ"]',node=>node.disabled),true,'past hours must be disabled before choosing a day, with UTC min interpreted in Vietnam time');
  await clickText('Bây giờ');await clickText('Xong');await clickText('+1h');
  assert.match(await page.$eval('[aria-label="Chọn thời gian bắt đầu"]',node=>node.textContent),/14:31/,'round up rather than selecting a minute already in the past');
  await page.click('[aria-label="Chọn thời gian kết thúc"]');
  assert.equal(await page.$eval('button[aria-label="14 giờ"]',node=>node.disabled),false,'a partially valid boundary hour remains selectable');
  await page.$eval('button[aria-label="14 giờ"]',node=>node.click());
  await page.waitForFunction(()=>document.querySelector('button[aria-label="14 giờ"]').getAttribute('aria-pressed')==='true');
  assert.equal(await page.$eval('button[aria-label="31 phút"]',node=>node.disabled),true,'end must be later than start');
  await page.$eval('button[aria-label="31 phút"]',node=>node.click());
  assert.equal(await page.$eval('button[aria-label="32 phút"]',node=>node.getAttribute('aria-pressed')),'true','disabled minutes cannot change the selected time');
  await clickText('Xong');
  await page.click('[aria-label="Chọn thời gian bắt đầu"]');await page.click('button[aria-label="24/10/2026"]');await clickText('Xong');
  assert.equal(await page.$eval('[aria-label="Chọn thời gian kết thúc"]',node=>node.getAttribute('aria-invalid')),'true','moving start into the future invalidates an earlier end');
  await page.$eval('form',node=>node.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
  assert.equal(writes.filter(write=>write.path.endsWith('/livestreams')).length,0,'invalid end cannot be posted even when native form validation is bypassed');
  await page.click('[aria-label="Chọn thời gian kết thúc"]');
  assert.equal(await page.$eval('button[aria-label="23/10/2026"]',node=>node.disabled),true,'end calendar cannot select a date before the future start');
  await clickText('Bây giờ');await clickText('Xong');await clickText('+1h');
  await page.evaluate(()=>{window.__advanceNow=2*86400000;document.querySelector('form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}))});
  await page.waitForFunction(()=>document.body.innerText.includes('Giờ bắt đầu đã qua'));
  assert.equal(writes.filter(write=>write.path.endsWith('/livestreams')).length,0,'recheck now at submission when a form has been left open');
  await page.evaluate(()=>{window.__advanceNow=0;window.dispatchEvent(new Event('focus'))});
  await page.waitForFunction(()=>document.querySelector('[aria-label="Chọn thời gian bắt đầu"]').getAttribute('aria-invalid')!=='true');
  await clickText('Tạo phiên & Mời KOL');
  await page.waitForSelector('[aria-label="Đóng chi tiết phiên live"]');
  const created=writes.find(write=>write.path.endsWith('/livestreams'));
  assert.equal(created.body.storeId,'store-a');assert.deepEqual(created.body.productRefs.productIds,['shirt-a']);assert.deepEqual(created.body.collaboratorRefs.collaboratorIds,['kol-a']);
  assert.equal('playbackRef' in created.body,false,'must not save a made-up room identifier');
  assert.equal(await page.$$eval('a[href="/merchant/live-sessions?sessionId=created-live"]',nodes=>nodes.length)>0,true,'open-live links must select the actual session in shop management');
  assert.match(await page.evaluate(()=>document.body.innerText),/Cotton test shirt/);
  assert.equal(await page.evaluate(()=>[...document.querySelectorAll('button')].some(button=>button.textContent.trim()==='Bắt đầu phát sóng')),false,'pending consent cannot start');
  await page.click('[aria-label="Đóng chi tiết phiên live"]');
  sessions[0].participantRefs={...sessions[0].participantRefs,inviteStatus:'ACCEPTED',collaboratorResponses:{'kol-a':'ACCEPTED'}};
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>[...document.querySelectorAll('button')].some(button=>button.title==='Bắt đầu phiên live ngay'));
  const tabsBefore=(await browser.pages()).length;
  await page.evaluate(()=>[...document.querySelectorAll('a')].find(link=>link.textContent.trim()==='Mở live').click());
  await page.waitForSelector('[role="dialog"]');
  assert.equal(new URL(page.url()).pathname,'/merchant/live-sessions');
  assert.equal(new URL(page.url()).searchParams.get('sessionId'),'created-live');
  assert.equal((await browser.pages()).length,tabsBefore,'open management in the current tab');
  assert.equal(writes.filter(write=>write.path.endsWith('/start')).length,0,'opening the selected management session must not start it automatically');
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForSelector('[role="dialog"]');
  assert.equal(await page.$eval('[role="dialog"] h3',node=>node.textContent),'Clothing camera session','deep links restore the selected session after reload');
  await page.evaluate(()=>[...document.querySelectorAll('a')].find(link=>link.textContent.trim()==='Mở link live').click());
  assert.equal(new URL(page.url()).pathname,'/merchant/live-sessions');
  await page.evaluate(()=>{const button=[...document.querySelectorAll('[role="dialog"] button')].find(button=>button.textContent.trim()==='Bắt đầu phát sóng');button.click();button.click()});
  await page.waitForFunction(()=>document.body.innerText.includes('Đã bắt đầu phát sóng.'));
  assert.equal(writes.filter(write=>write.path.endsWith('/start')).length,1);
  await page.waitForSelector('a[href="/live/created-live"]');
  await page.click('[aria-label="Đóng chi tiết phiên live"]');
  assert.equal(new URL(page.url()).searchParams.has('sessionId'),false);
  page.on('dialog',dialog=>dialog.accept());await clickText('Kết thúc phiên');
  await page.waitForFunction(()=>document.body.innerText.includes('Đã kết thúc phiên live.'));
  assert.equal(writes.filter(write=>write.path.endsWith('/end')).length,1);
  assert.equal(writes.some(write=>write.method==='PATCH'),false,'starting cannot silently PATCH an ignored status field');
  assert.deepEqual(errors,[]);
 }catch(error){console.error('Merchant live fixture:',error.stack,errors,await page?.evaluate(()=>document.body.innerText.slice(-1800)));throw error}finally{await browser.close()}
});
