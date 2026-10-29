import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';

const source = readFileSync(new URL('../src/services/system-health-history.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText;
const { recordSample, summarize, describeCause, formatDuration, loadHistory, saveHistory, MAX_SAMPLES } =
  await import('data:text/javascript;base64,' + Buffer.from(compiled).toString('base64'));

const up = (t, ms = 40) => ({ t, up: true, ms });
const down = (t, err = 'network', status) => ({ t, up: false, ms: null, err, status });

test('opens one incident on the first failure and closes it on recovery', () => {
  let h = recordSample(undefined, up(1000));
  h = recordSample(h, down(2000, 'http5xx', 503));
  h = recordSample(h, down(3000, 'http5xx', 503));
  assert.equal(h.incidents.length, 1);
  assert.equal(h.incidents[0].startedAt, 2000);
  assert.equal(h.incidents[0].lastUpAt, 1000);
  assert.equal(h.incidents[0].status, 503);
  assert.equal(h.incidents[0].endedAt, undefined);
  h = recordSample(h, up(4000));
  assert.equal(h.incidents.length, 1);
  assert.equal(h.incidents[0].endedAt, 4000);
  h = recordSample(h, down(5000, 'timeout'));
  assert.equal(h.incidents.length, 2);
  assert.equal(h.incidents[0].err, 'timeout');
});

test('first observation that is already down has no last-up marker', () => {
  const h = recordSample(undefined, down(1000));
  assert.equal(h.incidents[0].lastUpAt, undefined);
});

test('keeps only the newest samples', () => {
  let h;
  for (let i = 0; i < MAX_SAMPLES + 25; i++) h = recordSample(h, up(i));
  assert.equal(h.samples.length, MAX_SAMPLES);
  assert.equal(h.samples[0].t, 25);
});

test('summary reports uptime, latency range and the open incident', () => {
  let h = recordSample(undefined, up(1, 100));
  h = recordSample(h, up(2, 300));
  h = recordSample(h, down(3));
  h = recordSample(h, up(4, 200));
  const sum = summarize(h);
  assert.equal(sum.sampleCount, 4);
  assert.equal(sum.uptimePct, 75);
  assert.equal(sum.avgMs, 200);
  assert.equal(sum.minMs, 100);
  assert.equal(sum.maxMs, 300);
  assert.equal(sum.openIncident, null);
  assert.equal(summarize(undefined).uptimePct, null);
});

test('storage round-trips and survives corrupt or blocked storage', () => {
  const data = {};
  const storage = { getItem: (k) => data[k] ?? null, setItem: (k, v) => { data[k] = v; } };
  saveHistory(storage, { a: recordSample(undefined, up(1)) });
  assert.equal(loadHistory(storage).a.samples.length, 1);
  storage.setItem('scanms-system-health-history-v1', '{not json');
  assert.deepEqual(loadHistory(storage), {});
  assert.deepEqual(loadHistory(undefined), {});
  assert.doesNotThrow(() => saveHistory({ getItem: () => null, setItem: () => { throw new Error('quota'); } }, {}));
});

test('cause hints distinguish gateway relays, timeouts and network failures', () => {
  const ctx = { isGateway: false, gatewayDown: false };
  assert.equal(describeCause({ up: true }, ctx), null);
  assert.match(describeCause({ up: false, err: 'http5xx', status: 503 }, ctx).title, /Gateway không gọi được/);
  assert.match(describeCause({ up: false, err: 'http5xx', status: 500 }, ctx).title, /báo lỗi/);
  assert.equal(describeCause({ up: false, err: 'timeout' }, ctx).tone, 'warn');
  assert.equal(describeCause({ up: false, err: 'network' }, ctx).tone, 'down');
  assert.equal(describeCause({ up: false, err: 'network' }, { isGateway: false, gatewayDown: true }).tone, 'idle');
  assert.match(describeCause({ up: false, err: 'network' }, { isGateway: true, gatewayDown: true }).text, /Gateway/);
});

test('formats durations in Vietnamese units', () => {
  assert.equal(formatDuration(5000), '5 giây');
  assert.equal(formatDuration(125000), '2 phút 5 giây');
  assert.equal(formatDuration(3 * 3600000 + 5 * 60000), '3 giờ 5 phút');
  assert.equal(formatDuration(-10), '0 giây');
});
