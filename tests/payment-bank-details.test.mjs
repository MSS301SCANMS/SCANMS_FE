import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

const moduleUrl = text => `data:text/javascript;base64,${Buffer.from(text).toString('base64')}`;
const compile = path => ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
const bankNames = JSON.parse(readFileSync(new URL('../src/utils/paymentBankNames.json', import.meta.url), 'utf8').replace(/^\uFEFF/, ''));
const source = compile('../src/components/checkout/PaymentBankDetails.tsx')
  .replace('"react/jsx-runtime"', JSON.stringify(import.meta.resolve('react/jsx-runtime')))
  .replace("'../../utils/paymentBankNames.json'", JSON.stringify(moduleUrl(`export default ${JSON.stringify(bankNames)};`)))
  .replace("'../../features/marketplace/marketplaceUtils'", JSON.stringify(moduleUrl(compile('../src/features/marketplace/marketplaceUtils.ts'))));
const { PaymentBankDetails } = await import(moduleUrl(source));

test('payment panel displays the provider account and bank name rather than payOS placeholders', () => {
  const html = renderToStaticMarkup(createElement(PaymentBankDetails, { payment: {
    bin: '970418', accountNumber: 'V3CAS-TEST', accountName: 'TEST OWNER', description: 'TEST ORDER', amount: 680000,
  } }));
  for (const value of ['BIDV', 'V3CAS-TEST', 'TEST OWNER', 'TEST ORDER', '680.000']) assert.ok(html.includes(value));
  assert.ok(!html.includes('Xem trên trang'));
  assert.ok(!html.includes('Theo thông tin payOS'));
});

test('old payment does not suggest a fabricated receiving account', () => {
  const html = renderToStaticMarkup(createElement(PaymentBankDetails, { payment: { amount: 680000 } }));
  assert.ok(html.includes('Thông tin tài khoản của link này chưa được lưu'));
  assert.ok(!html.includes('Số tài khoản:'));
  assert.ok(!html.includes('Chủ tài khoản:'));
});

test('unlisted bank retains the provider BIN and account name renders as text', () => {
  const html = renderToStaticMarkup(createElement(PaymentBankDetails, { payment: {
    bin: '999999', accountNumber: 'TEST', accountName: '<script>bad</script>', amount: 680000,
  } }));
  assert.ok(html.includes('999999'));
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(!html.includes('<script>'));
});
