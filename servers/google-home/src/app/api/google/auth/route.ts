import { NextResponse } from "next/server";
import { loadConfig, getOAuth2Client, generateAuthUrl } from "@/google/auth";

export async function GET() {
  try {
    const config = await loadConfig();
    if (!config?.google?.clientId || !config?.google?.clientSecret) {
      return NextResponse.json(
        { error: "Google OAuth credentials not configured." },
        { status: 400 },
      );
    }

    const port = config.server?.port ?? 3101;
    const redirectUri = `http://localhost:${port}/api/google/callback`;

    const client = getOAuth2Client(
      config.google.clientId,
      config.google.clientSecret,
      redirectUri,
    );

    const authUrl = generateAuthUrl(client);
    return NextResponse.redirect(authUrl);
  } catch (err) {
    console.error("OAuth auth start failed:", err);
    return NextResponse.json(
      { error: `Failed to start OAuth flow: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 },
    );
  }
}
