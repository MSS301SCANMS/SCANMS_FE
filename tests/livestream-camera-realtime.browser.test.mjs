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

test('real WebRTC carries video and microphone between isolated KOL and customer browsers',{
 skip:!base||!executablePath||!existsSync(executablePath),timeout:65000,
},async()=>{
 const origin=new URL(base).origin;assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
 const {privateKey,publicKey}=await generateKeyPair('RS256');
 const token=async(sub,roles)=>new SignJWT({realm_access:{roles},name:sub}).setSubject(sub).setIssuer('fixture-live').setProtectedHeader({alg:'RS256'}).setExpirationTime('10m').sign(privateKey);
 const tokens={host:await token('kol-user',['KOL_CTV']),viewer:await token('buyer-user',['USER'])};
 const session={livestreamId:'camera-fixture',storeId:'store-a',title:'Camera and microphone verification',status:'LIVE',productRefs:{productIds:['shirt-a','dress-a']},collaboratorRefs:{collaboratorIds:['kol-a']},participantRefs:{creatorName:'Fixture KOL',collaboratorResponses:{'kol-a':'ACCEPTED'}}};
 const server=createLiveServer({origins:[origin],pollMs:200,verifyToken:async token=>(await jwtVerify(token,publicKey,{issuer:'fixture-live'})).payload,
  fetcher:async url=>Response.json({result:url.endsWith('/collaborators/me')?{collaboratorId:'kol-a',approvalStatus:'APPROVED'}:url.includes('/referrals/livestream-access?')?{approvalStatus:'APPROVED',collaboratorId:'kol-a',storeId:'store-a'}:session}),
 });
 await new Promise((resolve,reject)=>{server.http.once('error',reject);server.http.listen(8090,'127.0.0.1',resolve)});
 const browser=await puppeteer.launch({executablePath,headless:true,args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream','--autoplay-policy=no-user-gesture-required']});
 const errors=[],apiWrites=[];let host,viewer;
 const artifacts=new URL('../.qa-artifacts/livestream-camera/',import.meta.url);
 await mkdir(artifacts,{recursive:true});
 try{
  const setup=async(kind)=>{
   const context=await browser.createBrowserContext();await context.overridePermissions(origin,['camera','microphone']);
   const page=await context.newPage();page.setDefaultTimeout(15000);await page.setViewport({width:1440,height:1000});
   page.on('pageerror',e=>{if(!e.message.includes('WebSocket closed without opened'))errors.push(kind+': '+e.message)});
   await page.evaluateOnNewDocument((kind,token)=>{
    localStorage.clear();sessionStorage.clear();localStorage.setItem('token',token);
    localStorage.setItem('user',JSON.stringify({id:kind==='host'?'kol-user':'buyer-user',fullName:kind==='host'?'Fixture KOL':'Fixture buyer',role:kind==='host'?'COLLABORATOR':'CUSTOMER',roles:[kind==='host'?'KOL_CTV':'USER']}));
    localStorage.setItem('scanms-active-workspace',kind==='host'?'kol':'customer');localStorage.setItem('scanms-current-role',kind==='host'?'kol':'customer');
    const Original=window.RTCPeerConnection;window.__livePeers=[];
    window.RTCPeerConnection=class extends Original{constructor(config){super({...config,iceServers:[]});window.__livePeers.push(this)}};
   },kind,tokens[kind]);
   await page.setRequestInterception(true);
   page.on('request',request=>{
    const url=new URL(request.url());
    if(url.pathname.startsWith('/api/')){
     const headers={'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Credentials':'true','Access-Control-Allow-Headers':request.headers()['access-control-request-headers']||'authorization,content-type','Access-Control-Allow-Methods':'GET,POST,OPTIONS'};
     if(request.method()==='OPTIONS')return request.respond({status:204,headers});
     if(request.method()!=='GET'){apiWrites.push(url.pathname);return request.abort()}
     let result=[];
     if(url.pathname.endsWith('/livestreams/camera-fixture'))result=session;
     if(url.pathname.endsWith('/stores/public/id/store-a'))result={id:'store-a',name:'Fixture shop'};
     if(url.pathname.endsWith('/collaborators'))result=[{collaboratorId:'kol-a',userId:'kol-user',approvalStatus:'APPROVED'}];
     if(url.pathname.includes('/landing')){const id=url.pathname.includes('shirt-a')?'shirt-a':'dress-a';result={product:{id,title:id==='shirt-a'?'Cotton shirt':'Red dress',price:269000,stockQuantity:10,variants:[{id:'variant-'+id,stockQuantity:10,price:269000,isActive:true}]}}}
     if(url.pathname.endsWith('/users'))result={userId:kind==='host'?'kol-user':'buyer-user',roles:[kind==='host'?'KOL_CTV':'USER'],fullName:kind==='host'?'Fixture KOL':'Fixture buyer',status:'ACTIVE'};
     return request.respond({status:200,headers,contentType:'application/json',body:JSON.stringify({code:200,result})});
    }
    if(url.origin!==origin&&url.port!=='8090'&&!['blob:','data:'].includes(url.protocol))return request.abort();return request.continue();
   });
   await page.goto(origin+'/live/camera-fixture',{waitUntil:'domcontentloaded'});await page.waitForSelector('.live-room-header');return page;
  };
  host=await setup('host');viewer=await setup('viewer');
  await host.waitForFunction(()=>document.querySelector('button.live-room-camera'));
  await host.waitForFunction(()=>!document.body.innerText.includes('Không kết nối được máy chủ'));
  const joinedBy=Date.now()+12000;
  while(server.rooms.get('camera-fixture')?.members.size!==2&&Date.now()<joinedBy)await new Promise(resolve=>setTimeout(resolve,50));
  assert.equal(server.rooms.get('camera-fixture')?.members.size,2,'both browser accounts must join the actual Socket.IO room');
  await host.click('button.live-room-camera');
  await viewer.waitForFunction(()=>[...document.querySelectorAll('video')].some(video=>video.srcObject?.getVideoTracks().length&&video.videoWidth>0&&!video.paused));
  const stats=async page=>page.evaluate(async()=>{
   const result=[];for(const peer of window.__livePeers){const stats=await peer.getStats();stats.forEach(row=>{if(row.type==='inbound-rtp')result.push({kind:row.kind,bytesReceived:row.bytesReceived,framesDecoded:row.framesDecoded})})}return result;
  });
  await viewer.waitForFunction(async()=>{for(const peer of window.__livePeers){const rows=await peer.getStats();if([...rows.values()].some(row=>row.type==='inbound-rtp'&&row.kind==='audio'&&row.bytesReceived>0))return true}return false});
  const inbound=await stats(viewer);assert.ok(inbound.some(row=>row.kind==='video'&&row.framesDecoded>0));assert.ok(inbound.some(row=>row.kind==='audio'&&row.bytesReceived>0));
  await viewer.screenshot({path:fileURLToPath(new URL('viewer.png',artifacts))});
  await host.screenshot({path:fileURLToPath(new URL('host.png',artifacts))});
  // The same signaling connection must actually carry a customer message, not an optimistic local echo.
  const {io}=require('socket.io-client');
  const observer=io('http://127.0.0.1:8090/live-stream',{auth:{token:tokens.viewer},transports:['websocket']});
  await new Promise(resolve=>observer.once('connect',resolve));
  await observer.emitWithAck('join_live_room',{sessionId:'camera-fixture',requestedRole:'viewer'});
  await observer.emitWithAck('send_live_chat',{sessionId:'camera-fixture',text:'Verified live chat'});
  await host.waitForFunction(()=>document.body.innerText.includes('Verified live chat'));
  const room=server.rooms.get('camera-fixture'),publisher=server.io.of('/live-stream').sockets.get(room.hostId);
  publisher.emit('product_pinned_changed',{productIndex:1,productId:'dress-a'});
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
  await writeFile(new URL('verification.json',artifacts),JSON.stringify({at:new Date().toISOString(),media:'browser synthetic camera and microphone',api:'isolated Spring-shaped fixtures',inbound,stopRestart:true,closedOnEnd:true},null,2));
 }catch(error){console.error('Camera test:',errors,{host:await host?.evaluate(()=>document.body.innerText.slice(0,1200)),viewer:await viewer?.evaluate(()=>document.body.innerText.slice(0,1200)),rooms:[...server.rooms.values()].map(room=>({members:room.members.size,publishing:room.publishing}))});throw error}
 finally{await browser.close();await server.close()}
});
