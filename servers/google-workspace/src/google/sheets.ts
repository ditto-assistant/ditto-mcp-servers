import { google } from "googleapis";
import type { Auth } from "googleapis";

export interface SpreadsheetInfo {
	spreadsheetId: string;
	title: string;
	sheets: Array<{ sheetId: number; title: string }>;
	spreadsheetUrl: string;
}

export interface SheetData {
	range: string;
	values: string[][];
}

export interface SheetSearchResult {
	id: string;
	name: string;
	mimeType: string;
	webViewLink: string;
	modifiedTime: string;
}

export class SheetsService {
	private sheets;
	private drive;

	constructor(auth: Auth.OAuth2Client) {
		this.sheets = google.sheets({ version: "v4", auth });
		this.drive = google.drive({ version: "v3", auth });
	}

	/**
	 * Create a new Google Spreadsheet with optional named sheets.
	 */
	async create(
		title: string,
		sheetNames?: string[],
	): Promise<SpreadsheetInfo> {
		try {
			const sheets =
				sheetNames && sheetNames.length > 0
					? sheetNames.map((name) => ({
							properties: { title: name },
						}))
					: undefined;

			const res = await this.sheets.spreadsheets.create({
				requestBody: {
					properties: { title },
					sheets,
				},
			});

			return {
				spreadsheetId: res.data.spreadsheetId ?? "",
				title: res.data.properties?.title ?? title,
				sheets: (res.data.sheets ?? []).map((s) => ({
					sheetId: s.properties?.sheetId ?? 0,
					title: s.properties?.title ?? "",
				})),
				spreadsheetUrl: res.data.spreadsheetUrl ?? "",
			};
		} catch (error) {
			throw new Error(
				`Sheets create failed: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	/**
	 * Read values from a range in a spreadsheet.
	 */
	async read(spreadsheetId: string, range: string): Promise<SheetData> {
		try {
			const res = await this.sheets.spreadsheets.values.get({
				spreadsheetId,
				range,
			});

			return {
				range: res.data.range ?? range,
				values: (res.data.values as string[][]) ?? [],
			};
		} catch (error) {
			throw new Error(
				`Sheets read failed: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	/**
	 * Update values in a range in a spreadsheet.
	 */
	async update(
		spreadsheetId: string,
		range: string,
		values: string[][],
	): Promise<SheetData> {
		try {
			const res = await this.sheets.spreadsheets.values.update({
				spreadsheetId,
				range,
				valueInputOption: "USER_ENTERED",
				requestBody: { values },
			});

			return {
				range: res.data.updatedRange ?? range,
				values,
			};
		} catch (error) {
			throw new Error(
				`Sheets update failed: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	/**
	 * Search for Google Sheets via Drive API with mimeType filter.
	 */
	async search(
		query: string,
		maxResults: number = 10,
	): Promise<SheetSearchResult[]> {
		try {
			const res = await this.drive.files.list({
				q: `mimeType='application/vnd.google-apps.spreadsheet' and fullText contains '${query.replace(/'/g, "\\'")}'`,
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
				`Sheets search failed: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}
}
