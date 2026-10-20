import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
const source = await readFile(new URL('../src/utils/product-sort.utils.ts', import.meta.url), 'utf8');
const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { sortCatalogProducts } = await import(`data:text/javascript;base64,${Buffer.from(output).toString('base64')}`);
const items = [
  { id: 'old', price: 100, createdAt: '2026-01-01', soldCount: 5, viewCount: 1, stockQuantity: 999 },
  { id: 'new', price: 300, createdAt: '2026-03-01', soldCount: 1, viewCount: 0, stockQuantity: 5000 },
  { id: 'visited', price: 200, createdAt: '2026-02-01', soldCount: 4, viewCount: 3, stockQuantity: 0 },
];
for (const [sort, expected] of [
  ['popular', ['visited', 'old', 'new']], ['newest', ['new', 'visited', 'old']],
  ['sales', ['old', 'visited', 'new']], ['price_asc', ['old', 'visited', 'new']],
  ['price_desc', ['new', 'visited', 'old']],
]) test(`${sort} uses the actual metric and never the inventory or UUID order`, () => {
  assert.deepEqual(sortCatalogProducts(items, sort).map(p => p.id), expected);
  assert.deepEqual(items.map(p => p.id), ['old', 'new', 'visited']);
});
test('missing metrics use zero and ties use date then ID consistently', () => {
  const tied = [{ id: 'b', price: 100 }, { id: 'a', price: 100 }, { id: 'latest', price: 100, createdAt: '2026-01-01' }];
  assert.deepEqual(sortCatalogProducts(tied, 'sales').map(p => p.id), ['latest', 'a', 'b']);
});
