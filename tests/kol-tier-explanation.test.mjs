import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import test from 'node:test';
import ts from 'typescript';
import { renderToStaticMarkup } from 'react-dom/server';

const require = createRequire(import.meta.url);
const source = readFileSync(new URL('../src/components/affiliate/KolTierExplanation.tsx', import.meta.url), 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText;
const module = { exports: {} };
vm.runInNewContext(code, { module, exports: module.exports, require });
const bronze = { name: 'Đồng', minRevenueThreshold: 0, extraBonusPercentage: 0 };
const gold = { name: 'Vàng', minRevenueThreshold: 20000000, extraBonusPercentage: 2 };
const diamond = { name: 'Kim Cương', minRevenueThreshold: 50000000, extraBonusPercentage: 3 };
const render = (status) => renderToStaticMarkup(module.exports.KolTierExplanation({ status: {
  currentTier: bronze, qualifiedTier: gold, currentRevenue: 25000000, nextTier: gold,
  assessmentPeriod: { startsAt: '2026-08-31T17:00:00Z', endsAt: '2026-09-30T17:00:00Z' },
  nextEvaluationAt: '2026-10-31T17:15:00Z', ...status,
} }));

test('explains eligibility without claiming a pending promotion already applies', () => {
  const html = render({});
  assert.match(html, /Đủ điều kiện lên hạng Vàng/);
  assert.match(html, /Hạng đang áp dụng vẫn là Đồng/);
  assert.match(html, /25\.000\.000/);
  assert.match(html, /09\/2026/);
  assert.match(html, /01\/11\/2026/);
});
test('explains an unmet threshold and possible demotion without inventing promotion history', () => {
  const html = render({ currentTier: gold, qualifiedTier: bronze, currentRevenue: 1000000, nextTier: diamond });
  assert.match(html, /có thể điều chỉnh giảm/);
  assert.match(html, /49\.000\.000/);
  assert.doesNotMatch(html, /Bạn đã lên hạng/);
});
test('shows the applied bonus and month-based rules when assigned and qualified tier agree', () => {
  const html = render({ currentTier: gold, qualifiedTier: gold, nextTier: diamond });
  assert.match(html, /Hạng Vàng đang áp dụng thưởng thêm \+2%/);
  assert.match(html, /Không tính cộng dồn nhiều tháng/);
});
