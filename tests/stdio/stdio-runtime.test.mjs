import test from 'node:test';
import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { fileURLToPath } from 'node:url';
import { ARENA_TOOL_DEFINITIONS, ARENA_TOOL_NAMES } from '../../src/core/tool-contract.mjs';
import { planArena, dealArenaCards, getArenaRubric, getArenaReviewChecklist } from '../../src/core/arena.mjs';

const parseText = result => JSON.parse(result.content.find(x=>x.type==='text').text);
async function withClient(fn){
  const transport=new StdioClientTransport({command:process.execPath,args:['src/transports/stdio.mjs'],cwd:fileURLToPath(new URL('../../',import.meta.url)),stderr:'pipe'});
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

test('stdio runtime reports unknown tools as tool errors without crashing',async()=>{
  await withClient(async client=>{
    const result=await client.callTool({name:'unknown_arena_tool',arguments:{}});
    assert.equal(result.isError,true);
    assert.match(result.content.find(x=>x.type==='text').text,/unknown tool/i);
    const listed=await client.listTools();
    assert.deepEqual(listed.tools.map(x=>x.name),ARENA_TOOL_NAMES);
  });
});

test('stdio runtime preserves legacy initialization instructions and result envelope',async()=>{
  await withClient(async client=>{
    assert.equal(client.getInstructions(),'Use Arena tools for structured quality review. Use the GitHub connector separately for repository reads and writes.');
    const result=await client.callTool({name:'arena_plan',arguments:{agents:4}});
    const expected=planArena({agents:4});
    assert.equal(result.isError,false);
    assert.deepEqual(result.structuredContent,expected);
    assert.deepEqual(parseText(result),expected);
    const unknown=await client.callTool({name:'unknown_arena_tool',arguments:{}});
    assert.equal(unknown.isError,true);
    assert.match(unknown.content.find(x=>x.type==='text').text,/unknown tool/i);
  });
});
