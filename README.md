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

Controls **Nest thermostats, cameras, and doorbells** via Google's [Smart Device Management API](https://developers.google.com/nest/device-access/reference/rest).

### Setup Steps

**Step 1 — Google OAuth Credentials**

1. [Google Cloud Console](https://console.cloud.google.com/) → select your project
2. Enable: **Smart Device Management API** (APIs & Services → Library)
3. **OAuth consent screen** → External → add `https://www.googleapis.com/auth/sdm.service` scope
4. **Credentials → OAuth 2.0 Client ID** → Web application
   - Redirect URI: `http://localhost:3101/api/google/callback`
5. Paste Client ID and Client Secret into the wizard

**Step 2 — Sign in with Google** — grant `sdm.service` access

**Step 3 — Device Access Project**

1. Go to [console.nest.google.com/device-access](https://console.nest.google.com/device-access)
2. Accept terms and create a project (enter your OAuth Client ID when prompted)
3. Copy the **Project ID** and paste it into the wizard

> **Note:** The Device Access program may require accepting Google's terms of service at [console.nest.google.com/device-access](https://console.nest.google.com/device-access).

**Step 4 — ngrok Token** — same as Google Workspace setup

**Step 5 — Launch** — click **Start Server**

### Available Tools (9)

| Tool | Description |
|------|-------------|
| `home_list_devices` | List all Nest devices with type, room, and current state |
| `home_get_device` | Get full trait data for a specific device |
| `home_list_structures` | List home structures |
| `home_list_rooms` | List rooms in a structure |
| `home_get_thermostat_status` | Get temperature (°F + °C), humidity, mode, HVAC status |
| `home_set_thermostat_mode` | Set mode: `HEAT` / `COOL` / `HEATCOOL` / `OFF` |
| `home_set_thermostat_eco` | Enable (`MANUAL_ECO`) or disable Eco mode |
| `home_set_temperature` | Set heat/cool setpoints in °F (auto-converted to °C) |
| `home_control_fan` | Turn fan on/off with optional duration (minutes) |

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
        ├── src/app/api/      # MCP SSE, config, status, OAuth routes
        ├── src/mcp/          # MCP server + 9 tool definitions
        ├── src/google/       # SDM API client + OAuth
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
