import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const require = createRequire(import.meta.url);
const source = readFileSync(new URL('../src/pages/merchant/LiveSessionsPage.tsx', import.meta.url), 'utf8');
const created = {
  id: 'new-session', title: 'SALE20-10', platform: 'SCANMS',
  status: 'PENDING_CREATOR', inviteStatus: 'PENDING',
  startsAt: '2026-10-18T09:00:00Z', endsAt: '2026-10-18T10:00:00Z',
  creator: { id: 'kol', fullName: 'Test creator' },
  coupon: { displayCode: 'LIVE10', discountType: 'PERCENTAGE', discountValue: 10, usageCount: 0, usageLimitTotal: 100 },
  products: [], commissionRate: 2,
};
function render(session, reproduceOldBug = false, loadError = '') {
  let code = source.replaceAll('import.meta.env.VITE_COMMERCE_BACKEND', JSON.stringify('spring'))
    .replace('useState<LiveSessionItem | null>(null)', `useState<LiveSessionItem | null>(${JSON.stringify(session)})`)
    .replace('useState<LiveSessionItem[]>([])', `useState<LiveSessionItem[]>(${JSON.stringify([session])})`)
    .replace('const [loading, setLoading] = useState(true)', 'const [loading, setLoading] = useState(false)')
    .replace("const [loadError, setLoadError] = useState('');", `const [loadError, setLoadError] = useState(${JSON.stringify(loadError)});`);
  if (reproduceOldBug) code = code.replaceAll('detailModalSession.report?.', 'detailModalSession.report.');
  const output = ts.transpileModule(code, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const module = { exports: {} };
  const noop = () => null;
  vm.runInNewContext(output, {
    module, exports: module.exports,
    require: name => {
      if (name === 'react' || name === 'react/jsx-runtime' || name === 'lucide-react') return require(name);
      if (name === 'react-router-dom') return { useSearchParams: () => [new URLSearchParams(), () => {}], Link: ({to, children, ...props}) => React.createElement('a', {href:to, ...props}, children) };
      if (name.includes('livestream-lifecycle')) return { livestreamStatusLabel: status => status, livestreamLifecycle: row => row };
      return { __esModule: true, default: {}, HubTabs: noop, Select: noop, DateTimePicker: noop, LiveGovernancePanel: noop };
    }, URLSearchParams,
  });
  return renderToStaticMarkup(React.createElement(module.exports.default, {}));
}
assert.throws(() => render(created, true), /grossSales|undefined/, 'old create response should reproduce the crash');
const html = render(created);
assert.ok(html.includes('SALE20-10') && html.includes('LIVE10'), 'create response without report must render');
assert.ok(render({ ...created, report: { grossSales: 250000, orders: 7, claims: 9, commission: 35000 } }).includes('250.000'), 'loaded report should retain actual metrics');
assert.ok(render({ ...created, status: 'LIVE', inviteStatus: 'ACCEPTED' }).includes('Kết thúc phiên'), 'shop must have an end action directly on an active session card');
console.log('PASS: reproduces previous crash, renders newly created session without report, preserves loaded report');
const disconnected = render(created, false, 'Máy chủ tạm thời mất kết nối.');
assert.ok(disconnected.includes('role="alert"') && disconnected.includes('Thử lại'), 'connection failure must show a recoverable error with a retry button');
assert.ok(!disconnected.includes('Đang tải dữ liệu'), 'failed initialization must leave the loading state');
