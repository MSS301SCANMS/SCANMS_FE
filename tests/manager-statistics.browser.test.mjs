import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync } from 'node:fs';
import puppeteer from 'puppeteer-core';
const base = process.env.GHN_UI_TEST_URL;
const executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
test('manager statistics periods, rankings, charts, empty data and retry stay synchronized', { skip: !base || !existsSync(executablePath), timeout: 45000 }, async () => {
  assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
  const browser=await puppeteer.launch({ executablePath, headless:true });
  try {
    const page=await browser.newPage(); await page.setViewport({width:1440,height:1000});
    await page.evaluateOnNewDocument(()=>{
      localStorage.setItem('token','isolated-statistics-manager');
      localStorage.setItem('user',JSON.stringify({id:'manager-test',role:'SYSTEM_MANAGER',fullName:'Manager kiểm thử'}));
      localStorage.setItem('scanms-active-workspace','admin');localStorage.setItem('scanms-current-role','admin');
    });
    const reads=[],errors=[]; let fail=false;
    page.on('pageerror',error=>errors.push(error.message));
    await page.setRequestInterception(true);
    page.on('request',request=>{void(async()=>{
      const url=new URL(request.url());
      if(url.pathname.startsWith('/api/')){
        const headers={'Access-Control-Allow-Origin':new URL(base).origin,'Access-Control-Allow-Credentials':'true','Access-Control-Allow-Headers':'authorization,content-type','Access-Control-Allow-Methods':'GET,OPTIONS'};
        if(request.method()==='OPTIONS')return request.respond({status:204,headers});
        assert.equal(request.method(),'GET','statistics must not mutate data');
        let result=[],status=200,message;
        if(url.pathname.endsWith('/users/me'))result={userId:'manager-test',roles:['MANAGER'],status:'ACTIVE',fullName:'Manager kiểm thử'};
        if(url.pathname.endsWith('/orders/statistics')){
          const range=url.searchParams.get('range'), anchor=url.searchParams.get('anchor');reads.push({range,anchor});
          const from=new Date(`${anchor}T00:00:00Z`);
          if(range==='week')from.setUTCDate(from.getUTCDate()-((from.getUTCDay()+6)%7));
          if(range==='month')from.setUTCDate(1);
          if(range==='year')from.setUTCMonth(0,1);
          const until=new Date(from); if(range==='week')until.setUTCDate(until.getUTCDate()+7);if(range==='month')until.setUTCMonth(until.getUTCMonth()+1);if(range==='year')until.setUTCFullYear(until.getUTCFullYear()+1);
          const to=new Date(until);to.setUTCDate(to.getUTCDate()-1);
          const value=range==='week'?70000:range==='year'?900000:120000;
          const empty=anchor.startsWith('2020'); const daily=[];
          for(let day=new Date(from);day<until;day.setUTCDate(day.getUTCDate()+1))daily.push({date:day.toISOString().slice(0,10),orderCount:daily.length===0&&!empty?3:0,paidOrderCount:daily.length===0&&!empty?2:0,revenueVnd:daily.length===0&&!empty?value:0});
          result={range,fromDate:from.toISOString().slice(0,10),toDate:to.toISOString().slice(0,10),generatedAt:new Date().toISOString(),orderCount:empty?0:3,paidOrderCount:empty?0:2,cancelledOrderCount:empty?0:1,revenueVnd:empty?0:value,soldQuantity:empty?0:4,sellingStoreCount:empty?0:1,daily,topStores:empty?[]:[{id:'store-test',name:'Gian hàng kiểm thử',orderCount:2,quantity:4,revenueVnd:value}],topProducts:empty?[]:[{id:'product-test',name:'Sản phẩm kiểm thử',orderCount:2,quantity:4,revenueVnd:value}]};
          if(fail){status=503;message='Dịch vụ thống kê kiểm thử đang bận.';}
          await new Promise(resolve=>setTimeout(resolve,range==='week'?300:40));
        }
        return request.respond({status,headers,contentType:'application/json',body:JSON.stringify({code:status,result,message})});
      }
      if(url.origin!==new URL(base).origin&&!['data:','blob:'].includes(url.protocol))return request.abort();
      return request.continue();
    })().catch(error=>{errors.push(error.message);if(!request.isInterceptResolutionHandled())void request.abort();});});
    await page.goto(`${base}/admin/stats`);await page.waitForSelector('.ms-summary');
    assert.match(await page.$eval('.ms-summary',element=>element.textContent),/120\.000/);
    assert.match(await page.$eval('.ms-ranking tbody',element=>element.textContent),/Gian hàng kiểm thử/);
    await page.waitForSelector('.ms-chart .recharts-surface');
    await page.select('[aria-label="Kỳ thống kê"]','week');
    await page.waitForFunction(()=>document.querySelector('.ms-summary')?.textContent.includes('70.000'));
    assert.equal(reads.at(-1).range,'week');
    await page.select('[aria-label="Kỳ thống kê"]','year');
    await page.waitForFunction(()=>document.querySelector('.ms-summary')?.textContent.includes('900.000'));
    await page.waitForSelector('.ms-chart .recharts-surface');
    await page.evaluate(()=>[...document.querySelectorAll('.ms-ranking-tabs button')].find(button=>button.textContent==='Sản phẩm').click());
    assert.match(await page.$eval('.ms-ranking tbody',element=>element.textContent),/Sản phẩm kiểm thử/);
    await page.select('[aria-label="Chỉ số biểu đồ"]','paidOrderCount');
    await page.click('[aria-label="Kỳ trước"]');
    await page.waitForFunction(()=>!document.querySelector('[aria-label="Làm mới thống kê"]').disabled);
    assert.equal(Number(reads.at(-1).anchor.slice(0,4)),Number(reads[0].anchor.slice(0,4))-1);
    await page.evaluate(()=>{const input=document.querySelector('[aria-label="Ngày trong kỳ thống kê"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'2020-02-15');input.dispatchEvent(new Event('input',{bubbles:true}));});
    await page.waitForSelector('.ms-chart-empty');
    assert.match(await page.$eval('.ms-ranking',element=>element.textContent),/Chưa có dữ liệu xếp hạng/);
    fail=true;await page.click('[aria-label="Làm mới thống kê"]');await page.waitForSelector('[role=alert].ms-error');
    assert.equal(await page.$('.ms-summary'),null,'a failed request must not display stale totals or fake zeros');
    fail=false;await page.click('.ms-error button');await page.waitForSelector('.ms-summary');
    await page.evaluate(()=>[...document.querySelectorAll('.ms-toolbar button')].find(button=>button.textContent.includes('hiện tại')).click());
    await page.waitForFunction(()=>document.querySelector('.ms-summary')?.textContent.includes('900.000'));
    mkdirSync('.qa-artifacts/manager-statistics',{recursive:true});
    for(const width of [1440,868,390]){
      await page.setViewport({width,height:1000});await new Promise(resolve=>setTimeout(resolve,150));
      assert.ok(await page.$eval('.manager-statistics',element=>element.scrollWidth-element.clientWidth<=1),'only ranking table scrolls horizontally');
      assert.equal((await page.$$('.ms-summary-card')).length,4);
      await page.screenshot({path:`.qa-artifacts/manager-statistics/stats-${width}.png`,fullPage:true});
    }
    assert.deepEqual(errors,[]);
  }finally{await browser.close();}
});
