import * as React from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { MpesaPaymentFields } from "./MpesaPaymentFields.tsx";
import {
  MpesaPayButton,
  PaymentMethodAccordion,
  PaymentMethodContent,
  PaymentMethodOption,
  PaymentMethodTrigger,
} from "./PaymentMethodAccordion.tsx";
import {
  formatMpesaPhone,
  generateAccountReference,
  initiateStorefrontStkPush,
  queryStorefrontStkPush,
} from "@/lib/storefront-checkout-api.ts";
import {
  getMpesaUserFriendlyError,
  isMpesaTerminalResultCode,
  MPESA_POLL_INTERVAL_MS,
  MPESA_POLL_MAX_ATTEMPTS,
  MPESA_PROCESSING_CODES,
  parseStorefrontStkQueryResponse,
} from "@/lib/mpesa-payment-polling.ts";

function fmtKes(amount: number) {
  return `KES ${amount.toLocaleString("en-KE", { minimumFractionDigits: 0 })}`;
}

interface StorefrontPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storefrontToken: string;
  defaultPhone: string;
  totalAmount: number;
  planId?: string;
  billingCycle: "MONTHLY" | "YEARLY";
  onPaymentSuccess: (checkoutRequestId: string) => Promise<void>;
}

export function StorefrontPaymentDialog({
  open,
  onOpenChange,
  storefrontToken,
  defaultPhone,
  totalAmount,
  planId,
  billingCycle,
  onPaymentSuccess,
}: StorefrontPaymentDialogProps) {
  const [paymentMethod, setPaymentMethod] = React.useState<string | null>("mpesa");
  const [phoneNumber, setPhoneNumber] = React.useState(defaultPhone);
  const [phoneError, setPhoneError] = React.useState("");
  const [accountReference] = React.useState(() => generateAccountReference());
  const [phase, setPhase] = React.useState<"form" | "waiting" | "creating">("form");
  const [paymentError, setPaymentError] = React.useState<string | null>(null);
  const [isPolling, setIsPolling] = React.useState(false);
  const pollingIntervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const pollingQuickRetryRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const terminalStateDetectedRef = React.useRef(false);
  const pollAttemptsRef = React.useRef(0);

  const stopPolling = React.useCallback(() => {
    if (pollingQuickRetryRef.current !== null) {
      clearTimeout(pollingQuickRetryRef.current);
      pollingQuickRetryRef.current = null;
    }
    if (pollingIntervalRef.current !== null) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  React.useEffect(() => {
    if (open) {
      setPhoneNumber(defaultPhone);
      setPhase("form");
      setPaymentError(null);
      setPhoneError("");
      setPaymentMethod("mpesa");
      terminalStateDetectedRef.current = false;
      pollAttemptsRef.current = 0;
    }
    return () => {
      stopPolling();
    };
  }, [open, defaultPhone, stopPolling]);

  const handlePaymentFailure = React.useCallback(
    (msg: string) => {
      stopPolling();
      terminalStateDetectedRef.current = true;
      setPhase("form");
      setPaymentError(msg);
      toast.error(msg);
    },
    [stopPolling],
  );

  const handlePaymentSuccess = React.useCallback(
    async (checkoutRequestId: string) => {
      stopPolling();
      terminalStateDetectedRef.current = true;
      setPhase("creating");
      setPaymentError(null);
      try {
        await onPaymentSuccess(checkoutRequestId);
        toast.success("Payment completed successfully!");
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to create order.";
        setPhase("form");
        setPaymentError(msg);
        toast.error(msg);
      }
    },
    [onPaymentSuccess, stopPolling],
  );

  const startPolling = React.useCallback(
    (checkoutRequestId: string) => {
      stopPolling();
      terminalStateDetectedRef.current = false;
      pollAttemptsRef.current = 0;
      setIsPolling(true);
      setPhase("waiting");
      setPaymentError(null);

      const poll = async (): Promise<boolean> => {
        if (terminalStateDetectedRef.current) return true;

        try {
          const res = await queryStorefrontStkPush({
            storefrontToken,
            checkoutRequestId,
          });
          const { resultCode, resultDesc } = parseStorefrontStkQueryResponse(res);
          if (resultCode === null) return false;
          if (MPESA_PROCESSING_CODES.has(resultCode)) return false;

          if (resultCode === 0) {
            void handlePaymentSuccess(checkoutRequestId);
            return true;
          }

          if (isMpesaTerminalResultCode(resultCode)) {
            handlePaymentFailure(getMpesaUserFriendlyError(resultCode, resultDesc));
            return true;
          }

          handlePaymentFailure(
            getMpesaUserFriendlyError(resultCode, resultDesc),
          );
          return true;
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          const isAuthError =
            message.includes("UNAUTHORIZED") ||
            message.includes("Authentication") ||
            message.includes("session") ||
            message.includes("Session expired");
          if (isAuthError) {
            handlePaymentFailure(
              "Your checkout session may have expired. Please restart checkout.",
            );
            return true;
          }
          return false;
        }
      };

      // First poll immediately, quick retry at 1s, then every MPESA_POLL_INTERVAL_MS (dashboard pattern)
      poll().then((finished) => {
        if (finished) return;

        pollAttemptsRef.current = 1;
        pollingQuickRetryRef.current = setTimeout(async () => {
          pollingQuickRetryRef.current = null;
          if (terminalStateDetectedRef.current) return;

          pollAttemptsRef.current += 1;
          const done = await poll();
          if (done) return;

          const id = setInterval(async () => {
            if (terminalStateDetectedRef.current) return;

            pollAttemptsRef.current += 1;
            const finishedAgain = await poll();
            if (
              finishedAgain ||
              pollAttemptsRef.current >= MPESA_POLL_MAX_ATTEMPTS
            ) {
              stopPolling();
              if (
                !finishedAgain &&
                pollAttemptsRef.current >= MPESA_POLL_MAX_ATTEMPTS
              ) {
                handlePaymentFailure(
                  "Payment is taking longer than expected. Please check your M-Pesa or try again.",
                );
              }
            }
          }, MPESA_POLL_INTERVAL_MS);
          pollingIntervalRef.current = id;
        }, 1000);
      });
    },
    [storefrontToken, stopPolling, handlePaymentFailure, handlePaymentSuccess],
  );

  const handlePay = async () => {
    setPaymentError(null);
    const trimmed = phoneNumber.trim();
    if (!trimmed || trimmed.replace(/\D/g, "").length < 9) {
      setPhoneError("Enter a valid M-Pesa phone number");
      return;
    }
    setPhoneError("");

    try {
      const res = await initiateStorefrontStkPush({
        storefrontToken,
        phone: formatMpesaPhone(trimmed),
        planId: planId || undefined,
        billingCycle,
        clientAmount: totalAmount,
      });
      toast.message(res.message ?? "Check your phone for the M-Pesa prompt.");
      startPolling(res.checkoutRequestId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to initiate payment.";
      setPaymentError(msg);
      toast.error(msg);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneNumber(e.target.value);
    if (phoneError) setPhoneError("");
  };

  const isWaiting = phase === "waiting" || phase === "creating" || isPolling;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (isWaiting) return;
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-lg gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle>Complete payment</DialogTitle>
          <DialogDescription>
            Pay {fmtKes(totalAmount)} via M-Pesa to finish your order.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-5">
          {paymentError && (
            <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {paymentError}
            </div>
          )}

          <PaymentMethodAccordion value={paymentMethod} onValueChange={setPaymentMethod}>
            <PaymentMethodOption
              value="mpesa"
              trigger={
                <PaymentMethodTrigger
                  icon={
                    <span
                      className="text-lg font-extrabold"
                      style={{ color: "#43B02A" }}
                    >
                      M
                    </span>
                  }
                  title="M-Pesa"
                  description="Pay instantly with STK Push on your phone"
                />
              }
            >
              <PaymentMethodContent>
                {isWaiting ? (
                  <div className="py-8 flex flex-col items-center text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                    <p className="text-sm font-medium text-foreground">
                      {phase === "creating"
                        ? "Payment confirmed — creating your order…"
                        : "Waiting for payment confirmation…"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2 max-w-xs">
                      Enter your M-Pesa PIN on your phone when prompted. Wrong PIN or
                      cancellation will show here immediately.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <MpesaPaymentFields
                      currency="KES"
                      phoneNumber={phoneNumber}
                      onPhoneNumberChange={handlePhoneChange}
                      phoneError={phoneError}
                      amount={String(totalAmount)}
                      amountHelperText={`Order total: ${fmtKes(totalAmount)}`}
                      accountReference={accountReference}
                      accountRefHelperText={`Reference (${accountReference.length}/12)`}
                    />
                    <div className="flex justify-end pt-1">
                      <MpesaPayButton onClick={handlePay} className="min-w-[140px]">
                        Pay with M-Pesa
                      </MpesaPayButton>
                    </div>
                  </div>
                )}
              </PaymentMethodContent>
            </PaymentMethodOption>
          </PaymentMethodAccordion>
        </div>
      </DialogContent>
    </Dialog>
  );
}
