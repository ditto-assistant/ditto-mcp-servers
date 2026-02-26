import { NextRequest } from "next/server";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { createMCPServer } from "@/mcp/server";
import { getAuthenticatedClient } from "@/google/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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

	// Create the MCP server with the authenticated Google client
	const mcpServer = createMCPServer(auth);

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

	// Build a minimal request shim that SSEServerTransport.handlePostMessage expects
	const body = await req.text();

	const reqShim = {
		body: JSON.parse(body),
		headers: Object.fromEntries(req.headers.entries()),
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

	await transport.handlePostMessage(reqShim as never, resShim as never);

	return new Response(resShim._body ?? null, {
		status: resShim.statusCode,
		headers: { "Content-Type": "application/json" },
	});
}
