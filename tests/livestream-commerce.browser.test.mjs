import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import puppeteer from 'puppeteer-core';
import { io } from 'socket.io-client';
const relayRoot = ['../../be/livestream-realtime/', '../../SCANMS_BE/livestream-realtime/']
  .map(path => new URL(path, import.meta.url)).find(path => existsSync(new URL('server.mjs', path)));
if (!relayRoot) throw new Error('Missing BE livestream-realtime beside the FE repository.');
const { createLiveServer } = await import(new URL('server.mjs', relayRoot).href);
const { generateKeyPair, SignJWT, jwtVerify } = await import(new URL('node_modules/jose/dist/webapi/index.js', relayRoot).href);
const base=process.env.GHN_UI_TEST_URL, executablePath=process.env.GHN_UI_BROWSER_PATH;
const relayPort=Number(process.env.LIVE_TEST_RELAY_PORT||8090);

test('shop sets live variant price and launches vouchers while customer chooses size and sees platform offers',{
  skip:!base||!executablePath||!existsSync(executablePath),timeout:65000,
},async()=>{
  const origin=new URL(base).origin;
  const {privateKey,publicKey}=await generateKeyPair('RS256');
  const sign=(sub,roles)=>new SignJWT({name:sub,realm_access:{roles}}).setProtectedHeader({alg:'RS256'}).setIssuer('live-commerce-fixture').setSubject(sub).setExpirationTime('10m').sign(privateKey);
  const tokens={shop:await sign('owner',['SHOP_OWNER']),buyer:await sign('buyer',['USER'])};
  const session={livestreamId:'commerce-fixture',storeId:'store-a',title:'Commerce live',status:'LIVE',productRefs:{productIds:['shirt','cap'],pinnedProductId:null},participantRefs:{},collaboratorRefs:{}};
  const variants=[{id:'00000000-0000-4000-8000-000000000001',name:'White / M',sku:'SHIRT-M',price:329000,stockQuantity:10,isActive:true},{id:'00000000-0000-4000-8000-000000000002',name:'White / L',sku:'SHIRT-L',price:339000,stockQuantity:5,isActive:true}];
  const state={offers:[],voucherDrops:[],pinnedProductId:null};
  const platform={voucherId:'platform-save',code:'SAN10',issuerType:'PLATFORM',scopeType:'PLATFORM',benefitType:'GOODS',discountType:'FIXED',value:10000,minimumSubtotal:100000,validFrom:'2026-01-01T00:00:00',validUntil:'2030-01-01T00:00:00'};
  const published=()=>({...state,voucherDrops:state.voucherDrops.filter(row=>row.status==='PUBLISHED')});
  let pinUnavailable=true;
  const relay=createLiveServer({origins:[origin],pollMs:200,metricsSecret: "fixture-live-metrics-key-32-characters-long",verifyToken:async token=>(await jwtVerify(token,publicKey,{issuer:'live-commerce-fixture'})).payload,
    fetcher:async (url,request)=>{
      if(url.endsWith('/pin')){
        if(pinUnavailable)return Response.json({message:'Old Product version'},{status:404});
        state.pinnedProductId=JSON.parse(request.body).productId;session.productRefs.pinnedProductId=state.pinnedProductId;
        return Response.json({result:session});
      }
      return Response.json({result:url.endsWith('/purchase-access')?{token:'fixture-room-proof'}:url.endsWith('/stores/mine')?[{storeId:'store-a',approvalStatus:'APPROVED'}]:session});
    }});
  await new Promise((resolve,reject)=>{relay.http.once('error',reject);relay.http.listen(relayPort,'127.0.0.1',resolve)});
  const browser=await puppeteer.launch({executablePath,headless:true,args:['--disable-features=LocalNetworkAccessChecks,LocalNetworkAccessChecksWebSockets']});const errors=[],quotes=[];
  const publisher=io(`http://127.0.0.1:${relayPort}/live-stream`,{transports:['websocket'],auth:{token:tokens.shop},reconnection:false});
  try{
    await new Promise((resolve,reject)=>{publisher.once('connect',resolve);publisher.once('connect_error',reject)});
    assert.equal((await publisher.timeout(3000).emitWithAck('join_live_room',{sessionId:'commerce-fixture',requestedRole:'host'})).ok,true);
    assert.equal((await publisher.timeout(3000).emitWithAck('live_stream_started',{sessionId:'commerce-fixture'})).ok,true);
    const open=async kind=>{
      const context=await browser.createBrowserContext(),page=await context.newPage();page.setDefaultTimeout(15000);await page.setViewport({width:1500,height:1050});
      page.on('pageerror',error=>{if(error.message!=='WebSocket closed without opened.')errors.push(error.message)});
      await page.evaluateOnNewDocument((kind,token)=>{
        if(!localStorage.getItem('token')){localStorage.clear();sessionStorage.clear();}localStorage.setItem('token',token);
        localStorage.setItem('user',JSON.stringify({id:kind==='shop'?'owner':'buyer',fullName:kind,role:kind==='shop'?'SHOP_MANAGER':'CUSTOMER',roles:[kind==='shop'?'SHOP_OWNER':'USER']}));
        localStorage.setItem('scanms-active-workspace',kind==='shop'?'shop':'customer');localStorage.setItem('scanms-current-role',kind==='shop'?'shop':'customer');
      },kind,tokens[kind]);
      await page.setRequestInterception(true);
      page.on('request',request=>{
        const url=new URL(request.url());
        if(url.pathname==='/demo-public-config.json')return request.respond({contentType:'application/json',body:'{}'});
        if(url.hostname==='provinces.open-api.vn')return request.respond({contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:JSON.stringify([{code:1,name:'Province',districts:[{code:2,name:'District',wards:[{code:3,name:'Ward'}]}]}])});
        if(url.pathname.startsWith('/api/')){
          const headers={'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Credentials':'true','Access-Control-Allow-Headers':'authorization,content-type,x-skip-cache','Access-Control-Allow-Methods':'GET,POST,OPTIONS'};
          const reply=(result,status=200)=>request.respond({status,headers,contentType:'application/json',body:JSON.stringify({code:status,result})});
          if(request.method()==='OPTIONS')return request.respond({status:204,headers});
          const body=request.postData()?JSON.parse(request.postData()):{};
          if(url.pathname.endsWith('/checkout/quote')){
            quotes.push(body);
            const lines=(body.items||[]).map(item=>{const variant=variants.find(row=>row.id===item.variantId);const deal=state.offers.find(row=>row.variantId===item.variantId&&row.status==='ACTIVE'&&row.quantityLimit>row.reservedQuantity);const price=deal?.priceVnd??variant?.price??150000;return {...item,storeId:'store-a',unitPriceVnd:price,listUnitPriceVnd:variant?.price??150000,grossAmountVnd:price*item.quantity};});
            const subtotalVnd=lines.reduce((sum,row)=>sum+row.grossAmountVnd,0);
            return reply({shippingFeeVnd:30000,subtotalVnd,finalAmount:subtotalVnd+30000,shippingMode:'SIMULATED',shippingPayer:'CUSTOMER',discountAmount:0,lines});
          }
          if(request.method()==='POST'&&url.pathname.endsWith('/offers')){
            assert.equal(kind,'shop');assert.equal(body.variantId,'00000000-0000-4000-8000-000000000001');assert.equal(body.priceVnd,299000);
            state.offers=[{...body,id:'offer-a',reservedQuantity:0,status:'ACTIVE',startsAt:new Date().toISOString()}];state.pinnedProductId='shirt';session.productRefs.pinnedProductId='shirt';return reply(state,201);
          }
          if(request.method()==='POST'&&url.pathname.endsWith('/vouchers'))return reply({...body,voucherId:'live-voucher'},201);
          if(request.method()==='POST'&&url.pathname.endsWith('/voucher-drops')){
            state.voucherDrops=[{...body,id:'drop-a',code:'LIVE30',issuerType:'STORE',benefitType:'GOODS',discountType:'FIXED',value:30000,minimumSubtotal:250000,status:'PUBLISHED'}];return reply(state,201);
          }
          if(url.pathname.endsWith('/commerce/manage'))return reply(state);
          if(url.pathname.endsWith('/commerce'))return reply(published());
          if(url.pathname.endsWith('/livestreams/commerce-fixture'))return reply(session);
          if(url.pathname.endsWith('/stores/mine'))return reply(kind==='shop'?[{storeId:'store-a',approvalStatus:'APPROVED'}]:[]);
          if(url.pathname.endsWith('/stores/public/id/store-a'))return reply({storeId:'store-a',name:'Fixture store'});
          if(url.pathname.includes('/landing'))return reply({product:url.pathname.includes('/cap/')?{id:'cap',storeId:'store-a',title:'Cotton cap',price:150000,stockQuantity:5,canPurchase:true,variants:[{id:'cap-one',name:'One size',price:150000,stockQuantity:5,isActive:true}]}:{id:'shirt',storeId:'store-a',title:'Cotton shirt',price:329000,stockQuantity:15,canPurchase:true,variants}});
          if(url.pathname.endsWith('/vouchers/public/platform'))return reply([platform]);
          if(url.pathname.endsWith('/users'))return reply({userId:kind==='shop'?'owner':'buyer',identitySubject:kind==='shop'?'owner':'buyer',fullName:kind,status:'ACTIVE',roles:[kind==='shop'?'SHOP_OWNER':'USER'],phoneNumber:'0901234567',address:JSON.stringify([{id:'address',fullName:'Fixture Buyer',phoneNumber:'0901234567',detailAddress:'123 Test street',provinceCode:'1',districtCode:'2',wardCode:'3',provinceName:'Province',districtName:'District',wardName:'Ward',isDefault:true}])});
          return reply([]);
        }
        if(url.origin!==origin&&url.port!==String(relayPort)&&!['data:','blob:'].includes(url.protocol))return request.abort();return request.continue();
      });
      await page.goto(origin+'/live/commerce-fixture',{waitUntil:'domcontentloaded'});await page.waitForSelector('.live-room-header');return page;
    };
    const shop=await open('shop'),buyer=await open('buyer');
    await shop.waitForSelector('button.live-room-studio');assert.equal(await buyer.$('button.live-room-studio'),null);
    await shop.click('button.live-room-studio');
    const clickText=async(page,text)=>{const found=await page.evaluate(text=>{const scope=document.querySelector('[aria-label="Chọn phân loại trong live"]')||document;const button=[...scope.querySelectorAll('button')].find(row=>row.textContent.trim()===text);button?.click();return !!button},text);assert.ok(found,'Missing button '+text);};
    const pin=async title=>{
      await shop.waitForFunction(title=>{const heading=[...document.querySelectorAll('[aria-label="Sản phẩm ghim trong live"] h4')].find(node=>node.textContent===title);return heading&&heading.parentElement.parentElement.querySelector('button')?.disabled===false}, {}, title);
      await shop.evaluate(title=>{const heading=[...document.querySelectorAll('[aria-label="Sản phẩm ghim trong live"] h4')].find(node=>node.textContent===title);heading.parentElement.parentElement.querySelector('button').click()},title);
    };
    await shop.waitForFunction(()=>document.body.innerText.includes('Chưa ghim sản phẩm'));
    await pin('Cotton shirt');
    await shop.waitForFunction(()=>document.body.innerText.includes('Cần cập nhật dịch vụ'));
    assert.equal(state.pinnedProductId,null,'a missing backend API must not create an optimistic pin');
    pinUnavailable=false;
    await pin('Cotton shirt');
    await buyer.waitForFunction(()=>document.querySelector('.live-product-card')?.textContent.includes('Cotton shirt'));
    await pin('Cotton shirt');
    await buyer.waitForFunction(()=>!document.querySelector('.live-product-card'));
    await pin('Cotton cap');
    await buyer.waitForFunction(()=>document.querySelector('.live-product-card')?.textContent.includes('Cotton cap'));
    await buyer.reload({waitUntil:'domcontentloaded'});
    await buyer.waitForFunction(()=>document.querySelector('.live-product-card')?.textContent.includes('Cotton cap'));
    await clickText(shop,'Giá live & Voucher');await shop.waitForSelector('[aria-label="Giá live và voucher"]');
    await shop.select('[aria-label="Giá live và voucher"] select:nth-of-type(1)','shirt');
    const selects=await shop.$$('[aria-label="Giá live và voucher"] select');await selects[1].select('00000000-0000-4000-8000-000000000001');
    await shop.focus('input[aria-label="Giá live"]');await shop.keyboard.down('Control');await shop.keyboard.press('A');await shop.keyboard.up('Control');await shop.keyboard.press('Backspace');await shop.type('input[aria-label="Giá live"]','299000');
    await shop.$eval('input[aria-label="Số lượng ưu đãi"]',input=>{const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;setter.call(input,'3');input.dispatchEvent(new Event('input',{bubbles:true}));});
    await clickText(shop,'Áp dụng & ghim sản phẩm');
    await shop.waitForFunction(()=>document.querySelector('.live-product-card')?.textContent.includes('299.000'));
    await buyer.waitForFunction(()=>document.querySelector('.live-product-card')?.textContent.includes('299.000'));
    await buyer.waitForFunction(()=>document.querySelector('.live-product-card')?.textContent.includes('SAN10'));
    await buyer.evaluate(()=>[...document.querySelectorAll('button')].find(button=>button.textContent.includes('Túi Đồ Live')).click());
    const bag=await buyer.$eval('[aria-label="Túi đồ livestream"]',node=>node.innerText);
    assert.match(bag,/299\.000/);assert.match(bag,/150\.000/);assert.doesNotMatch(bag,/Giảm 150K|Quà miễn phí|Giảm 25%|419.1K|80.1K|Mall|★ 4.5/,'only confirmed prices, store facts and promotions are displayed');
    await buyer.click('button[title="Đóng túi đồ"]');
    await buyer.click('.live-product-cart');await buyer.waitForSelector('[aria-label="Chọn phân loại trong live"]');
    await clickText(buyer,'White / M');
    await buyer.click('button[aria-label="Tăng số lượng"]');await buyer.click('button[aria-label="Tăng số lượng"]');
    assert.equal(await buyer.$eval('button[aria-label="Tăng số lượng"]',node=>node.disabled),true,'live quota caps the quantity');
    await buyer.click('button[aria-label="Giảm số lượng"]');
    await clickText(buyer,'Thêm vào giỏ');
    await buyer.waitForFunction(()=>Object.keys(localStorage).some(key=>key.includes('cart')&&(localStorage.getItem(key)||'').includes('299000')));
    const firstCart=await buyer.evaluate(()=>JSON.parse(localStorage.getItem('scanms_cart_u_buyer')));
    assert.equal(firstCart[0].quantity,2);assert.equal(firstCart[0].price,299000);assert.equal(firstCart[0].originalPrice,329000);
    assert.equal(firstCart[0].liveSessionId,'commerce-fixture');assert.equal(firstCart[0].sku,'SHIRT-M');
    await shop.click('[aria-label="Giá live và voucher"] input[type="checkbox"]');
    const newFields=await shop.$$('[aria-label="Giá live và voucher"] section:nth-of-type(2) input');
    await newFields[1].type('LIVE30');await clickText(shop,'Tung voucher ngay');
    await buyer.waitForFunction(()=>document.querySelector('[aria-label="Voucher đang tung trong live"]')?.textContent.includes('LIVE30'));
    assert.equal(state.offers[0].priceVnd,299000);assert.equal(variants[0].price,329000,'ordinary variant price stays unchanged');
    await buyer.click('.live-product-buy');await buyer.waitForSelector('[aria-label="Chọn phân loại trong live"]');
    await clickText(buyer,'White / M');
    state.offers[0].priceVnd=289000;
    await clickText(buyer,'Tiếp tục thanh toán');
    await buyer.waitForFunction(()=>document.querySelector('[aria-label="Chọn phân loại trong live"]')?.innerText.includes('Giá, ưu đãi hoặc tồn kho vừa thay đổi'));
    assert.equal(await buyer.$('.scanms-checkout'),null,'changed price must require review before checkout');
    assert.match(await buyer.$eval('[aria-label="Chọn phân loại trong live"]',node=>node.innerText),/289.000/);
    variants[0].stockQuantity=0;
    await clickText(buyer,'Tiếp tục thanh toán');
    await buyer.waitForFunction(()=>document.querySelector('[aria-label="Chọn phân loại trong live"]')?.innerText.includes('White / M · Hết hàng'));
    await clickText(buyer,'White / L');
    await buyer.click('button[aria-label="Tăng số lượng"]');
    await buyer.screenshot({path:'D:/MSS301/.validation/live-purchase-picker-20261108.png'});
    await clickText(buyer,'Tiếp tục thanh toán');
    await buyer.waitForFunction(()=>location.pathname==='/checkout');
    await buyer.waitForSelector('.scanms-checkout');
    const purchased=await buyer.evaluate(()=>JSON.parse(localStorage.getItem('scanms_cart_u_buyer')).find(row=>row.sku==='SHIRT-L'));
    assert.equal(purchased.quantity,2);assert.equal(purchased.price,339000,'another size must keep its own catalog price');
    assert.equal(purchased.liveSessionId,'commerce-fixture');assert.equal(purchased.store.id,'store-a');
    assert.equal(await buyer.evaluate(()=>location.pathname),'/checkout','Buy now must navigate to the customer checkout page');
    for(let attempt=0;attempt<100&&!quotes.some(body=>body.items?.some(row=>row.variantId===variants[1].id));attempt++)await new Promise(resolve=>setTimeout(resolve,100));
    const checkoutLine=quotes.flatMap(body=>body.items||[]).find(row=>row.variantId===variants[1].id);
    assert.ok(checkoutLine,'shared checkout must ask the server to quote the selected live variant');
    assert.equal(checkoutLine.quantity,2);assert.equal(checkoutLine.sourceLivestreamId,'commerce-fixture');assert.equal(checkoutLine.livePurchaseToken,'fixture-room-proof');
    assert.equal(relay.rooms.get('commerce-fixture').members.size,3,'the signed live connection remains during the checkout page');
    await buyer.screenshot({path:'D:/MSS301/.validation/live-checkout-page-20261108.png'});
    await buyer.reload({waitUntil:'domcontentloaded'});
    await buyer.waitForSelector('.scanms-checkout');
    assert.equal(new URL(buyer.url()).pathname,'/checkout');
    assert.match(await buyer.$eval('.scanms-checkout',node=>node.innerText),/Cotton shirt/,'reload must restore this buyer\'s selected checkout');
    await buyer.click('.scanms-checkout button[title="Quay lại mua sắm"]');
    await buyer.waitForFunction(()=>location.pathname==='/live/commerce-fixture'&&!document.querySelector('.scanms-checkout'));
    await buyer.waitForFunction(()=>document.querySelector('.live-product-buy')?.disabled===false);
    await buyer.click('.live-product-buy');await buyer.waitForSelector('[aria-label="Chọn phân loại trong live"]');
    await clickText(buyer,'White / L');await clickText(buyer,'Tiếp tục thanh toán');
    await buyer.waitForFunction(()=>location.pathname==='/checkout');await buyer.waitForSelector('.scanms-checkout');
    await buyer.goBack();
    await buyer.waitForFunction(()=>location.pathname==='/live/commerce-fixture'&&!document.querySelector('.scanms-checkout'));
    await buyer.click('button[title="Chia sẻ phiên livestream"]');
    await buyer.waitForSelector('input[aria-label="Link live local"]');
    assert.equal(await buyer.$eval('input[aria-label="Link live local"]',node=>node.value),origin+'/live/commerce-fixture');
    await buyer.waitForFunction(()=>document.body.innerText.includes('Chưa cấu hình địa chỉ HTTPS công khai'));
    assert.equal(await buyer.evaluate(()=>[...document.querySelectorAll('button')].find(button=>button.textContent.includes('Sao chép link công khai')).disabled),true);
    await buyer.screenshot({path:'D:/MSS301/.validation/live-share-dialog-20261108.png'});
    assert.deepEqual(errors,[]);
  }finally{publisher.disconnect();await browser.close();await relay.close();}
});
