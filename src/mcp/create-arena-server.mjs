import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError } from '@modelcontextprotocol/sdk/types.js';
import { ARENA_TOOL_DEFINITIONS } from '../core/tool-contract.mjs';
import { dealArenaCards, getArenaReviewChecklist, getArenaRubric, planArena } from '../core/arena.mjs';

function textResult(value) {
  return { content: [{ type: 'text', text: JSON.stringify(value) }] };
}

export function createArenaMcpServer({ version = '1.2.0' } = {}) {
  const server = new Server(
    { name: 'github-arena', version },
    { capabilities: { tools: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: ARENA_TOOL_DEFINITIONS,
  }));

  server.setRequestHandler(CallToolRequestSchema, async request => {
    const args = request.params.arguments ?? {};
    switch (request.params.name) {
      case 'arena_plan':
        return textResult(planArena({ agents: args.agents ?? 16 }));
      case 'arena_cards':
        return textResult(dealArenaCards({ agents: args.agents ?? 4, seed: args.seed ?? 7 }));
      case 'arena_rubric':
        return textResult(getArenaRubric());
      case 'arena_review_checklist':
        return textResult(getArenaReviewChecklist({
          highImpact: args.high_impact ?? false,
          github: args.github ?? false,
        }));
      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown Arena tool: ${request.params.name}`);
    }
  });

  return server;
}
