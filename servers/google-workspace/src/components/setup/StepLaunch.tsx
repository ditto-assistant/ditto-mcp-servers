"use client";

import { useState } from "react";
import {
	Power,
	Check,
	Copy,
	ExternalLink,
	Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardContent,
} from "@/components/ui/card";
import { copyToClipboard } from "@/lib/utils";

export function StepLaunch() {
	const [status, setStatus] = useState<
		"idle" | "starting" | "running" | "error"
	>("idle");
	const [tunnelUrl, setTunnelUrl] = useState("");
	const [errorMessage, setErrorMessage] = useState("");
	const [copied, setCopied] = useState(false);

	const handleStart = async () => {
		setStatus("starting");
		setErrorMessage("");
		try {
			const res = await fetch("/api/status", { method: "POST" });
			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				throw new Error(
					data.error || `Server responded with ${res.status}`,
				);
			}
			const data = await res.json();
			setTunnelUrl(data.tunnelUrl || data.ngrokUrl || "");
			setStatus("running");
		} catch (err) {
			setErrorMessage(
				err instanceof Error ? err.message : "Failed to start server",
			);
			setStatus("error");
		}
	};

	const handleCopy = async () => {
		const success = await copyToClipboard(tunnelUrl);
		if (success) {
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	};

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center gap-2">
					<Power className="h-5 w-5 text-primary" />
					<CardTitle>Launch Server</CardTitle>
				</div>
				<CardDescription>
					Start the MCP server and connect it to Ditto via an ngrok
					tunnel.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="flex flex-col gap-5">
					{status === "idle" && (
						<div className="flex flex-col items-center gap-4 py-8">
							<div className="rounded-full bg-muted p-4">
								<Power className="h-8 w-8 text-muted-foreground" />
							</div>
							<p className="text-sm text-muted-foreground text-center">
								Everything is configured. Start the server to
								create the tunnel and begin serving MCP
								requests.
							</p>
							<Button size="lg" onClick={handleStart}>
								<Power className="h-4 w-4" />
								Start Server
							</Button>
						</div>
					)}

					{status === "starting" && (
						<div className="flex flex-col items-center gap-4 py-8">
							<Loader2 className="h-8 w-8 animate-spin text-primary" />
							<p className="text-sm text-muted-foreground">
								Starting server and opening tunnel...
							</p>
						</div>
					)}

					{status === "error" && (
						<div className="flex flex-col gap-4">
							<div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3">
								<p className="text-sm text-destructive">
									{errorMessage}
								</p>
							</div>
							<Button
								variant="outline"
								onClick={handleStart}
							>
								Try Again
							</Button>
						</div>
					)}

					{status === "running" && (
						<div className="flex flex-col gap-5">
							{/* Status indicator */}
							<div className="flex items-center gap-3 rounded-md border border-success/30 bg-success/5 px-4 py-3">
								<span className="relative flex h-2.5 w-2.5">
									<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
									<span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success" />
								</span>
								<span className="text-sm font-medium text-success">
									Server is running
								</span>
							</div>

							{/* Tunnel URL */}
							{tunnelUrl && (
								<div className="flex items-center gap-2">
									<div className="flex-1 rounded-md border border-border bg-background px-3 py-2">
										<code className="text-sm text-accent font-mono">
											{tunnelUrl}
										</code>
									</div>
									<Button
										variant="outline"
										size="sm"
										onClick={handleCopy}
									>
										{copied ? (
											<Check className="h-3.5 w-3.5 text-success" />
										) : (
											<Copy className="h-3.5 w-3.5" />
										)}
									</Button>
								</div>
							)}

							{/* Connection instructions */}
							<div className="rounded-md border border-border bg-muted/30 px-4 py-4">
								<p className="text-sm font-medium text-foreground mb-3">
									Connect to Ditto:
								</p>
								<ol className="flex flex-col gap-2 text-sm text-muted-foreground">
									<li className="flex gap-2">
										<span className="text-foreground font-medium">
											1.
										</span>
										Open{" "}
										<a
											href="https://heyditto.ai"
											target="_blank"
											rel="noopener noreferrer"
											className="text-primary hover:underline"
										>
											heyditto.ai
										</a>
									</li>
									<li className="flex gap-2">
										<span className="text-foreground font-medium">
											2.
										</span>
										Go to Settings &rarr; MCP Servers
									</li>
									<li className="flex gap-2">
										<span className="text-foreground font-medium">
											3.
										</span>
										Click &quot;Add Server&quot;
									</li>
									<li className="flex gap-2">
										<span className="text-foreground font-medium">
											4.
										</span>
										<span>
											Paste this URL:{" "}
											<code className="rounded bg-background px-1.5 py-0.5 text-xs font-mono text-accent">
												{tunnelUrl}
											</code>
										</span>
									</li>
									<li className="flex gap-2">
										<span className="text-foreground font-medium">
											5.
										</span>
										Set transport to SSE
									</li>
									<li className="flex gap-2">
										<span className="text-foreground font-medium">
											6.
										</span>
										Enable the server
									</li>
								</ol>
							</div>

							{/* Open Ditto link */}
							<div className="flex justify-end">
								<a
									href="https://heyditto.ai"
									target="_blank"
									rel="noopener noreferrer"
								>
									<Button variant="secondary">
										Open Ditto App
										<ExternalLink className="h-3.5 w-3.5" />
									</Button>
								</a>
							</div>
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
