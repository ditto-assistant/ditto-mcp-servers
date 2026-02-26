import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
	title: "Ditto MCP — Google Workspace",
	description: "Google Workspace MCP server for Ditto Assistant",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en" className="dark">
			<body className="min-h-screen antialiased">
				<div className="flex min-h-screen flex-col">
					<header className="border-b border-border px-6 py-4">
						<div className="mx-auto flex max-w-5xl items-center gap-3">
							<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
								D
							</div>
							<h1 className="text-lg font-semibold">
								Ditto MCP{" "}
								<span className="text-muted-foreground font-normal">
									/ Google Workspace
								</span>
							</h1>
						</div>
					</header>
					<main className="flex-1 px-6 py-8">
						<div className="mx-auto max-w-5xl">{children}</div>
					</main>
				</div>
			</body>
		</html>
	);
}
