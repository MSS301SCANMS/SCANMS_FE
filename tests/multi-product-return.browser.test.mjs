import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import puppeteer from 'puppeteer-core';
const base=process.env.GHN_UI_TEST_URL;
const executablePath=process.env.GHN_UI_BROWSER_PATH||'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

test('return checkboxes submit one or both items with per-item quantities and safely resume a partial failure',{
 skip:!base||!existsSync(executablePath),timeout:60000,
},async()=>{
 const origin=new URL(base).origin;assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
 const browser=await puppeteer.launch({executablePath,headless:true});
 const order={id:'order-fixture',externalOrderSn:'RETURN-TEST',deliveredAt:new Date().toISOString(),orderItems:[
  {id:'item-a',productId:'product-a',quantity:1,returnableQuantity:1,product:{title:'Áo sơ mi'}},
  {id:'item-b',productId:'product-b',quantity:3,returnableQuantity:3,product:{title:'Chân váy'}},
  {id:'item-used',productId:'used',quantity:1,returnableQuantity:0,product:{title:'Sản phẩm đã trả'}},
 ]};
 async function fixture(partial){
  const page=await browser.newPage(),requests=[],errors=[];page.on('pageerror',e=>{if(e.message!=='WebSocket closed without opened.')errors.push(e.message)});let rejectSecond=partial;
  await page.setRequestInterception(true);
  page.on('request',r=>{
   const url=new URL(r.url());
   if(url.pathname==='/src/services/customer.service.ts')return r.respond({contentType:'application/javascript',body:`export const customerService={async createReturnRequest(orderId,input){const r=await fetch('/__return-request',{method:'POST',body:JSON.stringify({orderId,...input})});const d=await r.json();if(!r.ok)throw Error(d.message);return d;}};`});
   if(url.pathname==='/src/services/upload.service.ts')return r.respond({contentType:'application/javascript',body:`export const uploadService={async uploadImage(){window.imageUploads=(window.imageUploads||0)+1;return 'https://fixture.test/proof.png';},async uploadVideo(){window.videoUploads=(window.videoUploads||0)+1;return 'https://fixture.test/proof.mp4';}};`});
   if(url.pathname==='/__return-request'){
    const input=JSON.parse(r.postData());requests.push(input);
    if(input.orderItemId==='item-b'&&rejectSecond){rejectSecond=false;return r.respond({status:503,contentType:'application/json',body:JSON.stringify({message:'Fixture connection failed'})});}
    return r.respond({contentType:'application/json',body:JSON.stringify({returnRequest:{id:'return-'+input.orderItemId,...input}})});
   }
   if(url.pathname==='/__return-modal')return r.respond({contentType:'text/html; charset=utf-8',body:`<html><body><div id="root"></div><script type="module">
    import RefreshRuntime from '/@react-refresh';RefreshRuntime.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>type=>type;window.__vite_plugin_react_preamble_installed__=true;import '/src/index.css';
    const source=await(await fetch('/src/components/customer/ReturnRequestModal.tsx')).text(),main=await(await fetch('/src/main.tsx')).text();
    const React=await import(source.match(/[\"]([^\"]*deps.react[.]js[^\"]*)[\"]/)[1]);const dom=await import(main.match(/[\"]([^\"]*react-dom_client[.]js[^\"]*)[\"]/)[1]);
    const {ReturnRequestModal}=await import('/src/components/customer/ReturnRequestModal.tsx');const h=React.createElement||React.default.createElement;
    (dom.createRoot||dom.default.createRoot)(document.getElementById('root')).render(h(ReturnRequestModal,{order:${JSON.stringify(order)},onClose:()=>{window.closed=true},onSubmitted:r=>{window.submitted=(window.submitted||[]).concat(r)}}));
   </script></body></html>`});
   if(url.origin!==origin&&!['data:','blob:'].includes(url.protocol))return r.abort();
   if(url.pathname.startsWith('/api/'))return r.abort();return r.continue();
  });
  await page.goto(origin+'/__return-modal',{waitUntil:'domcontentloaded'});await page.waitForSelector('input[aria-label="Trả Áo sơ mi"]');
  return{page,requests,errors};
 }
 async function evidence(page){
  await page.$$eval('input[type="file"]',els=>els.forEach(el=>{const video=el.accept.includes('video');const dt=new DataTransfer();dt.items.add(new File(['fixture'],video?'unbox.mp4':'proof.png',{type:video?'video/mp4':'image/png'}));el.files=dt.files;el.dispatchEvent(new Event('change',{bubbles:true}));}));
 }
 try{
  const one=await fixture(false);const p=one.page;
  assert.equal(await p.$$('input[type="checkbox"]').then(x=>x.length),3,'Only eligible items plus select-all are shown');
  assert.equal(await p.$eval('input[type="checkbox"]',e=>e.indeterminate),true);
  await p.click('input[aria-label="Trả Áo sơ mi"]');assert.equal(await p.$eval('button[type="submit"]',e=>e.disabled),true);
  await p.click('input[aria-label="Trả Chân váy"]');
  // Use keyboard input to exercise React's controlled number field.
  await p.click('input[aria-label="Số lượng trả Chân váy"]',{clickCount:3});await p.keyboard.press('Backspace');await p.keyboard.type('4');await evidence(p);
  await p.click('button[type="submit"]');assert.equal(one.requests.length,0,'Cannot exceed returnable quantity');
  await p.click('input[aria-label="Số lượng trả Chân váy"]',{clickCount:3});await p.keyboard.press('Backspace');await p.keyboard.type('2');await p.click('button[type="submit"]');await p.waitForFunction(()=>window.submitted?.length===1);
  assert.equal(one.requests.length,1);assert.equal(one.requests[0].orderItemId,'item-b');assert.equal(one.requests[0].quantity,2);assert.deepEqual(one.errors,[]);await p.close();

  const both=await fixture(true);await both.page.click('input[type="checkbox"]');await evidence(both.page);await both.page.click('button[type="submit"]');
  await both.page.waitForFunction(()=>[...document.querySelectorAll('[role="status"]')].some(e=>e.textContent.includes('Đã gửi 1/2')));
  assert.equal(both.requests.length,2);assert.equal(await both.page.$eval('input[aria-label="Trả Áo sơ mi"]',e=>e.matches(':disabled')),true);
  const retryKey=both.requests[1].idempotencyKey;assert.notEqual(both.requests[0].idempotencyKey,retryKey);
  await both.page.click('button[type="submit"]');await both.page.waitForFunction(()=>window.submitted?.length===1);
  assert.deepEqual(both.requests.map(r=>r.orderItemId),['item-a','item-b','item-b']);assert.equal(both.requests[2].idempotencyKey,retryKey);
  assert.equal(await both.page.evaluate(()=>window.imageUploads),1);assert.equal(await both.page.evaluate(()=>window.videoUploads),1);
  assert.deepEqual(both.requests[0].imageUrls,both.requests[2].imageUrls);assert.deepEqual(both.errors,[]);
 }finally{await browser.close();}
});
