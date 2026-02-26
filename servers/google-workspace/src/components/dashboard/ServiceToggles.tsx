"use client";

import { useState } from "react";
import {
	Mail,
	Calendar,
	FileText,
	Table2,
	HardDrive,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardHeader,
	CardTitle,
	CardContent,
} from "@/components/ui/card";

interface ServiceTogglesProps {
	services: {
		gmail: boolean;
		calendar: boolean;
		docs: boolean;
		sheets: boolean;
		drive: boolean;
	};
}

interface ServiceDef {
	key: keyof ServiceTogglesProps["services"];
	label: string;
	toolCount: number;
	icon: React.ComponentType<{ className?: string }>;
}

const SERVICE_DEFS: ServiceDef[] = [
	{ key: "gmail", label: "Gmail", toolCount: 5, icon: Mail },
	{ key: "calendar", label: "Calendar", toolCount: 5, icon: Calendar },
	{ key: "docs", label: "Docs", toolCount: 4, icon: FileText },
	{ key: "sheets", label: "Sheets", toolCount: 4, icon: Table2 },
	{ key: "drive", label: "Drive", toolCount: 4, icon: HardDrive },
];

export function ServiceToggles({ services }: ServiceTogglesProps) {
	const [localServices, setLocalServices] = useState(services);
	const [saving, setSaving] = useState(false);

	const handleToggle = async (key: keyof typeof localServices) => {
		const next = { ...localServices, [key]: !localServices[key] };
		const anyEnabled = Object.values(next).some(Boolean);
		if (!anyEnabled) return;

		setLocalServices(next);
		setSaving(true);
		try {
			await fetch("/api/config", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ services: next }),
			});
		} catch {
			// Revert on failure
			setLocalServices(localServices);
		} finally {
			setSaving(false);
		}
	};

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<CardTitle className="text-sm">Services</CardTitle>
					<Badge variant="outline">
						{Object.values(localServices).filter(Boolean).length} active
					</Badge>
				</div>
			</CardHeader>
			<CardContent>
				<div className="flex flex-col gap-1">
					{SERVICE_DEFS.map((svc) => {
						const Icon = svc.icon;
						return (
							<div
								key={svc.key}
								className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-muted/30 transition-colors"
							>
								<Icon className="h-4 w-4 text-muted-foreground shrink-0" />
								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2">
										<span className="text-sm text-foreground">
											{svc.label}
										</span>
										<span className="text-xs text-muted-foreground">
											{svc.toolCount} tools
										</span>
									</div>
								</div>
								<Switch
									checked={localServices[svc.key]}
									onCheckedChange={() =>
										handleToggle(svc.key)
									}
									disabled={saving}
								/>
							</div>
						);
					})}
				</div>
			</CardContent>
		</Card>
	);
}
