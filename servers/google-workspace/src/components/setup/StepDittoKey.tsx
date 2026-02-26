"use client";

import { useState } from "react";
import { Shield, ExternalLink, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardContent,
} from "@/components/ui/card";

interface StepDittoKeyProps {
	saveConfig: (patch: Record<string, unknown>) => Promise<void>;
	onNext: () => void;
}

const ENVIRONMENTS = [
	{ value: "prod", label: "Production" },
	{ value: "staging", label: "Staging" },
	{ value: "local", label: "Local" },
] as const;

export function StepDittoKey({ saveConfig, onNext }: StepDittoKeyProps) {
	const [apiKey, setApiKey] = useState("");
	const [env, setEnv] = useState<"prod" | "staging" | "local">("prod");
	const [error, setError] = useState("");
	const [saving, setSaving] = useState(false);

	const validate = (): boolean => {
		if (!apiKey.trim()) {
			setError("API key is required");
			return false;
		}
		if (!apiKey.startsWith("ditto_mcp_")) {
			setError("API key must start with ditto_mcp_");
			return false;
		}
		setError("");
		return true;
	};

	const handleContinue = async () => {
		if (!validate()) return;
		setSaving(true);
		try {
			await saveConfig({
				ditto: { apiKey: apiKey.trim(), env },
			});
			onNext();
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
					<Shield className="h-5 w-5 text-primary" />
					<CardTitle>Ditto MCP API Key</CardTitle>
				</div>
				<CardDescription>
					Enter your Ditto MCP API key to connect this server to your
					Ditto account.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="flex flex-col gap-5">
					<Input
						label="API Key"
						description="Your key starts with ditto_mcp_"
						placeholder="ditto_mcp_xxxxxxxxxxxxxxxx"
						type="password"
						value={apiKey}
						onChange={(e) => {
							setApiKey(e.target.value);
							if (error) setError("");
						}}
						error={error}
					/>

					<div className="flex flex-col gap-1.5">
						<label className="text-sm font-medium text-foreground">
							Environment
						</label>
						<div className="flex gap-2">
							{ENVIRONMENTS.map((e) => (
								<button
									key={e.value}
									type="button"
									onClick={() => setEnv(e.value)}
									className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
										env === e.value
											? "border-primary bg-primary/10 text-primary"
											: "border-border bg-transparent text-muted-foreground hover:bg-muted"
									}`}
								>
									{e.label}
								</button>
							))}
						</div>
					</div>

					<div className="flex items-center justify-between pt-2">
						<a
							href="https://heyditto.ai"
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
						>
							Get your API key at heyditto.ai
							<ExternalLink className="h-3 w-3" />
						</a>

						<Button
							onClick={handleContinue}
							loading={saving}
						>
							Continue
							<ChevronRight className="h-4 w-4" />
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
