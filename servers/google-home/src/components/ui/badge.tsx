import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "success" | "warning" | "destructive" | "outline";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
	variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
	default: "bg-primary/15 text-primary border-primary/25",
	success: "bg-success/15 text-success border-success/25",
	warning: "bg-warning/15 text-warning border-warning/25",
	destructive: "bg-destructive/15 text-destructive border-destructive/25",
	outline: "bg-transparent text-muted-foreground border-border",
};

export function Badge({
	className,
	variant = "default",
	...props
}: BadgeProps) {
	return (
		<span
			className={cn(
				"inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium transition-colors",
				variantClasses[variant],
				className,
			)}
			{...props}
		/>
	);
}
