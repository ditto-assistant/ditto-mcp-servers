import { google } from "googleapis";
import type { Auth } from "googleapis";

export interface EmailMessage {
	id: string;
	threadId: string;
	snippet: string;
	subject: string;
	from: string;
	to: string;
	date: string;
	body: string;
	labelIds: string[];
}

export interface SendEmailParams {
	to: string;
	subject: string;
	body: string;
	cc?: string;
	bcc?: string;
}

export interface DraftParams {
	to: string;
	subject: string;
	body: string;
}

export class GmailService {
	private gmail;

	constructor(auth: Auth.OAuth2Client) {
		this.gmail = google.gmail({ version: "v1", auth });
	}

	/**
	 * Search for messages matching a Gmail query string.
	 */
	async search(
		query: string,
		maxResults: number = 10,
	): Promise<EmailMessage[]> {
		try {
			const res = await this.gmail.users.messages.list({
				userId: "me",
				q: query,
				maxResults,
			});

			const messageRefs = res.data.messages ?? [];
			if (messageRefs.length === 0) return [];

			const results: EmailMessage[] = [];
			for (const msg of messageRefs) {
				if (!msg.id) continue;
				const detail = await this.read(msg.id);
				if (detail) results.push(detail);
			}

			return results;
		} catch (error) {
			throw new Error(
				`Gmail search failed: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	/**
	 * Read a single message by ID, including decoded body.
	 */
	async read(messageId: string): Promise<EmailMessage> {
		try {
			const res = await this.gmail.users.messages.get({
				userId: "me",
				id: messageId,
				format: "full",
			});

			const headers = res.data.payload?.headers ?? [];
			const getHeader = (name: string) =>
				headers.find(
					(h) => h.name?.toLowerCase() === name.toLowerCase(),
				)?.value ?? "";

			const body = this.extractBody(res.data.payload);

			return {
				id: res.data.id ?? messageId,
				threadId: res.data.threadId ?? "",
				snippet: res.data.snippet ?? "",
				subject: getHeader("Subject"),
				from: getHeader("From"),
				to: getHeader("To"),
				date: getHeader("Date"),
				body,
				labelIds: res.data.labelIds ?? [],
			};
		} catch (error) {
			throw new Error(
				`Gmail read failed: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	/**
	 * Send an email message.
	 */
	async send(
		to: string,
		subject: string,
		body: string,
		cc?: string,
		bcc?: string,
	): Promise<{ id: string; threadId: string }> {
		try {
			const raw = this.buildRawMessage(to, subject, body, cc, bcc);

			const res = await this.gmail.users.messages.send({
				userId: "me",
				requestBody: { raw },
			});

			return {
				id: res.data.id ?? "",
				threadId: res.data.threadId ?? "",
			};
		} catch (error) {
			throw new Error(
				`Gmail send failed: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	/**
	 * Create a draft email.
	 */
	async draft(
		to: string,
		subject: string,
		body: string,
	): Promise<{ id: string; messageId: string }> {
		try {
			const raw = this.buildRawMessage(to, subject, body);

			const res = await this.gmail.users.drafts.create({
				userId: "me",
				requestBody: {
					message: { raw },
				},
			});

			return {
				id: res.data.id ?? "",
				messageId: res.data.message?.id ?? "",
			};
		} catch (error) {
			throw new Error(
				`Gmail draft creation failed: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	/**
	 * List all labels for the authenticated user.
	 */
	async listLabels(): Promise<
		Array<{ id: string; name: string; type: string }>
	> {
		try {
			const res = await this.gmail.users.labels.list({
				userId: "me",
			});

			return (res.data.labels ?? []).map((label) => ({
				id: label.id ?? "",
				name: label.name ?? "",
				type: label.type ?? "",
			}));
		} catch (error) {
			throw new Error(
				`Gmail list labels failed: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	/**
	 * Extract the text body from a Gmail message payload.
	 * Handles both simple and multipart messages, including nested parts.
	 */
	// biome-ignore lint/suspicious/noExplicitAny: Gmail API payload typing is deeply nested
	private extractBody(payload: any): string {
		if (!payload) return "";

		// Simple body with data directly on the payload
		if (payload.body?.data) {
			return Buffer.from(payload.body.data, "base64url").toString(
				"utf-8",
			);
		}

		// Multipart: search parts recursively
		if (payload.parts && Array.isArray(payload.parts)) {
			// Prefer text/plain
			const textPart = payload.parts.find(
				// biome-ignore lint/suspicious/noExplicitAny: Gmail part typing
				(p: any) => p.mimeType === "text/plain" && p.body?.data,
			);
			if (textPart) {
				return Buffer.from(textPart.body.data, "base64url").toString(
					"utf-8",
				);
			}

			// Fall back to text/html
			const htmlPart = payload.parts.find(
				// biome-ignore lint/suspicious/noExplicitAny: Gmail part typing
				(p: any) => p.mimeType === "text/html" && p.body?.data,
			);
			if (htmlPart) {
				return Buffer.from(htmlPart.body.data, "base64url").toString(
					"utf-8",
				);
			}

			// Recurse into nested multipart
			for (const part of payload.parts) {
				const nested = this.extractBody(part);
				if (nested) return nested;
			}
		}

		return "";
	}

	/**
	 * Build a base64url-encoded RFC 2822 message.
	 */
	private buildRawMessage(
		to: string,
		subject: string,
		body: string,
		cc?: string,
		bcc?: string,
	): string {
		const lines: string[] = [
			`To: ${to}`,
			`Subject: ${subject}`,
			"MIME-Version: 1.0",
			"Content-Type: text/html; charset=UTF-8",
		];

		if (cc) lines.push(`Cc: ${cc}`);
		if (bcc) lines.push(`Bcc: ${bcc}`);

		lines.push("", body);

		return Buffer.from(lines.join("\r\n")).toString("base64url");
	}
}
