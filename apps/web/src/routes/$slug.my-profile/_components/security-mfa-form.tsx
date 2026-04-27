"use client";

import { useEffect, useState } from "react";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Shield, Mail, CheckCircle2 } from "lucide-react";
import { apiUrl } from "@/lib/auth-client";
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Two-factor authentication
        </CardTitle>
        <CardDescription>
          Protect your account with email OTP verification during sign-in.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center gap-2">
          <Badge variant={isEnabled ? "default" : "secondary"}>
            {isEnabled ? "Enabled" : "Disabled"}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {isEnabled ? "Your account requires OTP at login." : "Enable MFA to secure your account."}
          </span>
        </div>

        {!isEnabled && !isSetupMode && (
          <Button onClick={() => void sendSetupCode()} disabled={isLoading || isSending}>
            <Mail className="mr-2 h-4 w-4" />
            {isSending ? "Sending test OTP..." : "Enable with test OTP"}
          </Button>
        )}

        {isSetupMode && (
          <div className="space-y-3 rounded-md border p-4">
            <div className="text-sm text-muted-foreground">
              We sent a test OTP to your email. Enter it below to activate MFA.
            </div>
            <OtpExpiryCountdown expiresAt={otpExpiresAt} />
            <Input
              placeholder="Enter 6-digit OTP"
              inputMode="numeric"
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            />
            <div className="flex gap-2">
              <Button onClick={() => void verifySetupCode()} disabled={isVerifying || isSending}>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                {isVerifying ? "Verifying..." : "Verify and activate"}
              </Button>
              <Button
                variant="outline"
                onClick={() => void sendSetupCode()}
                disabled={isSending || isVerifying}
              >
                {isSending ? "Resending..." : "Resend OTP"}
              </Button>
            </div>
          </div>
        )}

        {isEnabled && !isDisableMode && (
          <Button variant="outline" onClick={() => void sendDisableCode()} disabled={isSending || isUpdating}>
            {isSending ? "Sending disable OTP..." : "Disable MFA"}
          </Button>
        )}

        {isEnabled && isDisableMode && (
          <div className="space-y-3 rounded-md border p-4">
            <div className="text-sm text-muted-foreground">
              Enter the OTP sent to your email to confirm disabling MFA.
            </div>
            <OtpExpiryCountdown expiresAt={otpExpiresAt} />
            <Input
              placeholder="Enter 6-digit OTP"
              inputMode="numeric"
              maxLength={6}
              value={disableOtpCode}
              onChange={(e) => setDisableOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            />
            <div className="flex gap-2">
              <Button onClick={() => void verifyDisableCode()} disabled={isUpdating || isSending}>
                {isUpdating ? "Disabling..." : "Confirm disable"}
              </Button>
              <Button
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
      </CardContent>
    </Card>
  );
}
