import * as React from "react";
import { CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import { MpesaPaymentFields } from "./MpesaPaymentFields.tsx";
import { JengaCardPaymentFields } from "./JengaCardPaymentFields.tsx";
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
  getStorefrontJengaPaymentStatus,
  initiateStorefrontJengaCheckout,
  initiateStorefrontStkPush,
  queryStorefrontStkPush,
  submitJengaPaymentForm,
  type StorefrontCartQuoteRequest,
  type StorefrontJengaCustomer,
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

function validateJengaCustomer(
  customer: StorefrontJengaCustomer,
): Partial<Record<keyof StorefrontJengaCustomer, string>> {
  const errors: Partial<Record<keyof StorefrontJengaCustomer, string>> = {};
  if (!customer.customerFirstName.trim()) errors.customerFirstName = "Required";
  if (!customer.customerLastName.trim()) errors.customerLastName = "Required";
  if (!customer.customerEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.customerEmail)) {
    errors.customerEmail = "Valid email required";
  }
  if (customer.customerPhone.replace(/\D/g, "").length < 10) {
    errors.customerPhone = "Valid phone required";
  }
  if (!customer.customerAddress.trim()) errors.customerAddress = "Required";
  if (!customer.customerPostalCodeZip.trim()) errors.customerPostalCodeZip = "Required";
  if (!/^[A-Z]{2}$/.test(customer.countryCode)) errors.countryCode = "Use KE etc.";
  return errors;
}

interface StorefrontPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storefrontToken: string;
  defaultPhone: string;
  totalAmount: number;
  cart: StorefrontCartQuoteRequest;
  customerPrefill?: Partial<StorefrontJengaCustomer>;
  onPaymentSuccess: (checkoutRequestId: string) => Promise<void>;
}

export function StorefrontPaymentDialog({
  open,
  onOpenChange,
  storefrontToken,
  defaultPhone,
  totalAmount,
  cart,
  customerPrefill,
  onPaymentSuccess,
}: StorefrontPaymentDialogProps) {
  const [paymentMethod, setPaymentMethod] = React.useState<string | null>("mpesa");
  const [phoneNumber, setPhoneNumber] = React.useState(defaultPhone);
  const [phoneError, setPhoneError] = React.useState("");
  const [accountReference] = React.useState(() => generateAccountReference());
  const [phase, setPhase] = React.useState<"form" | "waiting" | "creating" | "redirecting">(
    "form",
  );
  const [paymentError, setPaymentError] = React.useState<string | null>(null);
  const [isPolling, setIsPolling] = React.useState(false);
  const [jengaCustomer, setJengaCustomer] = React.useState<StorefrontJengaCustomer>({
    customerFirstName: "",
    customerLastName: "",
    customerEmail: "",
    customerPhone: defaultPhone,
    customerAddress: "",
    customerPostalCodeZip: "",
    countryCode: "KE",
  });
  const [jengaErrors, setJengaErrors] = React.useState<
    Partial<Record<keyof StorefrontJengaCustomer, string>>
  >({});
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
      setJengaCustomer({
        customerFirstName: customerPrefill?.customerFirstName || "",
        customerLastName: customerPrefill?.customerLastName || "",
        customerEmail: customerPrefill?.customerEmail || "",
        customerPhone: customerPrefill?.customerPhone || defaultPhone,
        customerAddress: customerPrefill?.customerAddress || "",
        customerPostalCodeZip: customerPrefill?.customerPostalCodeZip || "",
        countryCode: customerPrefill?.countryCode || "KE",
      });
      setJengaErrors({});
    }
    return () => {
      stopPolling();
    };
  }, [open, defaultPhone, customerPrefill, stopPolling]);

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
        cart,
      });
      toast.message(res.message ?? "Check your phone for the M-Pesa prompt.");
      startPolling(res.checkoutRequestId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to initiate payment.";
      setPaymentError(msg);
      toast.error(msg);
    }
  };

  const handleCardPay = async () => {
    setPaymentError(null);
    const errors = validateJengaCustomer(jengaCustomer);
    setJengaErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast.error("Please complete billing details for card payment");
      return;
    }

    setPhase("redirecting");
    try {
      const res = await initiateStorefrontJengaCheckout({
        storefrontToken,
        cart,
        customer: {
          ...jengaCustomer,
          customerPhone: formatMpesaPhone(jengaCustomer.customerPhone),
        },
        returnOrigin: window.location.origin,
        returnPath: `${window.location.pathname || "/cart"}`,
      });
      // Persist token/ref so return from Jenga can resume order creation
      sessionStorage.setItem(
        "storefront_jenga_checkout",
        JSON.stringify({
          storefrontToken,
          orderReference: res.orderReference,
          cart,
        }),
      );
      submitJengaPaymentForm(res.checkoutUrl, res.paymentData);
    } catch (err) {
      setPhase("form");
      const msg = err instanceof Error ? err.message : "Failed to start card payment.";
      setPaymentError(msg);
      toast.error(msg);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneNumber(e.target.value);
    if (phoneError) setPhoneError("");
  };

  const isWaiting =
    phase === "waiting" || phase === "creating" || phase === "redirecting" || isPolling;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (isWaiting) return;
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-lg gap-0 p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle>Complete payment</DialogTitle>
          <DialogDescription>
            Pay {fmtKes(totalAmount)} to finish your order.
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
                    <img
                      src="/mpesa.png"
                      alt="M-Pesa"
                      className="h-full w-full object-contain"
                    />
                  }
                  title="M-Pesa"
                  description="Pay instantly with STK Push on your phone"
                />
              }
            >
              <PaymentMethodContent>
                {isWaiting && paymentMethod === "mpesa" ? (
                  <div className="py-8 flex flex-col items-center text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                    <p className="text-sm font-medium text-foreground">
                      {phase === "creating"
                        ? "Payment confirmed  creating your order…"
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

            <PaymentMethodOption
              value="card"
              trigger={
                <PaymentMethodTrigger
                  icon={<CreditCard className="h-7 w-7 text-foreground" />}
                  title="Card"
                  description="Pay securely with Visa, Mastercard and more"
                />
              }
            >
              <PaymentMethodContent>
                {phase === "redirecting" && paymentMethod === "card" ? (
                  <div className="py-8 flex flex-col items-center text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                    <p className="text-sm font-medium text-foreground">
                      Redirecting to secure card payment…
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <JengaCardPaymentFields
                      value={jengaCustomer}
                      onChange={setJengaCustomer}
                      errors={jengaErrors}
                      disabled={isWaiting}
                    />
                    <div className="flex justify-end pt-1">
                      <Button onClick={() => void handleCardPay()} className="min-w-[140px]">
                        Pay with Card
                      </Button>
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

/** Resume after Jenga redirect: poll status then create order. */
export async function resumeStorefrontJengaCheckout(params: {
  storefrontToken: string;
  orderReference: string;
  onSuccess: (orderReference: string) => Promise<void>;
}): Promise<void> {
  const maxAttempts = 45;
  for (let i = 0; i < maxAttempts; i++) {
    const status = await getStorefrontJengaPaymentStatus({
      storefrontToken: params.storefrontToken,
      orderReference: params.orderReference,
    });
    if (status.status === "SUCCESS") {
      await params.onSuccess(params.orderReference);
      return;
    }
    if (status.status === "FAILED" || status.status === "CANCELLED") {
      throw new Error(status.failureReason || "Card payment was not completed.");
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error(
    "Payment is taking longer than expected. If you were charged, contact support with your reference.",
  );
}
