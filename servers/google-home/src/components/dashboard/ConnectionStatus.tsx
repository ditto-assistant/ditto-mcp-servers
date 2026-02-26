"use client";

import { useState } from "react";
import { Wifi, WifiOff, Copy, Check, Power, Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { copyToClipboard, formatDuration } from "@/lib/utils";

interface ConnectionStatusProps {
  connected: boolean;
  tunnelUrl: string;
  bearerToken: string;
  uptime: number;
  onTunnelStart: () => void;
}

export function ConnectionStatus({
  connected,
  tunnelUrl,
  bearerToken,
  uptime,
  onTunnelStart,
}: ConnectionStatusProps) {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState("");

  const handleCopyUrl = async () => {
    if (await copyToClipboard(tunnelUrl)) {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  const handleCopyToken = async () => {
    if (await copyToClipboard(bearerToken)) {
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  const handleStartTunnel = async () => {
    setStarting(true);
    setStartError("");
    try {
      const res = await fetch("/api/status", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Server responded with ${res.status}`);
      }
      onTunnelStart();
    } catch (err) {
      setStartError(err instanceof Error ? err.message : "Failed to start tunnel");
    } finally {
      setStarting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {connected ? (
              <Wifi className="h-5 w-5 text-success" />
            ) : (
              <WifiOff className="h-5 w-5 text-muted-foreground" />
            )}
            <CardTitle>Connection</CardTitle>
          </div>
          <Badge variant={connected ? "success" : "outline"}>
            {connected ? "Connected" : "Disconnected"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          {connected && uptime > 0 && (
            <p className="text-xs text-muted-foreground">
              Uptime: {formatDuration(uptime)}
            </p>
          )}

          {connected && tunnelUrl && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Tunnel URL</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-md border border-border bg-background px-3 py-2 overflow-hidden">
                  <code className="text-sm font-mono text-accent truncate block">{tunnelUrl}</code>
                </div>
                <Button variant="outline" size="sm" onClick={handleCopyUrl}>
                  {copiedUrl ? (
                    <Check className="h-3.5 w-3.5 text-success" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </div>
          )}

          {bearerToken && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Bearer Token</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-md border border-border bg-background px-3 py-2">
                  <code className="text-sm font-mono text-muted-foreground">
                    {bearerToken.slice(0, 8)}••••••••••••••••••••••••••••••••••••••••••••••••••
                  </code>
                </div>
                <Button variant="outline" size="sm" onClick={handleCopyToken}>
                  {copiedToken ? (
                    <Check className="h-3.5 w-3.5 text-success" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Add this as the Bearer token when connecting in Ditto.
              </p>
            </div>
          )}

          {startError && (
            <p className="text-xs text-destructive">{startError}</p>
          )}

          {!connected && (
            <Button onClick={handleStartTunnel} loading={starting} className="w-full">
              {starting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Power className="h-4 w-4" />
              )}
              Start Tunnel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
