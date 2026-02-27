# Ditto MCP Servers

Open-source [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) servers for [Ditto Assistant](https://heyditto.ai). Each server runs as a **local home server** — a Next.js app on your machine with a setup GUI, ngrok tunnel for connectivity, and bearer-token auth so only Ditto can call it.

## Supported Servers

| Server | Services | Port | Status |
|--------|----------|------|--------|
| **Google** | Gmail, Calendar, Docs, Sheets, Drive + Google Home (lights, thermostat, etc.) | 3100 | ✅ Available |

---

## Architecture

```
┌─────────────────────────────────────────────┐
│  Your Machine                               │
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
     ┌────────▼────────┐     ┌────────────────────────┐
     │  Ditto Backend  │◄───►│  Google APIs +         │
     │  api.heyditto.ai│     │  Google Assistant gRPC │
     └─────────────────┘     └────────────────────────┘
```

The MCP endpoint (`/api/mcp`) is protected by a **bearer token** auto-generated on first run and shown in the dashboard. Ditto connects through the ngrok tunnel using that token.

---

## Quick Start

### Prerequisites

- **Node.js** 20+
- **pnpm** — `npm install -g pnpm`
- **ngrok account** — [sign up free](https://dashboard.ngrok.com/signup)
- **Google Cloud project** with OAuth credentials (see below)
- **Ditto account** — [heyditto.ai](https://heyditto.ai)

### 1. Clone & install

```bash
git clone https://github.com/ditto-assistant/ditto-mcp-servers.git
cd ditto-mcp-servers
pnpm install
```

### 2. Start the server

```bash
pnpm dev
```

Open **http://localhost:3100** — the setup wizard will guide you through the rest.

---

## Google Server (port 3100)

One server, one OAuth flow, one ngrok tunnel. Covers Google Workspace **and** Google Home.

### Setup Steps

**Step 1 — Google OAuth Credentials**

1. [Google Cloud Console](https://console.cloud.google.com/) → create or select a project
2. Enable the APIs you want (**APIs & Services → Library**):
   - Gmail API, Google Calendar API, Google Docs API, Google Sheets API, Google Drive API
   - **Google Assistant API** (for Google Home control)
3. **OAuth consent screen** → External → add your email as a test user → add the scope `https://www.googleapis.com/auth/assistant-sdk-prototype`
4. **Credentials → Create Credentials → OAuth 2.0 Client ID** → Web application
   - Authorized redirect URI: `http://localhost:3100/api/google/callback`
5. Paste **Client ID** and **Client Secret** into the wizard

**Step 2 — Sign in with Google** — one consent screen grants access to everything you enabled

**Step 3 — ngrok Token** — paste your [ngrok auth token](https://dashboard.ngrok.com/get-started/your-authtoken)

**Step 4 — Services** — toggle on/off: Gmail, Calendar, Docs, Sheets, Drive, **Google Home**

**Step 5 — Launch** — click **Start Server** to open the tunnel

### Available Tools (29)

| Category | Tools |
|----------|-------|
| Gmail | `gmail_search`, `gmail_read`, `gmail_send`, `gmail_draft`, `gmail_list_labels` |
| Calendar | `calendar_list_events`, `calendar_create_event`, `calendar_update_event`, `calendar_delete_event`, `calendar_search_events` |
| Docs | `docs_create`, `docs_read`, `docs_update`, `docs_search` |
| Sheets | `sheets_create`, `sheets_read`, `sheets_update`, `sheets_search` |
| Drive | `drive_list`, `drive_search`, `drive_upload`, `drive_download` |
| Google Home | `home_send_command`, `home_turn_on`, `home_turn_off`, `home_set_brightness`, `home_set_color`, `home_set_thermostat`, `home_query` |

**Google Home example commands:**
- "turn on the bedroom lights"
- "set the kitchen lights to 40%"
- "turn off all lights"
- "set the thermostat to 70 degrees"
- "is the living room light on?"

---

## Connecting to Ditto

After launching, go to the dashboard (http://localhost:3100):

1. Copy the **ngrok URL** (e.g. `https://xxxx.ngrok-free.app`)
2. Copy the **Bearer Token** from the Connection card

Then in the Ditto App — **Settings → MCP Servers → Add Server**:

| Field | Value |
|-------|-------|
| Name | `Google` |
| URL | `https://xxxx.ngrok-free.app/api/mcp` |
| Auth | Bearer → paste the token |

Save, enable, and confirm tools load.

---

## Keeping It Running

The server must be running locally for Ditto to use its tools. Run `pnpm dev` again after a reboot. All credentials are saved in `~/.ditto-mcp-servers/google-workspace/` so setup only needs to be done once. A reserved ngrok domain keeps the URL stable across restarts.

---

## Project Structure

```
ditto-mcp-servers/
├── .npmrc                    # pnpm hoist config for @ngrok/* and @grpc/* native modules
├── packages/
│   ├── config/               # Config persistence (~/.ditto-mcp-servers/)
│   └── tunnel/               # ngrok tunnel management
└── servers/
    └── google-workspace/     # Google MCP server (port 3100)
        ├── proto/            # Google Assistant Embedded gRPC proto
        ├── src/app/api/      # MCP SSE, config, status, OAuth routes
        ├── src/mcp/          # MCP server + 29 tool definitions
        ├── src/google/       # Google API clients + Assistant gRPC client
        └── src/components/   # Setup wizard + dashboard UI
```

Credentials stored at:
```
~/.ditto-mcp-servers/google-workspace/
├── config.json    # OAuth creds, ngrok token, service toggles
├── tokens.json    # Google OAuth refresh token
├── state.json     # Active tunnel URL
└── auth.json      # Bearer token for Ditto
```

---

## Development

```bash
pnpm install    # Install all dependencies
pnpm dev        # Start server on :3100
pnpm build      # Build all packages
pnpm lint       # Lint with Biome
pnpm format     # Format with Biome
```

## Contributing

Contributions welcome! Open a PR with your new server or improvements.

## License

MIT
