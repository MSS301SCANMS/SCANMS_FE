import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

async function loadTypeScript(relativePath) {
  const source = await readFile(new URL(relativePath, import.meta.url), 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(output).toString('base64')}`);
}

const { getSafeRedirect } = await loadTypeScript('../src/utils/authRedirect.ts');
const { isVoucherEligible } = await loadTypeScript('../src/services/buyer-voucher.service.ts');

test('login redirect only accepts local application paths', () => {
  assert.equal(getSafeRedirect('/products/serum?voucher=SAVE10'), '/products/serum?voucher=SAVE10');
  assert.equal(getSafeRedirect('https://attacker.test'), null);
  assert.equal(getSafeRedirect('//attacker.test'), null);
  assert.equal(getSafeRedirect('/login'), '/marketplace');
});

test('saved voucher eligibility respects subtotal, store, product and expiry', () => {
  const base = {
    id: 'v-1',
    code: 'SAVE10',
    title: 'Save',
    description: 'Save',
    scope: 'PRODUCT',
    storeId: 'store-1',
    productIds: ['product-1'],
    minimumOrderAmount: 200000,
    expiresAt: '2027-01-01T00:00:00.000Z',
    savedAt: '2026-01-01T00:00:00.000Z',
  };
  const now = new Date('2026-09-20T00:00:00.000Z').getTime();
  assert.equal(isVoucherEligible(base, { storeId: 'store-1', productId: 'product-1', subtotal: 250000 }, now), true);
  assert.equal(isVoucherEligible(base, { storeId: 'store-1', productId: 'product-1', subtotal: 150000 }, now), false);
  assert.equal(isVoucherEligible(base, { storeId: 'store-2', productId: 'product-1', subtotal: 250000 }, now), false);
  assert.equal(isVoucherEligible(base, { storeId: 'store-1', productId: 'product-2', subtotal: 250000 }, now), false);
  assert.equal(isVoucherEligible(base, { storeId: 'store-1', productId: 'product-1', subtotal: 250000 }, new Date('2028-01-01').getTime()), false);
});

