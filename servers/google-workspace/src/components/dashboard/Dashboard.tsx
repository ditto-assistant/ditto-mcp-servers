"use client";

import { useState, useEffect, useCallback } from "react";
import { ConnectionStatus } from "./ConnectionStatus";
import { ServiceToggles } from "./ServiceToggles";
import { ActivityLog } from "./ActivityLog";
import { GoogleAccountInfo } from "./GoogleAccountInfo";

export interface StatusData {
	connected: boolean;
	tunnelUrl: string;
	uptime: number;
	services: {
		gmail: boolean;
		calendar: boolean;
		docs: boolean;
		sheets: boolean;
		drive: boolean;
	};
	google: {
		authenticated: boolean;
		email: string;
		expiryDate: number;
	};
	recentActivity: ActivityEntry[];
}

export interface ActivityEntry {
	id: string;
	timestamp: string;
	tool: string;
	status: "success" | "error";
	durationMs: number;
}

const EMPTY_STATUS: StatusData = {
	connected: false,
	tunnelUrl: "",
	uptime: 0,
	services: {
		gmail: true,
		calendar: true,
		docs: true,
		sheets: true,
		drive: true,
	},
	google: {
		authenticated: false,
		email: "",
		expiryDate: 0,
	},
	recentActivity: [],
};

export function Dashboard() {
	const [status, setStatus] = useState<StatusData>(EMPTY_STATUS);
	const [loading, setLoading] = useState(true);

	const fetchStatus = useCallback(async () => {
		try {
			const res = await fetch("/api/status");
			if (res.ok) {
				const data = await res.json();
				setStatus(data);
			}
		} catch {
			// Silently fail - we'll retry on next poll
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchStatus();
		const interval = setInterval(fetchStatus, 5000);
		return () => clearInterval(interval);
	}, [fetchStatus]);

	if (loading) {
		return (
			<div className="flex items-center justify-center py-16">
				<div className="flex flex-col items-center gap-3">
					<div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
					<p className="text-sm text-muted-foreground">
						Loading dashboard...
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-6">
			<div>
				<h2 className="text-xl font-semibold mb-1">Dashboard</h2>
				<p className="text-sm text-muted-foreground">
					Monitor your Google Workspace MCP server.
				</p>
			</div>

			<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
				<ConnectionStatus
					connected={status.connected}
					tunnelUrl={status.tunnelUrl}
					uptime={status.uptime}
					onRefresh={fetchStatus}
				/>
				<ServiceToggles services={status.services} />
				<ActivityLog entries={status.recentActivity} />
				<GoogleAccountInfo
					authenticated={status.google.authenticated}
					email={status.google.email}
					expiryDate={status.google.expiryDate}
				/>
			</div>
		</div>
	);
}
