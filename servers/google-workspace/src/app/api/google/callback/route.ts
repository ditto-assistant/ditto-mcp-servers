import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { GoogleTokens } from "@ditto-mcp/config";
import {
	loadConfig,
	getOAuth2Client,
	exchangeCode,
	saveTokens,
} from "@/google/auth";

/**
 * GET /api/google/callback
 *
 * Handles the OAuth2 redirect from Google after the user grants consent.
 * Exchanges the authorization code for tokens, persists them, and
 * redirects the user to the next setup wizard step.
 */
export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const code = searchParams.get("code");
		const error = searchParams.get("error");

		// Handle user denial or errors from Google
		if (error) {
			console.error("Google OAuth error:", error);
			return NextResponse.redirect(
				new URL(`/setup?step=3&error=${encodeURIComponent(error)}`, request.url),
			);
		}

		if (!code) {
			return NextResponse.redirect(
				new URL("/setup?step=3&error=missing_code", request.url),
			);
		}

		const config = await loadConfig();
		if (!config?.google?.clientId || !config?.google?.clientSecret) {
			return NextResponse.redirect(
				new URL("/setup?step=3&error=missing_config", request.url),
			);
		}

		const port = config.server?.port ?? 3100;
		const redirectUri = `http://localhost:${port}/api/google/callback`;

		const client = getOAuth2Client(
			config.google.clientId,
			config.google.clientSecret,
			redirectUri,
		);

		// Exchange authorization code for tokens
		const credentials = await exchangeCode(client, code);

		// Persist tokens to config store
		const tokens: GoogleTokens = {
			access_token: credentials.access_token ?? "",
			refresh_token: credentials.refresh_token ?? "",
			scope: credentials.scope ?? "",
			token_type: credentials.token_type ?? "Bearer",
			expiry_date: credentials.expiry_date ?? 0,
		};

		await saveTokens(tokens);

		// Redirect to the next step in the setup wizard
		return NextResponse.redirect(
			new URL("/setup?step=4", request.url),
		);
	} catch (error) {
		console.error("OAuth callback failed:", error);
		const errorMessage =
			error instanceof Error ? error.message : "unknown_error";
		return NextResponse.redirect(
			new URL(
				`/setup?step=3&error=${encodeURIComponent(errorMessage)}`,
				request.url,
			),
		);
	}
}
