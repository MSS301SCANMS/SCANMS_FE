import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import {readFileSync} from 'node:fs';
const storage=new Map();globalThis.sessionStorage={getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)};
const code=ts.transpileModule(readFileSync(new URL('../src/utils/referral-attribution.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText;
const {captureProductReferral,getProductReferral,getProductReferralClick}=await import('data:text/javascript,'+encodeURIComponent(code));
test('referrals survive navigating to checkout but never attach to a different product',()=>{
 captureProductReferral('shirt-a','referral-a');captureProductReferral('shirt-a',null);
 assert.equal(getProductReferral('shirt-a'),'referral-a');assert.equal(getProductReferral('shirt-b'),undefined);
 captureProductReferral('shirt-a','invalid?ref');assert.equal(getProductReferral('shirt-a'),undefined);
});
test('latest click replaces the beneficiary for that product and expires after 24 hours',()=>{
 const now=Date.now, clock=now();Date.now=()=>clock;
 try{
  captureProductReferral('product','kol-a','click-a',new Date(clock+86400000).toISOString());
  captureProductReferral('product','kol-b','click-b',new Date(clock+86400000).toISOString());
  assert.equal(getProductReferral('product'),'kol-b');assert.equal(getProductReferralClick('product'),'click-b');
  Date.now=()=>clock+86400001;
  assert.equal(getProductReferral('product'),undefined);assert.equal(getProductReferralClick('product'),undefined);
 }finally{Date.now=now;}
});
