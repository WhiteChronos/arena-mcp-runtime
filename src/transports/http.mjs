import { createServer } from 'node:http';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createArenaMcpServer } from '../mcp/create-arena-server.mjs';

function jsonResponse(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
}

export function createArenaHttpServer({
  host = '127.0.0.1',
  port = 8787,
  path = '/mcp',
} = {}) {
  return createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', `http://${req.headers.host ?? `${host}:${port}`}`);
    if (url.pathname === '/healthz') {
      if (req.method !== 'GET') {
        jsonResponse(res, 405, { error: 'method_not_allowed' });
        return;
      }
      jsonResponse(res, 200, { runtime: 'arena', version: '1.2.0', transport: 'streamable-http' });
      return;
    }
    if (url.pathname !== path) {
      jsonResponse(res, 404, { error: 'not_found' });
      return;
    }
    if (req.method !== 'POST') {
      jsonResponse(res, 405, { jsonrpc: '2.0', error: { code: -32000, message: 'Method not allowed.' }, id: null });
      return;
    }

    const mcp = createArenaMcpServer();
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    try {
      await mcp.connect(transport);
      await transport.handleRequest(req, res);
      res.once('close', () => {
        void transport.close().catch(() => {});
        void mcp.close().catch(() => {});
      });
    } catch (error) {
      await transport.close().catch(() => {});
      await mcp.close().catch(() => {});
      if (!res.headersSent) {
        jsonResponse(res, 500, { jsonrpc: '2.0', error: { code: -32603, message: 'Internal server error' }, id: null });
      } else if (!res.writableEnded) {
        res.end();
      }
    }
  });
}
