import { homedir } from "node:os";
import { join } from "node:path";
import { mkdir, readFile, writeFile, access } from "node:fs/promises";

const BASE_DIR = join(homedir(), ".ditto-mcp-servers");

export interface GoogleHomeConfig {
	google: {
		clientId: string;
		clientSecret: string;
	};
	ngrok: {
		authtoken: string;
		domain?: string;
	};
	server: {
		port: number;
	};
}

export interface GoogleHomeTokens {
	access_token: string;
	refresh_token: string;
	scope: string;
	token_type: string;
	expiry_date: number;
}

export interface GoogleWorkspaceConfig {
	google: {
		clientId: string;
		clientSecret: string;
	};
	ngrok: {
		authtoken: string;
		domain?: string;
	};
	services: {
		gmail: boolean;
		calendar: boolean;
		docs: boolean;
		sheets: boolean;
		drive: boolean;
	};
	server: {
		port: number;
	};
}

export interface GoogleTokens {
	access_token: string;
	refresh_token: string;
	scope: string;
	token_type: string;
	expiry_date: number;
}

export interface ServerState {
	ngrokUrl?: string;
	lastStarted?: string;
}

export class ConfigStore {
	private dir: string;

	constructor(serverName: string) {
		this.dir = join(BASE_DIR, serverName);
	}

	get configDir(): string {
		return this.dir;
	}

	async ensureDir(): Promise<void> {
		await mkdir(this.dir, { recursive: true, mode: 0o700 });
	}

	async load<T>(filename: string): Promise<T | null> {
		try {
			const filepath = join(this.dir, filename);
			const data = await readFile(filepath, "utf-8");
			return JSON.parse(data) as T;
		} catch {
			return null;
		}
	}

	async save<T>(filename: string, data: T): Promise<void> {
		await this.ensureDir();
		const filepath = join(this.dir, filename);
		await writeFile(filepath, JSON.stringify(data, null, 2), {
			mode: 0o600,
		});
	}

	async exists(filename: string): Promise<boolean> {
		try {
			await access(join(this.dir, filename));
			return true;
		} catch {
			return false;
		}
	}

	async delete(filename: string): Promise<void> {
		const { unlink } = await import("node:fs/promises");
		try {
			await unlink(join(this.dir, filename));
		} catch {
			// File doesn't exist, that's fine
		}
	}
}

export function createConfigStore(serverName: string): ConfigStore {
	return new ConfigStore(serverName);
}
