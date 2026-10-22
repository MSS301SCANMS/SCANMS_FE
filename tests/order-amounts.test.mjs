import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const code=ts.transpileModule(readFileSync(new URL('../src/utils/order-amounts.utils.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {checkoutAmounts}=await import('data:text/javascript;charset=utf-8,'+encodeURIComponent(code));
test('order history separates item subtotal, item discounts and shipping',()=>{
 assert.deepEqual(checkoutAmounts({payableVnd:249000,sagaState:{shippingFeeVnd:30000},sellerOrders:[{items:[{grossAmountVnd:269000,discountAmountVnd:50000,quantity:1,unitPrice:269000}]}]}),{subtotalAmount:269000,discountAmount:50000,shippingFee:30000,finalAmount:249000});
 assert.deepEqual(checkoutAmounts({payableVnd:299000,sagaState:{shippingFeeVnd:30000}}),{subtotalAmount:269000,discountAmount:0,shippingFee:30000,finalAmount:299000});
});
