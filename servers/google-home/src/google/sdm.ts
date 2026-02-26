import type { Auth } from "googleapis";

const SDM_BASE = "https://smartdevicemanagement.googleapis.com/v1";

export interface SdmDevice {
  name: string;
  type: string;
  traits: Record<string, unknown>;
  parentRelations: Array<{ parent: string; displayName: string }>;
}

export interface SdmStructure {
  name: string;
  traits: Record<string, unknown>;
}

export interface SdmRoom {
  name: string;
  traits: Record<string, unknown>;
}

export type ThermostatMode = "HEAT" | "COOL" | "HEATCOOL" | "OFF";
export type EcoMode = "MANUAL_ECO" | "OFF";
export type FanTimerMode = "ON" | "OFF";

/**
 * Thin wrapper around the Smart Device Management REST API.
 * All methods use the authenticated OAuth2 client's access token.
 */
export class SdmService {
  private projectId: string;
  private auth: Auth.OAuth2Client;

  constructor(auth: Auth.OAuth2Client, projectId: string) {
    this.auth = auth;
    this.projectId = projectId;
  }

  private get enterprisePath() {
    return `enterprises/${this.projectId}`;
  }

  private async getAccessToken(): Promise<string> {
    const { token } = await this.auth.getAccessToken();
    if (!token) throw new Error("Failed to obtain access token");
    return token;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {},
  ): Promise<T> {
    const token = await this.getAccessToken();
    const url = `${SDM_BASE}/${path}`;
    const res = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...(options.headers ?? {}),
      },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`SDM API error ${res.status}: ${body}`);
    }

    return res.json() as Promise<T>;
  }

  // ── Devices ──────────────────────────────────────────────────────────────

  async listDevices(): Promise<SdmDevice[]> {
    const data = await this.request<{ devices?: SdmDevice[] }>(
      `${this.enterprisePath}/devices`,
    );
    return data.devices ?? [];
  }

  async getDevice(deviceId: string): Promise<SdmDevice> {
    return this.request<SdmDevice>(
      `${this.enterprisePath}/devices/${deviceId}`,
    );
  }

  async executeCommand(
    deviceId: string,
    command: string,
    params: Record<string, unknown>,
  ): Promise<unknown> {
    return this.request(
      `${this.enterprisePath}/devices/${deviceId}:executeCommand`,
      {
        method: "POST",
        body: JSON.stringify({ command, params }),
      },
    );
  }

  // ── Structures & Rooms ───────────────────────────────────────────────────

  async listStructures(): Promise<SdmStructure[]> {
    const data = await this.request<{ structures?: SdmStructure[] }>(
      `${this.enterprisePath}/structures`,
    );
    return data.structures ?? [];
  }

  async listRooms(structureId: string): Promise<SdmRoom[]> {
    const data = await this.request<{ rooms?: SdmRoom[] }>(
      `${this.enterprisePath}/structures/${structureId}/rooms`,
    );
    return data.rooms ?? [];
  }

  // ── Thermostat helpers ───────────────────────────────────────────────────

  async setThermostatMode(deviceId: string, mode: ThermostatMode): Promise<void> {
    await this.executeCommand(
      deviceId,
      "sdm.devices.commands.ThermostatMode.SetMode",
      { mode },
    );
  }

  async setEcoMode(deviceId: string, mode: EcoMode): Promise<void> {
    await this.executeCommand(
      deviceId,
      "sdm.devices.commands.ThermostatEco.SetMode",
      { mode },
    );
  }

  async setHeatTemperature(deviceId: string, heatCelsius: number): Promise<void> {
    await this.executeCommand(
      deviceId,
      "sdm.devices.commands.ThermostatTemperatureSetpoint.SetHeat",
      { heatCelsius },
    );
  }

  async setCoolTemperature(deviceId: string, coolCelsius: number): Promise<void> {
    await this.executeCommand(
      deviceId,
      "sdm.devices.commands.ThermostatTemperatureSetpoint.SetCool",
      { coolCelsius },
    );
  }

  async setTemperatureRange(
    deviceId: string,
    heatCelsius: number,
    coolCelsius: number,
  ): Promise<void> {
    await this.executeCommand(
      deviceId,
      "sdm.devices.commands.ThermostatTemperatureSetpoint.SetRange",
      { heatCelsius, coolCelsius },
    );
  }

  async setFanTimer(
    deviceId: string,
    timerMode: FanTimerMode,
    durationSeconds?: number,
  ): Promise<void> {
    const params: Record<string, unknown> = { timerMode };
    if (timerMode === "ON" && durationSeconds) {
      params.duration = `${durationSeconds}s`;
    }
    await this.executeCommand(
      deviceId,
      "sdm.devices.commands.Fan.SetTimer",
      params,
    );
  }
}

// ── Utility ──────────────────────────────────────────────────────────────────

/** Extract the short device ID from a full SDM resource name. */
export function deviceIdFromName(name: string): string {
  const parts = name.split("/");
  return parts[parts.length - 1] ?? name;
}

/** Parse the device type into a human-readable label. */
export function deviceTypeLabel(type: string): string {
  const map: Record<string, string> = {
    "sdm.devices.types.THERMOSTAT": "Thermostat",
    "sdm.devices.types.CAMERA": "Camera",
    "sdm.devices.types.DOORBELL": "Doorbell",
    "sdm.devices.types.DISPLAY": "Nest Hub Display",
  };
  return map[type] ?? type.replace("sdm.devices.types.", "");
}

/** Convert Celsius to Fahrenheit. */
export function celsiusToFahrenheit(c: number): number {
  return Math.round((c * 9) / 5 + 32);
}

/** Convert Fahrenheit to Celsius. */
export function fahrenheitToCelsius(f: number): number {
  return Math.round(((f - 32) * 5) / 9 * 10) / 10;
}
