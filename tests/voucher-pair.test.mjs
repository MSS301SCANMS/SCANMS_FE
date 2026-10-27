import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function load(path, require = () => ({})) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText,
    { exports, require, Map, Set, Promise, Number, Math });
  return exports;
}
const best = load('../src/utils/best-voucher.utils.ts');
function fixture() {
  const calls = [];
  const amounts = { GOODS10: 10000, GOODS30: 30000, SHIP50: 30000, SHIP10: 10000 };
  const checkoutService = { quote: async input => {
    calls.push(input);
    if (input.couponCode === 'BAD') throw Error('Used by this customer');
    const goods = input.couponCode?.startsWith('GOODS') ? amounts[input.couponCode] : 0;
    const shipping = amounts[input.shippingCouponCode] || (input.couponCode?.startsWith('SHIP') ? amounts[input.couponCode] : 0) || 0;
    return { code: input.couponCode || '', shippingCouponCode: input.shippingCouponCode || '', discountAmount: goods || 0,
      shippingDiscountVnd: shipping, finalAmount: 330000 - (goods || 0) - shipping, benefitType: shipping ? 'SHIPPING' : 'GOODS' };
  } };
  const couponService = { getPublicPlatformCoupons: async () => ['GOODS10', 'GOODS30', 'SHIP10', 'SHIP50', 'BAD'].map(code => ({ code, benefitType: code.startsWith('SHIP') ? 'SHIPPING' : 'GOODS' })) };
  const service = load('../src/services/checkout-voucher.service.ts', path => path.includes('best-voucher') ? best : path.includes('coupon.service') ? { couponService } : { checkoutService });
  return { ...service, calls };
}

test('auto checkout selects the best code in each benefit and validates their combined server total', async () => {
  const { recommendVoucherSelection, calls } = fixture();
  const result = await recommendVoucherSelection([], ['store', 'store'], new AbortController().signal);
  assert.equal(result.code, 'GOODS30'); assert.equal(result.shippingCouponCode, 'SHIP50');
  assert.equal(result.finalAmount, 270000);
  assert.ok(calls.some(input => input.couponCode === 'GOODS30' && input.shippingCouponCode === 'SHIP50'));
});

test('manual code replaces only its benefit, explicit selections are preserved and no selection removes both', async () => {
  const { quoteVoucherSelection, recommendVoucherSelection } = fixture();
  const changed = await quoteVoucherSelection({ goodsCode: 'GOODS30', shippingCode: 'SHIP50', enteredCode: 'SHIP10' }, []);
  assert.equal(changed.code, 'GOODS30'); assert.equal(changed.shippingCouponCode, 'SHIP10');
  const explicit = await recommendVoucherSelection([], ['store'], new AbortController().signal, 'GOODS10', 'SHIP10');
  assert.equal(explicit.code, 'GOODS10'); assert.equal(explicit.shippingCouponCode, 'SHIP10');
  const empty = await quoteVoucherSelection({ goodsCode: '', shippingCode: '' }, []);
  assert.equal(empty.finalAmount, 330000);
  await assert.rejects(() => quoteVoucherSelection({ goodsCode: 'GOODS30', shippingCode: 'SHIP50', enteredCode: 'BAD' }, []));
});
