import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import vm from 'node:vm';

function load(path, require) {
  const source=readFileSync(new URL(path,import.meta.url),'utf8');
  const exports={};
  vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require,Date,Number,Math,Error});
  return exports;
}
const {platformVoucher}=load('../src/utils/platform-voucher.utils.ts',()=>({serverDate:value=>value&&(/Z$|[+-]\d\d:\d\d$/.test(value)?value:value+'Z')}));
const now=Date.parse('2026-10-25T10:00:00Z');
const raw={voucherId:'id',code:'san10',issuerType:'PLATFORM',scopeType:'PLATFORM',discountType:'FIXED',value:'10000',validFrom:'2026-10-24T10:00:00',validUntil:'2026-10-26T10:00:00',minimumSubtotal:100000};
test('suggestions accept only active platform goods/freeship for the current store, never cashback or expired/exhausted codes',()=>{
  assert.equal(platformVoucher(raw,'store',now).code,'SAN10');
  assert.equal(platformVoucher({...raw,benefitType:'SHIPPING'},'store',now).benefitType,'SHIPPING');
  for(const changes of [{issuerType:'STORE'},{benefitType:'CASHBACK'},{remainingUses:0},{validUntil:'2026-10-25T10:00:00Z'},{validFrom:'2026-10-26T00:00:00Z'},{scopeType:'LIVESTREAM'},{scopeType:'STORE',storeId:'other'},{discountType:'PERCENTAGE',value:101}])assert.equal(platformVoucher({...raw,...changes},'store',now),null);
  assert.equal(platformVoucher({...raw,scopeType:'STORE',storeId:'store'},'store',now).discountType,'FIXED_AMOUNT');
});
test('issuing a platform freeship voucher preserves its issuer, shipping benefit, validity and capped usage budget',async()=>{
  const requests=[];
  const {couponService}=load('../src/services/coupon.service.ts',path=>path==='./api'?{__esModule:true,default:{post:async(url,body)=>{requests.push({url,body});return {result:{voucherId:'new',...body}}}}}:{platformVoucher});
  const input={storeId:'store',code:'SHIP30',benefitType:'SHIPPING',discountType:'FIXED_AMOUNT',discountValue:30000,budgetTotal:3000000,usageLimitTotal:100,expiresAt:'2026-11-25T00:00:00Z'};
  await couponService.createPlatformCoupon(input);
  assert.equal(requests[0].body.issuerType,'PLATFORM');assert.equal(requests[0].body.scope.benefitType,'SHIPPING');
  assert.equal(requests[0].body.discountType,'FIXED');assert.equal(requests[0].body.limits.totalUsageLimit,100);
  const expiry=requests[0].body.validUntil;
  assert.equal(Date.parse(/Z$|[+-]\d\d:\d\d$/.test(expiry)?expiry:expiry+'Z'),Date.parse(input.expiresAt));
  await assert.rejects(()=>couponService.createPlatformCoupon({...input,budgetTotal:1000}),/Ngân sách/);
  assert.equal(requests.length,1);
});
