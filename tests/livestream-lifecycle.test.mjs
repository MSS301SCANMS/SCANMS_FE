import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import vm from 'node:vm';
const load=(name,imports={})=>{const module={exports:{}};const code=ts.transpileModule(fs.readFileSync(new URL('../src/utils/'+name+'.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;vm.runInNewContext(code,{module,exports:module.exports,require:key=>imports[key]});return module.exports;};
const helpers=load('livestream-lifecycle.utils',{'./server-date':load('server-date')});
const now=Date.parse('2026-10-26T18:00:00Z');
test('overdue pending schedules show expired rather than awaiting invitation',()=>{
 const raw={status:'SCHEDULED',participantRefs:{endsAt:'2026-10-27T01:00:00+07:00',inviteStatus:'PENDING'}};
 const state=helpers.livestreamLifecycle(raw,now);assert.equal(state.status,'CANCELLED');assert.equal(state.lifecycleReason,'SCHEDULE_EXPIRED');assert.equal(helpers.livestreamStatusLabel(state.status,state.lifecycleReason),'Đã hết lịch');assert.equal(raw.status,'SCHEDULED');
});
test('running sessions end at the deadline with UTC and offset date contracts',()=>{
 for(const end of ['2026-10-26T18:00:00','2026-10-26T18:00:00Z','2026-10-27T01:00:00+07:00'])assert.equal(helpers.livestreamLifecycle({status:'LIVE',participantRefs:{endsAt:end}},now).status,'ENDED');
});
test('an overnight session stays open until its end, not merely when the calendar date changes',()=>{
 assert.equal(helpers.livestreamLifecycle({status:'LIVE',participantRefs:{endsAt:'2026-10-27T02:00:00+07:00'}},now).status,'LIVE');
});
test('manual cancellations and missing deadlines keep their existing meaning',()=>{
 assert.equal(helpers.livestreamStatusLabel('CANCELLED'),'Đã hủy');
 assert.equal(helpers.livestreamLifecycle({status:'SCHEDULED'},now).status,'SCHEDULED');
 assert.equal(helpers.livestreamLifecycle({status:'SCHEDULED',endsAt:'invalid'},now).status,'SCHEDULED');
});

test('active sessions and invitations stay above history, with nearest schedules and newest history first', () => {
 const rows = [
  { id: 'expired-old', status: 'CANCELLED', inviteStatus: 'PENDING', endsAt: '2026-10-26T21:00:00+07:00' },
  { id: 'upcoming-later', status: 'SCHEDULED', inviteStatus: 'ACCEPTED', startsAt: '2026-11-07T08:00:00+07:00' },
  { id: 'invitation', status: 'SCHEDULED', inviteStatus: 'PENDING', startsAt: '2026-11-08T08:00:00+07:00' },
  { id: 'history-new', status: 'ENDED', endsAt: '2026-11-04T18:00:00+07:00' },
  { id: 'upcoming-near', status: 'SCHEDULED', inviteStatus: 'ACCEPTED', startsAt: '2026-11-06T08:00:00+07:00' },
  { id: 'live', status: 'LIVE', inviteStatus: 'ACCEPTED', startsAt: '2026-11-05T08:00:00+07:00' },
 ];
 const original = rows.map(row => row.id);
 assert.equal(helpers.sortLivestreamSessions(rows).map(row => row.id).join(','),
  'live,invitation,upcoming-near,upcoming-later,history-new,expired-old');
 assert.deepEqual(rows.map(row => row.id), original);
});

test('history with missing dates stays last and paused broadcasts remain with active sessions', () => {
 const rows = [
  { id: 'unknown', status: 'ENDED', endsAt: 'invalid' },
  { id: 'history', status: 'CANCELLED', endsAt: '2026-10-28T10:00:00Z' },
  { id: 'paused', status: 'PAUSED', startsAt: '2026-11-05T08:00:00Z' },
 ];
 assert.equal(helpers.sortLivestreamSessions(rows).map(row => row.id).join(','), 'paused,history,unknown');
});
