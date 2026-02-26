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

/**
 * Send a text command to Google Assistant via the Embedded gRPC API.
 * Works with any device in your Google Home — lights, switches, plugs,
 * thermostats, etc. — just like speaking to a Google Home speaker.
 */
export async function sendAssistantCommand(
  auth: Auth.OAuth2Client,
  command: string,
): Promise<AssistResult> {
  const { token } = await auth.getAccessToken();
  if (!token) throw new Error("Failed to obtain access token");

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
          device_id: "ditto-mcp-server",
          device_model_id: "ditto-mcp-model",
        },
        screen_out_config: {
          screen_mode: "PLAYING",
        },
      },
    });

    call.end();
  });
}
