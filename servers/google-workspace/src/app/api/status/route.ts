import { NextResponse } from "next/server";
import {
	createConfigStore,
	type GoogleWorkspaceConfig,
	type GoogleTokens,
	type ServerState,
} from "@ditto-mcp/config";

const store = createConfigStore("google-workspace");

/** Timestamp when the server process started. */
const startedAt = Date.now();

export async function GET() {
	try {
		const config = await store.load<GoogleWorkspaceConfig>("config.json");
		const tokens = await store.load<GoogleTokens>("tokens.json");
		const state = await store.load<ServerState>("state.json");

		const uptime = Date.now() - startedAt;

		return NextResponse.json({
			connected: !!state?.ngrokUrl,
			tunnelUrl: state?.ngrokUrl ?? "",
			uptime,
			services: config?.services ?? {
				gmail: true,
				calendar: true,
				docs: true,
				sheets: true,
				drive: true,
			},
			google: {
				authenticated: !!tokens?.refresh_token,
				email: "", // Will be populated once profile fetch is wired up
				expiryDate: tokens?.expiry_date ?? 0,
			},
			recentActivity: [], // Will be populated with real activity data later
		});
	} catch (err) {
		return NextResponse.json(
			{
				error:
					err instanceof Error
						? err.message
						: "Failed to get status",
			},
			{ status: 500 },
		);
	}
}

export async function POST() {
	try {
		// This endpoint is used to start/restart the tunnel.
		// In a full implementation, this would call the tunnel manager.
		// For now, return the current state or a placeholder.
		const state = await store.load<ServerState>("state.json");

		return NextResponse.json({
			ok: true,
			tunnelUrl: state?.ngrokUrl ?? "",
			ngrokUrl: state?.ngrokUrl ?? "",
		});
	} catch (err) {
		return NextResponse.json(
			{
				error:
					err instanceof Error
						? err.message
						: "Failed to start server",
			},
			{ status: 500 },
		);
	}
}
