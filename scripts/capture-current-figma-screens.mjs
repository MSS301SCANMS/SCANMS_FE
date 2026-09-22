import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: true,
  args: ['--no-sandbox', '--disable-gpu'],
});

const base = 'http://127.0.0.1:5173';
const out = 'public/reference/figma-exports';

async function capture({ url, file, width = 1440, height = 1024, actions = [] }) {
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  await page.goto(`${base}${url}`, { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise((resolve) => setTimeout(resolve, 1200));
  for (const selector of actions) {
    await page.waitForSelector(selector, { timeout: 10000 });
    await page.click(selector);
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  await page.screenshot({ path: `${out}/${file}`, type: 'png', fullPage: false });
  await page.close();
}

await capture({ url: '/register', file: '01_Dang_Ky_Register.png' });
await capture({
  url: '/reference/index.html#media',
  file: '05_Kho_Noi_Dung_Caption_Simulator.png',
  width: 1733,
  height: 957,
  actions: ['#btn-toggle-caption-accordion', '#btn-open-caption-drawer'],
});
await capture({
  url: '/reference/index.html#media',
  file: '05_Kho_Noi_Dung_Video_Player_Modal.png',
  width: 1733,
  height: 957,
  actions: ['.media-video-play-hint'],
});
await capture({
  url: '/reference/index.html#samples',
  file: '06_Hang_Mau_Modal_Xin_Mau.png',
  width: 1733,
  height: 957,
  actions: ['#btn-open-request-modal'],
});
await capture({
  url: '/reference/index.html#samples',
  file: '06_Hang_Mau_Modal_Tra_Cuu_GHTK.png',
  width: 1733,
  height: 957,
  actions: ['[data-request-id]', '#btn-view-live-tracking'],
});

await browser.close();
console.log('Captured 5 current FE screens.');
