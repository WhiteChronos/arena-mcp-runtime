import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { ARENA_TOOL_NAMES, ARENA_TOOL_DEFINITIONS } from '../../src/core/tool-contract.mjs';
const fixture=JSON.parse(await readFile(new URL('../fixtures/legacy-tool-contract.json',import.meta.url),'utf8'));
test('tool names stay exact and ordered',()=>{
  assert.deepEqual(ARENA_TOOL_NAMES,['arena_plan','arena_cards','arena_rubric','arena_review_checklist']);
});
test('tool definitions preserve legacy contract and safety annotations',()=>{
  assert.deepEqual(ARENA_TOOL_DEFINITIONS,fixture);
  for(const tool of ARENA_TOOL_DEFINITIONS){
    assert.equal(tool.annotations.readOnlyHint,true);
    assert.equal(tool.annotations.destructiveHint,false);
    assert.equal(tool.annotations.openWorldHint,false);
  }
});
