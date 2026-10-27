import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import puppeteer from 'puppeteer-core';
const base=process.env.GHN_UI_TEST_URL,executablePath=process.env.GHN_UI_BROWSER_PATH||'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
test('partner product creates persisted KOL links, retries the same token and generates QR for the saved channel',{
 skip:!base||!existsSync(executablePath),timeout:35000,
},async()=>{
 const origin=new URL(base).origin;assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
 const browser=await puppeteer.launch({executablePath,headless:true});const requests=[],errors=[];let fail=true;
 const page=await browser.newPage();page.setDefaultTimeout(8000);await page.setViewport({width:1440,height:1000});
 page.on('pageerror',error=>{if(error.message!=='WebSocket closed without opened.')errors.push(error.message)});
 await page.evaluateOnNewDocument(()=>{localStorage.clear();localStorage.setItem('token','partner-fixture-only');localStorage.setItem('user',JSON.stringify({id:'creator',role:'COLLABORATOR',fullName:'Creator fixture'}));});
 await page.setRequestInterception(true);
 page.on('request',request=>{void(async()=>{
  const url=new URL(request.url());
  const headers={'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Credentials':'true','Access-Control-Allow-Headers':request.headers()['access-control-request-headers']||'authorization,content-type','Access-Control-Allow-Methods':'GET,POST,OPTIONS'};
  const respond=(result,status=200)=>request.respond({status,headers,contentType:'application/json',body:JSON.stringify({code:status,result,...(status===503?{message:'Saved referral fixture temporarily unavailable'}:{})})});
  if(request.method()==='OPTIONS')return request.respond({status:204,headers});
  if(url.pathname==='/src/services/chat-socket.service.ts')return request.respond({contentType:'application/javascript',body:'const socket={on(){return this},off(){return this},emit(){},connect(){},connected:false};export const getChatSocket=()=>socket;export const isChatSocketEnabled=()=>false;export const isChatSocketAuthenticated=()=>false;export const disconnectChatSocket=()=>{};'});
  if(url.pathname.startsWith('/api/')){
   if(url.pathname.endsWith('/stores/marketplace'))return respond([{id:'store',name:'Partner fixture shop',slug:'fixture'}]);
   if(url.pathname.endsWith('/products'))return respond({items:[{id:'product',storeId:'store',title:'Partner fixture shirt',price:1000000,isActive:true,sku:'SHIRT',stockQuantity:10,moderationStatus:'APPROVED',variants:[]}]});
   if(url.pathname.endsWith('/collaborators/me'))return respond({collaboratorId:'kol',approvalStatus:'APPROVED',userId:'creator'});
   if(url.pathname.endsWith('/referrals')&&request.method()==='POST'){
    const input=JSON.parse(request.postData());requests.push(input);await new Promise(resolve=>setTimeout(resolve,120));
    if(fail)return respond(null,503);
    return respond({...input,referralLinkId:'saved-'+input.channel,collaboratorId:'kol'});
   }
   return respond([]);
  }
  if(url.pathname==='/__partner-link')return request.respond({contentType:'text/html; charset=utf-8',body:`<html><body><div id="root"></div><script type="module">
   import RefreshRuntime from '/@react-refresh';RefreshRuntime.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>type=>type;window.__vite_plugin_react_preamble_installed__=true;import '/src/index.css';
   const source=await(await fetch('/src/pages/collaborator/ShopCollaborationPage.tsx')).text(),main=await(await fetch('/src/main.tsx')).text();
   const React=await import(source.match(/[\"]([^\"]*deps.react[.]js[^\"]*)[\"]/)[1]),dom=await import(main.match(/[\"]([^\"]*react-dom_client[.]js[^\"]*)[\"]/)[1]);
   const {BrowserRouter}=await import(source.match(/[\"]([^\"]*react-router-dom[.]js[^\"]*)[\"]/)[1]);const {default:Page}=await import('/src/pages/collaborator/ShopCollaborationPage.tsx');
   const h=React.createElement||React.default.createElement;(dom.createRoot||dom.default.createRoot)(document.getElementById('root')).render(h(BrowserRouter,null,h(Page)));
  </script></body></html>`});
  if(url.origin!==origin&&!['data:','blob:'].includes(url.protocol))return request.abort();return request.continue();
 })().catch(error=>{errors.push(error.message);void request.abort().catch(()=>{});});});
 async function click(text){await page.evaluate(text=>[...document.querySelectorAll('button')].find(el=>el.textContent.trim()===text)?.click(),text)}
 try{
  await page.goto(origin+'/__partner-link?shop=store&tab=products');
  await page.waitForFunction(()=>[...document.querySelectorAll('button')].some(el=>el.textContent.trim()==='Lấy Link Tiếp Thị'));
  await click('Lấy Link Tiếp Thị');await page.waitForSelector('[role="alert"]');
  assert.equal(requests.length,1);assert.equal(requests[0].productId,'product');assert.equal(requests[0].channel,'TIKTOK');
  fail=false;await click('Thử lại');
  await page.waitForFunction(()=>[...document.querySelectorAll('input[readonly]')].some(input=>input.value.includes('/r/')));
  assert.equal(requests.length,2);assert.equal(requests[0].token,requests[1].token);
  let value=await page.$eval('input[readonly]',el=>el.value);assert.equal(new URL(value).pathname,'/r/'+requests[1].token);
  assert.equal(new URL(value).searchParams.get('ref'),null);
  await page.waitForSelector('img[alt="QR Code"]');await click('Facebook');
  await page.waitForFunction(()=>!document.querySelector('button[disabled] img')&&[...document.querySelectorAll('input[readonly]')].some(input=>input.value.includes('/r/')));
  await page.waitForFunction(()=>!!document.querySelector('img[alt="QR Code"]'));
  assert.equal(requests.length,3);assert.equal(requests[2].channel,'FACEBOOK');assert.notEqual(requests[1].token,requests[2].token);
  value=await page.$eval('input[readonly]',el=>el.value);assert.equal(new URL(value).pathname,'/r/'+requests[2].token);
  await page.screenshot({path:'../.run-logs/partner-referral-saved.png',fullPage:true});
  await page.click('button[aria-label="Đóng tạo liên kết tiếp thị"]');await click('Lấy Link Tiếp Thị');
  await page.waitForSelector('img[alt="QR Code"]');assert.equal(requests.length,3,'Reopening saved product/channel reuses its persisted link');
  assert.deepEqual(errors,[]);
 }catch(error){console.error('Partner link fixture',errors,await page.evaluate(()=>document.body.innerText.slice(-1300)));throw error;}finally{await browser.close();}
});
