import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const source=readFileSync(new URL('../src/utils/warehouse-address.utils.ts',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {isCompleteWarehouseAddress}=await import('data:text/javascript;charset=utf-8,'+encodeURIComponent(compiled));
test('warehouse accepts new province/ward addresses and legacy district addresses',()=>{
  assert.equal(isCompleteWarehouseAddress('100/31 Bình Giã, phường Tam Thắng, Thành phố Hồ Chí Minh'),true);
  assert.equal(isCompleteWarehouseAddress('100/31 Bình Giã, Phường 8, Thành phố Vũng Tàu, Bà Rịa - Vũng Tàu'),true);
  assert.equal(isCompleteWarehouseAddress(' 100/31 Bình Giã , phường Tam Thắng , TP Hồ Chí Minh '),true);
});
test('warehouse rejects incomplete addresses, empty segments and oversized text',()=>{
  for(const value of ['', '100/31 Bình Giã, Hồ Chí Minh','100/31 Bình Giã, , Hồ Chí Minh','100/31 Bình Giã, phường Tam Thắng,', 'a'.repeat(501)+', Phường 1, Hồ Chí Minh'])assert.equal(isCompleteWarehouseAddress(value),false,value);
});
