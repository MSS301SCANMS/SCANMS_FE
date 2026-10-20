import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import ts from 'typescript';
const source = readFileSync(new URL('../src/utils/report-export.ts', import.meta.url), 'utf8');
const output = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext } }).outputText;
const { csvCell, reportCsv, vietnamDateRange } = await import(`data:text/javascript;base64,${Buffer.from(output).toString('base64')}`);
test('CSV quotes commas, newlines and quotes with UTF8 BOM', () => {
  assert.equal(reportCsv([['Shop, A', 'a"b', 'line\nbreak']]), '\uFEFF"Shop, A","a""b","line\nbreak"');
});
test('CSV neutralizes formula injection without altering numeric negatives', () => {
  for (const value of ['=SUM(1,1)', '+cmd', '-cmd', '@cmd', '\t=cmd']) assert.ok(csvCell(value).startsWith('"\''));
  assert.equal(csvCell(-12), '"-12"');
});
test('custom range includes the full final Vietnam day', () => {
  assert.deepEqual(vietnamDateRange('2026-10-18', '2026-10-18'), { startDate: '2026-10-17T17:00:00.000Z', endDate: '2026-10-18T16:59:59.999Z' });
});
test('rejects incomplete, reversed and excessive date ranges', () => {
  for (const [a, b] of [['', '2026-10-18'], ['2026-10-20', '2026-10-18'], ['2020-01-01', '2026-10-18'], ['2026-02-31', '2026-03-05']]) assert.throws(() => vietnamDateRange(a, b));
});
