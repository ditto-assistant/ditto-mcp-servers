# Ditto MCP Servers

Open-source [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) servers for [Ditto Assistant](https://heyditto.ai). Each server runs as a local **home server** with a setup GUI, ngrok tunneling, and seamless Ditto integration.

## Supported Servers

| Server | Services | Status |
|--------|----------|--------|
| **Google Workspace** | Gmail, Calendar, Docs, Sheets, Drive | **Available** |

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
     │  Ditto Backend   │◄──►│  Google APIs    │
     │  api.heyditto.ai │     └────────────────┘
     └──────────────────┘
```

## Quick Start

### Prerequisites

- **Node.js** 20+
- **pnpm** (`npm install -g pnpm`)
- **ngrok account** — [sign up free](https://dashboard.ngrok.com/signup)
- **Google Cloud project** with OAuth credentials
- **Ditto account** — [heyditto.ai](https://heyditto.ai)

### Setup

```bash
# Clone the repo
git clone https://github.com/ditto-assistant/ditto-mcp-servers.git
cd ditto-mcp-servers

# Install dependencies
pnpm install

# Start the Google Workspace server
pnpm dev
```

Open **http://localhost:3100** and follow the setup wizard:

1. **Ditto API Key** — Get yours from Ditto App → Settings → MCP Keys
2. **Google OAuth** — Enter your Google Cloud OAuth client ID + secret
3. **Google Sign-in** — Authenticate with your Google account
4. **ngrok Token** — Paste your ngrok auth token
5. **Services** — Choose which Google services to enable
6. **Launch** — Start the server and copy the ngrok URL

Then register the ngrok URL in Ditto App → Settings → MCP Servers → Add Server (SSE transport).

## Google Cloud Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable these APIs:
   - Gmail API
   - Google Calendar API
   - Google Docs API
   - Google Sheets API
   - Google Drive API
4. Go to **APIs & Services → Credentials**
5. Create an **OAuth consent screen** (External, add your email as test user)
6. Create **OAuth 2.0 Client ID** (Web application)
7. Add redirect URI: `http://localhost:3100/api/google/callback`
8. Copy the **Client ID** and **Client Secret**

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

## Project Structure

```
ditto-mcp-servers/
├── packages/
│   ├── config/          # Config persistence (~/.ditto-mcp-servers/)
│   ├── tunnel/          # ngrok tunnel management
│   └── ditto-client/    # Ditto backend API client
├── servers/
│   └── google-workspace/  # Google Workspace MCP server
│       ├── src/app/       # Next.js pages + API routes
│       ├── src/mcp/       # MCP server + 22 tools
│       ├── src/google/    # Google API wrappers
│       └── src/components/ # Setup wizard + dashboard UI
└── README.md
```

## Development

```bash
pnpm install        # Install dependencies
pnpm dev            # Start dev server on :3100
pnpm build          # Build all packages
pnpm lint           # Lint with Biome
pnpm test           # Run tests
```

## Contributing

Contributions welcome! To add a new MCP server:

1. Create a new directory under `servers/`
2. Build with Next.js + the shared packages
3. Expose MCP tools at `/api/mcp`
4. Include a setup wizard GUI

## License

MIT
