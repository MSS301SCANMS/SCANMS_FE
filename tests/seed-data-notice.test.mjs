import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
const require = createRequire(import.meta.url);
const code = ts.transpileModule(readFileSync(new URL('../src/components/common/SeedDataNotice.tsx', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
}).outputText;
const module = { exports: {} };
new Function('require', 'module', 'exports', code)(require, module, module.exports);
const render = user => renderToStaticMarkup(React.createElement(module.exports.SeedDataNotice, { user }));
test('does not mark an actual registered user as a fixture', () => {
  assert.equal(render({ email: 'customer@example.test' }), '');
  assert.equal(render(null), '');
});
test('seed identity/metrics/payment are unmistakably labeled synthetic', () => {
  assert.match(render({ email: 'shop01@seed.scanms.test' }), /Tài khoản kiểm thử Capstone/);
  assert.match(render({ email: 'shop01@seed.scanms.test' }), /không chứng minh xác minh danh tính hoặc thanh toán thật/);
});
test('a public creator reference explicitly disclaims account ownership/partnership', () => {
  assert.match(render({ email: 'kol01@seed.scanms.test', collaboratorProfile: { socialLinksJson: {
    seedReference: { purpose: 'PUBLIC_REFERENCE_FOR_CAPSTONE_TESTING', name: 'Creator công khai' },
  } } }), /người này không đăng ký hoặc xác nhận hợp tác/);
});
