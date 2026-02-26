"use client";

import { Home, CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AssistantInfoProps {
  googleAuthenticated: boolean;
}

const TOOLS = [
  { name: "home_send_command", desc: "Send any freeform command to Google Assistant" },
  { name: "home_turn_on", desc: "Turn on a device or room" },
  { name: "home_turn_off", desc: "Turn off a device or room" },
  { name: "home_set_brightness", desc: "Set light brightness (1–100%)" },
  { name: "home_set_color", desc: "Change smart light color" },
  { name: "home_set_thermostat", desc: "Set thermostat temperature (°F or °C)" },
  { name: "home_query", desc: "Ask about device state (e.g. 'is the light on?')" },
];

const EXAMPLE_COMMANDS = [
  "turn on the bedroom lights",
  "set the kitchen lights to 40%",
  "turn off all lights",
  "set the thermostat to 70 degrees",
  "set the lamp to warm white",
  "is the living room light on?",
];

export function AssistantInfo({ googleAuthenticated }: AssistantInfoProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Home className="h-5 w-5 text-primary" />
            <CardTitle>Google Home</CardTitle>
          </div>
          <Badge variant={googleAuthenticated ? "success" : "warning"}>
            {googleAuthenticated ? "Authenticated" : "Not authenticated"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-sm">
            {googleAuthenticated ? (
              <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 text-destructive shrink-0" />
            )}
            <span className={googleAuthenticated ? "text-foreground" : "text-muted-foreground"}>
              Google account connected via Assistant SDK
            </span>
          </div>

          {!googleAuthenticated && (
            <a href="/setup" className="text-xs text-primary hover:underline">
              Complete setup →
            </a>
          )}

          <div className="rounded-md border border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
            Controls <strong className="text-foreground">any device</strong> in your Google Home —
            lights, switches, plugs, thermostats, fans, TVs, locks — via the Google Assistant
            Embedded API. Works exactly like speaking to a Google Home speaker.
          </div>

          <div className="border-t border-border pt-4">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              MCP tools ({TOOLS.length})
            </p>
            <div className="flex flex-col gap-1.5">
              {TOOLS.map((tool) => (
                <div key={tool.name} className="flex items-start gap-2 text-xs">
                  <code className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-primary">
                    {tool.name}
                  </code>
                  <span className="text-muted-foreground">{tool.desc}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <p className="text-xs font-medium text-muted-foreground mb-2">Example commands</p>
            <div className="flex flex-wrap gap-1.5">
              {EXAMPLE_COMMANDS.map((cmd) => (
                <span
                  key={cmd}
                  className="rounded-full border border-border bg-muted/30 px-2.5 py-1 text-xs text-muted-foreground"
                >
                  &ldquo;{cmd}&rdquo;
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <a
              href="https://developers.google.com/assistant/sdk/overview"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Assistant SDK Docs
              <ExternalLink className="h-3 w-3" />
            </a>
            <a
              href="https://console.cloud.google.com/apis/library/embeddedassistant.googleapis.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Enable API
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
