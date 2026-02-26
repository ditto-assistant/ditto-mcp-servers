"use client";

import { Home, CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface DeviceAccessInfoProps {
  projectId: string;
  configured: boolean;
  googleAuthenticated: boolean;
}

const TOOLS = [
  { name: "home_list_devices", desc: "List all Nest devices and their current state" },
  { name: "home_get_device", desc: "Get detailed info for a specific device" },
  { name: "home_list_structures", desc: "List home structures" },
  { name: "home_list_rooms", desc: "List rooms in a structure" },
  { name: "home_get_thermostat_status", desc: "Get temperature, mode, HVAC status" },
  { name: "home_set_thermostat_mode", desc: "Set mode: HEAT / COOL / HEATCOOL / OFF" },
  { name: "home_set_thermostat_eco", desc: "Enable or disable Eco mode" },
  { name: "home_set_temperature", desc: "Set heat/cool setpoints (°F → °C auto-converted)" },
  { name: "home_control_fan", desc: "Turn fan on/off with optional duration" },
];

export function DeviceAccessInfo({
  projectId,
  configured,
  googleAuthenticated,
}: DeviceAccessInfoProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Home className="h-5 w-5 text-primary" />
            <CardTitle>Device Access</CardTitle>
          </div>
          <Badge variant={configured && googleAuthenticated ? "success" : "warning"}>
            {configured && googleAuthenticated ? "Ready" : "Setup required"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-sm">
              {googleAuthenticated ? (
                <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 text-destructive shrink-0" />
              )}
              <span className={googleAuthenticated ? "text-foreground" : "text-muted-foreground"}>
                Google account authenticated
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              {configured ? (
                <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 text-destructive shrink-0" />
              )}
              <span className={configured ? "text-foreground" : "text-muted-foreground"}>
                Device Access project configured
                {projectId && (
                  <code className="ml-2 text-xs bg-muted px-1.5 py-0.5 rounded">
                    {projectId.slice(0, 8)}…
                  </code>
                )}
              </span>
            </div>
          </div>

          {(!configured || !googleAuthenticated) && (
            <a href="/setup" className="text-xs text-primary hover:underline">
              Complete setup →
            </a>
          )}

          <div className="border-t border-border pt-4">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Available MCP tools ({TOOLS.length})
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

          <div className="flex items-center gap-3 pt-1">
            <a
              href="https://console.nest.google.com/device-access"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Device Access Console
              <ExternalLink className="h-3 w-3" />
            </a>
            <a
              href="https://developers.google.com/nest/device-access/reference/rest"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              SDM API Reference
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
