import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';

const source = readFileSync(new URL('../src/services/ops-format.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText;
const { opsPath, formatBytes, percentOf, classifyOpsError } = await import('data:text/javascript;base64,' + Buffer.from(compiled).toString('base64'));

test('ops paths go through the gateway rewrite for services and directly for the gateway', () => {
  assert.equal(opsPath('payment-service', 'scanmsinfo'), '/api/v1/ops/payment/scanmsinfo');
  assert.equal(opsPath('promotion-affiliate-service', 'scanmslogs'), '/api/v1/ops/promotion/scanmslogs');
  assert.equal(opsPath('scanms-gateway', 'scanmsinfo'), '/actuator/scanmsinfo');
  assert.equal(opsPath('ai-service', 'scanmsinfo'), null);
});

test('bytes are formatted with sensible units', () => {
  assert.equal(formatBytes(512), '512 B');
  assert.equal(formatBytes(1536), '1.5 KB');
  assert.equal(formatBytes(268435456), '256 MB');
  assert.equal(formatBytes(4294967296), '4.0 GB');
  assert.equal(formatBytes(null), '—');
  assert.equal(formatBytes(-1), '—');
  assert.equal(formatBytes(Number.NaN), '—');
});

test('percentages ignore missing or zero totals', () => {
  assert.equal(percentOf(25, 200), 12.5);
  assert.equal(percentOf(1, 3), 33.3);
  assert.equal(percentOf(5, 0), null);
  assert.equal(percentOf(null, 10), null);
});

test('errors are classified so the panel can say why data is missing', () => {
  assert.equal(classifyOpsError({ status: 401 }).kind, 'unauthenticated');
  assert.equal(classifyOpsError({ response: { status: 403 } }).kind, 'forbidden');
  assert.equal(classifyOpsError({ status: 404 }).kind, 'unsupported');
  assert.equal(classifyOpsError({ status: 503 }).kind, 'unavailable');
  assert.equal(classifyOpsError({ status: 502 }).kind, 'unavailable');
  assert.equal(classifyOpsError(new Error('Network Error')).kind, 'unavailable');
  assert.equal(classifyOpsError({ status: 500 }).kind, 'error');
  assert.match(classifyOpsError({ status: 500 }).message, /500/);
});
