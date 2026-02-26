# Ditto MCP Servers

Open-source MCP (Model Context Protocol) servers for [Ditto Assistant](https://heyditto.ai). Each server runs as a local "home server" with a web GUI for setup, ngrok tunneling for connectivity, and seamless integration with Ditto's backend.

## Commands

```bash
pnpm install           # Install all dependencies
pnpm dev               # Start google-workspace dev server (localhost:3100)
pnpm build             # Build all packages and servers
pnpm lint              # Lint all packages
pnpm test              # Run all tests
pnpm format            # Format with Biome
```

## Architecture

- **Monorepo**: pnpm workspaces + turborepo
- **Servers** (`servers/`): Each server is a Next.js app with MCP SSE endpoint + setup GUI
- **Packages** (`packages/`): Shared utilities reused across servers
  - `@ditto-mcp/config` — Config persistence to `~/.ditto-mcp-servers/`
  - `@ditto-mcp/tunnel` — ngrok tunnel management
  - `@ditto-mcp/ditto-client` — Ditto backend API client

## Code Style

- TypeScript strict mode everywhere
- Biome for formatting and linting (tabs, double quotes, semicolons)
- Zod for all runtime validation
- shadcn/ui + Tailwind CSS for UI components
- Next.js App Router with server components by default

## Adding a New MCP Server

1. Create a new directory under `servers/`
2. Scaffold a Next.js app
3. Implement MCP tools in `src/mcp/tools/`
4. Expose SSE endpoint at `/api/mcp`
5. Build a setup wizard + dashboard GUI
6. Reuse shared packages for config, tunnel, and Ditto integration
