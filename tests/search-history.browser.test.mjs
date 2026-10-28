import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const base = process.env.GHN_UI_TEST_URL, executablePath = process.env.GHN_UI_BROWSER_PATH;
test('search history survives delayed reads, deduplicates StrictMode effects and isolates clearing by account', {
  skip: !base || !executablePath || !existsSync(executablePath), timeout: 45000,
}, async () => {
  const origin = new URL(base).origin;
  const browser = await puppeteer.launch({ executablePath, headless: true });
  const records = { alice: [{ eventId: 'private-alice', keyword: 'Alice private query', resultCount: 2, createdAt: '2026-01-01T00:00:00Z' }], bob: [{ eventId: 'private-bob', keyword: 'Bob private query', resultCount: 1, createdAt: '2026-01-01T00:00:00Z' }] };
  const pendingReads = [], errors = [];
  let writes = 0, deletions = 0, holdAlice = true;
  try {
    const page = await browser.newPage(); page.setDefaultTimeout(10000);
    page.on('pageerror', error => { if (!error.message.includes('WebSocket closed without opened')) errors.push(error.message); });
    await page.setRequestInterception(true);
    page.on('request', request => {
      const url = new URL(request.url());
      const headers = { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': request.headers()['access-control-request-headers'] || 'authorization,content-type,x-skip-cache', 'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS' };
      const respond = result => request.respond({ status: 200, headers, contentType: 'application/json', body: JSON.stringify({ code: 200, result }) });
      if (request.method() === 'OPTIONS') return request.respond({ status: 204, headers });
      if (url.pathname.startsWith('/api/')) {
        const authorization = request.headers().authorization;
        const actor = authorization ? JSON.parse(Buffer.from(authorization.split(' ')[1].split('.')[1], 'base64url')).sub : 'guest';
        if (url.pathname.endsWith('/search-history') && request.method() === 'GET') {
          const snapshot = [...(records[actor] || [])];
          if (actor === 'alice' && holdAlice) { pendingReads.push(() => respond(snapshot)); return; }
          return respond(snapshot);
        }
        if (url.pathname.endsWith('/search-history') && request.method() === 'DELETE') { deletions++; records[actor] = []; return respond(true); }
        if (url.pathname.endsWith('/public/search-events')) {
          writes++;
          const input = JSON.parse(request.postData());
          const entry = { eventId: input.requestId, keyword: input.keyword, resultCount: input.resultCount, createdAt: new Date().toISOString() };
          (records[actor] ||= []).unshift(entry); return respond(entry);
        }
        return respond([]);
      }
      if (url.pathname === '/__search-history-test') return request.respond({ contentType: 'text/html; charset=utf-8', body: `<html><body><div id="root"></div><script type="module">
        import RefreshRuntime from '/@react-refresh';RefreshRuntime.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>type=>type;window.__vite_plugin_react_preamble_installed__=true;
        const source=await(await fetch('/src/hooks/useSearchHistory.ts')).text();const main=await(await fetch('/src/main.tsx')).text();
        const ReactModule=await import(source.match(/["]([^"]*deps.react[.]js[^"]*)["]/)[1]);const React=ReactModule.default||ReactModule;const dom=await import(main.match(/["]([^"]*react-dom_client[.]js[^"]*)["]/)[1]);const h=React.createElement;
        const session=await import('/src/services/auth-session.ts');window.signIn=id=>{const jwt=p=>btoa(JSON.stringify(p));session.saveLoginSession({accessToken:jwt({alg:'none'})+'.'+jwt({sub:id,exp:Math.floor(Date.now()/1000)+3600})+'.fixture',expiresIn:3600});localStorage.setItem('user',JSON.stringify({id,role:'CUSTOMER'}));window.dispatchEvent(new Event('auth-user-updated'));};window.signIn('alice');
        const {useSearchHistory}=await import('/src/hooks/useSearchHistory.ts');const {SearchHistoryBar}=await import('/src/components/marketplace/SearchHistoryBar.tsx');
        function App(){const [query,setQuery]=React.useState('giay');window.clearQuery=()=>setQuery('');const state=useSearchHistory(query,2,false,{});return h('div',null,h('input',{id:'query',value:query,onChange:e=>setQuery(e.target.value)}),h(SearchHistoryBar,{history:state.history,error:state.error,onSelect:setQuery,onClear:()=>state.clear()}));}
        (dom.createRoot||dom.default.createRoot)(document.getElementById('root')).render(h(React.StrictMode,null,h(App)));
      </script></body></html>` });
      if (url.origin !== origin && !['data:', 'blob:'].includes(url.protocol)) return request.abort();
      return request.continue();
    });
    await page.goto(origin + '/__search-history-test', { waitUntil: 'domcontentloaded' });
    try { await page.waitForFunction(() => document.querySelector('section[aria-label]')?.innerText.includes('giay')); }
    catch (error) { console.log({ errors, records, writes, pending: pendingReads.length, body: await page.$eval('body', element => element.innerText) }); throw error; }
    assert.equal(writes, 1);
    holdAlice = false;
    for (const respond of pendingReads.splice(0)) await respond();
    await page.waitForFunction(() => document.body.innerText.includes('Alice private query'));
    assert.ok((await page.$eval('body', element => element.innerText)).includes('giay'));
    await page.evaluate(() => window.clearQuery());
    await page.waitForFunction(() => document.querySelector('#query').value === '');
    await page.evaluate(() => window.signIn('bob'));
    await page.waitForFunction(() => document.body.innerText.includes('Bob private query'));
    assert.ok(!(await page.$eval('body', element => element.innerText)).includes('Alice private query'));
    await page.click('section[aria-label] > div > button');
    await page.waitForFunction(() => document.querySelector('section[aria-label]') === null);
    assert.equal(deletions, 1); assert.equal(records.bob.length, 0); assert.equal(records.alice.length, 2);
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});
