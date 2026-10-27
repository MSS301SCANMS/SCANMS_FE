import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,mkdirSync} from 'node:fs';
import puppeteer from 'puppeteer-core';
const base=process.env.GHN_UI_TEST_URL,executablePath=process.env.GHN_UI_BROWSER_PATH;
test('homepage shows actual buyer ratings per product and an honest empty state on desktop and mobile',{
 skip:!base||!executablePath||!existsSync(executablePath),timeout:40000,
},async()=>{
 const origin=new URL(base).origin;assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
 const browser=await puppeteer.launch({executablePath,headless:true});const errors=[];
 try{
  const page=await browser.newPage();page.setDefaultTimeout(10000);await page.setViewport({width:1440,height:1100});
  page.on('pageerror',e=>{if(!e.message.includes('WebSocket closed'))errors.push(e.message);});
  await page.evaluateOnNewDocument(()=>{localStorage.clear();});
  await page.setRequestInterception(true);page.on('request',request=>{
   const url=new URL(request.url()),headers={'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Credentials':'true','Access-Control-Allow-Headers':request.headers()['access-control-request-headers']||'content-type','Access-Control-Allow-Methods':'GET,POST,OPTIONS'};
   if(request.method()==='OPTIONS')return request.respond({status:204,headers});
   const respond=result=>request.respond({status:200,headers,contentType:'application/json',body:JSON.stringify({code:200,result})});
   if(url.pathname.startsWith('/api/')){
    if(url.pathname.endsWith('/public/products'))return respond({items:[
      {id:'reviewed-shirt',title:'Sơ mi có đánh giá',price:329000,rating:4.67,reviewCount:12,stockQuantity:393,imageUrl:origin+'/reference/assets/sample-product.png',store:{id:'shop',name:'Mộc Basics'}},
      {id:'unreviewed-shirt',title:'Sơ mi chưa đánh giá',price:269000,rating:null,reviewCount:0,stockQuantity:10,imageUrl:origin+'/reference/assets/sample-product.png',store:{id:'shop',name:'Mộc Basics',rating:5,reviewCount:100}},
    ],total:2});
    return respond([]);
   }
   if(url.origin!==origin&&!['data:','blob:'].includes(url.protocol))return request.abort();return request.continue();
  });
  await page.goto(origin+'/',{waitUntil:'domcontentloaded'});await page.waitForSelector('[data-product-rating]');
  const ratings=await page.$$eval('article [data-product-rating]',nodes=>nodes.map(n=>({text:n.textContent,label:n.getAttribute('aria-label')})));
  assert.equal(ratings.length,2);assert.match(ratings[0].text,/4,7.*12 đánh giá/);assert.match(ratings[0].label,/khách đã mua/);
  assert.equal(ratings[1].text,'Chưa có đánh giá');assert.ok(!ratings[1].text.includes('100'),'never use the store rating for an unreviewed product');
  await page.setViewport({width:390,height:844});await page.$eval('[data-product-rating]',node=>node.closest('article').scrollIntoView({behavior:'instant',block:'center'}));
  await page.waitForFunction(()=>{const rect=document.querySelector('[data-product-rating]').getBoundingClientRect();return rect.top>=0&&rect.bottom<=innerHeight;});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  mkdirSync('../.validation/marketplace-rating-ui',{recursive:true});await page.screenshot({path:'../.validation/marketplace-rating-ui/mobile.png'});
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
});
