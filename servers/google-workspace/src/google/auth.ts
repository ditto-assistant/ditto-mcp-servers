import { google, type Auth } from "googleapis";
import {
	ConfigStore,
	type GoogleWorkspaceConfig,
	type GoogleTokens,
} from "@ditto-mcp/config";

const CONFIG_STORE = new ConfigStore("google-workspace");
const TOKENS_FILE = "tokens.json";
const CONFIG_FILE = "config.json";

export const GOOGLE_SCOPES = {
	gmail: ["https://www.googleapis.com/auth/gmail.modify"],
	calendar: ["https://www.googleapis.com/auth/calendar"],
	docs: ["https://www.googleapis.com/auth/documents"],
	sheets: ["https://www.googleapis.com/auth/spreadsheets"],
	drive: ["https://www.googleapis.com/auth/drive"],
} as const;

/**
 * Create a new OAuth2 client instance with the given credentials.
 */
export function getOAuth2Client(
	clientId: string,
	clientSecret: string,
	redirectUri: string,
): Auth.OAuth2Client {
	return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

/**
 * Generate the Google consent screen URL for the requested scopes.
 */
export function generateAuthUrl(
	client: Auth.OAuth2Client,
	scopes: string[],
): string {
	return client.generateAuthUrl({
		access_type: "offline",
		prompt: "consent",
		scope: scopes,
	});
}

/**
 * Exchange an authorization code for access + refresh tokens.
 */
export async function exchangeCode(
	client: Auth.OAuth2Client,
	code: string,
): Promise<Auth.Credentials> {
	const { tokens } = await client.getToken(code);
	return tokens;
}

/**
 * Load saved Google tokens from the config store.
 */
export async function loadTokens(): Promise<GoogleTokens | null> {
	return CONFIG_STORE.load<GoogleTokens>(TOKENS_FILE);
}

/**
 * Persist Google tokens to the config store.
 */
export async function saveTokens(tokens: GoogleTokens): Promise<void> {
	await CONFIG_STORE.save(TOKENS_FILE, tokens);
}

/**
 * Load the workspace config (client ID, secret, services, etc.).
 */
export async function loadConfig(): Promise<GoogleWorkspaceConfig | null> {
	return CONFIG_STORE.load<GoogleWorkspaceConfig>(CONFIG_FILE);
}

/**
 * Build an authenticated OAuth2 client from persisted config and tokens.
 * Returns null if config or tokens are missing.
 * Sets up a listener to auto-persist refreshed tokens.
 */
export async function getAuthenticatedClient(): Promise<Auth.OAuth2Client | null> {
	const config = await loadConfig();
	if (!config?.google?.clientId || !config?.google?.clientSecret) {
		return null;
	}

	const tokens = await loadTokens();
	if (!tokens) {
		return null;
	}

	const redirectUri = `http://localhost:${config.server?.port ?? 3100}/api/google/callback`;
	const client = getOAuth2Client(
		config.google.clientId,
		config.google.clientSecret,
		redirectUri,
	);

	client.setCredentials({
		access_token: tokens.access_token,
		refresh_token: tokens.refresh_token,
		scope: tokens.scope,
		token_type: tokens.token_type,
		expiry_date: tokens.expiry_date,
	});

	// Auto-persist refreshed tokens
	client.on("tokens", async (newTokens: Auth.Credentials) => {
		const merged: GoogleTokens = {
			access_token: newTokens.access_token ?? tokens.access_token,
			refresh_token: newTokens.refresh_token ?? tokens.refresh_token,
			scope: newTokens.scope ?? tokens.scope,
			token_type: newTokens.token_type ?? tokens.token_type,
			expiry_date: newTokens.expiry_date ?? tokens.expiry_date,
		};
		await saveTokens(merged);
	});

	return client;
}

/**
 * Resolve scopes from the enabled services in config.
 */
export function getScopesForServices(
	services: GoogleWorkspaceConfig["services"],
): string[] {
	const scopes: string[] = [];
	if (services.gmail) scopes.push(...GOOGLE_SCOPES.gmail);
	if (services.calendar) scopes.push(...GOOGLE_SCOPES.calendar);
	if (services.docs) scopes.push(...GOOGLE_SCOPES.docs);
	if (services.sheets) scopes.push(...GOOGLE_SCOPES.sheets);
	if (services.drive) scopes.push(...GOOGLE_SCOPES.drive);
	return [...new Set(scopes)];
}
