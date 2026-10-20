import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import puppeteer from 'puppeteer-core';

const base=process.env.GHN_UI_TEST_URL;
const executablePath=process.env.GHN_UI_BROWSER_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
test('featured stores loop left, hide scrollbar, drag without navigation and preserve the heading', {
  skip:!base||!existsSync(executablePath), timeout:40000,
},async()=>{
  assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
  const browser=await puppeteer.launch({executablePath,headless:true});
  try {
    const page=await browser.newPage();
    await page.setViewport({width:1440,height:1000});
    const stores=Array.from({length:5},(_,i)=>({id:'qa-store-'+i,name:'Gian hàng '+i,category:'Đối tác SCANMS',description:'Gian hàng kiểm thử bố cục và thao tác kéo.',totalProducts:2,rating:4.9,isVerified:true}));
    await page.setRequestInterception(true);
    page.on('request',request=>{
      const url=new URL(request.url());
      if(url.pathname.startsWith('/api/')||url.port==='3000'){
        const headers={'Content-Type':'application/json','Access-Control-Allow-Origin':new URL(base).origin,'Access-Control-Allow-Credentials':'true','Access-Control-Allow-Headers':'content-type,authorization,x-skip-cache'};
        if(request.method()==='OPTIONS')return request.respond({status:204,headers});
        return request.respond({status:200,headers,body:JSON.stringify({success:true,data:url.pathname==='/api/stores/marketplace'?stores:[]})});
      }
      if(url.origin!==new URL(base).origin&&!['data:','blob:'].includes(url.protocol))return request.abort();
      return request.continue();
    });
    await page.goto(base+'/');
    const rail='#featured-stores .featured-store-rail';
    await page.waitForSelector(rail);
    await page.$eval(rail,el=>el.scrollIntoView({block:'center'}));
    await page.mouse.move(0,0);
    assert.match(await page.$eval('#featured-stores-title',el=>el.innerText),/Gian hàng đối tác tiêu biểu/);
    assert.doesNotMatch(await page.$eval('#featured-stores',el=>el.innerText),/Mỗi gian hàng một lựa chọn mới/);
    assert.equal(await page.$eval(rail,el=>getComputedStyle(el).scrollbarWidth),'none');
    const start=await page.$eval(rail,el=>el.scrollLeft);
    await page.waitForFunction((selector,start)=>document.querySelector(selector).scrollLeft>start+10,{},rail,start);
    const bounds=await (await page.$(rail)).boundingBox();
    await page.mouse.move(bounds.x+220,bounds.y+110);
    const hovered=await page.$eval(rail,el=>el.scrollLeft);
    await page.waitForFunction((selector,start)=>document.querySelector(selector).scrollLeft>start+10,{},rail,hovered);
    const beforeDrag=await page.$eval(rail,el=>el.scrollLeft);
    await page.mouse.down();
    await page.mouse.move(bounds.x+70,bounds.y+110,{steps:12});
    const held=await page.$eval(rail,el=>el.scrollLeft);
    await delay(400);
    assert.ok(Math.abs(await page.$eval(rail,el=>el.scrollLeft)-held)<2,'autoplay pauses while dragging');
    await page.mouse.up();
    assert.ok(await page.$eval(rail,el=>el.scrollLeft)>beforeDrag+100);
    assert.equal(new URL(page.url()).pathname,'/','drag never activates a shop link');
    assert.equal(await page.$('button[aria-label="Tạm dừng chạy gian hàng"]'),null);
    const released=await page.$eval(rail,el=>el.scrollLeft);
    await page.waitForFunction((selector,start)=>document.querySelector(selector).scrollLeft>start+10,{},rail,released);
    await page.mouse.move(bounds.x+100,bounds.y-30);
    const overHeading=await page.$eval(rail,el=>el.scrollLeft);
    await page.waitForFunction((selector,start)=>document.querySelector(selector).scrollLeft>start+10,{},rail,overHeading);
    await page.mouse.move(0,0);
    await page.$eval(rail,el=>{const size=el.firstElementChild.getBoundingClientRect().width;el.scrollLeft=size*2-2;});
    await page.waitForFunction(selector=>{const el=document.querySelector(selector);const size=el.firstElementChild.getBoundingClientRect().width;return el.scrollLeft>=size&&el.scrollLeft<size*1.2}, {},rail);
    assert.equal(await page.$$eval('#featured-stores [aria-hidden="true"] a',els=>els.every(el=>el.tabIndex===-1)),true);
    await (await page.$('#featured-stores')).screenshot({path:join(tmpdir(),'scanms-featured-stores-desktop.png')});
    await page.setViewport({width:390,height:844});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    await (await page.$('#featured-stores')).screenshot({path:join(tmpdir(),'scanms-featured-stores-mobile.png')});
    await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
    await delay(100);
    const reduced=await page.$eval(rail,el=>el.scrollLeft);
    await delay(400);
    assert.ok(Math.abs(await page.$eval(rail,el=>el.scrollLeft)-reduced)<2);
    await page.$eval(rail,el=>el.focus());
    const keyboardStart=await page.$eval(rail,el=>el.scrollLeft);
    await page.keyboard.press('ArrowRight');
    assert.notEqual(await page.$eval(rail,el=>el.scrollLeft),keyboardStart);
    await page.$eval(rail,el=>{el.scrollLeft=el.firstElementChild.getBoundingClientRect().width;});
    await page.click('#featured-stores .featured-store-group:nth-child(2) article:first-child a');
    await page.waitForFunction(()=>location.pathname==='/shops/qa-store-0');
  }finally{await browser.close();}
});
