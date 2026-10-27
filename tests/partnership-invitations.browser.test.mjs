import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync } from 'node:fs';
import puppeteer from 'puppeteer-core';
const base=process.env.GHN_UI_TEST_URL;
const executablePath=process.env.GHN_UI_BROWSER_PATH||'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

test('shop invitations persist across reload, preserve failures, and KOL accepts a connection without requiring products or creating a referral', {skip:!base||!existsSync(executablePath),timeout:60000},async()=>{
 assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
 const browser=await puppeteer.launch({executablePath,headless:true});mkdirSync('.qa-artifacts/partnership',{recursive:true});
 let rows=[],failSend=true,failAccept=true;const writes=[],errors=[];
 const setup=async(mode)=>{
  const context=await browser.createBrowserContext();const page=await context.newPage();await page.setViewport({width:1440,height:1050});
  page.on('pageerror',error=>{if(!error.message.includes('WebSocket closed without opened'))errors.push(error.message)});
  await page.evaluateOnNewDocument(mode=>{
   localStorage.setItem('token','isolated-partnership-test');
   localStorage.setItem('user',JSON.stringify({id:mode==='shop'?'shop-user':'kol-user',role:mode==='shop'?'SHOP_OWNER':'COLLABORATOR',fullName:mode==='shop'?'Sora Skin':'Creator One'}));
   localStorage.setItem('scanms-active-workspace',mode==='shop'?'shop':'kol');localStorage.setItem('scanms-current-role',mode==='shop'?'shop':'kol');
  },mode);
  await page.setRequestInterception(true);page.on('request',request=>{void(async()=>{
   const url=new URL(request.url());
   if(url.pathname.startsWith('/api/')){
    const headers={'Access-Control-Allow-Origin':new URL(base).origin,'Access-Control-Allow-Credentials':'true','Access-Control-Allow-Headers':'authorization,content-type','Access-Control-Allow-Methods':'GET,POST,OPTIONS'};
    if(request.method()==='OPTIONS')return request.respond({status:204,headers});
    if(url.pathname.endsWith('/stores/my-store/presence'))return request.respond({status:200,headers,contentType:'application/json',body:JSON.stringify({code:200,result:{online:true}})});
    let result=[],status=200,message='Success';
    if(url.pathname.endsWith('/users'))result={userId:mode==='shop'?'shop-user':'kol-user',roles:[mode==='shop'?'SHOP_OWNER':'COLLABORATOR'],status:'ACTIVE',fullName:'Fixture user'};
    if(url.pathname.endsWith('/stores/mine'))result=[{storeId:'store-1',name:'Sora Skin',ownerUserId:'shop-user',approvalStatus:'APPROVED'}];
    if(url.pathname.endsWith('/stores/store-1'))result={storeId:'store-1',name:'Sora Skin',ownerUserId:'shop-user',approvalStatus:'APPROVED'};
    if(url.pathname.endsWith('/collaborators/me'))result={collaboratorId:'kol-1',userId:'kol-user',approvalStatus:'APPROVED',applicationData:{channelName:'Creator One'}};
    if(url.pathname.endsWith('/invitations/catalog'))result={storeId:'store-1',storeName:'Sora Skin',products:[],creators:[{id:'kol-1',name:'Creator One',platform:'TIKTOK',followers:12500,channelUrl:null},{id:'kol-2',name:'Creator Two',platform:'YOUTUBE',followers:8000,channelUrl:null}]};
    if(url.pathname.endsWith('/invitations/shop')||url.pathname.endsWith('/invitations/mine'))result=rows;
    if(request.method()!=='GET'){
     assert.ok(url.pathname.includes('/referrals/invitations'),'Unexpected intercepted write: '+url.pathname);const body=request.postData()?JSON.parse(request.postData()):{};writes.push({path:url.pathname,body});
     if(url.pathname.endsWith('/invitations')){
      if(failSend){status=503;message='Chưa lưu được lời mời kiểm thử.';}
      else{const row={...body,id:'invitation-1',productId:null,storeName:'Sora Skin',collaboratorName:'Creator One',productName:'Sản phẩm thật của shop',status:'PENDING',createdAt:'2026-10-21T08:00:00',referralLinkId:null,referralToken:null};rows=[row];result=row;}
     }else if(url.pathname.endsWith('/respond')){
      if(failAccept){status=503;message='Chưa tạo được liên kết kiểm thử.';}
      else{rows=rows.map(row=>({...row,status:body.decision,referralLinkId:null,referralToken:null}));result=rows[0];}
     }else if(url.pathname.endsWith('/cancel')){rows=rows.map(row=>({...row,status:'CANCELLED'}));result=rows[0];}
    }
    return request.respond({status,headers,contentType:'application/json',body:JSON.stringify({code:status,result,message})});
   }
   if(url.origin!==new URL(base).origin&&!['data:','blob:'].includes(url.protocol))return request.abort();return request.continue();
  })().catch(error=>{errors.push(error.message);if(!request.isInterceptResolutionHandled())void request.abort();});});return page;
 };
 try{
  const shop=await setup('shop');await shop.goto(`${base}/merchant/collaborations`);await shop.waitForSelector('.partnership-header .primary');
  await shop.click('.partnership-header .primary');await shop.waitForSelector('.partnership-creator');
  await shop.type('[aria-label="Tìm KOL đã duyệt"]','Creator One');assert.equal((await shop.$$('.partnership-creator')).length,1);
  await shop.click('.partnership-creator');await shop.waitForFunction(()=>!document.querySelector('button[form="partnership-invite-form"]').disabled);assert.equal(await shop.$('#partnership-product'),null);assert.equal(await shop.$eval('#partnership-message',element=>element.value),'');
  await shop.screenshot({path:'.qa-artifacts/partnership/shop-compose-desktop.png',fullPage:true});
  await shop.setViewport({width:390,height:844});await shop.screenshot({path:'.qa-artifacts/partnership/shop-compose-mobile.png',fullPage:true});
  assert.equal(await shop.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth),false);
  await shop.click('button[form="partnership-invite-form"]');await shop.waitForFunction(()=>document.body.textContent.includes('Chưa lưu được lời mời kiểm thử.'));
  assert.equal(await shop.$eval('#partnership-message',element=>element.value),'');assert.equal(rows.length,0);
  failSend=false;await shop.click('button[form="partnership-invite-form"]');await shop.waitForSelector('.partnership-row');
  await shop.reload();await shop.waitForSelector('.partnership-row');assert.match(await shop.$eval('.partnership-row',element=>element.textContent),/Creator One/);
  assert.equal(writes[1].body.storeId,'store-1');assert.equal('productId' in writes[1].body,false);
  assert.equal(writes[1].body.message,'Chào bạn, shop mong muốn kết nối và trao đổi cơ hội hợp tác cùng bạn.');
  const kol=await setup('kol');await kol.goto(`${base}/collaborator/marketing?tab=invitations`);await kol.waitForSelector('.partnership-row');await kol.click('.partnership-row button');
  await kol.waitForSelector('.partnership-detail-footer .primary');await kol.screenshot({path:'.qa-artifacts/partnership/kol-review.png',fullPage:true});
  await kol.click('.partnership-detail-footer .primary');await kol.waitForFunction(()=>document.body.textContent.includes('Chưa tạo được liên kết kiểm thử.'));assert.equal(rows[0].status,'PENDING');
  failAccept=false;await kol.click('.partnership-detail-footer .primary');await kol.waitForFunction(()=>document.querySelector('.partnership-row .accepted'));
  await kol.reload();await kol.waitForSelector('.partnership-row .accepted');await kol.click('.partnership-row button');await kol.waitForSelector('.partnership-detail');assert.equal(await kol.$('.partnership-detail a[href="/collaborator/marketing?tab=links"]'),null);
  await shop.reload();await shop.waitForSelector('.partnership-row .accepted');
  await shop.screenshot({path:'.qa-artifacts/partnership/shop-accepted-mobile.png',fullPage:true});
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
});
