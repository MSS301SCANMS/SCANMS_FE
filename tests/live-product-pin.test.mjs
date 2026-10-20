import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import test from 'node:test';
import ts from 'typescript';
import { renderToStaticMarkup } from 'react-dom/server';

const require = createRequire(import.meta.url);
const source = readFileSync(new URL('../src/components/live/HostStudioProducts.tsx', import.meta.url), 'utf8');
const output = ts.transpileModule(source, { compilerOptions: {
  module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022,
} }).outputText;
const module = { exports: {} };
vm.runInNewContext(output, { module, exports: module.exports, require });
const { HostStudioProducts } = module.exports;
const products = [
  { id: 'first', title: 'Serum', price: 250000 },
  { id: 'next', title: 'Cleanser', price: 160000, livePrice: 144000 },
];
function buttons(node) {
  if (!node || typeof node !== 'object') return [];
  if (Array.isArray(node)) return node.flatMap(buttons);
  return [...(node.type === 'button' ? [node] : []), ...buttons(node.props?.children)];
}
test('unpin clears selection and pinning another item replaces it', () => {
  let pinnedId = 'first';
  const render = () => HostStudioProducts({ products, pinnedId, pendingId: null, disabled: false,
    onPinChange: id => { pinnedId = id; } });
  const initial = render();
  assert.match(renderToStaticMarkup(initial), /Bỏ ghim/);
  assert.doesNotMatch(renderToStaticMarkup(initial), /Đã bán|#6/);
  buttons(initial)[0].props.onClick();
  assert.equal(pinnedId, null);
  assert.doesNotMatch(renderToStaticMarkup(render()), /Bỏ ghim|Đang giới thiệu/);
  buttons(render())[1].props.onClick();
  assert.equal(pinnedId, 'next');
  assert.equal((renderToStaticMarkup(render()).match(/Bỏ ghim/g) || []).length, 1);
});
test('pending requests and ended or unauthorized sessions disable every pin action', () => {
  for (const state of [{ pendingId: 'first', disabled: false }, { pendingId: null, disabled: true }]) {
    const tree = HostStudioProducts({ products, pinnedId: 'first', ...state, onPinChange: () => {} });
    assert.ok(buttons(tree).every(button => button.props.disabled));
  }
});
