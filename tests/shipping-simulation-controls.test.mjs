import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const source = readFileSync(new URL('../src/components/shipping/ShippingSimulationControls.tsx', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: {
  module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022,
} }).outputText;
const module = { exports: {} };
// Static rendering only; no API requests or writes against actual orders.
new Function('require', 'module', 'exports', compiled)(
  id => id === '../../services/shipping.service' ? { shippingService: {} } : require(id), module, module.exports,
);
const { ShippingSimulationControls } = module.exports;
const render = tracking => renderToStaticMarkup(React.createElement(ShippingSimulationControls, {
  orderId: 'fixture-order', tracking, onStarted() {}, onCompleted() {},
}));

test('never shows test controls for LIVE, even if a stale or forged capability says true', () => {
  assert.equal(render({ environment: 'LIVE', simulationAvailable: true }), '');
});
test('hides test controls when the server disables or omits the capability', () => {
  assert.equal(render({ environment: 'TEST', simulationAvailable: false }), '');
  assert.equal(render({ environment: 'TEST' }), '');
});
test('an opted-in TEST purchase offers start with an explicit non-physical/non-payment warning', () => {
  const html = render({ environment: 'TEST', simulationAvailable: true });
  assert.match(html, /Bắt đầu mô phỏng giao hàng/);
  assert.match(html, /Không gọi GHN và không điều phối shipper thật/);
  assert.doesNotMatch(html, /Xác nhận giao thử thành công/);
});
test('a running TEST simulation offers the explicit delivery synchronization step', () => {
  const html = render({ environment: 'TEST', simulationAvailable: true, isSimulation: true });
  assert.match(html, /Xác nhận giao thử thành công/);
  assert.doesNotMatch(html, /sau 4 phút/);
  assert.doesNotMatch(html, /Bắt đầu mô phỏng giao hàng/);
});
