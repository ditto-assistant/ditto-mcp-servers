"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

export interface SwitchProps {
	checked: boolean;
	onCheckedChange: (checked: boolean) => void;
	label?: string;
	description?: string;
	disabled?: boolean;
	className?: string;
}

export function Switch({
	checked,
	onCheckedChange,
	label,
	description,
	disabled = false,
	className,
}: SwitchProps) {
	const id = useId();

	return (
		<div className={cn("flex items-center justify-between gap-4", className)}>
			{(label || description) && (
				<div className="flex flex-col gap-0.5">
					{label && (
						<label
							htmlFor={id}
							className="text-sm font-medium text-foreground cursor-pointer"
						>
							{label}
						</label>
					)}
					{description && (
						<p className="text-xs text-muted-foreground">
							{description}
						</p>
					)}
				</div>
			)}
			<button
				id={id}
				role="switch"
				type="button"
				aria-checked={checked}
				disabled={disabled}
				onClick={() => onCheckedChange(!checked)}
				className={cn(
					"relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
					checked ? "bg-primary" : "bg-input",
				)}
			>
				<span
					className={cn(
						"pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg transition-transform",
						checked ? "translate-x-4" : "translate-x-0",
					)}
				/>
			</button>
		</div>
	);
}
