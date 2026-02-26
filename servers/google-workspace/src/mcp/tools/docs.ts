import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { DocsService } from "@/google/docs";

export function registerDocsTools(
	server: McpServer,
	getService: () => DocsService,
): void {
	server.tool(
		"docs_create",
		"Create a new Google Doc with an optional initial content",
		{
			title: z.string().describe("Document title"),
			content: z.string().optional().describe("Initial document content (plain text)"),
		},
		async ({ title, content }) => {
			try {
				const doc = await getService().create(title, content);
				return {
					content: [
						{
							type: "text" as const,
							text: JSON.stringify(
								{
									success: true,
									documentId: doc.documentId,
									title: doc.title,
									url: `https://docs.google.com/document/d/${doc.documentId}/edit`,
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
							text: `Error creating document: ${error instanceof Error ? error.message : String(error)}`,
						},
					],
					isError: true,
				};
			}
		},
	);

	server.tool(
		"docs_read",
		"Read the content of a Google Doc by its document ID",
		{
			documentId: z.string().describe("The Google Doc document ID"),
		},
		async ({ documentId }) => {
			try {
				const doc = await getService().read(documentId);
				return {
					content: [
						{
							type: "text" as const,
							text: JSON.stringify(doc, null, 2),
						},
					],
				};
			} catch (error) {
				return {
					content: [
						{
							type: "text" as const,
							text: `Error reading document: ${error instanceof Error ? error.message : String(error)}`,
						},
					],
					isError: true,
				};
			}
		},
	);

	server.tool(
		"docs_update",
		"Replace the content of an existing Google Doc",
		{
			documentId: z.string().describe("The Google Doc document ID"),
			content: z.string().describe("New document content (replaces existing content)"),
		},
		async ({ documentId, content }) => {
			try {
				const doc = await getService().update(documentId, content);
				return {
					content: [
						{
							type: "text" as const,
							text: JSON.stringify(
								{
									success: true,
									documentId: doc.documentId,
									title: doc.title,
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
							text: `Error updating document: ${error instanceof Error ? error.message : String(error)}`,
						},
					],
					isError: true,
				};
			}
		},
	);

	server.tool(
		"docs_search",
		"Search for Google Docs by content or title",
		{
			query: z.string().describe("Search query for documents"),
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
							text: `Error searching documents: ${error instanceof Error ? error.message : String(error)}`,
						},
					],
					isError: true,
				};
			}
		},
	);
}
