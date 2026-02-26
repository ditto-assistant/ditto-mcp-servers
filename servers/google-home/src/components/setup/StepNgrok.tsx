"use client";

import { useState } from "react";
import { ExternalLink, ChevronRight, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

interface StepNgrokProps {
  saveConfig: (patch: Record<string, unknown>) => Promise<void>;
  onNext: () => void;
}

export function StepNgrok({ saveConfig, onNext }: StepNgrokProps) {
  const [authtoken, setAuthtoken] = useState("");
  const [domain, setDomain] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleContinue = async () => {
    if (!authtoken.trim()) {
      setError("ngrok auth token is required");
      return;
    }
    setError("");
    setSaving(true);
    try {
      await saveConfig({
        ngrok: {
          authtoken: authtoken.trim(),
          ...(domain.trim() ? { domain: domain.trim() } : {}),
        },
      });
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
          <Globe className="h-5 w-5 text-primary" />
          <CardTitle>ngrok Tunnel</CardTitle>
        </div>
        <CardDescription>
          ngrok creates a secure public tunnel so Ditto can reach your local server. A free account
          is all you need.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-5">
          <Input
            label="Auth Token"
            description="Your ngrok authentication token"
            placeholder="2xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            type="password"
            value={authtoken}
            onChange={(e) => {
              setAuthtoken(e.target.value);
              if (error) setError("");
            }}
            error={error}
          />

          <Input
            label="Reserved Domain (optional)"
            description="If you have a reserved ngrok domain, enter it for a stable URL"
            placeholder="your-domain.ngrok-free.app"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
          />

          <div className="flex items-center justify-between pt-2">
            <a
              href="https://dashboard.ngrok.com/get-started/your-authtoken"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Get your auth token at dashboard.ngrok.com
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
