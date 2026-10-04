import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { ARENA_TOOL_NAMES } from '../../src/core/tool-contract.mjs';
import { planArena } from '../../src/core/arena.mjs';
import { createArenaHttpServer } from '../../src/transports/http.mjs';

async function withHttp(fn){
  const server=createArenaHttpServer({host:'127.0.0.1',port:0,path:'/mcp'});
  server.listen(0,'127.0.0.1'); await once(server,'listening');
  const address=server.address(); const base=`http://127.0.0.1:${address.port}`;
  try{return await fn({server,base});} finally{await new Promise((resolve,reject)=>server.close(err=>err?reject(err):resolve()));}
}
const parseText=result=>JSON.parse(result.content.find(x=>x.type==='text').text);

test('HTTP runtime exposes health and exact MCP contract',async()=>{
  await withHttp(async({base})=>{
    const health=await fetch(`${base}/healthz`); assert.equal(health.status,200);
    assert.deepEqual(await health.json(),{runtime:'arena',version:'1.2.0',transport:'streamable-http'});
    const missing=await fetch(`${base}/other`); assert.equal(missing.status,404);
    const transport=new StreamableHTTPClientTransport(new URL(`${base}/mcp`));
    const client=new Client({name:'arena-http-test',version:'1.0.0'});
    try{
      await client.connect(transport);
      const listed=await client.listTools(); assert.deepEqual(listed.tools.map(x=>x.name),ARENA_TOOL_NAMES);
      assert.deepEqual(parseText(await client.callTool({name:'arena_plan',arguments:{agents:16}})),planArena({agents:16}));
    } finally { await client.close().catch(()=>{}); }
  });
});

test('HTTP runtime can close without leaving its listener alive',async()=>{
  const server=createArenaHttpServer({host:'127.0.0.1',port:0,path:'/mcp'});
  server.listen(0,'127.0.0.1'); await once(server,'listening');
  assert.equal(server.listening,true);
  await new Promise((resolve,reject)=>server.close(err=>err?reject(err):resolve()));
  assert.equal(server.listening,false);
});
