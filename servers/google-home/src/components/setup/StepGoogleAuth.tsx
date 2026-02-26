"use client";

import { useState } from "react";
import { LogIn, CheckCircle2, XCircle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

interface StepGoogleAuthProps {
  onNext: () => void;
}

export function StepGoogleAuth({ onNext }: StepGoogleAuthProps) {
  const [status, setStatus] = useState<"idle" | "pending" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const startAuth = async () => {
    setStatus("pending");
    setErrorMsg("");
    try {
      const checkRes = await fetch("/api/config");
      if (!checkRes.ok) throw new Error("Config not saved yet");
      const config = await checkRes.json();
      if (!config?.google?.clientId) {
        throw new Error("OAuth credentials not saved. Go back to step 1.");
      }
      window.location.href = "/api/google/auth";
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Failed to start auth flow");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <LogIn className="h-5 w-5 text-primary" />
          <CardTitle>Sign in with Google</CardTitle>
        </div>
        <CardDescription>
          Authorize this server to access your Google Home / Nest devices via the Smart Device
          Management API. You&apos;ll be redirected to Google&apos;s consent screen.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-5">
          <div className="rounded-md border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Permissions requested:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                <code className="text-xs">sdm.service</code> — read and control Nest devices
              </li>
            </ul>
          </div>

          {status === "success" && (
            <div className="flex items-center gap-2 text-sm text-success">
              <CheckCircle2 className="h-4 w-4" />
              Successfully authenticated!
            </div>
          )}

          {status === "error" && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <XCircle className="h-4 w-4" />
              {errorMsg}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <Button onClick={startAuth} loading={status === "pending"}>
              <LogIn className="h-4 w-4" />
              Sign in with Google
            </Button>

            <Button variant="outline" onClick={onNext}>
              Already done
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
