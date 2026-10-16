"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/sonner";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { OtpExpiryCountdown } from "@/components/otp-expiry-countdown";
import {
  fetchMfaStatus,
  mfaIntentFromStatus,
  mfaVerificationRequired,
  sendMfaChallenge,
  verifyMfaCode,
  type MfaIntent,
} from "@/lib/mfa-auth";
import { captureEvent } from "@/lib/posthog";

type MfaVerifyStepProps = {
  /** When true, checks status and sends OTP on mount (standalone /auth/mfa page). */
  bootstrapOnMount?: boolean;
  /** When set, skips status fetch and sends OTP immediately (post-login handoff). */
  initialIntent?: MfaIntent;
  onBack?: () => void;
  onVerified: () => void | Promise<void>;
};

export function MfaVerifyStep({
  bootstrapOnMount = false,
  initialIntent,
  onBack,
  onVerified,
}: MfaVerifyStepProps) {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(bootstrapOnMount);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [mfaMode, setMfaMode] = useState<MfaIntent>(initialIntent ?? "LOGIN");
  const [otpExpiresAt, setOtpExpiresAt] = useState<string | null>(null);
  const hasBootstrappedRef = useRef(false);
  const hasSentInitialCodeRef = useRef(false);

  const sendCode = useCallback(
    async (intent: MfaIntent, options?: { silent?: boolean }) => {
      try {
        setIsSendingCode(true);
        const expiresAt = await sendMfaChallenge(intent);
        if (expiresAt) {
          setOtpExpiresAt(expiresAt);
        }

        if (!options?.silent) {
          toast.success(intent === "SETUP" ? "Setup code sent" : "Verification code sent", {
            description:
              intent === "SETUP"
                ? "Confirm this code to activate two-factor authentication."
                : "Check your email inbox for your 6-digit code.",
          });
        }
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Failed to send verification code";
        toast.error("Could not send code", { description: message });
        throw error;
      } finally {
        setIsSendingCode(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (initialIntent && !hasSentInitialCodeRef.current) {
      hasSentInitialCodeRef.current = true;
      setMfaMode(initialIntent);
      void sendCode(initialIntent, { silent: true }).catch(() => undefined);
      return;
    }

    if (!bootstrapOnMount || hasBootstrappedRef.current) return;
    hasBootstrappedRef.current = true;

    const bootstrap = async () => {
      try {
        const status = await fetchMfaStatus();
        if (!mfaVerificationRequired(status)) {
          await onVerified();
          return;
        }

        const mode = mfaIntentFromStatus(status);
        setMfaMode(mode);
        await sendCode(mode, { silent: true });
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
  }, [bootstrapOnMount, initialIntent, onVerified, sendCode]);

  const isCodeComplete = /^\d{6}$/.test(code.trim());

  const verifyCode = async () => {
    const normalized = code.trim();
    if (!/^\d{6}$/.test(normalized)) {
      toast.error("Invalid code", { description: "Please enter a valid 6-digit code." });
      return;
    }

    try {
      setIsSubmitting(true);
      await verifyMfaCode(normalized, mfaMode);
      if (mfaMode === "SETUP") {
        captureEvent("mfa_enabled");
      } else {
        captureEvent("user_logged_in", { method: "mfa" });
      }
      toast.success(mfaMode === "SETUP" ? "MFA setup complete" : "Verification successful");
      await onVerified();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Invalid verification code.";
      toast.error("Verification failed", { description: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 p-8">
        <Spinner variant="ellipsis" className="text-primary" />
        <p className="text-sm text-muted-foreground">Preparing verification…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-xl font-medium">Verify your account</h1>
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

      {onBack ? (
        <div className="text-center text-sm">
          <button
            type="button"
            className="text-primary hover:underline"
            onClick={onBack}
          >
            Back to login
          </button>
        </div>
      ) : null}
    </div>
  );
}
