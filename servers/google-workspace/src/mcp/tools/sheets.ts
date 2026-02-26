import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SheetsService } from "@/google/sheets";

export function registerSheetsTools(
	server: McpServer,
	getService: () => SheetsService,
): void {
	server.tool(
		"sheets_create",
		"Create a new Google Spreadsheet with optional named sheets",
		{
			title: z.string().describe("Spreadsheet title"),
			sheetNames: z
				.array(z.string())
				.optional()
				.describe("Optional list of sheet tab names to create"),
		},
		async ({ title, sheetNames }) => {
			try {
				const spreadsheet = await getService().create(title, sheetNames);
				return {
					content: [
						{
							type: "text" as const,
							text: JSON.stringify(
								{
									success: true,
									spreadsheetId: spreadsheet.spreadsheetId,
									title: spreadsheet.title,
									sheets: spreadsheet.sheets,
									url: spreadsheet.spreadsheetUrl,
								},
								null,
								2,
							),
						},
					],
				};
			} catch (error) {
				return {
					content: [
						{
							type: "text" as const,
							text: `Error creating spreadsheet: ${error instanceof Error ? error.message : String(error)}`,
						},
					],
					isError: true,
				};
			}
		},
	);

	server.tool(
		"sheets_read",
		"Read data from a range in a Google Spreadsheet",
		{
			spreadsheetId: z.string().describe("The spreadsheet ID"),
			range: z
				.string()
				.describe("A1 notation range (e.g. 'Sheet1!A1:D10')"),
		},
		async ({ spreadsheetId, range }) => {
			try {
				const data = await getService().read(spreadsheetId, range);
				return {
					content: [
						{
							type: "text" as const,
							text: JSON.stringify(data, null, 2),
						},
					],
				};
			} catch (error) {
				return {
					content: [
						{
							type: "text" as const,
							text: `Error reading spreadsheet: ${error instanceof Error ? error.message : String(error)}`,
						},
					],
					isError: true,
				};
			}
		},
	);

	server.tool(
		"sheets_update",
		"Update cells in a Google Spreadsheet with new values",
		{
			spreadsheetId: z.string().describe("The spreadsheet ID"),
			range: z
				.string()
				.describe("A1 notation range to update (e.g. 'Sheet1!A1:D10')"),
			values: z
				.array(z.array(z.string()))
				.describe("2D array of cell values (rows x columns)"),
		},
		async ({ spreadsheetId, range, values }) => {
			try {
				const data = await getService().update(spreadsheetId, range, values);
				return {
					content: [
						{
							type: "text" as const,
							text: JSON.stringify(
								{
									success: true,
									updatedRange: data.range,
									rowsUpdated: values.length,
								},
								null,
								2,
							),
						},
					],
				};
			} catch (error) {
				return {
					content: [
						{
							type: "text" as const,
							text: `Error updating spreadsheet: ${error instanceof Error ? error.message : String(error)}`,
						},
					],
					isError: true,
				};
			}
		},
	);

	server.tool(
		"sheets_search",
		"Search for Google Spreadsheets by content or title",
		{
			query: z.string().describe("Search query for spreadsheets"),
			maxResults: z
				.number()
				.optional()
				.default(10)
				.describe("Maximum number of results to return"),
		},
		async ({ query, maxResults }) => {
			try {
				const results = await getService().search(query, maxResults);
				return {
					content: [
						{
							type: "text" as const,
							text: JSON.stringify(results, null, 2),
						},
					],
				};
			} catch (error) {
				return {
					content: [
						{
							type: "text" as const,
							text: `Error searching spreadsheets: ${error instanceof Error ? error.message : String(error)}`,
						},
					],
					isError: true,
				};
			}
		},
	);
}
