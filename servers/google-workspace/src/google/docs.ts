import { google } from "googleapis";
import type { Auth } from "googleapis";

export interface DocInfo {
	documentId: string;
	title: string;
	body: string;
	revisionId: string;
}

export interface DocSearchResult {
	id: string;
	name: string;
	mimeType: string;
	webViewLink: string;
	modifiedTime: string;
}

export class DocsService {
	private docs;
	private drive;

	constructor(auth: Auth.OAuth2Client) {
		this.docs = google.docs({ version: "v1", auth });
		this.drive = google.drive({ version: "v3", auth });
	}

	/**
	 * Create a new Google Doc, optionally inserting initial content.
	 */
	async create(title: string, content?: string): Promise<DocInfo> {
		try {
			const res = await this.docs.documents.create({
				requestBody: { title },
			});

			const documentId = res.data.documentId ?? "";

			if (content && documentId) {
				await this.docs.documents.batchUpdate({
					documentId,
					requestBody: {
						requests: [
							{
								insertText: {
									location: { index: 1 },
									text: content,
								},
							},
						],
					},
				});
			}

			return {
				documentId,
				title: res.data.title ?? title,
				body: content ?? "",
				revisionId: res.data.revisionId ?? "",
			};
		} catch (error) {
			throw new Error(
				`Docs create failed: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	/**
	 * Read a Google Doc and extract its text content from structural elements.
	 */
	async read(documentId: string): Promise<DocInfo> {
		try {
			const res = await this.docs.documents.get({ documentId });

			let body = "";
			const content = res.data.body?.content;
			if (content) {
				for (const element of content) {
					if (element.paragraph?.elements) {
						for (const elem of element.paragraph.elements) {
							if (elem.textRun?.content) {
								body += elem.textRun.content;
							}
						}
					}
					if (element.table) {
						for (const row of element.table.tableRows ?? []) {
							for (const cell of row.tableCells ?? []) {
								for (const cellContent of cell.content ?? []) {
									if (cellContent.paragraph?.elements) {
										for (const elem of cellContent
											.paragraph.elements) {
											if (elem.textRun?.content) {
												body += elem.textRun.content;
											}
										}
									}
								}
							}
						}
					}
				}
			}

			return {
				documentId: res.data.documentId ?? documentId,
				title: res.data.title ?? "",
				body,
				revisionId: res.data.revisionId ?? "",
			};
		} catch (error) {
			throw new Error(
				`Docs read failed: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	/**
	 * Replace all content in a Google Doc with new text.
	 * Deletes existing content then inserts new content.
	 */
	async update(documentId: string, content: string): Promise<DocInfo> {
		try {
			// Read the document to determine current end index
			const doc = await this.docs.documents.get({ documentId });

			const endIndex =
				doc.data.body?.content?.reduce((max, elem) => {
					return Math.max(max, elem.endIndex ?? 0);
				}, 0) ?? 1;

			const requests: Array<Record<string, unknown>> = [];

			// Delete existing content if there is any beyond the initial newline
			if (endIndex > 2) {
				requests.push({
					deleteContentRange: {
						range: {
							startIndex: 1,
							endIndex: endIndex - 1,
						},
					},
				});
			}

			// Insert new content
			requests.push({
				insertText: {
					location: { index: 1 },
					text: content,
				},
			});

			await this.docs.documents.batchUpdate({
				documentId,
				requestBody: { requests },
			});

			return {
				documentId,
				title: doc.data.title ?? "",
				body: content,
				revisionId: doc.data.revisionId ?? "",
			};
		} catch (error) {
			throw new Error(
				`Docs update failed: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	/**
	 * Search for Google Docs via Drive API with mimeType filter.
	 */
	async search(
		query: string,
		maxResults: number = 10,
	): Promise<DocSearchResult[]> {
		try {
			const res = await this.drive.files.list({
				q: `mimeType='application/vnd.google-apps.document' and fullText contains '${query.replace(/'/g, "\\'")}'`,
				pageSize: maxResults,
				fields:
					"files(id, name, mimeType, webViewLink, modifiedTime)",
				orderBy: "modifiedTime desc",
			});

			return (res.data.files ?? []).map((f) => ({
				id: f.id ?? "",
				name: f.name ?? "",
				mimeType: f.mimeType ?? "",
				webViewLink: f.webViewLink ?? "",
				modifiedTime: f.modifiedTime ?? "",
			}));
		} catch (error) {
			throw new Error(
				`Docs search failed: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}
}
