import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import puppeteer from 'puppeteer-core';

const base = process.env.GHN_UI_TEST_URL;
const executablePath = process.env.GHN_UI_BROWSER_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

test('confirmation layout preserves totals, copy/tracking and real wallet/PayOS states', {
  skip: !base || !existsSync(executablePath), timeout: 40000,
}, async () => {
  const origin = new URL(base).origin;
  assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
  const browser = await puppeteer.launch({ executablePath, headless: true });
  try {
    await browser.defaultBrowserContext().overridePermissions(origin, ['clipboard-read', 'clipboard-write', 'clipboard-sanitized-write']);
    const page = await browser.newPage();
    page.setDefaultTimeout(8000);
    // This isolated view has no socket behavior; disable Vite's development HMR socket.
    await page.evaluateOnNewDocument(() => {
      window.WebSocket = class {
        static OPEN = 1;
        readyState = 1;
        addEventListener() {}
        removeEventListener() {}
        send() {}
        close() {}
      };
    });
    const errors = [], paymentRequests = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setRequestInterception(true);
    page.on('request', request => {
      const url = new URL(request.url());
      if (url.pathname.startsWith('/api/') || url.port === '3000') {
        const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': 'content-type,authorization',
          'Access-Control-Allow-Methods': 'GET,POST,OPTIONS' };
        if (request.method() === 'OPTIONS') return request.respond({ status: 204, headers });
        // All payment calls are intercepted. No orders or real payment links are created.
        paymentRequests.push(url.pathname);
        let data = {};
        if (url.pathname.includes('/orders/payos/')) data = url.pathname.includes('PAID-ORDER')
          ? { paymentStatus: 'PAID' }
          : { paymentStatus: 'WAITING_PAYMENT', qrCode: 'FIXTURE-QR', checkoutUrl: 'https://example.test/fixture-payment', amount: 229001, accountName: 'FIXTURE STORE', accountNumber: '0000000000' };
        return request.respond({ status: 200, headers, body: JSON.stringify({ success: true, data }) });
      }
      if (url.pathname === '/__checkout-confirmation-test') return request.respond({ status: 200, contentType: 'text/html', body: `
        <html><head><meta name="viewport" content="width=device-width, initial-scale=1" /></head><body style="margin:0;background:#FAF8F5"><div id="root"></div><script type="module">
        import RefreshRuntime from '/@react-refresh'; RefreshRuntime.injectIntoGlobalHook(window); window.$RefreshReg$=()=>{}; window.$RefreshSig$=()=>type=>type; window.__vite_plugin_react_preamble_installed__=true;
        await import('/src/index.css');
        const source=await(await fetch('/src/components/checkout/CheckoutOrderConfirmation.tsx')).text(); const version=source.match(/react[.]js([?]v=[^"]+)/)?.[1]||'';
        const React=await import('/node_modules/.vite/deps/react.js'+version); const dom=await import('/node_modules/.vite/deps/react-dom_client.js'+version); const {BrowserRouter}=await import('/node_modules/.vite/deps/react-router-dom.js'+version);
        const {CheckoutOrderConfirmation}=await import('/src/components/checkout/CheckoutOrderConfirmation.tsx');
        const h=React.createElement||React.default.createElement; const root=(dom.createRoot||dom.default.createRoot)(document.getElementById('root'));
        window.qaCloseCount=0; window.qaPaid=[];
        window.renderConfirmation=order=>root.render(h(BrowserRouter,null,h('main',{style:{padding:'24px 16px'}},h(CheckoutOrderConfirmation,{key:order.publicOrderCode,order,customerEmail:'fixture@example.test',onClose:()=>window.qaCloseCount++,onPayosPaid:code=>window.qaPaid.push(code)}))));
        </script></body></html>` });
      if (url.origin !== origin && !['data:', 'blob:'].includes(url.protocol)) return request.abort();
      return request.continue();
    });
    await page.setViewport({ width: 1440, height: 1100 });
    await page.goto(`${base}/__checkout-confirmation-test`);
    await page.waitForFunction(() => typeof window.renderConfirmation === 'function');
    const make = (code, paymentMethod = 'WALLET', paymentStatus = 'PAID') => ({
      publicOrderCode: code, totalAmount: 229001, paymentMethod, paymentStatus, confirmationEmailQueued: true,
      orders: [{ publicOrderCode: code, storeName: 'Cocoon', finalAmount: 229001, paymentStatus }],
    });
    const render = async order => {
      await page.evaluate(order => window.renderConfirmation(order), order);
      await page.waitForFunction(code => document.querySelector('.checkout-confirmation-code strong')?.textContent === code, {}, order.orders[0].publicOrderCode);
    };
    await render(make('DH-2026-FIXTURE'));
    assert.equal(await page.$eval('.checkout-confirmation', el => el.dataset.paymentState), 'paid');
    assert.match(await page.$eval('.checkout-confirmation-total', el => el.textContent), /229.001/);
    assert.match(await page.$eval('.checkout-confirmation-payment', el => el.textContent), /Ví SCANMS/);
    assert.match(await page.$eval('.checkout-confirmation-payment', el => el.textContent), /Đã thanh toán/);
    assert.deepEqual(paymentRequests, [], 'wallet confirmation does not initiate payments');
    for (const width of [1440, 1024, 768, 390, 320]) {
      await page.setViewport({ width, height: 1100 });
      assert.ok(await page.$eval('.checkout-confirmation', el => el.scrollWidth <= el.clientWidth + 1), `card fits ${width}px`);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `page fits ${width}px`);
      assert.ok(await page.$$eval('.checkout-confirmation button, .checkout-confirmation a', els => els.every(el => el.getBoundingClientRect().height >= 44)));
      if (width === 1440 || width === 390) await (await page.$('.checkout-confirmation')).screenshot({ path: join(tmpdir(), `scanms-checkout-confirmation-${width}.png`) });
    }
    await page.bringToFront();
    await page.click('.checkout-confirmation-code button');
    await page.waitForSelector('.checkout-confirmation-code button[data-copied="true"]');
    assert.equal(await page.evaluate(() => navigator.clipboard.readText()), 'DH-2026-FIXTURE');
    assert.equal(await page.$eval('.checkout-confirmation-track', el => el.getAttribute('href')), '/tracking?sn=DH-2026-FIXTURE');
    await page.click('.checkout-confirmation-continue');
    assert.equal(await page.evaluate(() => window.qaCloseCount), 1);
    assert.equal(await page.$eval('.checkout-confirmation-view-orders', el => el.getAttribute('href')), '/customer/orders');

    await render(make('WALLET-NOT-PAID', 'WALLET', 'UNPAID'));
    assert.doesNotMatch(await page.$eval('.checkout-confirmation-payment', el => el.textContent), /Đã thanh toán|đã được trừ/);
    for (const [status, expected] of [['SENT', 'Đã gửi email xác nhận'], ['FAILED', 'Chưa gửi được email'], ['PARTIAL', 'Một số email xác nhận chưa gửi được']]) {
      await render({ ...make(`EMAIL-${status}`), confirmationEmailStatus: status, confirmationEmailQueued: false });
      assert.match(await page.$eval('.checkout-confirmation-email', el => el.textContent), new RegExp(expected));
      assert.equal(await page.$eval('.checkout-confirmation-email', el => el.dataset.emailStatus), status);
    }
    await render({ ...make('EMAIL-NOT-REQUESTED'), confirmationEmailStatus: 'NOT_REQUESTED', confirmationEmailQueued: false });
    assert.equal(await page.$('.checkout-confirmation-email'), null);
    const multi = make('MULTI', 'PAYOS', 'WAITING_PAYMENT');
    multi.isMultiStore = true; multi.totalAmount = 458002;
    multi.orders = [make('PAID-ORDER', 'PAYOS').orders[0], { ...make('WAITING-ORDER', 'PAYOS', 'WAITING_PAYMENT').orders[0], storeName: 'Gian hàng đối tác với tên dài để kiểm tra khả năng xuống dòng trên điện thoại' }];
    await render(multi);
    await page.waitForFunction(() => window.qaPaid.includes('PAID-ORDER'));
    assert.equal(await page.$eval('.checkout-confirmation', el => el.dataset.paymentState), 'waiting');
    assert.match(await page.$eval('#guest-checkout-title', el => el.textContent), /Hoàn tất thanh toán/);
    assert.match(await page.$eval('.checkout-confirmation-hero p', el => el.textContent), /1\/2/);
    assert.equal(await page.$eval('[data-payment-status="WAITING_PAYMENT"]', el => el.textContent), 'Chờ thanh toán');
    await page.waitForSelector('img[alt="Mã VietQR cho đơn WAITING-ORDER"]');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await render(make('PAID-ORDER-2', 'PAYOS', 'PAID'));
    assert.match(await page.$eval('#guest-checkout-title', el => el.textContent), /Thanh toán thành công/);
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});
