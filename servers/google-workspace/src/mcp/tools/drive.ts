import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { DriveService } from "@/google/drive";

export function registerDriveTools(
	server: McpServer,
	getService: () => DriveService,
): void {
	server.tool(
		"drive_list",
		"List files in Google Drive, optionally filtered by folder or MIME type",
		{
			folderId: z
				.string()
				.optional()
				.describe("Folder ID to list files from (omit for root)"),
			maxResults: z
				.number()
				.optional()
				.default(10)
				.describe("Maximum number of files to return"),
			mimeType: z
				.string()
				.optional()
				.describe("Filter by MIME type (e.g. 'application/pdf')"),
		},
		async ({ folderId, maxResults, mimeType }) => {
			try {
				const files = await getService().list(folderId, maxResults, mimeType);
				return {
					content: [
						{
							type: "text" as const,
							text: JSON.stringify(files, null, 2),
						},
					],
				};
			} catch (error) {
				return {
					content: [
						{
							type: "text" as const,
							text: `Error listing files: ${error instanceof Error ? error.message : String(error)}`,
						},
					],
					isError: true,
				};
			}
		},
	);

	server.tool(
		"drive_search",
		"Search for files in Google Drive by name or content",
		{
			query: z.string().describe("Search query for files"),
			maxResults: z
				.number()
				.optional()
				.default(10)
				.describe("Maximum number of files to return"),
		},
		async ({ query, maxResults }) => {
			try {
				const files = await getService().search(query, maxResults);
				return {
					content: [
						{
							type: "text" as const,
							text: JSON.stringify(files, null, 2),
						},
					],
				};
			} catch (error) {
				return {
					content: [
						{
							type: "text" as const,
							text: `Error searching files: ${error instanceof Error ? error.message : String(error)}`,
						},
					],
					isError: true,
				};
			}
		},
	);

	server.tool(
		"drive_upload",
		"Upload a file to Google Drive",
		{
			name: z.string().describe("File name"),
			content: z.string().describe("File content (text)"),
			mimeType: z
				.string()
				.optional()
				.describe("MIME type of the file (default: text/plain)"),
			folderId: z
				.string()
				.optional()
				.describe("Parent folder ID to upload into"),
		},
		async ({ name, content, mimeType, folderId }) => {
			try {
				const file = await getService().upload(name, content, mimeType, folderId);
				return {
					content: [
						{
							type: "text" as const,
							text: JSON.stringify(
								{
									success: true,
									fileId: file.id,
									name: file.name,
									mimeType: file.mimeType,
									webViewLink: file.webViewLink,
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
							text: `Error uploading file: ${error instanceof Error ? error.message : String(error)}`,
						},
					],
					isError: true,
				};
			}
		},
	);

	server.tool(
		"drive_download",
		"Download a file from Google Drive and return its content",
		{
			fileId: z.string().describe("The file ID to download"),
		},
		async ({ fileId }) => {
			try {
				const file = await getService().download(fileId);
				return {
					content: [
						{
							type: "text" as const,
							text: JSON.stringify(
								{
									id: file.id,
									name: file.name,
									mimeType: file.mimeType,
									content: file.content,
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
							text: `Error downloading file: ${error instanceof Error ? error.message : String(error)}`,
						},
					],
					isError: true,
				};
			}
		},
	);
}
