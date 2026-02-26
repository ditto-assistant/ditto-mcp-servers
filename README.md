# Ditto MCP Servers

Open-source [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) servers for [Ditto Assistant](https://heyditto.ai). Each server runs as a **local home server** — a Next.js app on your machine with a setup GUI, ngrok tunnel for connectivity, and bearer-token auth so only Ditto can call it.

## Supported Servers

| Server | Services | Port | Status |
|--------|----------|------|--------|
| **Google Workspace** | Gmail, Calendar, Docs, Sheets, Drive | 3100 | ✅ Available |
| **Google Home** | Nest Thermostat, Camera, Doorbell (Smart Device Management API) | 3101 | ✅ Available |

---

## Architecture

```
┌─────────────────────────────────────────────┐
│  Your Machine (Home Server)                 │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │  Next.js App (localhost:3100)         │  │
│  │  /         → Setup Wizard / Dashboard │  │
│  │  /api/mcp  → MCP SSE Endpoint        │  │
│  └──────────┬────────────────────────────┘  │
│             │                               │
│  ┌──────────▼──────────┐                    │
│  │  ngrok tunnel       │                    │
│  │  https://xyz.ngrok  │                    │
│  └──────────┬──────────┘                    │
└─────────────┼───────────────────────────────┘
              │
     ┌────────▼────────┐     ┌────────────────┐
     │  Ditto Backend  │◄───►│  Google APIs   │
     │  api.heyditto.ai│     └────────────────┘
     └─────────────────┘
```

The MCP endpoint (`/api/mcp`) is protected by a **bearer token** that is auto-generated on first run and displayed in the dashboard. Ditto connects through the ngrok tunnel using that token.

---

## Quick Start

### Prerequisites

- **Node.js** 20+
- **pnpm** — `npm install -g pnpm`
- **ngrok account** — [sign up free](https://dashboard.ngrok.com/signup), grab your auth token from [dashboard.ngrok.com/get-started/your-authtoken](https://dashboard.ngrok.com/get-started/your-authtoken)
- **Google Cloud project** with OAuth credentials (see below)
- **Ditto account** — [heyditto.ai](https://heyditto.ai)

### 1. Clone & install

```bash
git clone https://github.com/ditto-assistant/ditto-mcp-servers.git
cd ditto-mcp-servers
pnpm install
```

### 2. Start a server

```bash
# Google Workspace (port 3100)
pnpm dev

# Google Home (port 3101)
pnpm dev:home

# Both servers simultaneously
pnpm dev:all
```

Open the dashboard URL — the setup wizard will guide you through the rest.

---

## Google Workspace Server (port 3100)

Open **http://localhost:3100** after running `pnpm dev`.

### Setup Steps

**Step 1 — Google OAuth Credentials**

1. [Google Cloud Console](https://console.cloud.google.com/) → create or select a project
2. Enable: Gmail API, Google Calendar API, Google Docs API, Google Sheets API, Google Drive API
3. **OAuth consent screen** → External → add your email as a test user
4. **Credentials → Create Credentials → OAuth 2.0 Client ID** → Web application
   - Redirect URI: `http://localhost:3100/api/google/callback`
5. Paste Client ID and Client Secret into the wizard

**Step 2 — Sign in with Google** — authorize access to your Workspace

**Step 3 — ngrok Token** — paste your [ngrok auth token](https://dashboard.ngrok.com/get-started/your-authtoken)

**Step 4 — Services** — toggle Gmail, Calendar, Docs, Sheets, Drive on/off

**Step 5 — Launch** — click **Start Server** to create the tunnel

### Available Tools (22)

| Category | Tools |
|----------|-------|
| Gmail | `gmail_search`, `gmail_read`, `gmail_send`, `gmail_draft`, `gmail_list_labels` |
| Calendar | `calendar_list_events`, `calendar_create_event`, `calendar_update_event`, `calendar_delete_event`, `calendar_search_events` |
| Docs | `docs_create`, `docs_read`, `docs_update`, `docs_search` |
| Sheets | `sheets_create`, `sheets_read`, `sheets_update`, `sheets_search` |
| Drive | `drive_list`, `drive_search`, `drive_upload`, `drive_download` |

---

## Google Home Server (port 3101)

Open **http://localhost:3101** after running `pnpm dev:home`.

Controls **any Google Home integrated device** — lights, switches, plugs, thermostats, fans, TVs, locks — via the [Google Assistant Embedded gRPC API](https://developers.google.com/assistant/sdk/overview). Works exactly like speaking to a Google Home speaker. No Nest devices required.

### Setup Steps

**Step 1 — Google OAuth Credentials**

1. [Google Cloud Console](https://console.cloud.google.com/) → select your project (e.g. `homeassistant-436204`)
2. Enable the **Google Assistant API**: APIs & Services → Library → search "Google Assistant API"
3. **OAuth consent screen** → External → add your Google account as a test user
4. Under **Scopes**, add: `https://www.googleapis.com/auth/assistant-sdk-prototype`
5. **Credentials → Create Credentials → OAuth 2.0 Client ID** → Web application
   - Redirect URI: `http://localhost:3101/api/google/callback`
6. Paste Client ID and Client Secret into the wizard

**Step 2 — Sign in with Google** — grant `assistant-sdk-prototype` access

**Step 3 — ngrok Token** — paste your [ngrok auth token](https://dashboard.ngrok.com/get-started/your-authtoken)

**Step 4 — Launch** — click **Start Server**

### Available Tools (7)

| Tool | Description |
|------|-------------|
| `home_send_command` | Send any freeform command to Google Assistant (most powerful) |
| `home_turn_on` | Turn on a device or room |
| `home_turn_off` | Turn off a device or room |
| `home_set_brightness` | Set light brightness (1–100%) |
| `home_set_color` | Change smart light color |
| `home_set_thermostat` | Set thermostat temperature (°F or °C) |
| `home_query` | Ask about device state (e.g. "is the bedroom light on?") |

**Example commands Ditto can send:**
- "turn on the bedroom lights"
- "set the kitchen lights to 40%"
- "turn off all lights"
- "set the thermostat to 70 degrees"
- "set the lamp to warm white"

---

## Connecting to Ditto

After starting a server:

1. Copy the **ngrok URL** from the dashboard (e.g. `https://xxxx.ngrok-free.app`)
2. Copy the **Bearer Token** from the Connection card
3. In the Ditto App: **Settings → MCP Servers → Add Server**

| Field | Value |
|-------|-------|
| Name | `Google Workspace` or `Google Home` |
| URL | `https://xxxx.ngrok-free.app/api/mcp` |
| Auth | Bearer → paste the token |

Save, enable the server, and confirm tools load in the expanded row.

---

## Keeping Servers Running

Servers must be running locally for Ditto to use their tools. Run `pnpm dev` or `pnpm dev:home` again after a reboot. All credentials are saved in `~/.ditto-mcp-servers/` so setup only needs to be done once. If you have a reserved ngrok domain the URL stays the same across restarts.

---

## Project Structure

```
ditto-mcp-servers/
├── .npmrc                    # pnpm hoist config for @ngrok/* native modules
├── packages/
│   ├── config/               # Config persistence (~/.ditto-mcp-servers/)
│   └── tunnel/               # ngrok tunnel management
└── servers/
    ├── google-workspace/     # Google Workspace MCP server (port 3100)
    │   ├── src/app/api/      # MCP SSE, config, status, OAuth routes
    │   ├── src/mcp/          # MCP server + 22 tool definitions
    │   ├── src/google/       # Gmail, Calendar, Docs, Sheets, Drive clients
    │   └── src/components/   # Setup wizard + dashboard UI
    └── google-home/          # Google Home MCP server (port 3101)
        ├── proto/            # Google Assistant Embedded gRPC proto file
        ├── src/app/api/      # MCP SSE, config, status, OAuth routes
        ├── src/mcp/          # MCP server + 7 tool definitions
        ├── src/google/       # Google Assistant gRPC client + OAuth
        └── src/components/   # Setup wizard + dashboard UI
```

Credentials are stored locally:
```
~/.ditto-mcp-servers/
├── google-workspace/
│   ├── config.json    # OAuth creds, ngrok token, service toggles
│   ├── tokens.json    # Google OAuth refresh token
│   ├── state.json     # Active tunnel URL
│   └── auth.json      # Bearer token for Ditto
└── google-home/
    ├── config.json    # OAuth creds, Device Access project ID, ngrok token
    ├── tokens.json    # Google OAuth refresh token (sdm.service scope)
    ├── state.json     # Active tunnel URL
    └── auth.json      # Bearer token for Ditto
```

---

## Development

```bash
pnpm install       # Install all dependencies
pnpm dev           # Start Google Workspace on :3100
pnpm dev:home      # Start Google Home on :3101
pnpm dev:all       # Start all servers
pnpm build         # Build all packages
pnpm lint          # Lint with Biome
pnpm format        # Format with Biome
```

## Adding a New MCP Server

1. Create a new directory under `servers/`
2. Scaffold a Next.js app
3. Implement MCP tools in `src/mcp/tools/`
4. Expose the SSE endpoint at `/api/mcp` with bearer token auth
5. Reuse `@ditto-mcp/config`, `@ditto-mcp/tunnel` shared packages
6. Include a setup wizard + dashboard GUI

## Contributing

Contributions welcome! Open a PR with your new server or improvements.

## License

MIT
