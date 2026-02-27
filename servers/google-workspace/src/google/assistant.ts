import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import type { Auth } from "googleapis";
import { join } from "node:path";

// Load the proto file at module init time (relative to the server root)
const PROTO_PATH = join(process.cwd(), "proto/embedded_assistant.proto");

let packageDef: protoLoader.PackageDefinition;
try {
  packageDef = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });
} catch {
  // During Next.js build the cwd may differ — try relative to this file
  const altPath = join(
    new URL(".", import.meta.url).pathname,
    "../../../proto/embedded_assistant.proto",
  );
  packageDef = protoLoader.loadSync(altPath, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });
}

const protoDescriptor = grpc.loadPackageDefinition(packageDef) as Record<
  string,
  unknown
>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AssistantClient = any;

function getAssistantProto(): new (
  address: string,
  creds: grpc.ChannelCredentials,
) => AssistantClient {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ns = (protoDescriptor as any)?.google?.assistant?.embedded?.v1alpha2;
  if (!ns?.EmbeddedAssistant) {
    throw new Error("Failed to load EmbeddedAssistant from proto definition");
  }
  return ns.EmbeddedAssistant;
}

export interface AssistResult {
  success: boolean;
  command: string;
  response: string;
}

const DEVICE_MODEL_ID = "ditto-mcp-assistant";
const DEVICE_ID = "ditto-mcp-device";
const ASSISTANT_API = "https://embeddedassistant.googleapis.com";

// Cache registered project IDs so we only register once per server lifetime
const registeredProjects = new Set<string>();

/**
 * Extract the GCP project number from an OAuth2 client ID.
 * Client IDs have the format: {project_number}-{hash}.apps.googleusercontent.com
 */
function extractProjectNumber(clientId: string): string | null {
  const match = clientId.match(/^(\d+)-/);
  return match ? match[1] : null;
}

/**
 * Register a device model in the user's GCP project via the Device Registration REST API.
 * Safe to call multiple times — a 409 (already exists) is treated as success.
 */
async function ensureDeviceModel(
  token: string,
  projectId: string,
): Promise<void> {
  if (registeredProjects.has(projectId)) return;

  const url = `${ASSISTANT_API}/v1alpha2/projects/${projectId}/deviceModels`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      deviceModelId: DEVICE_MODEL_ID,
      projectId,
      displayName: "Ditto MCP Assistant",
      deviceType: "action.devices.types.PHONE",
    }),
  });

  // 200 = created, 409 = already exists — both are fine
  if (res.ok || res.status === 409) {
    registeredProjects.add(projectId);
    return;
  }

  // Try to list existing models and use the first one
  const listRes = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (listRes.ok) {
    const data = await listRes.json();
    if (Array.isArray(data.deviceModels) && data.deviceModels.length > 0) {
      registeredProjects.add(projectId);
      return;
    }
  }

  // Log but don't throw — the gRPC call will surface any real error
  const body = await res.text().catch(() => "");
  console.warn(
    `[assistant] device model registration returned ${res.status}: ${body}`,
  );
}

/**
 * Send a text command to Google Assistant via the Embedded gRPC API.
 * Works with any device in your Google Home — lights, switches, plugs,
 * thermostats, etc. — just like speaking to a Google Home speaker.
 *
 * @param auth        Authenticated OAuth2 client
 * @param command     Natural language command, e.g. "turn on the bedroom lights"
 * @param oauthClientId  OAuth2 client ID from config (used to derive GCP project number)
 */
export async function sendAssistantCommand(
  auth: Auth.OAuth2Client,
  command: string,
  oauthClientId?: string,
): Promise<AssistResult> {
  const { token } = await auth.getAccessToken();
  if (!token) throw new Error("Failed to obtain access token");

  // Auto-register device model so Google accepts the gRPC request
  if (oauthClientId) {
    const projectId = extractProjectNumber(oauthClientId);
    if (projectId) {
      await ensureDeviceModel(token, projectId);
    }
  }

  const sslCreds = grpc.credentials.createSsl();
  const metaCreds = grpc.credentials.createFromMetadataGenerator((_, cb) => {
    const meta = new grpc.Metadata();
    meta.add("authorization", `Bearer ${token}`);
    cb(null, meta);
  });
  const creds = grpc.credentials.combineChannelCredentials(sslCreds, metaCreds);

  const AssistantProto = getAssistantProto();
  const client = new AssistantProto("embeddedassistant.googleapis.com:443", creds);

  return new Promise<AssistResult>((resolve, reject) => {
    const call = client.Assist();
    let responseText = "";

    call.on("data", (response: Record<string, unknown>) => {
      const out = response.dialog_state_out as
        | Record<string, unknown>
        | undefined;
      if (out?.supplemental_display_text) {
        responseText = out.supplemental_display_text as string;
      }
    });

    call.on("end", () => {
      resolve({
        success: true,
        command,
        response: responseText || "Command sent to Google Home.",
      });
    });

    call.on("error", (err: Error) => {
      reject(new Error(`Google Assistant error: ${err.message}`));
    });

    call.write({
      config: {
        text_query: command,
        audio_out_config: {
          encoding: "LINEAR16",
          sample_rate_hertz: 16000,
          volume_percentage: 100,
        },
        dialog_state_in: {
          language_code: "en-US",
          is_new_conversation: true,
        },
        device_config: {
          device_id: DEVICE_ID,
          device_model_id: DEVICE_MODEL_ID,
        },
        screen_out_config: {
          screen_mode: "PLAYING",
        },
      },
    });

    call.end();
  });
}
