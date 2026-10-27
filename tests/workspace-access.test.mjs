import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const moduleUrl = text => 'data:text/javascript;base64,' + Buffer.from(text).toString('base64');
const compile = file => ts.transpileModule(readFileSync(new URL('../src/utils/' + file, import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const access = await import(moduleUrl(compile('workspace-access.ts').replace("'./login-return'", JSON.stringify(moduleUrl(compile('login-return.ts'))))));
const user = (role, roles = [role, 'USER']) => ({ id: role, role, roles });

test('administrative accounts have only their operational workspace even when other roles remain', () => {
  for (const role of ['ADMIN', 'SYSTEM_ADMIN', 'MANAGER', 'SYSTEM_MANAGER']) {
    const account = user(role, [role, 'USER', 'SHOP_OWNER', 'KOL_CTV']);
    assert.deepEqual(access.workspaceKeys(account), ['admin']);
    assert.equal(access.canUseWorkspaceRoute(account, '/customer/wallet'), false);
    assert.equal(access.canUseWorkspaceRoute(account, '/merchant/products'), false);
    assert.equal(access.canUseWorkspaceRoute(account, '/collaborator/wallet'), false);
    assert.equal(access.canUseWorkspaceRoute(account, '/marketplace'), false);
    assert.equal(access.canUseWorkspaceRoute(account, '/products/shared'), true);
  }
});

test('shop and KOL keep personal buying capability without gaining the other business role', () => {
  assert.deepEqual(access.workspaceKeys(user('SHOP_OWNER')), ['customer', 'shop']);
  assert.deepEqual(access.workspaceKeys(user('KOL_CTV')), ['customer', 'kol']);
  assert.equal(access.canUseWorkspaceRoute(user('CUSTOMER'), '/admin/users'), false);
  assert.equal(access.canUseWorkspaceRoute(user('SHOP_OWNER'), '/collaborator/wallet'), false);
  assert.equal(access.canUseWorkspaceRoute(user('KOL_CTV'), '/merchant/settings'), false);
});

test('login redirects are checked against the actual account rather than role selector or old page', () => {
  assert.deepEqual(access.loginDestination(user('ADMIN'), '/customer/orders'), { path: '/admin/dashboard', workspace: 'admin' });
  assert.deepEqual(access.loginDestination(user('MANAGER'), '/admin/system-wallet'), { path: '/admin/ops-dashboard', workspace: 'admin' });
  assert.equal(access.loginDestination(user('CUSTOMER'), '/admin/users').path, '/marketplace');
  assert.equal(access.loginDestination(user('SHOP_OWNER'), '//external.test').path, '/merchant/dashboard');
  assert.equal(access.loginDestination(user('KOL_CTV'), '/merchant/dashboard').path, '/collaborator/dashboard');
  assert.deepEqual(access.loginDestination(user('SHOP_OWNER'), '/customer/orders'), { path: '/customer/orders', workspace: 'customer' });
  assert.equal(access.loginDestination(user('ADMIN'), '/products/shared?live=one').path, '/products/shared?live=one');
});
