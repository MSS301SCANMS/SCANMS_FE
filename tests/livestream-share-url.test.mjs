import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import { readFileSync } from 'node:fs';
const site = 'https://vercel-upload-20261107-1.vercel.app';
const source = readFileSync(new URL('../src/utils/livestream-share-url.ts', import.meta.url), 'utf8')
  .replaceAll('import.meta.env.VITE_PUBLIC_SITE_URL', JSON.stringify(site));
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { getLivestreamShareUrl, resolveLivestreamShareUrl } = await import('data:text/javascript,' + encodeURIComponent(code));

function browser(t, origin) {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'window');
  Object.defineProperty(globalThis, 'window', { configurable: true, writable: true, value: { location: new URL(origin) } });
  t.after(() => previous ? Object.defineProperty(globalThis, 'window', previous) : delete globalThis.window);
}

test('local and temporary tunnel pages share the stable Vercel frontend', t => {
  browser(t, 'http://localhost:5173');
  assert.equal(getLivestreamShareUrl('live-id'), `${site}/live/live-id`);
  globalThis.window.location = new URL('https://heel-stamps-thing-formal.trycloudflare.com');
  assert.equal(getLivestreamShareUrl('live-id'), `${site}/live/live-id`);
});

test('local runtime keeps the frontend origin separate from the changing backend tunnel', async t => {
  browser(t, 'http://localhost:5173');
  const requests = [];
  t.mock.method(globalThis, 'fetch', async input => {
    requests.push(String(input));
    if (String(input).startsWith('/demo-public-config.json')) {
      return new Response(JSON.stringify({ siteUrl: site, publicUrl: site, backendUrl: 'https://new-tunnel.example.test' }), { headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({ service: 'livestream-realtime' }));
  });
  assert.equal(await resolveLivestreamShareUrl('live-id'), `${site}/live/live-id`);
  assert.equal(requests.at(-1), `${site}/live-health`);
});

test('a deployed page ignores stale demo JSON and checks relay health through Vercel', async t => {
  browser(t, site);
  const requests = [];
  t.mock.method(globalThis, 'fetch', async input => {
    requests.push(String(input));
    return new Response(JSON.stringify({ service: 'livestream-realtime' }));
  });
  assert.equal(await resolveLivestreamShareUrl('live-id'), `${site}/live/live-id`);
  assert.deepEqual(requests, [`${site}/live-health`]);
});

test('a failed backend proxy does not produce a supposedly ready share link', async t => {
  browser(t, site);
  t.mock.method(globalThis, 'fetch', async () => new Response('', { status: 502 }));
  await assert.rejects(resolveLivestreamShareUrl('live-id'));
});
