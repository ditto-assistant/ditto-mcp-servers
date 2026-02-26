import ngrok from "@ngrok/ngrok";

export interface TunnelOptions {
	port: number;
	authtoken: string;
	domain?: string;
}

export interface TunnelInfo {
	url: string;
	close: () => Promise<void>;
}

export async function createTunnel(options: TunnelOptions): Promise<TunnelInfo> {
	const listener = await ngrok.forward({
		addr: options.port,
		authtoken: options.authtoken,
		domain: options.domain,
	});

	const url = listener.url();
	if (!url) {
		throw new Error("Failed to get ngrok tunnel URL");
	}

	return {
		url,
		close: async () => {
			await ngrok.disconnect();
		},
	};
}

export async function disconnectAll(): Promise<void> {
	await ngrok.disconnect();
}
