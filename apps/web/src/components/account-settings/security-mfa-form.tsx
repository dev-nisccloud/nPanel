"use client";

import { useEffect, useState } from "react";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Shield, Mail, CheckCircle2 } from "lucide-react";
import { apiUrl } from "@/lib/auth-client";
import { captureEvent } from "@/lib/posthog";
import { OtpExpiryCountdown } from "@/components/otp-expiry-countdown";

type MfaStatusResponse = {
  required: boolean;
  verified: boolean;
  enabled?: boolean;
  setupRequired?: boolean;
};

export function SecurityMfaForm() {
  const [isLoading, setIsLoading] = useState(true);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isSetupMode, setIsSetupMode] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [otpExpiresAt, setOtpExpiresAt] = useState<string | null>(null);
  const [isDisableMode, setIsDisableMode] = useState(false);
  const [disableOtpCode, setDisableOtpCode] = useState("");

  const loadStatus = async () => {
    const res = await fetch(apiUrl("/api/auth/mfa/status"), {
      method: "GET",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) {
      throw new Error("Failed to load MFA status");
    }
    const data = (await res.json()) as MfaStatusResponse;
    setIsEnabled(Boolean(data.enabled ?? data.required));
  };

  useEffect(() => {
    const run = async () => {
      try {
        await loadStatus();
      } catch {
        toast.error("Failed to load security settings");
      } finally {
        setIsLoading(false);
      }
    };
    void run();
  }, []);

  const sendSetupCode = async () => {
    try {
      setIsSending(true);
      const res = await fetch(apiUrl("/api/auth/mfa/challenge"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intent: "SETUP" }),
      });
      const data = (await res.json().catch(() => null)) as
        | { error?: string; expiresAt?: string }
        | null;
      if (!res.ok) {
        throw new Error(data?.error || "Failed to send OTP code");
      }
      if (data?.expiresAt) {
        setOtpExpiresAt(data.expiresAt);
      }
      toast.success("OTP sent", { description: "Check your email for the verification code." });
      setIsSetupMode(true);
    } catch (error: unknown) {
      toast.error("Could not send OTP", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsSending(false);
    }
  };

  const verifySetupCode = async () => {
    if (!/^\d{6}$/.test(otpCode.trim())) {
      toast.error("Invalid code", { description: "Enter a valid 6-digit OTP." });
      return;
    }

    try {
      setIsVerifying(true);
      const res = await fetch(apiUrl("/api/auth/mfa/verify"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: otpCode.trim(), intent: "SETUP" }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        throw new Error(data?.error || "Failed to verify OTP");
      }
      captureEvent("mfa_enabled");
      toast.success("Two-factor authentication enabled");
      setIsEnabled(true);
      setIsSetupMode(false);
      setOtpCode("");
      setOtpExpiresAt(null);
    } catch (error: unknown) {
      toast.error("Verification failed", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const sendDisableCode = async () => {
    try {
      setIsSending(true);
      const res = await fetch(apiUrl("/api/auth/mfa/challenge"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intent: "DISABLE" }),
      });
      const data = (await res.json().catch(() => null)) as
        | { error?: string; expiresAt?: string }
        | null;
      if (!res.ok) {
        throw new Error(data?.error || "Failed to send disable OTP");
      }
      if (data?.expiresAt) {
        setOtpExpiresAt(data.expiresAt);
      }
      toast.success("Disable code sent", {
        description: "Enter OTP to confirm disabling two-factor authentication.",
      });
      setIsDisableMode(true);
    } catch (error: unknown) {
      toast.error("Could not send disable OTP", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsSending(false);
    }
  };

  const verifyDisableCode = async () => {
    if (!/^\d{6}$/.test(disableOtpCode.trim())) {
      toast.error("Invalid code", { description: "Enter a valid 6-digit OTP." });
      return;
    }

    try {
      setIsUpdating(true);
      const res = await fetch(apiUrl("/api/auth/mfa/verify"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: disableOtpCode.trim(), intent: "DISABLE" }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        throw new Error(data?.error || "Failed to disable MFA");
      }
      captureEvent("mfa_disabled");
      toast.success("Two-factor authentication disabled");
      setIsEnabled(false);
      setIsSetupMode(false);
      setOtpCode("");
      setIsDisableMode(false);
      setDisableOtpCode("");
      setOtpExpiresAt(null);
    } catch (error: unknown) {
      toast.error("Could not disable MFA", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const showOtpPanel = isSetupMode || isDisableMode;

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
            <Shield className="h-4 w-4 text-primary" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium">Two-factor authentication</p>
              <Badge
                variant={isEnabled ? "default" : "secondary"}
                className="h-5 px-1.5 text-[10px]"
              >
                {isEnabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {isEnabled
                ? "A one-time code is required when you sign in."
                : "Add an email OTP step to protect your account at login."}
            </p>
          </div>
        </div>

        {!showOtpPanel && (
          <div className="shrink-0 sm:pt-0.5">
            {!isEnabled ? (
              <Button size="sm" onClick={() => void sendSetupCode()} disabled={isLoading || isSending}>
                <Mail className="mr-1.5 h-3.5 w-3.5" />
                {isSending ? "Sending..." : "Enable"}
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => void sendDisableCode()}
                disabled={isSending || isUpdating}
              >
                {isSending ? "Sending..." : "Disable"}
              </Button>
            )}
          </div>
        )}
      </div>

      {isSetupMode && (
        <div className="space-y-3 border-t bg-muted/20 px-4 py-3">
          <p className="text-xs text-muted-foreground">
            Enter the 6-digit code sent to your email to activate MFA.
          </p>
          <OtpExpiryCountdown expiresAt={otpExpiresAt} />
          <Input
            className="h-9 max-w-xs"
            placeholder="6-digit code"
            inputMode="numeric"
            maxLength={6}
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => void verifySetupCode()} disabled={isVerifying || isSending}>
              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
              {isVerifying ? "Verifying..." : "Verify & activate"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => void sendSetupCode()}
              disabled={isSending || isVerifying}
            >
              {isSending ? "Resending..." : "Resend code"}
            </Button>
          </div>
        </div>
      )}

      {isEnabled && isDisableMode && (
        <div className="space-y-3 border-t bg-muted/20 px-4 py-3">
          <p className="text-xs text-muted-foreground">
            Enter the code sent to your email to confirm disabling MFA.
          </p>
          <OtpExpiryCountdown expiresAt={otpExpiresAt} />
          <Input
            className="h-9 max-w-xs"
            placeholder="6-digit code"
            inputMode="numeric"
            maxLength={6}
            value={disableOtpCode}
            onChange={(e) => setDisableOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => void verifyDisableCode()} disabled={isUpdating || isSending}>
              {isUpdating ? "Disabling..." : "Confirm disable"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setIsDisableMode(false);
                setDisableOtpCode("");
              }}
              disabled={isUpdating || isSending}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
