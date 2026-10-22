import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import puppeteer from 'puppeteer-core';
const base=process.env.GHN_UI_TEST_URL, executablePath=process.env.GHN_UI_BROWSER_PATH;
test('shop receipt queue separates arrived parcels, retries failures and waits for the wallet acknowledgement', {
  skip:!base||!executablePath||!existsSync(executablePath),timeout:40000,
},async()=>{
  const origin=new URL(base).origin;assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
  const browser=await puppeteer.launch({executablePath,headless:true});
  const now=new Date().toISOString(),errors=[],writes=[];
  const row=(id,delivered)=>({returnRequestId:id,orderId:'original-completed-order',orderItemId:'item-'+id,sellerOrderId:'seller',storeId:'store-a',storeName:'Fixture shop',customerName:'Fixture buyer',productName:'Shirt '+id,quantity:1,refundAmountVnd:269000,status:'RETURNING',reason:'WRONG_ITEM',evidenceRefs:{},shopResponse:{response:'Shop statement',imageUrls:[],submittedAt:now},requestedAt:now,
    logistics:{environment:'TEST',trackingCode:'SIM-'+id,status:delivered?'DELIVERED':'PICKED',pickedUpAt:now,...(delivered?{deliveredAt:now}:{})}});
  const rows=[row('arrived',true),row('in-transit',false)];let fail=true,page;
  try{
    page=await browser.newPage();page.setDefaultTimeout(10000);
    page.on('pageerror',error=>{if(!error.message.includes('WebSocket closed without opened'))errors.push(error.message)});
    await page.evaluateOnNewDocument(()=>{localStorage.clear();localStorage.setItem('token','receipt-fixture-no-server-access');localStorage.setItem('user',JSON.stringify({id:'owner',role:'SHOP_MANAGER',roles:['SHOP_OWNER'],fullName:'Fixture owner',stores:[{id:'store-a',name:'Fixture shop',isActive:true,onboardingStatus:'APPROVED'}]}));localStorage.setItem('current_store_id','store-a');localStorage.setItem('scanms-active-workspace','shop');localStorage.setItem('scanms-current-role','shop');});
    await page.setRequestInterception(true);
    page.on('request',request=>{
      const url=new URL(request.url());
      const headers={'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Credentials':'true','Access-Control-Allow-Headers':request.headers()['access-control-request-headers']||'content-type,authorization,x-skip-cache','Access-Control-Allow-Methods':'GET,POST,OPTIONS'};
      const respond=(result,status=200)=>request.respond({status,headers,contentType:'application/json',body:JSON.stringify({code:status,result,...(status===503?{message:'Receipt fixture temporarily unavailable'}:{})})});
      if(request.method()==='OPTIONS')return request.respond({status:204,headers});
      if(url.pathname==='/src/services/chat-socket.service.ts')return request.respond({contentType:'application/javascript',body:'const s={connected:false,active:false,on(){return this},off(){return this},emit(){},connect(){return this}};export const getChatSocket=()=>s;export const isChatSocketEnabled=()=>false;export const isChatSocketAuthenticated=()=>false;export const disconnectChatSocket=()=>{};'});
      if(url.pathname.startsWith('/api/')){
        if(url.pathname.endsWith('/users/me'))return respond({userId:'owner',roles:['SHOP_OWNER'],fullName:'Fixture owner',status:'ACTIVE'});
        if(url.pathname.endsWith('/stores/mine'))return respond([{storeId:'store-a',name:'Fixture shop'}]);
        if(url.pathname.endsWith('/returns/shop'))return respond(rows.map(({logistics,...row})=>row));
        const detail=url.pathname.match(/\/commerce\/returns\/([^/]+)$/)?.[1];
        if(detail)return respond(rows.find(row=>row.returnRequestId===detail));
        if(url.pathname.endsWith('/commerce/returns/arrived/receipt')){
          writes.push(url.pathname);
          if(fail)return respond(null,503);
          rows[0].status='REFUND_PENDING';rows[0].logistics.receivedAt=now;
          return new Promise(resolve=>setTimeout(()=>resolve(respond(rows[0])),150));
        }
        return respond([]);
      }
      if(url.origin!==origin&&!['data:','blob:'].includes(url.protocol))return request.abort();return request.continue();
    });
    await page.goto(origin+'/merchant/returns',{waitUntil:'domcontentloaded'});
    await page.waitForSelector('[aria-label="Nhận hàng trả"] button');
    const filter=label=>page.evaluate(label=>[...document.querySelectorAll('[aria-label="Lọc yêu cầu đổi trả"] button')].find(button=>button.textContent===label).click(),label);
    await filter('Đang trả về');
    assert.equal(await page.$$eval('[aria-label="Danh sách yêu cầu"]>button',nodes=>nodes.length),1);
    assert.equal(await page.$('[aria-label="Nhận hàng trả"] button'),null,'A simulated parcel still in transit cannot be received');
    await filter('Chờ nhận hàng trả');
    assert.equal(await page.$$eval('[aria-label="Danh sách yêu cầu"]>button',nodes=>nodes.length),1);
    await page.click('[aria-label="Nhận hàng trả"] button');
    await page.waitForFunction(()=>document.querySelector('[aria-label="Nhận hàng trả"] [role="alert"]'));
    assert.equal(rows[0].status,'RETURNING');assert.equal(writes.length,1);
    fail=false;
    await page.$eval('[aria-label="Nhận hàng trả"] button',button=>{button.click();button.click();});
    await page.waitForFunction(()=>!document.querySelector('[aria-label="Nhận hàng trả"]'));
    assert.equal(writes.length,2,'Double clicking must cause only one receipt retry');
    await filter('Hoàn tiền');
    await page.waitForSelector('[aria-label="Chi tiết yêu cầu"]');
    const details=await page.$eval('[aria-label="Chi tiết yêu cầu"]',node=>node.innerText);
    assert.match(details,/Chờ hoàn tiền/);assert.doesNotMatch(details,/Đã hoàn tiền/);
    assert.deepEqual(errors,[]);
  }catch(error){console.error('Shop receipt fixture:',errors,await page?.evaluate(()=>document.body.innerText.slice(-1300)));throw error;}finally{await browser.close();}
});
