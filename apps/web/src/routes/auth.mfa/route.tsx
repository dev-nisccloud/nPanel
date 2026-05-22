"use client";

import { Globe } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/sonner";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { APP_CONFIG } from "@/config/app-config";
import { apiUrl } from "@/lib/auth-client";
import { redirectToTarget } from "@/lib/auth-redirect";
import { OtpExpiryCountdown } from "@/components/otp-expiry-countdown";

type MfaStatus = {
  required: boolean;
  verified: boolean;
  enabled?: boolean;
  setupRequired?: boolean;
};

export default function MfaVerifyPage() {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [mfaMode, setMfaMode] = useState<"LOGIN" | "SETUP">("LOGIN");
  const [otpExpiresAt, setOtpExpiresAt] = useState<string | null>(null);
  const hasBootstrappedRef = useRef(false);

  useEffect(() => {
    if (hasBootstrappedRef.current) return;
    hasBootstrappedRef.current = true;

    const bootstrap = async () => {
      try {
        const statusRes = await fetch(apiUrl("/api/auth/mfa/status"), {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });

        if (!statusRes.ok) {
          const data = (await statusRes.json().catch(() => null)) as { error?: string } | null;
          throw new Error(data?.error || "Failed to fetch MFA status");
        }

        const statusData = (await statusRes.json()) as MfaStatus;
        if (!statusData.required || (!statusData.setupRequired && statusData.verified)) {
          await redirectToTarget();
          return;
        }

        const mode = statusData.setupRequired ? "SETUP" : "LOGIN";
        setMfaMode(mode);
        await sendCode(mode);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Could not initialize two-factor verification.";
        toast.error("MFA error", { description: message });
      } finally {
        setIsLoading(false);
      }
    };

    void bootstrap();
  }, []);

  const sendCode = async (intent: "LOGIN" | "SETUP" = "LOGIN") => {
    try {
      setIsSendingCode(true);
      const res = await fetch(apiUrl("/api/auth/mfa/challenge"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intent }),
      });

      const data = (await res.json().catch(() => null)) as
        | { error?: string; expiresAt?: string }
        | null;
      if (!res.ok) {
        throw new Error(data?.error || "Failed to send verification code");
      }
      if (data?.expiresAt) {
        setOtpExpiresAt(data.expiresAt);
      }

      toast.success(
        intent === "SETUP" ? "Setup code sent" : "Verification code sent",
        {
          description:
            intent === "SETUP"
              ? "Confirm this code to activate two-factor authentication."
              : "Check your email inbox for your 6-digit code.",
        },
      );
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to send verification code";
      toast.error("Could not send code", { description: message });
    } finally {
      setIsSendingCode(false);
    }
  };

  const isCodeComplete = /^\d{6}$/.test(code.trim());

  const verifyCode = async () => {
    const normalized = code.trim();
    if (!/^\d{6}$/.test(normalized)) {
      toast.error("Invalid code", { description: "Please enter a valid 6-digit code." });
      return;
    }

    try {
      setIsSubmitting(true);
      const statusRes = await fetch(apiUrl("/api/auth/mfa/status"), {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      const statusData = (await statusRes.json().catch(() => null)) as MfaStatus | null;
      const intent: "LOGIN" | "SETUP" = statusData?.setupRequired ? "SETUP" : "LOGIN";

      const res = await fetch(apiUrl("/api/auth/mfa/verify"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: normalized, intent }),
      });

      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        throw new Error(data?.error || "Verification failed");
      }

      toast.success(intent === "SETUP" ? "MFA setup complete" : "Verification successful");
      await redirectToTarget();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Invalid verification code.";
      toast.error("Verification failed", { description: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center space-y-4 p-8">
            <Spinner variant="ellipsis" className="text-primary" />
            <p className="text-sm text-muted-foreground">Preparing verification…</p>
          </div>
        ) : (
          <>
            <div className="space-y-2 text-center">
              <h1 className="text-3xl font-medium">Verify your account</h1>
              <p className="text-sm text-muted-foreground">
                Enter the 6-digit code sent to your email.
              </p>
            </div>

            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (!isCodeComplete || isSubmitting || isSendingCode) return;
                void verifyCode();
              }}
            >
              <OtpExpiryCountdown expiresAt={otpExpiresAt} />
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                maxLength={6}
                placeholder="123456"
                autoComplete="one-time-code"
                autoFocus
                aria-invalid={code.length > 0 && !isCodeComplete}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={!isCodeComplete || isSubmitting || isSendingCode}
              >
                {isSubmitting ? "Verifying..." : "Verify code"}
              </Button>
              <div className="text-center">
                <button
                  type="button"
                  className="text-sm text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
                  onClick={() => {
                    void sendCode(mfaMode);
                  }}
                  disabled={isSubmitting || isSendingCode}
                >
                  {isSendingCode ? "Sending..." : "Resend code"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>

      <div className="absolute top-5 flex w-full justify-end px-10">
        <div className="text-muted-foreground text-sm">
          <Link className="text-foreground" to="/auth/login">
            Back to Login
          </Link>
        </div>
      </div>

      <div className="absolute bottom-5 flex w-full justify-between px-10">
        <div className="text-sm">{APP_CONFIG.copyright}</div>
        <div className="flex items-center gap-1 text-sm">
          <Globe className="size-4 text-muted-foreground" />
          ENG
        </div>
      </div>
    </>
  );
}
