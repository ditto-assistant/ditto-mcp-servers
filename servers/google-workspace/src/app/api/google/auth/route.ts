import { NextResponse } from "next/server";
import {
	loadConfig,
	getOAuth2Client,
	generateAuthUrl,
	getScopesForServices,
} from "@/google/auth";

/**
 * GET /api/google/auth
 *
 * Initiates the Google OAuth2 flow by redirecting the user to
 * Google's consent screen with the appropriate scopes based on
 * which services are enabled in the config.
 */
export async function GET() {
	try {
		const config = await loadConfig();
		if (!config) {
			return NextResponse.json(
				{ error: "Configuration not found. Complete the setup wizard first." },
				{ status: 400 },
			);
		}

		if (!config.google?.clientId || !config.google?.clientSecret) {
			return NextResponse.json(
				{ error: "Google OAuth credentials not configured." },
				{ status: 400 },
			);
		}

		const port = config.server?.port ?? 3100;
		const redirectUri = `http://localhost:${port}/api/google/callback`;

		const client = getOAuth2Client(
			config.google.clientId,
			config.google.clientSecret,
			redirectUri,
		);

		// Determine scopes based on enabled services
		const scopes = getScopesForServices(config.services);
		if (scopes.length === 0) {
			return NextResponse.json(
				{ error: "No services enabled. Enable at least one Google service." },
				{ status: 400 },
			);
		}

		const authUrl = generateAuthUrl(client, scopes);

		return NextResponse.redirect(authUrl);
	} catch (error) {
		console.error("OAuth auth start failed:", error);
		return NextResponse.json(
			{
				error: `Failed to start OAuth flow: ${error instanceof Error ? error.message : String(error)}`,
			},
			{ status: 500 },
		);
	}
}
