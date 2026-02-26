import { NextResponse } from "next/server";
import { createConfigStore, type GoogleHomeConfig } from "@ditto-mcp/config";

const CONFIG_FILE = "config.json";
const store = createConfigStore("google-home");

const DEFAULT_CONFIG: GoogleHomeConfig = {
  google: {
    clientId: "",
    clientSecret: "",
  },
  ngrok: {
    authtoken: "",
  },
  server: {
    port: 3101,
  },
};

export async function GET() {
  try {
    const config = await store.load<GoogleHomeConfig>(CONFIG_FILE);
    if (!config) return NextResponse.json(null, { status: 404 });
    return NextResponse.json(config);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load config" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const patch = await request.json();
    const existing =
      (await store.load<GoogleHomeConfig>(CONFIG_FILE)) ?? DEFAULT_CONFIG;

    const merged: GoogleHomeConfig = {
      google: { ...existing.google, ...patch.google },
      ngrok: { ...existing.ngrok, ...patch.ngrok },
      server: { ...existing.server, ...patch.server },
    };

    await store.save(CONFIG_FILE, merged);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to save config" },
      { status: 500 },
    );
  }
}
