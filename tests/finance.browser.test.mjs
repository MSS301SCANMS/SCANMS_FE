import test from 'node:test';
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';

const base = process.env.FINANCE_UI_TEST_URL; const executablePath = process.env.FINANCE_UI_BROWSER_PATH;
const enabled = base && executablePath;
const envelope = result => ({ code: 1000, message: 'Success', result });
const paged = items => ({ items, total: items.length, page: 0, size: 20 });
const bank = { bankAccountId: 'bank', collaboratorId: 'owner', storeId: null, bankCode: '970422', holderName: 'TEST OWNER', maskedNumber: '••••6789', verificationStatus: 'VERIFIED', active: true };
const wallet = { walletId: 'wallet', ownerType: 'COLLABORATOR', ownerRefId: 'owner', availableBalanceVnd: 500000, heldBalanceVnd: 0, currency: 'VND', status: 'ACTIVE' };
const capability = { minimumWithdrawalVnd: 200000, paymentAvailable: true, payoutAvailable: true, currency: 'VND' };
async function setup(handler, role = 'COLLABORATOR') {
  assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
  const browser = await puppeteer.launch({ executablePath, headless: true, pipe: true }); const page = await browser.newPage();
  page.setDefaultTimeout(10000);
  await page.setViewport({ width: 1365, height: 1000 });
  await page.evaluateOnNewDocument(role => { localStorage.setItem('token', 'isolated-finance-ui-test'); localStorage.setItem('user', JSON.stringify({ id: 'user', role, fullName: 'QA User' })); localStorage.setItem('scanms-active-workspace', role === 'SYSTEM_ADMIN' ? 'admin' : role === 'CUSTOMER' ? 'customer' : 'kol'); }, role);
  await page.setRequestInterception(true);
  page.on('request', async request => {
    const url = new URL(request.url());
    const cors = { 'Access-Control-Allow-Origin': request.headers().origin || new URL(base).origin, 'Access-Control-Allow-Credentials': 'true' };
    if (request.method() === 'OPTIONS') return request.respond({ status: 204, headers: { ...cors, 'Access-Control-Allow-Headers': request.headers()['access-control-request-headers'] || '*', 'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS' } });
    if (url.pathname === '/api/auth/me') return request.respond({ status: 200, contentType: 'application/json', headers: cors, body: JSON.stringify({ success: true, data: { id: 'user', role, fullName: 'QA User', email: 'qa@example.invalid', isActive: true, isDeleted: false } }) });
    if (url.pathname === '/api/customer/profile') return request.respond({ status: 200, contentType: 'application/json', headers: cors, body: JSON.stringify({ success: true, data: { user: { id: 'user', role, fullName: 'QA User', email: 'qa@example.invalid', createdAt: '2026-01-01T00:00:00Z' }, stats: { totalOrders: 0, pendingOrders: 0, totalSpending: 0, wishlistCount: 0 } } }) });
    if (url.pathname === '/api/chat/conversations') return request.respond({ status: 200, contentType: 'application/json', headers: cors, body: JSON.stringify({ success: true, data: [] }) });
    if (url.pathname === '/api/chat/unread-count') return request.respond({ status: 200, contentType: 'application/json', headers: cors, body: JSON.stringify({ success: true, data: { count: 0 } }) });
    if (url.pathname.startsWith('/api/')) {
      const result = await handler(request, url);
      return request.respond({ status: 200, contentType: 'application/json', headers: cors, body: JSON.stringify(envelope(result ?? (url.pathname.endsWith('/capabilities') ? capability : url.pathname.endsWith('/source-orders') ? [] : {}))) });
    }
    return request.continue();
  });
  return { browser, page };
}
async function clickText(page, text) {
  const handle = await page.evaluateHandle(text => [...document.querySelectorAll('button')].find(button => button.textContent.trim() === text), text);
  const element = handle.asElement(); assert.ok(element, `Missing button: ${text}`); await element.click(); await handle.dispose();
}
test('finance wallet rejects decimal VND, submits once, masks banks and displays request history', { skip: !enabled }, async () => {
  let posts = []; let requests = [];
  const { browser, page } = await setup(async (request, url) => {
    if (url.pathname.endsWith('/capabilities')) return capability;
    if (url.pathname.endsWith('/wallets/me')) return wallet;
    if (url.pathname.endsWith('/transactions')) return paged([]);
    if (url.pathname.endsWith('/bank-accounts')) return [bank];
    if (url.pathname.endsWith('/withdrawals') && request.method() === 'POST') {
      const body = JSON.parse(request.postData()); posts.push(body); await new Promise(resolve => setTimeout(resolve, 150));
      requests = [{ ...body, withdrawalId: 'withdrawal', status: 'REQUESTED', feeVnd: 0, netAmountVnd: 200000, requestedAt: new Date().toISOString() }]; return requests[0];
    }
    if (url.pathname.endsWith('/withdrawals')) return paged(requests);
  });
  try {
    await page.goto(`${base}/collaborator/wallet`); await page.waitForSelector('#withdrawal-amount');
    await page.type('#withdrawal-amount', '200000.5');
    await page.waitForFunction(() => [...document.querySelectorAll('button')].some(b => b.textContent.trim() === 'Gửi yêu cầu rút tiền' && !b.disabled));
    await clickText(page, 'Gửi yêu cầu rút tiền'); await page.waitForSelector('[role="alert"]'); assert.equal(posts.length, 0);
    await page.focus('#withdrawal-amount'); await page.keyboard.down('Control'); await page.keyboard.press('A'); await page.keyboard.up('Control'); await page.keyboard.type('200000');
    await page.evaluate(() => { const button = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Gửi yêu cầu rút tiền'); button.click(); button.click(); });
    await page.waitForFunction(() => document.body.textContent.includes('Mã: withdrawal'));
    await page.waitForFunction(() => document.body.textContent.includes('Chờ duyệt'));
    assert.equal(posts.length, 1); assert.equal(posts[0].amountVnd, 200000); assert.ok(posts[0].idempotencyKey);
    const body = await page.evaluate(() => document.body.textContent); assert.ok(body.includes('••••6789')); assert.ok(body.includes('Chờ duyệt')); assert.ok(!body.includes('123456789'));
    await page.setViewport({ width: 390, height: 844 });
    const mobileWidth = await page.evaluate(() => ({ viewport: innerWidth, content: document.querySelector('h1').getBoundingClientRect().width }));
    assert.ok(mobileWidth.content > mobileWidth.viewport * 0.7, 'Mobile content must not be squeezed by the sidebar');
    await page.screenshot({ path: '.qa-artifacts/finance-wallet-mobile.png', fullPage: true });
  } finally { await browser.close(); }
});
test('admin approval and payout reconciliation use the distinct business actions', { skip: !enabled }, async () => {
  const actions = []; let row = { withdrawalId: 'withdrawal', walletId: 'wallet', bankAccountId: 'bank', amountVnd: 200000, feeVnd: 0, netAmountVnd: 200000, status: 'REQUESTED', requestedAt: new Date().toISOString() };
  const { browser, page } = await setup(async (request, url) => {
    if (url.pathname.endsWith('/withdrawals')) return paged([row]);
    if (url.pathname.includes('/withdrawals/withdrawal/')) { const action = url.pathname.split('/').at(-1); actions.push(action); row = { ...row, status: action === 'approve' ? 'APPROVED' : action === 'execute' ? 'PROCESSING' : 'SUCCESS' }; return row; }
  }, 'SYSTEM_ADMIN');
  try {
    await page.goto(`${base}/admin/finance`); await page.waitForFunction(() => document.body.textContent.includes('Duyệt và giữ tiền'));
    await clickText(page, 'Duyệt và giữ tiền'); await page.waitForFunction(() => document.body.textContent.includes('Chuyển ngân hàng'));
    await clickText(page, 'Chuyển ngân hàng'); await page.waitForFunction(() => document.body.textContent.includes('Đối soát / Retry'));
    await clickText(page, 'Đối soát / Retry'); await page.waitForFunction(() => document.body.textContent.includes('Thành công'));
    assert.deepEqual(actions, ['approve', 'execute', 'reconcile']); await page.screenshot({ path: '.qa-artifacts/finance-admin.png', fullPage: true });
  } finally { await browser.close(); }
});
test('payment return ignores success query parameters and trusts the server status', { skip: !enabled }, async () => {
  let state = 'PROCESSING'; const { browser, page } = await setup(async (_request, url) => {
    if (url.pathname.endsWith('/payments/payment')) return { paymentId: 'payment', purpose: 'TOP_UP', amountVnd: 50000, currency: 'VND', status: state, checkoutUrl: 'https://pay.payos.vn/web/test', qrCode: 'test-qr', expiresAt: '2026-10-03T00:00:00' };
  });
  try {
    await page.goto(`${base}/payment/payos-return?payment=payment&status=PAID&code=00`); await page.waitForFunction(() => document.body.textContent.includes('Đang xử lý'));
    assert.ok(!(await page.evaluate(() => document.body.textContent)).includes('đã xác minh thành công'));
    state = 'SUCCESS'; await clickText(page, 'Kiểm tra lại'); await page.waitForFunction(() => document.body.textContent.includes('Tiền đã được cộng vào ví'));
    assert.equal(await page.$('a[href="https://pay.payos.vn/web/test"]'), null);
  } finally { await browser.close(); }
});
test('wallet payment never reports success for a PROCESSING response', { skip: !enabled }, async () => {
  const { browser, page } = await setup(async (request, url) => {
    if (url.pathname.endsWith('/capabilities')) return capability;
    if (url.pathname.endsWith('/wallets/me')) return { ...wallet, ownerType: 'CUSTOMER' };
    if (url.pathname.endsWith('/transactions') || url.pathname.endsWith('/payments')) return paged([]);
    if (url.pathname.endsWith('/wallet-payments') && request.method() === 'POST') return { paymentId: 'pending', status: 'PROCESSING', purpose: 'ORDER' };
  }, 'CUSTOMER');
  try {
    await page.goto(`${base}/customer/wallet`);
    await page.waitForFunction(() => [...document.querySelectorAll('button')].some(b => b.textContent.trim() === 'Thanh toán bằng ví'));
    await page.focus('#customer-wallet-order-id');
    await page.keyboard.type('00000000-0000-0000-0000-000000000001'); await clickText(page, 'Thanh toán bằng ví');
    await page.waitForFunction(() => document.body.textContent.includes('Giao dịch chưa thành công'));
    const text=await page.evaluate(() => document.body.textContent); assert.ok(!text.includes('Đã trừ ví.')); assert.ok(!text.includes('Thanh toán thành công.'));
  } finally { await browser.close(); }
});
test('admin can reconcile an unapplied payment with a reason and see its refund reference', { skip: !enabled }, async () => {
  let row={ paymentId:'late', orderId:'expired-order', purpose:'ORDER', amountVnd:50000, status:'SUCCESS', orderSyncStatus:'RECONCILIATION_REQUIRED' }; const posted=[];
  const { browser,page }=await setup(async (request,url) => {
    if(url.pathname.endsWith('/withdrawals')) return paged([]);
    if(url.pathname.endsWith('/payments')) return paged([row]);
    if(url.pathname.endsWith('/refund-unapplied')) { posted.push(JSON.parse(request.postData())); row={...row, orderSyncStatus:'REFUNDED', resolutionReference:'refund-ledger'}; return row; }
  },'SYSTEM_ADMIN');
  try {
    await page.goto(`${base}/admin/finance`); await page.waitForFunction(() => [...document.querySelectorAll('button')].some(b => b.textContent.trim()==='Giao Dịch PayOS')); await clickText(page,'Giao Dịch PayOS');
    await page.waitForFunction(() => document.body.textContent.includes('RECONCILIATION_REQUIRED'));
    await page.evaluate(() => { document.querySelector('label input').focus(); }); await page.keyboard.type('Order expired before provider confirmation');
    await clickText(page,'Hoàn về ví khách'); await page.waitForFunction(() => document.body.textContent.includes('refund-ledger'));
    assert.deepEqual(posted,[{reason:'Order expired before provider confirmation'}]);
  } finally { await browser.close(); }
});
test('admin refunds verified surplus once and can refresh received funds without creating a payment', { skip: !enabled }, async () => {
  let posted=[], created=0, refreshed=0;
  let row={paymentId:'surplus-payment',orderId:'order',purpose:'ORDER',amountVnd:50000,receivedAmountVnd:60000,currency:'VND',status:'SUCCESS',orderSyncStatus:'SYNCED',surplusRefundedAmountVnd:0};
  const {browser,page}=await setup(async (request,url) => {
    if(url.pathname.endsWith('/withdrawals')) return paged([]);
    if(url.pathname.endsWith('/capabilities')) return capability;
    if(url.pathname.endsWith('/payments')) { if(request.method()==='POST') created++; return paged([row]); }
    if(url.pathname.endsWith('/payments/surplus-payment') && request.method()==='GET') { refreshed++; return row; }
    if(url.pathname.endsWith('/refund-surplus')) { posted.push(JSON.parse(request.postData())); row={...row,surplusRefundedAmountVnd:10000,surplusReference:'surplus-ledger'}; return row; }
  },'SYSTEM_ADMIN');
  try {
    await page.goto(`${base}/admin/finance`); await page.waitForFunction(() => [...document.querySelectorAll('button')].some(b => b.textContent.trim()==='Giao Dịch PayOS')); await clickText(page,'Giao Dịch PayOS');
    await page.waitForFunction(() => document.body.textContent.includes('surplus-payment'));
    await clickText(page,'Kiểm tra khoản đã nhận'); await page.waitForFunction(() => ![...document.querySelectorAll('button')].find(b => b.textContent.trim()==='Kiểm tra khoản đã nhận')?.disabled);
    await page.evaluate(() => document.querySelector('label input').focus()); await page.keyboard.type('Verified extra bank transfer');
    await clickText(page,'Hoàn tiền chuyển dư'); await page.waitForFunction(() => document.body.textContent.includes('surplus-ledger'));
    assert.equal(refreshed,1); assert.equal(created,0); assert.deepEqual(posted,[{reason:'Verified extra bank transfer'}]);
    assert.equal(await page.evaluate(() => [...document.querySelectorAll('button')].some(b => b.textContent.trim()==='Hoàn tiền chuyển dư')),false);
  } finally { await browser.close(); }
});
test('admin configures a bank holiday with its reason and sees the saved calendar', { skip: !enabled }, async () => {
  const rows=[];
  const {browser,page}=await setup(async(request,url)=>{
    if(url.pathname.endsWith('/withdrawals'))return paged([]);
    if(url.pathname.endsWith('/bank-calendar')){
      if(request.method()==='POST'){rows.push(JSON.parse(request.postData()));return 'Configured';}
      return rows;
    }
  },'SYSTEM_ADMIN');
  try{
    await page.goto(`${base}/admin/finance`);
    await page.waitForFunction(()=>[...document.querySelectorAll('button')].some(b=>b.textContent.trim()==='Lịch Nghỉ Ngân Hàng'));
    await clickText(page,'Lịch Nghỉ Ngân Hàng');
    await page.click('[role="button"][aria-label="Ngày ngân hàng nghỉ"]');
    const months = await page.evaluate(() => { const today = new Date(); return (2027 - today.getFullYear()) * 12 + 1 - today.getMonth(); });
    for (let month = 0; month < months; month++) await page.click('button[title="Tháng sau"]');
    await clickText(page,'8');
    await page.type('input[aria-label="Lý do ngân hàng nghỉ"]','Bank notice: Tet closure');
    await clickText(page,'Lưu ngày nghỉ');await page.waitForFunction(()=>document.body.textContent.includes('Đã lưu ngày ngân hàng nghỉ'));
    assert.deepEqual(rows,[{date:'2027-02-08',reason:'Bank notice: Tet closure'}]);
  }finally{await browser.close();}
});
test('legacy checkout uses the active NestJS order and PayOS endpoints', { skip: !enabled || process.env.PAYOS_LEGACY_UI_TEST !== 'true' }, async () => {
  const requests=[];
  const {browser,page}=await setup(async (request,url) => {
    requests.push({path:url.pathname,method:request.method(),body:request.postData()});
    if(url.pathname.endsWith('/orders/payos/availability')) return {available:true};
    if(url.pathname.endsWith('/orders')) return {publicOrderCode:'TEST-ORDER',finalAmount:1000};
    if(url.pathname.endsWith('/TEST-ORDER/link')) return {checkoutUrl:'https://pay.payos.vn/web/test',qrCode:'test-qr',amount:1000};
    if(url.pathname.endsWith('/TEST-ORDER/status')) return {paymentStatus:'WAITING_PAYMENT'};
  },'CUSTOMER');
  try {
    await page.goto(`${base}/payment/payos-return`);
    const result=await page.evaluate(async () => {
      const {checkoutService,usesLegacyCheckout}=await import('/src/services/checkout.service.ts');
      const available=await checkoutService.paymentAvailable();
      const order=await checkoutService.create({idempotencyKey:'qa-checkout',paymentMethod:'PAYOS',items:[{productId:'product',quantity:1}]});
      const link=await checkoutService.legacyPaymentLink(order.publicOrderCode);
      const status=await checkoutService.legacyPaymentStatus(order.publicOrderCode);
      return {legacy:usesLegacyCheckout,available,order,link,status};
    });
    assert.equal(result.legacy,true); assert.equal(result.available,true); assert.equal(result.link.amount,1000); assert.equal(result.status.paymentStatus,'WAITING_PAYMENT');
    assert.ok(requests.some(r=>r.path==='/api/orders' && r.method==='POST' && JSON.parse(r.body).paymentMethod==='PAYOS'));
    assert.equal(requests.some(r=>r.path.startsWith('/api/v1/checkout') || r.path==='/api/v1/finance/payments'),false);
  } finally { await browser.close(); }
});
test('legacy PayOS return ignores a success query and waits for verified backend status', { skip: !enabled || process.env.PAYOS_LEGACY_UI_TEST !== 'true' }, async () => {
  let paid=false;
  const {browser,page}=await setup(async (request,url) => {
    if(url.pathname.endsWith('/TEST-ORDER/status')) return {publicOrderCode:'TEST-ORDER',paymentStatus:paid?'PAID':'WAITING_PAYMENT',status:'PROCESSING',payos:{amount:1000,checkoutUrl:'https://pay.payos.vn/web/test'}};
  },'CUSTOMER');
  try {
    await page.goto(`${base}/payment/payos-return?order=TEST-ORDER&status=PAID&code=00`);
    await page.waitForFunction(()=>document.body.textContent.includes('Đang chờ xác nhận từ PayOS'));
    assert.equal(await page.evaluate(()=>document.body.textContent.includes('PayOS đã xác minh thanh toán thành công')),false);
    await page.waitForFunction(()=>[...document.querySelectorAll('button')].some(b=>b.textContent.trim()==='Kiểm tra lại thanh toán' && !b.disabled));
    paid=true; await clickText(page,'Kiểm tra lại thanh toán');
    await page.waitForFunction(()=>document.body.textContent.includes('PayOS đã xác minh thanh toán thành công'));
  } finally { await browser.close(); }
});
test('legacy PayOS return restores a missing link through the authenticated backend', { skip: !enabled || process.env.PAYOS_LEGACY_UI_TEST !== 'true' }, async () => {
  let linkCalls=0;
  const {browser,page}=await setup(async (request,url) => {
    if(url.pathname.endsWith('/RESTORE-ORDER/status')) return {publicOrderCode:'RESTORE-ORDER',paymentStatus:'WAITING_PAYMENT',status:'PROCESSING',payos:null};
    if(url.pathname.endsWith('/RESTORE-ORDER/link')) { linkCalls++; return {paymentStatus:'WAITING_PAYMENT',amount:1000,checkoutUrl:'https://pay.payos.vn/web/restored',qrCode:'restored-qr'}; }
  },'CUSTOMER');
  try {
    await page.goto(`${base}/payment/payos-return?order=RESTORE-ORDER`);
    await page.waitForFunction(()=>[...document.querySelectorAll('button')].some(b=>b.textContent.trim()==='Tạo lại liên kết PayOS' && !b.disabled));
    await clickText(page,'Tạo lại liên kết PayOS'); await page.waitForSelector('a[href="https://pay.payos.vn/web/restored"]');
    assert.equal(linkCalls,1);
    assert.equal(await page.evaluate(()=>document.body.textContent.includes('PayOS đã xác minh thanh toán thành công')),false);
  } finally { await browser.close(); }
});
test('wallet ledger filters reach the API and detail uses the owned-wallet endpoint', { skip: !enabled }, async () => {
  const queries=[]; const entry={transactionId:'ledger-refund',type:'REFUND',direction:'CREDIT',amountVnd:100,balanceBeforeVnd:0,balanceAfterVnd:100,heldBeforeVnd:0,heldAfterVnd:0,referenceType:'RETURN',referenceId:'return-one',createdAt:new Date().toISOString()};
  const {browser,page}=await setup(async (_request,url) => {
    if(url.pathname.endsWith('/capabilities')) return capability;
    if(url.pathname.endsWith('/wallets/me')) return wallet;
    if(url.pathname.endsWith('/bank-accounts')) return [bank];
    if(url.pathname.endsWith('/withdrawals')) return paged([]);
    if(url.pathname.endsWith('/transactions')) { queries.push(url.searchParams.get('type')); return paged([entry]); }
    if(url.pathname.endsWith('/transactions/ledger-refund')) return {...entry,description:'Confirmed return refund',status:'SUCCESS',completedAt:entry.createdAt};
  });
  try {
    await page.goto(`${base}/collaborator/wallet`); await page.waitForSelector('[aria-label="Lọc lịch sử"] select');
    await page.select('[aria-label="Lọc lịch sử"] select','REFUND'); await page.waitForFunction(() => document.body.textContent.includes('return-one'));
    await clickText(page,'Xem chi tiết'); await page.waitForFunction(() => document.body.textContent.includes('Confirmed return refund'));
    assert.ok(queries.includes('REFUND'));
  } finally { await browser.close(); }
});

test('unconfigured payout cannot approve a withdrawal or show a test balance injection', { skip: !enabled }, async () => {
  const actions=[];
  const row={withdrawalId:'awaiting-provider',walletId:'wallet',amountVnd:200000,feeVnd:0,netAmountVnd:200000,status:'REQUESTED'};
  const {browser,page}=await setup(async(request,url) => {
    if(url.pathname.endsWith('/capabilities'))return {...capability,payoutAvailable:false};
    if(url.pathname.endsWith('/withdrawals'))return paged([row]);
    if(url.pathname.includes('/withdrawals/awaiting-provider/'))actions.push(url.pathname);
    if(url.pathname.endsWith('/wallets/me'))return wallet;
    if(url.pathname.endsWith('/bank-accounts'))return [bank];
    if(url.pathname.endsWith('/transactions'))return paged([]);
  },'SYSTEM_ADMIN');
  try {
    await page.goto(`${base}/admin/finance`);
    await page.waitForFunction(() => [...document.querySelectorAll('button')].some(button => button.textContent.trim()==='Duyệt và giữ tiền' && button.disabled));
    assert.ok((await page.$eval('body',element=>element.textContent)).includes('chưa được cấu hình đầy đủ'));
    assert.equal(actions.length,0);
    await page.goto(`${base}/collaborator/wallet`); await page.waitForSelector('#withdrawal-amount');
    assert.ok(!(await page.$eval('body',element=>element.textContent)).includes('Nạp 1.000.000'));
  } finally { await browser.close(); }
});

test('settlements load the selected store even without a storeId URL query', { skip: !enabled }, async () => {
  const stores=[];
  const {browser,page}=await setup(async(_request,url) => {
    if(url.pathname.endsWith('/settlements')) {stores.push(url.searchParams.get('storeId'));return paged([{settlementId:'qa-settlement',sellerOrderId:'qa-order',storeId:'qa-store',status:'PAID',netAmountVnd:382500,breakdown:{grossRevenueVnd:450000,platformFeeVnd:22500,commissionVnd:45000}}]);}
  },'SYSTEM_ADMIN');
  await page.evaluateOnNewDocument(()=>localStorage.setItem('current_store_id','qa-store'));
  try {
    await page.goto(`${base}/merchant/settlements`);
    await page.waitForFunction(()=>document.body.textContent.includes('qa-settlement'));
    assert.ok(stores.includes('qa-store'));
    assert.ok((await page.$eval('body',element=>element.textContent)).includes('382.500'));
  } finally { await browser.close(); }
});
