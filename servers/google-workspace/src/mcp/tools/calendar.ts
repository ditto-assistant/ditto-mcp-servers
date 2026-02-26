import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CalendarService } from "@/google/calendar";

export function registerCalendarTools(
	server: McpServer,
	getService: () => CalendarService,
): void {
	server.tool(
		"calendar_list_events",
		"List upcoming events from a Google Calendar",
		{
			calendarId: z
				.string()
				.optional()
				.default("primary")
				.describe("Calendar ID (default: primary)"),
			timeMin: z
				.string()
				.optional()
				.describe("Start of time range (ISO 8601 datetime)"),
			timeMax: z
				.string()
				.optional()
				.describe("End of time range (ISO 8601 datetime)"),
			maxResults: z
				.number()
				.optional()
				.default(10)
				.describe("Maximum number of events to return"),
		},
		async ({ calendarId, timeMin, timeMax, maxResults }) => {
			try {
				const events = await getService().listEvents(
					calendarId,
					timeMin,
					timeMax,
					maxResults,
				);
				return {
					content: [
						{
							type: "text" as const,
							text: JSON.stringify(events, null, 2),
						},
					],
				};
			} catch (error) {
				return {
					content: [
						{
							type: "text" as const,
							text: `Error listing events: ${error instanceof Error ? error.message : String(error)}`,
						},
					],
					isError: true,
				};
			}
		},
	);

	server.tool(
		"calendar_create_event",
		"Create a new event in Google Calendar",
		{
			summary: z.string().describe("Event title"),
			start: z.string().describe("Event start time (ISO 8601 datetime)"),
			end: z.string().describe("Event end time (ISO 8601 datetime)"),
			description: z.string().optional().describe("Event description"),
			location: z.string().optional().describe("Event location"),
			calendarId: z
				.string()
				.optional()
				.default("primary")
				.describe("Calendar ID (default: primary)"),
		},
		async ({ summary, start, end, description, location, calendarId }) => {
			try {
				const event = await getService().createEvent(calendarId, {
					summary,
					start,
					end,
					description,
					location,
				});
				return {
					content: [
						{
							type: "text" as const,
							text: JSON.stringify(
								{ success: true, event },
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
							text: `Error creating event: ${error instanceof Error ? error.message : String(error)}`,
						},
					],
					isError: true,
				};
			}
		},
	);

	server.tool(
		"calendar_update_event",
		"Update an existing event in Google Calendar",
		{
			eventId: z.string().describe("The event ID to update"),
			summary: z.string().optional().describe("Updated event title"),
			start: z.string().optional().describe("Updated start time (ISO 8601 datetime)"),
			end: z.string().optional().describe("Updated end time (ISO 8601 datetime)"),
			description: z.string().optional().describe("Updated event description"),
			location: z.string().optional().describe("Updated event location"),
			calendarId: z
				.string()
				.optional()
				.default("primary")
				.describe("Calendar ID (default: primary)"),
		},
		async ({ eventId, summary, start, end, description, location, calendarId }) => {
			try {
				const event = await getService().updateEvent(calendarId, eventId, {
					summary,
					start,
					end,
					description,
					location,
				});
				return {
					content: [
						{
							type: "text" as const,
							text: JSON.stringify(
								{ success: true, event },
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
							text: `Error updating event: ${error instanceof Error ? error.message : String(error)}`,
						},
					],
					isError: true,
				};
			}
		},
	);

	server.tool(
		"calendar_delete_event",
		"Delete an event from Google Calendar",
		{
			eventId: z.string().describe("The event ID to delete"),
			calendarId: z
				.string()
				.optional()
				.default("primary")
				.describe("Calendar ID (default: primary)"),
		},
		async ({ eventId, calendarId }) => {
			try {
				await getService().deleteEvent(calendarId, eventId);
				return {
					content: [
						{
							type: "text" as const,
							text: JSON.stringify(
								{ success: true, message: `Event '${eventId}' deleted successfully` },
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
							text: `Error deleting event: ${error instanceof Error ? error.message : String(error)}`,
						},
					],
					isError: true,
				};
			}
		},
	);

	server.tool(
		"calendar_search_events",
		"Search for events in Google Calendar by keyword",
		{
			query: z.string().describe("Search query for events"),
			calendarId: z
				.string()
				.optional()
				.default("primary")
				.describe("Calendar ID (default: primary)"),
			maxResults: z
				.number()
				.optional()
				.default(10)
				.describe("Maximum number of events to return"),
		},
		async ({ query, calendarId, maxResults }) => {
			try {
				const events = await getService().searchEvents(calendarId, query, maxResults);
				return {
					content: [
						{
							type: "text" as const,
							text: JSON.stringify(events, null, 2),
						},
					],
				};
			} catch (error) {
				return {
					content: [
						{
							type: "text" as const,
							text: `Error searching events: ${error instanceof Error ? error.message : String(error)}`,
						},
					],
					isError: true,
				};
			}
		},
	);
}
