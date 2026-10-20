import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';
import JSZip from 'jszip';

const source = readFileSync(new URL('../src/utils/media-pack.utils.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText.replace("import('jszip')", `import(${JSON.stringify(import.meta.resolve('jszip'))})`);
const { buildMediaPack } = await import(`data:text/javascript;charset=utf-8,${encodeURIComponent(compiled)}`);
const asset = (id, assetType, urlOrContent, title = 'Mẫu / tài nguyên') => ({
  id, assetType, urlOrContent, title, storeId: 'shop', status: 'APPROVED',
  createdAt: '2026-10-08', store: { name: 'Gian hàng A', slug: 'a' },
});
const options = { baseUrl: 'https://scanms.vn/collaborator/marketing?tab=media' };

test('ZIP contains real image/video bytes, UTF-8 scripts and unique safe filenames', async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, config) => {
    calls.push([url, config.credentials]);
    return new Response(new Uint8Array([1, 2, 3, 4]), {
      headers: { 'content-type': url.endsWith('.mp4') ? 'video/mp4' : 'image/jpeg' },
    });
  };
  try {
    const progress = [];
    const result = await buildMediaPack([
      asset('1', 'IMAGE', '/anh.jpg'),
      asset('2', 'VIDEO', 'https://cdn.example.com/video.mp4'),
      asset('3', 'COPYWRITE_TEXT', 'Kịch bản tiếng Việt\nDòng thứ hai'),
    ], { ...options, onProgress: (completed, total) => progress.push([completed, total]) });
    const zip = await JSZip.loadAsync(await result.blob.arrayBuffer());
    const names = Object.keys(zip.files).filter((name) => !zip.files[name].dir);
    assert.equal(result.downloadedCount, 3);
    assert.equal(result.linkedCount, 0);
    assert.ok(names.includes('Hinh-anh/001-Mẫu - tài nguyên.jpg'));
    assert.ok(names.includes('Video/002-Mẫu - tài nguyên.mp4'));
    assert.deepEqual(Array.from(await zip.file(names[0]).async('uint8array')), [1, 2, 3, 4]);
    assert.equal(await zip.file('Kich-ban/003-Mẫu - tài nguyên.txt').async('string'), 'Kịch bản tiếng Việt\nDòng thứ hai');
    assert.ok(zip.file('HUONG-DAN-SU-DUNG.txt'));
    assert.match(await zip.file('DANH-SACH.txt').async('string'), /Gian hàng A/);
    assert.deepEqual(progress, [[1, 3], [2, 3], [3, 3]]);
    assert.deepEqual(calls, [['https://scanms.vn/anh.jpg', 'same-origin'], ['https://cdn.example.com/video.mp4', 'omit']]);
  } finally { globalThis.fetch = originalFetch; }
});

test('streaming pages and blocked/HTML responses become labeled source links, never fake video files', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response('<html>Login</html>', { headers: { 'content-type': 'text/html' } });
  try {
    const result = await buildMediaPack([
      asset('1', 'VIDEO', 'https://youtube.com/watch?v=demo'),
      asset('2', 'IMAGE', 'https://cdn.example.com/login'),
      asset('3', 'IMAGE', 'javascript:alert(1)'),
    ], options);
    const zip = await JSZip.loadAsync(await result.blob.arrayBuffer());
    assert.equal(result.downloadedCount, 0);
    assert.equal(result.linkedCount, 2);
    assert.equal(result.failedCount, 1);
    assert.match(await zip.file('Lien-ket-nguon/001-Mẫu - tài nguyên.url').async('string'), /URL=https:\/\/youtube.com/);
    assert.match(await zip.file('DANH-SACH.txt').async('string'), /trang web thay vì tệp/);
    assert.equal(Object.keys(zip.files).some((name) => /\.(mp4|jpg)$/.test(name)), false);
  } finally { globalThis.fetch = originalFetch; }
});

test('empty lists and canceled downloads produce no archive', async () => {
  await assert.rejects(buildMediaPack([], options), /Không có tài nguyên/);
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(buildMediaPack([asset('1', 'COPYWRITE_TEXT', 'Nội dung')], { ...options, signal: controller.signal }), { name: 'AbortError' });
});
