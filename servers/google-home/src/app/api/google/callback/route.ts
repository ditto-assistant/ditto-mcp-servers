import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { GoogleHomeTokens } from "@ditto-mcp/config";
import { loadConfig, getOAuth2Client, exchangeCode, saveTokens } from "@/google/auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      return NextResponse.redirect(
        new URL(`/setup?step=2&error=${encodeURIComponent(error)}`, request.url),
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL("/setup?step=2&error=missing_code", request.url),
      );
    }

    const config = await loadConfig();
    if (!config?.google?.clientId || !config?.google?.clientSecret) {
      return NextResponse.redirect(
        new URL("/setup?step=2&error=missing_config", request.url),
      );
    }

    const port = config.server?.port ?? 3101;
    const redirectUri = `http://localhost:${port}/api/google/callback`;

    const client = getOAuth2Client(
      config.google.clientId,
      config.google.clientSecret,
      redirectUri,
    );

    const credentials = await exchangeCode(client, code);

    const tokens: GoogleHomeTokens = {
      access_token: credentials.access_token ?? "",
      refresh_token: credentials.refresh_token ?? "",
      scope: credentials.scope ?? "",
      token_type: credentials.token_type ?? "Bearer",
      expiry_date: credentials.expiry_date ?? 0,
    };

    await saveTokens(tokens);

    return NextResponse.redirect(new URL("/setup?step=3", request.url));
  } catch (err) {
    console.error("OAuth callback failed:", err);
    const msg = err instanceof Error ? err.message : "unknown_error";
    return NextResponse.redirect(
      new URL(`/setup?step=2&error=${encodeURIComponent(msg)}`, request.url),
    );
  }
}
