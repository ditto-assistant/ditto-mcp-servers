"use client";

import { Mail, RefreshCw, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardHeader,
	CardTitle,
	CardContent,
} from "@/components/ui/card";

interface GoogleAccountInfoProps {
	authenticated: boolean;
	email: string;
	expiryDate: number;
}

function getTokenStatus(expiryDate: number): {
	label: string;
	variant: "success" | "warning" | "destructive";
} {
	if (!expiryDate) {
		return { label: "No token", variant: "destructive" };
	}
	const now = Date.now();
	const remaining = expiryDate - now;

	if (remaining <= 0) {
		return { label: "Expired", variant: "destructive" };
	}
	if (remaining < 5 * 60 * 1000) {
		return { label: "Expiring soon", variant: "warning" };
	}
	return { label: "Valid", variant: "success" };
}

export function GoogleAccountInfo({
	authenticated,
	email,
	expiryDate,
}: GoogleAccountInfoProps) {
	const tokenStatus = getTokenStatus(expiryDate);

	const handleReauth = () => {
		window.location.href = "/api/google/auth";
	};

	const handleDisconnect = async () => {
		const confirmed = window.confirm(
			"Disconnect your Google account? The server will no longer be able to access your Workspace data.",
		);
		if (!confirmed) return;

		try {
			await fetch("/api/google/disconnect", { method: "POST" });
			window.location.reload();
		} catch {
			// Ignore
		}
	};

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<CardTitle className="text-sm">Google Account</CardTitle>
					{authenticated && (
						<Badge variant={tokenStatus.variant}>
							{tokenStatus.label}
						</Badge>
					)}
				</div>
			</CardHeader>
			<CardContent>
				<div className="flex flex-col gap-4">
					{authenticated ? (
						<>
							<div className="flex items-center gap-3">
								<div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
									<Mail className="h-4 w-4 text-primary" />
								</div>
								<div>
									<p className="text-sm font-medium text-foreground">
										{email || "Google Account"}
									</p>
									<p className="text-xs text-muted-foreground">
										Authenticated
									</p>
								</div>
							</div>
							<div className="flex items-center gap-2">
								<Button
									variant="outline"
									size="sm"
									onClick={handleReauth}
								>
									<RefreshCw className="h-3 w-3" />
									Re-authenticate
								</Button>
								<Button
									variant="ghost"
									size="sm"
									onClick={handleDisconnect}
									className="text-destructive hover:text-destructive"
								>
									<Power className="h-3 w-3" />
									Disconnect
								</Button>
							</div>
						</>
					) : (
						<div className="flex flex-col items-center gap-3 py-4">
							<div className="rounded-full bg-muted p-3">
								<Mail className="h-5 w-5 text-muted-foreground" />
							</div>
							<p className="text-xs text-muted-foreground text-center">
								No Google account connected
							</p>
							<Button size="sm" onClick={handleReauth}>
								Sign in with Google
							</Button>
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
