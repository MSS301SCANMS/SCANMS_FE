import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const base = process.env.GHN_UI_TEST_URL;
const executablePath = process.env.GHN_UI_BROWSER_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
test('checkout explains incomplete saved address, computes a real quote total and retries failed quotes', {
  skip: !base || !existsSync(executablePath), timeout: 40000,
}, async () => {
  assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
  const browser = await puppeteer.launch({ executablePath, headless: true });
  const address = { id:'qa-address', fullName:'Khách kiểm thử', phoneNumber:'0912345678', detailAddress:'tổ 2', provinceCode:'6', districtCode:'58', wardCode:'1879', provinceName:'Tỉnh Bắc Kạn', districtName:'Thành Phố Bắc Kạn', wardName:'Phường Nguyễn Thị Minh Khai', isDefault:true };
  const provinces = [{ code:6, name:address.provinceName, districts:[{ code:58, name:address.districtName, wards:[{code:1879,name:address.wardName}] }] }];
  let quotes = 0, fail = false;
  try {
    const page = await browser.newPage();
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    page.setDefaultTimeout(10000);
    await page.setViewport({ width:1366, height:900 });
    await page.evaluateOnNewDocument(address => {
      localStorage.setItem('token','fixture-only');
      localStorage.setItem('user',JSON.stringify({id:'qa-customer',fullName:address.fullName,role:'CUSTOMER'}));
      localStorage.setItem('scanms_cached_addresses',JSON.stringify([address]));
    }, address);
    await page.setRequestInterception(true);
    page.on('request',request => {
      const url = new URL(request.url());
      if (url.hostname === 'provinces.open-api.vn') return request.respond({status:200,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:JSON.stringify(provinces)});
      if (url.pathname.startsWith('/api/') || url.port === '3000') {
        const headers = {'Content-Type':'application/json','Access-Control-Allow-Origin':new URL(base).origin,'Access-Control-Allow-Credentials':'true','Access-Control-Allow-Headers':'content-type,authorization,x-skip-cache','Access-Control-Allow-Methods':'GET,POST,OPTIONS'};
        if (request.method()==='OPTIONS') return request.respond({status:204,headers});
        let data=[];
        if (url.pathname === '/api/customer/addresses') data=[address];
        if (url.pathname.includes('/stores/public/id/')) data={id:'qa-store',name:'Shop kiểm thử',policyReturn:'Đổi trả 14 ngày',policyWarranty:'Theo chính sách Shop'};
        if (url.pathname === '/api/shipping/ghn/quote-address') {
          quotes++;
          assert.equal(JSON.parse(request.postData()).storeId,'qa-store');
          if (fail) return request.respond({status:503,headers,body:JSON.stringify({message:'GHN tạm thời không phản hồi'})});
          data={totalFee:29001};
        }
        return request.respond({status:200,headers,body:JSON.stringify({success:true,data})});
      }
      if (url.pathname === '/__checkout-shipping-test') return request.respond({status:200,contentType:'text/html',body:`<html><body><div id="root"></div><script type="module">
        import RefreshRuntime from '/@react-refresh'; RefreshRuntime.injectIntoGlobalHook(window); window.$RefreshReg$=()=>{}; window.$RefreshSig$=()=>type=>type; window.__vite_plugin_react_preamble_installed__=true;
        const source=await(await fetch('/src/components/checkout/GuestCheckoutModal.tsx')).text(); const version=source.match(/react[.]js([?]v=[^"]+)/)?.[1]||'';
        const React=await import('/node_modules/.vite/deps/react.js'+version); const dom=await import('/node_modules/.vite/deps/react-dom_client.js'+version); const {BrowserRouter}=await import('/node_modules/.vite/deps/react-router-dom.js'+version);
        const {CartProvider}=await import(source.match(/[\"]([^\"]*CartContext[.]tsx[^\"]*)[\"]/)[1]); const {ScanmsChatProvider}=await import(source.match(/[\"]([^\"]*ScanmsChatContext[.]tsx[^\"]*)[\"]/)[1]); const {GuestCheckoutModal}=await import('/src/components/checkout/GuestCheckoutModal.tsx');
        const h=React.createElement||React.default.createElement; (dom.createRoot||dom.default.createRoot)(document.getElementById('root')).render(h(BrowserRouter,null,h(CartProvider,null,h(ScanmsChatProvider,null,h(GuestCheckoutModal,{isOpen:true,onClose:()=>{},product:{id:'00000000-0000-4000-8000-000000000001',title:'Sản phẩm kiểm thử',price:200000,stockQuantity:10},store:{id:'qa-store',name:'Shop kiểm thử'}})))));
      </script></body></html>`});
      if (url.origin !== new URL(base).origin && !['data:','blob:'].includes(url.protocol)) return request.abort();
      return request.continue();
    });
    await page.goto(base+'/__checkout-shipping-test');
    await page.waitForFunction(() => document.body.innerText.includes('Bổ sung địa chỉ chi tiết')).catch(async error=>{throw new Error(`${error.message}: ${errors.join('; ')} ${await page.$eval('body',el=>el.innerText.slice(-1800))}`);});
    assert.equal(quotes,0,'short saved address does not request a quote');
    assert.doesNotMatch(await page.$eval('body',el=>el.innerText),/Đang tính cước/);
    assert.match(await page.$eval('body',el=>el.innerText),/Chờ tính phí ship/);
    await page.evaluate(()=>[...document.querySelectorAll('button')].find(button=>button.textContent==='Thay Đổi')?.click());
    await page.waitForSelector('#checkout-shipping-address');
    await page.type('#checkout-shipping-address',' ngõ 10');
    await page.waitForFunction(() => document.body.innerText.includes('229.001'));
    assert.ok(quotes>0);
    fail=true;
    await page.type('#checkout-shipping-address','A');
    await page.waitForFunction(() => document.body.innerText.includes('GHN tạm thời không phản hồi'));
    assert.match(await page.$eval('body',el=>el.innerText),/Chờ tính phí ship/);
    fail=false;
    const before=quotes;
    await page.evaluate(()=>[...document.querySelectorAll('button')].find(button=>button.textContent==='Tính lại').click());
    await page.waitForFunction(() => document.body.innerText.includes('229.001'));
    assert.ok(quotes>before);
  } finally { await browser.close(); }
});
