import assert from 'node:assert/strict';
import { test } from 'node:test';
import { existsSync, readFileSync } from 'node:fs';
import ts from 'typescript';

// Compile pure TS modules in memory for Node's test runner; no browser globals.
async function loadTypeScript(relativePath) {
  const source = readFileSync(new URL(relativePath, import.meta.url), 'utf8');
  const output = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext } }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(output).toString('base64')}`);
}
const { marketplaceProducts: products, marketplaceKOLs: creators, marketplaceVideos: videos } = await loadTypeScript('../src/features/marketplace/marketplaceData.ts');
const { calculateCart, normalizeSearch, formatMoney } = await loadTypeScript('../src/features/marketplace/marketplaceUtils.ts');

test('Vietnamese search ignores case, diacritics and đ', () => {
  assert.equal(normalizeSearch('  Nguyễn Đình Tuấn  '), 'nguyen dinh tuan');
  assert.equal(normalizeSearch('CHỐNG NẮNG'), 'chong nang');
});
test('empty cart does not earn a discount', () => {
  assert.deepEqual(calculateCart([], products, creators[0]), { subtotal: 0, discount: 0, total: 0 });
});
test('eligible product receives creator discount', () => {
  assert.deepEqual(calculateCart([{ productId: 'P01', quantity: 1 }], products, creators[0]), { subtotal: 459000, discount: 45900, total: 413100 });
});
test('discount is capped and respects minimum order', () => {
  assert.equal(calculateCart([{ productId: 'P01', quantity: 3 }], products, creators[0]).discount, 50000);
  assert.equal(calculateCart([{ productId: 'P04', quantity: 1 }], products, creators[0]).discount, 0);
});
test('wrong creator code cannot discount unrelated products', () => {
  assert.equal(calculateCart([{ productId: 'P01', quantity: 1 }], products, creators[1]).discount, 0);
  assert.equal(calculateCart([{ productId: 'P01', quantity: 1 }, { productId: 'P08', quantity: 1 }], products, creators[0]).discount, 45900);
});
test('12 percent code uses its actual percentage', () => {
  assert.equal(calculateCart([{ productId: 'P02', quantity: 1 }], products, creators[1]).discount, 46680);
});
test('all fixture assets exist inside frontend public', () => {
  for (const asset of [...products.map(p => p.image), ...creators.map(c => c.avatarImg), ...videos.map(v => v.thumbnail), '/reference/assets/sample-video.mp4']) {
    assert(existsSync(new URL(`../public${asset}`, import.meta.url)), asset);
  }
});
test('all original local script and stylesheet entry points are copied', () => {
  const html = readFileSync(new URL('../public/reference/index.html', import.meta.url), 'utf8');
  for (const match of html.matchAll(/(?:src|href)="(\.\/[^"?]+)(?:\?[^\"]*)?"/g)) {
    assert(existsSync(new URL(`../public/reference/${match[1]}`, import.meta.url)), match[1]);
  }
});
test('currency is formatted in Vietnamese dong', () => {
  assert.match(formatMoney(459000), /459\.000/);
});
test('reference prototype is preserved independently of the live microservice routes', () => {
  assert(existsSync(new URL('../public/reference/index.html', import.meta.url)));
  const routes = readFileSync(new URL('../src/routes/AppRoutes.tsx', import.meta.url), 'utf8');
  assert.match(routes, /path="\/prototype"/);
  assert.doesNotMatch(routes, /import\('\.\.\/pages\/public\/MarketplacePage'\)/);
});
