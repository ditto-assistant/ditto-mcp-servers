import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Auth } from "googleapis";
import type { GoogleWorkspaceConfig } from "@ditto-mcp/config";
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
import { registerHomeTools } from "@/mcp/tools/home";

/**
 * Create and configure the MCP server with all enabled tools.
 *
 * Covers Google Workspace (Gmail, Calendar, Docs, Sheets, Drive) and
 * Google Home (Assistant gRPC commands) in a single server.
 */
export function createMCPServer(
	googleAuth: Auth.OAuth2Client,
	services: GoogleWorkspaceConfig["services"],
	googleConfig?: GoogleWorkspaceConfig["google"],
): McpServer {
	const server = new McpServer({
		name: "ditto-google",
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

	if (services.gmail) registerGmailTools(server, getGmail);
	if (services.calendar) registerCalendarTools(server, getCalendar);
	if (services.docs) registerDocsTools(server, getDocs);
	if (services.sheets) registerSheetsTools(server, getSheets);
	if (services.drive) registerDriveTools(server, getDrive);
	if (services.home) registerHomeTools(server, () => googleAuth, googleConfig?.clientId);

	return server;
}
