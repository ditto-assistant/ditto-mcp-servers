import { google, type Auth } from "googleapis";
import { ConfigStore, type GoogleHomeConfig, type GoogleHomeTokens } from "@ditto-mcp/config";

const CONFIG_STORE = new ConfigStore("google-home");
const TOKENS_FILE = "tokens.json";
const CONFIG_FILE = "config.json";

/** OAuth2 scope for the Smart Device Management API. */
export const SDM_SCOPE = "https://www.googleapis.com/auth/sdm.service";

export function getOAuth2Client(
  clientId: string,
  clientSecret: string,
  redirectUri: string,
): Auth.OAuth2Client {
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export function generateAuthUrl(client: Auth.OAuth2Client): string {
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [SDM_SCOPE],
  });
}

export async function exchangeCode(
  client: Auth.OAuth2Client,
  code: string,
): Promise<Auth.Credentials> {
  const { tokens } = await client.getToken(code);
  return tokens;
}

export async function loadTokens(): Promise<GoogleHomeTokens | null> {
  return CONFIG_STORE.load<GoogleHomeTokens>(TOKENS_FILE);
}

export async function saveTokens(tokens: GoogleHomeTokens): Promise<void> {
  await CONFIG_STORE.save(TOKENS_FILE, tokens);
}

export async function loadConfig(): Promise<GoogleHomeConfig | null> {
  return CONFIG_STORE.load<GoogleHomeConfig>(CONFIG_FILE);
}

/**
 * Build an authenticated OAuth2 client from persisted config and tokens.
 * Returns null if config or tokens are missing.
 */
export async function getAuthenticatedClient(): Promise<Auth.OAuth2Client | null> {
  const config = await loadConfig();
  if (!config?.google?.clientId || !config?.google?.clientSecret) return null;

  const tokens = await loadTokens();
  if (!tokens) return null;

  const port = config.server?.port ?? 3101;
  const redirectUri = `http://localhost:${port}/api/google/callback`;

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

  client.on("tokens", async (newTokens: Auth.Credentials) => {
    const merged: GoogleHomeTokens = {
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
