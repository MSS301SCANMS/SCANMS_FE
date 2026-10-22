import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
const code=ts.transpileModule(readFileSync(new URL('../src/utils/return-flow.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const module={exports:{}};new Function('module','exports',code)(module,module.exports);
const {canReceiveReturn,returnStep}=module.exports;
test('shop cannot receive a simulated return before the persisted delivery acknowledgement',()=>{
  assert.equal(canReceiveReturn({status:'RETURNING'}),false);
  assert.equal(canReceiveReturn({status:'RETURNING',logistics:{environment:'TEST',status:'DELIVERED'}}),false);
  const logistics={environment:'TEST',status:'DELIVERED',deliveredAt:'2026-10-22T12:00:00Z'};
  assert.equal(canReceiveReturn({status:'RETURNING',logistics}),true);
  assert.equal(canReceiveReturn({status:'REFUND_PENDING',logistics}),false);
  assert.equal(canReceiveReturn({status:'REFUNDED',logistics}),false);
});
test('manual return shipments retain shop confirmation without requiring a simulated event',()=>{
  assert.equal(canReceiveReturn({status:'RETURNING',logistics:{environment:'MANUAL'}}),true);
});
test('progress identifies the next responsible step, and received goods wait for the wallet',()=>{
  assert.equal(returnStep({status:'REQUESTED'}),1);
  assert.equal(returnStep({status:'APPROVED'}),2);
  assert.equal(returnStep({status:'RETURNING'}),2);
  assert.equal(returnStep({status:'RETURNING',logistics:{deliveredAt:'2026-10-22T12:00:00Z'}}),3);
  assert.equal(returnStep({status:'REFUND_PENDING'}),4);
});
