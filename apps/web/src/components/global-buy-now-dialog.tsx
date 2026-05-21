"use client";

import * as React from "react";
import { HelpCircle, Check, Globe, Mail, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/npanel-ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Link, useLocation } from "react-router";
import { User, Users, UserSearch, AlertTriangle } from "lucide-react";
import { ComboboxDropdown, type ComboboxItem } from "@npanel/ui/components/combobox-dropdown";
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
import type { CartItem, DomainCartItem, HivelocityCartItem } from "@/stores/cart-store";
import { CartItemCard } from "@/routes/agency/_components/sidebar/cart-item-card";
import { authClient } from "@/lib/auth-client";
import { BuyNowDomainProductStep } from "@/components/buy-now-domain-product-step";

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

function parsePriceOverrideInput(raw: string | undefined): number | null {
  if (raw == null) return null;
  const t = String(raw).trim().replace(/,/g, "");
  if (!t) return null;
  const n = parseFloat(t);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100) / 100;
}

const PROFILE_FIELD_LABELS: Record<string, string> = {
  firstName: "First name",
  lastName: "Last name",
  address: "Street address",
  city: "City",
  country: "Country",
  postalCode: "Postal code",
  phone: "Phone number",
};

function getMissingProfileFields(profile: {
  firstName?: string | null;
  lastName?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  postalCode?: string | null;
  phone?: string | null;
} | null | undefined): string[] {
  if (!profile) return Object.values(PROFILE_FIELD_LABELS);
  const missing: string[] = [];
  for (const key of Object.keys(PROFILE_FIELD_LABELS) as Array<keyof typeof PROFILE_FIELD_LABELS>) {
    const value = profile[key];
    if (!value || String(value).trim() === "") {
      missing.push(PROFILE_FIELD_LABELS[key]!);
    }
  }
  return missing;
}

type RegistrantType = "customer" | "myself" | "existing_customer";

type ManualRegistrantDetails = {
  firstName: string;
  lastName: string;
  email: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  phone: string;
};

type CustomerForRegistrant = {
  id: string;
  name: string;
  email: string;
  profileComplete: boolean;
  missingFields: string[];
  profile: {
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    country: string | null;
    postalCode: string | null;
  } | null;
};

function customerToManualRegistrantDetails(customer: CustomerForRegistrant): ManualRegistrantDetails {
  const p = customer.profile;
  return {
    firstName: p?.firstName?.trim() ?? "",
    lastName: p?.lastName?.trim() ?? "",
    email: customer.email.trim(),
    address: p?.address?.trim() ?? "",
    city: p?.city?.trim() ?? "",
    country: p?.country?.trim() ?? "Kenya",
    postalCode: p?.postalCode?.trim() ?? "",
    phone: p?.phone?.trim() ?? "",
  };
}

function buildRegistrantOrderMetadata(
  registrantType: RegistrantType,
  manualRegistrantDetails: ManualRegistrantDetails,
  selectedCustomer: CustomerForRegistrant | undefined,
): {
  useRegistrantInfo: "myself" | "customer";
  manualRegistrantDetails?: ManualRegistrantDetails;
} {
  if (registrantType === "myself") {
    return { useRegistrantInfo: "myself" };
  }
  if (registrantType === "existing_customer" && selectedCustomer?.profileComplete) {
    return {
      useRegistrantInfo: "customer",
      manualRegistrantDetails: customerToManualRegistrantDetails(selectedCustomer),
    };
  }
  return {
    useRegistrantInfo: "customer",
    manualRegistrantDetails,
  };
}

function getDomainCartLineBasePrice(d: {
  addedInCurrency?: string;
  price?: DomainCartItem["price"];
}): number {
  if (d.addedInCurrency && d.price?.calculated?.convertedPrice != null) {
    return d.price.calculated.convertedPrice;
  }
  if (d.price?.calculated?.finalPrice != null) {
    return d.price.calculated.finalPrice;
  }
  return d.price?.reseller?.price ?? d.price?.product?.price ?? 0;
}

type Step =
  | "product"
  | "hosting-upsell"
  | "plan-selection"
  | "review"
  | "registrant_info"
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

/** Scrollable step body — avoids dialog overflow on small viewports. */
function BuyNowStepScroll({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <ScrollArea className="h-[min(52vh,28rem)] w-full">
      <div className={cn("px-1 py-2", className)}>{children}</div>
      <ScrollBar orientation="vertical" />
    </ScrollArea>
  );
}

export function GlobalBuyNowDialog() {
  const { open, mode, productContext, transferContext, close } = useGlobalBuyNowStore();
  const { items, getTotalsByCurrency, getCurrenciesInCart, getItemCount, clearCart, getDomains } = useCartStore();

  const [currentStep, setCurrentStep] = React.useState<Step>("review");
  const [couponCode, setCouponCode] = React.useState("");

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
  /** Per-line ex VAT amounts keyed for DB / checkout (agency users only). */
  const [priceOverrideByKey, setPriceOverrideByKey] = React.useState<Record<string, string>>({});
  const [checkoutRequestId, setCheckoutRequestId] = React.useState<string | null>(null);
  const [manualTransactionReference, setManualTransactionReference] = React.useState("");
  const [manualTransactionRefError, setManualTransactionRefError] = React.useState("");
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

  const location = useLocation();
  const { data: session, isPending: isSessionLoading } = authClient.useSession();
  const isAgencyUser = React.useMemo(() => {
    const user = session?.user as any;
    const role = String(user?.role || "");
    return role.toUpperCase().includes("AGENCY") || !!user?.agencyRoleId;
  }, [session?.user]);

  const isAgencySide = React.useMemo(() => {
    return location.pathname.startsWith("/agency") || isAgencyUser;
  }, [location.pathname, isAgencyUser]);

  const [registrantType, setRegistrantType] = React.useState<RegistrantType>(
    isAgencySide ? "customer" : "myself"
  );
  const [selectedExistingCustomerId, setSelectedExistingCustomerId] = React.useState("");
  const [manualRegistrantDetails, setManualRegistrantDetails] = React.useState<ManualRegistrantDetails>({
    firstName: "",
    lastName: "",
    email: "",
    address: "",
    city: "",
    country: "Kenya",
    postalCode: "",
    phone: "",
  });

  const isManualDetailsComplete = React.useMemo(() => {
    const required = [
      manualRegistrantDetails.firstName,
      manualRegistrantDetails.lastName,
      manualRegistrantDetails.email,
      manualRegistrantDetails.address,
      manualRegistrantDetails.city,
      manualRegistrantDetails.country,
      manualRegistrantDetails.phone,
    ];
    return required.every((f) => !!f && String(f).trim().length > 0);
  }, [manualRegistrantDetails]);

  const isCartMode = mode === "cart";
  const isTransferMode = mode === "transfer";
  const ctx = productContext;
  const hasDomain = !!ctx?.domain?.domain;
  const { data: domainsProductId } = trpc.clientSubscriptions.getDomainsProductId.useQuery(undefined, {
    enabled: open && (isCartMode || !!ctx?.productId),
  });

  const isDomainProduct = React.useMemo(() => {
    if (isTransferMode) return true;
    if (isCartMode) {
      return items.some(
        (i) => 
          i.productId === domainsProductId || 
          !!i.description?.toLowerCase().includes("domain") || 
          !!i.productName?.toLowerCase().includes("domain")
      );
    }
    const isDomain = hasDomain || !!ctx?.productName?.toLowerCase().includes("domain");
    return !!isDomain;
  }, [isTransferMode, isCartMode, items, domainsProductId, hasDomain, ctx?.productName]);

  const { data: addOnsData = [] } = trpc.products.getAddOnsForProduct.useQuery(
    { baseProductId: ctx?.productId ?? "" },
    { enabled: open && !!ctx?.productId && !isCartMode }
  );
  const { data: hostingUpsellProducts = [] } = trpc.products.getHostingProductsForUpsell.useQuery(undefined, {
    enabled: open && !isCartMode && isDomainProduct,
  });
  const userInfoQuery = trpc.userProfile.getUserInfo.useQuery(undefined, {
    enabled: open && isDomainProduct,
  });

  const customerProfileHref = React.useMemo(() => {
    const slug = location.pathname.split("/").filter(Boolean)[0];
    return slug ? `/${slug}/my-profile` : "/dashboard/my-profile";
  }, [location.pathname]);

  const isCustomerDomainCheckout = isDomainProduct && !isAgencySide;
  const isAgencyDomainCheckout = isDomainProduct && isAgencySide;

  const customersForRegistrantQuery = trpc.userProfile.listCustomersForRegistrant.useQuery(undefined, {
    enabled: open && isAgencyDomainCheckout,
  });

  const customersForRegistrant = customersForRegistrantQuery.data ?? [];

  const selectedExistingCustomer = React.useMemo(
    () => customersForRegistrant.find((c) => c.id === selectedExistingCustomerId),
    [customersForRegistrant, selectedExistingCustomerId],
  );

  const customerComboboxItems: ComboboxItem[] = React.useMemo(
    () =>
      customersForRegistrant.map((c) => ({
        id: c.id,
        label: c.name?.trim() ? `${c.name} (${c.email})` : c.email,
        disabled: !c.profileComplete,
      })),
    [customersForRegistrant],
  );

  const selectedCustomerComboboxItem = React.useMemo(
    () => customerComboboxItems.find((item) => item.id === selectedExistingCustomerId),
    [customerComboboxItems, selectedExistingCustomerId],
  );

  const isExistingCustomerReady =
    registrantType === "existing_customer" &&
    !!selectedExistingCustomer?.profileComplete;

  const registrantOrderMetadata = React.useMemo(
    () =>
      buildRegistrantOrderMetadata(
        registrantType,
        manualRegistrantDetails,
        selectedExistingCustomer,
      ),
    [registrantType, manualRegistrantDetails, selectedExistingCustomer],
  );
  const teamId = isTransferMode ? transferContext?.teamId : ctx?.teamId;
  const teamBillingQuery = trpc.teamBilling.getByTeam.useQuery(
    { teamId: teamId ?? "" },
    { enabled: open && isAgencySide && isDomainProduct && !!teamId }
  );

  const userProfile = userInfoQuery.data?.profile;
  const isProfileComplete = React.useMemo(() => {
    if (!userProfile) return false;
    const required = [
      userProfile.firstName,
      userProfile.lastName,
      userProfile.address,
      userProfile.city,
      userProfile.country,
      userProfile.postalCode,
      userProfile.phone,
    ];
    return required.every((f) => !!f && String(f).trim().length > 0);
  }, [userProfile]);

  const missingProfileFields = React.useMemo(
    () => getMissingProfileFields(userProfile),
    [userProfile],
  );

  const teamBilling = teamBillingQuery.data;
  const isTeamBillingComplete = React.useMemo(() => {
    if (!teamBilling) return false;
    const required = [
      teamBilling.legalName,
      teamBilling.billingEmail,
      teamBilling.addressLine1,
      teamBilling.city,
      teamBilling.country,
    ];
    return required.every((f) => !!f && String(f).trim().length > 0);
  }, [teamBilling]);
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
  const VAT_RATE = 0.16;
  const taxes = subtotal * VAT_RATE;
  const total = subtotal + taxes;
  const totalItems = getItemCount();

  const effectiveTransferSubtotal =
    isTransferMode && transferContext
      ? (isAgencyUser ? parsePriceOverrideInput(priceOverrideByKey["transfer"]) ?? transferContext.price : transferContext.price)
      : 0;

  const effectiveCartSubtotal = React.useMemo(() => {
    if (!isCartMode) return 0;
    return items.reduce((sum, item) => {
      if (item.type === "domain" && item.price) {
        const base = getDomainCartLineBasePrice(item);
        const key = `cart-domain:${item.id}`;
        const o = isAgencyUser ? parsePriceOverrideInput(priceOverrideByKey[key]) : null;
        return sum + (o ?? base);
      }
      if (item.type === "hivelocity") {
        const hv = item as HivelocityCartItem;
        const b = Number(hv.totalPrice ?? 0) || 0;
        const key = `cart-hivelocity:${item.id}`;
        const o = isAgencyUser ? parsePriceOverrideInput(priceOverrideByKey[key]) : null;
        return sum + (o ?? b);
      }
      const key = `cart:${item.type}:${item.id}`;
      const b = Number((item as { price?: number }).price ?? 0) || 0;
      const o = isAgencyUser ? parsePriceOverrideInput(priceOverrideByKey[key]) : null;
      return sum + (o ?? b);
    }, 0);
  }, [isCartMode, items, isAgencyUser, priceOverrideByKey]);

  const effectiveProductFlowSubtotal = React.useMemo(() => {
    if (isCartMode || isTransferMode) return productSubtotal;
    const domainEff =
      isAgencyUser ? parsePriceOverrideInput(priceOverrideByKey["product-domain"]) ?? domainTotal : domainTotal;
    const addOnEff = selectedAddOns.reduce((s, a) => {
      const o = isAgencyUser ? parsePriceOverrideInput(priceOverrideByKey[`addon:${a.productId}`]) : null;
      return s + (o ?? a.price);
    }, 0);
    const mainEff = selectedMainPlan
      ? (isAgencyUser
          ? parsePriceOverrideInput(priceOverrideByKey[`main-plan:${selectedMainPlan.planId}`]) ?? selectedMainPlan.price
          : selectedMainPlan.price)
      : 0;
    const upsellEff = selectedUpsellPlans.reduce((s, p) => {
      const key = `upsell:${p.productId}:${p.planId}`;
      const o = isAgencyUser ? parsePriceOverrideInput(priceOverrideByKey[key]) : null;
      return s + (o ?? p.price);
    }, 0);
    return domainEff + addOnEff + mainEff + upsellEff;
  }, [
    isCartMode,
    isTransferMode,
    productSubtotal,
    isAgencyUser,
    priceOverrideByKey,
    domainTotal,
    selectedAddOns,
    selectedMainPlan,
    selectedUpsellPlans,
  ]);

  const effectiveSubtotal = isTransferMode
    ? effectiveTransferSubtotal
    : isCartMode
      ? effectiveCartSubtotal
      : effectiveProductFlowSubtotal;
  const effectiveTaxes = effectiveSubtotal * VAT_RATE;
  const effectiveTotal = effectiveSubtotal + effectiveTaxes;

  const patchPriceOverride = React.useCallback((key: string, value: string) => {
    setPriceOverrideByKey((prev) => ({ ...prev, [key]: value }));
  }, []);

  const priceOverrideField = (key: string, currency: string, catalogExVat: number) => {
    if (!isAgencyUser || isSessionLoading) return null;
    const ph =
      typeof catalogExVat === "number" && Number.isFinite(catalogExVat)
        ? String(Math.round(catalogExVat * 100) / 100)
        : "";
    return (
      <div className="mt-3 pt-3 border-t border-border/60 space-y-1.5 w-full">
        <p className="text-xs font-medium text-foreground">Price override</p>
        <Input
          type="text"
          inputMode="decimal"
          className="h-9 text-sm max-w-[220px]"
          placeholder={ph}
          value={priceOverrideByKey[key] ?? ""}
          onChange={(e) => patchPriceOverride(key, e.target.value)}
        />
        <p className="text-[10px] text-muted-foreground leading-snug">
          Use this if you want to enter your own custom price (ex VAT, {currency}).
        </p>
      </div>
    );
  };

  const getDomainCartLineCurrency = (d: DomainCartItem): string => {
    if (d.addedInCurrency) return d.addedInCurrency;
    if (d.price?.calculated?.currency) return d.price.calculated.currency;
    if (d.price?.reseller?.currency) return d.price.reseller.currency;
    if (d.price?.product?.currency) return d.price.product.currency;
    return "KES";
  };

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

  const utils = trpc.useUtils();

  const createOrderFromPayment = trpc.niscServiceOrders.createFromPayment.useMutation({
    onSuccess: () => {
      if (isCartMode) clearCart();
      setCheckoutRequestId(null);
      orderCreatedForCheckoutRef.current = null;
      if (isTransferMode) {
        void utils.domainTransfer.listTransferRequests.invalidate();
      }
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || "Order could not be created. Please contact support.");
    },
  });

  const recordManualPayment = trpc.paymentTransactions.recordManual.useMutation({
    onError: (err: { message?: string }) => {
      toast.error(err.message || "Could not record payment.");
    },
  });

  // Create order on payment success ?? called from poll callback to avoid useEffect latency
  const triggerOrderFromPayment = React.useCallback(
    (checkoutRequestIdParam: string) => {
      if (orderCreatedForCheckoutRef.current === checkoutRequestIdParam) return;
      orderCreatedForCheckoutRef.current = checkoutRequestIdParam;
      const str = (n: number) => (Number.isFinite(n) ? String(n) : "0");

      if (isTransferMode && transferContext) {
        const base = transferContext.price;
        const recorded = isAgencyUser ? parsePriceOverrideInput(priceOverrideByKey["transfer"]) ?? base : base;
        createOrderFromPayment.mutate({
          checkoutRequestId: checkoutRequestIdParam,
          items: [
            {
              productId: transferContext.productId,
              primaryDomain: transferContext.domain,
              description: "transfer",
              productPlanId: null,
              itemPrice: str(recorded),
              itemSubtotal: str(recorded),
              metadata: {
                domainTransferRequestId: transferContext.domainTransferRequestId,
                transferAuthCode: transferContext.authCode,
                ...registrantOrderMetadata,
              },
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
        const rows = domains.map((d) => {
          const price = getDomainCartLineBasePrice(d);
          return { d, price };
        });
        const orderItems = rows.map((r) => {
          const key = `cart-domain:${r.d.id}`;
          const line = isAgencyUser ? parsePriceOverrideInput(priceOverrideByKey[key]) ?? r.price : r.price;
          return {
            productId: domainsProductId,
            primaryDomain: r.d.domain,
            description: "registration",
            productPlanId: null,
            itemPrice: str(line),
            itemSubtotal: str(line),
            metadata: registrantOrderMetadata,
          };
        });
        createOrderFromPayment.mutate({
          checkoutRequestId: checkoutRequestIdParam,
          items: orderItems,
          currency: primaryCurrency,
        });
        return;
      }
      if (!ctx?.productId || !ctx?.domain?.domain) return;
      const baseLine = domainTotal;
      const recorded = isAgencyUser ? parsePriceOverrideInput(priceOverrideByKey["product-domain"]) ?? baseLine : baseLine;
      createOrderFromPayment.mutate({
        checkoutRequestId: checkoutRequestIdParam,
        items: [
          {
            productId: ctx.productId,
            primaryDomain: ctx.domain.domain,
            description: "registration",
            productPlanId: null,
            itemPrice: str(recorded),
            itemSubtotal: str(recorded),
            metadata: registrantOrderMetadata,
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
      isAgencyUser,
      priceOverrideByKey,
      registrantOrderMetadata,
      domainTotal,
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
        // Already resolved in a previous tick ? stop without another request
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

          // Terminal: success or failure ? clear interval immediately so no further polls run
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
  const resolvedPaymentTeamId = isTransferMode ? transferContext?.teamId : undefined;

  const handleManualTransactionReferenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setManualTransactionReference(value);
    if (!value.trim()) {
      setManualTransactionRefError("Transaction reference is required");
    } else if (value.trim().length < 3) {
      setManualTransactionRefError("Reference must be at least 3 characters");
    } else {
      setManualTransactionRefError("");
    }
  };

  const handleRecordManualPayment = async () => {
    const ref = manualTransactionReference.trim();
    if (!ref) {
      setManualTransactionRefError("Transaction reference is required");
      return;
    }
    if (ref.length < 3) {
      setManualTransactionRefError("Reference must be at least 3 characters");
      return;
    }
    const amount = parseFloat(paymentAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter a valid payment amount.");
      return;
    }

    try {
      const result = await recordManualPayment.mutateAsync({
        transactionReference: ref,
        amount,
        currency: isCartMode ? primaryCurrency : displayCurrency,
        accountReference: accountReference.trim() || undefined,
        transactionDesc: isTransferMode && transferContext
          ? `Transfer ${transferContext.domain}`
          : isCartMode
            ? "Cart checkout"
            : ctx?.domain?.domain
              ? `Domain ${ctx.domain.domain}`
              : ctx?.productName ?? "Nisc order",
        teamId: resolvedPaymentTeamId,
      });
      terminalStateDetectedRef.current = true;
      setShouldStopPolling(true);
      setPaymentError(null);
      immediateStepRef.current = "success";
      setCurrentStep("success");
      triggerOrderFromPayment(result.checkoutRequestId);
      toast.success("Payment recorded and order submitted.");
    } catch {
      // onError toast
    }
  };

  const openForPayment = () => {
    setCurrentStep("payment");
    setPaymentAmount(effectiveTotal.toString());
    const ts = Date.now().toString().slice(-9);
    setAccountReference(isCartMode ? `CART${ts}`.slice(0, 12) : isTransferMode && transferContext
      ? (transferContext.domain.replace(/\./g, "").slice(0, 3).toUpperCase() || "TRF") + ts
      : (ctx?.domain?.domain?.replace(/\./g, "").slice(0, 3).toUpperCase() || "ORD") + ts);
    setAccountRefError("");
    setPhoneError("");
    setAmountError("");
  };

  const goToDomainCheckoutStep = () => {
    if (isDomainProduct) {
      setCurrentStep("registrant_info");
      return;
    }
    openForPayment();
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
      } else if (selectedUpsellPlans.length > 0) {
        setCurrentStep("hosting-upsell");
      } else {
        setCurrentStep("product");
      }
    } else if (currentStep === "registrant_info") {
      setCurrentStep("review");
    } else if (currentStep === "payment") {
      if (isDomainProduct) {
        setCurrentStep("registrant_info");
      } else {
        setCurrentStep("review");
      }
    }
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

  const hasInitializedStepRef = React.useRef(false);
  React.useEffect(() => {
    if (!open) {
      hasInitializedStepRef.current = false;
      return;
    }
    if (hasInitializedStepRef.current) return;

    if (isTransferMode) {
      setCurrentStep("review");
    } else if (isCartMode) {
      setCurrentStep("review");
    } else {
      setCurrentStep("product");
    }
    hasInitializedStepRef.current = true;
  }, [open, isCartMode, isTransferMode]);

  React.useEffect(() => {
    if (!open) {
      setCouponCode("");
      setDuration(1);
      setSelectedAddOns([]);
      setSelectedUpsellPlans([]);
      setSelectedMainPlan(null);
      setPlanSelectionProductId(null);
      setIsSelectingMainProductPlan(false);
      setSelectedPlanId(null);
      setRegistrantType(isAgencySide ? "customer" : "myself");
      setSelectedExistingCustomerId("");
      setManualRegistrantDetails({
        firstName: "",
        lastName: "",
        email: "",
        address: "",
        city: "",
        country: "Kenya",
        postalCode: "",
        phone: "",
      });
      setSelectedPaymentMethod(null);
      setMpesaPhoneNumber("");
      setPaymentAmount("");
      setAccountReference("");
      setAccountRefError("");
      setPhoneError("");
      setAmountError("");
      setPriceOverrideByKey({});
      setCheckoutRequestId(null);
      setManualTransactionReference("");
      setManualTransactionRefError("");
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
        if (hasDomain && ctx.domain) {
          return (
            <BuyNowDomainProductStep
              productName={ctx.productName}
              domain={ctx.domain}
              duration={duration}
              onDurationChange={setDuration}
              domainDisplayPrice={domainDisplayPrice}
              domainTotal={domainTotal}
              displayCurrency={displayCurrency}
              addOnsData={addOnsData}
              selectedAddOns={selectedAddOns}
              onToggleAddOn={toggleAddOn}
            />
          );
        }
        return (
          <div className="space-y-4">
            <div className="text-center py-2">
              <h3 className="text-lg font-semibold text-foreground">Get the best of your {ctx.productName}</h3>
              <p className="text-sm text-muted-foreground">Complete your purchase and add optional services</p>
            </div>
            {!hasDomain && !isDomainProduct && (
              <div className="rounded-lg border bg-muted/50 p-4">
                <div className="font-medium text-foreground">{ctx.productName}</div>
              </div>
            )}
            {addOnsData.length > 0 && (
              <ScrollArea className="h-[280px] w-full">
                <div className="space-y-3 pr-4">
                  <h4 className="text-sm font-semibold text-foreground">Optional add-ons</h4>
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
                        className={`w-full text-left rounded-lg border p-3 transition-colors ${
                          isSelected ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <span className="font-medium text-foreground">{product.name}</span>
                          <div className="flex items-center gap-2">
                            <div className={`h-4 w-4 rounded-full border flex items-center justify-center ${isSelected ? "border-primary bg-primary" : "border-muted-foreground"}`}>
                              {isSelected && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                            </div>
                            <span className="text-sm font-medium">{price === 0 ? "Free" : formatPrice(price, currency)}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <ScrollBar orientation="vertical" />
              </ScrollArea>
            )}
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
                      <div className="font-medium">{p.productName} ? {p.planName}</div>
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
              <h3 className="text-lg font-semibold text-foreground">Select plan: {planSelectionProductName}</h3>
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
              <div className="bg-muted/50 rounded-lg p-4 flex flex-col gap-1">
                <div className="flex justify-between items-center gap-4">
                  <div>
                    <div className="font-medium">Domain transfer ? {transferContext.domain}</div>
                    <div className="text-sm text-muted-foreground">Includes 1 year renewal</div>
                  </div>
                  <div className="font-semibold shrink-0">
                    {formatPrice(transferContext.price, transferContext.currency)}
                  </div>
                </div>
                {priceOverrideField("transfer", transferContext.currency, transferContext.price)}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Sub total (ex VAT)</span>
                <span>{formatPrice(effectiveSubtotal, primaryCurr)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground inline-flex items-center gap-1">
                  Taxes & fees
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>16% VAT (Kenya)</TooltipContent>
                  </Tooltip>
                </span>
                <span>{formatPrice(effectiveTaxes, primaryCurr)}</span>
              </div>
              <div className="border-t pt-4 flex items-center justify-between font-bold text-lg">
                <span>Total</span>
                <span>{formatPrice(effectiveTotal, primaryCurr)}</span>
              </div>
              <p className="text-xs text-muted-foreground">By paying you agree to our Terms of Service. The transfer will be processed after payment.</p>
              {isCustomerDomainCheckout && !userInfoQuery.isLoading && !isProfileComplete ? (
                <div className="flex items-start gap-2 rounded-md border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-900/10 p-3 text-xs text-amber-900 dark:text-amber-200">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>
                    Complete your profile on the next step before payment. Domain orders require address, phone, and related details.
                  </span>
                </div>
              ) : null}
            </div>
          );
        }
        if (isCartMode) {
          return (
            <div className="space-y-4">
              <ScrollArea className="h-[200px] w-full">
                <div className="space-y-3 pr-4">
                  {items.map((item) => {
                    let overrideKey: string | null = null;
                    let overrideCurrency = primaryCurrency;
                    let catalogExVat = 0;
                    if (item.type === "domain" && item.price) {
                      overrideKey = `cart-domain:${item.id}`;
                      overrideCurrency = getDomainCartLineCurrency(item);
                      catalogExVat = getDomainCartLineBasePrice(item);
                    } else if (item.type === "hivelocity") {
                      const hv = item as HivelocityCartItem;
                      overrideKey = `cart-hivelocity:${item.id}`;
                      overrideCurrency = hv.currency || primaryCurrency;
                      catalogExVat = Number(hv.totalPrice ?? 0) || 0;
                    } else {
                      overrideKey = `cart:${item.type}:${item.id}`;
                      overrideCurrency = (item as { currency?: string }).currency ?? primaryCurrency;
                      catalogExVat = Number((item as { price?: number }).price ?? 0) || 0;
                    }
                    return (
                      <div key={item.id} className="rounded-lg border border-border bg-card/40 overflow-hidden">
                        <CartItemCard item={item} onRemove={() => {}} hideRemoveButton />
                        {overrideKey != null &&
                          priceOverrideField(overrideKey, overrideCurrency, catalogExVat)}
                      </div>
                    );
                  })}
                </div>
                <ScrollBar orientation="vertical" />
              </ScrollArea>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="enter you coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-1"
                />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground inline-flex items-center gap-1">
                  Taxes & fees
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>16% VAT (Kenya)</TooltipContent>
                  </Tooltip>
                </span>
                <span>{formatPrice(effectiveTaxes, primaryCurr)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Sub total</span>
                <span>{formatPrice(effectiveSubtotal, primaryCurr)}</span>
              </div>
              <div className="border-t pt-4 flex items-center justify-between font-bold text-lg">
                <span>Total</span>
                <span>{formatPrice(effectiveTotal, primaryCurr)}</span>
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
                  <div className="bg-muted/50 rounded-lg p-4 flex flex-col gap-1">
                    <div className="flex justify-between gap-4">
                      <div>
                        <div className="font-medium">{ctx.domain.domain}</div>
                        <div className="text-sm text-muted-foreground">
                          {duration} {duration === 1 ? "year" : "years"}
                        </div>
                      </div>
                      <div className="font-semibold shrink-0">{formatPrice(domainTotal, displayCurrency)}</div>
                    </div>
                    {priceOverrideField("product-domain", displayCurrency, domainTotal)}
                  </div>
                )}
                {selectedAddOns.length > 0 && selectedAddOns.map((a) => (
                  <div key={a.productId} className="bg-muted/50 rounded-lg p-4 flex flex-col gap-1">
                    <div className="flex justify-between gap-4">
                      <div>
                        <div className="font-medium">{a.productName}</div>
                        <div className="text-sm text-muted-foreground">{a.planName}</div>
                      </div>
                      <div className="font-semibold shrink-0">{formatPrice(a.price, a.currency)}</div>
                    </div>
                    {priceOverrideField(`addon:${a.productId}`, a.currency, a.price)}
                  </div>
                ))}
                {selectedMainPlan && (
                  <div className="bg-muted/50 rounded-lg p-4 flex flex-col gap-1">
                    <div className="flex justify-between gap-4">
                      <div>
                        <div className="font-medium">{selectedMainPlan.productName} ? {selectedMainPlan.planName}</div>
                        <div className="text-sm text-muted-foreground">{selectedMainPlan.billingCycle}</div>
                      </div>
                      <div className="font-semibold shrink-0">
                        {formatPrice(selectedMainPlan.price, selectedMainPlan.currency)}
                      </div>
                    </div>
                    {priceOverrideField(
                      `main-plan:${selectedMainPlan.planId}`,
                      selectedMainPlan.currency,
                      selectedMainPlan.price,
                    )}
                  </div>
                )}
                {selectedUpsellPlans.map((p) => (
                  <div key={p.planId} className="bg-muted/50 rounded-lg p-4 flex flex-col gap-1">
                    <div className="flex justify-between gap-4">
                      <div>
                        <div className="font-medium">{p.productName} ? {p.planName}</div>
                        <div className="text-sm text-muted-foreground">{p.billingCycle}</div>
                      </div>
                      <div className="font-semibold shrink-0">{formatPrice(p.price, p.currency)}</div>
                    </div>
                    {priceOverrideField(`upsell:${p.productId}:${p.planId}`, p.currency, p.price)}
                  </div>
                ))}
              </div>
              <ScrollBar orientation="vertical" />
            </ScrollArea>
            <div className="flex items-center gap-2">
              <Input
                placeholder="enter you coupon code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                className="flex-1"
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground inline-flex items-center gap-1">
                Taxes & fees
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>16% VAT (Kenya)</TooltipContent>
                </Tooltip>
              </span>
              <span>{formatPrice(effectiveTaxes, primaryCurr)}</span>
            </div>
            <div className="border-t pt-4 flex items-center justify-between font-bold text-lg">
              <span>Total</span>
              <span>{formatPrice(effectiveTotal, primaryCurr)}</span>
            </div>
            <p className="text-xs text-muted-foreground">By checking out you agree to our Terms of Service and Privacy Policy.</p>
          </div>
        );

      case "payment":
        return (
          <BuyNowStepScroll className="space-y-6">
            <div className="text-center py-2">
              <h3 className="text-lg font-semibold text-foreground">Choose payment method</h3>
              <p className="text-sm text-muted-foreground">Select your preferred method</p>
            </div>
            <div className="flex flex-col gap-4">
            <Accordion
              type="single"
              collapsible
              className="flex w-full flex-col gap-4 [&>[data-slot=accordion-item]]:border-b-0"
              value={selectedPaymentMethod ?? undefined}
            >
              <AccordionItem value="mpesa" className="rounded-lg border overflow-hidden shrink-0">
                <Card className="border-0 shadow-none">
                  <AccordionTrigger className="px-5 py-4 hover:no-underline" onClick={() => setSelectedPaymentMethod(selectedPaymentMethod === "mpesa" ? null : "mpesa")}>
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
                  <AccordionContent className="px-5 pb-4">
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
              {isAgencyUser ? (
                <AccordionItem value="manual" className="rounded-lg border overflow-hidden">
                  <Card className="border-0 shadow-none">
                    <AccordionTrigger
                      className="px-5 py-4 hover:no-underline"
                      onClick={() =>
                        setSelectedPaymentMethod(selectedPaymentMethod === "manual" ? null : "manual")
                      }
                    >
                      <div className="flex items-center gap-4 w-full">
                        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                          <Receipt className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-semibold text-foreground">Record payment reference</div>
                          <div className="text-sm text-muted-foreground">
                            M-Pesa receipt, bank transfer, or other external payment
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-5 pb-4">
                      <div className="space-y-4 pt-2">
                        <p className="text-xs text-muted-foreground">
                          Enter the transaction reference from the payment provider. This creates a successful
                          payment record and completes the order (same as a confirmed M-Pesa payment).
                        </p>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Transaction reference *</label>
                          <Input
                            placeholder="e.g. SH12345678 or bank transfer ref"
                            value={manualTransactionReference}
                            onChange={handleManualTransactionReferenceChange}
                            className={manualTransactionRefError ? "border-destructive" : ""}
                            maxLength={64}
                          />
                          {manualTransactionRefError ? (
                            <p className="text-xs text-destructive">{manualTransactionRefError}</p>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              Must be unique. Used as the payment checkout ID for this order.
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Amount ({primaryCurr}) *</label>
                          <Input
                            type="number"
                            value={paymentAmount}
                            onChange={handleAmountChange}
                            className={amountError ? "border-destructive" : ""}
                            min={1}
                          />
                          {amountError && <p className="text-xs text-destructive">{amountError}</p>}
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Account reference</label>
                          <Input
                            placeholder="Optional internal reference"
                            value={accountReference}
                            onChange={handleAccountReferenceChange}
                            className={accountRefError ? "border-destructive" : ""}
                            maxLength={12}
                          />
                          {accountRefError && <p className="text-xs text-destructive">{accountRefError}</p>}
                        </div>
                        <Button
                          onClick={() => void handleRecordManualPayment()}
                          disabled={
                            recordManualPayment.isPending ||
                            createOrderFromPayment.isPending ||
                            !manualTransactionReference.trim() ||
                            !!manualTransactionRefError ||
                            !paymentAmount ||
                            !!amountError
                          }
                          className="w-full"
                        >
                          {recordManualPayment.isPending || createOrderFromPayment.isPending
                            ? "Processing…"
                            : "Record payment & complete order"}
                        </Button>
                      </div>
                    </AccordionContent>
                  </Card>
                </AccordionItem>
              ) : null}
            </Accordion>
            </div>
            <div className="border-t pt-4 mt-8 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span>{formatPrice(effectiveSubtotal, primaryCurr)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Taxes</span><span>{formatPrice(effectiveTaxes, primaryCurr)}</span></div>
              <div className="flex justify-between font-bold text-lg border-t pt-2"><span>Total</span><span>{formatPrice(effectiveTotal, primaryCurr)}</span></div>
            </div>
          </BuyNowStepScroll>
        );

      case "registrant_info":
        if (isCustomerDomainCheckout) {
          return (
            <BuyNowStepScroll className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-foreground">Complete your profile</h3>
                <p className="text-sm text-muted-foreground">
                  Domain orders use your account profile for registration and transfer. Payment cannot continue until required fields are filled in.
                </p>
              </div>

              {userInfoQuery.isLoading ? (
                <div className="flex justify-center py-8">
                  <Spinner size={28} />
                </div>
              ) : isProfileComplete ? (
                <div className="rounded-lg border border-green-200 dark:border-green-900/40 bg-green-50 dark:bg-green-900/10 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-400 text-sm font-semibold">
                    <Check className="h-4 w-4 shrink-0" />
                    Profile complete
                  </div>
                  {userProfile ? (
                    <div className="text-xs text-muted-foreground grid grid-cols-2 gap-x-4 gap-y-1">
                      <div>
                        Name: {userProfile.firstName} {userProfile.lastName}
                      </div>
                      <div>Phone: {userProfile.phone}</div>
                      <div className="col-span-2">
                        Address: {userProfile.address}, {userProfile.city}, {userProfile.country}{" "}
                        {userProfile.postalCode}
                      </div>
                    </div>
                  ) : null}
                  <p className="text-xs text-muted-foreground">
                    You can continue to payment. These details will be used for your domain order.
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-900/10 p-4 space-y-4">
                  <div className="flex items-start gap-2 text-amber-800 dark:text-amber-300">
                    <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                    <div className="space-y-2">
                      <p className="text-sm font-semibold">Profile incomplete</p>
                      <p className="text-xs text-amber-800/90 dark:text-amber-300/90">
                        Add the missing information in My Profile before paying. The order will be rejected without it.
                      </p>
                      {missingProfileFields.length > 0 ? (
                        <ul className="text-xs list-disc pl-4 space-y-0.5 text-amber-900/80 dark:text-amber-200/80">
                          {missingProfileFields.map((label) => (
                            <li key={label}>{label}</li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" asChild>
                      <Link to={customerProfileHref} onClick={() => close()}>
                        Complete profile
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={userInfoQuery.isFetching}
                      onClick={() => void userInfoQuery.refetch()}
                    >
                      {userInfoQuery.isFetching ? "Checking…" : "I've updated my profile"}
                    </Button>
                  </div>
                </div>
              )}
            </BuyNowStepScroll>
          );
        }

        return (
          <BuyNowStepScroll className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-foreground">Registrant Information</h3>
              <p className="text-sm text-muted-foreground">Select whose details to use for this domain registration.</p>
            </div>

            <div className="grid gap-4">
              <div
                className={cn(
                  "relative flex cursor-pointer rounded-lg border bg-card px-5 py-4 shadow-sm focus:outline-none transition-all hover:border-primary/50",
                  registrantType === "customer" ? "border-primary ring-1 ring-primary" : "border-border"
                )}
                onClick={() => {
                  setRegistrantType("customer");
                  setSelectedExistingCustomerId("");
                }}
              >
                <div className="flex w-full items-start gap-5">
                  <div className={cn(
                    "mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                    registrantType === "customer" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  )}>
                    <Users className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-foreground">Enter Customer Details</p>
                      {registrantType === "customer" && <div className="h-2 w-2 rounded-full bg-primary" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Manually enter the details for this registration.
                    </p>

                    <Accordion type="single" collapsible value={registrantType === "customer" ? "manual-form" : ""} className="mt-5 border-none">
                      <AccordionItem value="manual-form" className="border-none">
                        <AccordionContent className="pt-0 border-none">
                          <div className="grid grid-cols-2 gap-x-4 gap-y-5 pt-3" onClick={(e) => e.stopPropagation()}>
                            <div className="space-y-2">
                              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">First Name</p>
                              <Input
                                value={manualRegistrantDetails.firstName}
                                onChange={(e) => setManualRegistrantDetails({ ...manualRegistrantDetails, firstName: e.target.value })}
                                placeholder="First Name"
                                className="h-9 text-xs"
                              />
                            </div>
                            <div className="space-y-2">
                              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Last Name</p>
                              <Input
                                value={manualRegistrantDetails.lastName}
                                onChange={(e) => setManualRegistrantDetails({ ...manualRegistrantDetails, lastName: e.target.value })}
                                placeholder="Last Name"
                                className="h-9 text-xs"
                              />
                            </div>
                            <div className="space-y-2 col-span-2">
                              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Email Address</p>
                              <Input
                                value={manualRegistrantDetails.email}
                                onChange={(e) => setManualRegistrantDetails({ ...manualRegistrantDetails, email: e.target.value })}
                                placeholder="customer@example.com"
                                className="h-9 text-xs"
                                type="email"
                              />
                            </div>
                            <div className="space-y-2 col-span-2">
                              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Physical Address</p>
                              <Input
                                value={manualRegistrantDetails.address}
                                onChange={(e) => setManualRegistrantDetails({ ...manualRegistrantDetails, address: e.target.value })}
                                placeholder="Street, Building, etc."
                                className="h-9 text-xs"
                              />
                            </div>
                            <div className="space-y-2">
                              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">City</p>
                              <Input
                                value={manualRegistrantDetails.city}
                                onChange={(e) => setManualRegistrantDetails({ ...manualRegistrantDetails, city: e.target.value })}
                                placeholder="City"
                                className="h-9 text-xs"
                              />
                            </div>
                            <div className="space-y-2">
                              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Country</p>
                              <Input
                                value={manualRegistrantDetails.country}
                                onChange={(e) => setManualRegistrantDetails({ ...manualRegistrantDetails, country: e.target.value })}
                                placeholder="Kenya"
                                className="h-9 text-xs"
                              />
                            </div>
                            <div className="space-y-2">
                              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Postal Code</p>
                              <Input
                                value={manualRegistrantDetails.postalCode}
                                onChange={(e) => setManualRegistrantDetails({ ...manualRegistrantDetails, postalCode: e.target.value })}
                                placeholder="e.g. 00100"
                                className="h-9 text-xs"
                              />
                            </div>
                            <div className="space-y-2">
                              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Phone Number</p>
                              <Input
                                value={manualRegistrantDetails.phone}
                                onChange={(e) => setManualRegistrantDetails({ ...manualRegistrantDetails, phone: e.target.value })}
                                placeholder="0712345678"
                                className="h-9 text-xs"
                              />
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                </div>
              </div>

              <div
                className={cn(
                  "relative flex cursor-pointer rounded-lg border bg-card px-5 py-4 shadow-sm focus:outline-none transition-all hover:border-primary/50",
                  registrantType === "existing_customer"
                    ? "border-primary ring-1 ring-primary"
                    : "border-border"
                )}
                onClick={() => setRegistrantType("existing_customer")}
              >
                <div className="flex w-full items-start gap-5">
                  <div
                    className={cn(
                      "mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                      registrantType === "existing_customer"
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    <UserSearch className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-foreground">Select existing customer</p>
                      {registrantType === "existing_customer" ? (
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      ) : null}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Choose a customer account with a complete profile for this registration.
                    </p>
                    <div className="mt-4" onClick={() => setRegistrantType("existing_customer")}>
                      {customersForRegistrantQuery.isLoading ? (
                        <div className="flex justify-center py-3">
                          <Spinner size={20} />
                        </div>
                      ) : customersForRegistrantQuery.error ? (
                        <p className="text-xs text-destructive">
                          {customersForRegistrantQuery.error.message ?? "Failed to load customers."}
                        </p>
                      ) : (
                        <ComboboxDropdown
                          placeholder="Search customers…"
                          searchPlaceholder="Search by name or email"
                          items={customerComboboxItems}
                          selectedItem={selectedCustomerComboboxItem}
                          disabled={registrantType !== "existing_customer"}
                          onSelect={(item) => {
                            if (item.disabled) return;
                            setSelectedExistingCustomerId(item.id);
                            setRegistrantType("existing_customer");
                          }}
                          renderListItem={({ isChecked, item }) => {
                            const customer = customersForRegistrant.find((c) => c.id === item.id);
                            const row = (
                              <span className="flex items-center gap-2 w-full min-w-0">
                                <Check
                                  className={cn(
                                    "h-4 w-4 shrink-0",
                                    isChecked ? "opacity-100" : "opacity-0",
                                  )}
                                />
                                <span
                                  className={cn(
                                    "truncate",
                                    item.disabled && "text-muted-foreground",
                                  )}
                                >
                                  {item.label}
                                </span>
                              </span>
                            );
                            if (!item.disabled) return row;
                            return (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="flex w-full cursor-not-allowed">{row}</span>
                                </TooltipTrigger>
                                <TooltipContent side="left" className="max-w-xs text-xs">
                                  Profile incomplete. Complete the customer&apos;s profile before
                                  selecting them.
                                  {customer && customer.missingFields.length > 0 ? (
                                    <span className="block mt-1 text-muted-foreground">
                                      Missing: {customer.missingFields.join(", ")}
                                    </span>
                                  ) : null}
                                </TooltipContent>
                              </Tooltip>
                            );
                          }}
                          emptyResults="No customers found"
                        />
                      )}
                    </div>
                    {registrantType === "existing_customer" && selectedExistingCustomer?.profileComplete ? (
                      <div className="mt-3 text-[11px] grid grid-cols-2 gap-x-4 gap-y-1 text-muted-foreground bg-muted/30 p-2 rounded">
                        <div>
                          Name: {selectedExistingCustomer.profile?.firstName}{" "}
                          {selectedExistingCustomer.profile?.lastName}
                        </div>
                        <div>Phone: {selectedExistingCustomer.profile?.phone}</div>
                        <div className="col-span-2">
                          Address: {selectedExistingCustomer.profile?.address},{" "}
                          {selectedExistingCustomer.profile?.city}
                        </div>
                      </div>
                    ) : null}
                    {registrantType === "existing_customer" &&
                    selectedExistingCustomer &&
                    !selectedExistingCustomer.profileComplete ? (
                      <p className="mt-2 text-xs text-destructive">
                        This customer&apos;s profile is incomplete. Choose another customer or complete
                        their profile first.
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>

              <div
                className={cn(
                  "relative flex cursor-pointer rounded-lg border bg-card px-5 py-4 shadow-sm focus:outline-none transition-all hover:border-primary/50",
                  registrantType === "myself" ? "border-primary ring-1 ring-primary" : "border-border"
                )}
                onClick={() => {
                  setRegistrantType("myself");
                  setSelectedExistingCustomerId("");
                }}
              >
                <div className="flex w-full items-start gap-5">
                  <div className={cn(
                    "mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                    registrantType === "myself" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  )}>
                    <User className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-foreground">Use My Details</p>
                      {registrantType === "myself" && <div className="h-2 w-2 rounded-full bg-primary" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Use your own profile details as the domain registrant.
                    </p>
                    {userInfoQuery.isLoading && registrantType === "myself" ? (
                      <div className="mt-3 flex justify-center py-4">
                        <Spinner size={20} />
                      </div>
                    ) : null}
                    {userProfile && registrantType === "myself" ? (
                      <div className="mt-3 text-[11px] grid grid-cols-2 gap-x-4 gap-y-1 text-muted-foreground bg-muted/30 p-2 rounded">
                        <div>Name: {userProfile.firstName} {userProfile.lastName}</div>
                        <div>Phone: {userProfile.phone}</div>
                        <div className="col-span-2">Address: {userProfile.address}, {userProfile.city}</div>
                      </div>
                    ) : null}
                    {registrantType === "myself" && !userInfoQuery.isLoading && !isProfileComplete ? (
                      <div
                        className="mt-3 p-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-md"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-xs font-semibold mb-1">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Profile Incomplete
                        </div>
                        <p className="text-[11px] text-red-600/80 dark:text-red-400/80 mb-2">
                          Your profile is missing required information (address, phone, etc.) needed for domain registration.
                        </p>
                        {missingProfileFields.length > 0 ? (
                          <ul className="text-[11px] list-disc pl-4 mb-2 text-red-600/80 dark:text-red-400/80">
                            {missingProfileFields.map((label) => (
                              <li key={label}>{label}</li>
                            ))}
                          </ul>
                        ) : null}
                        <Button size="sm" variant="outline" className="h-7 text-[10px]" asChild>
                          <Link to="/agency/my-account" onClick={() => close()}>
                            Complete profile
                          </Link>
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </BuyNowStepScroll>
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
              <span className="font-semibold">{formatPrice(effectiveTotal, primaryCurr)}</span>
            </div>
          </div>
        );

      case "error":
        const errMsg = immediatePaymentErrorRef.current ?? paymentError ?? "Payment failed.";
        return (
          <div className="space-y-4 text-center py-4">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl text-red-600 dark:text-red-400">âœ?</span>
            </div>
            <h3 className="text-lg font-semibold text-foreground">Payment failed</h3>
            <p className="text-sm text-muted-foreground">{errMsg}</p>
            <div className="border-t pt-4 text-sm">
              <span className="text-muted-foreground">Order total </span>
              <span className="font-semibold">{formatPrice(effectiveTotal, primaryCurr)}</span>
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
    if (effectiveStep === "plan-selection") return `Select plan: ${planSelectionProductName}`;
    if (effectiveStep === "review") return "Complete and review";
    if (effectiveStep === "registrant_info") {
      return isCustomerDomainCheckout ? "Profile required" : "Registrant details";
    }
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
            {effectiveStep === "registrant_info" &&
              (isCustomerDomainCheckout
                ? "Complete your profile before paying for a domain."
                : "Choose whose details to use for registration.")}
            {effectiveStep === "payment" && "Complete your payment."}
            {effectiveStep === "success" && "Order confirmed."}
            {effectiveStep === "error" && "Payment could not be completed."}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0 px-6 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="py-4">{renderStep()}</div>
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
                  } else if (isDomainProduct) {
                    goToDomainCheckoutStep();
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
              <Button
                onClick={() => {
                  if (isDomainProduct) goToDomainCheckoutStep();
                  else setCurrentStep("review");
                }}
              >
                Proceed to checkout
              </Button>
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
              <Button
                disabled={!selectedPlanId}
                onClick={() => {
                  if (isDomainProduct) goToDomainCheckoutStep();
                  else setCurrentStep("review");
                }}
              >
                Next
              </Button>
            </>
          )}
          {effectiveStep === "registrant_info" && (
            <>
              <Button variant="ghost" onClick={handleBack}>Back</Button>
              <Button
                disabled={
                  isCustomerDomainCheckout
                    ? !isProfileComplete || userInfoQuery.isLoading
                    : (registrantType === "myself" && !isProfileComplete) ||
                      (registrantType === "customer" && !isManualDetailsComplete) ||
                      (registrantType === "existing_customer" && !isExistingCustomerReady)
                }
                onClick={() => openForPayment()}
              >
                {isCustomerDomainCheckout && !isProfileComplete
                  ? "Complete profile to continue"
                  : "Continue to payment"}
              </Button>
            </>
          )}
          {effectiveStep === "review" && (
            <>
              <Button variant="ghost" onClick={isCartMode ? () => close() : isTransferMode ? () => close() : handleBack}>
                {isCartMode ? "Cancel" : isTransferMode ? "Cancel" : "Back"}
              </Button>
              <Button onClick={goToDomainCheckoutStep}>
                {isTransferMode ? "Proceed to payment" : "Choose payment method"}
              </Button>
            </>
          )}
          {effectiveStep === "payment" && (
            <Button
              variant="outline"
              onClick={() =>
                setCurrentStep(isDomainProduct ? "registrant_info" : "review")
              }
            >
              Back
            </Button>
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
