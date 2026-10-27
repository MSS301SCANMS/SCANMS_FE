import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync } from 'node:fs';
import puppeteer from 'puppeteer-core';
const base = process.env.GHN_UI_TEST_URL;
const executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

test('KOL proposes only 1–3 points, shop approves/rejects/ends, with correct total and mobile layout', {
  skip: !base || !existsSync(executablePath), timeout: 45000,
}, async () => {
  const origin = new URL(base).origin;
  assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
  const browser = await puppeteer.launch({ executablePath, headless: true });
  const page = await browser.newPage(); page.setDefaultTimeout(8000);
  const rows = [], writes = [], errors = [];
  let currentMode = 'kol', fail = false;
  await page.evaluateOnNewDocument(() => {
    localStorage.clear(); localStorage.setItem('token','isolated-product-deal-fixture');
    localStorage.setItem('user',JSON.stringify({id:'fixture-kol',role:'COLLABORATOR'}));
  });
  page.on('pageerror', error => { if (error.message !== 'WebSocket closed without opened.') errors.push(error.message); });
  await page.setRequestInterception(true);
  page.on('request', request => { void (async () => {
    const url = new URL(request.url());
    const headers = { 'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Credentials':'true',
      'Access-Control-Allow-Headers':request.headers()['access-control-request-headers'] || 'authorization,content-type', 'Access-Control-Allow-Methods':'GET,POST,OPTIONS' };
    const respond = (result,status=200) => request.respond({status,headers,contentType:'application/json',body:JSON.stringify({code:status,result,message:status===503?'QA retry required':'Success'})});
    if(request.method()==='OPTIONS')return request.respond({status:204,headers});
    if(url.pathname.startsWith('/api/')) {
      if(url.pathname.endsWith('/public/products'))return respond({items:[{id:'shirt',title:'Áo sơ mi caro xanh dài tay Sora',price:299000,imageUrl:'/assets/products/sora-caro-shirt.webp',status:'ACTIVE',storeId:'shop',store:{id:'shop',name:'Sora Skin'}}]});
      if(url.pathname.endsWith('/commission-deals/rate'))return respond({baseRate:10,extraPoints:0,totalRate:10,policyId:'policy'});
      if(url.pathname.endsWith('/commission-deals/mine')||url.pathname.endsWith('/commission-deals/shop'))return respond(rows);
      if(url.pathname.endsWith('/commission-deals')&&request.method()==='POST'){
        const input=JSON.parse(request.postData());writes.push(input);if(fail)return respond(null,503);
        assert.ok([1,2,3].includes(input.extraPoints));
        const row={...input,id:'deal-'+rows.length,productName:'Áo sơ mi caro xanh dài tay Sora',imageUrl:'/assets/products/sora-caro-shirt.webp',storeName:'Sora Skin',collaboratorName:'KOL thử nghiệm',baseRate:10,totalRate:null,status:'PENDING',createdAt:new Date().toISOString()};rows.push(row);return respond(row);
      }
      if(url.pathname.endsWith('/respond')){
        assert.equal(currentMode,'shop');const input=JSON.parse(request.postData());writes.push(input);
        const row=rows.find(row=>url.pathname.includes('/'+row.id+'/'));row.status=input.decision;row.response=input.response;
        if(row.status==='APPROVED'){row.totalRate=10+row.extraPoints;row.approvedAt=new Date().toISOString()}
        return respond(row);
      }
      if(url.pathname.endsWith('/cancel')){const row=rows.find(row=>url.pathname.includes('/'+row.id+'/'));row.status='CANCELLED';return respond(row)}
      return respond([]);
    }
    if(url.pathname==='/__product-deals')return request.respond({contentType:'text/html; charset=utf-8',body:`<html><body><div id="root" style="max-width:1100px;margin:24px auto"></div><script type="module">
      import RefreshRuntime from '/@react-refresh';RefreshRuntime.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>type=>type;window.__vite_plugin_react_preamble_installed__=true;import '/src/index.css';
      const source=await(await fetch('/src/components/affiliate/ProductCommissionDeals.tsx')).text();
      const React=await import(source.match(/["]([^"]*react[.]js[^"]*)["]/)[1]),dom=await import('/node_modules/.vite/deps/react-dom_client.js');
      const {ProductCommissionDeals}=await import('/src/components/affiliate/ProductCommissionDeals.tsx');const h=React.createElement||React.default.createElement;
      const root=(dom.createRoot||dom.default.createRoot)(document.getElementById('root'));window.renderDeals=mode=>root.render(h(ProductCommissionDeals,{mode,key:mode}));window.renderDeals('kol');
    </script></body></html>`});
    if(url.origin!==origin&&!['data:','blob:'].includes(url.protocol))return request.abort();return request.continue();
  })().catch(error=>{errors.push(error.message);void request.abort().catch(()=>{});}); });
  const click = text => page.evaluate(text=>[...document.querySelectorAll('button')].find(button=>button.textContent.trim()===text)?.click(),text);
  try {
    await page.setViewport({width:1440,height:1000});await page.goto(origin+'/__product-deals');
    await page.waitForFunction(()=>document.body.textContent.includes('Chưa có đề xuất'));
    await click('Đề xuất tăng hoa hồng');
    await page.waitForSelector('[aria-label="Sản phẩm đề xuất hoa hồng"]');
    for (const viewport of [{width:1366,height:450},{width:390,height:450}]) {
      await page.setViewport(viewport);
      await page.waitForFunction(() => {
        const area=document.querySelector('.product-deals-detail')?.parentElement;
        const modal=area?.parentElement;
        return area && getComputedStyle(area).overflowY==='auto' && area.scrollHeight>area.clientHeight && modal.firstElementChild.getBoundingClientRect().top>=0 && modal.lastElementChild.getBoundingClientRect().bottom<=innerHeight;
      });
      const bounds = await page.evaluate(() => {
        const content = document.querySelector('.product-deals-detail');
        const scroll = content.parentElement;
        const modal = scroll.parentElement;
        const header = modal.firstElementChild;
        const footer = modal.lastElementChild;
        return {scrollable:scroll.scrollHeight>scroll.clientHeight,overflow:getComputedStyle(scroll).overflowY,
          top:header.getBoundingClientRect().top,bottom:footer.getBoundingClientRect().bottom,height:innerHeight};
      });
      assert.ok(bounds.scrollable); assert.equal(bounds.overflow,'auto');
      assert.ok(bounds.top>=0 && bounds.bottom<=bounds.height);
      await page.evaluate(() => document.querySelector('.product-deals-detail').parentElement.scrollTop=0);
      const area = await page.$eval('.product-deals-detail', el => { const r=el.parentElement.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}; });
      await page.mouse.move(area.x,area.y);await page.mouse.wheel({deltaY:600});
      await page.waitForFunction(() => document.querySelector('.product-deals-detail').parentElement.scrollTop>0);
      await page.mouse.wheel({deltaY:-1200});
      await page.waitForFunction(() => document.querySelector('.product-deals-detail').parentElement.scrollTop===0);
    }
    await page.setViewport({width:1440,height:1000});
    await page.click('[aria-label="Sản phẩm đề xuất hoa hồng"]');await page.waitForSelector('[role="option"]');await page.click('[role="option"]');
    await page.waitForFunction(()=>document.querySelector('.product-deals-summary strong')?.textContent==='11%');
    assert.equal(await page.$$eval('.product-deals-choices button', buttons=>buttons.length),3);
    await page.click('.product-deals-choices button:nth-child(3)');
    assert.equal(await page.$eval('.product-deals-summary strong',el=>el.textContent),'13%');
    await page.type('[aria-label="Lời đề xuất hoa hồng"]','Tôi sẽ giới thiệu áo trên kênh TikTok của mình.');
    fail=true;await click('Gửi đề xuất');await page.waitForSelector('[role="alert"]');
    assert.equal(rows.length,0);assert.ok(await page.$eval('textarea',el=>el.value.length>10));
    fail=false;await click('Gửi đề xuất');await page.waitForSelector('.product-deals-row');
    assert.equal(rows[0].status,'PENDING');assert.equal(rows[0].extraPoints,3);
    assert.equal(await page.$$eval('button',buttons=>buttons.filter(b=>b.textContent.includes('Duyệt 13%')).length),0);
    currentMode='shop';await page.evaluate(()=>window.renderDeals('shop'));await page.waitForSelector('.product-deals-row');await click('Xem đề xuất');
    await page.waitForFunction(()=>[...document.querySelectorAll('button')].some(button=>button.textContent.includes('Duyệt 13%')));
    await click('Duyệt 13%');await page.waitForFunction(()=>document.querySelector('.product-deals-status')?.textContent==='Đang áp dụng');
    assert.equal(rows[0].totalRate,13);
    await page.setViewport({width:390,height:1000});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    mkdirSync('../.run-logs',{recursive:true});await page.screenshot({path:'../.run-logs/product-commission-deals-mobile.png',fullPage:true});
    await click('Xem đề xuất');await click('Kết thúc cho đơn mới');await page.waitForFunction(()=>document.querySelector('.product-deals-status')?.textContent==='Đã kết thúc');
    assert.equal(rows[0].status,'ENDED');assert.deepEqual(errors,[]);
  } finally {await browser.close()}
});
