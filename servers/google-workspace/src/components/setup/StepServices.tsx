"use client";

import { useState } from "react";
import {
	Mail,
	Calendar,
	FileText,
	Table2,
	HardDrive,
	Home,
	ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardContent,
} from "@/components/ui/card";

interface StepServicesProps {
	saveConfig: (patch: Record<string, unknown>) => Promise<void>;
	onNext: () => void;
}

interface ServiceDef {
	key: "gmail" | "calendar" | "docs" | "sheets" | "drive" | "home";
	label: string;
	description: string;
	icon: React.ComponentType<{ className?: string }>;
}

const SERVICES: ServiceDef[] = [
	{
		key: "gmail",
		label: "Gmail",
		description: "Send, read, search, and manage email",
		icon: Mail,
	},
	{
		key: "calendar",
		label: "Calendar",
		description: "Create, list, and manage calendar events",
		icon: Calendar,
	},
	{
		key: "docs",
		label: "Docs",
		description: "Create and edit Google documents",
		icon: FileText,
	},
	{
		key: "sheets",
		label: "Sheets",
		description: "Read and write spreadsheet data",
		icon: Table2,
	},
	{
		key: "drive",
		label: "Drive",
		description: "Search, upload, and manage files",
		icon: HardDrive,
	},
	{
		key: "home",
		label: "Google Home",
		description: "Control smart home devices via Google Assistant (lights, thermostat, plugs, etc.)",
		icon: Home,
	},
];

export function StepServices({ saveConfig, onNext }: StepServicesProps) {
	const [services, setServices] = useState<Record<string, boolean>>({
		gmail: true,
		calendar: true,
		docs: true,
		sheets: true,
		drive: true,
		home: true,
	});
	const [error, setError] = useState("");
	const [saving, setSaving] = useState(false);

	const toggleService = (key: string) => {
		setServices((prev) => {
			const next = { ...prev, [key]: !prev[key] };
			const anyEnabled = Object.values(next).some(Boolean);
			if (!anyEnabled) {
				setError("At least one service must be enabled");
				return prev;
			}
			setError("");
			return next;
		});
	};

	const handleContinue = async () => {
		const anyEnabled = Object.values(services).some(Boolean);
		if (!anyEnabled) {
			setError("At least one service must be enabled");
			return;
		}
		setSaving(true);
		try {
			await saveConfig({ services });
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
				<CardTitle>Services</CardTitle>
				<CardDescription>
					Choose which Google Workspace services to enable. Each
					service adds MCP tools that Ditto can use.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="flex flex-col gap-1">
					{SERVICES.map((svc) => {
						const Icon = svc.icon;
						return (
							<div
								key={svc.key}
								className="flex items-center gap-4 rounded-md px-3 py-3 hover:bg-muted/50 transition-colors"
							>
								<div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
									<Icon className="h-4 w-4 text-foreground" />
								</div>
								<div className="flex-1">
									<Switch
										checked={services[svc.key]}
										onCheckedChange={() =>
											toggleService(svc.key)
										}
										label={svc.label}
										description={svc.description}
									/>
								</div>
							</div>
						);
					})}

					{error && (
						<p className="text-xs text-destructive mt-2 px-3">
							{error}
						</p>
					)}

					<div className="flex items-center justify-end pt-4">
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
