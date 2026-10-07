import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const calls = [];
let envelope;
let failure;
const fakeAxios = { create: options => {
  let onError;
  const request = async (method, path, config) => {
    calls.push({ baseURL: options.baseURL, method, path, config });
    if (failure) return onError(failure);
    return { data: envelope };
  };
  return {
    interceptors: { request: { use() {} }, response: { use(_success, error) { onError = error; } } },
    get: (path, config) => request('GET', path, config),
    post: path => request('POST', path),
  };
} };
globalThis.__checkoutTestAxios = fakeAxios;
const moduleUrl = source => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
let compiled = ts.transpileModule(readFileSync(new URL('../src/services/checkout.service.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
compiled = compiled
  .replace("'axios'", JSON.stringify(moduleUrl('export default globalThis.__checkoutTestAxios;')))
  .replace("'./api'", JSON.stringify(moduleUrl('export default {};')))
  .replace("'./finance.service'", JSON.stringify(moduleUrl('export const financeService = {};')))
  .replaceAll('import.meta.env', JSON.stringify({ VITE_COMMERCE_BACKEND: 'legacy', VITE_LEGACY_FINANCE_URL: 'http://127.0.0.1:3302/api' }));
const { checkoutService } = await import(moduleUrl(compiled));

test('payOS uses the configured finance bridge and unwraps Spring responses', async () => {
  envelope = { code: 1000, result: { available: true } };
  assert.equal(await checkoutService.paymentAvailable(), true);
  envelope = { code: 1000, result: { qrCode: 'qr', checkoutUrl: 'https://pay.payos.vn/test' } };
  assert.equal((await checkoutService.legacyPaymentLink('DH/test')).qrCode, 'qr');
  envelope = { code: 1000, result: { paymentStatus: 'PAID' } };
  assert.equal((await checkoutService.legacyPaymentStatus('DH/test')).paymentStatus, 'PAID');
  assert.ok(calls.every(call => call.baseURL === 'http://127.0.0.1:3302/api'));
  assert.equal(calls[1].path, '/orders/payos/DH%2Ftest/link');
  assert.equal(calls[2].config.headers['x-skip-cache'], 'true');
});

test('provider link failure preserves the backend explanation for retry UI', async () => {
  failure = { message: 'Request failed with status code 409', response: { data: { message: 'Payment provider is not configured' } } };
  await assert.rejects(checkoutService.legacyPaymentLink('DH/test'), /Payment provider is not configured/);
  failure = null;
  envelope = { success: true, data: { available: false } };
  assert.equal(await checkoutService.paymentAvailable(), false);
  delete globalThis.__checkoutTestAxios;
});
