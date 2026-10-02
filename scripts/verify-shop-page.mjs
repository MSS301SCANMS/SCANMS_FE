import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  headless: true,
  args: ['--no-sandbox'],
});
try {
  const api = process.env.SCANMS_TEST_API || 'http://localhost:3000/api';
  const catalog = await (await fetch(`${api}/public/products?limit=1`)).json();
  const item = (catalog.data?.items || catalog.items)[0];
  const shopId = item.store.id;
  const page = await browser.newPage();
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    await page.setViewport(viewport);
    await page.goto(`http://localhost:5173/shops/${shopId}`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('main h1');
    await page.waitForSelector('main a[href^="/products/"]', { timeout: 8000 }).catch(() => undefined);
    const state = await page.evaluate(() => ({
      heading: document.querySelector('main h1')?.textContent,
      productLinks: document.querySelectorAll('main a[href^="/products/"]').length,
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 2,
      chatButton: [...document.querySelectorAll('button')].some((button) => button.textContent?.includes('Chat ngay')),
      errors: [...document.querySelectorAll('[role="alert"]')].map((node) => node.textContent),
    }));
    if (!state.productLinks) console.log('Shop UI diagnostic:', state);
    assert.ok(state.heading?.includes(item.store.name));
    assert.ok(state.productLinks > 0);
    assert.ok(state.chatButton);
    assert.equal(state.horizontalOverflow, false, `Tràn ngang ở ${viewport.width}px`);
    console.log(`PASS shop ${viewport.width}px: ${state.heading}, ${state.productLinks} product links, no overflow`);
  }
  const password = process.env.SCANMS_TEST_PASSWORD || 'Password@123';
  const login = await (await fetch(`${api}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'customer@scanms.vn', password }) })).json();
  assert.ok(login.data?.accessToken, 'Tài khoản khách mẫu phải đăng nhập được');
  await page.setViewport({ width: 1440, height: 900 });
  await page.evaluate(({ token, user }) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  }, { token: login.data.accessToken, user: login.data.user });
  await page.goto(`http://localhost:5173/products/${item.sku}`, { waitUntil: 'networkidle2' });
  const chatButton = await page.waitForFunction(() => [...document.querySelectorAll('button')].find((button) => button.textContent?.includes('Chat ngay với Shop')));
  await chatButton.click();
  await page.waitForFunction(() => location.pathname === '/chat' && document.body.textContent?.includes('Đang đính kèm sản phẩm'), { timeout: 10000 });
  const chatState = await page.evaluate(() => ({ url: location.href, attached: document.body.textContent?.includes('Đang đính kèm sản phẩm') }));
  assert.ok(chatState.url.includes(`productId=${item.id}`));
  assert.ok(chatState.attached);
  console.log('PASS product → Chat Shop UI: product card is pinned for the opening message (not auto-sent).');
  await page.setViewport({ width: 390, height: 844 });
  const mobileChat = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth > innerWidth + 2,
    composer: Boolean(document.querySelector('#chat-message-input')),
  }));
  assert.equal(mobileChat.overflow, false, 'Chat bị tràn ngang trên mobile');
  assert.ok(mobileChat.composer);
  console.log('PASS chat 390px: composer visible, no horizontal overflow.');
} finally {
  await browser.close();
}
