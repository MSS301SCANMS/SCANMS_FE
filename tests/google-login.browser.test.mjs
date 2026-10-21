import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const base = process.env.GHN_UI_TEST_URL;
const executablePath = process.env.GHN_UI_BROWSER_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

test('Google sign-in submits the ID credential to the configured Spring auth endpoint', {
  skip: !base || !existsSync(executablePath), timeout: 30000,
}, async () => {
  assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
  const browser = await puppeteer.launch({ executablePath, headless: true });
  try {
    const page = await browser.newPage();
    await page.evaluateOnNewDocument(() => {
      let callback;
      window.google = { accounts: {
        id: {
          initialize(options) { callback = options.callback; },
          renderButton(container) {
            const button = document.createElement('button');
            button.dataset.testid = 'google-id-signin';
            button.textContent = 'Google ID sign-in fixture';
            button.onclick = () => callback({ credential: 'header.identity.signature' });
            container.appendChild(button);
          },
        },
        oauth2: { initTokenClient() { throw new Error('Access token flow must not be used for sign-in'); } },
      } };
    });
    await page.setRequestInterception(true);
    const authCalls = [];
    page.on('request', request => {
      const url = new URL(request.url());
      if (url.pathname.startsWith('/api/')) {
        const headers = {
          'Access-Control-Allow-Origin': new URL(base).origin,
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Allow-Headers': 'content-type,authorization',
          'Access-Control-Allow-Methods': 'POST,GET,OPTIONS',
        };
        if (request.method() === 'OPTIONS') return request.respond({ status: 204, headers });
        if (url.pathname.endsWith('/auth/google')) {
          authCalls.push({ url: request.url(), body: JSON.parse(request.postData()) });
          return request.respond({ status: 400, headers, contentType: 'application/json', body: JSON.stringify({ message: 'Google login fixture reached backend' }) });
        }
        return request.respond({ status: 200, headers, contentType: 'application/json', body: JSON.stringify({ result: [] }) });
      }
      if (url.origin !== new URL(base).origin && !['data:', 'blob:'].includes(url.protocol)) return request.abort();
      return request.continue();
    });
    await page.goto(`${base}/login`);
    await page.waitForSelector('[data-testid="google-id-signin"]');
    await page.click('[data-testid="google-id-signin"]');
    await page.waitForFunction(() => document.body.textContent.includes('Google login fixture reached backend'));
    assert.deepEqual(authCalls, [{
      url: `${process.env.GHN_UI_AUTH_API_URL || 'http://localhost:8080/api/v1'}/auth/google`,
      body: { idToken: 'header.identity.signature' },
    }]);
  } finally {
    await browser.close();
  }
});
