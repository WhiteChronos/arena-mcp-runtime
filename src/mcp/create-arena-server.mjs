import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { ARENA_TOOL_DEFINITIONS } from '../core/tool-contract.mjs';
import { dealArenaCards, getArenaReviewChecklist, getArenaRubric, planArena } from '../core/arena.mjs';

const SERVER_INSTRUCTIONS = 'Use Arena tools for structured quality review. Use the GitHub connector separately for repository reads and writes.';

function toolResult(data) {
  return {
    content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
    structuredContent: data,
    isError: false,
  };
}

function toolError(message) {
  return {
    content: [{ type: 'text', text: message }],
    isError: true,
  };
}

export function createArenaMcpServer({ version = '1.2.0' } = {}) {
  const server = new Server(
    { name: 'github-arena', version },
    { capabilities: { tools: {} }, instructions: SERVER_INSTRUCTIONS },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: ARENA_TOOL_DEFINITIONS,
  }));

  server.setRequestHandler(CallToolRequestSchema, async request => {
    const args = request.params.arguments ?? {};
    switch (request.params.name) {
      case 'arena_plan':
        return toolResult(planArena({ agents: args.agents ?? 16 }));
      case 'arena_cards':
        return toolResult(dealArenaCards({ agents: args.agents ?? 4, seed: args.seed ?? 7 }));
      case 'arena_rubric':
        return toolResult(getArenaRubric());
      case 'arena_review_checklist':
        return toolResult(getArenaReviewChecklist({
          highImpact: args.high_impact ?? false,
          github: args.github ?? false,
        }));
      default:
        return toolError(`unknown tool: ${request.params.name}`);
    }
  });

  return server;
}
