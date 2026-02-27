import { NextRequest } from "next/server";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { createMCPServer } from "@/mcp/server";
import { getAuthenticatedClient, loadConfig } from "@/google/auth";
import { createConfigStore } from "@ditto-mcp/config";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const store = createConfigStore("google-workspace");

interface AuthConfig {
	bearerToken: string;
}

async function validateBearerToken(req: NextRequest): Promise<boolean> {
	const auth = await store.load<AuthConfig>("auth.json");
	if (!auth?.bearerToken) return true; // No token configured yet — allow through
	const header = req.headers.get("authorization") ?? "";
	const token = header.startsWith("Bearer ") ? header.slice(7) : "";
	return token === auth.bearerToken;
}

/**
 * Active SSE transports keyed by session ID.
 * Each GET request creates a new transport; the matching POST sends messages.
 */
const transports = new Map<string, SSEServerTransport>();

/**
 * GET /api/mcp — Establish SSE stream.
 *
 * The MCP SDK's SSEServerTransport takes care of writing the SSE framing.
 * We create a ReadableStream that the transport writes into and return it as
 * the response body.
 */
export async function GET(_req: NextRequest): Promise<Response> {
	if (!(await validateBearerToken(_req))) {
		return new Response(JSON.stringify({ error: "Unauthorized" }), {
			status: 401,
			headers: { "Content-Type": "application/json" },
		});
	}

	// Authenticate with Google
	const auth = await getAuthenticatedClient();
	if (!auth) {
		return new Response(
			JSON.stringify({
				error: "Google authentication not configured. Complete the setup wizard first.",
			}),
			{ status: 401, headers: { "Content-Type": "application/json" } },
		);
	}

	// Create the MCP server with the authenticated Google client and enabled services
	const config = await loadConfig();
	const services = config?.services ?? {
		gmail: true,
		calendar: true,
		docs: true,
		sheets: true,
		drive: true,
		home: false,
	};
	const mcpServer = createMCPServer(auth, services, config?.google);

	// Build a transform stream that SSEServerTransport can write to.
	const encoder = new TextEncoder();
	let controller: ReadableStreamDefaultController<Uint8Array>;

	const readable = new ReadableStream<Uint8Array>({
		start(c) {
			controller = c;
		},
		cancel() {
			// Client disconnected — clean up
			for (const [id, t] of transports.entries()) {
				if (t === transport) {
					transports.delete(id);
					break;
				}
			}
		},
	});

	// SSEServerTransport needs a res-like object with write capabilities.
	// We create a shim that pipes into the ReadableStream controller.
	const resShim = {
		writeHead(_status: number, _headers: Record<string, string>) {
			// Headers are set on the Response object below; this is a no-op.
		},
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
		on(_event: string, _handler: () => void) {
			// close events handled via ReadableStream cancel
		},
	};

	// Create the SSE transport. The second arg is the endpoint that the
	// client will POST messages to.
	const transport = new SSEServerTransport("/api/mcp", resShim as never);

	// Store by session ID so POST can find it
	transports.set(transport.sessionId, transport);

	// Connect the MCP server to this transport (async, fires off)
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

/**
 * POST /api/mcp — Receive JSON-RPC messages for an active session.
 *
 * The session ID is passed as a query parameter by the MCP client SDK.
 */
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

	// Minimal request shim — pass parsedBody as 3rd arg to bypass getRawBody()
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

	await transport.handlePostMessage(
		reqShim as never,
		resShim as never,
		parsedBody,
	);

	return new Response(resShim._body ?? null, {
		status: resShim.statusCode,
		headers: { "Content-Type": "application/json" },
	});
}
