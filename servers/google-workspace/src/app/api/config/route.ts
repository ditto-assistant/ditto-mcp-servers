import { NextResponse } from "next/server";
import {
	createConfigStore,
	type GoogleWorkspaceConfig,
} from "@ditto-mcp/config";

const CONFIG_FILE = "config.json";
const store = createConfigStore("google-workspace");

const DEFAULT_CONFIG: GoogleWorkspaceConfig = {
	google: {
		clientId: "",
		clientSecret: "",
	},
	ngrok: {
		authtoken: "",
	},
	services: {
		gmail: true,
		calendar: true,
		docs: true,
		sheets: true,
		drive: true,
		home: true,
	},
	server: {
		port: 3100,
	},
};

export async function GET() {
	try {
		const config = await store.load<GoogleWorkspaceConfig>(CONFIG_FILE);
		if (!config) {
			return NextResponse.json(null, { status: 404 });
		}
		return NextResponse.json(config);
	} catch (err) {
		return NextResponse.json(
			{ error: err instanceof Error ? err.message : "Failed to load config" },
			{ status: 500 },
		);
	}
}

export async function POST(request: Request) {
	try {
		const patch = await request.json();
		const existing =
			(await store.load<GoogleWorkspaceConfig>(CONFIG_FILE)) ??
			DEFAULT_CONFIG;

		const merged: GoogleWorkspaceConfig = {
			google: { ...existing.google, ...patch.google },
			ngrok: { ...existing.ngrok, ...patch.ngrok },
			services: { ...existing.services, ...patch.services },
			server: { ...existing.server, ...patch.server },
		};

		await store.save(CONFIG_FILE, merged);
		return NextResponse.json({ ok: true });
	} catch (err) {
		return NextResponse.json(
			{ error: err instanceof Error ? err.message : "Failed to save config" },
			{ status: 500 },
		);
	}
}
