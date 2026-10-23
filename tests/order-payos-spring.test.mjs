import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {randomUUID} from 'node:crypto';
const compiled=ts.transpileModule(readFileSync(new URL('../src/services/order-payos.service.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
function setup(){
 let session='account-a',payment={paymentId:'payment-a',orderId:'order-a',purpose:'ORDER',status:'PROCESSING',orderSyncStatus:null,amountVnd:299000,checkoutUrl:'https://pay.payos.vn/web/test',qrCode:'QR'};
 const creates=[],storage=new Map();let fail=false,references=[];
 const finance={payment:async(id,key)=>{creates.push({id,key,session});if(fail)throw Error('response lost');return {...payment};},paymentStatus:async()=>({...payment}),payments:async()=>({items:references,total:references.length,size:20}),resumePayment:async()=>({...payment})};
 const module={exports:{}};
 vm.runInNewContext(compiled,{module,exports:module.exports,crypto:{randomUUID},sessionStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},require:name=>name==='./finance.service'?{financeService:finance}:{getSessionId:()=>session}});
 return {service:module.exports.orderPayosService,creates,storage,setSession:v=>session=v,setPayment:v=>payment={...payment,...v},setFail:v=>fail=v,setHistory:v=>references=v};
}
test('Spring order PayOS waits for the Order acknowledgement and does not allocate twice',async()=>{
 const s=setup();assert.equal((await s.service.prepare('order-a')).paymentStatus,'WAITING_PAYMENT');
 s.setPayment({status:'SUCCESS',orderSyncStatus:'PENDING'});assert.equal((await s.service.status('order-a')).paymentStatus,'WAITING_PAYMENT');
 s.setPayment({orderSyncStatus:'SYNCED'});assert.equal((await s.service.status('order-a')).paymentStatus,'PAID');
 await s.service.prepare('order-a');assert.equal(s.creates.length,1);
 s.setSession('account-b');await s.service.prepare('order-a');assert.equal(s.creates.length,2);assert.notEqual(s.creates[0].key,s.creates[1].key);
});
test('lost link response recovers the existing payment and rejects reconciliation and mismatched sources',async()=>{
 const s=setup();s.setFail(true);s.setHistory([{paymentId:'existing',orderId:'order-a',purpose:'ORDER',status:'PROCESSING',amountVnd:299000,checkoutUrl:'https://pay.payos.vn/web/existing',qrCode:'QR'}]);
 assert.equal((await s.service.prepare('order-a')).paymentId,'existing');assert.equal(s.creates.length,1);
 const invalid=setup();invalid.setPayment({orderId:'someone-else'});await assert.rejects(invalid.service.prepare('order-a'),/không khớp/);
 const held=setup();held.setPayment({status:'SUCCESS',orderSyncStatus:'RECONCILIATION_REQUIRED'});await assert.rejects(held.service.prepare('order-a'),/đối soát/);
});
