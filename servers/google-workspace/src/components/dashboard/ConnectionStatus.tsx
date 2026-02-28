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
	bearerToken: string;
	uptime: number;
	onRefresh: () => void;
}

export function ConnectionStatus({
	connected,
	tunnelUrl,
	bearerToken,
	uptime,
	onRefresh,
}: ConnectionStatusProps) {
	const [copied, setCopied] = useState(false);
	const [copiedToken, setCopiedToken] = useState(false);
	const [restarting, setRestarting] = useState(false);

	const mcpUrl = tunnelUrl ? `${tunnelUrl}/api/mcp` : "";

	const handleCopy = async () => {
		if (!mcpUrl) return;
		const success = await copyToClipboard(mcpUrl);
		if (success) {
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	};

	const handleCopyToken = async () => {
		if (!bearerToken) return;
		const success = await copyToClipboard(bearerToken);
		if (success) {
			setCopiedToken(true);
			setTimeout(() => setCopiedToken(false), 2000);
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
					{/* MCP URL */}
					{mcpUrl ? (
						<div className="flex flex-col gap-1">
							<p className="text-xs text-muted-foreground">MCP endpoint for Ditto:</p>
							<div className="flex items-center gap-2">
								<div className="flex-1 overflow-hidden rounded-md border border-border bg-background px-3 py-1.5">
									<code className="text-xs text-accent font-mono truncate block">
										{mcpUrl}
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
						</div>
					) : (
						<p className="text-xs text-muted-foreground">
							No tunnel active
						</p>
					)}

				{/* Bearer token for Ditto */}
				{bearerToken && (
					<div className="flex flex-col gap-1.5">
						<p className="text-xs text-muted-foreground">
							Bearer token for Ditto:
						</p>
						<div className="flex items-center gap-2">
							<div className="flex-1 overflow-hidden rounded-md border border-border bg-background px-3 py-1.5">
								<code className="text-xs text-muted-foreground font-mono truncate block">
									{"•".repeat(16)}
								</code>
							</div>
							<Button
								variant="outline"
								size="sm"
								onClick={handleCopyToken}
								className="shrink-0"
								title="Copy bearer token"
							>
								{copiedToken ? (
									<Check className="h-3.5 w-3.5 text-success" />
								) : (
									<Copy className="h-3.5 w-3.5" />
								)}
							</Button>
						</div>
					</div>
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
