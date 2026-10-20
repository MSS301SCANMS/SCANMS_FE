import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const source = await readFile(new URL('../src/utils/marketplace-category.utils.ts', import.meta.url), 'utf8');
const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { matchesHomeCategory, normalizeCategory } = await import(`data:text/javascript;base64,${Buffer.from(output).toString('base64')}`);

test('homepage category filters accept Vietnamese seed catalogue labels and exclude other industries', () => {
  assert.equal(matchesHomeCategory('Chăm sóc da', 'skin'), true);
  assert.equal(matchesHomeCategory('Chăm sóc tóc', 'body'), true);
  assert.equal(matchesHomeCategory('Thực phẩm bổ sung', 'health'), true);
  assert.equal(matchesHomeCategory('Trang điểm', 'makeup'), true);
  assert.equal(matchesHomeCategory('Thực phẩm sức khỏe', 'skin'), false);
});

test('homepage category matching is accent/case independent and unknown filters do not hide all products', () => {
  assert.equal(normalizeCategory('  TRANG ĐIỂM '), 'trang diem');
  assert.equal(matchesHomeCategory('CHĂM SÓC DA', 'skin'), true);
  assert.equal(matchesHomeCategory('Chăm sóc da', 'unknown'), true);
});
