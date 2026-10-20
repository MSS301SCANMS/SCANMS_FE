import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';
const source = readFileSync(new URL('../src/utils/ghn-tracking.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { getGhnTrackingCode, isGhnCarrier } = await import(`data:text/javascript;charset=utf-8,${encodeURIComponent(compiled)}`);
test('uses official and manual GHN codes consistently; never sends other carriers to GHN', () => {
  assert.equal(getGhnTrackingCode({ ghnOrderCode: 'L8RBUE', trackingNumber: 'OLD' }), 'L8RBUE');
  assert.equal(getGhnTrackingCode({ trackingNumber: 'L8RBUE', carrierName: 'Giao Hàng Nhanh (GHN)' }), 'L8RBUE');
  assert.equal(getGhnTrackingCode({ trackingNumber: 'GHTK123', carrierName: 'GHTK' }), null);
  assert.equal(getGhnTrackingCode({ trackingNumber: 'GHN-MAYBE' }), null);
});
test('handles missing and ambiguous carrier data without tracking the wrong shipment', () => {
  assert.equal(getGhnTrackingCode(null), null);
  assert.equal(getGhnTrackingCode({ ghnOrderCode: '  ', trackingNumber: '  L8RBUE  ', shippingCarrier: 'GHN' }), 'L8RBUE');
  assert.equal(getGhnTrackingCode({ trackingNumber: 'L8RBUE', carrierName: 'GHNEXPRESS' }), null);
  assert.equal(isGhnCarrier('Giao Hàng Nhanh'), true);
  assert.equal(isGhnCarrier(undefined), false);
});
