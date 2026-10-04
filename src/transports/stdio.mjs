#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createArenaMcpServer } from '../mcp/create-arena-server.mjs';

const server = createArenaMcpServer();
const transport = new StdioServerTransport();
await server.connect(transport);
