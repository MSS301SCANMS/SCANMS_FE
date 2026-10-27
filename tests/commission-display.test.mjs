import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../src/utils/commission-display.ts',import.meta.url),'utf8');
const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {commissionAmounts}=await import('data:text/javascript,'+encodeURIComponent(code));
const base={amountVnd:100000,status:'PENDING'};
test('full refund reduces money to zero and shows recovery only for an existing credit',()=>{
 const pending=commissionAmounts({...base,amountVnd:0,status:'CANCELLED',adjustmentHistory:{originalAmountVnd:100000,refundedAmountVnd:1000000}});
 assert.equal(pending.reduced,100000);assert.equal(pending.needsReconciliation,false);assert.equal(pending.recorded,0);
 const credited=commissionAmounts({...base,amountVnd:0,status:'CANCELLED',transferReference:'original',adjustmentHistory:{originalAmountVnd:100000,ledgerReconciledAmountVnd:100000}});
 assert.equal(credited.pendingRecovery,100000);assert.equal(credited.needsReconciliation,true);
 const reversed=commissionAmounts({...base,amountVnd:0,status:'CANCELLED',transferReference:'original',adjustmentHistory:{ledgerReconciledAmountVnd:0}});
 assert.equal(reversed.recorded,0);assert.equal(reversed.needsReconciliation,false);
});
test('legacy credits without a ledger snapshot are unknown and require reconciliation',()=>{
 const amount=commissionAmounts({...base,transferReference:'old-credit'});
 assert.equal(amount.recorded,null);assert.equal(amount.original,null);assert.equal(amount.needsReconciliation,true);
 assert.equal(amount.pendingRecovery,null);assert.equal(amount.reduced,null);
});
test('adjusted commissions awaiting their first credit remain actionable for an operator',()=>{
 assert.equal(commissionAmounts({...base,status:'ADJUSTED'}).ready,true);
 assert.equal(commissionAmounts({...base,status:'PENDING'}).ready,false);
});
