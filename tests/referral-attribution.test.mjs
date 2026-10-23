import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import {readFileSync} from 'node:fs';
const storage=new Map();globalThis.sessionStorage={getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)};
const code=ts.transpileModule(readFileSync(new URL('../src/utils/referral-attribution.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText;
const {captureProductReferral,getProductReferral}=await import('data:text/javascript,'+encodeURIComponent(code));
test('referrals survive navigating to checkout but never attach to a different product',()=>{
 captureProductReferral('shirt-a','referral-a');captureProductReferral('shirt-a',null);
 assert.equal(getProductReferral('shirt-a'),'referral-a');assert.equal(getProductReferral('shirt-b'),undefined);
 captureProductReferral('shirt-a','invalid?ref');assert.equal(getProductReferral('shirt-a'),undefined);
});
