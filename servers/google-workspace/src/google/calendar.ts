import { google } from "googleapis";
import type { Auth } from "googleapis";

export interface CalendarEvent {
	id: string;
	summary: string;
	description: string;
	location: string;
	start: string;
	end: string;
	status: string;
	htmlLink: string;
	organizer: string;
	attendees: Array<{ email: string; responseStatus: string }>;
}

export interface CreateEventParams {
	summary: string;
	start: string;
	end: string;
	description?: string;
	location?: string;
}

export interface UpdateEventParams {
	summary?: string;
	start?: string;
	end?: string;
	description?: string;
	location?: string;
}

// biome-ignore lint/suspicious/noExplicitAny: Calendar API event typing is complex
function parseEvent(event: any): CalendarEvent {
	return {
		id: event.id ?? "",
		summary: event.summary ?? "",
		description: event.description ?? "",
		location: event.location ?? "",
		start: event.start?.dateTime ?? event.start?.date ?? "",
		end: event.end?.dateTime ?? event.end?.date ?? "",
		status: event.status ?? "",
		htmlLink: event.htmlLink ?? "",
		organizer: event.organizer?.email ?? "",
		attendees: (event.attendees ?? []).map(
			(a: { email?: string; responseStatus?: string }) => ({
				email: a.email ?? "",
				responseStatus: a.responseStatus ?? "",
			}),
		),
	};
}

export class CalendarService {
	private calendar;

	constructor(auth: Auth.OAuth2Client) {
		this.calendar = google.calendar({ version: "v3", auth });
	}

	/**
	 * List events in a time range from a calendar.
	 */
	async listEvents(
		calendarId: string = "primary",
		timeMin?: string,
		timeMax?: string,
		maxResults: number = 10,
	): Promise<CalendarEvent[]> {
		try {
			const effectiveTimeMin =
				timeMin ?? (!timeMax ? new Date().toISOString() : undefined);

			const res = await this.calendar.events.list({
				calendarId,
				maxResults,
				singleEvents: true,
				orderBy: "startTime",
				timeMin: effectiveTimeMin,
				timeMax: timeMax ?? undefined,
			});

			return (res.data.items ?? []).map((e) => parseEvent(e));
		} catch (error) {
			throw new Error(
				`Calendar listEvents failed: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	/**
	 * Create a new event on a calendar.
	 */
	async createEvent(
		calendarId: string = "primary",
		event: CreateEventParams,
	): Promise<CalendarEvent> {
		try {
			const res = await this.calendar.events.insert({
				calendarId,
				requestBody: {
					summary: event.summary,
					description: event.description,
					location: event.location,
					start: { dateTime: event.start },
					end: { dateTime: event.end },
				},
			});

			return parseEvent(res.data);
		} catch (error) {
			throw new Error(
				`Calendar createEvent failed: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	/**
	 * Update (patch) an existing event.
	 */
	async updateEvent(
		calendarId: string = "primary",
		eventId: string,
		updates: UpdateEventParams,
	): Promise<CalendarEvent> {
		try {
			const res = await this.calendar.events.patch({
				calendarId,
				eventId,
				requestBody: {
					...(updates.summary !== undefined && { summary: updates.summary }),
					...(updates.description !== undefined && {
						description: updates.description,
					}),
					...(updates.location !== undefined && { location: updates.location }),
					...(updates.start !== undefined && {
						start: { dateTime: updates.start },
					}),
					...(updates.end !== undefined && {
						end: { dateTime: updates.end },
					}),
				},
			});

			return parseEvent(res.data);
		} catch (error) {
			throw new Error(
				`Calendar updateEvent failed: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	/**
	 * Delete an event from a calendar.
	 */
	async deleteEvent(
		calendarId: string = "primary",
		eventId: string,
	): Promise<void> {
		try {
			await this.calendar.events.delete({
				calendarId,
				eventId,
			});
		} catch (error) {
			throw new Error(
				`Calendar deleteEvent failed: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	/**
	 * Search for events matching a text query.
	 */
	async searchEvents(
		calendarId: string = "primary",
		query: string,
		maxResults: number = 10,
	): Promise<CalendarEvent[]> {
		try {
			const res = await this.calendar.events.list({
				calendarId,
				q: query,
				maxResults,
				singleEvents: true,
				orderBy: "startTime",
				timeMin: new Date().toISOString(),
			});

			return (res.data.items ?? []).map((e) => parseEvent(e));
		} catch (error) {
			throw new Error(
				`Calendar searchEvents failed: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}
}
