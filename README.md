# Ditto MCP Servers

Open-source [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) servers for [Ditto Assistant](https://heyditto.ai). Each server runs as a **local home server** — a Next.js app on your machine with a setup GUI, ngrok tunnel for connectivity, and bearer-token auth so only Ditto can call it.

## Supported Servers

| Server | Services | Status |
|--------|----------|--------|
| **Google Workspace** | Gmail, Calendar, Docs, Sheets, Drive | ✅ Available |

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

### 2. Start the server

```bash
pnpm dev
```

Open **http://localhost:3100** — the setup wizard will guide you through the rest.

---

## Setup Wizard

### Step 1 — Google OAuth Credentials

You need a Google Cloud OAuth client to let the server call Gmail, Calendar, Docs, Sheets, and Drive on your behalf.

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → create or select a project
2. Enable these APIs (**APIs & Services → Library**):
   - Gmail API
   - Google Calendar API
   - Google Docs API
   - Google Sheets API
   - Google Drive API
3. Go to **APIs & Services → OAuth consent screen**
   - User type: External
   - Add your Google email as a **test user**
4. Go to **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**
   - Application type: **Web application**
   - Authorized redirect URI: `http://localhost:3100/api/google/callback`
5. Copy the **Client ID** and **Client Secret** into the wizard

### Step 2 — Sign in with Google

Click **Sign in with Google** to authorize the server to access your Google Workspace.

### Step 3 — ngrok Token

Paste your ngrok auth token. This creates a public HTTPS tunnel so Ditto's backend can reach your local server.

Optionally enter a **reserved domain** (e.g. `my-ditto.ngrok-free.app`) for a stable URL that survives restarts. You can reserve one for free at [dashboard.ngrok.com/domains](https://dashboard.ngrok.com/domains).

### Step 4 — Choose Services

Toggle on/off Gmail, Calendar, Docs, Sheets, and Drive.

### Step 5 — Launch

Click **Start Server** to open the ngrok tunnel. You'll see the live tunnel URL.

---

## Connecting to Ditto

After launching, go to the **Dashboard** (http://localhost:3100):

1. Click **Restart Tunnel** if the connection shows as Disconnected
2. Copy the **ngrok URL** (e.g. `https://xxxx.ngrok-free.app`)
3. Click the **copy icon** next to "Bearer token for Ditto" to copy your auth token

Then in the Ditto App:

1. **Settings → MCP Servers → Add Server**
2. Fill in:
   | Field | Value |
   |-------|-------|
   | Name | `Google Workspace` (or anything) |
   | URL | `https://xxxx.ngrok-free.app/api/mcp` |
   | Auth | Bearer → paste the token |
3. Save and **enable** the server
4. Expand the server row to confirm tools load successfully

Ditto now has access to 22 Google Workspace tools.

---

## Available Tools (22)

### Gmail (5)
| Tool | Description |
|------|-------------|
| `gmail_search` | Search emails with Gmail query syntax |
| `gmail_read` | Read a specific email by ID |
| `gmail_send` | Compose and send an email |
| `gmail_draft` | Create a draft email |
| `gmail_list_labels` | List all Gmail labels |

### Calendar (5)
| Tool | Description |
|------|-------------|
| `calendar_list_events` | List upcoming events |
| `calendar_create_event` | Create a new event |
| `calendar_update_event` | Update an existing event |
| `calendar_delete_event` | Delete an event |
| `calendar_search_events` | Search events by keyword |

### Docs (4)
| Tool | Description |
|------|-------------|
| `docs_create` | Create a new Google Doc |
| `docs_read` | Read document content |
| `docs_update` | Update document content |
| `docs_search` | Search for documents |

### Sheets (4)
| Tool | Description |
|------|-------------|
| `sheets_create` | Create a new spreadsheet |
| `sheets_read` | Read spreadsheet data |
| `sheets_update` | Update spreadsheet cells |
| `sheets_search` | Search for spreadsheets |

### Drive (4)
| Tool | Description |
|------|-------------|
| `drive_list` | List files in a folder |
| `drive_search` | Search files |
| `drive_upload` | Upload a file |
| `drive_download` | Download a file |

---

## Keeping It Running

The server must be running on your machine for Ditto to use your Google Workspace tools.

**Restart after reboot:** Run `pnpm dev` again from the project directory. The ngrok tunnel will reconnect automatically (click "Restart Tunnel" in the dashboard if needed). All credentials are saved in `~/.ditto-mcp-servers/google-workspace/` so you won't need to redo setup.

**Reserved domain (optional):** If you reserved a free ngrok domain, the tunnel URL stays the same across restarts — you only need to register the MCP server in Ditto once.

---

## Project Structure

```
ditto-mcp-servers/
├── .npmrc                    # pnpm hoist config for native modules
├── packages/
│   ├── config/               # Config persistence (~/.ditto-mcp-servers/)
│   ├── tunnel/               # ngrok tunnel management
│   └── ditto-client/         # Ditto backend API client
└── servers/
    └── google-workspace/     # Google Workspace MCP server (port 3100)
        ├── src/app/          # Next.js pages + API routes
        │   ├── api/mcp/      # MCP SSE endpoint (bearer-token protected)
        │   ├── api/status/   # Status + tunnel start/stop
        │   └── api/config/   # Config read/write
        ├── src/mcp/          # MCP server + 22 tool definitions
        ├── src/google/       # Google API wrappers
        └── src/components/   # Setup wizard + dashboard UI
```

Config and credentials are stored locally at:
```
~/.ditto-mcp-servers/
└── google-workspace/
    ├── config.json    # OAuth client ID/secret, ngrok token, service toggles
    ├── tokens.json    # Google OAuth tokens (refresh token)
    ├── state.json     # Active tunnel URL
    └── auth.json      # Bearer token for Ditto auth
```

---

## Development

```bash
pnpm install     # Install all dependencies
pnpm dev         # Start Google Workspace server on :3100
pnpm build       # Build all packages
pnpm lint        # Lint with Biome
pnpm format      # Format with Biome
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
