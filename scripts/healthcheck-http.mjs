#!/usr/bin/env node
import { once } from 'node:events';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { ARENA_TOOL_NAMES } from '../src/core/tool-contract.mjs';
import { createArenaHttpServer } from '../src/transports/http.mjs';

const server = createArenaHttpServer({ host: '127.0.0.1', port: 0, path: '/mcp' });
server.listen(0, '127.0.0.1');
await once(server, 'listening');
const address = server.address();
const endpoint = new URL(`http://127.0.0.1:${address.port}/mcp`);
const client = new Client({ name: 'arena-http-healthcheck', version: '1.0.0' });
const transport = new StreamableHTTPClientTransport(endpoint);
try {
  await client.connect(transport);
  const listed = await client.listTools();
  const names = listed.tools.map(tool => tool.name);
  if (JSON.stringify(names) !== JSON.stringify(ARENA_TOOL_NAMES)) throw new Error(`tool contract mismatch: ${JSON.stringify(names)}`);
  process.stdout.write(JSON.stringify({
    runtime: 'arena',
    version: '1.2.0',
    transport: 'streamable-http',
    initialize: 'PASS',
    tools_list: 'PASS',
    tools: names,
  }) + '\n');
} finally {
  await client.close().catch(() => {});
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
}
