import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const originalStorage = globalThis.localStorage;
const originalWindow = globalThis.window;
const memory = new Map();
globalThis.localStorage = {
  setItem: (key, value) => memory.set(key, value),
  getItem: (key) => memory.get(key) ?? null,
  removeItem: (key) => memory.delete(key),
};
globalThis.window = { dispatchEvent() {} };
const requests = [];
globalThis.__scanmsLoginTestApi = {
  async post(url, payload) {
    requests.push({ url, payload });
    return { accessToken: 'test-token', user: { id: 'test-customer', role: 'CUSTOMER', email: 'customer@example.test' } };
  },
};
const source = (await readFile(new URL('../src/services/auth.service.ts', import.meta.url), 'utf8'))
  .replace("import api from './api';", 'const api = globalThis.__scanmsLoginTestApi;');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { authService } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);

after(() => {
  if (originalStorage === undefined) delete globalThis.localStorage;
  else globalThis.localStorage = originalStorage;
  if (originalWindow === undefined) delete globalThis.window;
  else globalThis.window = originalWindow;
  delete globalThis.__scanmsLoginTestApi;
});

test('login submits one identifier for email and phone, preserving the password verbatim', async () => {
  for (const value of [' customer@example.test ', ' +84 901 234 567 ']) {
    await authService.login(value, ' Password2026! ');
    assert.deepEqual(requests.at(-1), {
      url: '/auth/login', payload: { identifier: value.trim(), password: ' Password2026! ' },
    });
    assert.equal(memory.get('token'), 'test-token');
    assert.equal(JSON.parse(memory.get('user')).id, 'test-customer');
  }
});

test('login input permits phone entry and password-manager username autofill', async () => {
  const page = await readFile(new URL('../src/pages/auth/LoginPage.tsx', import.meta.url), 'utf8');
  assert.match(page, /id="login-identifier"[\s\S]*?type="text"[\s\S]*?autoComplete=\{demoLogin \? 'off' : `section-\$\{role\} username`\}/);
  assert.match(page, /placeholder="Email hoặc số điện thoại đã đăng ký"/);
  assert.doesNotMatch(page, /setPassword\('Password@123'\)/);
});

test('inline marketplace login preserves phone support while OTP registration still requires email', async () => {
  const page = await readFile(new URL('../src/components/marketplace/QuickCustomerAuth.tsx', import.meta.url), 'utf8');
  assert.match(page, /type=\{mode === 'login' \? 'text' : 'email'\}/);
  assert.match(page, /autoComplete=\{mode === 'login' \? 'username' : 'email'\}/);
  assert.match(page, /authService\.login\(mode === 'login' \? identifier\.trim\(\) : normalizedEmail, password\)/);
});
