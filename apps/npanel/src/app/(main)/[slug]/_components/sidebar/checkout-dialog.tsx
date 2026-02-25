"use client";

import * as React from "react";
import { HelpCircle, Check } from "lucide-react";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
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
import { useCartStore } from "@/stores/cart-store";
import { CartItemCard } from "./cart-item-card";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = "review" | "payment" | "success" | "error";

const formatPrice = (price?: number, currency?: string) => {
  if (!price) return "N/A";

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

  const symbol = currencySymbols[currency || 'USD'] || currency || '$';
  const formattedNumber = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
  
  return `${symbol} ${formattedNumber}`;
};

export function CheckoutDialog({ open, onOpenChange }: CheckoutDialogProps) {
  const { items, getItemCount, getTotalsByCurrency, getCurrenciesInCart } = useCartStore();
  const [currentStep, setCurrentStep] = React.useState<Step>("review");
  const [couponCode, setCouponCode] = React.useState("");
  const [showCouponInput, setShowCouponInput] = React.useState(false);

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

  const totalItems = getItemCount();
  const totalsByCurrency = getTotalsByCurrency();
  const currenciesInCart = getCurrenciesInCart();

  // For simplicity, we'll use the first currency if multiple exist
  const primaryCurrency = currenciesInCart[0] || 'KES';
  const subtotal = totalsByCurrency[primaryCurrency] || 0;
  
  // Calculate tax (16% VAT)
  const taxRate = 0.16;
  const taxes = subtotal * taxRate;
  
  // Apply coupon discount (placeholder - 0% for now)
  const couponDiscount = 0;
  
  const total = subtotal + taxes - couponDiscount;

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

  // Helper function to check if result code is terminal (should stop polling)
  const isTerminalResultCode = (resultCode: string | number): boolean => {
    const code = typeof resultCode === "string" ? parseInt(resultCode, 10) : resultCode;
    
    if (isNaN(code)) return false;
    
    const TERMINAL_CODES = new Set([
      0, 1, 2, 3, 4, 8, 17, 1019, 1025, 1032, 2001, 2028, 8006,
    ]);
    
    const PROCESSING_CODES = new Set([1037, 4999]);
    
    if (PROCESSING_CODES.has(code)) {
      return false;
    }
    
    if (TERMINAL_CODES.has(code)) {
      return true;
    }
    
    return true;
  };

  // M-Pesa STK Push mutation
  const initiateMpesaPayment = trpc.paymentGateway.mpesa.initiateStkPush.useMutation({
    onSuccess: (response) => {
      const checkoutId = response.data?.checkoutRequestId;
      
      if (!checkoutId) {
        toast.error("Payment request sent but failed to get transaction ID. Please try again.");
        return;
      }
      
      terminalStateDetectedRef.current = false;
      immediateStepRef.current = "payment";
      immediatePaymentErrorRef.current = null;
      
      setShouldStopPolling(false);
      pollingStartTimeRef.current = Date.now();
      pollingAttemptsRef.current = 0;
      setCheckoutRequestId(checkoutId);
      setPaymentError(null);
      startPaymentStatusPolling(checkoutId);
    },
    onError: (error) => {
      const errorMessage = error.message || "Failed to initiate payment. Please try again.";
      
      terminalStateDetectedRef.current = true;
      immediateStepRef.current = "error";
      immediatePaymentErrorRef.current = errorMessage;
      
      toast.error(errorMessage);
      setCheckoutRequestId(null);
      setPaymentError(errorMessage);
      setShouldStopPolling(true);
      pollingStartTimeRef.current = null;
      pollingAttemptsRef.current = 0;
      setCurrentStep("error");
    },
  });

  // Poll payment status — real-time only, no cache
  const queryPaymentStatus = trpc.paymentGateway.mpesa.queryStkPush.useQuery(
    { checkoutRequestId: checkoutRequestId! },
    {
      enabled: !!checkoutRequestId && currentStep === "payment" && !shouldStopPolling,
      staleTime: 0,
      gcTime: 0,
      refetchOnMount: "always",
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      notifyOnChangeProps: ["data", "error", "status"],
      refetchInterval: (query) => {
        if (shouldStopPolling) {
          return false;
        }
        
        const MAX_POLLING_DURATION = 10 * 60 * 1000;
        if (pollingStartTimeRef.current) {
          const elapsed = Date.now() - pollingStartTimeRef.current;
          if (elapsed >= MAX_POLLING_DURATION) {
            const timeoutErrorMessage = "Payment is taking longer than expected. Please check your M-Pesa account or try again.";
            terminalStateDetectedRef.current = true;
            immediateStepRef.current = "error";
            immediatePaymentErrorRef.current = timeoutErrorMessage;
            
            setShouldStopPolling(true);
            setCheckoutRequestId(null);
            setPaymentError(timeoutErrorMessage);
            setCurrentStep("error");
            toast.error(timeoutErrorMessage);
            return false;
          }
        }
        
        if (query.state.error) {
          const errorMessage = query.state.error.message || "";
          const isRateLimit = errorMessage.includes("429") || errorMessage.includes("rate limit");
          const isRequestNotFound = errorMessage.includes("500.001.1001") || errorMessage.includes("request not found");
          const isNetworkError = errorMessage.includes("timeout") || errorMessage.includes("network");
          
          if (isRateLimit || isRequestNotFound || isNetworkError) {
            pollingAttemptsRef.current += 1;
            const intervals = [2000, 5000, 10000, 30000];
            const intervalIndex = Math.min(pollingAttemptsRef.current - 1, intervals.length - 1);
            return intervals[intervalIndex];
          }
          
          const finalErrorMessage = errorMessage || "Payment query failed";
          terminalStateDetectedRef.current = true;
          immediateStepRef.current = "error";
          immediatePaymentErrorRef.current = finalErrorMessage;
          
          setShouldStopPolling(true);
          setCheckoutRequestId(null);
          setPaymentError(finalErrorMessage);
          pollingStartTimeRef.current = null;
          pollingAttemptsRef.current = 0;
          setCurrentStep("error");
          toast.error(finalErrorMessage);
          return false;
        }
        
        if (query.state.status === "pending" || !query.state.data) {
          pollingAttemptsRef.current += 1;
          const intervals = [2000, 5000, 10000, 30000];
          const intervalIndex = Math.min(pollingAttemptsRef.current - 1, intervals.length - 1);
          return intervals[intervalIndex];
        }
        
        const response = query.state.data;
        
        if (response?.data?.resultCode !== undefined && response?.data?.resultCode !== null) {
          const resultCode = response.data.resultCode;
          const numericResultCode = typeof resultCode === "string" ? parseInt(resultCode, 10) : resultCode;
          
          if (isNaN(numericResultCode)) {
            pollingAttemptsRef.current += 1;
            const intervals = [2000, 5000, 10000, 30000];
            const intervalIndex = Math.min(pollingAttemptsRef.current - 1, intervals.length - 1);
            return intervals[intervalIndex];
          }
          
          if (isTerminalResultCode(numericResultCode)) {
            terminalStateDetectedRef.current = true;
            
            if (numericResultCode === 0) {
              immediateStepRef.current = "success";
              immediatePaymentErrorRef.current = null;
              
              setShouldStopPolling(true);
              setCheckoutRequestId(null);
              setPaymentError(null);
              pollingStartTimeRef.current = null;
              pollingAttemptsRef.current = 0;
              setCurrentStep("success");
              toast.success("Payment completed successfully!");
            } else {
              const errorMessage = getUserFriendlyError(numericResultCode, response.data.resultDesc);
              
              immediateStepRef.current = "error";
              immediatePaymentErrorRef.current = errorMessage;
              
              setShouldStopPolling(true);
              setCheckoutRequestId(null);
              setPaymentError(errorMessage);
              pollingStartTimeRef.current = null;
              pollingAttemptsRef.current = 0;
              setCurrentStep("error");
              toast.error(errorMessage);
            }
            return false;
          }
        }
        
        if (currentStep === "success" || currentStep === "error") {
          return false;
        }
        
        pollingAttemptsRef.current += 1;
        const intervals = [2000, 5000, 10000, 30000];
        const intervalIndex = Math.min(pollingAttemptsRef.current - 1, intervals.length - 1);
        return intervals[intervalIndex];
      },
    }
  );

  const startPaymentStatusPolling = (checkoutId: string) => {
    setCheckoutRequestId(checkoutId);
    setShouldStopPolling(false);
    pollingStartTimeRef.current = Date.now();
    pollingAttemptsRef.current = 0;
  };

  // Validate account reference
  const validateAccountReference = (value: string): string => {
    if (!value || !value.trim()) {
      return "Account reference is required";
    }
    if (value.length > 12) {
      return "Account reference must be at most 12 characters";
    }
    if (!/^[a-zA-Z0-9]+$/.test(value)) {
      return "Account reference must be alphanumeric only (no spaces or special characters)";
    }
    return "";
  };

  // Validate phone number
  const validatePhoneNumber = (value: string): string => {
    if (!value || !value.trim()) {
      return "Phone number is required";
    }
    const cleaned = value.replace(/[\s-]/g, "");
    if (!/^(?:254|0)[17]\d{8}$/.test(cleaned)) {
      return "Please enter a valid Kenyan phone number (e.g., 0712345678 or 254712345678)";
    }
    return "";
  };

  // Validate amount
  const validateAmount = (value: string): string => {
    if (!value || !value.trim()) {
      return "Amount is required";
    }
    const amount = parseFloat(value);
    if (isNaN(amount) || amount <= 0) {
      return "Please enter a valid amount greater than 0";
    }
    return "";
  };

  // Handle account reference change with validation
  const handleAccountReferenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    value = value.replace(/[^a-zA-Z0-9]/g, "");
    value = value.substring(0, 12);
    setAccountReference(value);
    setAccountRefError(validateAccountReference(value));
  };

  // Handle phone number change with validation
  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMpesaPhoneNumber(value);
    setPhoneError(validatePhoneNumber(value));
  };

  // Handle amount change with validation
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPaymentAmount(value);
    setAmountError(validateAmount(value));
  };

  const handleMpesaPayment = async () => {
    const accountRefErr = validateAccountReference(accountReference);
    const phoneErr = validatePhoneNumber(mpesaPhoneNumber);
    const amountErr = validateAmount(paymentAmount);

    setAccountRefError(accountRefErr);
    setPhoneError(phoneErr);
    setAmountError(amountErr);

    if (accountRefErr || phoneErr || amountErr) {
      toast.error("Please fix the errors in the form");
      return;
    }

    const amount = parseFloat(paymentAmount);
    
    // Generate transaction description - max 13 chars
    // Format: CART{timestamp} (e.g., CART1234567)
    const timestamp = Date.now().toString().slice(-9);
    const transactionDesc = `CART${timestamp}`.substring(0, 13);

    try {
      await initiateMpesaPayment.mutateAsync({
        phoneNumber: mpesaPhoneNumber.trim(),
        amount: amount,
        accountReference: accountReference.trim(),
        transactionDesc: transactionDesc,
      });
    } catch (error) {
      // Error is handled by mutation onError
    }
  };

  const handlePayment = () => {
    setCurrentStep("payment");
    setPaymentAmount(total.toString());
    const timestamp = Date.now().toString().slice(-9);
    const ref = `CART${timestamp}`.substring(0, 12);
    setAccountReference(ref);
    setAccountRefError("");
    setPhoneError("");
    setAmountError("");
    
    // Reset immediate refs
    terminalStateDetectedRef.current = false;
    immediateStepRef.current = null;
    immediatePaymentErrorRef.current = null;
  };

  // Reset state when dialog closes
  React.useEffect(() => {
    if (!open) {
      setCurrentStep("review");
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
    }
  }, [open]);

  // Get creative title based on item count
  const getTitle = () => {
    if (totalItems === 1) {
      return `Complete your purchase`;
    } else if (totalItems <= 3) {
      return `Proceed to purchase ${totalItems} items`;
    } else {
      return `Review ${totalItems} items in your cart`;
    }
  };

  const renderStep = () => {
    const effectiveStep = immediateStepRef.current || currentStep;
    switch (effectiveStep) {
      case "review":
        return (
          <div className="space-y-4">
            {/* Cart Items with Scroll Area */}
            <div className="bg-muted/50 rounded-lg p-4">
              <ScrollArea className="h-[200px] w-full">
                <div className="space-y-3 pr-4">
                  {items.map((item) => (
                    <CartItemCard
                      key={item.id}
                      item={item}
                      onRemove={() => {}}
                      hideRemoveButton={true}
                    />
                  ))}
                </div>
                <ScrollBar orientation="vertical" />
              </ScrollArea>
            </div>

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
                    onChange={(e) => setCouponCode(e.target.value)}
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
              <span>{formatPrice(taxes, primaryCurrency)}</span>
            </div>

            {/* Sub Total */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Sub Total</span>
              <span>{formatPrice(subtotal, primaryCurrency)}</span>
            </div>

            {/* Total */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between font-bold text-lg">
                <span>Total</span>
                <span>{formatPrice(total, primaryCurrency)}</span>
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
                              Amount ({primaryCurrency}) <span className="text-destructive">*</span>
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
                                Cart total: {formatPrice(total, primaryCurrency)} (editable for testing)
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
                  <span>{formatPrice(subtotal, primaryCurrency)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Taxes & fees</span>
                  <span>{formatPrice(taxes, primaryCurrency)}</span>
                </div>
                <div className="flex items-center justify-between font-bold text-lg border-t pt-2">
                  <span>Total</span>
                  <span>{formatPrice(total, primaryCurrency)}</span>
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
                  Your order will be processed and items will be available in your dashboard shortly.
                </p>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Order Total</span>
                <span className="font-semibold">{formatPrice(total, primaryCurrency)}</span>
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
                <span className="font-semibold">{formatPrice(total, primaryCurrency)}</span>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (totalItems === 0) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>
            {currentStep === "review" && "Review the details and proceed to checkout."}
            {currentStep === "payment" && "Complete your payment"}
            {currentStep === "success" && "Order Confirmed"}
            {currentStep === "error" && "Payment Failed"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {renderStep()}
        </div>

        <DialogFooter className="gap-2">
          {currentStep === "review" && (
            <>
              <Button
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="text-primary"
              >
                Cancel
              </Button>
              <Button onClick={handlePayment} className="bg-primary text-primary-foreground">
                Choose payment method
              </Button>
            </>
          )}
          {currentStep === "payment" && (
            <Button
              onClick={() => {
                setCurrentStep("review");
                setCheckoutRequestId(null);
                setPaymentError(null);
                setShouldStopPolling(true);
                terminalStateDetectedRef.current = false;
                immediateStepRef.current = null;
                immediatePaymentErrorRef.current = null;
                pollingStartTimeRef.current = null;
                pollingAttemptsRef.current = 0;
              }}
              variant="outline"
            >
              Back
            </Button>
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
