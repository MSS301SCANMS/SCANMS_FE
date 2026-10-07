import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
const load = async path => {
  const source = await readFile(new URL(path, import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
};
const { amountVnd, money } = await load('../src/pages/finance/money.ts');
const { commandKey, completeCommand } = await load('../src/pages/finance/commandKey.ts');
test('finance accepts integer VND and rejects fractional, negative, overflow and formatted amounts', () => {
  assert.equal(amountVnd('200000'), 200000); assert.equal(amountVnd(' 200000 '), 200000);
  for (const value of ['0', '-1', '200000.50', '200,000', '200.000', '1e6', 'Infinity', '9000000000001']) assert.throws(() => amountVnd(value));
  assert.match(money(200000), /200\.000/);
});
test('pending financial command retains its key across reload and changes only after success or a new payload', () => {
  const values = new Map(); globalThis.sessionStorage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
  const first = commandKey('wallet', 'withdraw:200000'); assert.equal(commandKey('wallet', 'withdraw:200000'), first);
  assert.notEqual(commandKey('wallet', 'withdraw:300000'), first);
  completeCommand('wallet'); assert.notEqual(commandKey('wallet', 'withdraw:200000'), first);
});
