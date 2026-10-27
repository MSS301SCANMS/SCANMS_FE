import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import vm from 'node:vm';
const code=ts.transpileModule(readFileSync(new URL('../src/services/live-session.service.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
function service(fixtures){
 const utility=(name,imports={})=>{const target={exports:{}};const compiled=ts.transpileModule(readFileSync(new URL('../src/utils/'+name+'.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;vm.runInNewContext(compiled,{module:target,exports:target.exports,require:key=>imports[key]});return target.exports;};
 const dates=utility('server-date');
 const lifecycle=utility('livestream-lifecycle.utils',{'./server-date':dates});
 const module={exports:{}};
 vm.runInNewContext(code,{module,exports:module.exports,require:name=>name==='../utils/server-date'?dates:name==='../utils/livestream-lifecycle.utils'?lifecycle:name==='./api'?{__esModule:true,default:{get:async path=>{assert.ok(path in fixtures,'Unexpected endpoint: '+path);return {result:fixtures[path]};}}}:{unwrapApi:r=>r.result}});
 return module.exports.liveSessionService;
}
test('KOL sees only their invitations and their own decision in a multi-KOL session',async()=>{
 const api=service({'/livestreams':[
  {livestreamId:'mine',collaboratorRefs:{collaboratorIds:['kol-a','kol-b']},participantRefs:{inviteStatus:'PENDING',collaboratorResponses:{'kol-a':'ACCEPTED'}}},
  {livestreamId:'other',collaboratorRefs:{collaboratorIds:['kol-c']}},
 ],'/collaborators/me':{collaboratorId:'kol-a',userId:'user-a'}});
 const rows=await api.mine();assert.equal(rows.length,1);assert.equal(rows[0].livestreamId,'mine');assert.equal(rows[0].participantRefs.inviteStatus,'ACCEPTED');
});
test('Spring room resolves business IDs, store, current product prices and accepted host identity',async()=>{
 const api=service({'/livestreams/live-a':{livestreamId:'live-a',storeId:'store-a',status:'LIVE',startedAt:'2026-10-23T01:00:00',productRefs:{productIds:['shirt']},collaboratorRefs:{collaboratorIds:['kol-a','kol-b']},participantRefs:{creatorName:'Creator',voucherCode:'LIVE10',collaboratorResponses:{'kol-a':'ACCEPTED'}}},
 '/stores/public/id/store-a':{id:'store-a',name:'Test store'},
 '/collaborators':[{collaboratorId:'kol-a',userId:'user-a',approvalStatus:'APPROVED'},{collaboratorId:'kol-b',userId:'user-b',approvalStatus:'APPROVED'},{collaboratorId:'other',userId:'user-other'}],
 '/public/products/shirt/landing':{product:{id:'shirt',title:'Cotton shirt',price:269000,stockQuantity:4,variants:[{id:'variant-a',stockQuantity:4}]}}});
 const room=await api.room('live-a');assert.equal(room.id,'live-a');assert.equal(room.store.id,'store-a');assert.equal(room.products[0].product.price,269000);assert.equal(room.products[0].product.variants[0].id,'variant-a');assert.equal(room.creator.id,'user-a');assert.equal(room.creator.canHost,true);assert.equal(room.creators[1].canHost,false);assert.equal(room.creators.length,2);assert.equal(room.coupon.discountValue,0,'a voucher code cannot invent a 15% discount');
});
test('invalid room data is reported and legacy room objects retain their contract',async()=>{
 await assert.rejects(service({'/livestreams/missing':{}}).room('missing'),/Không tìm thấy/);
 assert.equal((await service({'/livestreams/legacy':{id:'legacy',products:[]}}).room('legacy')).id,'legacy');
});
