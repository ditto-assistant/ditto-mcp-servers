"use client";

import { useState } from "react";
import { Home, ExternalLink, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Card,
	CardHeader,
	CardTitle,
	CardContent,
} from "@/components/ui/card";

interface HomeSettingsProps {
	gcpProjectId?: string;
}

export function HomeSettings({ gcpProjectId: initial }: HomeSettingsProps) {
	const [projectId, setProjectId] = useState(initial ?? "");
	const [saving, setSaving] = useState(false);
	const [saved, setSaved] = useState(false);
	const [error, setError] = useState("");

	const handleSave = async () => {
		const trimmed = projectId.trim();
		if (!trimmed) {
			setError("Project ID is required");
			return;
		}
		setSaving(true);
		setError("");
		try {
			await fetch("/api/config", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ gcpProjectId: trimmed }),
			});
			setSaved(true);
			setTimeout(() => setSaved(false), 2500);
		} catch {
			setError("Failed to save. Please try again.");
		} finally {
			setSaving(false);
		}
	};

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center gap-2">
					<Home className="h-4 w-4 text-muted-foreground" />
					<CardTitle className="text-sm">Google Home</CardTitle>
				</div>
			</CardHeader>
			<CardContent>
				<div className="flex flex-col gap-3">
					<p className="text-xs text-muted-foreground">
						Enter your GCP project ID to enable Google Home device
						control. Find it in the{" "}
						<a
							href="https://console.cloud.google.com"
							target="_blank"
							rel="noopener noreferrer"
							className="text-primary hover:underline inline-flex items-center gap-0.5"
						>
							Cloud Console
							<ExternalLink className="h-3 w-3" />
						</a>{" "}
						project selector (e.g.{" "}
						<code className="rounded bg-muted px-1 text-xs">
							my-project-123456
						</code>
						).
					</p>

					<div className="flex items-center gap-2">
						<Input
							value={projectId}
							onChange={(e) => setProjectId(e.target.value)}
							placeholder="my-project-id"
							className="text-sm h-8"
						/>
						<Button
							size="sm"
							onClick={handleSave}
							loading={saving}
							className="shrink-0"
						>
							{saved ? (
								<>
									<Check className="h-3 w-3" />
									Saved
								</>
							) : (
								"Save"
							)}
						</Button>
					</div>

					{error && (
						<p className="text-xs text-destructive">{error}</p>
					)}

					{initial && (
						<p className="text-xs text-muted-foreground">
							Current:{" "}
							<code className="rounded bg-muted px-1 text-xs text-foreground">
								{initial}
							</code>
						</p>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
