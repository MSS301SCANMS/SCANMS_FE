import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import vm from 'node:vm';

function validation({platform=[],store=[]}={}) {
  const target={exports:{}};
  const code=ts.transpileModule(fs.readFileSync(new URL('../src/utils/checkout-voucher-validation.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  vm.runInNewContext(code,{module:target,exports:target.exports,require:name=>name.includes('live-purchase')?{getLivePurchase:id=>id==='live-a'?'room-proof':undefined}:{couponService:{getPublicPlatformCoupons:async()=>platform,getPublicStoreCoupons:async()=>store}}});
  return target.exports.validateCheckoutVoucher;
}
const groups=[{store:{id:'shop',name:'Shop'},subtotal:299000,items:[{productId:'shirt',variantId:'white-m',quantity:1,price:299000,liveSessionId:'live-a'}]}];
const options={code:'SAVE',groups,shippingFees:{shop:30000},shopDiscounts:{}};

test('the new voucher picker uses the server amount and forwards live-room proof',async()=>{
  const validate=validation({platform:[{code:'SAVE',benefitType:'GOODS',discountValue:99,discountType:'PERCENTAGE'}]});
  let request;
  const result=await validate(async(path,body)=>{request={path,body};return {result:{discountAmount:12345,discountType:'VOUCHER',benefitType:'GOODS'}}},{...options,slot:'PLATFORM'});
  assert.equal(result.discountAmount,12345);assert.equal(result.slot,'PLATFORM');
  assert.equal(request.path,'/checkout/quote');assert.equal(request.body.items[0].sourceLivestreamId,'live-a');assert.equal(request.body.items[0].livePurchaseToken,'room-proof');
});
test('a visible voucher is still rejected when backend eligibility fails',async()=>{
  const validate=validation({store:[{code:'SAVE',storeId:'shop',benefitType:'GOODS',discountValue:50000}]});
  await assert.rejects(validate(async()=>{throw new Error('Voucher quota exhausted')},options),/quota exhausted/);
});
test('shipping uses the shipping slot and the actual server shipping discount',async()=>{
  const validate=validation({platform:[{code:'SHIP',benefitType:'SHIPPING',discountValue:999999}]});
  let body;
  const result=await validate(async(_path,value)=>{body=value;return {data:{shippingDiscountVnd:20000,discountAmount:0,benefitType:'SHIPPING'}}},{...options,code:'SHIP',slot:'SHIPPING'});
  assert.equal(result.discountAmount,20000);assert.equal(body.shippingCouponCode,'SHIP');assert.equal(body.couponCode,undefined);
});
