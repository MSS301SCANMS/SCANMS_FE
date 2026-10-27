import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const module = { exports: {} };
vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../src/utils/registration-error.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, { module, exports: module.exports });
const { registrationErrorMessage } = module.exports;

test('legacy wrapped Keycloak duplicate email is translated without leaking its admin URL', () => {
  const text = registrationErrorMessage({ response: { status: 500, data: { message: '409 Conflict on POST http://localhost:8180/admin/realms/scanms/users: {"errorMessage":"User exists with same email"}' } } });
  assert.match(text, /Email đã được sử dụng/);
  assert.doesNotMatch(text, /localhost|admin\/|errorMessage/);
});

test('duplicate usernames remain distinct from duplicate email', () => {
  assert.match(registrationErrorMessage({ response: { status: 409, data: { message: 'User exists with same username' } } }), /Tên đăng nhập đã tồn tại/);
  assert.match(registrationErrorMessage({ response: { status: 409, data: { message: 'Tên đăng nhập hoặc email đã tồn tại' } } }), /Tên đăng nhập hoặc email/);
});

test('provider failures do not surface internal exception details', () => {
  assert.doesNotMatch(registrationErrorMessage({ response: { status: 503 }, message: 'private http://identity/admin/users' }), /private|http|admin/);
  assert.match(registrationErrorMessage({ code: 'ERR_NETWORK' }), /Không thể kết nối/);
});
