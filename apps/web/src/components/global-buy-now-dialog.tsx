"use client";

import * as React from "react";
import { HelpCircle, Check, Globe, Mail } from "lucide-react";
import { Spinner } from "@/components/npanel-ui/spinner";
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
import { toast } from "@/components/ui/sonner";
import { useGlobalBuyNowStore } from "@/stores/global-buy-now-store";
import { useCartStore } from "@/stores/cart-store";
import { CartItemCard } from "@/routes/agency/_components/sidebar/cart-item-card";

const formatPrice = (price?: number, currency?: string) => {
  if (price === undefined || price === null || isNaN(price) || !isFinite(price)) {
    return "N/A";
  }
  const symbol = (currency || "KES") === "KES" ? "KSh" : currency === "USD" ? "$" : currency || "KSh";
  const n = typeof Intl !== "undefined" && Intl.NumberFormat
    ? new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(price)
    : String(price);
  return `${symbol} ${n}`;
};

type Step =
  | "product"
  | "hosting-upsell"
  | "plan-selection"
  | "review"
  | "payment"
  | "success"
  | "error";

interface SelectedUpsellPlan {
  productId: string;
  productName: string;
  planId: string;
  planName: string;
  billingCycle: "MONTHLY" | "YEARLY" | "BIENNIALLY";
  price: number;
  currency: string;
}

interface SelectedAddOn {
  productId: string;
  productName: string;
  planId: string;
  planName: string;
  price: number;
  currency: string;
}

export function GlobalBuyNowDialog() {
  const { open, mode, productContext, transferContext, close } = useGlobalBuyNowStore();
  const { items, getTotalsByCurrency, getCurrenciesInCart, getItemCount, clearCart, getDomains } = useCartStore();

  const [currentStep, setCurrentStep] = React.useState<Step>("review");
  const [couponCode, setCouponCode] = React.useState("");
  const [showCouponInput, setShowCouponInput] = React.useState(false);

  const [duration, setDuration] = React.useState(1);
  const [selectedAddOns, setSelectedAddOns] = React.useState<SelectedAddOn[]>([]);
  const [selectedUpsellPlans, setSelectedUpsellPlans] = React.useState<SelectedUpsellPlan[]>([]);
  const [selectedMainPlan, setSelectedMainPlan] = React.useState<SelectedUpsellPlan | null>(null);
  const [planSelectionProductId, setPlanSelectionProductId] = React.useState<string | null>(null);
  const [planSelectionProductName, setPlanSelectionProductName] = React.useState<string>("");
  const [selectedPlanId, setSelectedPlanId] = React.useState<string | null>(null);
  const [selectedBillingCycle, setSelectedBillingCycle] = React.useState<"MONTHLY" | "YEARLY" | "BIENNIALLY">("MONTHLY");
  const [isSelectingMainProductPlan, setIsSelectingMainProductPlan] = React.useState(false);

  const [selectedPaymentMethod, setSelectedPaymentMethod] = React.useState<string | null>(null);
  const [mpesaPhoneNumber, setMpesaPhoneNumber] = React.useState("");
  const [paymentAmount, setPaymentAmount] = React.useState("");
  const [accountReference, setAccountReference] = React.useState("");
  const [accountRefError, setAccountRefError] = React.useState("");
  const [phoneError, setPhoneError] = React.useState("");
  const [amountError, setAmountError] = React.useState("");
  const [checkoutRequestId, setCheckoutRequestId] = React.useState<string | null>(null);
  const [paymentError, setPaymentError] = React.useState<string | null>(null);
  const [isPolling, setIsPolling] = React.useState(false);
  const [shouldStopPolling, setShouldStopPolling] = React.useState(false);
  const pollingIntervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const pollingQuickRetryRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const terminalStateDetectedRef = React.useRef(false);
  const immediateStepRef = React.useRef<Step | null>(null);
  const immediatePaymentErrorRef = React.useRef<string | null>(null);
  const orderCreatedForCheckoutRef = React.useRef<string | null>(null);
  const onPaymentSuccessRef = React.useRef<(checkoutRequestId: string) => void | undefined>(undefined);

  const isCartMode = mode === "cart";
  const isTransferMode = mode === "transfer";
  const ctx = productContext;
  const hasDomain = !!ctx?.domain?.domain;
  const isDomainProduct = hasDomain;

  const { data: domainsProductId } = trpc.clientSubscriptions.getDomainsProductId.useQuery(undefined, {
    enabled: open && (isCartMode || !!ctx?.productId),
  });
  const { data: addOnsData = [] } = trpc.products.getAddOnsForProduct.useQuery(
    { baseProductId: ctx?.productId ?? "" },
    { enabled: open && !!ctx?.productId && !isCartMode }
  );
  const { data: hostingUpsellProducts = [] } = trpc.products.getHostingProductsForUpsell.useQuery(undefined, {
    enabled: open && !isCartMode && isDomainProduct,
  });
  const { data: planSelectionProduct } = trpc.products.getById.useQuery(
    { id: planSelectionProductId ?? "", includePlans: true },
    { enabled: !!planSelectionProductId && currentStep === "plan-selection" }
  );
  const plans = (planSelectionProduct as { plans?: Array<{ id: string; name: string; price: string | null; currency: string; billingCycle: string | null }> })?.plans ?? [];

  const displayCurrency = isTransferMode && transferContext
    ? transferContext.currency
    : ctx?.domain?.price?.calculated
      ? (ctx.domain.price.calculated as { displayCurrency?: string })?.displayCurrency ?? (ctx.domain.price.calculated as { currency?: string })?.currency ?? "KES"
      : ctx?.domain?.price?.reseller?.currency ?? "KES";
  const domainDisplayPrice = (() => {
    if (!ctx?.domain) return 0;
    const calc = ctx.domain.price?.calculated as { convertedPrice?: number; finalPrice?: number } | undefined;
    const v = calc?.convertedPrice ?? calc?.finalPrice ?? ctx.domain.price?.reseller?.price ?? 0;
    return typeof v === "number" && isFinite(v) ? v : 0;
  })();
  const domainTotal = hasDomain ? domainDisplayPrice * duration : 0;
  const addOnsTotal = selectedAddOns.reduce((s, a) => s + a.price, 0);
  const upsellTotal = selectedUpsellPlans.reduce((s, p) => s + p.price, 0);
  const mainPlanTotal = selectedMainPlan ? selectedMainPlan.price : 0;
  const productSubtotal = domainTotal + addOnsTotal + upsellTotal + mainPlanTotal;

  const totalsByCurrency = getTotalsByCurrency();
  const currenciesInCart = getCurrenciesInCart();
  const primaryCurrency = currenciesInCart[0] ?? "KES";
  const cartSubtotal = totalsByCurrency[primaryCurrency] ?? 0;

  const transferSubtotal = isTransferMode && transferContext ? transferContext.price : 0;
  const subtotal = isTransferMode ? transferSubtotal : isCartMode ? cartSubtotal : productSubtotal;
  const taxRate = 0.16;
  const taxes = subtotal * taxRate;
  const total = subtotal + taxes;
  const totalItems = getItemCount();

  const getUserFriendlyError = (resultCode: string | number, resultDesc?: string): string => {
    const code = typeof resultCode === "string" ? parseInt(resultCode, 10) : resultCode;
    const map: Record<number, string> = {
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
    return map[code] ?? resultDesc ?? `Payment failed with error code ${code}`;
  };

  const utils = trpc.useUtils();

  const initiateMpesaPayment = trpc.paymentGateway.mpesa.initiateStkPush.useMutation({
    onSuccess: (response) => {
      const checkoutId = response.data?.checkoutRequestId;
      if (!checkoutId) {
        toast.error("Payment request sent but failed to get transaction ID.");
        return;
      }
      setShouldStopPolling(false);
      setCheckoutRequestId(checkoutId);
      setPaymentError(null);
      startPolling(checkoutId);
    },
    onError: (error) => {
      const msg = error.message || "Failed to initiate payment.";
      terminalStateDetectedRef.current = true;
      immediateStepRef.current = "error";
      immediatePaymentErrorRef.current = msg;
      toast.error(msg);
      setCheckoutRequestId(null);
      setPaymentError(msg);
      setShouldStopPolling(true);
      setCurrentStep("error");
    },
  });

  // Poll queryStkPush: backend checks DB when Daraja returns 1037 so webhook result shows on next poll.
  const POLL_INTERVAL_MS = 1000;
  const POLL_MAX_ATTEMPTS = 90;

  const PROCESSING_CODES = new Set([1037, 4999]);

  const createOrderFromPayment = trpc.niscServiceOrders.createFromPayment.useMutation({
    onSuccess: () => {
      if (isCartMode) clearCart();
      setCheckoutRequestId(null);
      orderCreatedForCheckoutRef.current = null;
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || "Order could not be created. Please contact support.");
    },
  });

  // Create order on payment success ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â called from poll callback to avoid useEffect latency
  const triggerOrderFromPayment = React.useCallback(
    (checkoutRequestIdParam: string) => {
      if (orderCreatedForCheckoutRef.current === checkoutRequestIdParam) return;
      orderCreatedForCheckoutRef.current = checkoutRequestIdParam;
      const str = (n: number) => (Number.isFinite(n) ? String(n) : "0");
      if (isTransferMode && transferContext) {
        createOrderFromPayment.mutate({
          checkoutRequestId: checkoutRequestIdParam,
          items: [
            {
              productId: transferContext.productId,
              primaryDomain: transferContext.domain,
              description: "transfer",
              productPlanId: null,
              itemPrice: str(transferContext.price),
              itemSubtotal: str(transferContext.price),
              metadata: { transferAuthCode: transferContext.authCode },
            },
          ],
          currency: transferContext.currency,
          teamId: transferContext.teamId,
        });
        return;
      }
      if (isCartMode) {
        const domains = getDomains();
        if (!domainsProductId || domains.length === 0) return;
        const orderItems = domains.map((d) => {
          const { price, currency } = (() => {
            if (d.addedInCurrency && d.price?.calculated?.convertedPrice != null) {
              return { price: d.price.calculated.convertedPrice, currency: d.addedInCurrency };
            }
            if (d.price?.calculated?.finalPrice != null) {
              return {
                price: d.price.calculated.finalPrice,
                currency: d.price.calculated.currency ?? "KES",
              };
            }
            const p = d.price?.reseller?.price ?? d.price?.product?.price ?? 0;
            const c = d.price?.reseller?.currency ?? d.price?.product?.currency ?? "KES";
            return { price: p, currency: c };
          })();
          return {
            productId: domainsProductId,
            primaryDomain: d.domain,
            description: "registration",
            productPlanId: null,
            itemPrice: str(price),
            itemSubtotal: str(price),
          };
        });
        createOrderFromPayment.mutate({ checkoutRequestId: checkoutRequestIdParam, items: orderItems, currency: primaryCurrency });
        return;
      }
      if (!ctx?.productId || !ctx?.domain?.domain) return;
      const calc = ctx.domain.price?.calculated as { convertedPrice?: number; finalPrice?: number } | undefined;
      const price = calc?.convertedPrice ?? calc?.finalPrice ?? ctx.domain.price?.reseller?.price ?? 0;
      createOrderFromPayment.mutate({
        checkoutRequestId: checkoutRequestIdParam,
        items: [
          {
            productId: ctx.productId,
            primaryDomain: ctx.domain.domain,
            description: "registration",
            productPlanId: null,
            itemPrice: str(price),
            itemSubtotal: str(price),
          },
        ],
        currency: displayCurrency,
      });
    },
    [
      isTransferMode,
      transferContext,
      isCartMode,
      getDomains,
      domainsProductId,
      primaryCurrency,
      ctx,
      displayCurrency,
      createOrderFromPayment,
    ]
  );

  onPaymentSuccessRef.current = triggerOrderFromPayment;

  const startPolling = React.useCallback(
    (cid: string) => {
      setIsPolling(true);
      setShouldStopPolling(false);
      terminalStateDetectedRef.current = false;

      const stopPolling = (intervalId: ReturnType<typeof setInterval> | null) => {
        if (pollingQuickRetryRef.current !== null) {
          clearTimeout(pollingQuickRetryRef.current);
          pollingQuickRetryRef.current = null;
        }
        if (intervalId !== null) {
          clearInterval(intervalId);
        }
        pollingIntervalRef.current = null;
        setIsPolling(false);
      };

      const poll = async (): Promise<boolean> => {
        // Already resolved in a previous tick ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“ stop without another request
        if (terminalStateDetectedRef.current) {
          return true;
        }
        try {
          // Real-time only: no cache so every poll hits the server (avoids stale payment status)
          const res = await utils.paymentGateway.mpesa.queryStkPush.fetch(
            { checkoutRequestId: cid },
            { staleTime: 0, gcTime: 0 }
          );
          // Backend returns { success, data: { resultCode, resultDesc } }; accept both shapes
          const data = res && "data" in res ? (res as { data?: { resultCode?: string | number; resultDesc?: string } }).data : null;
          const resultCode = data?.resultCode ?? (res as { resultCode?: string | number })?.resultCode;
          const resultDesc = data?.resultDesc ?? (res as { resultDesc?: string })?.resultDesc;
          if (resultCode === undefined || resultCode === null) return false;
          const code = typeof resultCode === "string" ? parseInt(resultCode, 10) : resultCode;
          if (Number.isNaN(code)) return false;
          if (PROCESSING_CODES.has(code)) return false;

          // Terminal: success or failure ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“ clear interval immediately so no further polls run
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          setIsPolling(false);
          terminalStateDetectedRef.current = true;
          setShouldStopPolling(true);
          if (code === 0) {
            immediateStepRef.current = "success";
            immediatePaymentErrorRef.current = null;
            setPaymentError(null);
            setCurrentStep("success");
            onPaymentSuccessRef.current?.(cid);
            toast.success("Payment completed successfully!");
          } else {
            const msg = getUserFriendlyError(code, resultDesc);
            immediateStepRef.current = "error";
            immediatePaymentErrorRef.current = msg;
            setPaymentError(msg);
            setCurrentStep("error");
            toast.error(msg);
          }
          return true;
        } catch (err) {
          // Terminal errors: stop polling and show error instead of looping until timeout
          const message = err instanceof Error ? err.message : String(err);
          const isAuthError =
            message.includes("UNAUTHORIZED") ||
            message.includes("Authentication") ||
            message.includes("session") ||
            message.includes("Session expired");
          if (isAuthError) {
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
            setIsPolling(false);
            terminalStateDetectedRef.current = true;
            setShouldStopPolling(true);
            const authMsg = "Your session may have expired. Please sign in again and retry.";
            immediateStepRef.current = "error";
            immediatePaymentErrorRef.current = authMsg;
            setPaymentError(authMsg);
            setCurrentStep("error");
            toast.error(authMsg);
            return true;
          }
          return false;
        }
      };

      // First poll immediately, one quick retry at 1s, then every POLL_INTERVAL_MS (Daraja-first backend)
      poll().then((finished) => {
        if (finished) {
          stopPolling(null);
          return;
        }
        let attempts = 1;
        pollingQuickRetryRef.current = setTimeout(async () => {
          pollingQuickRetryRef.current = null;
          if (terminalStateDetectedRef.current) return;
          attempts += 1;
          const done = await poll();
          if (done) {
            stopPolling(null);
            return;
          }
          const id = setInterval(async () => {
            if (terminalStateDetectedRef.current) return;
            attempts += 1;
            const finishedAgain = await poll();
            if (finishedAgain || attempts >= POLL_MAX_ATTEMPTS) {
              stopPolling(id);
              if (!finishedAgain && attempts >= POLL_MAX_ATTEMPTS) {
                const msg = "Payment is taking longer than expected. Please check your M-Pesa or try again.";
                terminalStateDetectedRef.current = true;
                immediateStepRef.current = "error";
                immediatePaymentErrorRef.current = msg;
                setPaymentError(msg);
                setCurrentStep("error");
                toast.error(msg);
              }
            }
          }, POLL_INTERVAL_MS);
          pollingIntervalRef.current = id;
        }, 1000);
      });
    },
    [utils, getUserFriendlyError]
  );

  const validateAccountReference = (v: string) => {
    if (!v?.trim()) return "Account reference is required";
    if (v.length > 12) return "At most 12 characters";
    if (!/^[a-zA-Z0-9]+$/.test(v)) return "Alphanumeric only";
    return "";
  };
  const validatePhoneNumber = (v: string) => {
    const cleaned = v.replace(/[\s-]/g, "");
    if (!/^(?:254|0)[17]\d{8}$/.test(cleaned)) return "Valid Kenyan phone (e.g. 0712345678)";
    return "";
  };
  const validateAmount = (v: string) => {
    const n = parseFloat(v);
    if (isNaN(n) || n <= 0) return "Enter a valid amount greater than 0";
    return "";
  };

  const handleAccountReferenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^a-zA-Z0-9]/g, "").slice(0, 12);
    setAccountReference(value);
    setAccountRefError(validateAccountReference(value));
  };
  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMpesaPhoneNumber(e.target.value);
    setPhoneError(validatePhoneNumber(e.target.value));
  };
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPaymentAmount(e.target.value);
    setAmountError(validateAmount(e.target.value));
  };

  const handleMpesaPayment = async () => {
    const refErr = validateAccountReference(accountReference);
    const phoneErr = validatePhoneNumber(mpesaPhoneNumber);
    const amtErr = validateAmount(paymentAmount);
    setAccountRefError(refErr);
    setPhoneError(phoneErr);
    setAmountError(amtErr);
    if (refErr || phoneErr || amtErr) {
      toast.error("Please fix the errors in the form");
      return;
    }
    const amount = parseFloat(paymentAmount);
    const timestamp = Date.now().toString().slice(-9);
    const transactionDesc = isCartMode ? `CART${timestamp}` : isTransferMode && transferContext
      ? (transferContext.domain.replace(/\./g, "").slice(0, 9).toUpperCase() || "TRF") + timestamp
      : (ctx?.domain?.domain?.replace(/\./g, "").slice(0, 9).toUpperCase() ?? "ORD") + timestamp;
    try {
      await initiateMpesaPayment.mutateAsync({
        phoneNumber: mpesaPhoneNumber.trim(),
        amount,
        accountReference: accountReference.trim(),
        transactionDesc: transactionDesc.slice(0, 13),
      });
    } catch {
      // handled in onError
    }
  };

  const openForReview = () => {
    setCurrentStep("review");
    setPaymentAmount("");
    setAccountReference("");
    setAccountRefError("");
    setPhoneError("");
    setAmountError("");
    terminalStateDetectedRef.current = false;
    immediateStepRef.current = null;
    immediatePaymentErrorRef.current = null;
  };
  const openForPayment = () => {
    setCurrentStep("payment");
    setPaymentAmount(total.toString());
    const ts = Date.now().toString().slice(-9);
    setAccountReference(isCartMode ? `CART${ts}`.slice(0, 12) : isTransferMode && transferContext
      ? (transferContext.domain.replace(/\./g, "").slice(0, 3).toUpperCase() || "TRF") + ts
      : (ctx?.domain?.domain?.replace(/\./g, "").slice(0, 3).toUpperCase() || "ORD") + ts);
    setAccountRefError("");
    setPhoneError("");
    setAmountError("");
  };

  const handleBack = () => {
    if (currentStep === "hosting-upsell") setCurrentStep("product");
    else if (currentStep === "plan-selection") {
      if (isSelectingMainProductPlan) {
        setPlanSelectionProductId(null);
        setPlanSelectionProductName("");
        setIsSelectingMainProductPlan(false);
        setCurrentStep("product");
      } else setCurrentStep("hosting-upsell");
    } else if (currentStep === "review" && !isCartMode && ctx) {
      if (selectedMainPlan) {
        setPlanSelectionProductId(ctx.productId);
        setPlanSelectionProductName(ctx.productName);
        setIsSelectingMainProductPlan(true);
        setSelectedPlanId(selectedMainPlan.planId);
        setSelectedBillingCycle(selectedMainPlan.billingCycle);
        setCurrentStep("plan-selection");
      } else if (selectedUpsellPlans.length > 0) setCurrentStep("hosting-upsell");
      else setCurrentStep("product");
    } else if (currentStep === "payment") setCurrentStep("review");
  };

  const handleGetDeal = (productId: string, productName: string) => {
    setPlanSelectionProductId(productId);
    setPlanSelectionProductName(productName);
    setSelectedPlanId(null);
    setSelectedBillingCycle("MONTHLY");
    setCurrentStep("plan-selection");
  };

  const addSelectedPlanToUpsell = () => {
    const plan = plans.find((p) => p.id === selectedPlanId);
    if (!plan || !planSelectionProductId || !planSelectionProductName) return;
    const priceNum = parseFloat(plan.price ?? "0");
    const planCycle = (plan.billingCycle as "MONTHLY" | "YEARLY" | "BIENNIALLY") ?? "MONTHLY";
    const monthlyPrice = planCycle === "YEARLY" ? priceNum / 12 : planCycle === "BIENNIALLY" ? priceNum / 24 : priceNum;
    const months = selectedBillingCycle === "MONTHLY" ? 1 : selectedBillingCycle === "YEARLY" ? 12 : 24;
    const totalPrice = monthlyPrice * months;
    if (isSelectingMainProductPlan && ctx?.productId === planSelectionProductId) {
      setSelectedMainPlan({
        productId: planSelectionProductId,
        productName: planSelectionProductName,
        planId: plan.id,
        planName: plan.name,
        billingCycle: selectedBillingCycle,
        price: Math.round(totalPrice * 100) / 100,
        currency: plan.currency ?? "KES",
      });
      setPlanSelectionProductId(null);
      setPlanSelectionProductName("");
      setSelectedPlanId(null);
      setIsSelectingMainProductPlan(false);
      setCurrentStep("review");
    } else {
      setSelectedUpsellPlans((prev) => [
        ...prev.filter((p) => p.productId !== planSelectionProductId),
        {
          productId: planSelectionProductId,
          productName: planSelectionProductName,
          planId: plan.id,
          planName: plan.name,
          billingCycle: selectedBillingCycle,
          price: Math.round(totalPrice * 100) / 100,
          currency: plan.currency ?? "KES",
        },
      ]);
      setPlanSelectionProductId(null);
      setPlanSelectionProductName("");
      setSelectedPlanId(null);
      setCurrentStep("hosting-upsell");
    }
  };

  const toggleAddOn = (productId: string, productName: string, planId: string, planName: string, price: number, currency: string) => {
    setSelectedAddOns((prev) => {
      const exists = prev.some((a) => a.productId === productId);
      if (exists) return prev.filter((a) => a.productId !== productId);
      return [...prev, { productId, productName, planId, planName, price, currency }];
    });
  };

  React.useEffect(() => {
    if (!open) return;
    if (isTransferMode) {
      setCurrentStep("review");
    } else if (isCartMode) {
      setCurrentStep("review");
    } else {
      setCurrentStep(hasDomain ? "product" : "product");
    }
  }, [open, isCartMode, isTransferMode, hasDomain]);

  React.useEffect(() => {
    if (!open) {
      setCouponCode("");
      setShowCouponInput(false);
      setDuration(1);
      setSelectedAddOns([]);
      setSelectedUpsellPlans([]);
      setSelectedMainPlan(null);
      setPlanSelectionProductId(null);
      setIsSelectingMainProductPlan(false);
      setSelectedPlanId(null);
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
      setIsPolling(false);
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      terminalStateDetectedRef.current = false;
      immediateStepRef.current = null;
      immediatePaymentErrorRef.current = null;
      orderCreatedForCheckoutRef.current = null;
    }
  }, [open]);

  if (!open) return null;
  if (isCartMode && totalItems === 0) {
    close();
    return null;
  }
  if (isTransferMode && !transferContext) {
    close();
    return null;
  }

  const effectiveStep = immediateStepRef.current ?? currentStep;
  const primaryCurr = isCartMode ? primaryCurrency : displayCurrency;
  const showPaymentWaiting = isPolling;

  const renderStep = () => {
    switch (effectiveStep) {
      case "product": {
        if (!ctx) return null;
        return (
          <div className="space-y-4">
            <div className="text-center py-2">
              <h3 className="text-lg font-semibold text-foreground">Get the best of your {ctx.productName}</h3>
              <p className="text-sm text-muted-foreground">Complete your purchase and add optional services</p>
            </div>
            <ScrollArea className="h-[400px] w-full">
              <div className="space-y-4 pr-4">
                {hasDomain && ctx.domain && (
                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium truncate">{ctx.domain.domain}</span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help flex-shrink-0" />
                            </TooltipTrigger>
                            <TooltipContent>Domain registered for selected duration.</TooltipContent>
                          </Tooltip>
                        </div>
                        <Select value={duration.toString()} onValueChange={(v) => setDuration(parseInt(v, 10))}>
                          <SelectTrigger className="w-full">
                            <SelectValue>{duration} {duration === 1 ? "year" : "years"}</SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4, 5, 10].map((y) => (
                              <SelectItem key={y} value={String(y)}>{y} year{y > 1 ? "s" : ""}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="text-right flex-shrink-0 font-semibold text-lg">
                        {formatPrice(domainTotal, displayCurrency)}
                      </div>
                    </div>
                  </div>
                )}

                {addOnsData.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-base font-semibold text-foreground">Recommended add-ons</h4>
                    {addOnsData.map(({ product, plans: addonPlans }) => {
                      const plan = (addonPlans as Array<{ id: string; name: string; price: string | null; currency: string }>)[0];
                      const price = plan ? parseFloat(plan.price ?? "0") : 0;
                      const currency = plan?.currency ?? "KES";
                      const isSelected = selectedAddOns.some((a) => a.productId === product.id);
                      return (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => plan && toggleAddOn(product.id, product.name, plan.id, plan.name, price, currency)}
                          className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                            isSelected ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/50"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <span className="font-medium text-foreground">{product.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${isSelected ? "border-primary bg-primary" : "border-muted-foreground"}`}>
                                {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                              </div>
                              <span className="text-sm font-medium">{price === 0 ? "Free" : formatPrice(price, currency)}</span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {!hasDomain && !isDomainProduct && (
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="font-medium text-foreground">{ctx.productName}</div>
                  </div>
                )}
              </div>
              <ScrollBar orientation="vertical" />
            </ScrollArea>
          </div>
        );
      }

      case "hosting-upsell":
        return (
          <div className="space-y-4">
            <div className="text-center py-2">
              <h3 className="text-lg font-semibold text-foreground">Add hosting services</h3>
            </div>
            {selectedUpsellPlans.length > 0 && (
              <div className="space-y-2">
                {selectedUpsellPlans.map((p) => (
                  <div key={p.planId} className="bg-muted/50 rounded-lg p-4 flex justify-between items-center">
                    <div>
                      <div className="font-medium">{p.productName} ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“ {p.planName}</div>
                      <div className="text-sm text-muted-foreground">{p.billingCycle}</div>
                    </div>
                    <div className="font-semibold">{formatPrice(p.price, p.currency)}</div>
                  </div>
                ))}
              </div>
            )}
            {hostingUpsellProducts.map(({ product }) => (
              <div key={product.id} className="rounded-lg border-2 border-border bg-card p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {product.name.toLowerCase().includes("email") ? <Mail className="h-5 w-5 text-primary" /> : <Globe className="h-5 w-5 text-primary" />}
                    <span className="font-semibold text-foreground">{product.name}</span>
                  </div>
                  <Button
                    variant={selectedUpsellPlans.some((u) => u.productId === product.id) ? "secondary" : "default"}
                    onClick={() => handleGetDeal(product.id, product.name)}
                  >
                    {selectedUpsellPlans.some((u) => u.productId === product.id) ? "Change plan" : "Get deal"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        );

      case "plan-selection":
        return (
          <div className="space-y-4">
            <div className="text-center py-2">
              <h3 className="text-lg font-semibold text-foreground">Select plan ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“ {planSelectionProductName}</h3>
              <p className="text-sm text-muted-foreground">Choose a plan from the list</p>
            </div>
            {plans.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No plans available.</div>
            ) : (
              <div className="space-y-3">
                {plans.map((plan) => {
                  const price = parseFloat(plan.price ?? "0");
                  const isSelected = selectedPlanId === plan.id;
                  const planCycle = (plan.billingCycle as "MONTHLY" | "YEARLY" | "BIENNIALLY") ?? "MONTHLY";
                  const cycle = isSelected ? selectedBillingCycle : planCycle;
                  let monthlyPrice = price;
                  if (planCycle === "YEARLY") monthlyPrice = price / 12;
                  else if (planCycle === "BIENNIALLY") monthlyPrice = price / 24;
                  const months = cycle === "MONTHLY" ? 1 : cycle === "YEARLY" ? 12 : 24;
                  const displayTotal = monthlyPrice * months;
                  return (
                    <div
                      key={plan.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        setSelectedPlanId(plan.id);
                        setSelectedBillingCycle(planCycle);
                      }}
                      onKeyDown={(e) => e.key === "Enter" && (setSelectedPlanId(plan.id), setSelectedBillingCycle(planCycle))}
                      className={`rounded-lg border-2 p-4 cursor-pointer transition-all ${
                        isSelected ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <span className="font-semibold text-foreground">{plan.name}</span>
                          <p className="text-sm text-muted-foreground mt-1">
                            {formatPrice(monthlyPrice, plan.currency)}/mo
                          </p>
                          {isSelected && (
                            <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                              <Select
                                value={cycle}
                                onValueChange={(v: "MONTHLY" | "YEARLY" | "BIENNIALLY") => setSelectedBillingCycle(v)}
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
                        <div className="text-right flex-shrink-0">
                          <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${isSelected ? "border-primary bg-primary" : "border-muted-foreground"}`}>
                            {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                          </div>
                          {isSelected && (
                            <div className="text-sm font-medium mt-1">{formatPrice(displayTotal, plan.currency)}</div>
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
        if (isTransferMode && transferContext) {
          return (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 flex justify-between items-center">
                <div>
                  <div className="font-medium">Domain transfer ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“ {transferContext.domain}</div>
                  <div className="text-sm text-muted-foreground">Includes 1 year renewal</div>
                </div>
                <div className="font-semibold">{formatPrice(transferContext.price, transferContext.currency)}</div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Taxes & fees</span>
                <span>{formatPrice(taxes, primaryCurr)}</span>
              </div>
              <div className="border-t pt-4 flex items-center justify-between font-bold text-lg">
                <span>Total</span>
                <span>{formatPrice(total, primaryCurr)}</span>
              </div>
              <p className="text-xs text-muted-foreground">By paying you agree to our Terms of Service. The transfer will be processed after payment.</p>
            </div>
          );
        }
        if (isCartMode) {
          return (
            <div className="space-y-4">
              <ScrollArea className="h-[200px] w-full">
                <div className="space-y-3 pr-4">
                  {items.map((item) => (
                    <CartItemCard key={item.id} item={item} onRemove={() => {}} hideRemoveButton />
                  ))}
                </div>
                <ScrollBar orientation="vertical" />
              </ScrollArea>
              {!showCouponInput ? (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Coupon code</span>
                  <Button variant="link" className="h-auto p-0 text-primary" onClick={() => setShowCouponInput(true)}>Add</Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Input placeholder="Coupon code" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} className="flex-1" />
                  <Button variant="outline" size="sm" onClick={() => (setShowCouponInput(false), setCouponCode(""))}>Cancel</Button>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Taxes & fees</span>
                <Tooltip><TooltipTrigger asChild><HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" /></TooltipTrigger><TooltipContent>16% VAT</TooltipContent></Tooltip>
                <span>{formatPrice(taxes, primaryCurr)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Sub total</span>
                <span>{formatPrice(subtotal, primaryCurr)}</span>
              </div>
              <div className="border-t pt-4 flex items-center justify-between font-bold text-lg">
                <span>Total</span>
                <span>{formatPrice(total, primaryCurr)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                By checking out you agree to our Terms of Service and Privacy Policy.
              </p>
            </div>
          );
        }
        return (
          <div className="space-y-4">
            <ScrollArea className="h-[300px] w-full">
              <div className="space-y-4 pr-4">
                {hasDomain && ctx?.domain && (
                  <div className="bg-muted/50 rounded-lg p-4 flex justify-between">
                    <div><div className="font-medium">{ctx.domain.domain}</div><div className="text-sm text-muted-foreground">{duration} {duration === 1 ? "year" : "years"}</div></div>
                    <div className="font-semibold">{formatPrice(domainTotal, displayCurrency)}</div>
                  </div>
                )}
                {selectedAddOns.length > 0 && selectedAddOns.map((a) => (
                  <div key={a.productId} className="bg-muted/50 rounded-lg p-4 flex justify-between">
                    <div><div className="font-medium">{a.productName}</div><div className="text-sm text-muted-foreground">{a.planName}</div></div>
                    <div className="font-semibold">{formatPrice(a.price, a.currency)}</div>
                  </div>
                ))}
                {selectedMainPlan && (
                  <div className="bg-muted/50 rounded-lg p-4 flex justify-between">
                    <div><div className="font-medium">{selectedMainPlan.productName} ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“ {selectedMainPlan.planName}</div><div className="text-sm text-muted-foreground">{selectedMainPlan.billingCycle}</div></div>
                    <div className="font-semibold">{formatPrice(selectedMainPlan.price, selectedMainPlan.currency)}</div>
                  </div>
                )}
                {selectedUpsellPlans.map((p) => (
                  <div key={p.planId} className="bg-muted/50 rounded-lg p-4 flex justify-between">
                    <div><div className="font-medium">{p.productName} ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“ {p.planName}</div><div className="text-sm text-muted-foreground">{p.billingCycle}</div></div>
                    <div className="font-semibold">{formatPrice(p.price, p.currency)}</div>
                  </div>
                ))}
              </div>
              <ScrollBar orientation="vertical" />
            </ScrollArea>
            {!showCouponInput ? (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Coupon code</span>
                <Button variant="link" className="h-auto p-0 text-primary" onClick={() => setShowCouponInput(true)}>Add</Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Input placeholder="Coupon code" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} className="flex-1" />
                <Button variant="outline" size="sm" onClick={() => (setShowCouponInput(false), setCouponCode(""))}>Cancel</Button>
              </div>
            )}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Taxes & fees</span>
              <span>{formatPrice(taxes, primaryCurr)}</span>
            </div>
            <div className="border-t pt-4 flex items-center justify-between font-bold text-lg">
              <span>Total</span>
              <span>{formatPrice(total, primaryCurr)}</span>
            </div>
            <p className="text-xs text-muted-foreground">By checking out you agree to our Terms of Service and Privacy Policy.</p>
          </div>
        );

      case "payment":
        return (
          <div className="space-y-4">
            <div className="text-center py-2">
              <h3 className="text-lg font-semibold text-foreground">Choose payment method</h3>
              <p className="text-sm text-muted-foreground">Select your preferred method</p>
            </div>
            <Accordion type="single" collapsible className="w-full" value={selectedPaymentMethod ?? undefined}>
              <AccordionItem value="mpesa" className="border rounded-lg">
                <Card className="border-0 shadow-none">
                  <AccordionTrigger className="px-4 py-4 hover:no-underline" onClick={() => setSelectedPaymentMethod(selectedPaymentMethod === "mpesa" ? null : "mpesa")}>
                    <div className="flex items-center gap-4 w-full">
                      <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                        <img src="/mpesa.png" alt="M-Pesa" className="w-full h-full object-contain" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-semibold text-foreground">M-Pesa</div>
                        <div className="text-sm text-muted-foreground">Secured by Nisc Cloud</div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    {showPaymentWaiting ? (
                      <div className="py-8 flex flex-col items-center">
                        <Spinner variant="ellipsis" size={48} className="mb-4 text-primary" />
                        <p className="text-sm font-medium">Waiting for payment confirmation...</p>
                      </div>
                    ) : (
                      <div className="space-y-4 pt-2">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Phone number *</label>
                          <Input placeholder="0712345678 or 254712345678" value={mpesaPhoneNumber} onChange={handlePhoneNumberChange} className={phoneError ? "border-destructive" : ""} />
                          {phoneError && <p className="text-xs text-destructive">{phoneError}</p>}
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Amount ({primaryCurr}) *</label>
                          <Input type="number" value={paymentAmount} onChange={handleAmountChange} className={amountError ? "border-destructive" : ""} min={1} />
                          {amountError && <p className="text-xs text-destructive">{amountError}</p>}
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Account reference *</label>
                          <Input placeholder="Account reference" value={accountReference} onChange={handleAccountReferenceChange} className={accountRefError ? "border-destructive" : ""} maxLength={12} />
                          {accountRefError && <p className="text-xs text-destructive">{accountRefError}</p>}
                        </div>
                        <Button
                          onClick={handleMpesaPayment}
                          disabled={initiateMpesaPayment.isPending || !mpesaPhoneNumber || !paymentAmount || !accountReference || !!accountRefError || !!phoneError || !!amountError}
                          className="w-full bg-green-600 hover:bg-green-700 text-white"
                        >
                          {initiateMpesaPayment.isPending ? "Processing..." : "Pay with M-Pesa"}
                        </Button>
                      </div>
                    )}
                  </AccordionContent>
                </Card>
              </AccordionItem>
            </Accordion>
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span>{formatPrice(subtotal, primaryCurr)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Taxes</span><span>{formatPrice(taxes, primaryCurr)}</span></div>
              <div className="flex justify-between font-bold text-lg border-t pt-2"><span>Total</span><span>{formatPrice(total, primaryCurr)}</span></div>
            </div>
          </div>
        );

      case "success":
        return (
          <div className="space-y-4 text-center py-4">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Payment successful</h3>
            <p className="text-sm text-muted-foreground">Your order has been received.</p>
            <div className="border-t pt-4 text-sm">
              <span className="text-muted-foreground">Order total </span>
              <span className="font-semibold">{formatPrice(total, primaryCurr)}</span>
            </div>
          </div>
        );

      case "error":
        const errMsg = immediatePaymentErrorRef.current ?? paymentError ?? "Payment failed.";
        return (
          <div className="space-y-4 text-center py-4">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl text-red-600 dark:text-red-400">ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¢</span>
            </div>
            <h3 className="text-lg font-semibold text-foreground">Payment failed</h3>
            <p className="text-sm text-muted-foreground">{errMsg}</p>
            <div className="border-t pt-4 text-sm">
              <span className="text-muted-foreground">Order total </span>
              <span className="font-semibold">{formatPrice(total, primaryCurr)}</span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getTitle = () => {
    if (isCartMode) return totalItems === 1 ? "Complete your purchase" : `Review ${totalItems} items`;
    if (effectiveStep === "product") return `Buy ${hasDomain ? ctx?.domain?.domain ?? ctx?.productName : ctx?.productName}`;
    if (effectiveStep === "hosting-upsell") return "Add hosting";
    if (effectiveStep === "plan-selection") return `Select plan ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“ ${planSelectionProductName}`;
    if (effectiveStep === "review") return "Complete and review";
    if (effectiveStep === "payment") return "Choose payment method";
    if (effectiveStep === "success") return "Order confirmed";
    if (effectiveStep === "error") return "Payment failed";
    return "Buy now";
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col overflow-hidden p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0">
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>
            {effectiveStep === "product" && "Add optional services and proceed."}
            {effectiveStep === "hosting-upsell" && "Add hosting (optional)."}
            {effectiveStep === "plan-selection" && "Choose a plan."}
            {effectiveStep === "review" && "Review and proceed to checkout."}
            {effectiveStep === "payment" && "Complete your payment."}
            {effectiveStep === "success" && "Order confirmed."}
            {effectiveStep === "error" && "Payment could not be completed."}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0 px-6 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="py-4 pr-4">{renderStep()}</div>
            <ScrollBar orientation="vertical" />
          </ScrollArea>
        </div>
        <DialogFooter className="gap-2 px-6 pb-6 pt-4 flex-shrink-0 border-t">
          {effectiveStep === "product" && (
            <>
              <Button variant="ghost" onClick={() => close()}>Cancel</Button>
              <Button
                onClick={() => {
                  if (isDomainProduct && hostingUpsellProducts.length > 0) setCurrentStep("hosting-upsell");
                  else if (!hasDomain && ctx?.productId) {
                    setPlanSelectionProductId(ctx.productId);
                    setPlanSelectionProductName(ctx.productName);
                    setIsSelectingMainProductPlan(true);
                    setCurrentStep("plan-selection");
                  } else setCurrentStep("review");
                }}
              >
                {isDomainProduct && hostingUpsellProducts.length > 0 ? "Continue" : !hasDomain && ctx?.productId ? "Select plan" : "Proceed to checkout"}
              </Button>
            </>
          )}
          {effectiveStep === "hosting-upsell" && (
            <>
              <Button variant="ghost" onClick={handleBack}>Back</Button>
              <Button onClick={() => setCurrentStep("review")}>Proceed to checkout</Button>
            </>
          )}
          {effectiveStep === "plan-selection" && (
            <>
              <Button
                variant="ghost"
                onClick={() => {
                  setPlanSelectionProductId(null);
                  setPlanSelectionProductName("");
                  setIsSelectingMainProductPlan(false);
                  setCurrentStep(isSelectingMainProductPlan ? "product" : "hosting-upsell");
                }}
              >
                Back
              </Button>
              <Button onClick={addSelectedPlanToUpsell} disabled={!selectedPlanId}>Continue</Button>
            </>
          )}
          {effectiveStep === "review" && (
            <>
              <Button variant="ghost" onClick={isCartMode ? () => close() : isTransferMode ? () => close() : handleBack}>
                {isCartMode ? "Cancel" : isTransferMode ? "Cancel" : "Back"}
              </Button>
              <Button onClick={openForPayment}>
                {isTransferMode ? "Proceed to payment" : "Choose payment method"}
              </Button>
            </>
          )}
          {effectiveStep === "payment" && (
            <Button variant="outline" onClick={() => setCurrentStep("review")}>Back</Button>
          )}
          {effectiveStep === "success" && (
            <Button onClick={() => close()}>Close</Button>
          )}
          {effectiveStep === "error" && (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setCurrentStep("payment");
                  setPaymentError(null);
                  setCheckoutRequestId(null);
                  setShouldStopPolling(false);
                  terminalStateDetectedRef.current = false;
                  immediateStepRef.current = null;
                  immediatePaymentErrorRef.current = null;
                }}
              >
                Try again
              </Button>
              <Button onClick={() => close()}>Close</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
