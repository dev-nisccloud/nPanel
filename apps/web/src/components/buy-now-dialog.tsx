"use client";

import * as React from "react";
import { Link } from "react-router";
import { HelpCircle, Check, CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import { Spinner } from "@/components/npanel-ui/spinner";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import { trpc, type RouterInputs } from "@/utils/trpc";
import type { UseMutationResult } from "@tanstack/react-query";
import { toast } from "@/components/ui/sonner";

export interface ServicePlanDetails {
  planId: string;
  planName: string;
  planType: string; // e.g., "HOSTING"
  subType?: string; // e.g., "WEB_HOSTING", "EMAIL_HOSTING"
  price: number;
  currency: string;
  billingCycle: "MONTHLY" | "YEARLY" | "BIENNIALLY";
  /** Required for creating NISC order from payment (product table flow). */
  productId?: string;
}

interface BuyNowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: ServicePlanDetails | null;
  /** When true, show "Connect your domain" step before review (e.g. when opened from hosting/emails) */
  requireDomainStep?: boolean;
  /** Team ID used to load domains for the dropdown (required when requireDomainStep is true) */
  teamId?: string;
  /** When set, show a "Need a domain? Buy one" CTA in the domain step (e.g. `/${teamSlug}/domains`) */
  buyDomainHref?: string;
}

type Step = "domain" | "review" | "payment" | "success" | "error";

/** Validate domain format: hostname with at least one dot, valid chars, TLD 2+ chars */
function isValidDomain(value: string): boolean {
  if (!value || typeof value !== "string") return false;
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return false;
  // One or more labels (alphanumeric + hyphen), dots, TLD at least 2 chars
  return /^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/.test(trimmed);
}

const formatPrice = (price?: number, currency?: string) => {
  if (price === undefined || price === null || isNaN(price) || !isFinite(price)) {
    return "N/A";
  }

  const currencySymbols: Record<string, string> = {
    'USD': '$',
    'KES': 'KSh',
    'EUR': '€',
    'GBP': '£',
    'CAD': 'C$',
    'AUD': 'A$',
    'JPY': '¥',
    'INR': '₹',
    'ZAR': 'R',
    'NGN': '₦',
  };

  const symbol = currencySymbols[currency || 'KES'] || currency || 'KSh';
  
  try {
    const formattedNumber = typeof Intl !== 'undefined' && Intl.NumberFormat
      ? new Intl.NumberFormat('en-US', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(price)
      : price.toFixed(0);
    
    return `${symbol} ${formattedNumber}`;
  } catch (error) {
    console.error('Error formatting price:', error);
    return `${symbol} ${price.toFixed(0)}`;
  }
};

export function BuyNowDialog({
  open,
  onOpenChange,
  plan,
  requireDomainStep = false,
  teamId,
  buyDomainHref,
}: BuyNowDialogProps) {
  const showDomainStep = !!requireDomainStep && !!teamId;
  const initialStep: Step = showDomainStep ? "domain" : "review";

  const [currentStep, setCurrentStep] = React.useState<Step>(initialStep);
  const [couponCode, setCouponCode] = React.useState("");
  const [showCouponInput, setShowCouponInput] = React.useState(false);

  // Domain step state (when requireDomainStep)
  const [manualDomain, setManualDomain] = React.useState("");
  const [selectedDomainId, setSelectedDomainId] = React.useState<string | null>(null);

  const { data: teamDomains = [] } = trpc.domains.getByTeam.useQuery(
    { teamId: teamId ?? "" },
    { enabled: !!teamId && !!requireDomainStep && open }
  );

  const manualDomainValid = manualDomain.trim() ? isValidDomain(manualDomain) : false;
  const selectedDomain = selectedDomainId
    ? teamDomains.find((d) => d.id === selectedDomainId)
    : null;
  const effectiveDomain =
    selectedDomain?.domainName ?? (manualDomainValid ? manualDomain.trim().toLowerCase() : null);
  const canProceedFromDomain = !!effectiveDomain;

  // Payment state
  const [selectedPaymentMethod, setSelectedPaymentMethod] = React.useState<string | null>(null);
  const [mpesaPhoneNumber, setMpesaPhoneNumber] = React.useState("");
  const [paymentAmount, setPaymentAmount] = React.useState<string>("");
  const [accountReference, setAccountReference] = React.useState<string>("");
  
  // Validation errors
  const [accountRefError, setAccountRefError] = React.useState<string>("");
  const [phoneError, setPhoneError] = React.useState<string>("");
  const [amountError, setAmountError] = React.useState<string>("");

  // Payment status
  const [checkoutRequestId, setCheckoutRequestId] = React.useState<string | null>(null);
  const [paymentError, setPaymentError] = React.useState<string | null>(null);
  const [shouldStopPolling, setShouldStopPolling] = React.useState(false);
  const pollingStartTimeRef = React.useRef<number | null>(null);
  const pollingAttemptsRef = React.useRef(0);
  const terminalStateDetectedRef = React.useRef(false);
  const immediateStepRef = React.useRef<Step | null>(null);
  const immediatePaymentErrorRef = React.useRef<string | null>(null);
  const orderCreatedForCheckoutRef = React.useRef<string | null>(null);

  // Calculate pricing using useMemo to ensure proper reactivity
  const pricing = React.useMemo(() => {
    const basePrice = plan?.price || 0;
    const taxes = basePrice * 0.16; // 16% VAT
    const couponDiscount = 0; // TODO: Implement coupon validation
    const subtotal = basePrice - couponDiscount;
    const total = subtotal + taxes;
    const displayCurrency = plan?.currency || "KES";
    
    return { basePrice, taxes, couponDiscount, subtotal, total, displayCurrency };
  }, [plan]);

  // Reset state when dialog opens/closes
  React.useEffect(() => {
    if (open && plan) {
      const first = showDomainStep ? "domain" : "review";
      setCurrentStep(first);
      setManualDomain("");
      setSelectedDomainId(null);
      setCouponCode("");
      setShowCouponInput(false);
      setSelectedPaymentMethod(null);
      setMpesaPhoneNumber("");
      setPaymentAmount("");
      setAccountReference("");
      setAccountRefError("");
      setPhoneError("");
      setAmountError("");
      setCheckoutRequestId(null);
      setPaymentError(null);
      setShouldStopPolling(false);
      pollingStartTimeRef.current = null;
      pollingAttemptsRef.current = 0;
      terminalStateDetectedRef.current = false;
      immediateStepRef.current = null;
      immediatePaymentErrorRef.current = null;
      orderCreatedForCheckoutRef.current = null;

      // Calculate total and set payment amount
      const planPrice = plan.price || 0;
      const taxes = planPrice * 0.16; // 16% VAT
      const total = planPrice + taxes;
      setPaymentAmount(total.toString());
      
      // Generate account reference
      const timestamp = Date.now().toString().slice(-6);
      const planShort = plan.planName.substring(0, 6).toUpperCase().replace(/\s/g, '');
      const ref = `${planShort}${timestamp}`.substring(0, 12);
      setAccountReference(ref);
    }
  }, [open, plan, showDomainStep]);

  // Helper function to get user-friendly error messages
  const getUserFriendlyError = (resultCode: string | number, resultDesc?: string): string => {
    const code = typeof resultCode === "string" ? parseInt(resultCode, 10) : resultCode;
    
    const errorMessages: Record<number, string> = {
      0: "Payment completed successfully",
      1: "Insufficient balance in your M-Pesa account",
      2: "Amount is below the minimum transaction limit",
      3: "Amount exceeds the maximum transaction limit",
      4: "Transaction would exceed your daily transfer limit",
      8: "Transaction would exceed account balance limit",
      17: "Too many requests. Please wait a few minutes and try again",
      1019: "Payment request expired. Please initiate a new payment",
      1025: "Error sending payment request. Please try again",
      1032: "Payment request was cancelled",
      2001: "Incorrect M-Pesa PIN entered. Please try again with the correct PIN",
      2028: "Payment request not permitted. Please contact support",
      8006: "Your M-Pesa account is locked. Please contact M-Pesa customer care",
    };
    
    return errorMessages[code] || resultDesc || `Payment failed with error code ${code}`;
  };

  // Helper function to check if result code is terminal
  const isTerminalResultCode = (resultCode: string | number): boolean => {
    const code = typeof resultCode === "string" ? parseInt(resultCode, 10) : resultCode;
    
    if (isNaN(code)) return false;
    
    const TERMINAL_CODES = new Set([
      0, 1, 2, 3, 4, 8, 17, 1019, 1025, 1032, 2001, 2028, 8006,
    ]);
    
    const PROCESSING_CODES = new Set([1037, 4999]);
    
    if (PROCESSING_CODES.has(code)) return false;
    if (TERMINAL_CODES.has(code)) return true;
    return true;
  };

  // Phone number validation
  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setMpesaPhoneNumber(value);
    
    if (!value) {
      setPhoneError("Phone number is required");
    } else if (value.length < 9) {
      setPhoneError("Phone number must be at least 9 digits");
    } else if (value.length > 12) {
      setPhoneError("Phone number must not exceed 12 digits");
    } else {
      setPhoneError("");
    }
  };

  // Amount validation
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPaymentAmount(value);
    
    const numValue = parseFloat(value);
    if (!value) {
      setAmountError("Amount is required");
    } else if (isNaN(numValue) || numValue <= 0) {
      setAmountError("Amount must be greater than 0");
    } else {
      setAmountError("");
    }
  };

  // Account reference validation
  const handleAccountReferenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^a-zA-Z0-9]/g, '').substring(0, 12);
    setAccountReference(value);
    
    if (!value) {
      setAccountRefError("Account reference is required");
    } else if (value.length < 3) {
      setAccountRefError("Account reference must be at least 3 characters");
    } else {
      setAccountRefError("");
    }
  };

  // M-Pesa STK Push mutation
  const initiateMpesaPayment = trpc.paymentGateway.mpesa.initiateStkPush.useMutation({
    onSuccess: (response) => {
      // Response structure: { success: true, data: { checkoutRequestId, ... } }
      const checkoutId = response.data?.checkoutRequestId;
      if (checkoutId) {
        setCheckoutRequestId(checkoutId);
        immediateStepRef.current = "payment";
        setPaymentError(null);
        startPaymentStatusPolling(checkoutId);
      } else {
        console.error("M-Pesa payment initiated but no checkoutRequestId received:", response);
        toast.error("Payment request sent but failed to get transaction ID. Please try again.");
      }
    },
    onError: (error) => {
      const errorMessage = error.message || "Failed to initiate payment. Please try again.";
      console.error("M-Pesa payment initiation error:", error);
      immediatePaymentErrorRef.current = errorMessage;
      immediateStepRef.current = "error";
      setPaymentError(errorMessage);
      toast.error(errorMessage);
    },
  });

  // Create NISC order from successful payment and enqueue for processing (customer team order)
  type CreateFromPaymentInput = RouterInputs["niscServiceOrders"]["createFromPayment"];
  // @ts-expect-error - tRPC useMutation type instantiation is excessively deep with createFromPayment input
  const createOrderFromPayment = trpc.niscServiceOrders.createFromPayment.useMutation({
    onSuccess: () => {
      toast.success("Order submitted for processing.");
    },
    onError: (err: { message?: string }) => {
      console.error("Create order from payment failed:", err);
      toast.error(err.message || "Order could not be created. Please contact support.");
    },
  }) as UseMutationResult<void, { message?: string }, CreateFromPaymentInput>;

  // When payment step reaches success and we have plan+team+domain, create order and send to processing (once per checkout)
  React.useEffect(() => {
    if (currentStep !== "success" || !checkoutRequestId || !plan?.productId || !teamId) return;
    if (showDomainStep && !effectiveDomain) return;
    if (orderCreatedForCheckoutRef.current === checkoutRequestId) return;

    orderCreatedForCheckoutRef.current = checkoutRequestId;
    const priceStr = String(plan.price ?? 0);
    createOrderFromPayment.mutate({
      checkoutRequestId,
      teamId,
      currency: plan.currency ?? "KES",
      items: [
        {
          productId: plan.productId,
          productPlanId: plan.planId,
          billingCycle: plan.billingCycle,
          primaryDomain: showDomainStep ? effectiveDomain ?? undefined : undefined,
          itemPrice: priceStr,
          itemSubtotal: priceStr,
        },
      ],
    });
  }, [currentStep, checkoutRequestId, plan, teamId, showDomainStep, effectiveDomain, createOrderFromPayment]);

  // Poll payment status — real-time only, no cache
  const queryPaymentStatus = trpc.paymentGateway.mpesa.queryStkPush.useQuery(
    { checkoutRequestId: checkoutRequestId || "" },
    {
      enabled: !!checkoutRequestId && currentStep === "payment" && !shouldStopPolling,
      staleTime: 0,
      gcTime: 0,
      refetchOnMount: "always",
      refetchOnWindowFocus: false,
      refetchInterval: (query) => {
        if (terminalStateDetectedRef.current) {
          return false;
        }
        
        const attempts = pollingAttemptsRef.current;
        if (attempts > 60) {
          const timeoutErrorMessage = "Payment is taking longer than expected. Please check your M-Pesa account or try again.";
          immediatePaymentErrorRef.current = timeoutErrorMessage;
          immediateStepRef.current = "error";
          setPaymentError(timeoutErrorMessage);
          setShouldStopPolling(true);
          return false;
        }
        
        // Check the query data for terminal states
        const response = query.state.data;
        if (response?.data?.resultCode !== undefined && response?.data?.resultCode !== null) {
          const resultCode = response.data.resultCode;
          const numericResultCode = typeof resultCode === "string" ? parseInt(resultCode, 10) : resultCode;
          
          if (!isNaN(numericResultCode) && isTerminalResultCode(numericResultCode)) {
            terminalStateDetectedRef.current = true;
            setShouldStopPolling(true);
            
            if (numericResultCode === 0) {
              immediateStepRef.current = "success";
              setPaymentError(null);
              toast.success("Payment completed successfully!");
              setCurrentStep("success");
            } else {
              const errorMessage = getUserFriendlyError(numericResultCode, response.data.resultDesc);
              immediatePaymentErrorRef.current = errorMessage;
              immediateStepRef.current = "error";
              setPaymentError(errorMessage);
              setCurrentStep("error");
              toast.error(errorMessage);
            }
            return false;
          }
        }
        
        pollingAttemptsRef.current = attempts + 1;
        
        if (attempts < 5) return 2000;
        if (attempts < 15) return 3000;
        if (attempts < 30) return 5000;
        return 10000;
      },
    }
  );

  // Handle query errors via useEffect
  React.useEffect(() => {
    if (queryPaymentStatus.error) {
      const finalErrorMessage = queryPaymentStatus.error.message || "Payment query failed";
      console.error("Payment status query error:", finalErrorMessage);
      immediatePaymentErrorRef.current = finalErrorMessage;
      immediateStepRef.current = "error";
      setPaymentError(finalErrorMessage);
      setCurrentStep("error");
    }
  }, [queryPaymentStatus.error]);

  // Start polling for payment status
  const startPaymentStatusPolling = (checkoutId: string) => {
    setCheckoutRequestId(checkoutId);
    pollingStartTimeRef.current = Date.now();
    pollingAttemptsRef.current = 0;
    terminalStateDetectedRef.current = false;
    setShouldStopPolling(false);
    immediateStepRef.current = "payment";
    immediatePaymentErrorRef.current = null;
  };

  // Handle M-Pesa payment
  const handleMpesaPayment = () => {
    if (!mpesaPhoneNumber || !paymentAmount || !accountReference) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (accountRefError || phoneError || amountError) {
      toast.error("Please fix the errors before proceeding");
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Invalid payment amount");
      return;
    }

    // Format phone number (ensure it starts with 254)
    let formattedPhone = mpesaPhoneNumber.replace(/\D/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.substring(1);
    } else if (!formattedPhone.startsWith('254')) {
      formattedPhone = '254' + formattedPhone;
    }

    const transactionDesc = (`Purchase: ${plan?.planName || 'Service Plan'}`).slice(0, 13);
    initiateMpesaPayment.mutate({
      phoneNumber: formattedPhone,
      amount: amount,
      accountReference: accountReference,
      transactionDesc,
      ...(teamId && { teamId }),
    });
  };

  const handleNext = () => {
    if (currentStep === "domain") {
      setCurrentStep("review");
    } else if (currentStep === "review") {
      setCurrentStep("payment");
      setPaymentAmount(pricing.total.toString());
    }
  };

  const handleBack = () => {
    if (currentStep === "payment") {
      setCurrentStep("review");
    } else if (currentStep === "review" && showDomainStep) {
      setCurrentStep("domain");
    }
  };

  if (!plan) {
    return null;
  }

  const renderStep = () => {
    switch (currentStep) {
      case "domain":
        return (
          <div className="space-y-4">
            <div className="text-center py-2">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Connect your domain
              </h3>
              <p className="text-sm text-muted-foreground">
                Choose a domain to use with this plan, or enter one manually
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="domain-select">Domains owned by your team</Label>
                <Select
                  value={selectedDomainId ?? ""}
                  onValueChange={(v) => {
                    setSelectedDomainId(v || null);
                    setManualDomain("");
                  }}
                >
                  <SelectTrigger id="domain-select" className="w-full">
                    <SelectValue placeholder="Select a domain from your team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teamDomains.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.domainName}
                      </SelectItem>
                    ))}
                    {teamDomains.length === 0 ? (
                      <SelectItem value="__none__" disabled>
                        No domains linked to this team
                      </SelectItem>
                    ) : null}
                  </SelectContent>
                </Select>
              </div>

              <div className="relative flex items-center gap-2 text-sm text-muted-foreground">
                <span className="shrink-0">or</span>
                <span className="h-px flex-1 bg-border" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="manual-domain">Enter domain manually</Label>
                <div className="relative">
                  <Input
                    id="manual-domain"
                    type="text"
                    placeholder="e.g. example.com"
                    value={manualDomain}
                    onChange={(e) => {
                      setManualDomain(e.target.value);
                      setSelectedDomainId(null);
                    }}
                    className={`pr-10 ${
                      manualDomain.trim()
                        ? manualDomainValid
                          ? "border-green-500 focus-visible:ring-green-500"
                          : "border-destructive focus-visible:ring-destructive"
                        : ""
                    }`}
                  />
                  {manualDomain.trim() ? (
                    manualDomainValid ? (
                      <CheckCircle2
                        className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-green-600"
                        aria-hidden
                      />
                    ) : (
                      <XCircle
                        className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-destructive"
                        aria-hidden
                      />
                    )
                  ) : null}
                </div>
                {manualDomain.trim() && !manualDomainValid ? (
                  <p className="text-xs text-destructive">Please enter a valid domain (e.g. example.com)</p>
                ) : manualDomain.trim() && manualDomainValid ? (
                  <p className="text-xs text-green-600">Valid domain</p>
                ) : (
                  <p className="text-xs text-muted-foreground">Enter a domain you own</p>
                )}
              </div>

              {effectiveDomain && (
                <div className="rounded-lg border border-green-500/50 bg-green-500/5 px-3 py-2 text-sm text-foreground">
                  Using domain: <span className="font-medium">{effectiveDomain}</span>
                </div>
              )}

              {buyDomainHref && (
                <p className="text-sm text-muted-foreground pt-2">
                  Need a domain?{" "}
                  <Link
                    to={buyDomainHref}
                    className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                  >
                    Buy one
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </p>
              )}
            </div>
          </div>
        );

      case "review":
        return (
          <div className="space-y-4">
            <div className="text-center py-2">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Complete and Review
              </h3>
              <p className="text-sm text-muted-foreground">
                Review your selection before proceeding to checkout
              </p>
            </div>

            <ScrollArea className="h-[300px] w-full">
              <div className="space-y-4 pr-4">
                {/* Product */}
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-foreground line-clamp-3 break-words">
                        {plan.planName}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {plan.planType}
                        {plan.subType && ` - ${plan.subType.replace(/_/g, ' ')}`}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Billing Cycle: {plan.billingCycle}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-foreground">
                        {formatPrice(pricing.basePrice, pricing.displayCurrency)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <ScrollBar orientation="vertical" />
            </ScrollArea>

            {/* Coupon Code */}
            <div className="space-y-2">
              {!showCouponInput ? (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Coupon code</span>
                  <Button
                    variant="link"
                    className="h-auto p-0 text-primary"
                    onClick={() => setShowCouponInput(true)}
                  >
                    Add
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCouponCode(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowCouponInput(false);
                      setCouponCode("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>

            {/* Taxes & Fees */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Taxes & fees</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>16% VAT tax has been applied according to Kenyan regulations.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <span>{formatPrice(pricing.taxes, pricing.displayCurrency)}</span>
            </div>

            {/* Total */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between font-bold text-lg">
                <span>Total</span>
                <span>{formatPrice(pricing.total, pricing.displayCurrency)}</span>
              </div>
            </div>

            {/* Legal Text */}
            <p className="text-xs text-muted-foreground">
              By checking out, you agree with our{" "}
              <a href="/terms" className="text-primary underline hover:text-primary/80">
                Terms of Service
              </a>{" "}
              and confirm that you have read our{" "}
              <a href="/privacy" className="text-primary underline hover:text-primary/80">
                Privacy Policy
              </a>
              . You can cancel recurring payments at any time.
            </p>
          </div>
        );

      case "payment":
        return (
          <div className="space-y-4">
            <div className="text-center py-2">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Choose Payment Method
              </h3>
              <p className="text-sm text-muted-foreground">
                Select your preferred payment method to complete your purchase
              </p>
            </div>

            <div className="space-y-3">
              <Accordion type="single" collapsible className="w-full" value={selectedPaymentMethod || undefined}>
                <AccordionItem value="mpesa" className="border rounded-lg">
                  <Card className="border-0 shadow-none">
                    <AccordionTrigger
                      className="px-4 py-4 hover:no-underline"
                      onClick={() => setSelectedPaymentMethod(selectedPaymentMethod === "mpesa" ? null : "mpesa")}
                    >
                      <div className="flex items-center gap-4 w-full">
                        <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/20 overflow-hidden">
                          <img src="/mpesa.png" alt="M-Pesa" className="w-full h-full object-contain" />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-semibold text-foreground">M-Pesa</div>
                          <div className="text-sm text-muted-foreground">
                            Secured by Nisc Cloud
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      {(initiateMpesaPayment.isPending || (checkoutRequestId && (immediateStepRef.current === "payment" || currentStep === "payment") && !immediatePaymentErrorRef.current && !paymentError && !shouldStopPolling && !terminalStateDetectedRef.current)) ? (
                        <div className="space-y-4 pt-2">
                          <div className="flex flex-col items-center justify-center py-8">
                            <Spinner variant="ellipsis" size={48} className="mb-4 text-primary" />
                            <p className="text-sm font-medium text-foreground mb-2">
                              {initiateMpesaPayment.isPending 
                                ? "Sending payment request..." 
                                : "Waiting for payment confirmation..."}
                            </p>
                            <p className="text-xs text-muted-foreground text-center">
                              {initiateMpesaPayment.isPending
                                ? "Please wait while we send the payment request to your phone."
                                : "Please complete the payment on your phone. We'll update you once the payment is confirmed."}
                            </p>
                            {checkoutRequestId && (queryPaymentStatus.isFetching || queryPaymentStatus.isLoading) && (
                              <p className="text-xs text-muted-foreground mt-2">
                                Checking payment status...
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4 pt-2">
                          <div className="space-y-2">
                            <label htmlFor="mpesa-phone" className="text-sm font-medium text-foreground">
                              Phone Number <span className="text-destructive">*</span>
                            </label>
                            <Input
                              id="mpesa-phone"
                              placeholder="0712345678 or 254712345678"
                              value={mpesaPhoneNumber}
                              onChange={handlePhoneNumberChange}
                              className={`w-full ${phoneError ? "border-destructive" : ""}`}
                            />
                            {phoneError ? (
                              <p className="text-xs text-destructive">{phoneError}</p>
                            ) : (
                              <p className="text-xs text-muted-foreground">
                                Enter your M-Pesa registered phone number
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <label htmlFor="payment-amount" className="text-sm font-medium text-foreground">
                              Amount ({pricing.displayCurrency}) <span className="text-destructive">*</span>
                            </label>
                            <Input
                              id="payment-amount"
                              type="number"
                              placeholder="Enter amount"
                              value={paymentAmount}
                              onChange={handleAmountChange}
                              className={`w-full ${amountError ? "border-destructive" : ""}`}
                              min="1"
                              step="1"
                            />
                            {amountError ? (
                              <p className="text-xs text-destructive">{amountError}</p>
                            ) : (
                              <p className="text-xs text-muted-foreground">
                                Cart total: {formatPrice(pricing.total, pricing.displayCurrency)} (editable for testing)
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <label htmlFor="account-reference" className="text-sm font-medium text-foreground">
                              Account Reference <span className="text-destructive">*</span>
                            </label>
                            <Input
                              id="account-reference"
                              placeholder="Enter account reference"
                              value={accountReference}
                              onChange={handleAccountReferenceChange}
                              className={`w-full ${accountRefError ? "border-destructive" : ""}`}
                              maxLength={12}
                            />
                            {accountRefError ? (
                              <p className="text-xs text-destructive">{accountRefError}</p>
                            ) : (
                              <p className="text-xs text-muted-foreground">
                                Max 12 characters, alphanumeric only ({accountReference.length}/12)
                              </p>
                            )}
                          </div>

                          <Button
                            onClick={handleMpesaPayment}
                            disabled={
                              initiateMpesaPayment.isPending ||
                              !mpesaPhoneNumber ||
                              !paymentAmount ||
                              !accountReference ||
                              !!accountRefError ||
                              !!phoneError ||
                              !!amountError ||
                              terminalStateDetectedRef.current ||
                              immediateStepRef.current === "error" ||
                              immediateStepRef.current === "success"
                            }
                            className="w-full bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                          >
                            {initiateMpesaPayment.isPending ? "Processing..." : "Pay with M-Pesa"}
                          </Button>
                        </div>
                      )}
                    </AccordionContent>
                  </Card>
                </AccordionItem>
              </Accordion>
            </div>

            {/* Order Summary */}
            <div className="border-t pt-4 mt-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(pricing.subtotal, pricing.displayCurrency)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Taxes & fees</span>
                  <span>{formatPrice(pricing.taxes, pricing.displayCurrency)}</span>
                </div>
                <div className="flex items-center justify-between font-bold text-lg border-t pt-2">
                  <span>Total</span>
                  <span>{formatPrice(pricing.total, pricing.displayCurrency)}</span>
                </div>
              </div>
            </div>
          </div>
        );

      case "success":
        return (
          <div className="space-y-4">
            <div className="text-center py-4">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 mx-auto mb-4">
                <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Payment Successful!
              </h3>
              <p className="text-sm text-muted-foreground">
                Your order has been successfully received
              </p>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="space-y-2">
                <p className="text-sm text-foreground">
                  Your service plan <span className="font-semibold">{plan.planName}</span> will be activated on your dashboard in a few minutes.
                </p>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Order Total</span>
                <span className="font-semibold">{formatPrice(pricing.total, pricing.displayCurrency)}</span>
              </div>
            </div>
          </div>
        );

      case "error":
        const displayError = immediatePaymentErrorRef.current || paymentError || "An error occurred while processing your payment";
        return (
          <div className="space-y-4">
            <div className="text-center py-4">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 mx-auto mb-4">
                <span className="text-2xl text-red-600 dark:text-red-400">✕</span>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Payment Failed
              </h3>
              <p className="text-sm text-muted-foreground">
                {displayError}
              </p>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="space-y-2">
                <p className="text-sm text-foreground">
                  Your payment could not be processed. Please try again or contact support if the issue persists.
                </p>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Order Total</span>
                <span className="font-semibold">{formatPrice(pricing.total, pricing.displayCurrency)}</span>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!grid sm:max-w-[600px] h-[90vh] max-h-[90vh] !flex !flex-col overflow-hidden w-full p-0 gap-0">
        <DialogHeader className="min-w-0 w-full px-6 pt-6 pb-4 flex-shrink-0">
          <DialogTitle className="line-clamp-1 break-words truncate min-w-0 w-full max-w-full">
            Buy {plan.planName}
          </DialogTitle>
          <DialogDescription className="min-w-0 w-full max-w-full">
            {currentStep === "domain" && "Choose or enter the domain to use with this plan"}
            {currentStep === "review" && "Review your order and proceed to checkout"}
            {currentStep === "payment" && "Complete your payment"}
            {currentStep === "success" && "Order Confirmed"}
            {currentStep === "error" && "Payment Failed"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 px-6 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="py-4 min-w-0 w-full pr-4">
              {renderStep()}
            </div>
            <ScrollBar orientation="vertical" />
          </ScrollArea>
        </div>

        <DialogFooter className="gap-2 px-6 pb-6 pt-4 flex-shrink-0 border-t">
          {currentStep === "domain" && (
            <>
              <Button
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="text-primary"
              >
                Cancel
              </Button>
              <Button
                onClick={handleNext}
                disabled={!canProceedFromDomain}
                className="bg-primary text-primary-foreground"
              >
                Next: Review
              </Button>
            </>
          )}
          {currentStep === "review" && (
            <>
              <Button
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="text-primary"
              >
                Cancel
              </Button>
              {showDomainStep && (
                <Button variant="outline" onClick={() => setCurrentStep("domain")}>
                  Back
                </Button>
              )}
              <Button
                onClick={handleNext}
                className="bg-primary text-primary-foreground"
              >
                Choose payment method
              </Button>
            </>
          )}
          {currentStep === "payment" && (
            <>
              <Button
                variant="ghost"
                onClick={handleBack}
                className="text-primary"
              >
                Back
              </Button>
              <Button
                onClick={() => onOpenChange(false)}
                variant="outline"
              >
                Cancel
              </Button>
            </>
          )}
          {currentStep === "success" && (
            <Button
              onClick={() => onOpenChange(false)}
              className="bg-primary text-primary-foreground w-full"
            >
              Close
            </Button>
          )}
          {currentStep === "error" && (
            <>
              <Button
                onClick={() => {
                  setCurrentStep("payment");
                  setPaymentError(null);
                  setCheckoutRequestId(null);
                  setShouldStopPolling(false);
                  terminalStateDetectedRef.current = false;
                  immediateStepRef.current = null;
                  immediatePaymentErrorRef.current = null;
                  pollingStartTimeRef.current = null;
                  pollingAttemptsRef.current = 0;
                }}
                variant="outline"
              >
                Try Again
              </Button>
              <Button
                onClick={() => onOpenChange(false)}
                className="bg-primary text-primary-foreground"
              >
                Close
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
