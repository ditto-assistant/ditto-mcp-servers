"use client";

import { useState } from "react";
import { Home, ExternalLink, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

interface StepDeviceAccessProps {
  saveConfig: (patch: Record<string, unknown>) => Promise<void>;
  onNext: () => void;
}

const INSTRUCTIONS = [
  {
    step: 1,
    text: "Go to the Device Access Console at console.nest.google.com/device-access.",
  },
  {
    step: 2,
    text: "Accept the terms of service and complete the one-time registration (requires Google account).",
  },
  {
    step: 3,
    text: 'Click "Create project" and give it a name (e.g. "Ditto Home").',
  },
  {
    step: 4,
    text: "Enter your OAuth 2.0 Client ID from the previous step when prompted.",
  },
  {
    step: 5,
    text: "Enable events if you want real-time device notifications (optional for basic control).",
  },
  {
    step: 6,
    text: "Copy the Project ID (format: enterprise/xxxxx) — paste just the xxxxx part below.",
  },
];

export function StepDeviceAccess({ saveConfig, onNext }: StepDeviceAccessProps) {
  const [projectId, setProjectId] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const handleContinue = async () => {
    if (!projectId.trim()) {
      setError("Device Access Project ID is required");
      return;
    }
    setError("");
    setSaving(true);
    try {
      await saveConfig({ deviceAccess: { projectId: projectId.trim() } });
      onNext();
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Home className="h-5 w-5 text-primary" />
          <CardTitle>Device Access Project</CardTitle>
        </div>
        <CardDescription>
          The Google Device Access Console grants your app permission to talk to Nest thermostats,
          cameras, and doorbells via the Smart Device Management API.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-5">
          <div className="rounded-md border border-border">
            <button
              type="button"
              onClick={() => setShowInstructions(!showInstructions)}
              className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
            >
              <span>How to create a Device Access project</span>
              {showInstructions ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
            {showInstructions && (
              <div className="border-t border-border px-4 py-3">
                <ol className="flex flex-col gap-2.5">
                  {INSTRUCTIONS.map((item) => (
                    <li key={item.step} className="flex gap-3 text-sm text-muted-foreground">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-foreground">
                        {item.step}
                      </span>
                      <span>{item.text}</span>
                    </li>
                  ))}
                </ol>
                <div className="mt-3 pt-3 border-t border-border">
                  <a
                    href="https://console.nest.google.com/device-access"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    Open Device Access Console
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            )}
          </div>

          <Input
            label="Device Access Project ID"
            description="Found in the Device Access Console. Example: a1b2c3d4-e5f6-7890-abcd-ef1234567890"
            placeholder="a1b2c3d4-e5f6-7890-abcd-ef1234567890"
            value={projectId}
            onChange={(e) => {
              setProjectId(e.target.value);
              if (error) setError("");
            }}
            error={error}
          />

          <div className="rounded-md border border-warning/25 bg-warning/10 px-4 py-3 text-sm text-warning">
            <strong>Note:</strong> The Device Access program requires accepting Google&apos;s terms
            and may require a one-time fee at{" "}
            <a
              href="https://console.nest.google.com/device-access"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              console.nest.google.com/device-access
            </a>
            .
          </div>

          <div className="flex items-center justify-between pt-2">
            <a
              href="https://console.nest.google.com/device-access"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Device Access Console
              <ExternalLink className="h-3 w-3" />
            </a>
            <Button onClick={handleContinue} loading={saving}>
              Continue
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
