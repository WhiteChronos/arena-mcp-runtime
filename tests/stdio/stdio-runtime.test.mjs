import test from 'node:test';
import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { ARENA_TOOL_DEFINITIONS, ARENA_TOOL_NAMES } from '../../src/core/tool-contract.mjs';
import { planArena, dealArenaCards, getArenaRubric, getArenaReviewChecklist } from '../../src/core/arena.mjs';

const parseText = result => JSON.parse(result.content.find(x=>x.type==='text').text);
async function withClient(fn){
  const transport=new StdioClientTransport({
    command:process.execPath,
    args:['src/transports/stdio.mjs'],
    cwd:new URL('../../',import.meta.url).pathname,
    stderr:'pipe'
  });
  const client=new Client({name:'arena-stdio-test',version:'1.0.0'});
  try{await client.connect(transport); return await fn(client,transport);} finally{await client.close().catch(()=>{});}
}

test('stdio runtime exposes exact Arena tool contract and deterministic behavior',async()=>{
  await withClient(async(client,transport)=>{
    assert.ok(transport.pid);
    const listed=await client.listTools();
    assert.deepEqual(listed.tools.map(x=>x.name),ARENA_TOOL_NAMES);
    for(let i=0;i<listed.tools.length;i++){
      const actual=listed.tools[i], expected=ARENA_TOOL_DEFINITIONS[i];
      assert.equal(actual.description,expected.description);
      assert.deepEqual(actual.inputSchema,expected.inputSchema);
      assert.deepEqual(actual.annotations,expected.annotations);
    }
    assert.deepEqual(parseText(await client.callTool({name:'arena_plan',arguments:{agents:16}})),planArena({agents:16}));
    assert.deepEqual(parseText(await client.callTool({name:'arena_cards',arguments:{agents:4,seed:7}})),dealArenaCards({agents:4,seed:7}));
    assert.deepEqual(parseText(await client.callTool({name:'arena_rubric',arguments:{}})),getArenaRubric());
    assert.deepEqual(parseText(await client.callTool({name:'arena_review_checklist',arguments:{high_impact:true,github:true}})),getArenaReviewChecklist({highImpact:true,github:true}));
  });
});

test('stdio runtime rejects unknown tools without crashing',async()=>{
  await withClient(async client=>{
    await assert.rejects(client.callTool({name:'unknown_arena_tool',arguments:{}}));
    const listed=await client.listTools();
    assert.deepEqual(listed.tools.map(x=>x.name),ARENA_TOOL_NAMES);
  });
});
