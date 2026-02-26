import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SdmService } from "@/google/sdm";
import { deviceIdFromName, deviceTypeLabel } from "@/google/sdm";

export function registerDeviceTools(
  server: McpServer,
  getService: () => SdmService,
): void {
  server.tool(
    "home_list_devices",
    "List all Google Home / Nest smart devices linked to the account, including their types, names, and current trait values (temperature, mode, connectivity, etc.)",
    {},
    async () => {
      try {
        const devices = await getService().listDevices();
        const summary = devices.map((d) => ({
          id: deviceIdFromName(d.name),
          name: d.name,
          type: deviceTypeLabel(d.type),
          rawType: d.type,
          traits: d.traits,
          rooms: d.parentRelations.map((r) => r.displayName),
        }));
        return {
          content: [{ type: "text" as const, text: JSON.stringify(summary, null, 2) }],
        };
      } catch (err) {
        return {
          content: [{ type: "text" as const, text: `Error listing devices: ${err instanceof Error ? err.message : String(err)}` }],
          isError: true,
        };
      }
    },
  );

  server.tool(
    "home_get_device",
    "Get detailed information and current state for a specific device by its ID",
    {
      deviceId: z.string().describe("Device ID (from home_list_devices)"),
    },
    async ({ deviceId }) => {
      try {
        const device = await getService().getDevice(deviceId);
        return {
          content: [{ type: "text" as const, text: JSON.stringify(device, null, 2) }],
        };
      } catch (err) {
        return {
          content: [{ type: "text" as const, text: `Error getting device: ${err instanceof Error ? err.message : String(err)}` }],
          isError: true,
        };
      }
    },
  );

  server.tool(
    "home_list_structures",
    "List all home structures (e.g. 'My Home') associated with the Google account",
    {},
    async () => {
      try {
        const structures = await getService().listStructures();
        return {
          content: [{ type: "text" as const, text: JSON.stringify(structures, null, 2) }],
        };
      } catch (err) {
        return {
          content: [{ type: "text" as const, text: `Error listing structures: ${err instanceof Error ? err.message : String(err)}` }],
          isError: true,
        };
      }
    },
  );

  server.tool(
    "home_list_rooms",
    "List all rooms in a structure",
    {
      structureId: z.string().describe("Structure ID (from home_list_structures)"),
    },
    async ({ structureId }) => {
      try {
        const rooms = await getService().listRooms(structureId);
        return {
          content: [{ type: "text" as const, text: JSON.stringify(rooms, null, 2) }],
        };
      } catch (err) {
        return {
          content: [{ type: "text" as const, text: `Error listing rooms: ${err instanceof Error ? err.message : String(err)}` }],
          isError: true,
        };
      }
    },
  );
}
