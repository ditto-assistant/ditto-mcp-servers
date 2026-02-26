export {
	GOOGLE_SCOPES,
	getOAuth2Client,
	generateAuthUrl,
	exchangeCode,
	loadTokens,
	saveTokens,
	loadConfig,
	getAuthenticatedClient,
	getScopesForServices,
} from "./auth";

export { GmailService } from "./gmail";
export type {
	EmailMessage,
	SendEmailParams,
	DraftParams,
} from "./gmail";

export { CalendarService } from "./calendar";
export type {
	CalendarEvent,
	CreateEventParams,
	UpdateEventParams,
} from "./calendar";

export { DocsService } from "./docs";
export type { DocInfo, DocSearchResult } from "./docs";

export { SheetsService } from "./sheets";
export type {
	SpreadsheetInfo,
	SheetData,
	SheetSearchResult,
} from "./sheets";

export { DriveService } from "./drive";
export type { DriveFile, DriveFileContent } from "./drive";
