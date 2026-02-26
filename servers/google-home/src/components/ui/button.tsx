"use client";

import { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ButtonVariant =
	| "default"
	| "secondary"
	| "outline"
	| "ghost"
	| "destructive";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: ButtonVariant;
	size?: ButtonSize;
	loading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
	default:
		"bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
	secondary:
		"bg-secondary text-secondary-foreground hover:bg-secondary/80",
	outline:
		"border border-border bg-transparent text-foreground hover:bg-muted",
	ghost: "bg-transparent text-foreground hover:bg-muted",
	destructive:
		"bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm",
};

const sizeClasses: Record<ButtonSize, string> = {
	sm: "h-8 px-3 text-xs rounded-md gap-1.5",
	md: "h-9 px-4 text-sm rounded-md gap-2",
	lg: "h-10 px-6 text-sm rounded-lg gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
	(
		{
			className,
			variant = "default",
			size = "md",
			loading = false,
			disabled,
			children,
			...props
		},
		ref,
	) => {
		return (
			<button
				ref={ref}
				className={cn(
					"inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
					variantClasses[variant],
					sizeClasses[size],
					className,
				)}
				disabled={disabled || loading}
				{...props}
			>
				{loading && (
					<Loader2 className="h-4 w-4 animate-spin" />
				)}
				{children}
			</button>
		);
	},
);

Button.displayName = "Button";
