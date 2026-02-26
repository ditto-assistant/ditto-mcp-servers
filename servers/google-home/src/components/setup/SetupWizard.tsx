"use client";

import { useState, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Stepper } from "@/components/ui/stepper";
import { StepGoogleOAuth } from "./StepGoogleOAuth";
import { StepGoogleAuth } from "./StepGoogleAuth";
import { StepNgrok } from "./StepNgrok";
import { StepLaunch } from "./StepLaunch";

const STEPS = ["Google OAuth", "Sign In", "ngrok", "Launch"];

export function SetupWizard() {
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const step = searchParams.get("step");
    if (step) setCurrentStep(Number(step));
  }, [searchParams]);

  const saveConfig = useCallback(async (patch: Record<string, unknown>) => {
    setSaving(true);
    try {
      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error("Failed to save config");
    } finally {
      setSaving(false);
    }
  }, []);

  const goNext = useCallback(() => {
    setCurrentStep((s) => Math.min(s + 1, STEPS.length));
  }, []);

  const goBack = useCallback(() => {
    setCurrentStep((s) => Math.max(s - 1, 1));
  }, []);

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <StepGoogleOAuth saveConfig={saveConfig} onNext={goNext} />;
      case 2:
        return <StepGoogleAuth onNext={goNext} />;
      case 3:
        return <StepNgrok saveConfig={saveConfig} onNext={goNext} />;
      case 4:
        return <StepLaunch />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-xl font-semibold mb-1">Setup Wizard</h2>
        <p className="text-sm text-muted-foreground">
          Configure your Google Home MCP server for Ditto in a few steps.
        </p>
      </div>

      <Stepper steps={STEPS} currentStep={currentStep} />

      <div className="min-h-[360px]">{renderStep()}</div>

      <div className="flex items-center justify-between border-t border-border pt-4">
        <Button
          variant="ghost"
          size="md"
          onClick={goBack}
          disabled={currentStep === 1 || saving}
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>

        {currentStep < STEPS.length && (
          <Button variant="outline" size="md" onClick={goNext} disabled={saving}>
            Skip
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
