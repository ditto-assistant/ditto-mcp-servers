import { google } from "googleapis";
import type { Auth } from "googleapis";
import { Readable } from "node:stream";

export interface DriveFile {
	id: string;
	name: string;
	mimeType: string;
	size: string;
	modifiedTime: string;
	webViewLink: string;
	parents: string[];
}

export interface DriveFileContent {
	id: string;
	name: string;
	mimeType: string;
	content: string;
}

export class DriveService {
	private drive;

	constructor(auth: Auth.OAuth2Client) {
		this.drive = google.drive({ version: "v3", auth });
	}

	/**
	 * List files, optionally filtering by folder and/or MIME type.
	 */
	async list(
		folderId?: string,
		maxResults: number = 10,
		mimeType?: string,
	): Promise<DriveFile[]> {
		try {
			const queryParts: string[] = ["trashed = false"];

			if (folderId) {
				queryParts.push(`'${folderId}' in parents`);
			}

			if (mimeType) {
				queryParts.push(`mimeType = '${mimeType}'`);
			}

			const res = await this.drive.files.list({
				q: queryParts.join(" and "),
				pageSize: maxResults,
				fields:
					"files(id, name, mimeType, size, modifiedTime, webViewLink, parents)",
				orderBy: "modifiedTime desc",
			});

			return (res.data.files ?? []).map((f) => ({
				id: f.id ?? "",
				name: f.name ?? "",
				mimeType: f.mimeType ?? "",
				size: f.size ?? "0",
				modifiedTime: f.modifiedTime ?? "",
				webViewLink: f.webViewLink ?? "",
				parents: (f.parents as string[]) ?? [],
			}));
		} catch (error) {
			throw new Error(
				`Drive list failed: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	/**
	 * Search files by fullText contains query.
	 */
	async search(query: string, maxResults: number = 10): Promise<DriveFile[]> {
		try {
			const res = await this.drive.files.list({
				q: `fullText contains '${query.replace(/'/g, "\\'")}' and trashed = false`,
				pageSize: maxResults,
				fields:
					"files(id, name, mimeType, size, modifiedTime, webViewLink, parents)",
				orderBy: "modifiedTime desc",
			});

			return (res.data.files ?? []).map((f) => ({
				id: f.id ?? "",
				name: f.name ?? "",
				mimeType: f.mimeType ?? "",
				size: f.size ?? "0",
				modifiedTime: f.modifiedTime ?? "",
				webViewLink: f.webViewLink ?? "",
				parents: (f.parents as string[]) ?? [],
			}));
		} catch (error) {
			throw new Error(
				`Drive search failed: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	/**
	 * Upload a file to Drive from a string body.
	 */
	async upload(
		name: string,
		content: string,
		mimeType?: string,
		folderId?: string,
	): Promise<DriveFile> {
		try {
			const fileMetadata: Record<string, unknown> = { name };
			if (folderId) {
				fileMetadata.parents = [folderId];
			}

			const media = {
				mimeType: mimeType ?? "text/plain",
				body: Readable.from([content]),
			};

			const res = await this.drive.files.create({
				requestBody: fileMetadata,
				media,
				fields:
					"id, name, mimeType, size, modifiedTime, webViewLink, parents",
			});

			return {
				id: res.data.id ?? "",
				name: res.data.name ?? name,
				mimeType: res.data.mimeType ?? mimeType ?? "text/plain",
				size: res.data.size ?? "0",
				modifiedTime: res.data.modifiedTime ?? "",
				webViewLink: res.data.webViewLink ?? "",
				parents: (res.data.parents as string[]) ?? [],
			};
		} catch (error) {
			throw new Error(
				`Drive upload failed: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	/**
	 * Download a file's content as text.
	 * Handles Google Workspace files by exporting them in an appropriate format.
	 */
	async download(fileId: string): Promise<DriveFileContent> {
		try {
			// Get file metadata first
			const meta = await this.drive.files.get({
				fileId,
				fields: "id, name, mimeType",
			});

			const mimeType = meta.data.mimeType ?? "";
			let content: string;

			// Google Workspace files need to be exported
			if (mimeType.startsWith("application/vnd.google-apps.")) {
				let exportMimeType: string;
				switch (mimeType) {
					case "application/vnd.google-apps.document":
						exportMimeType = "text/plain";
						break;
					case "application/vnd.google-apps.spreadsheet":
						exportMimeType = "text/csv";
						break;
					case "application/vnd.google-apps.presentation":
						exportMimeType = "text/plain";
						break;
					default:
						exportMimeType = "text/plain";
				}

				const res = await this.drive.files.export({
					fileId,
					mimeType: exportMimeType,
				});
				content = String(res.data);
			} else {
				// Regular files: download directly
				const res = await this.drive.files.get(
					{ fileId, alt: "media" },
					{ responseType: "text" },
				);
				content = String(res.data);
			}

			return {
				id: meta.data.id ?? fileId,
				name: meta.data.name ?? "",
				mimeType,
				content,
			};
		} catch (error) {
			throw new Error(
				`Drive download failed: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}
}
