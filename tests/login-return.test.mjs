import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import { readFileSync } from 'node:fs';

const code = ts.transpileModule(
  readFileSync(new URL('../src/utils/login-return.ts', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.ESNext } },
).outputText;
const {
  isMarketplaceLanding,
  homePathForUserRole,
  resolvePostLoginPath,
} = await import('data:text/javascript,' + encodeURIComponent(code));

test('marketplace landing paths are detected', () => {
  assert.equal(isMarketplaceLanding('/'), true);
  assert.equal(isMarketplaceLanding('/marketplace'), true);
  assert.equal(isMarketplaceLanding('/marketplace?q=ao'), true);
  assert.equal(isMarketplaceLanding('/products/ao-thun'), false);
  assert.equal(isMarketplaceLanding('/merchant/dashboard'), false);
});

test('post-login ignores marketplace redirect for staff roles', () => {
  assert.equal(
    resolvePostLoginPath('SHOP_MANAGER', ['shop', 'customer'], '/marketplace'),
    '/merchant/dashboard',
  );
  assert.equal(
    resolvePostLoginPath('SYSTEM_ADMIN', ['admin', 'customer'], '/'),
    '/admin/dashboard',
  );
  assert.equal(
    resolvePostLoginPath('COLLABORATOR', ['kol', 'customer'], '/search'),
    '/collaborator/dashboard',
  );
  assert.equal(
    resolvePostLoginPath('SYSTEM_MANAGER', ['admin'], '/marketplace'),
    '/admin/ops-dashboard',
  );
});

test('post-login keeps deep-link returnTo and customer marketplace home', () => {
  assert.equal(
    resolvePostLoginPath('SHOP_MANAGER', ['shop'], '/products/ao-thun'),
    '/products/ao-thun',
  );
  assert.equal(
    resolvePostLoginPath('CUSTOMER', ['customer'], '/marketplace'),
    '/marketplace',
  );
  assert.equal(homePathForUserRole('CUSTOMER', ['customer']), '/marketplace');
});
