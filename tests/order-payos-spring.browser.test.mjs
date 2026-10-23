import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import puppeteer from 'puppeteer-core';
const base=process.env.GHN_UI_TEST_URL,executablePath=process.env.GHN_UI_BROWSER_PATH;
test('unpaid order opens Spring PayOS, ignores URL success and waits for order sync before leaving QR',{
 skip:!base||!executablePath||!existsSync(executablePath),timeout:35000,
},async()=>{
 const origin=new URL(base).origin;assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
 const browser=await puppeteer.launch({executablePath,headless:true});
 let phase='PROCESSING';const creates=[],legacy=[],errors=[];
 try{
  const page=await browser.newPage();page.setDefaultTimeout(12000);
  page.on('pageerror',error=>{if(!error.message.includes('WebSocket closed without opened'))errors.push(error.message)});
  await page.evaluateOnNewDocument(()=>{localStorage.clear();sessionStorage.clear();localStorage.setItem('token','payos-order-fixture');localStorage.setItem('user',JSON.stringify({id:'buyer',role:'CUSTOMER',fullName:'Buyer'}));});
  await page.setRequestInterception(true);
  page.on('request',request=>{
   const url=new URL(request.url());
   if(url.pathname.startsWith('/api/')){
    const headers={'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Credentials':'true','Access-Control-Allow-Headers':request.headers()['access-control-request-headers']||'authorization,content-type','Access-Control-Allow-Methods':'GET,POST,OPTIONS'};
    if(request.method()==='OPTIONS')return request.respond({status:204,headers});
    let result=[];
    if(url.pathname.includes('/orders/payos/'))legacy.push(url.pathname);
    if(url.pathname.endsWith('/finance/payments')&&request.method()==='POST')creates.push(JSON.parse(request.postData()));
    if(url.pathname.endsWith('/finance/payments')||url.pathname.endsWith('/finance/payments/payment-a'))result={paymentId:'payment-a',orderId:'order-a',purpose:'ORDER',amountVnd:299000,status:phase==='PROCESSING'?'PROCESSING':'SUCCESS',orderSyncStatus:phase==='PROCESSING'?null:phase==='SYNCING'?'PENDING':'SYNCED',qrCode:'TEST-QR',checkoutUrl:'https://pay.payos.vn/web/test'};
    if(url.pathname.endsWith('/users/me'))result={userId:'buyer',fullName:'Buyer',roles:['USER'],status:'ACTIVE'};
    return request.respond({status:200,headers,contentType:'application/json',body:JSON.stringify({code:200,result})});
   }
   if(url.origin!==origin&&!['data:','blob:'].includes(url.protocol))return request.abort();return request.continue();
  });
  await page.goto(origin+'/payment/payos-return?order=order-a&status=PAID');
  await page.waitForSelector('img[alt="Mã VietQR cho đơn order-a"]');
  assert.match(await page.$eval('body',node=>node.textContent),/299[.,]000/);assert.equal(creates.length,1);assert.equal(creates[0].orderId,'order-a');assert.ok(creates[0].idempotencyKey);
  assert.equal(new URL(page.url()).pathname,'/payment/payos-return');
  phase='SYNCING';await page.waitForFunction(()=>document.body.textContent.includes('Đã nhận tiền, đang đồng bộ'));
  assert.equal(await page.$('img[alt="Mã VietQR cho đơn order-a"]'),null,'Do not offer the QR again after verified funds have arrived');
  phase='SYNCED';await page.waitForFunction(()=>location.pathname==='/customer/orders');
  assert.equal(creates.length,1);assert.deepEqual(legacy,[]);assert.deepEqual(errors,[]);
 }finally{await browser.close();}
});
