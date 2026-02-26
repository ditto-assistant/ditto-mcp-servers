import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Auth } from "googleapis";
import { GmailService } from "@/google/gmail";
import { CalendarService } from "@/google/calendar";
import { DocsService } from "@/google/docs";
import { SheetsService } from "@/google/sheets";
import { DriveService } from "@/google/drive";
import { registerGmailTools } from "@/mcp/tools/gmail";
import { registerCalendarTools } from "@/mcp/tools/calendar";
import { registerDocsTools } from "@/mcp/tools/docs";
import { registerSheetsTools } from "@/mcp/tools/sheets";
import { registerDriveTools } from "@/mcp/tools/drive";

/**
 * Create and configure the MCP server with all Google Workspace tools.
 *
 * The `googleAuth` parameter is an authenticated OAuth2 client that will be
 * used to initialise each Google service. Service instances are created lazily
 * on first tool invocation so that the server can be built before any API call
 * is made.
 */
export function createMCPServer(googleAuth: Auth.OAuth2Client): McpServer {
	const server = new McpServer({
		name: "ditto-google-workspace",
		version: "1.0.0",
	});

	// Lazy-initialised service singletons — created on first tool call.
	let gmailService: GmailService | null = null;
	let calendarService: CalendarService | null = null;
	let docsService: DocsService | null = null;
	let sheetsService: SheetsService | null = null;
	let driveService: DriveService | null = null;

	const getGmail = (): GmailService => {
		if (!gmailService) gmailService = new GmailService(googleAuth);
		return gmailService;
	};

	const getCalendar = (): CalendarService => {
		if (!calendarService) calendarService = new CalendarService(googleAuth);
		return calendarService;
	};

	const getDocs = (): DocsService => {
		if (!docsService) docsService = new DocsService(googleAuth);
		return docsService;
	};

	const getSheets = (): SheetsService => {
		if (!sheetsService) sheetsService = new SheetsService(googleAuth);
		return sheetsService;
	};

	const getDrive = (): DriveService => {
		if (!driveService) driveService = new DriveService(googleAuth);
		return driveService;
	};

	// Register all 22 tools across the 5 Google Workspace services
	registerGmailTools(server, getGmail);
	registerCalendarTools(server, getCalendar);
	registerDocsTools(server, getDocs);
	registerSheetsTools(server, getSheets);
	registerDriveTools(server, getDrive);

	return server;
}
