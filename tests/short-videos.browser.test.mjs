import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,mkdirSync,writeFileSync} from 'node:fs';
import puppeteer from 'puppeteer-core';
const base=process.env.GHN_UI_TEST_URL,executablePath=process.env.GHN_UI_BROWSER_PATH;
test('short video feed retries, records only an actual product click, and keeps attribution through product navigation',{
 skip:!base||!executablePath||!existsSync(executablePath),timeout:45000,
},async()=>{
 const origin=new URL(base).origin;assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
 const browser=await puppeteer.launch({executablePath,headless:true});const clicks=[],errors=[];let fail=true;
 try{
  const page=await browser.newPage();page.setDefaultTimeout(10000);await page.setViewport({width:1440,height:1000});
  page.on('pageerror',e=>{if(!e.message.includes('WebSocket closed'))errors.push(e.message);});
  await page.evaluateOnNewDocument(()=>{localStorage.clear();});
  await page.setRequestInterception(true);page.on('request',request=>{
   const url=new URL(request.url());
   const headers={'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Credentials':'true','Access-Control-Allow-Headers':request.headers()['access-control-request-headers']||'content-type','Access-Control-Allow-Methods':'GET,POST,OPTIONS'};
   const respond=(result,status=200)=>request.respond({status,headers,contentType:'application/json',body:JSON.stringify({code:status,result,message:status===503?'Video service unavailable':undefined})});
   if(request.method()==='OPTIONS')return request.respond({status:204,headers});
   if(url.pathname.startsWith('/api/')){
    if(url.pathname.endsWith('/public/short-videos'))return respond(fail?null:{items:[{id:'video-one',collaboratorId:'kol-one',creatorName:'Creator fixture',title:'Cotton shirt review',videoUrl:origin+'/fixture-no-video.mp4',posterUrl:origin+'/assets/placeholder-product.svg',status:'PUBLISHED',products:[{productId:'shirt',referralLinkId:'ref-shirt',name:'Cotton test shirt',priceVnd:270000,imageUrl:origin+'/assets/placeholder-product.svg'},{productId:'skirt',referralLinkId:'ref-skirt',name:'Cotton test skirt',priceVnd:300000,imageUrl:null}]}],nextPage:null},fail?503:200);
    if(url.pathname.endsWith('/referrals/clicks')){clicks.push(JSON.parse(request.postData()));return respond({clickId:'server-click',referralLinkId:'ref-shirt',expiresAt:new Date(Date.now()+86400000).toISOString()});}
    if(url.pathname.endsWith('/landing'))return respond({product:{id:'shirt',title:'Cotton test shirt',price:270000,isActive:true,canPurchase:true,status:'ACTIVE',stockQuantity:10,variants:[],store:{id:'shop',name:'Test shop'}},store:{id:'shop',name:'Test shop'},images:[],videos:[],availability:{stockQuantity:10,inStock:true},reviews:{averageRating:0,totalReviews:0,items:[],starDistribution:{}}});
    return respond([]);
   }
   if(url.pathname==='/fixture-no-video.mp4')return request.respond({status:404,body:''});
   if(url.origin!==origin&&!['data:','blob:'].includes(url.protocol))return request.abort();
   return request.continue();
  });
  await page.goto(origin+'/shorts',{waitUntil:'domcontentloaded'});await page.waitForSelector('[role="alert"]');
  fail=false;await page.evaluate(()=>[...document.querySelectorAll('button')].find(b=>b.textContent==='Thử lại').click());
  await page.waitForSelector('.short-card');assert.equal(clicks.length,0,'watching alone must not earn a commission');
  assert.equal(await page.$$eval('.short-products button',n=>n.length),2);
  await page.setViewport({width:390,height:844});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true,'mobile layout must fit');
  mkdirSync('../.validation/short-video-ui',{recursive:true});await page.screenshot({path:'../.validation/short-video-ui/feed-mobile.png'});
  await page.click('.short-products button');await page.waitForFunction(()=>location.pathname==='/products/shirt');
  assert.deepEqual(clicks,[{productId:'shirt',referralLinkId:'ref-shirt',shortVideoId:'video-one'}]);
  const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('scanms-product-referral:shirt')));
  assert.equal(stored.clickId,'server-click');assert.equal(stored.referralId,'ref-shirt');
  assert.equal(await page.evaluate(()=>localStorage.getItem('scanms-product-referral:skirt')),null);
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
});
test('approved KOL studio offers partnered products, publishes linked media and can hide its video',{
 skip:!base||!executablePath||!existsSync(executablePath),timeout:45000,
},async()=>{
 const origin=new URL(base).origin,browser=await puppeteer.launch({executablePath,headless:true});const published=[],errors=[];let uploadFails=true;
 const video={id:'studio-video',creatorName:'Creator fixture',title:'Studio video',videoUrl:origin+'/fixture-no-video.mp4',status:'PUBLISHED',products:[{productId:'shirt',name:'Partnered shirt',referralLinkId:'ref-shirt',priceVnd:270000}]};
 try{
  const page=await browser.newPage();page.setDefaultTimeout(10000);await page.setViewport({width:1440,height:1100});
  page.on('pageerror',e=>{if(!e.message.includes('WebSocket closed'))errors.push(e.message);});
  await page.evaluateOnNewDocument(()=>{localStorage.clear();localStorage.setItem('token','fixture-kol');localStorage.setItem('user',JSON.stringify({id:'creator',fullName:'Creator fixture',role:'COLLABORATOR',roles:['KOL_CTV']}));localStorage.setItem('scanms-current-role','kol');localStorage.setItem('scanms-active-workspace','kol');});
  await page.setRequestInterception(true);page.on('request',request=>{
   const url=new URL(request.url()),headers={'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Credentials':'true','Access-Control-Allow-Headers':request.headers()['access-control-request-headers']||'content-type,authorization','Access-Control-Allow-Methods':'GET,POST,DELETE,OPTIONS'};
   const respond=(result,status=200,message)=>request.respond({status,headers,contentType:'application/json',body:JSON.stringify({code:status,result,message})});
   if(request.method()==='OPTIONS')return request.respond({status:204,headers});
   if(url.pathname.startsWith('/api/')){
    if(url.pathname.endsWith('/users'))return respond({userId:'creator',fullName:'Creator fixture',roles:['KOL_CTV'],status:'ACTIVE'});
    if(url.pathname.endsWith('/short-videos/mine'))return respond({items:[],nextPage:null});
    if(url.pathname.endsWith('/public/products'))return respond([{productId:'shirt',name:'Partnered shirt',storeId:'shop-a',storeName:'Partner A',priceVnd:270000,status:'ACTIVE'},{productId:'skirt',name:'Partnered skirt',storeId:'shop-b',storeName:'Partner B',priceVnd:300000,status:'ACTIVE'},{productId:'unrelated',name:'Unrelated product',storeId:'shop-c',status:'ACTIVE'}]);
    if(url.pathname.endsWith('/referrals/invitations/mine'))return respond([{id:'invite-a',storeId:'shop-a',status:'ACCEPTED'},{id:'invite-b',storeId:'shop-b',status:'ACCEPTED'},{id:'invite-c',storeId:'shop-c',status:'PENDING'}]);
    if(url.pathname.endsWith('/upload/short-video'))return respond(uploadFails?null:{publicId:'scanms/short-videos/creator/asset',secureUrl:origin+'/fixture-no-video.mp4'},uploadFails?503:200,uploadFails?'Upload unavailable':undefined);
    if(url.pathname.endsWith('/referrals')&&request.method()==='POST')return respond({referralLinkId:'ref-shirt',productId:'shirt',token:'short-token',status:'ACTIVE'});
    if(url.pathname.endsWith('/short-videos')&&request.method()==='POST'){published.push(JSON.parse(request.postData()));return respond(video);}
    if(url.pathname.endsWith('/short-videos/studio-video')&&request.method()==='DELETE')return respond(true);
    return respond([]);
   }
   if(url.pathname==='/fixture-no-video.mp4')return request.respond({status:404,body:''});
   if(url.origin!==origin&&!['data:','blob:'].includes(url.protocol))return request.abort();return request.continue();
  });
  await page.goto(origin+'/collaborator/short-videos',{waitUntil:'domcontentloaded'});await page.waitForSelector('fieldset input[type="checkbox"]');
  assert.equal(await page.$$eval('fieldset input[type="checkbox"]',n=>n.length),2);assert.equal(await page.evaluate(()=>document.body.textContent.includes('Unrelated product')),false);
  await page.type('#short-video-form input:not([type="file"]):not([type="checkbox"])','Studio video');await page.type('#short-video-form textarea','An actual product review');await page.click('fieldset input[type="checkbox"]');
  assert.equal(await page.$$eval('fieldset input[type="checkbox"]',n=>n[1].disabled),true,'one video must not mix shops');
  mkdirSync('../.validation/short-video-ui',{recursive:true});const file='../.validation/short-video-ui/fixture.mp4';writeFileSync(file,Buffer.from([0,0,0,24,102,116,121,112]));
  const input=await page.$('#short-video-form input[type="file"]');await input.uploadFile(file);await page.click('#short-video-form > button');
  await page.waitForSelector('[role="alert"]');assert.equal(published.length,0,'upload failure must never persist a blob URL');
  uploadFails=false;await page.evaluate(()=>[...document.querySelectorAll('#short-video-form button')].find(b=>b.textContent==='Đăng video').click());
  await page.waitForFunction(()=>document.body.textContent.includes('Video đã được đăng công khai.'));
  assert.equal(published.length,1);assert.deepEqual(published[0].products,[{productId:'shirt',referralLinkId:'ref-shirt'}]);assert.equal(published[0].publicId,'scanms/short-videos/creator/asset');assert.ok(!JSON.stringify(published).includes('blob:'));
  await page.screenshot({path:'../.validation/short-video-ui/studio-desktop.png',fullPage:true});
  await page.evaluate(()=>[...document.querySelectorAll('button')].find(b=>b.textContent==='Ẩn video').click());await page.waitForFunction(()=>document.body.textContent.includes('Đã ẩn'));
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
});
