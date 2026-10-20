import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import test from 'node:test';
import ts from 'typescript';
import { renderToStaticMarkup } from 'react-dom/server';

const require = createRequire(import.meta.url);
const source = readFileSync(new URL('../src/components/live/LiveVoucherDropDialog.tsx', import.meta.url), 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText;
function all(node, type) {
  if (!node || typeof node !== 'object') return [];
  if (Array.isArray(node)) return node.flatMap(child => all(child, type));
  return [...(node.type === type ? [node] : []), ...all(node.props?.children, type)];
}
function setup({ remaining = 80, status = 'LIVE', fail = false } = {}) {
  const state = [{ id: 'session', status, coupon: { id: 'coupon', displayCode: 'LIVE10', status: 'ACTIVE',
    discountType: 'PERCENTAGE', discountValue: 10, usageLimitTotal: remaining, usageCount: 0 } }, false, false, false, '50', '', 0];
  let index = 0;
  const requests = [], published = [];
  const module = { exports: {} };
  vm.runInNewContext(code, { module, exports: module.exports, require: name => {
    if (name === 'react') return { ...require(name), useEffect: () => {}, useState: () => {
      const i = index++;
      return [state[i], value => { state[i] = typeof value === 'function' ? value(state[i]) : value; }];
    } };
    if (name.endsWith('/services/api')) return { __esModule: true, default: { post: async (url, body) => {
      requests.push({ url, body });
      if (fail) throw new Error('offline');
      return { data: { code: 'LIVE10', quantity: body.quantity } };
    } } };
    return require(name);
  } });
  const render = () => { index = 0; return module.exports.LiveVoucherDropDialog({ sessionId: 'session', onClose: () => {}, onReleased: value => published.push(value) }); };
  return { render, requests, published };
}
test('requires selecting the real voucher, changes quantity, then submits selected coupon and count', async () => {
  const { render, requests, published } = setup();
  assert.equal(all(render(), 'button').at(-1).props.disabled, true);
  all(render(), 'button').find(button => 'aria-pressed' in button.props).props.onClick();
  const quantity20 = all(render(), 'button').find(button => button.props.children === 20);
  quantity20.props.onClick();
  const confirm = all(render(), 'button').at(-1);
  assert.equal(confirm.props.disabled, false);
  confirm.props.onClick();
  await new Promise(setImmediate);
  assert.deepEqual(requests.map(({ url, body }) => [url, body.couponId, body.quantity]), [['/live-sessions/session/voucher-drop', 'coupon', 20]]);
  assert.equal(published[0].quantity, 20);
});
test('cannot submit more than remaining uses or after the live ends', () => {
  for (const options of [{ remaining: 20 }, { status: 'ENDED' }]) {
    const { render } = setup(options);
    all(render(), 'button').find(button => 'aria-pressed' in button.props).props.onClick();
    assert.equal(all(render(), 'button').at(-1).props.disabled, true);
  }
});
test('a failed API call stays open with an error and does not publish a success', async () => {
  const { render, published } = setup({ fail: true });
  all(render(), 'button').find(button => 'aria-pressed' in button.props).props.onClick();
  all(render(), 'button').at(-1).props.onClick();
  await new Promise(setImmediate);
  assert.equal(published.length, 0);
  assert.match(renderToStaticMarkup(render()), /Chưa tung được voucher/);
});
