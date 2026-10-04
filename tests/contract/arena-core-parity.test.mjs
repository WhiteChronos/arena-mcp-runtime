import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { planArena, dealArenaCards, getArenaRubric, getArenaReviewChecklist } from '../../src/core/arena.mjs';
const fixture=JSON.parse(await readFile(new URL('../fixtures/legacy-golden-output.json',import.meta.url),'utf8'));
test('Arena core matches frozen legacy golden outputs',()=>{
  for(const n of [1,4,16,17,2160,0,2161]) assert.deepEqual(planArena({agents:n}),fixture.plan[String(n)]);
  assert.deepEqual(dealArenaCards({agents:4,seed:7}),fixture.cards.seed7_number);
  assert.deepEqual(dealArenaCards({agents:4,seed:'7'}),fixture.cards.seed7_string);
  assert.deepEqual(getArenaRubric(),fixture.rubric);
  for(const highImpact of [false,true]) for(const github of [false,true]) assert.deepEqual(getArenaReviewChecklist({highImpact,github}),fixture.checklists[`${highImpact}_${github}`]);
});
test('Arena cards are deterministic for identical inputs',()=>{
  assert.deepEqual(dealArenaCards({agents:4,seed:7}),dealArenaCards({agents:4,seed:7}));
});
