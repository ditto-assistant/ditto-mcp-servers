import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StepperProps {
	steps: string[];
	currentStep: number;
}

export function Stepper({ steps, currentStep }: StepperProps) {
	return (
		<nav aria-label="Setup progress" className="w-full">
			<ol className="flex items-center gap-2">
				{steps.map((label, index) => {
					const stepNumber = index + 1;
					const isCompleted = stepNumber < currentStep;
					const isActive = stepNumber === currentStep;

					return (
						<li
							key={label}
							className="flex items-center gap-2 flex-1 last:flex-initial"
						>
							<div className="flex items-center gap-2">
								<div
									className={cn(
										"flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
										isCompleted &&
											"bg-success text-white",
										isActive &&
											"bg-primary text-primary-foreground ring-2 ring-primary/30",
										!isCompleted &&
											!isActive &&
											"bg-muted text-muted-foreground",
									)}
								>
									{isCompleted ? (
										<Check className="h-3.5 w-3.5" />
									) : (
										stepNumber
									)}
								</div>
								<span
									className={cn(
										"hidden text-xs font-medium whitespace-nowrap sm:block",
										isActive
											? "text-foreground"
											: "text-muted-foreground",
									)}
								>
									{label}
								</span>
							</div>
							{index < steps.length - 1 && (
								<div
									className={cn(
										"h-px flex-1 min-w-4",
										isCompleted
											? "bg-success"
											: "bg-border",
									)}
								/>
							)}
						</li>
					);
				})}
			</ol>
		</nav>
	);
}
