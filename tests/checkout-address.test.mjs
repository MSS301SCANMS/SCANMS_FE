import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import ts from 'typescript';

const source = readFileSync(new URL('../src/utils/checkoutAddress.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { formatSavedAddressOption, resolveSavedShippingAddress } = await import(
  `data:text/javascript;charset=utf-8,${encodeURIComponent(compiled)}`
);

const provinces = [{
  code: 79,
  name: 'Thành phố Hồ Chí Minh',
  districts: [
    { code: 760, name: 'Quận 1', wards: [] },
    {
      code: 769,
      name: 'Thành phố Thủ Đức',
      wards: [{ code: 26845, name: 'Phường Tăng Nhơn Phú B' }],
    },
  ],
}];

test('legacy full address resolves the correct district and ward, never Quận 1 from house number 15A', () => {
  const result = resolveSavedShippingAddress({
    detailAddress: '15A đường số 8, Phường Tăng Nhơn Phú B, Thành phố Thủ Đức, Thành phố Hồ Chí Minh',
    provinceCode: null,
    provinceName: 'Toàn quốc',
    districtCode: null,
    districtName: 'Địa chỉ nhận hàng',
    wardCode: null,
    wardName: 'Điểm giao',
  }, provinces);

  assert.deepEqual(result, {
    detailAddress: '15A đường số 8',
    provinceCode: '79',
    districtCode: '769',
    wardCode: '26845',
  });
});

test('structured address uses stored codes and keeps the street detail', () => {
  const result = resolveSavedShippingAddress({
    detailAddress: '15A đường số 8',
    provinceCode: '79',
    provinceName: 'Thành phố Hồ Chí Minh',
    districtCode: '769',
    districtName: 'Thành phố Thủ Đức',
    wardCode: '26845',
    wardName: 'Phường Tăng Nhơn Phú B',
  }, provinces);

  assert.deepEqual(result, {
    detailAddress: '15A đường số 8',
    provinceCode: '79',
    districtCode: '769',
    wardCode: '26845',
  });
});

test('saved address choices show a compact street and district label', () => {
  assert.equal(formatSavedAddressOption({
    detailAddress: '15A đường số 8, Phường Tăng Nhơn Phú B, Thành phố Thủ Đức, Thành phố Hồ Chí Minh',
    districtName: 'Địa chỉ nhận hàng',
    provinceName: 'Toàn quốc',
    wardName: 'Điểm giao',
    isDefault: true,
  }, provinces), '⭐ Mặc định · 15A đường số 8 · Thủ Đức');

  assert.equal(formatSavedAddressOption({
    detailAddress: '100/31 Bình Giã',
    provinceName: 'Tỉnh Bà Rịa – Vũng Tàu',
    districtName: 'Thành phố Vũng Tàu',
    wardName: 'Phường 8',
    isDefault: false,
  }, provinces), '100/31 Bình Giã · Vũng Tàu');
});
