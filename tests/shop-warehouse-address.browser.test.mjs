import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import puppeteer from 'puppeteer-core';
const base=process.env.GHN_UI_TEST_URL;
const executablePath=process.env.GHN_UI_BROWSER_PATH||'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
test('shop saves new two-level warehouse addresses, reloads server values and still accepts old addresses',{
 skip:!base||!existsSync(executablePath),timeout:40000,
},async()=>{
 const origin=new URL(base).origin;assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
 const browser=await puppeteer.launch({executablePath,headless:true});
 const old='100/31 Bình Giã, Phường 8, Thành phố Vũng Tàu, Bà Rịa - Vũng Tàu';
 const current='100/31 Bình Giã, phường Tam Thắng, Thành phố Hồ Chí Minh';
 const store={storeId:'warehouse-fixture',name:'Warehouse test shop',approvalStatus:'APPROVED',logoRef:'/favicon.ico'};
 let owner={representativeName:'Test owner',businessType:'INDIVIDUAL',taxCode:'TEST-ONLY',contactPhone:'0901234567',contactEmail:'owner@example.test',businessAddress:'',warehouseAddress:old,returnWarehouseAddress:old};
 const writes=[],errors=[];
 let page;
 try{
  page=await browser.newPage();page.on('pageerror',e=>{if(!e.message.includes('WebSocket closed without opened'))errors.push(e.message)});
  await page.evaluateOnNewDocument(()=>{
   localStorage.clear();localStorage.setItem('token','warehouse-fixture-no-server-access');localStorage.setItem('user',JSON.stringify({id:'warehouse-owner',role:'SHOP_MANAGER',fullName:'Test owner',stores:[{id:'warehouse-fixture',isActive:true,onboardingStatus:'APPROVED'}]}));localStorage.setItem('current_store_id','warehouse-fixture');localStorage.setItem('scanms-active-workspace','shop');
  });
  await page.setRequestInterception(true);
  page.on('request',request=>{
   const url=new URL(request.url());
   if(url.pathname==='/src/services/chat-socket.service.ts')return request.respond({contentType:'application/javascript',body:'const s={connected:false,active:false,on(){return this},off(){return this},emit(){},connect(){return this}};export const getChatSocket=()=>s;export const isChatSocketEnabled=()=>false;export const isChatSocketAuthenticated=()=>false;export const disconnectChatSocket=()=>{};'});
   if(url.pathname.startsWith('/api/')){
    const headers={'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Credentials':'true','Access-Control-Allow-Headers':request.headers()['access-control-request-headers']||'content-type,authorization,x-skip-cache','Access-Control-Allow-Methods':'GET,POST,PUT,PATCH,OPTIONS'};
    if(request.method()==='OPTIONS')return request.respond({status:204,headers});
    let result=[];
    if(url.pathname.endsWith('/stores/mine'))result=[store];
    if(url.pathname.endsWith('/stores/warehouse-fixture'))result=store;
    if(url.pathname.endsWith('/owner-details')){
     if(request.method()==='PUT'){owner=JSON.parse(request.postData());writes.push({...owner});}
     result=owner;
    }
    if(url.pathname.endsWith('/users/me'))result={userId:'warehouse-owner',roles:['SHOP_OWNER'],fullName:'Test owner',status:'ACTIVE'};
    return request.respond({status:200,headers,contentType:'application/json',body:JSON.stringify({code:200,result})});
   }
   if(url.origin!==origin&&!['data:','blob:'].includes(url.protocol))return request.abort();
   return request.continue();
  });
  const clickText=text=>page.evaluate(text=>[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===text)?.click(),text);
  await page.goto(origin+'/merchant/settings',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(value=>document.body.innerText.includes(value),{},old);
  await clickText('Sửa thông tin');
  const field='textarea[placeholder^="100/31 Bình Giã"]';await page.waitForSelector(field);
  await page.$eval(field,el=>{el.focus();el.select()});await page.type(field,current);
  await clickText('Lưu thông tin');
  await page.waitForFunction(value=>!document.querySelector('textarea[placeholder^="100/31 Bình Giã"]')&&document.body.innerText.includes(value),{},current);
  assert.equal(writes.length,1);assert.equal(owner.warehouseAddress,current);assert.equal(owner.returnWarehouseAddress,current);
  await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(value=>document.body.innerText.includes(value),{},current);
  await clickText('Sửa thông tin');await page.waitForSelector(field);
  await page.$eval(field,el=>{el.focus();el.select()});await page.type(field,'100/31 Bình Giã, Thành phố Hồ Chí Minh');await clickText('Lưu thông tin');
  await page.waitForFunction(()=>document.body.innerText.includes('Quận/huyện không bắt buộc.'));assert.equal(writes.length,1);
  await page.$eval(field,el=>{el.focus();el.select()});await page.type(field,old);await clickText('Lưu thông tin');
  await page.waitForFunction(value=>!document.querySelector('textarea[placeholder^="100/31 Bình Giã"]')&&document.body.innerText.includes(value),{},old);
  assert.equal(writes.length,2);assert.equal(owner.warehouseAddress,old);assert.deepEqual(errors,[]);
 }catch(error){console.error('Fixture page:',await page.evaluate(()=>({path:location.pathname,text:document.body.innerText.slice(-2200)})),errors);throw error;}finally{await browser.close();}
});
