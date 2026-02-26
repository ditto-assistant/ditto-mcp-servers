"use client";

import { useState, useEffect } from "react";
import { Check, ChevronRight, RefreshCw, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardContent,
} from "@/components/ui/card";

interface StepGoogleAuthProps {
	onNext: () => void;
}

interface AuthStatus {
	authenticated: boolean;
	email?: string;
}

export function StepGoogleAuth({ onNext }: StepGoogleAuthProps) {
	const [authStatus, setAuthStatus] = useState<AuthStatus>({
		authenticated: false,
	});
	const [loading, setLoading] = useState(true);

	const checkAuth = async () => {
		try {
			const res = await fetch("/api/status");
			if (res.ok) {
				const data = await res.json();
				setAuthStatus({
					authenticated: !!data.google?.authenticated,
					email: data.google?.email,
				});
			}
		} catch {
			// Ignore errors during status check
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		checkAuth();
	}, []);

	const handleSignIn = () => {
		window.location.href = "/api/google/auth";
	};

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center gap-2">
					<Mail className="h-5 w-5 text-primary" />
					<CardTitle>Authenticate with Google</CardTitle>
				</div>
				<CardDescription>
					Sign in with your Google account to grant this server access
					to your Workspace data.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="flex flex-col gap-5">
					{loading ? (
						<div className="flex items-center justify-center py-8">
							<RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
						</div>
					) : authStatus.authenticated ? (
						<div className="rounded-md border border-success/30 bg-success/5 px-4 py-4">
							<div className="flex items-center gap-3">
								<div className="flex h-8 w-8 items-center justify-center rounded-full bg-success/20">
									<Check className="h-4 w-4 text-success" />
								</div>
								<div>
									<p className="text-sm font-medium text-foreground">
										Authenticated
									</p>
									{authStatus.email && (
										<p className="text-xs text-muted-foreground">
											{authStatus.email}
										</p>
									)}
								</div>
							</div>
						</div>
					) : (
						<div className="flex flex-col items-center gap-4 py-6">
							<div className="rounded-full bg-muted p-4">
								<Mail className="h-8 w-8 text-muted-foreground" />
							</div>
							<p className="text-sm text-muted-foreground text-center">
								Click below to sign in with Google. You will be
								redirected to Google&apos;s consent screen.
							</p>
						</div>
					)}

					<div className="flex items-center justify-between pt-2">
						{authStatus.authenticated ? (
							<Button
								variant="outline"
								size="sm"
								onClick={handleSignIn}
							>
								<RefreshCw className="h-3.5 w-3.5" />
								Re-authenticate
							</Button>
						) : (
							<Button onClick={handleSignIn}>
								Sign in with Google
							</Button>
						)}

						<Button
							onClick={onNext}
							disabled={!authStatus.authenticated}
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
