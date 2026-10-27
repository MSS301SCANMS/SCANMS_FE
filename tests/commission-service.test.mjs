import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import {readFileSync} from 'node:fs';
const compile=source=>ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const responseModule=await import('data:text/javascript,'+encodeURIComponent(compile(readFileSync(new URL('../src/utils/api-response.ts',import.meta.url),'utf8'))));
let payload;
globalThis.__commissionApi={get:async()=>payload};globalThis.__commissionUnwrap=responseModule.unwrapApi;
const source=readFileSync(new URL('../src/services/commission.service.ts',import.meta.url),'utf8').replace(/import api[^\n]+;/,'const api=globalThis.__commissionApi;').replace(/import \{ unwrapApi \}[^\n]+;/,'const unwrapApi=globalThis.__commissionUnwrap;');
const {commissionService}=await import('data:text/javascript,'+encodeURIComponent(compile(source)));
const row={commissionId:'commission',orderItemId:'item',collaboratorId:'kol',amountVnd:100000,basisVnd:1000000,rate:10,status:'PENDING'};
test('money and status must be present; malformed source data cannot silently become zero or an empty list',async()=>{
 for(const input of [null,{}, {amountVnd:null}, {basisVnd:null}, {rate:null}, {rate:''}, {rate:101}, {amountVnd:-1}, {amountVnd:'9007199254740993'}, {status:'UNKNOWN'}]){
  payload={result:input===null?null:input&&Object.keys(input).length? [{...row,...input}]:{}};
  await assert.rejects(commissionService.list());
 }
 payload={result:[row]};assert.equal((await commissionService.list())[0].amountVnd,100000);
 payload={result:[{...row,rate:0,amountVnd:0}]};assert.equal((await commissionService.list())[0].rate,0);
 payload={result:[]};assert.deepEqual(await commissionService.list(),[]);
});
test.after(()=>{delete globalThis.__commissionApi;delete globalThis.__commissionUnwrap});
