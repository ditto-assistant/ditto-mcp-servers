"use client";

import { useState } from "react";
import { Copy, Check, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardHeader,
	CardTitle,
	CardContent,
} from "@/components/ui/card";
import { copyToClipboard, formatDuration } from "@/lib/utils";

interface ConnectionStatusProps {
	connected: boolean;
	tunnelUrl: string;
	uptime: number;
	onRefresh: () => void;
}

export function ConnectionStatus({
	connected,
	tunnelUrl,
	uptime,
	onRefresh,
}: ConnectionStatusProps) {
	const [copied, setCopied] = useState(false);
	const [restarting, setRestarting] = useState(false);

	const handleCopy = async () => {
		if (!tunnelUrl) return;
		const success = await copyToClipboard(tunnelUrl);
		if (success) {
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	};

	const handleRestart = async () => {
		setRestarting(true);
		try {
			await fetch("/api/status", { method: "POST" });
			onRefresh();
		} catch {
			// Ignore
		} finally {
			setRestarting(false);
		}
	};

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<CardTitle className="text-sm">Connection</CardTitle>
					<div className="flex items-center gap-2">
						<span
							className={`relative flex h-2 w-2 ${connected ? "" : ""}`}
						>
							{connected && (
								<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
							)}
							<span
								className={`relative inline-flex h-2 w-2 rounded-full ${
									connected
										? "bg-success"
										: "bg-destructive"
								}`}
							/>
						</span>
						<span
							className={`text-xs font-medium ${
								connected
									? "text-success"
									: "text-destructive"
							}`}
						>
							{connected ? "Connected" : "Disconnected"}
						</span>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<div className="flex flex-col gap-3">
					{/* Tunnel URL */}
					{tunnelUrl ? (
						<div className="flex items-center gap-2">
							<div className="flex-1 overflow-hidden rounded-md border border-border bg-background px-3 py-1.5">
								<code className="text-xs text-accent font-mono truncate block">
									{tunnelUrl}
								</code>
							</div>
							<Button
								variant="ghost"
								size="sm"
								onClick={handleCopy}
								className="shrink-0"
							>
								{copied ? (
									<Check className="h-3.5 w-3.5 text-success" />
								) : (
									<Copy className="h-3.5 w-3.5" />
								)}
							</Button>
						</div>
					) : (
						<p className="text-xs text-muted-foreground">
							No tunnel active
						</p>
					)}

					{/* Uptime & restart */}
					<div className="flex items-center justify-between">
						{uptime > 0 && (
							<p className="text-xs text-muted-foreground">
								Uptime:{" "}
								<span className="text-foreground">
									{formatDuration(uptime)}
								</span>
							</p>
						)}
						<Button
							variant="outline"
							size="sm"
							onClick={handleRestart}
							loading={restarting}
						>
							<RefreshCw className="h-3 w-3" />
							Restart Tunnel
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
