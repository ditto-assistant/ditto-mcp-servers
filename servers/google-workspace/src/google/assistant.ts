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

const DEVICE_ID = "ditto-mcp-device";
const ASSISTANT_API = "https://embeddedassistant.googleapis.com";

// Cache per project so we only register once per server lifetime
const registeredModels = new Map<string, string>(); // projectId → modelId

/**
 * Extract the GCP project number from an OAuth2 client ID.
 * Client IDs have the format: {project_number}-{hash}.apps.googleusercontent.com
 * Used as a fallback when the user hasn't configured their string project ID.
 */
function extractProjectNumber(clientId: string): string | null {
  const match = clientId.match(/^(\d+)-/);
  return match ? match[1] : null;
}

/**
 * Ensure a device model is registered in the user's GCP project.
 * Uses GET-first to avoid duplicate registration errors.
 * Returns the model ID to use in gRPC calls.
 */
async function ensureDeviceModel(
  token: string,
  projectId: string,
): Promise<string> {
  const cached = registeredModels.get(projectId);
  if (cached) return cached;

  // Model ID must be globally unique — prefix with project ID
  const modelId = `${projectId}-ditto-mcp`;
  const baseUrl = `${ASSISTANT_API}/v1alpha2/projects/${projectId}/deviceModels`;
  const modelUrl = `${baseUrl}/${modelId}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
  const payload = {
    device_model_id: modelId,
    project_id: projectId,
    device_type: "action.devices.types.LIGHT",
    manifest: {
      manufacturer: "Ditto",
      productName: "Ditto MCP Assistant",
      deviceDescription: "Ditto MCP smart home controller",
    },
  };

  console.log(`[assistant] checking device model: GET ${modelUrl}`);

  // Check if model already exists
  const getRes = await fetch(modelUrl, { headers });
  console.log(`[assistant] GET device model status: ${getRes.status}`);
  if (getRes.ok) {
    registeredModels.set(projectId, modelId);
    return modelId;
  }

  console.log(`[assistant] creating device model: POST ${baseUrl}`);
  console.log(`[assistant] payload: ${JSON.stringify(payload)}`);

  // Create it
  const postRes = await fetch(baseUrl, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  const postBody = await postRes.text().catch(() => "");
  console.log(`[assistant] POST device model status: ${postRes.status}`);
  console.log(`[assistant] POST device model response: ${postBody}`);

  if (postRes.ok) {
    registeredModels.set(projectId, modelId);
    return modelId;
  }

  // Fall back to the model ID anyway so the gRPC call runs
  console.warn(`[assistant] device model registration failed, proceeding anyway`);
  registeredModels.set(projectId, modelId);
  return modelId;
}

/**
 * Send a text command to Google Assistant via the Embedded gRPC API.
 * Works with any device in your Google Home — lights, switches, plugs,
 * thermostats, etc. — just like speaking to a Google Home speaker.
 *
 * @param auth           Authenticated OAuth2 client
 * @param command        Natural language command, e.g. "turn on the bedroom lights"
 * @param oauthClientId  OAuth2 client ID (used to extract project number as fallback)
 * @param gcpProjectId   GCP string project ID (e.g. "homeassistant-436204") — preferred
 */
const GRPC_TIMEOUT_MS = 15_000;

export async function sendAssistantCommand(
  auth: Auth.OAuth2Client,
  command: string,
  oauthClientId?: string,
  gcpProjectId?: string,
): Promise<AssistResult> {
  console.log(`[assistant] command: "${command}"`);

  const { token } = await auth.getAccessToken();
  if (!token) throw new Error("Failed to obtain access token");

  let deviceModelId = "ditto-mcp-assistant";
  const projectId = gcpProjectId?.trim() || extractProjectNumber(oauthClientId ?? "");
  if (projectId) {
    deviceModelId = await ensureDeviceModel(token, projectId);
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
    let settled = false;
    const settle = (fn: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      fn();
    };

    const timer = setTimeout(() => {
      settle(() => {
        console.error(`[assistant] gRPC call timed out after ${GRPC_TIMEOUT_MS}ms`);
        call.cancel();
        reject(new Error(`Google Assistant gRPC call timed out after ${GRPC_TIMEOUT_MS / 1000}s — the Embedded Assistant API may not be responding for this project.`));
      });
    }, GRPC_TIMEOUT_MS);

    const call = client.Assist();
    let responseText = "";

    call.on("data", (response: Record<string, unknown>) => {
      const dialogOut = response.dialog_state_out as Record<string, unknown> | undefined;
      const deviceAction = response.device_action as Record<string, unknown> | undefined;

      if (dialogOut?.supplemental_display_text) {
        responseText = dialogOut.supplemental_display_text as string;
      }
      if (deviceAction?.device_request_json) {
        console.log("[assistant] device action:", deviceAction.device_request_json);
      }
    });

    call.on("status", (status: grpc.StatusObject) => {
      if (status.code !== grpc.status.OK && !settled) {
        console.error(`[assistant] gRPC error: code=${status.code} details="${status.details}"`);
        settle(() => reject(new Error(`Google Assistant gRPC error (code ${status.code}): ${status.details}`)));
      }
    });

    call.on("end", () => {
      console.log(`[assistant] command complete: "${command}" → "${responseText || "(no text response)"}"`);
      settle(() =>
        resolve({
          success: true,
          command,
          response: responseText || "Command sent to Google Home.",
        }),
      );
    });

    call.on("error", (err: Error & { code?: number; details?: string }) => {
      console.error(`[assistant] gRPC error: code=${err.code} message="${err.message}"`);
      settle(() => reject(new Error(`Google Assistant error: ${err.message}`)));
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
          device_model_id: deviceModelId,
        },
        screen_out_config: {
          screen_mode: "PLAYING",
        },
      },
    });
    call.end();
  });
}
