import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Auth } from "googleapis";
import { registerHomeTools } from "@/mcp/tools";

/**
 * Create and configure the Google Home MCP server.
 *
 * Uses the Google Assistant Embedded gRPC API (embeddedassistant.googleapis.com)
 * to send natural language commands — works with ALL Google Home integrated
 * devices, not just Nest.
 */
export function createMCPServer(googleAuth: Auth.OAuth2Client): McpServer {
  const server = new McpServer({
    name: "ditto-google-home",
    version: "1.0.0",
  });

  registerHomeTools(server, () => googleAuth);

  return server;
}
