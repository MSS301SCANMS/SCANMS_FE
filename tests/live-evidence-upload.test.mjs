import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import test from 'node:test';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const require = createRequire(import.meta.url);
const read = name => readFileSync(new URL(`../src/components/live/${name}.tsx`, import.meta.url), 'utf8');
function compile(source, dependencies = {}) {
  const code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(code, { module, exports: module.exports, require: name => dependencies[name] || require(name) });
  return module.exports;
}
function setup(failAt = -1) {
  const uploads = [], errors = [], state = { evidence: [], uploading: false };
  const components = compile(read('LiveEvidenceAttachments'), {
    '../../services/upload.service': { uploadService: { uploadMedia: async (file, folder) => {
      uploads.push({ file, folder });
      if (uploads.length === failAt) throw new Error('Upload interrupted');
      return { url: `https://example.com/${file.name}`, type: 'image' };
    } } },
    '../../utils/toast': { toast: { error: message => errors.push(message) } },
  });
  const render = () => components.LiveEvidenceAttachments({ evidence: state.evidence, setEvidence: update => { state.evidence = update(state.evidence); },
    uploading: state.uploading, onUploadingChange: value => { state.uploading = value; }, disabled: false });
  const choose = async files => {
    const walk = node => !node || typeof node !== 'object' ? [] : Array.isArray(node) ? node.flatMap(walk) : [...(node.type === 'input' ? [node] : []), ...walk(node.props?.children)];
    walk(render())[0].props.onChange({ target: { files, value: 'selected' } });
    await new Promise(setImmediate);
  };
  return { components, uploads, errors, state, choose };
}
const photo = name => ({ name, type: 'image/jpeg', size: 1000 });
test('uploads multiple selected images, retains their URLs, and renders previews', async () => {
  const { components, choose, state, uploads } = setup();
  await choose([photo('one.jpg'), photo('two.jpg')]);
  assert.equal(uploads.length, 2);
  assert.ok(uploads.every(item => item.folder === 'scanms/live-disputes'));
  assert.equal(state.evidence.length, 2);
  assert.equal(state.uploading, false);
  const html = renderToStaticMarkup(React.createElement(components.LiveEvidenceGallery, { urls: state.evidence }));
  assert.equal((html.match(/<img /g) || []).length, 2);
});
test('rejects oversized, unsupported, or too many images before uploading', async () => {
  for (const files of [[{ ...photo('big.jpg'), size: 6 * 1024 * 1024 }], [{ ...photo('script.svg'), type: 'image/svg+xml' }], Array.from({ length: 11 }, (_, i) => photo(`${i}.jpg`))]) {
    const { choose, errors, uploads } = setup();
    await choose(files);
    assert.equal(uploads.length, 0);
    assert.equal(errors.length, 1);
  }
});
test('keeps successfully uploaded images if a subsequent upload fails', async () => {
  const { choose, state, errors } = setup(2);
  await choose([photo('one.jpg'), photo('two.jpg')]);
  assert.equal(state.evidence.length, 1);
  assert.equal(state.uploading, false);
  assert.equal(errors.length, 1);
});
test('KOL ending, Shop ending and KOL explanation all show image uploads', () => {
  const { components } = setup();
  for (const action of ['END_BY_KOL', 'SHOP_END', 'KOL_EXPLAIN']) {
    const { LiveGovernancePanel } = compile(read('LiveGovernancePanel').replace('useState<string | null>(null)', `useState<string | null>('${action}')`), {
      './LiveEvidenceAttachments': components,
      '../../services/api': { __esModule: true, default: {} },
      '../../services/auth.service': { authService: { getCurrentUser: () => ({ role: 'COLLABORATOR' }) } },
      '../../utils/toast': { toast: { error: () => {}, success: () => {} } },
    });
    const html = renderToStaticMarkup(React.createElement(LiveGovernancePanel, {
      session: { id: 'session', status: 'LIVE', inviteStatus: 'ACCEPTED' }, audience: action === 'SHOP_END' ? 'shop' : 'kol',
    }));
    assert.ok(html.includes('Tải ảnh từ thiết bị') && html.includes('multiple=""'));
    if (action === 'END_BY_KOL') assert.ok(html.includes('Việc cá nhân') && html.includes('Sức khỏe'));
  }
});
