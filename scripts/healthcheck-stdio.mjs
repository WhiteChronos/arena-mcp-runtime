#!/usr/bin/env node
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { ARENA_TOOL_NAMES } from '../src/core/tool-contract.mjs';

const transport = new StdioClientTransport({
  command: process.execPath,
  args: ['src/transports/stdio.mjs'],
  cwd: new URL('../', import.meta.url).pathname,
  stderr: 'pipe',
});
const client = new Client({ name: 'arena-stdio-healthcheck', version: '1.0.0' });
try {
  await client.connect(transport);
  const listed = await client.listTools();
  const names = listed.tools.map(tool => tool.name);
  if (JSON.stringify(names) !== JSON.stringify(ARENA_TOOL_NAMES)) {
    throw new Error(`tool contract mismatch: ${JSON.stringify(names)}`);
  }
  process.stdout.write(JSON.stringify({
    runtime: 'arena',
    version: '1.2.0',
    transport: 'stdio',
    initialize: 'PASS',
    tools_list: 'PASS',
    tools: names,
  }) + '\n');
} finally {
  await client.close().catch(() => {});
}
