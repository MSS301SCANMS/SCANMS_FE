import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import ts from 'typescript';

const source = readFileSync(new URL('../src/pages/merchant/LiveSessionsPage.tsx', import.meta.url), 'utf8');
const ast = ts.createSourceFile('LiveSessionsPage.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let declaration;
function visit(node) {
  if (ts.isVariableStatement(node) && node.declarationList.declarations.some(item => item.name.getText(ast) === 'loadSessions')) declaration = node.getText(ast);
  ts.forEachChild(node, visit);
}
visit(ast);
assert.ok(declaration, 'load the actual session refresh callback');
async function simulateModalRefresh(oldDependencies = false) {
  let lastDependencies, memo, effectDependency, requests = 0;
  let selected = { id: 'created-session', report: undefined };
  let list = [];
  const context = vm.createContext({
    detailModalSession: selected,
    api: { get: async () => {
      requests++;
      return { data: [{ id: 'created-session', report: { orders: 3 } }] };
    } },
    setSessions: value => { list = value; },
    setDetailModalSession: value => {
      selected = typeof value === 'function' ? value(selected) : value;
      context.detailModalSession = selected;
    },
    toast: { error: () => {} },
    useCallback: (callback, dependencies) => {
      if (!lastDependencies || dependencies.some((value, index) => value !== lastDependencies[index])) memo = callback;
      lastDependencies = dependencies;
      return memo;
    },
  });
  const code = ts.transpileModule(oldDependencies ? declaration.replace(/\[\]\);$/, '[detailModalSession]);') : declaration,
    { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  const render = vm.runInContext(`(function () { ${code}; return loadSessions; })`, context);
  let callback;
  for (let cycle = 0; cycle < 5; cycle++) {
    callback = render();
    if (effectDependency !== callback) {
      effectDependency = callback;
      await callback('store');
    }
  }
  return { requests, selected, list, callback, context };
}
test('reproduces the old loading loop after opening newly created session details', async () => {
  assert.equal((await simulateModalRefresh(true)).requests, 5);
});
test('refreshes once while still updating the open session details', async () => {
  const result = await simulateModalRefresh();
  assert.equal(result.requests, 1);
  assert.equal(result.selected.id, 'created-session');
  assert.equal(result.selected.report.orders, 3);
  assert.equal(result.list.length, 1);
});
test('manual refresh uses the currently open details rather than a stale selection', async () => {
  const result = await simulateModalRefresh();
  result.context.setDetailModalSession({ id: 'another-session', report: { orders: 9 } });
  await result.callback('store');
  assert.equal(result.context.detailModalSession.id, 'another-session');
  assert.equal(result.context.detailModalSession.report.orders, 9);
  result.context.setDetailModalSession(null);
  await result.callback('store');
  assert.equal(result.context.detailModalSession, null);
});
