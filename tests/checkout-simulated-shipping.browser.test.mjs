import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import puppeteer from 'puppeteer-core';
const base=process.env.GHN_UI_TEST_URL;
const executablePath=process.env.GHN_UI_BROWSER_PATH||'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
test('simulated shipping shows its payer and fee, blocks failed quotes and includes the fee in a wallet checkout',{
 skip:!base||!existsSync(executablePath),timeout:40000,
},async()=>{
 const origin=new URL(base).origin;assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
 const browser=await puppeteer.launch({executablePath,headless:true});
 const productId='00000000-0000-4000-8000-000000000001',variantId='00000000-0000-4000-8000-000000000002',storeId='00000000-0000-4000-8000-000000000003';
 const address={id:'saved',fullName:'Shipping test buyer',phoneNumber:'0901234567',detailAddress:'123 Test street',provinceCode:'1',districtCode:'2',wardCode:'3',provinceName:'Province',districtName:'District',wardName:'Ward',isDefault:true};
 let failQuote=true;const creates=[],payments=[],errors=[];let page;
 try{
  page=await browser.newPage();page.on('pageerror',e=>{if(!e.message.includes('WebSocket closed without opened'))errors.push(e.message)});
  await page.evaluateOnNewDocument(()=>{localStorage.clear();localStorage.setItem('token','shipping-fixture-no-server-access');localStorage.setItem('user',JSON.stringify({id:'shipping-buyer',role:'CUSTOMER',fullName:'Shipping test buyer'}));});
  await page.setRequestInterception(true);
  page.on('request',request=>{
   const url=new URL(request.url());
   const headers={'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Credentials':'true','Access-Control-Allow-Headers':request.headers()['access-control-request-headers']||'content-type,authorization,x-skip-cache','Access-Control-Allow-Methods':'GET,POST,PUT,OPTIONS'};
   const respond=(result,status=200)=>request.respond({status,headers,contentType:'application/json',body:JSON.stringify({code:status,result,...(status!==200?{message:'Kết nối xác thực báo giá chưa sẵn sàng.'}:{})})});
   if(request.method()==='OPTIONS')return request.respond({status:204,headers});
   if(url.pathname==='/src/services/chat-socket.service.ts')return request.respond({contentType:'application/javascript',body:'const s={connected:false,active:false,on(){return this},off(){return this},emit(){},connect(){return this}};export const getChatSocket=()=>s;export const isChatSocketEnabled=()=>false;export const isChatSocketAuthenticated=()=>false;export const disconnectChatSocket=()=>{};'});
   if(url.hostname==='provinces.open-api.vn')return request.respond({contentType:'application/json',headers,body:JSON.stringify([{code:1,name:'Province',districts:[{code:2,name:'District',wards:[{code:3,name:'Ward'}]}]}])});
   if(url.pathname.startsWith('/api/')){
    if(url.pathname.endsWith('/users'))return respond({userId:'shipping-buyer',fullName:'Shipping test buyer',roles:['USER'],address:JSON.stringify([address])});
    if(url.pathname.includes('/stores/public/id/'))return respond({id:storeId,name:'Test shop',policyReturn:'Return test policy',policyShipping:'Simulated delivery'});
    if(url.pathname.endsWith('/checkout/quote'))return respond({shippingFeeVnd:30000,shippingMode:'SIMULATED',shippingPayer:'CUSTOMER',finalAmount:299000},failQuote?503:200);
    if(url.pathname.endsWith('/checkout')){const data=JSON.parse(request.postData());creates.push(data);return respond({orderId:'shipping-order',publicOrderCode:'shipping-order',finalAmount:299000,shippingFeeVnd:30000,shippingMode:'SIMULATED',paymentMethod:'WALLET',paymentStatus:'UNPAID',orders:[{publicOrderCode:'shipping-order',storeId,storeName:'Test shop',finalAmount:299000}]});}
    if(url.pathname.endsWith('/capabilities'))return respond({paymentAvailable:false});
    if(url.pathname.endsWith('/wallet-payments')){payments.push(JSON.parse(request.postData()));return respond({paymentId:'shipping-payment',status:'SUCCESS',amountVnd:299000});}
    if(url.pathname.endsWith('/wallets/me'))return respond({walletId:'shipping-wallet',availableBalanceVnd:1000000,heldBalanceVnd:0,status:'ACTIVE'});
    if(url.pathname.endsWith('/landing'))return respond({product:{id:productId,title:'Test shirt',price:269000,canPurchase:true,stockQuantity:10,variants:[{id:variantId,price:269000,isActive:true,stockQuantity:10}]}});
    return respond([]);
   }
   if(url.pathname==='/__shipping-checkout-test')return request.respond({contentType:'text/html; charset=utf-8',body:`<html><body><div id="root"></div><script type="module">
    import RefreshRuntime from '/@react-refresh';RefreshRuntime.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>type=>type;window.__vite_plugin_react_preamble_installed__=true;import '/src/index.css';
    const source=await(await fetch('/src/components/checkout/GuestCheckoutModal.tsx')).text();const main=await(await fetch('/src/main.tsx')).text();
    const React=await import(source.match(/["]([^"]*deps.react[.]js[^"]*)["]/)[1]);const dom=await import(main.match(/["]([^"]*react-dom_client[.]js[^"]*)["]/)[1]);const {BrowserRouter}=await import(source.match(/["]([^"]*react-router-dom[.]js[^"]*)["]/)[1]);
    const {CartProvider}=await import(source.match(/["]([^"]*CartContext[.]tsx[^"]*)["]/)[1]);const {ScanmsChatProvider}=await import(source.match(/["]([^"]*ScanmsChatContext[.]tsx[^"]*)["]/)[1]);const {GuestCheckoutModal}=await import('/src/components/checkout/GuestCheckoutModal.tsx');
    const h=React.createElement||React.default.createElement;(dom.createRoot||dom.default.createRoot)(document.getElementById('root')).render(h(BrowserRouter,null,h(CartProvider,null,h(ScanmsChatProvider,null,h(GuestCheckoutModal,{isOpen:true,onClose:()=>{window.checkoutClosed=true},onOrderPlaced:order=>{window.placed=order},initialVariantId:'${variantId}',product:{id:'${productId}',title:'Test shirt',price:269000,stockQuantity:10},store:{id:'${storeId}',name:'Test shop'}})))));
   </script></body></html>`});
   if(url.origin!==origin&&!['data:','blob:'].includes(url.protocol))return request.abort();return request.continue();
  });
  await page.goto(origin+'/__shipping-checkout-test',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.body.innerText.includes('Kết nối xác thực báo giá chưa sẵn sàng.'));
  await page.click('input[value="WALLET"]');await page.$eval('button.checkout-submit',e=>e.click());assert.equal(creates.length,0);
  failQuote=false;await page.evaluate(()=>[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Tính lại').click());
  await page.waitForFunction(()=>document.querySelector('[role="note"]')?.textContent.includes('Phí giao hàng mô phỏng'));
  const note=await page.$eval('[role="note"]',e=>e.textContent);assert.match(note,/30\.000/);assert.match(note,/Khách thanh toán cùng tiền hàng/);
  assert.match(await page.$eval('.checkout-total-final',e=>e.textContent),/299\.000/);
  await page.$eval('button.checkout-submit',e=>e.click());await page.waitForFunction(()=>window.placed);
  assert.equal(creates.length,1);assert.equal(creates[0].expectedShippingFeeVnd,30000);assert.equal(creates[0].paymentMethod,'WALLET');
  assert.equal(payments.length,1);assert.equal(payments[0].orderId,'shipping-order');assert.equal(payments[0].amountVnd,undefined,'Payment must read total from order, not trust a browser amount');
  assert.equal(await page.evaluate(()=>window.placed.totalAmount),299000);assert.deepEqual(errors,[]);
 }catch(error){console.error('Shipping fixture:',errors,await page?.evaluate(()=>document.body.innerText.slice(-1600)));throw error;}finally{await browser.close();}
});
