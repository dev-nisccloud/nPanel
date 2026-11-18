import * as React from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog.tsx";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp.tsx";
import { sendCheckoutEmailCode, verifyCheckoutEmailCode } from "@/lib/storefront-checkout-api.ts";
import { Turnstile, TURNSTILE_SITE_KEY } from "@/components/Turnstile.tsx";

const RESEND_COOLDOWN_SEC = 30;

type CheckoutEmailCodeDialogProps = {
  open: boolean;
  email: string;
  onOpenChange: (open: boolean) => void;
  onVerified: (emailProof: string) => void;
};

export function CheckoutEmailCodeDialog({ open, email, onOpenChange, onVerified }: CheckoutEmailCodeDialogProps) {
  const [code, setCode] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [verifying, setVerifying] = React.useState(false);
  const [resending, setResending] = React.useState(false);
  const [cooldown, setCooldown] = React.useState(RESEND_COOLDOWN_SEC);
  const [captchaToken, setCaptchaToken] = React.useState<string | null>(null);
  const [captchaResetKey, setCaptchaResetKey] = React.useState(0);

  React.useEffect(() => {
    if (!open) return;
    setCode("");
    setError(null);
    setCooldown(RESEND_COOLDOWN_SEC);
  }, [open, email]);

  React.useEffect(() => {
    if (!open || cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [open, cooldown]);

  const verify = async (value: string) => {
    if (value.length !== 6 || verifying) return;
    setVerifying(true);
    setError(null);
    try {
      const { emailProof } = await verifyCheckoutEmailCode(email, value);
      onVerified(emailProof);
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't check that code. Try again.");
      setCode("");
    } finally {
      setVerifying(false);
    }
  };

  const resend = async () => {
    setResending(true);
    setError(null);
    try {
      await sendCheckoutEmailCode(email, captchaToken);
      setCooldown(RESEND_COOLDOWN_SEC);
      toast.success("New code sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't send a new code. Try again.");
    } finally {
      setCaptchaResetKey((value) => value + 1);
      setResending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm your email</DialogTitle>
          <DialogDescription>
            We sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>. It expires in 10
            minutes. If you already have a Nisc Cloud account, we sent a sign-in link instead.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-3 py-2">
          <InputOTP
            maxLength={6}
            value={code}
            onChange={(value) => {
              const digits = value.replace(/\D/g, "");
              setCode(digits);
              if (digits.length === 6) void verify(digits);
            }}
            disabled={verifying}
            inputMode="numeric"
            autoComplete="one-time-code"
            aria-label="6-digit code"
            aria-invalid={Boolean(error)}
          >
            <InputOTPGroup>
              {Array.from({ length: 6 }, (_, index) => (
                <InputOTPSlot key={index} index={index} className="h-12 w-11 text-lg" aria-invalid={Boolean(error)} />
              ))}
            </InputOTPGroup>
          </InputOTP>
          <p role="status" aria-live="polite" className="min-h-5 text-center text-sm">
            {verifying ? (
              <span className="text-muted-foreground">Checking…</span>
            ) : error ? (
              <span className="text-destructive">{error}</span>
            ) : null}
          </p>
          {cooldown <= 0 && <Turnstile onToken={setCaptchaToken} resetKey={captchaResetKey} />}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          <button
            type="button"
            onClick={() => void resend()}
            disabled={cooldown > 0 || resending || (Boolean(TURNSTILE_SITE_KEY) && !captchaToken)}
            className="text-sm font-medium text-foreground underline underline-offset-4 disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
          >
            {resending ? "Sending…" : cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
          </button>
          <button
            type="button"
            onClick={() => void verify(code)}
            disabled={code.length !== 6 || verifying}
            className="inline-flex h-11 items-center justify-center rounded-lg bg-foreground px-5 text-sm font-semibold text-background transition-colors hover:bg-foreground/90 disabled:opacity-50"
          >
            Confirm and continue
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
