import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import {
  createConfigStore,
  type GoogleHomeConfig,
  type GoogleHomeTokens,
  type ServerState,
} from "@ditto-mcp/config";
import { createTunnel, disconnectAll } from "@ditto-mcp/tunnel";

const store = createConfigStore("google-home");
const startedAt = Date.now();
let activeTunnelUrl: string | null = null;

interface AuthConfig {
  bearerToken: string;
}

async function getOrCreateBearerToken(): Promise<string> {
  const existing = await store.load<AuthConfig>("auth.json");
  if (existing?.bearerToken) return existing.bearerToken;
  const token = randomBytes(32).toString("hex");
  await store.save<AuthConfig>("auth.json", { bearerToken: token });
  return token;
}

export async function GET() {
  try {
    const config = await store.load<GoogleHomeConfig>("config.json");
    const tokens = await store.load<GoogleHomeTokens>("tokens.json");
    const state = await store.load<ServerState>("state.json");
    const bearerToken = await getOrCreateBearerToken();
    const uptime = Date.now() - startedAt;

    return NextResponse.json({
      connected: !!activeTunnelUrl || !!state?.ngrokUrl,
      tunnelUrl: activeTunnelUrl ?? state?.ngrokUrl ?? "",
      bearerToken,
      uptime,
      deviceAccess: {
        projectId: config?.deviceAccess?.projectId ?? "",
        configured: !!config?.deviceAccess?.projectId,
      },
      google: {
        authenticated: !!tokens?.refresh_token,
        expiryDate: tokens?.expiry_date ?? 0,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to get status" },
      { status: 500 },
    );
  }
}

export async function POST() {
  try {
    try {
      await disconnectAll();
    } catch {
      // Ignore disconnect errors
    }
    activeTunnelUrl = null;

    const config = await store.load<GoogleHomeConfig>("config.json");
    if (!config?.ngrok?.authtoken) {
      return NextResponse.json(
        { error: "ngrok authtoken not configured. Please complete setup first." },
        { status: 400 },
      );
    }

    const port = config.server?.port ?? 3101;
    const tunnel = await createTunnel({
      port,
      authtoken: config.ngrok.authtoken,
      domain: config.ngrok.domain,
    });

    activeTunnelUrl = tunnel.url;

    const state: ServerState = {
      ngrokUrl: tunnel.url,
      lastStarted: new Date().toISOString(),
    };
    await store.save("state.json", state);

    return NextResponse.json({ ok: true, tunnelUrl: tunnel.url, ngrokUrl: tunnel.url });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to start tunnel" },
      { status: 500 },
    );
  }
}
