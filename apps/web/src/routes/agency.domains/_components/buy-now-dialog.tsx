"use client";

import * as React from "react";
import { HelpCircle, Shield, Mail, Globe, Check } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { trpc } from "@/utils/trpc";
import { computeCeilVatTotals, paymentTotalString } from "@npanel/api/lib/convert-price";
import { toast } from "@/components/ui/sonner";
import type { DomainSearchResult } from "@/hooks/use-domain-search";

interface BuyNowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  domain: DomainSearchResult | null;
}

type Step = "domain" | "hosting" | "plan-selection" | "review" | "payment" | "success" | "error";

interface DomainAddon {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  selected: boolean;
}

interface SelectedHostingPlan {
  type: "web" | "email";
  planId: string;
  planName: string;
  billingCycle: "MONTHLY" | "YEARLY" | "BIENNIALLY";
  price: number;
  currency: string;
}

const formatPrice = (price?: number, currency?: string) => {
  if (price === undefined || price === null || isNaN(price) || !isFinite(price)) {
    return "N/A";
  }

  const currencySymbols: Record<string, string> = {
    'USD': '$',
    'KES': 'KSh',
    'EUR': '€',
    'GBP': ' ?',
    'CAD': 'C$',
    'AUD': 'A$',
    'JPY': ' ?',
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

export function BuyNowDialog({ open, onOpenChange, domain }: BuyNowDialogProps) {
  const [currentStep, setCurrentStep] = React.useState<Step>("domain");
  const [duration, setDuration] = React.useState(1);
  const [couponCode, setCouponCode] = React.useState("");
  const [showCouponInput, setShowCouponInput] = React.useState(false);
  const [selectedAddons, setSelectedAddons] = React.useState<DomainAddon[]>([
    { id: "id-protection", name: "ID Protection", description: "Protect your personal information", price: 650, currency: "KES", selected: false },
    { id: "email-forwarding", name: "Email Forwarding", description: "Forward emails to your existing address", price: 0, currency: "KES", selected: false },
  ]);
  const [selectedHostingPlans, setSelectedHostingPlans] = React.useState<SelectedHostingPlan[]>([]);
  const [hostingPlanType, setHostingPlanType] = React.useState<"web" | "email" | null>(null);
  const [selectedBillingCycles, setSelectedBillingCycles] = React.useState<Record<string, "MONTHLY" | "YEARLY" | "BIENNIALLY">>({});
  
  // Payment state
  const [selectedPaymentMethod, setSelectedPaymentMethod] = React.useState<string | null>(null);
  const [mpesaPhoneNumber, setMpesaPhoneNumber] = React.useState("");
  const [paymentAmount, setPaymentAmount] = React.useState<string>("");
  const [accountReference, setAccountReference] = React.useState<string>("");
  
  // Validation errors
  const [accountRefError, setAccountRefError] = React.useState<string>("");
  const [phoneError, setPhoneError] = React.useState<string>("");
  const [amountError, setAmountError] = React.useState<string>("");

  // Fetch hosting plans
  const { data: webHostingPlans = [], isLoading: isLoadingWeb } = trpc.hostingPlans.getAll.useQuery(
    {
      planType: "HOSTING",
      hostingSubType: "WEB_HOSTING",
      isActive: true,
    },
    { enabled: currentStep === "plan-selection" && hostingPlanType === "web" }
  );

  const { data: emailHostingPlans = [], isLoading: isLoadingEmail } = trpc.hostingPlans.getAll.useQuery(
    {
      planType: "HOSTING",
      hostingSubType: "EMAIL_HOSTING",
      isActive: true,
    },
    { enabled: currentStep === "plan-selection" && hostingPlanType === "email" }
  );

  // Safely calculate pricing with proper null/undefined checks
  const calculated = domain?.price?.calculated;
  
  let displayPrice = 0;
  if (calculated) {
    displayPrice = (calculated as any)?.convertedPrice ?? calculated?.finalPrice ?? 0;
  } else {
    displayPrice = domain?.price?.reseller?.price ?? 0;
  }
  
  displayPrice = typeof displayPrice === 'number' && isFinite(displayPrice) ? displayPrice : 0;
  
  const displayCurrency = calculated
    ? ((calculated as any)?.displayCurrency ?? calculated?.currency ?? 'KES')
    : (domain?.price?.reseller?.currency ?? 'KES');
  
  let originalPrice = 0;
  if (calculated?.originalPrice !== undefined && calculated?.originalPrice !== null) {
    originalPrice = calculated.originalPrice;
  } else {
    originalPrice = domain?.price?.reseller?.price ?? 0;
  }
  
  originalPrice = typeof originalPrice === 'number' && isFinite(originalPrice) ? originalPrice : 0;
  const originalCurrency = calculated?.currency ?? domain?.price?.reseller?.currency ?? 'KES';

  // Calculate totals
  const basePrice = Math.max(0, displayPrice * duration);
  const addonsTotal = selectedAddons
    .filter(a => a.selected)
    .reduce((sum, addon) => sum + (addon.price * (addon.id === "id-protection" ? 1 : duration)), 0);
  
  const hostingTotal = selectedHostingPlans.reduce((sum, plan) => sum + plan.price, 0);
  const subtotal = basePrice + addonsTotal + hostingTotal;
  
  const taxRate = 0.16;
  const { vatAmount: taxes, totalIncVat: total } = computeCeilVatTotals(subtotal, taxRate);
  const couponDiscount = 0;

  const handleAddonToggle = (addonId: string) => {
    setSelectedAddons(prev => 
      prev.map(addon => 
        addon.id === addonId ? { ...addon, selected: !addon.selected } : addon
      )
    );
  };


  const handleHostingCardClick = (type: "web" | "email") => {
    setHostingPlanType(type);
    setCurrentStep("plan-selection");
  };

  const handlePlanSelect = (plan: any, billingCycle?: "MONTHLY" | "YEARLY" | "BIENNIALLY") => {
    const basePrice = parseFloat(plan.niscPrice || "0");
    const planBillingCycle = plan.billingCycle || "MONTHLY";
    
    // Get or default to MONTHLY for this specific plan
    const cycleForPlan = billingCycle || selectedBillingCycles[plan.id] || "MONTHLY";
    
    // Calculate monthly price from plan's base price
    let monthlyPrice = basePrice;
    if (planBillingCycle === "YEARLY") {
      monthlyPrice = basePrice / 12;
    } else if (planBillingCycle === "BIENNIALLY") {
      monthlyPrice = basePrice / 24;
    }
    
    // Calculate total price based on selected billing cycle
    let totalPrice = monthlyPrice;
    if (cycleForPlan === "YEARLY") {
      totalPrice = monthlyPrice * 12;
    } else if (cycleForPlan === "BIENNIALLY") {
      totalPrice = monthlyPrice * 24;
    }
    
    const newPlan: SelectedHostingPlan = {
      type: hostingPlanType!,
      planId: plan.id,
      planName: plan.name,
      billingCycle: cycleForPlan,
      price: totalPrice,
      currency: plan.niscCurrency || "KES",
    };
    
    // Remove existing plan of same type and add new one
    setSelectedHostingPlans(prev => [
      ...prev.filter(p => p.type !== hostingPlanType),
      newPlan
    ]);
  };

  const handleNext = () => {
    if (currentStep === "domain") {
      setCurrentStep("hosting");
    } else if (currentStep === "hosting") {
      setCurrentStep("review");
    } else if (currentStep === "review") {
      setCurrentStep("payment");
      setPaymentAmount(paymentTotalString(total));
      // Generate account reference - max 12 chars, alphanumeric only
      // Format: DOM{timestamp} (e.g., DOM123456)
      const timestamp = Date.now().toString().slice(-9); // Last 9 digits
      const domainShort = domain?.domain?.replace(/\./g, "").substring(0, 3).toUpperCase() || "DOM"; // First 3 chars of domain
      const ref = `${domainShort}${timestamp}`.substring(0, 12); // Max 12 chars
      setAccountReference(ref);
      // Clear validation errors
      setAccountRefError("");
      setPhoneError("");
      setAmountError("");
    }
  };

  const handleBack = () => {
    if (currentStep === "hosting") {
      setCurrentStep("domain");
    } else if (currentStep === "plan-selection") {
      setCurrentStep("hosting");
    } else if (currentStep === "review") {
      setCurrentStep("hosting");
    } else if (currentStep === "payment") {
      setCurrentStep("review");
    }
  };

  // Payment status
  const [checkoutRequestId, setCheckoutRequestId] = React.useState<string | null>(null);
  const [paymentError, setPaymentError] = React.useState<string | null>(null);
  const [shouldStopPolling, setShouldStopPolling] = React.useState(false); // State to control polling - updates immediately
  const pollingStartTimeRef = React.useRef<number | null>(null); // Track when polling started
  const pollingAttemptsRef = React.useRef(0); // Track number of polling attempts for exponential backoff
  const terminalStateDetectedRef = React.useRef(false); // Track if terminal state detected - for immediate UI update
  const immediateStepRef = React.useRef<Step | null>(null); // Track step immediately for instant UI updates
  const immediatePaymentErrorRef = React.useRef<string | null>(null); // Track payment error immediately

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
  // Must match TERMINAL_RESULT_CODES in packages/api/src/routers/payment-gateway/mpesa/error-codes.ts
  const isTerminalResultCode = (resultCode: string | number): boolean => {
    const code = typeof resultCode === "string" ? parseInt(resultCode, 10) : resultCode;
    
    // Skip if not a valid number
    if (isNaN(code)) return false;
    
    // Explicit terminal result codes (from M-Pesa Daraja API documentation)
    const TERMINAL_CODES = new Set([
      0,    // Success
      1,    // Insufficient balance
      2,    // Below minimum transaction amount
      3,    // Above maximum transaction amount
      4,    // Exceeds daily transfer limit
      8,    // Exceeds maximum balance
      17,   // Rule limited (too many requests)
      1019, // Transaction expired
      1025, // Error sending push request
      1032, // Request cancelled by user
      2001, // Invalid PIN
      2028, // Request not permitted
      8006, // Security credential locked
    ]);
    
    // Processing codes (continue polling)
    const PROCESSING_CODES = new Set([
      1037, // DS timeout user cannot be reached (but webhook may treat as terminal)
      4999, // Request processing
    ]);
    
    // If it's a processing code, it's not terminal
    if (PROCESSING_CODES.has(code)) {
      return false;
    }
    
    // If it's explicitly a terminal code, it's terminal
    if (TERMINAL_CODES.has(code)) {
      return true;
    }
    
    // Unknown codes: treat as terminal to be safe (stop polling)
    // This handles any new error codes that might be added
    return true;
  };

  // M-Pesa STK Push mutation
  const initiateMpesaPayment = trpc.paymentGateway.mpesa.initiateStkPush.useMutation({
    onSuccess: (response) => {
      // Response structure: { success: true, data: { checkoutRequestId, ... } }
      const checkoutId = response.data?.checkoutRequestId;
      
      if (!checkoutId) {
        console.error("M-Pesa payment initiated but no CheckoutRequestID received:", response);
        toast.error("Payment request sent but failed to get transaction ID. Please try again.");
        return;
      }
      
      // Don't show toast here - we'll show it when payment is confirmed
      setShouldStopPolling(false); // Reset stop flag
      pollingStartTimeRef.current = Date.now(); // Record polling start time
      pollingAttemptsRef.current = 0; // Reset polling attempts
      setCheckoutRequestId(checkoutId);
      setPaymentError(null);
      // Start polling for payment status
      startPaymentStatusPolling(checkoutId);
    },
    onError: (error) => {
      const errorMessage = error.message || "Failed to initiate payment. Please try again.";
      
      // Immediate UI update via refs (synchronous)
      terminalStateDetectedRef.current = true;
      immediateStepRef.current = "error";
      immediatePaymentErrorRef.current = errorMessage;
      
      // Update state (async, but refs already updated)
      toast.error(errorMessage);
      setCheckoutRequestId(null);
      setPaymentError(errorMessage);
      setShouldStopPolling(true);
      pollingStartTimeRef.current = null;
      pollingAttemptsRef.current = 0;
      setCurrentStep("error");
    },
  });

  // Poll payment status ?? real-time only, no cache (staleTime/gcTime 0)
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
        // Check if we should stop polling (state-based, updates immediately)
        if (shouldStopPolling) {
          return false; // Stop polling immediately
        }
        
        // Check for maximum polling duration (10 minutes = 600000ms)
        const MAX_POLLING_DURATION = 10 * 60 * 1000; // 10 minutes
        if (pollingStartTimeRef.current) {
          const elapsed = Date.now() - pollingStartTimeRef.current;
          if (elapsed >= MAX_POLLING_DURATION) {
            // Immediate UI update via refs (synchronous)
            const timeoutErrorMessage = "Payment is taking longer than expected. Please check your M-Pesa account or try again.";
            terminalStateDetectedRef.current = true;
            immediateStepRef.current = "error";
            immediatePaymentErrorRef.current = timeoutErrorMessage;
            
            // Update state (async, but refs already updated)
            setShouldStopPolling(true);
            setCheckoutRequestId(null);
            setPaymentError(timeoutErrorMessage);
            setCurrentStep("error");
            toast.error(timeoutErrorMessage);
            return false;
          }
        }
        
        // Handle query errors (non-terminal errors that should continue polling)
        if (query.state.error) {
          const errorMessage = query.state.error.message || "";
          const isRateLimit = errorMessage.includes("429") || errorMessage.includes("rate limit");
          const isRequestNotFound = errorMessage.includes("500.001.1001") || errorMessage.includes("request not found");
          const isNetworkError = errorMessage.includes("timeout") || errorMessage.includes("network");
          
          // Continue polling for rate limits, request not found, and network errors
          if (isRateLimit || isRequestNotFound || isNetworkError) {
            pollingAttemptsRef.current += 1;
            const intervals = [2000, 5000, 10000, 30000];
            const intervalIndex = Math.min(pollingAttemptsRef.current - 1, intervals.length - 1);
            return intervals[intervalIndex];
          }
          
          // For other errors, stop polling immediately
          // Immediate UI update via refs (synchronous)
          const finalErrorMessage = errorMessage || "Payment query failed";
          terminalStateDetectedRef.current = true;
          immediateStepRef.current = "error";
          immediatePaymentErrorRef.current = finalErrorMessage;
          
          // Update state (async, but refs already updated)
          setShouldStopPolling(true);
          setCheckoutRequestId(null);
          setPaymentError(finalErrorMessage);
          pollingStartTimeRef.current = null;
          pollingAttemptsRef.current = 0;
          setCurrentStep("error");
          toast.error(finalErrorMessage);
          return false;
        }
        
        // CRITICAL: Check the query data for terminal states BEFORE continuing
        // Use query.state.dataUpdatedAt to ensure we're checking the latest data
        const response = query.state.data;
        
        if (response?.data?.resultCode !== undefined && response?.data?.resultCode !== null) {
          const resultCode = response.data.resultCode;
          const numericResultCode = typeof resultCode === "string" ? parseInt(resultCode, 10) : resultCode;
          
          // Skip if not a valid number
          if (isNaN(numericResultCode)) {
            // Invalid code, continue polling
            pollingAttemptsRef.current += 1;
            const intervals = [2000, 5000, 10000, 30000];
            const intervalIndex = Math.min(pollingAttemptsRef.current - 1, intervals.length - 1);
            return intervals[intervalIndex];
          }
          
          // Check if this is a terminal result code (should stop polling)
          if (isTerminalResultCode(numericResultCode)) {
            // Mark terminal state detected immediately (synchronous)
            terminalStateDetectedRef.current = true;
            
            // Handle success case (ResultCode 0)
            if (numericResultCode === 0) {
              // Immediate UI update via refs (synchronous)
              immediateStepRef.current = "success";
              immediatePaymentErrorRef.current = null;
              
              // Update state (async, but refs already updated for immediate UI feedback)
              setShouldStopPolling(true);
              setCheckoutRequestId(null);
              setPaymentError(null);
              pollingStartTimeRef.current = null;
              pollingAttemptsRef.current = 0;
              setCurrentStep("success");
              toast.success("Payment completed successfully!");
            } else {
              // Handle error cases (all other terminal codes)
              const errorMessage = getUserFriendlyError(numericResultCode, response.data.resultDesc);
              
              // Immediate UI update via refs (synchronous)
              immediateStepRef.current = "error";
              immediatePaymentErrorRef.current = errorMessage;
              
              // Update state (async, but refs already updated for immediate UI feedback)
              setShouldStopPolling(true);
              setCheckoutRequestId(null);
              setPaymentError(errorMessage);
              pollingStartTimeRef.current = null;
              pollingAttemptsRef.current = 0;
              setCurrentStep("error");
              toast.error(errorMessage);
            }
            return false; // Stop polling immediately
          }
        }
        
        // Stop polling if we've moved to success or error step
        if (currentStep === "success" || currentStep === "error") {
          return false;
        }
        
        // Exponential backoff: 2s -> 5s -> 10s -> 30s (max)
        pollingAttemptsRef.current += 1;
        const intervals = [2000, 5000, 10000, 30000]; // 2s, 5s, 10s, 30s
        const intervalIndex = Math.min(pollingAttemptsRef.current - 1, intervals.length - 1);
        const interval = intervals[intervalIndex];
        
        return interval;
      },
    }
  );


  const startPaymentStatusPolling = (checkoutId: string) => {
    setCheckoutRequestId(checkoutId);
    setShouldStopPolling(false); // Reset stop flag when starting new poll
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
    // Remove spaces and dashes for validation
    const cleaned = value.replace(/[\s-]/g, "");
    // Check if it's a valid Kenyan phone number format
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
    // Remove any non-alphanumeric characters
    value = value.replace(/[^a-zA-Z0-9]/g, "");
    // Limit to 12 characters
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
    // Validate all fields
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
    // Format: DOM{domain} (e.g., DOMexample)
    if (!domain) {
      toast.error("Domain information is missing. Please try again.");
      return;
    }
    const domainShort = domain.domain.replace(/\./g, "").substring(0, 9).toUpperCase();
    const transactionDesc = `DOM${domainShort}`.substring(0, 13);

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

  // Reset state when dialog closes
  React.useEffect(() => {
    if (!open) {
      setCurrentStep("domain");
      setDuration(1);
      setCouponCode("");
      setShowCouponInput(false);
      setSelectedAddons([
        { id: "id-protection", name: "ID Protection", description: "Protect your personal information", price: 650, currency: "KES", selected: false },
        { id: "email-forwarding", name: "Email Forwarding", description: "Forward emails to your existing address", price: 0, currency: "KES", selected: false },
      ]);
      setSelectedHostingPlans([]);
      setHostingPlanType(null);
      setSelectedBillingCycles({});
      // Reset payment state
      setSelectedPaymentMethod(null);
      setMpesaPhoneNumber("");
      setPaymentAmount("");
      setAccountReference("");
      setAccountRefError("");
      setPhoneError("");
      setAmountError("");
      setCheckoutRequestId(null);
      setPaymentError(null);
      setShouldStopPolling(false); // Reset stop polling flag
      pollingStartTimeRef.current = null;
      pollingAttemptsRef.current = 0;
      terminalStateDetectedRef.current = false; // Reset terminal state flag
      immediateStepRef.current = null; // Reset immediate step
      immediatePaymentErrorRef.current = null; // Reset immediate error
    }
  }, [open]);

  if (!domain || !domain.domain) {
    return null;
  }

  const renderStep = () => {
    // Use immediate ref for instant UI updates (before React state batching)
    const effectiveStep = immediateStepRef.current || currentStep;
    switch (effectiveStep) {
      case "domain":
        return (
          <div className="space-y-4">
            <div className="text-center py-4">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Get the best of your domain
              </h3>
              <p className="text-sm text-muted-foreground">
                Complete your purchase and unlock powerful features
              </p>
            </div>
            <ScrollArea className="h-[400px] w-full">
              <div className="space-y-4 pr-4">
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium truncate">{domain.domain}</span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help flex-shrink-0" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>This domain is by default registered for 1 year. Edit the duration below.</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Select
                        value={duration.toString()}
                        onValueChange={(value) => setDuration(parseInt(value))}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue>
                            {duration} {duration === 1 ? 'year' : 'years'}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 year</SelectItem>
                          <SelectItem value="2">2 years</SelectItem>
                          <SelectItem value="3">3 years</SelectItem>
                          <SelectItem value="4">4 years</SelectItem>
                          <SelectItem value="5">5 years</SelectItem>
                          <SelectItem value="10">10 years</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-semibold text-lg">
                        {formatPrice(basePrice, displayCurrency)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Domain Add-ons */}
                <div className="space-y-3">
                  <div className="text-center py-2">
                    <h4 className="text-base font-semibold text-foreground mb-1">
                      Domain Add-ons
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Enhance your domain with these optional features
                    </p>
                  </div>
                  {selectedAddons.map((addon) => (
                    <button
                      key={addon.id}
                      onClick={() => handleAddonToggle(addon.id)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        addon.selected
                          ? "border-primary bg-primary/5"
                          : "border-border bg-card hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={`mt-1 h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                            addon.selected ? "border-primary bg-primary" : "border-muted-foreground"
                          }`}>
                            {addon.selected && <Check className="h-3 w-3 text-primary-foreground" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {addon.id === "id-protection" ? (
                                <Shield className="h-4 w-4 text-primary" />
                              ) : (
                                <Mail className="h-4 w-4 text-primary" />
                              )}
                              <span className="font-medium text-foreground">{addon.name}</span>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-3 break-words">{addon.description}</p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          {addon.price === 0 ? (
                            <span className="text-sm font-medium text-primary">Free</span>
                          ) : (
                            <span className="text-sm font-medium text-foreground">
                              {formatPrice(addon.price, addon.currency)}
                              {addon.id === "id-protection" ? "/yr" : ""}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <ScrollBar orientation="vertical" />
            </ScrollArea>
          </div>
        );


      case "hosting":
        return (
          <div className="space-y-4">
            <div className="text-center py-2">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Add Hosting Services
              </h3>
              <p className="text-sm text-muted-foreground">
                Complete your online presence with hosting services
              </p>
            </div>
            <div className="grid gap-4">
              {/* Web Hosting Card */}
              <div className={`rounded-lg border-2 p-4 transition-all ${
                selectedHostingPlans.find(p => p.type === "web")
                  ? "border-primary bg-primary/5"
                  : selectedHostingPlans.find(p => p.type === "email")
                    ? "border-border bg-muted/30 opacity-60 cursor-not-allowed"
                    : "border-border bg-card hover:border-primary/50"
              }`}>
                {selectedHostingPlans.find(p => p.type === "web") ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Globe className="h-5 w-5 text-primary" />
                        <span className="font-semibold text-foreground">Web Hosting</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedHostingPlans(prev => prev.filter(p => p.type !== "web"));
                        }}
                        className="h-7 text-xs"
                      >
                        Change
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Everything you need to create a site and get online
                    </p>
                    <div className="pt-2 space-y-1 text-sm">
                      {(() => {
                        const webPlan = selectedHostingPlans.find(p => p.type === "web");
                        if (!webPlan) return null;
                        return (
                          <>
                            <div className="flex justify-between gap-2">
                              <span className="text-muted-foreground flex-shrink-0">Plan:</span>
                              <span className="text-foreground font-medium truncate line-clamp-3 text-right">{webPlan.planName}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Billing Cycle:</span>
                              <span className="text-foreground font-medium">{webPlan.billingCycle}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Price:</span>
                              <span className="text-foreground font-medium">
                                {formatPrice(webPlan.price, webPlan.currency)}
                              </span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Globe className="h-5 w-5 text-primary" />
                      <span className="font-semibold text-lg text-foreground">Add a web hosting plan to your domain</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Everything you need to create a site and get online
                    </p>
                    <div className="flex items-center justify-between pt-2">
                      <div>
                        <div className="text-sm text-muted-foreground line-through">KSh 9,600</div>
                        <div className="font-semibold text-lg text-foreground">From KSh 800/mo</div>
                        <div className="text-xs text-muted-foreground">when getting a 1 year subscription</div>
                      </div>
                      <Button
                        onClick={() => handleHostingCardClick("web")}
                        className="bg-primary text-primary-foreground"
                        disabled={!!selectedHostingPlans.find(p => p.type === "email")}
                      >
                        Get deal
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Email Hosting Card */}
              <div className={`rounded-lg border-2 p-4 transition-all ${
                selectedHostingPlans.find(p => p.type === "email")
                  ? "border-primary bg-primary/5"
                  : selectedHostingPlans.find(p => p.type === "web")
                    ? "border-border bg-muted/30 opacity-60 cursor-not-allowed"
                    : "border-border bg-card hover:border-primary/50"
              }`}>
                {selectedHostingPlans.find(p => p.type === "email") ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Mail className="h-5 w-5 text-primary" />
                        <span className="font-semibold text-foreground">Email Hosting</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedHostingPlans(prev => prev.filter(p => p.type !== "email"));
                        }}
                        className="h-7 text-xs"
                      >
                        Change
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Professional email hosting for your domain
                    </p>
                    <div className="pt-2 space-y-1 text-sm">
                      {(() => {
                        const emailPlan = selectedHostingPlans.find(p => p.type === "email");
                        if (!emailPlan) return null;
                        return (
                          <>
                            <div className="flex justify-between gap-2">
                              <span className="text-muted-foreground flex-shrink-0">Plan:</span>
                              <span className="text-foreground font-medium truncate line-clamp-3 text-right">{emailPlan.planName}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Billing Cycle:</span>
                              <span className="text-foreground font-medium">{emailPlan.billingCycle}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Price:</span>
                              <span className="text-foreground font-medium">
                                {formatPrice(emailPlan.price, emailPlan.currency)}
                              </span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Mail className="h-5 w-5 text-primary" />
                      <span className="font-semibold text-lg text-foreground">Get a new email hosting plan</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Professional email hosting with advanced features
                    </p>
                    <div className="flex items-center justify-between pt-2">
                      <div>
                        <div className="text-sm text-muted-foreground line-through">KSh 4,800</div>
                        <div className="font-semibold text-lg text-foreground">From KSh 400/mo</div>
                        <div className="text-xs text-muted-foreground">when getting a 1 year subscription</div>
                      </div>
                      <Button
                        onClick={() => handleHostingCardClick("email")}
                        className="bg-primary text-primary-foreground"
                        disabled={!!selectedHostingPlans.find(p => p.type === "web")}
                      >
                        Get deal
                      </Button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        );

      case "plan-selection":
        const plans = hostingPlanType === "web" ? webHostingPlans : emailHostingPlans;
        const isLoading = hostingPlanType === "web" ? isLoadingWeb : isLoadingEmail;

        return (
          <div className="space-y-4">
            <div className="text-center py-2">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Select {hostingPlanType === "web" ? "Web" : "Email"} Hosting Plan
              </h3>
              <p className="text-sm text-muted-foreground">
                Choose the plan that best fits your needs
              </p>
            </div>
            
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading plans...
              </div>
            ) : plans.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No plans available
              </div>
            ) : (
              <div className="space-y-3">
                {plans.map((plan) => {
                  const price = parseFloat(plan.niscPrice || "0");
                  const monthlyPrice = plan.billingCycle === "MONTHLY" ? price : plan.billingCycle === "YEARLY" ? price / 12 : price / 24;
                  const isSelected = selectedHostingPlans.some(p => p.planId === plan.id && p.type === hostingPlanType);
                  const planBillingCycle = selectedBillingCycles[plan.id] || "MONTHLY";
                  
                  return (
                    <div
                      key={plan.id}
                      className={`rounded-lg border-2 p-4 transition-all cursor-pointer ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border bg-card hover:border-primary/50"
                      }`}
                      onClick={() => {
                        if (!isSelected) {
                          // Set default billing cycle if not already set
                          const defaultCycle = selectedBillingCycles[plan.id] || "MONTHLY";
                          if (!selectedBillingCycles[plan.id]) {
                            setSelectedBillingCycles(prev => ({
                              ...prev,
                              [plan.id]: "MONTHLY"
                            }));
                          }
                          handlePlanSelect(plan, defaultCycle);
                        }
                      }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-foreground line-clamp-3 break-words">{plan.name}</span>
                            {plan.isPopular && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                Popular
                              </span>
                            )}
                          </div>
                          {plan.description && (
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-3 break-words">{plan.description}</p>
                          )}
                          <div className="font-semibold text-lg text-foreground">
                            {formatPrice(monthlyPrice, plan.niscCurrency || "KES")}/mo
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                            isSelected ? "border-primary bg-primary" : "border-muted-foreground"
                          }`}>
                            {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                          </div>
                          {isSelected && (
                            <div onClick={(e) => e.stopPropagation()}>
                              <Select
                                value={planBillingCycle}
                                onValueChange={(value: "MONTHLY" | "YEARLY" | "BIENNIALLY") => {
                                  setSelectedBillingCycles(prev => ({
                                    ...prev,
                                    [plan.id]: value
                                  }));
                                  // Recalculate price with new billing cycle
                                  handlePlanSelect(plan, value);
                                }}
                              >
                                <SelectTrigger className="w-32 h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                                  <SelectItem value="YEARLY">Yearly</SelectItem>
                                  <SelectItem value="BIENNIALLY">Biennially</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
                Review your selections before proceeding to checkout
              </p>
            </div>

            <ScrollArea className="h-[300px] w-full">
              <div className="space-y-4 pr-4">
                {/* Domain */}
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-foreground line-clamp-3 break-words">{domain.domain}</div>
                      <div className="text-sm text-muted-foreground">{duration} {duration === 1 ? 'year' : 'years'}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-foreground">
                        {formatPrice(basePrice, displayCurrency)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Add-ons */}
                {selectedAddons.filter(a => a.selected).length > 0 && (
                  <div className="space-y-2">
                    {selectedAddons.filter(a => a.selected).map((addon) => (
                      <div key={addon.id} className="bg-muted/50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-foreground line-clamp-1 break-words">{addon.name}</div>
                            <div className="text-sm text-muted-foreground line-clamp-3 break-words">{addon.description}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-foreground">
                              {addon.price === 0 ? "Free" : formatPrice(addon.price * (addon.id === "id-protection" ? 1 : duration), addon.currency)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Hosting Plans */}
                {selectedHostingPlans.map((plan) => (
                  <div key={`${plan.type}-${plan.planId}`} className="bg-muted/50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-foreground line-clamp-3 break-words">
                          {plan.type === "web" ? "Web Hosting" : "Email Hosting"} - {plan.planName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Billing Cycle: {plan.billingCycle}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-foreground">
                          {formatPrice(plan.price, plan.currency)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
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
              <span>{formatPrice(taxes, displayCurrency)}</span>
            </div>

            {/* Total */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between font-bold text-lg">
                <span>Total</span>
                <span>{formatPrice(total, displayCurrency)}</span>
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
                              Amount (KES) <span className="text-destructive">*</span>
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
                                Cart total: {formatPrice(total, displayCurrency)} (editable for testing)
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
                  <span>{formatPrice(subtotal, displayCurrency)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Taxes & fees</span>
                  <span>{formatPrice(taxes, displayCurrency)}</span>
                </div>
                <div className="flex items-center justify-between font-bold text-lg border-t pt-2">
                  <span>Total</span>
                  <span>{formatPrice(total, displayCurrency)}</span>
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
                  Your domain <span className="font-semibold">{domain.domain}</span> will be issued on your dashboard in a few minutes.
                </p>
                {selectedAddons.filter(a => a.selected).length > 0 && (
                  <p className="text-sm text-foreground">
                    Your selected add-ons will be activated automatically.
                  </p>
                )}
                {selectedHostingPlans.length > 0 && (
                  <p className="text-sm text-foreground">
                    Your hosting services will be set up shortly.
                  </p>
                )}
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Order Total</span>
                <span className="font-semibold">{formatPrice(total, displayCurrency)}</span>
              </div>
            </div>
          </div>
        );

      case "error":
        // Use immediate error ref for instant display
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
                <span className="font-semibold">{formatPrice(total, displayCurrency)}</span>
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
            Buy {domain.domain} domain
          </DialogTitle>
          <DialogDescription className="min-w-0 w-full max-w-full">
            {currentStep === "domain" && "Get the best of your domain"}
            {currentStep === "hosting" && "Add hosting services to your domain"}
            {currentStep === "plan-selection" && "Select a hosting plan"}
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
          {currentStep !== "domain" && (
            <Button
              variant="ghost"
              onClick={handleBack}
              className="text-primary"
            >
              Back
            </Button>
          )}
          {currentStep === "domain" && (
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-primary"
            >
              Cancel
            </Button>
          )}
          {currentStep === "plan-selection" && selectedHostingPlans.some(p => p.type === hostingPlanType) && (
            <Button
              onClick={() => {
                setCurrentStep("hosting");
              }}
              className="bg-primary text-primary-foreground"
            >
              Continue
            </Button>
          )}
          {currentStep === "hosting" && (
            <Button
              onClick={handleNext}
              className="bg-primary text-primary-foreground"
            >
              Proceed to checkout
            </Button>
          )}
          {currentStep === "review" && (
            <Button
              onClick={handleNext}
              className="bg-primary text-primary-foreground"
            >
              Choose payment method
            </Button>
          )}
          {currentStep === "payment" && (
            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
            >
              Cancel
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
                  // Reset all payment-related state and refs
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
          {currentStep !== "plan-selection" && currentStep !== "hosting" && currentStep !== "review" && currentStep !== "payment" && currentStep !== "success" && currentStep !== "error" && (
            <Button
              onClick={handleNext}
              className="bg-primary text-primary-foreground"
            >
              {currentStep === "domain" ? "Proceed" : "Next"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
