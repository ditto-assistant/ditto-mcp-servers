import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SdmService } from "@/google/sdm";
import { celsiusToFahrenheit, fahrenheitToCelsius } from "@/google/sdm";

export function registerThermostatTools(
  server: McpServer,
  getService: () => SdmService,
): void {
  server.tool(
    "home_get_thermostat_status",
    "Get the current status of a Nest thermostat: temperature, humidity, mode, HVAC state, and setpoints",
    {
      deviceId: z.string().describe("Device ID (from home_list_devices)"),
    },
    async ({ deviceId }) => {
      try {
        const device = await getService().getDevice(deviceId);
        const traits = device.traits as Record<string, Record<string, unknown>>;

        const temp = traits["sdm.devices.traits.Temperature"];
        const humidity = traits["sdm.devices.traits.Humidity"];
        const mode = traits["sdm.devices.traits.ThermostatMode"];
        const hvac = traits["sdm.devices.traits.ThermostatHvac"];
        const setpoint = traits["sdm.devices.traits.ThermostatTemperatureSetpoint"];
        const eco = traits["sdm.devices.traits.ThermostatEco"];
        const connectivity = traits["sdm.devices.traits.Connectivity"];
        const settings = traits["sdm.devices.traits.Settings"];

        const ambientC = (temp?.ambientTemperatureCelsius as number) ?? null;
        const ambientF = ambientC !== null ? celsiusToFahrenheit(ambientC) : null;

        const summary = {
          deviceId,
          connectivity: connectivity?.status ?? "UNKNOWN",
          temperatureScale: settings?.temperatureScale ?? "CELSIUS",
          currentTemperature: {
            celsius: ambientC,
            fahrenheit: ambientF,
          },
          humidity: humidity?.ambientHumidityPercent ?? null,
          thermostatMode: mode?.mode ?? null,
          availableModes: mode?.availableModes ?? [],
          hvacStatus: hvac?.status ?? null,
          ecoMode: eco?.mode ?? null,
          setpoints: {
            heatCelsius: (setpoint?.heatCelsius as number) ?? null,
            coolCelsius: (setpoint?.coolCelsius as number) ?? null,
            heatFahrenheit:
              (setpoint?.heatCelsius as number)
                ? celsiusToFahrenheit(setpoint.heatCelsius as number)
                : null,
            coolFahrenheit:
              (setpoint?.coolCelsius as number)
                ? celsiusToFahrenheit(setpoint.coolCelsius as number)
                : null,
          },
        };

        return {
          content: [{ type: "text" as const, text: JSON.stringify(summary, null, 2) }],
        };
      } catch (err) {
        return {
          content: [{ type: "text" as const, text: `Error getting thermostat status: ${err instanceof Error ? err.message : String(err)}` }],
          isError: true,
        };
      }
    },
  );

  server.tool(
    "home_set_thermostat_mode",
    "Set the thermostat mode to HEAT, COOL, HEATCOOL, or OFF. Must be set before adjusting temperature setpoints.",
    {
      deviceId: z.string().describe("Device ID (from home_list_devices)"),
      mode: z.enum(["HEAT", "COOL", "HEATCOOL", "OFF"]).describe(
        "Thermostat mode: HEAT (heat only), COOL (cool only), HEATCOOL (auto heat+cool), OFF",
      ),
    },
    async ({ deviceId, mode }) => {
      try {
        await getService().setThermostatMode(deviceId, mode);
        return {
          content: [{ type: "text" as const, text: `Thermostat mode set to ${mode} successfully.` }],
        };
      } catch (err) {
        return {
          content: [{ type: "text" as const, text: `Error setting thermostat mode: ${err instanceof Error ? err.message : String(err)}` }],
          isError: true,
        };
      }
    },
  );

  server.tool(
    "home_set_thermostat_eco",
    "Enable or disable Eco mode on a Nest thermostat",
    {
      deviceId: z.string().describe("Device ID (from home_list_devices)"),
      ecoMode: z.enum(["MANUAL_ECO", "OFF"]).describe(
        "MANUAL_ECO to enable Eco mode, OFF to disable",
      ),
    },
    async ({ deviceId, ecoMode }) => {
      try {
        await getService().setEcoMode(deviceId, ecoMode);
        return {
          content: [{ type: "text" as const, text: `Eco mode set to ${ecoMode} successfully.` }],
        };
      } catch (err) {
        return {
          content: [{ type: "text" as const, text: `Error setting eco mode: ${err instanceof Error ? err.message : String(err)}` }],
          isError: true,
        };
      }
    },
  );

  server.tool(
    "home_set_temperature",
    "Set the temperature setpoint(s) on a Nest thermostat. The thermostat must already be in the matching mode (HEAT/COOL/HEATCOOL). Accepts Fahrenheit — values are converted to Celsius for the API.",
    {
      deviceId: z.string().describe("Device ID (from home_list_devices)"),
      heatFahrenheit: z
        .number()
        .optional()
        .describe("Heat setpoint in °F (required for HEAT or HEATCOOL mode)"),
      coolFahrenheit: z
        .number()
        .optional()
        .describe("Cool setpoint in °F (required for COOL or HEATCOOL mode)"),
    },
    async ({ deviceId, heatFahrenheit, coolFahrenheit }) => {
      try {
        const svc = getService();

        if (heatFahrenheit !== undefined && coolFahrenheit !== undefined) {
          const hC = fahrenheitToCelsius(heatFahrenheit);
          const cC = fahrenheitToCelsius(coolFahrenheit);
          await svc.setTemperatureRange(deviceId, hC, cC);
          return {
            content: [
              {
                type: "text" as const,
                text: `Temperature range set: heat ${heatFahrenheit}°F (${hC}°C), cool ${coolFahrenheit}°F (${cC}°C).`,
              },
            ],
          };
        }

        if (heatFahrenheit !== undefined) {
          const hC = fahrenheitToCelsius(heatFahrenheit);
          await svc.setHeatTemperature(deviceId, hC);
          return {
            content: [
              {
                type: "text" as const,
                text: `Heat setpoint set to ${heatFahrenheit}°F (${hC}°C).`,
              },
            ],
          };
        }

        if (coolFahrenheit !== undefined) {
          const cC = fahrenheitToCelsius(coolFahrenheit);
          await svc.setCoolTemperature(deviceId, cC);
          return {
            content: [
              {
                type: "text" as const,
                text: `Cool setpoint set to ${coolFahrenheit}°F (${cC}°C).`,
              },
            ],
          };
        }

        return {
          content: [{ type: "text" as const, text: "Provide heatFahrenheit and/or coolFahrenheit." }],
          isError: true,
        };
      } catch (err) {
        return {
          content: [{ type: "text" as const, text: `Error setting temperature: ${err instanceof Error ? err.message : String(err)}` }],
          isError: true,
        };
      }
    },
  );

  server.tool(
    "home_control_fan",
    "Turn the fan on a Nest thermostat on or off. When turning on, you can specify how long to run it.",
    {
      deviceId: z.string().describe("Device ID (from home_list_devices)"),
      timerMode: z.enum(["ON", "OFF"]).describe("ON to run the fan, OFF to stop it"),
      durationMinutes: z
        .number()
        .optional()
        .default(15)
        .describe("How long to run the fan in minutes (default: 15, max: 43200)"),
    },
    async ({ deviceId, timerMode, durationMinutes }) => {
      try {
        const durationSeconds =
          timerMode === "ON" ? (durationMinutes ?? 15) * 60 : undefined;
        await getService().setFanTimer(deviceId, timerMode, durationSeconds);
        const msg =
          timerMode === "ON"
            ? `Fan turned on for ${durationMinutes ?? 15} minutes.`
            : "Fan turned off.";
        return { content: [{ type: "text" as const, text: msg }] };
      } catch (err) {
        return {
          content: [{ type: "text" as const, text: `Error controlling fan: ${err instanceof Error ? err.message : String(err)}` }],
          isError: true,
        };
      }
    },
  );
}
