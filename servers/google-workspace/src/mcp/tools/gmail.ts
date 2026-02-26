import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { GmailService } from "@/google/gmail";

export function registerGmailTools(
	server: McpServer,
	getService: () => GmailService,
): void {
	server.tool(
		"gmail_search",
		"Search emails in Gmail using a query string (same syntax as Gmail search bar)",
		{
			query: z.string().describe("Search query (e.g. 'from:alice subject:meeting')"),
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
							text: `Error searching emails: ${error instanceof Error ? error.message : String(error)}`,
						},
					],
					isError: true,
				};
			}
		},
	);

	server.tool(
		"gmail_read",
		"Read a specific email message by its ID",
		{
			messageId: z.string().describe("The Gmail message ID to read"),
		},
		async ({ messageId }) => {
			try {
				const message = await getService().read(messageId);
				return {
					content: [
						{
							type: "text" as const,
							text: JSON.stringify(message, null, 2),
						},
					],
				};
			} catch (error) {
				return {
					content: [
						{
							type: "text" as const,
							text: `Error reading email: ${error instanceof Error ? error.message : String(error)}`,
						},
					],
					isError: true,
				};
			}
		},
	);

	server.tool(
		"gmail_send",
		"Send an email through Gmail",
		{
			to: z.string().describe("Recipient email address"),
			subject: z.string().describe("Email subject"),
			body: z.string().describe("Email body (plain text or HTML)"),
			cc: z.string().optional().describe("CC email address"),
			bcc: z.string().optional().describe("BCC email address"),
		},
		async ({ to, subject, body, cc, bcc }) => {
			try {
				const result = await getService().send(to, subject, body, cc, bcc);
				return {
					content: [
						{
							type: "text" as const,
							text: JSON.stringify(
								{ success: true, messageId: result.id, threadId: result.threadId },
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
							text: `Error sending email: ${error instanceof Error ? error.message : String(error)}`,
						},
					],
					isError: true,
				};
			}
		},
	);

	server.tool(
		"gmail_draft",
		"Create a draft email in Gmail",
		{
			to: z.string().describe("Recipient email address"),
			subject: z.string().describe("Email subject"),
			body: z.string().describe("Email body (plain text or HTML)"),
		},
		async ({ to, subject, body }) => {
			try {
				const result = await getService().draft(to, subject, body);
				return {
					content: [
						{
							type: "text" as const,
							text: JSON.stringify(
								{
									success: true,
									draftId: result.id,
									messageId: result.messageId,
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
							text: `Error creating draft: ${error instanceof Error ? error.message : String(error)}`,
						},
					],
					isError: true,
				};
			}
		},
	);

	server.tool(
		"gmail_list_labels",
		"List all labels in the user's Gmail account",
		{},
		async () => {
			try {
				const labels = await getService().listLabels();
				return {
					content: [
						{
							type: "text" as const,
							text: JSON.stringify(labels, null, 2),
						},
					],
				};
			} catch (error) {
				return {
					content: [
						{
							type: "text" as const,
							text: `Error listing labels: ${error instanceof Error ? error.message : String(error)}`,
						},
					],
					isError: true,
				};
			}
		},
	);
}
