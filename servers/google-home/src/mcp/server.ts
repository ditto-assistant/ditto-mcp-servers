import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Auth } from "googleapis";
import { SdmService } from "@/google/sdm";
import { loadConfig } from "@/google/auth";
import { registerDeviceTools, registerThermostatTools } from "@/mcp/tools";

/**
 * Create and configure the MCP server with all Google Home tools.
 *
 * The `googleAuth` parameter is an authenticated OAuth2 client that will be
 * used to call the Smart Device Management API.
 */
export async function createMCPServer(googleAuth: Auth.OAuth2Client): Promise<McpServer> {
  const server = new McpServer({
    name: "ditto-google-home",
    version: "1.0.0",
  });

  const config = await loadConfig();
  const projectId = config?.deviceAccess?.projectId;
  if (!projectId) {
    throw new Error(
      "Device Access project ID not configured. Complete the setup wizard first.",
    );
  }

  let sdmService: SdmService | null = null;
  const getSdm = (): SdmService => {
    if (!sdmService) sdmService = new SdmService(googleAuth, projectId);
    return sdmService;
  };

  // Register all 9 tools across device and thermostat categories
  registerDeviceTools(server, getSdm);
  registerThermostatTools(server, getSdm);

  return server;
}
