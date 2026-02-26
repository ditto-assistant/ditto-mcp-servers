"use client";

import { forwardRef, useId } from "react";
import { cn } from "@/lib/utils";

export interface InputProps
	extends React.InputHTMLAttributes<HTMLInputElement> {
	label?: string;
	error?: string;
	description?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
	({ className, label, error, description, id: idProp, ...props }, ref) => {
		const generatedId = useId();
		const id = idProp ?? generatedId;

		return (
			<div className="flex flex-col gap-1.5">
				{label && (
					<label
						htmlFor={id}
						className="text-sm font-medium text-foreground"
					>
						{label}
					</label>
				)}
				{description && (
					<p className="text-xs text-muted-foreground">
						{description}
					</p>
				)}
				<input
					id={id}
					ref={ref}
					className={cn(
						"flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
						error && "border-destructive focus-visible:ring-destructive",
						className,
					)}
					{...props}
				/>
				{error && (
					<p className="text-xs text-destructive">{error}</p>
				)}
			</div>
		);
	},
);

Input.displayName = "Input";
