import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Auth } from "googleapis";
import { sendAssistantCommand } from "@/google/assistant";

export function registerHomeTools(
  server: McpServer,
  getAuth: () => Auth.OAuth2Client,
  oauthClientId?: string,
  gcpProjectId?: string,
): void {
  /**
   * Primary power tool — send any freeform command to Google Assistant.
   * This works with every device in Google Home: lights, switches, plugs,
   * thermostats, locks, TVs, fans, AC units, etc.
   */
  server.tool(
    "home_send_command",
    "Send any voice command to Google Assistant to control smart home devices. Works with all Google Home integrated devices — lights, switches, plugs, thermostats, locks, fans, TVs, etc. Use natural language just as you would speak to a Google Home speaker.",
    {
      command: z
        .string()
        .describe(
          'The command to send, e.g. "turn on the bedroom lights", "set the thermostat to 72 degrees", "turn off all lights", "dim the kitchen lights to 50%"',
        ),
    },
    async ({ command }) => {
      try {
        const result = await sendAssistantCommand(getAuth(), command, oauthClientId, gcpProjectId);
        const text = result.response
          ? `✓ ${result.response}`
          : `✓ Command sent: "${command}"`;
        return { content: [{ type: "text" as const, text }] };
      } catch (err) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Error: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.tool(
    "home_turn_on",
    "Turn on a specific device or group of devices in Google Home",
    {
      device: z
        .string()
        .describe(
          'Device or room name, e.g. "bedroom lights", "kitchen light", "living room", "all lights", "fan", "TV"',
        ),
    },
    async ({ device }) => {
      try {
        const result = await sendAssistantCommand(
          getAuth(),
          `turn on the ${device}`,
          oauthClientId,
          gcpProjectId,
        );
        const text = result.response || `Turned on ${device}.`;
        return { content: [{ type: "text" as const, text }] };
      } catch (err) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Error: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.tool(
    "home_turn_off",
    "Turn off a specific device or group of devices in Google Home",
    {
      device: z
        .string()
        .describe(
          'Device or room name, e.g. "bedroom lights", "all lights", "living room", "fan"',
        ),
    },
    async ({ device }) => {
      try {
        const result = await sendAssistantCommand(
          getAuth(),
          `turn off the ${device}`,
          oauthClientId,
          gcpProjectId,
        );
        const text = result.response || `Turned off ${device}.`;
        return { content: [{ type: "text" as const, text }] };
      } catch (err) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Error: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.tool(
    "home_set_brightness",
    "Set brightness of a light or group of lights",
    {
      device: z
        .string()
        .describe('Light name, e.g. "bedroom lights", "kitchen light"'),
      percent: z
        .number()
        .min(1)
        .max(100)
        .describe("Brightness percentage (1-100)"),
    },
    async ({ device, percent }) => {
      try {
        const result = await sendAssistantCommand(
          getAuth(),
          `set the ${device} to ${percent} percent`,
          oauthClientId,
          gcpProjectId,
        );
        const text = result.response || `Set ${device} brightness to ${percent}%.`;
        return { content: [{ type: "text" as const, text }] };
      } catch (err) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Error: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.tool(
    "home_set_color",
    "Change the color of a smart light",
    {
      device: z
        .string()
        .describe('Light name, e.g. "bedroom lights", "lamp"'),
      color: z
        .string()
        .describe(
          'Color name or description, e.g. "red", "blue", "warm white", "cool white", "purple"',
        ),
    },
    async ({ device, color }) => {
      try {
        const result = await sendAssistantCommand(
          getAuth(),
          `set the ${device} to ${color}`,
          oauthClientId,
          gcpProjectId,
        );
        const text = result.response || `Changed ${device} color to ${color}.`;
        return { content: [{ type: "text" as const, text }] };
      } catch (err) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Error: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.tool(
    "home_set_thermostat",
    "Set the thermostat temperature",
    {
      temperature: z
        .number()
        .describe("Target temperature"),
      unit: z
        .enum(["F", "C"])
        .default("F")
        .describe("Temperature unit: F (Fahrenheit) or C (Celsius)"),
    },
    async ({ temperature, unit }) => {
      try {
        const unitWord = unit === "F" ? "degrees Fahrenheit" : "degrees Celsius";
        const result = await sendAssistantCommand(
          getAuth(),
          `set the thermostat to ${temperature} ${unitWord}`,
          oauthClientId,
          gcpProjectId,
        );
        const text =
          result.response || `Thermostat set to ${temperature}°${unit}.`;
        return { content: [{ type: "text" as const, text }] };
      } catch (err) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Error: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.tool(
    "home_query",
    "Ask Google Assistant about the state of your home devices",
    {
      query: z
        .string()
        .describe(
          'Question about device state, e.g. "is the living room light on?", "what is the thermostat set to?", "are any lights on?"',
        ),
    },
    async ({ query }) => {
      try {
        const result = await sendAssistantCommand(getAuth(), query, oauthClientId, gcpProjectId);
        const text = result.response || "No response from Google Assistant.";
        return { content: [{ type: "text" as const, text }] };
      } catch (err) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Error: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}
