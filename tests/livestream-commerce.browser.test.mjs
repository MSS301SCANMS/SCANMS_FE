import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import puppeteer from 'puppeteer-core';
import { io } from 'socket.io-client';
import { createLiveServer } from '../../be/livestream-realtime/server.mjs';
import { generateKeyPair, SignJWT, jwtVerify } from '../../be/livestream-realtime/node_modules/jose/dist/webapi/index.js';
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
  const variants=[{id:'white-m',name:'White / M',price:329000,stockQuantity:10,isActive:true},{id:'white-l',name:'White / L',price:339000,stockQuantity:5,isActive:true}];
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
      return Response.json({result:url.endsWith('/stores/mine')?[{storeId:'store-a',approvalStatus:'APPROVED'}]:session});
    }});
  await new Promise((resolve,reject)=>{relay.http.once('error',reject);relay.http.listen(relayPort,'127.0.0.1',resolve)});
  const browser=await puppeteer.launch({executablePath,headless:true});const errors=[];
  const publisher=io(`http://127.0.0.1:${relayPort}/live-stream`,{transports:['websocket'],auth:{token:tokens.shop},reconnection:false});
  try{
    await new Promise((resolve,reject)=>{publisher.once('connect',resolve);publisher.once('connect_error',reject)});
    assert.equal((await publisher.timeout(3000).emitWithAck('join_live_room',{sessionId:'commerce-fixture',requestedRole:'host'})).ok,true);
    assert.equal((await publisher.timeout(3000).emitWithAck('live_stream_started',{sessionId:'commerce-fixture'})).ok,true);
    const open=async kind=>{
      const context=await browser.createBrowserContext(),page=await context.newPage();page.setDefaultTimeout(15000);await page.setViewport({width:1500,height:1050});
      page.on('pageerror',error=>{if(error.message!=='WebSocket closed without opened.')errors.push(error.message)});
      await page.evaluateOnNewDocument((kind,token)=>{
        localStorage.clear();sessionStorage.clear();localStorage.setItem('token',token);
        localStorage.setItem('user',JSON.stringify({id:kind==='shop'?'owner':'buyer',fullName:kind,role:kind==='shop'?'SHOP_MANAGER':'CUSTOMER',roles:[kind==='shop'?'SHOP_OWNER':'USER']}));
        localStorage.setItem('scanms-active-workspace',kind==='shop'?'shop':'customer');localStorage.setItem('scanms-current-role',kind==='shop'?'shop':'customer');
      },kind,tokens[kind]);
      await page.setRequestInterception(true);
      page.on('request',request=>{
        const url=new URL(request.url());
        if(url.pathname.startsWith('/api/')){
          const headers={'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Credentials':'true','Access-Control-Allow-Headers':'authorization,content-type,x-skip-cache','Access-Control-Allow-Methods':'GET,POST,OPTIONS'};
          const reply=(result,status=200)=>request.respond({status,headers,contentType:'application/json',body:JSON.stringify({code:status,result})});
          if(request.method()==='OPTIONS')return request.respond({status:204,headers});
          const body=request.postData()?JSON.parse(request.postData()):{};
          if(request.method()==='POST'&&url.pathname.endsWith('/offers')){
            assert.equal(kind,'shop');assert.equal(body.variantId,'white-m');assert.equal(body.priceVnd,299000);
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
          if(url.pathname.includes('/landing'))return reply({product:url.pathname.includes('/cap/')?{id:'cap',title:'Cotton cap',price:150000,stockQuantity:5,canPurchase:true,variants:[{id:'cap-one',name:'One size',price:150000,stockQuantity:5,isActive:true}]}:{id:'shirt',title:'Cotton shirt',price:329000,stockQuantity:15,canPurchase:true,variants}});
          if(url.pathname.endsWith('/vouchers/public/platform'))return reply([platform]);
          if(url.pathname.endsWith('/users'))return reply({userId:kind==='shop'?'owner':'buyer',identitySubject:kind==='shop'?'owner':'buyer',fullName:kind,status:'ACTIVE',roles:[kind==='shop'?'SHOP_OWNER':'USER']});
          return reply([]);
        }
        if(url.origin!==origin&&url.port!==String(relayPort)&&!['data:','blob:'].includes(url.protocol))return request.abort();return request.continue();
      });
      await page.goto(origin+'/live/commerce-fixture',{waitUntil:'domcontentloaded'});await page.waitForSelector('.live-room-header');return page;
    };
    const shop=await open('shop'),buyer=await open('buyer');
    await shop.waitForSelector('button.live-room-studio');assert.equal(await buyer.$('button.live-room-studio'),null);
    await shop.click('button.live-room-studio');
    const clickText=async(page,text)=>{const found=await page.evaluate(text=>{const button=[...document.querySelectorAll('button')].find(row=>row.textContent.trim()===text);button?.click();return !!button},text);assert.ok(found,'Missing button '+text);};
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
    const selects=await shop.$$('[aria-label="Giá live và voucher"] select');await selects[1].select('white-m');
    await shop.focus('input[aria-label="Giá live"]');await shop.keyboard.down('Control');await shop.keyboard.press('A');await shop.keyboard.up('Control');await shop.keyboard.press('Backspace');await shop.type('input[aria-label="Giá live"]','299000');
    await clickText(shop,'Áp dụng & ghim sản phẩm');
    await shop.waitForFunction(()=>document.querySelector('.live-product-card')?.textContent.includes('299.000'));
    await buyer.waitForFunction(()=>document.querySelector('.live-product-card')?.textContent.includes('299.000'));
    await buyer.waitForFunction(()=>document.querySelector('.live-product-card')?.textContent.includes('SAN10'));
    await buyer.evaluate(()=>[...document.querySelectorAll('button')].find(button=>button.textContent.includes('Túi Đồ Live')).click());
    const bag=await buyer.$eval('[aria-label="Túi đồ livestream"]',node=>node.innerText);
    assert.match(bag,/299\.000/);assert.match(bag,/150\.000/);assert.doesNotMatch(bag,/Giảm 150K|Quà miễn phí|Giảm 25%/,'only confirmed prices and promotions are displayed');
    await buyer.click('button[title="Đóng túi đồ"]');
    await buyer.click('.live-product-cart');await buyer.waitForSelector('[aria-label="Chọn phân loại trong live"]');
    await clickText(buyer,'White / M');await clickText(buyer,'Xác nhận phân loại');
    await buyer.waitForFunction(()=>Object.keys(localStorage).some(key=>key.includes('cart')&&(localStorage.getItem(key)||'').includes('299000')));
    await shop.click('[aria-label="Giá live và voucher"] input[type="checkbox"]');
    const newFields=await shop.$$('[aria-label="Giá live và voucher"] section:nth-of-type(2) input');
    await newFields[1].type('LIVE30');await clickText(shop,'Tung voucher ngay');
    await buyer.waitForFunction(()=>document.querySelector('[aria-label="Voucher đang tung trong live"]')?.textContent.includes('LIVE30'));
    assert.equal(state.offers[0].priceVnd,299000);assert.equal(variants[0].price,329000,'ordinary variant price stays unchanged');
    assert.equal(relay.rooms.get('commerce-fixture').members.size,3,'publisher, shop and customer stay connected to the real relay');
    assert.deepEqual(errors,[]);
  }finally{publisher.disconnect();await browser.close();await relay.close();}
});
