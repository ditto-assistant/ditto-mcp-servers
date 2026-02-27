import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	serverExternalPackages: [
		"@modelcontextprotocol/sdk",
		"@ngrok/ngrok",
		"@ditto-mcp/tunnel",
		"@ngrok/ngrok-darwin-arm64",
		"@ngrok/ngrok-linux-x64-gnu",
		"@ngrok/ngrok-win32-x64-msvc",
		"@grpc/grpc-js",
		"@grpc/proto-loader",
	],
};

export default nextConfig;
