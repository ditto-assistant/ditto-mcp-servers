"use client";

import { useState } from "react";
import { Settings, ExternalLink, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

interface StepGoogleOAuthProps {
  saveConfig: (patch: Record<string, unknown>) => Promise<void>;
  onNext: () => void;
}

const INSTRUCTIONS = [
  { step: 1, text: "Go to the Google Cloud Console and select your project (homeassistant-436204 or any project)." },
  {
    step: 2,
    text: "Enable the Google Assistant API: APIs & Services → Library → search 'Google Assistant API' → Enable.",
  },
  {
    step: 3,
    text: 'Configure the OAuth consent screen: APIs & Services → OAuth consent screen. Select "External", fill in the app name, and add your Google account as a test user.',
  },
  {
    step: 4,
    text: 'Under Scopes, click "Add or Remove Scopes" and add: https://www.googleapis.com/auth/assistant-sdk-prototype',
  },
  {
    step: 5,
    text: 'Create credentials: APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID → Desktop app (or Web application).',
  },
  {
    step: 6,
    text: "If Web application: add http://localhost:3101/api/google/callback as an authorized redirect URI.",
  },
  { step: 7, text: "Copy the Client ID and Client Secret below." },
];

export function StepGoogleOAuth({ saveConfig, onNext }: StepGoogleOAuthProps) {
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [errors, setErrors] = useState<{ clientId?: string; clientSecret?: string }>({});
  const [saving, setSaving] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const validate = () => {
    const e: typeof errors = {};
    if (!clientId.trim()) e.clientId = "Client ID is required";
    if (!clientSecret.trim()) e.clientSecret = "Client Secret is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleContinue = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await saveConfig({ google: { clientId: clientId.trim(), clientSecret: clientSecret.trim() } });
      onNext();
    } catch {
      setErrors({ clientId: "Failed to save. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          <CardTitle>Google OAuth Credentials</CardTitle>
        </div>
        <CardDescription>
          Create OAuth 2.0 credentials in the Google Cloud Console to allow access to the Google
          Assistant API. This enables Ditto to control any Google Home device on your account.
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
              <span>How to get OAuth credentials</span>
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
                    href="https://console.cloud.google.com/apis/credentials"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    Open Google Cloud Console
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            )}
          </div>

          <Input
            label="Client ID"
            placeholder="xxxxxxxxxxxx.apps.googleusercontent.com"
            value={clientId}
            onChange={(e) => {
              setClientId(e.target.value);
              if (errors.clientId) setErrors((p) => ({ ...p, clientId: undefined }));
            }}
            error={errors.clientId}
          />

          <Input
            label="Client Secret"
            type="password"
            placeholder="GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx"
            value={clientSecret}
            onChange={(e) => {
              setClientSecret(e.target.value);
              if (errors.clientSecret) setErrors((p) => ({ ...p, clientSecret: undefined }));
            }}
            error={errors.clientSecret}
          />

          <div className="flex items-center justify-between pt-2">
            <a
              href="https://console.cloud.google.com/apis/credentials"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Google Cloud Console
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
