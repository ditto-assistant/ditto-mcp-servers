"use client";

import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardHeader,
	CardTitle,
	CardContent,
} from "@/components/ui/card";
import type { ActivityEntry } from "./Dashboard";

interface ActivityLogProps {
	entries: ActivityEntry[];
}

const MOCK_ENTRIES: ActivityEntry[] = [
	{
		id: "1",
		timestamp: new Date(Date.now() - 15000).toISOString(),
		tool: "gmail_search",
		status: "success",
		durationMs: 342,
	},
	{
		id: "2",
		timestamp: new Date(Date.now() - 45000).toISOString(),
		tool: "calendar_list_events",
		status: "success",
		durationMs: 218,
	},
	{
		id: "3",
		timestamp: new Date(Date.now() - 120000).toISOString(),
		tool: "drive_search",
		status: "success",
		durationMs: 567,
	},
	{
		id: "4",
		timestamp: new Date(Date.now() - 180000).toISOString(),
		tool: "gmail_send",
		status: "error",
		durationMs: 1204,
	},
	{
		id: "5",
		timestamp: new Date(Date.now() - 300000).toISOString(),
		tool: "sheets_read",
		status: "success",
		durationMs: 189,
	},
	{
		id: "6",
		timestamp: new Date(Date.now() - 420000).toISOString(),
		tool: "docs_create",
		status: "success",
		durationMs: 456,
	},
];

function formatTime(iso: string): string {
	const date = new Date(iso);
	return date.toLocaleTimeString(undefined, {
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
	});
}

export function ActivityLog({ entries }: ActivityLogProps) {
	const displayEntries = entries.length > 0 ? entries : MOCK_ENTRIES;

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<CardTitle className="text-sm">Recent Activity</CardTitle>
					<span className="text-xs text-muted-foreground">
						{displayEntries.length} calls
					</span>
				</div>
			</CardHeader>
			<CardContent>
				<div className="flex flex-col gap-0.5 max-h-60 overflow-y-auto pr-1">
					{displayEntries.length === 0 ? (
						<p className="text-xs text-muted-foreground py-4 text-center">
							No activity yet. Tool calls will appear here.
						</p>
					) : (
						displayEntries.map((entry) => (
							<div
								key={entry.id}
								className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-muted/30 transition-colors"
							>
								<span className="text-xs text-muted-foreground font-mono shrink-0 w-16">
									{formatTime(entry.timestamp)}
								</span>
								<span className="text-xs text-foreground font-mono flex-1 truncate">
									{entry.tool}
								</span>
								<Badge
									variant={
										entry.status === "success"
											? "success"
											: "destructive"
									}
								>
									{entry.status}
								</Badge>
								<span className="text-xs text-muted-foreground shrink-0 w-12 text-right tabular-nums">
									{entry.durationMs}ms
								</span>
							</div>
						))
					)}
				</div>
			</CardContent>
		</Card>
	);
}
