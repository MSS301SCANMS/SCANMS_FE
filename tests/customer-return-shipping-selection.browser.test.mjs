import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const base=process.env.GHN_UI_TEST_URL, executablePath=process.env.GHN_UI_BROWSER_PATH;
test('customer selects return shipments, retries partial failures and reconciles a lost shipment response', {
  skip:!base||!executablePath||!existsSync(executablePath),timeout:45000,
},async()=>{
  const origin=new URL(base).origin;assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
  const browser=await puppeteer.launch({executablePath,headless:true});
  let page;
  const errors=[],writes=[],now=new Date().toISOString();
  const row=(id,status='APPROVED',simulationEnabled=true)=>({returnRequestId:id,orderId:'purchase',orderItemId:'item-'+id,status,quantity:1,unitPrice:100000,refundAmountVnd:100000,reason:'WRONG_ITEM',requestedAt:now,storeName:'Fixture shop',productSnapshot:{title:'Product '+id},evidenceRefs:{},simulationEnabled,logistics:status==='RETURNING'?{environment:'TEST',carrier:'LOCAL_SIMULATION',trackingCode:'existing',status:'BOOKED'}:null});
  const rows=[row('first'),row('second'),row('manual','APPROVED',false),row('sent','RETURNING'),row('waiting','REQUESTED')];
  let failSecond=true,loseManual=true;
  try {
    page=await browser.newPage();page.setDefaultTimeout(10000);
    await page.setViewport({width:1440,height:1000});
    page.on('pageerror',error=>{if(!error.message.includes('WebSocket closed without opened'))errors.push(error.message)});
    await page.evaluateOnNewDocument(()=>{
      localStorage.clear();localStorage.setItem('token','return-shipping-fixture-no-server-access');
      localStorage.setItem('user',JSON.stringify({id:'fixture-buyer',fullName:'Fixture buyer',role:'CUSTOMER',roles:['USER']}));
      localStorage.setItem('scanms-active-workspace','customer');localStorage.setItem('scanms_analytics_consent','denied');
    });
    await page.setRequestInterception(true);
    page.on('request',request=>{
      const url=new URL(request.url());
      const headers={'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Credentials':'true','Access-Control-Allow-Headers':request.headers()['access-control-request-headers']||'authorization,content-type,x-skip-cache','Access-Control-Allow-Methods':'GET,POST,OPTIONS'};
      const respond=(result,status=200)=>request.respond({status,headers,contentType:'application/json',body:JSON.stringify({code:status,result,...(status===503?{message:'Fixture shipment temporarily unavailable'}:{})})});
      if(request.method()==='OPTIONS')return request.respond({status:204,headers});
      if(url.pathname==='/src/services/chat-socket.service.ts')return request.respond({contentType:'application/javascript',body:'const s={connected:false,active:false,on(){return this},off(){return this},emit(){},connect(){return this}};export const getChatSocket=()=>s;export const isChatSocketEnabled=()=>false;export const isChatSocketAuthenticated=()=>false;export const disconnectChatSocket=()=>{};'});
      if(url.pathname.startsWith('/api/')) {
        if(url.pathname.endsWith('/users/me'))return respond({userId:'fixture-buyer',roles:['USER'],fullName:'Fixture buyer',status:'ACTIVE'});
        if(url.pathname.endsWith('/orders/my-orders'))return respond([{orderId:'purchase',status:'COMPLETED',finalAmount:530000,createdAt:now}]);
        if(url.pathname.endsWith('/orders/purchase/checkout-details'))return respond({orderId:'purchase',status:'COMPLETED',finalAmount:530000,shippingFee:30000,createdAt:now,sellerOrders:[{sellerOrderId:'seller',storeId:'shop',status:'COMPLETED',deliveredAt:now,totalsSnapshot:{storeName:'Fixture shop'},items:rows.map(row=>({orderItemId:row.orderItemId,productId:'product-'+row.returnRequestId,quantity:1,unitPrice:100000,productSnapshot:row.productSnapshot}))}]});
        if(url.pathname.endsWith('/commerce/returns'))return respond(rows);
        const match=url.pathname.match(/\/commerce\/returns\/([^/]+)(\/shipment)?$/);
        if(match) {
          const row=rows.find(row=>row.returnRequestId===match[1]);
          if(!match[2])return respond(row);
          const body=JSON.parse(request.postData());writes.push({id:row.returnRequestId,body});
          assert.equal(row.status,'APPROVED','never POST shipment for an already sent or unapproved return');
          if(row.returnRequestId==='second'&&failSecond)return respond(null,503);
          row.status='RETURNING';row.logistics={...body,carrier:body.carrier||'LOCAL_SIMULATION',trackingCode:body.trackingCode||'SIM-'+row.returnRequestId,status:'BOOKED'};
          if(row.returnRequestId==='manual'&&loseManual){loseManual=false;return respond(null,503);}
          return new Promise(resolve=>setTimeout(()=>resolve(respond(row)),100));
        }
        return respond([]);
      }
      if(url.origin!==origin&&!['data:','blob:'].includes(url.protocol))return request.abort();return request.continue();
    });
    const root='[aria-label="Hồ sơ trả hàng / hoàn tiền"]',form='form[aria-label="Gửi các sản phẩm đã chọn"]';
    const clickText=text=>page.evaluate(text=>[...document.querySelectorAll('button')].find(button=>button.textContent.trim()===text).click(),text);
    const open=()=>page.$eval(root+' > button',button=>button.click());
    const checkbox=id=>`input[aria-label="Gửi trả Product ${id} × 1"]`;
    await page.goto(origin+'/customer/orders',{waitUntil:'domcontentloaded'});
    await page.waitForSelector('.customer-order-summary');await page.click('.customer-order-summary');await page.waitForSelector(root);
    assert.equal(await page.$eval(root+' > button',node=>node.disabled),true,'nothing selected initially');
    assert.equal(await page.$eval(checkbox('sent'),node=>node.disabled),true);
    assert.equal(await page.$eval(checkbox('waiting'),node=>node.disabled),true);
    await page.click(checkbox('first'));await open();await page.waitForSelector(form);
    assert.match(await page.$eval(form+' h4',node=>node.textContent),/1 sản phẩm/);
    assert.deepEqual(writes,[],'selection and review do not send anything');await clickText('Đóng');
    await page.click(root+' > label input');await open();await page.waitForSelector(form);
    assert.match(await page.$eval(form+' h4',node=>node.textContent),/3 sản phẩm/);
    assert.equal(await page.$eval(form,node=>node.textContent.includes('Vận chuyển mô phỏng')),false,'simulation must be enabled on every selected return');
    assert.equal(await page.$$eval(form+' input[required]',nodes=>nodes.length),6,'each actual parcel has its own carrier and tracking inputs');
    await page.$eval(form,node=>node.requestSubmit());
    assert.deepEqual(writes,[],'manual shipments require every carrier and tracking number');
    await clickText('Đóng');await page.click(checkbox('manual'));
    assert.equal(await page.$eval(root+' > label input',node=>node.indeterminate),true);
    await open();await page.waitForSelector(form);
    await mkdir(new URL('../.qa-artifacts/customer-return-shipping/',import.meta.url),{recursive:true});
    await page.setViewport({width:390,height:1000});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'multi-selection review fits on mobile');
    await page.screenshot({path:fileURLToPath(new URL('../.qa-artifacts/customer-return-shipping/selection-mobile.png',import.meta.url)),fullPage:true});
    await page.setViewport({width:1440,height:1000});
    await page.$eval(form+' button[type="submit"], '+form+' button:not([type])',button=>{button.click();button.click();});
    await page.waitForSelector(root+' [role="alert"]');
    assert.deepEqual(writes,[{id:'first',body:{environment:'TEST'}},{id:'second',body:{environment:'TEST'}}]);
    assert.match(await page.$eval(form+' [role="status"]',node=>node.textContent),/1\/2/);
    assert.equal(await page.$eval(checkbox('first'),node=>node.disabled),true);
    failSecond=false;await clickText('Thử lại các hồ sơ còn lại');
    await page.waitForFunction(()=>document.querySelector('form[aria-label="Gửi các sản phẩm đã chọn"] [role="status"]')?.textContent.includes('2/2'));
    assert.equal(writes.filter(write=>write.id==='first').length,1,'retry must skip successful items');
    assert.equal(writes.filter(write=>write.id==='second').length,2);
    await clickText('Hoàn tất');
    assert.equal(await page.$eval(checkbox('second'),node=>node.disabled),true);
    await page.click(checkbox('manual'));await open();await page.waitForSelector(form);
    await page.type('input[aria-label="Đơn vị vận chuyển Product manual × 1"]','Carrier fixture');
    await page.type('input[aria-label="Mã vận đơn Product manual × 1"]','TRACK-MANUAL-123');
    await clickText('Xác nhận đã gửi các món đã chọn');await page.waitForSelector(root+' [role="alert"]');
    assert.equal(rows[2].status,'RETURNING','server saved the manual shipment before the response was lost');
    await clickText('Thử lại các hồ sơ còn lại');
    await page.waitForFunction(()=>document.querySelector('form[aria-label="Gửi các sản phẩm đã chọn"] [role="status"]')?.textContent.includes('1/1'));
    assert.deepEqual(writes.at(-1),{id:'manual',body:{environment:'MANUAL',carrier:'Carrier fixture',trackingCode:'TRACK-MANUAL-123'}});
    assert.equal(writes.length,4,'reconcile a saved shipment without another POST');
    assert.equal(rows[3].logistics.trackingCode,'existing');assert.equal(rows[4].status,'REQUESTED');
    await clickText('Hoàn tất');
    for(const width of [1440,390]){
      await page.setViewport({width,height:1000});
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,`overflow at ${width}`);
    }
    await mkdir(new URL('../.qa-artifacts/customer-return-shipping/',import.meta.url),{recursive:true});
    await page.screenshot({path:fileURLToPath(new URL('../.qa-artifacts/customer-return-shipping/mobile.png',import.meta.url)),fullPage:true});
    assert.deepEqual(errors,[]);
  } catch(error){console.error('Return shipping selection fixture:',errors,await page?.evaluate(()=>document.body.innerText.slice(-2200)));throw error;}
  finally{await browser.close();}
});
