import { NextRequest } from "next/server";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { createMCPServer } from "@/mcp/server";
import { getAuthenticatedClient } from "@/google/auth";
import { createConfigStore } from "@ditto-mcp/config";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const store = createConfigStore("google-home");

interface AuthConfig {
  bearerToken: string;
}

async function validateBearerToken(req: NextRequest): Promise<boolean> {
  const auth = await store.load<AuthConfig>("auth.json");
  if (!auth?.bearerToken) return true;
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  return token === auth.bearerToken;
}

const transports = new Map<string, SSEServerTransport>();

export async function GET(_req: NextRequest): Promise<Response> {
  if (!(await validateBearerToken(_req))) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const googleAuth = await getAuthenticatedClient();
  if (!googleAuth) {
    return new Response(
      JSON.stringify({
        error:
          "Google authentication not configured. Complete the setup wizard first.",
      }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }

  const mcpServer = createMCPServer(googleAuth);

  const encoder = new TextEncoder();
  let controller: ReadableStreamDefaultController<Uint8Array>;

  const readable = new ReadableStream<Uint8Array>({
    start(c) {
      controller = c;
    },
    cancel() {
      for (const [id, t] of transports.entries()) {
        if (t === transport) {
          transports.delete(id);
          break;
        }
      }
    },
  });

  const resShim = {
    writeHead(_status: number, _headers: Record<string, string>) {},
    write(data: string) {
      try {
        controller.enqueue(encoder.encode(data));
      } catch {
        // Stream closed
      }
      return true;
    },
    end() {
      try {
        controller.close();
      } catch {
        // Already closed
      }
    },
    on(_event: string, _handler: () => void) {},
  };

  const transport = new SSEServerTransport("/api/mcp", resShim as never);
  transports.set(transport.sessionId, transport);

  mcpServer.connect(transport).catch((err) => {
    console.error("[MCP] Connection error:", err);
    transports.delete(transport.sessionId);
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

export async function POST(req: NextRequest): Promise<Response> {
  if (!(await validateBearerToken(req))) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const sessionId = req.nextUrl.searchParams.get("sessionId");
  if (!sessionId) {
    return new Response(
      JSON.stringify({ error: "Missing sessionId query parameter" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const transport = transports.get(sessionId);
  if (!transport) {
    return new Response(
      JSON.stringify({ error: `No active session for ID: ${sessionId}` }),
      { status: 404, headers: { "Content-Type": "application/json" } },
    );
  }

  const body = await req.text();
  const parsedBody = JSON.parse(body);

  const reqShim = {
    headers: Object.fromEntries(req.headers.entries()),
    url: req.nextUrl.pathname + req.nextUrl.search,
    socket: { encrypted: req.url.startsWith("https") },
  };

  const resShim = {
    statusCode: 200,
    writeHead(status: number) {
      resShim.statusCode = status;
      return resShim;
    },
    end(data?: string) {
      resShim._body = data;
    },
    _body: undefined as string | undefined,
  };

  await transport.handlePostMessage(reqShim as never, resShim as never, parsedBody);

  return new Response(resShim._body ?? null, {
    status: resShim.statusCode,
    headers: { "Content-Type": "application/json" },
  });
}
