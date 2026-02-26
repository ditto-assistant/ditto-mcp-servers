"use client";

import { useState, useEffect, useCallback } from "react";
import { ConnectionStatus } from "./ConnectionStatus";
import { DeviceAccessInfo } from "./DeviceAccessInfo";

export interface StatusData {
  connected: boolean;
  tunnelUrl: string;
  bearerToken: string;
  uptime: number;
  deviceAccess: {
    projectId: string;
    configured: boolean;
  };
  google: {
    authenticated: boolean;
    expiryDate: number;
  };
}

const EMPTY_STATUS: StatusData = {
  connected: false,
  tunnelUrl: "",
  bearerToken: "",
  uptime: 0,
  deviceAccess: {
    projectId: "",
    configured: false,
  },
  google: {
    authenticated: false,
    expiryDate: 0,
  },
};

export function Dashboard() {
  const [status, setStatus] = useState<StatusData>(EMPTY_STATUS);
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/status");
      if (res.ok) setStatus(await res.json());
    } catch {
      // Silently fail — retry on next poll
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Dashboard</h2>
        <p className="text-sm text-muted-foreground">
          Manage your Google Home MCP server and tunnel connection.
        </p>
      </div>

      <ConnectionStatus
        connected={status.connected}
        tunnelUrl={status.tunnelUrl}
        bearerToken={status.bearerToken}
        uptime={status.uptime}
        onTunnelStart={fetchStatus}
      />

      <DeviceAccessInfo
        projectId={status.deviceAccess.projectId}
        configured={status.deviceAccess.configured}
        googleAuthenticated={status.google.authenticated}
      />
    </div>
  );
}
