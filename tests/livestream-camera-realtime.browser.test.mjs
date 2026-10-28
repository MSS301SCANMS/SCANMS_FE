import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { createRequire } from 'node:module';
import { createLiveServer } from '../../be/livestream-realtime/server.mjs';
const require=createRequire(new URL('../../be/livestream-realtime/package.json',import.meta.url));
const { generateKeyPair, SignJWT, jwtVerify }=await import(new URL('../../be/livestream-realtime/node_modules/jose/dist/webapi/index.js',import.meta.url).href);
const base=process.env.GHN_UI_TEST_URL,executablePath=process.env.GHN_UI_BROWSER_PATH;
const relayPort=Number(process.env.LIVE_TEST_RELAY_PORT||8090);

test('real WebRTC carries KOL camera/microphone to customer and shop, deduplicates audience and recovers a media connection',{
 skip:!base||!executablePath||!existsSync(executablePath),timeout:85000,
},async()=>{
 const origin=new URL(base).origin;assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
 const {privateKey,publicKey}=await generateKeyPair('RS256');
 const token=async(sub,roles)=>new SignJWT({realm_access:{roles},name:sub}).setSubject(sub).setIssuer('fixture-live').setProtectedHeader({alg:'RS256'}).setExpirationTime('10m').sign(privateKey);
 const tokens={host:await token('kol-user',['KOL_CTV']),viewer:await token('buyer-user',['USER']),shop:await token('shop-user',['SHOP_OWNER'])};
 const session={livestreamId:'camera-fixture',storeId:'store-a',title:'Camera and microphone verification',status:'LIVE',productRefs:{productIds:['shirt-a','dress-a']},collaboratorRefs:{collaboratorIds:['kol-a']},participantRefs:{creatorName:'Fixture KOL',collaboratorResponses:{'kol-a':'ACCEPTED'}}};
 const server=createLiveServer({origins:[origin],pollMs:200,metricsSecret: "fixture-live-metrics-key-32-characters-long",verifyToken:async token=>(await jwtVerify(token,publicKey,{issuer:'fixture-live'})).payload,
  fetcher:async url=>Response.json({result:url.endsWith('/collaborators/me')?{collaboratorId:'kol-a',approvalStatus:'APPROVED'}:url.endsWith('/stores/mine')?[{storeId:'store-a',approvalStatus:'APPROVED'}]:url.includes('/referrals/livestream-access?')?{approvalStatus:'APPROVED',collaboratorId:'kol-a',storeId:'store-a'}:session}),
 });
 const shopJoinRoles=[];
 server.io.of('/live-stream').on('connection',socket=>socket.on('join_live_room',payload=>{if(socket.data.claims.sub==='shop-user')shopJoinRoles.push(payload.requestedRole)}));
 await new Promise((resolve,reject)=>{server.http.once('error',reject);server.http.listen(relayPort,'127.0.0.1',resolve)});
 const browser=await puppeteer.launch({executablePath,headless:true,args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream','--autoplay-policy=no-user-gesture-required']});
 const errors=[],apiWrites=[];let host,viewer,shop,observer;
 const artifacts=new URL('../.qa-artifacts/livestream-camera/',import.meta.url);
 await mkdir(artifacts,{recursive:true});
 try{
  const setup=async(kind)=>{
   const context=await browser.createBrowserContext();await context.overridePermissions(origin,['camera','microphone']);
   const page=await context.newPage();page.setDefaultTimeout(15000);await page.setViewport({width:1440,height:1000});
   page.on('pageerror',e=>{if(!e.message.includes('WebSocket closed without opened'))errors.push(kind+': '+e.message)});
   await page.evaluateOnNewDocument((kind,token)=>{
    localStorage.clear();sessionStorage.clear();localStorage.setItem('token',token);
    if(kind==='viewer')localStorage.setItem('scanms_live_likes_camera-fixture','999');
    const user=kind==='host'?{id:'kol-user',fullName:'Fixture KOL',role:'COLLABORATOR',roles:['KOL_CTV']}:kind==='shop'?{id:'shop-user',fullName:'Fixture shop owner',role:'SHOP_MANAGER',roles:['SHOP_OWNER']}:{id:'buyer-user',fullName:'Fixture buyer',role:'CUSTOMER',roles:['USER']};
    localStorage.setItem('user',JSON.stringify(user));
    localStorage.setItem('scanms-active-workspace',kind==='host'?'kol':kind==='shop'?'shop':'customer');localStorage.setItem('scanms-current-role',kind==='host'?'kol':kind==='shop'?'shop':'customer');
    const Original=window.RTCPeerConnection;window.__livePeers=[];
    window.RTCPeerConnection=class extends Original{constructor(config){super({...config,iceServers:[]});window.__livePeers.push(this)}};
   },kind,tokens[kind]);
   await page.setRequestInterception(true);
   page.on('request',request=>{
    const url=new URL(request.url());
    if(url.pathname.startsWith('/api/')){
     const headers={'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Credentials':'true','Access-Control-Allow-Headers':request.headers()['access-control-request-headers']||'authorization,content-type','Access-Control-Allow-Methods':'GET,POST,OPTIONS'};
     if(request.method()==='OPTIONS')return request.respond({status:204,headers});
     if(url.pathname.endsWith('/stores/my-store/presence')&&request.method()==='POST')return request.respond({status:200,headers,contentType:'application/json',body:JSON.stringify({code:200,result:true})});
     if(request.method()!=='GET'){apiWrites.push(url.pathname);return request.abort()}
     let result=[];
     if(url.pathname.endsWith('/livestreams/camera-fixture'))result=session;
     if(url.pathname.endsWith('/stores/public/id/store-a'))result={id:'store-a',name:'Fixture shop'};
     if(url.pathname.endsWith('/stores/mine'))result=kind==='shop'?[{storeId:'store-a',name:'Fixture shop',approvalStatus:'APPROVED'}]:[];
     if(url.pathname.endsWith('/collaborators'))result=[{collaboratorId:'kol-a',userId:'kol-user',approvalStatus:'APPROVED'}];
     if(url.pathname.includes('/landing')){const id=url.pathname.includes('shirt-a')?'shirt-a':'dress-a';result={product:{id,title:id==='shirt-a'?'Cotton shirt':'Red dress',price:269000,stockQuantity:10,variants:[{id:'variant-'+id,stockQuantity:10,price:269000,isActive:true}]}}}
     if(url.pathname.endsWith('/users'))result={userId:kind==='host'?'kol-user':kind==='shop'?'shop-user':'buyer-user',roles:[kind==='host'?'KOL_CTV':kind==='shop'?'SHOP_OWNER':'USER'],fullName:kind==='host'?'Fixture KOL':kind==='shop'?'Fixture shop owner':'Fixture buyer',status:'ACTIVE'};
     return request.respond({status:200,headers,contentType:'application/json',body:JSON.stringify({code:200,result})});
    }
    if(url.origin!==origin&&url.port!==String(relayPort)&&!['blob:','data:'].includes(url.protocol))return request.abort();return request.continue();
   });
   await page.goto(origin+'/live/camera-fixture',{waitUntil:'domcontentloaded'});await page.waitForSelector('.live-room-header');return page;
  };
  shop=await setup('shop');host=await setup('host');
  const likes=async(page,count)=>page.waitForFunction(count=>document.querySelector('.live-room-likes .font-mono')?.textContent.trim()===String(count),{},count);
  for(const page of [host,shop])await page.waitForFunction(()=>document.querySelector('.live-room-viewers').textContent.trim()==='1');
  await shop.click('button.live-room-likes');await likes(host,1);await likes(shop,1);
  await host.click('button.live-room-likes');await likes(host,2);await likes(shop,2);
  viewer=await setup('viewer');await likes(viewer,2);
  await viewer.click('button.live-room-likes');
  for(const page of [host,shop,viewer])await likes(page,3);
  await viewer.evaluate(()=>[...document.querySelectorAll('button')].find(button=>button.textContent.trim()==='Thích').click());
  await likes(viewer,3);
  await viewer.reload({waitUntil:'domcontentloaded'});await likes(viewer,3);
  await host.waitForFunction(()=>document.querySelector('button.live-room-camera'));
  await host.waitForFunction(()=>!document.body.innerText.includes('Không kết nối được máy chủ'));
  const joinedBy=Date.now()+12000;
  while((server.rooms.get('camera-fixture')?.members.size!==3||![...server.io.of('/live-stream').sockets.values()].some(socket=>socket.data.claims.sub==='shop-user'&&socket.data.role==='moderator'))&&Date.now()<joinedBy)await new Promise(resolve=>setTimeout(resolve,50));
  assert.equal(server.rooms.get('camera-fixture')?.members.size,3,'KOL, shop and customer must join the actual Socket.IO room');
  assert.ok([...server.io.of('/live-stream').sockets.values()].some(socket=>socket.data.claims.sub==='shop-user'&&socket.data.role==='moderator'));
  assert.ok(shopJoinRoles.length>0&&shopJoinRoles.every(role=>role==='moderator'),'resolve store ownership before joining; shop must not briefly count as a customer');
  await host.click('button.live-room-camera');
  await viewer.waitForFunction(()=>[...document.querySelectorAll('video')].some(video=>video.srcObject?.getVideoTracks().length&&video.videoWidth>0&&!video.paused));
  const stats=async page=>page.evaluate(async()=>{
   const result=[];for(const peer of window.__livePeers){const stats=await peer.getStats();stats.forEach(row=>{if(row.type==='inbound-rtp')result.push({kind:row.kind,bytesReceived:row.bytesReceived,framesDecoded:row.framesDecoded})})}return result;
  });
  await viewer.waitForFunction(async()=>{for(const peer of window.__livePeers){const rows=await peer.getStats();if([...rows.values()].some(row=>row.type==='inbound-rtp'&&row.kind==='audio'&&row.bytesReceived>0))return true}return false});
  const inbound=await stats(viewer);assert.ok(inbound.some(row=>row.kind==='video'&&row.framesDecoded>0));assert.ok(inbound.some(row=>row.kind==='audio'&&row.bytesReceived>0));
  await shop.waitForFunction(async()=>{for(const peer of window.__livePeers){const rows=await peer.getStats();if([...rows.values()].some(row=>row.type==='inbound-rtp'&&row.kind==='video'&&row.framesDecoded>0))return true}return false});
  const shopInbound=await stats(shop);assert.ok(shopInbound.some(row=>row.kind==='video'&&row.framesDecoded>0));
  for(const page of [host,viewer,shop])await page.waitForFunction(()=>document.querySelector('.live-room-viewers').textContent.trim()==='2');
  assert.equal(await shop.$('button.live-room-camera'),null,'shop receives video without taking the KOL camera controls');
  await shop.screenshot({path:fileURLToPath(new URL('shop.png',artifacts))});
  await viewer.screenshot({path:fileURLToPath(new URL('viewer.png',artifacts))});
  await host.screenshot({path:fileURLToPath(new URL('host.png',artifacts))});
  await viewer.type('input[placeholder="Gửi bình luận hoặc hỏi KOC..."]','Customer sends from the real chat form');
  await viewer.click('button[aria-label="Gửi bình luận"]');
  await host.waitForFunction(()=>document.body.innerText.includes('Customer sends from the real chat form'));
  await viewer.waitForFunction(()=>document.querySelector('input[placeholder="Gửi bình luận hoặc hỏi KOC..."]').value==='');
  await host.type('input[placeholder="Gửi bình luận hoặc hỏi KOC..."]','KOL replies to customer');
  await host.click('button[aria-label="Gửi bình luận"]');
  await viewer.waitForFunction(()=>document.body.innerText.includes('KOL replies to customer'));
  assert.equal(await viewer.$('button.live-room-studio'),null,'customer must not see Host Studio');
  const customerSocket=[...server.io.of('/live-stream').sockets.values()].find(socket=>socket.data.claims.sub==='buyer-user');
  const chatHandlers=customerSocket.listeners('send_live_chat');
  customerSocket.removeAllListeners('send_live_chat');
  customerSocket.on('send_live_chat',(payload)=>chatHandlers[0](payload,()=>{}));
  await viewer.type('input[placeholder="Gửi bình luận hoặc hỏi KOC..."]','Keep draft when acknowledgement is lost');
  await viewer.click('button[aria-label="Gửi bình luận"]');
  await host.waitForFunction(()=>document.body.innerText.includes('Keep draft when acknowledgement is lost'));
  await viewer.waitForFunction(()=>!document.querySelector('button[aria-label="Gửi bình luận"]').disabled);
  assert.equal(await viewer.$eval('input[placeholder="Gửi bình luận hoặc hỏi KOC..."]',input=>input.value),'Keep draft when acknowledgement is lost');
  customerSocket.removeAllListeners('send_live_chat');chatHandlers.forEach(handler=>customerSocket.on('send_live_chat',handler));
  await viewer.click('button[aria-label="Gửi bình luận"]');
  await viewer.waitForFunction(()=>document.querySelector('input[placeholder="Gửi bình luận hoặc hỏi KOC..."]').value==='');
  assert.equal(server.rooms.get('camera-fixture').messages.filter(message=>message.text==='Keep draft when acknowledgement is lost').length,1,'retrying after a lost ACK must not duplicate the message');
  // The same signaling connection must actually carry a customer message, not an optimistic local echo.
  const {io}=require('socket.io-client');
  observer=io(`http://127.0.0.1:${relayPort}/live-stream`,{auth:{token:tokens.viewer},transports:['websocket']});
  await new Promise(resolve=>observer.once('connect',resolve));
  const duplicate=await observer.emitWithAck('join_live_room',{sessionId:'camera-fixture',requestedRole:'viewer'});
  assert.equal(duplicate.viewerCount,2,'opening the same account twice must not inflate the eye counter');
  assert.equal(duplicate.likesCount,3,'late joiners get the same shared heart count');
  await observer.emitWithAck('send_live_chat',{sessionId:'camera-fixture',text:'Verified live chat'});
  await host.waitForFunction(()=>document.body.innerText.includes('Verified live chat'));
  const room=server.rooms.get('camera-fixture'),publisher=server.io.of('/live-stream').sockets.get(room.hostId);
  publisher.emit('product_pinned_changed',{productIndex:1,productId:'dress-a'});
  await viewer.evaluate(()=>{for(const peer of window.__livePeers){if(peer.connectionState!=='closed'){peer.close();peer.onconnectionstatechange?.(new Event('connectionstatechange'));}}});
  await viewer.waitForFunction(()=>[...document.querySelectorAll('video')].every(video=>!video.srcObject));
  await viewer.evaluate(()=>[...document.querySelectorAll('button')].find(button=>button.textContent==='Kết nối lại camera').click());
  await viewer.waitForFunction(async()=>{for(const peer of window.__livePeers){if(peer.connectionState!=='connected')continue;const rows=await peer.getStats();if([...rows.values()].some(row=>row.type==='inbound-rtp'&&row.kind==='video'&&row.framesDecoded>0))return true}return false});
  // Stop and restart the actual media; the viewer must receive a new decoded stream.
  await host.click('button.live-room-camera');
  await viewer.waitForFunction(()=>[...document.querySelectorAll('video')].every(video=>!video.srcObject));
  await host.click('button.live-room-camera');
  await viewer.waitForFunction(()=>[...document.querySelectorAll('video')].some(video=>video.srcObject?.getVideoTracks().length&&video.videoWidth>0&&!video.paused));
  session.status='ENDED';
  await viewer.waitForFunction(()=>document.body.innerText.includes('Phiên đã kết thúc'));
  await host.waitForFunction(()=>[...document.querySelectorAll('video')].every(video=>!video.srcObject||video.srcObject.getTracks().every(track=>track.readyState==='ended')));
  observer.disconnect();
  assert.deepEqual(apiWrites,[],'Spring room must not call unimplemented legacy interaction/pinning/governance APIs');
  assert.deepEqual(errors,[]);
  await writeFile(new URL('verification.json',artifacts),JSON.stringify({at:new Date().toISOString(),media:'browser synthetic camera and microphone',api:'isolated Spring-shaped fixtures',inbound,shopInbound,kolAndShopAudience:1,uniqueConcurrentAudience:2,sharedHearts:3,reloadRestoresHearts:true,mediaReconnect:true,stopRestart:true,closedOnEnd:true},null,2));
 }catch(error){console.error('Camera test:',errors,{host:await host?.evaluate(()=>document.body.innerText.slice(0,1200)),viewer:await viewer?.evaluate(()=>document.body.innerText.slice(0,1200)),rooms:[...server.rooms.values()].map(room=>({members:room.members.size,publishing:room.publishing}))});throw error}
 finally{observer?.disconnect();await browser.close();await server.close()}
});
