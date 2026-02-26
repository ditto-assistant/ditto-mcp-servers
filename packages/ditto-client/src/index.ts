export interface MCPServer {
	id: string;
	user_id: string;
	name: string;
	description?: string;
	transport: "sse";
	config: {
		url?: string;
		headers?: Record<string, string>;
	};
	enabled: boolean;
	created_at: string;
	updated_at: string;
	last_used_at?: string;
	metadata?: Record<string, unknown>;
}

export interface CreateMCPServerRequest {
	name: string;
	description?: string;
	transport: "sse";
	config: {
		url: string;
		headers?: Record<string, string>;
	};
	enabled: boolean;
	metadata?: Record<string, unknown>;
}

export interface UpdateMCPServerRequest {
	name?: string;
	description?: string;
	config?: {
		url?: string;
		headers?: Record<string, string>;
	};
	enabled?: boolean;
	metadata?: Record<string, unknown>;
}

const ENVIRONMENTS = {
	prod: "https://api.heyditto.ai",
	staging: "https://staging-api.heyditto.ai",
	local: "http://localhost:3400",
} as const;

export type DittoEnv = keyof typeof ENVIRONMENTS;

export class DittoClient {
	private baseUrl: string;
	private apiKey: string;

	constructor(apiKey: string, env: DittoEnv = "prod") {
		this.apiKey = apiKey;
		this.baseUrl = ENVIRONMENTS[env];
	}

	private async request<T>(path: string, options?: RequestInit): Promise<T> {
		const res = await fetch(`${this.baseUrl}${path}`, {
			...options,
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${this.apiKey}`,
				...options?.headers,
			},
		});

		if (!res.ok) {
			const text = await res.text();
			throw new Error(`Ditto API error (${res.status}): ${text}`);
		}

		return res.json() as Promise<T>;
	}

	async listServers(): Promise<MCPServer[]> {
		return this.request<MCPServer[]>("/api/v2/mcp/servers");
	}

	async createServer(req: CreateMCPServerRequest): Promise<MCPServer> {
		return this.request<MCPServer>("/api/v2/mcp/servers", {
			method: "POST",
			body: JSON.stringify(req),
		});
	}

	async getServer(id: string): Promise<MCPServer> {
		return this.request<MCPServer>(`/api/v2/mcp/servers/${id}`);
	}

	async updateServer(id: string, req: UpdateMCPServerRequest): Promise<MCPServer> {
		return this.request<MCPServer>(`/api/v2/mcp/servers/${id}`, {
			method: "PATCH",
			body: JSON.stringify(req),
		});
	}

	async deleteServer(id: string): Promise<void> {
		await this.request(`/api/v2/mcp/servers/${id}`, {
			method: "DELETE",
		});
	}
}

export function createDittoClient(apiKey: string, env: DittoEnv = "prod"): DittoClient {
	return new DittoClient(apiKey, env);
}
