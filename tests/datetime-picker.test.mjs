import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const source=fs.readFileSync(new URL('../src/utils/datetime-picker.utils.ts',import.meta.url),'utf8');
const module={exports:{}};
vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports:module.exports,Date});
const {parsePickerDate,pickerBoundary}=module.exports;
test('picker preserves the instant of UTC and offset boundaries while keeping unzoned inputs local',()=>{
 assert.equal(parsePickerDate('2026-10-23T07:30:00Z').toISOString(),'2026-10-23T07:30:00.000Z');
 assert.equal(parsePickerDate('2026-10-23T14:30:00+07:00').getTime(),parsePickerDate('2026-10-23T07:30:00Z').getTime());
 assert.equal(parsePickerDate('2026-10-23T14:30').getHours(),14);
 assert.equal(parsePickerDate('2026-02-30T14:30'),null);
 assert.equal(parsePickerDate('2026-10-23T25:00'),null);
});
test('minute precision never rounds a minimum down into the past or a maximum up',()=>{
 assert.equal(pickerBoundary('2026-10-23T07:30:20Z','min','datetime').toISOString(),'2026-10-23T07:31:00.000Z');
 assert.equal(pickerBoundary('2026-10-23T07:30:20Z','max','datetime').toISOString(),'2026-10-23T07:30:00.000Z');
 assert.equal(pickerBoundary('2026-10-23T14:30','min','date').getHours(),0);
 assert.equal(pickerBoundary('invalid','max','date'),null);
});
