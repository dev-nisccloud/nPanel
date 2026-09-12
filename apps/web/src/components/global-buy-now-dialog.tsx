"use client";

import * as React from "react";
import { HelpCircle, Check, Receipt, CreditCard } from "lucide-react";
import {
  PlanOptionWithFeatures,
  resolvePlanFeatureDisplay,
} from "@/components/plan-option-with-features";
import { cn } from "@/lib/utils";
import { computeCeilVatTotals, paymentTotalString } from "@npanel/api/lib/convert-price";
import { domainBillingCycleFromYears } from "@npanel/api/lib/nisc-domain-billing-cycle";
import {
  canonicalMpesaPaymentAmount,
  resolveMpesaCheckoutPayment,
} from "@/lib/mpesa-checkout-payment";
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
import { User, UserPlus, UserSearch, AlertTriangle } from "lucide-react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { BuyNowDialogBodyScroll, BuyNowStepBody } from "@/components/buy-now-dialog-scroll";
import {
  MpesaPayButton,
  PaymentMethodAccordion,
  PaymentMethodContent,
  PaymentMethodOption,
  PaymentMethodTrigger,
} from "@/components/payment-method-accordion";
import { MpesaPaymentFields } from "@/components/mpesa-payment-fields";
import { JengaCardPaymentFields } from "@/components/jenga-card-payment-fields";
import {
  submitJengaPaymentForm,
  validateJengaCustomerForm,
  type JengaCustomerFormState,
} from "@/lib/jenga-checkout";
import { trpc } from "@/utils/trpc";
import { toast } from "@/components/ui/sonner";
import { useGlobalBuyNowStore } from "@/stores/global-buy-now-store";
import { useCartStore } from "@/stores/cart-store";
import type { CartItem, DomainCartItem, DomainBundleCartItem, HivelocityCartItem } from "@/stores/cart-store";
import { getDomainBundleCartLineCurrency, getDomainBundleCartLinePrice } from "@/stores/cart-store";
import { CartItemCard } from "@/routes/agency/_components/sidebar/cart-item-card";
import { authClient } from "@/lib/auth-client";
import { BuyNowDomainProductStep } from "@/components/buy-now-domain-product-step";
import { BuyNowDomainBundleProductStep } from "@/components/buy-now-domain-bundle-product-step";
import { DOMAIN_BUNDLE_METADATA_KEY } from "@npanel/api/lib/domain-bundle-order";
import {
  HostingUpsellStep,
  HostingPlanSelectionStep,
  planSelectionToUpsell,
  getMinYearlyFromPlans,
  DEFAULT_HOSTING_BILLING_CYCLE,
  hostingBillingCycleLabel,
  type HostingBillingCycle,
  type HostingPlanType,
  type UpsellBrowseTarget,
  type SelectedServiceUpsell,
} from "@/components/global-buy-now/hosting-steps";
import { PurchaseAsBusinessOption } from "@/components/checkout/purchase-as-business-option";
import {
  CheckoutTeamBillingForm,
  type CheckoutTeamBillingInitialData,
} from "@/components/checkout/checkout-team-billing-form";
import {
  isTeamBillingComplete,
  needsCheckoutTeamBillingStep,
} from "@/lib/team-billing-completion";
import { getCustomerTeamSlugFromPathname } from "@/lib/customer-team-slug";
import { captureEvent } from "@/lib/posthog";

const CHECKOUT_TEAM_BILLING_FORM_ID = "checkout-team-billing-form";

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

type RegistrantType = "myself" | "existing_customer";

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
  return { useRegistrantInfo: "myself" };
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
  | "team_billing"
  | "payment"
  | "success"
  | "error";

interface SelectedUpsellPlan {
  productId: string;
  productName: string;
  planId: string;
  planName: string;
  billingCycle: HostingBillingCycle;
  price: number;
  currency: string;
  hostingType: HostingPlanType;
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
  const { items, getTotalsByCurrency, getCurrenciesInCart, getItemCount, clearCart } = useCartStore();

  const [currentStep, setCurrentStep] = React.useState<Step>("review");
  const [couponCode, setCouponCode] = React.useState("");

  const [duration, setDuration] = React.useState(1);
  const [selectedAddOns, setSelectedAddOns] = React.useState<SelectedAddOn[]>([]);
  const [selectedUpsellPlans, setSelectedUpsellPlans] = React.useState<SelectedUpsellPlan[]>([]);
  const [selectedMainPlan, setSelectedMainPlan] = React.useState<SelectedUpsellPlan | null>(null);
  const [planSelectionProductId, setPlanSelectionProductId] = React.useState<string | null>(null);
  const [planSelectionProductName, setPlanSelectionProductName] = React.useState<string>("");
  const [selectedPlanId, setSelectedPlanId] = React.useState<string | null>(null);
  const [selectedBillingCycle, setSelectedBillingCycle] = React.useState<HostingBillingCycle>(
    DEFAULT_HOSTING_BILLING_CYCLE,
  );
  const [isSelectingMainProductPlan, setIsSelectingMainProductPlan] = React.useState(false);
  const [upsellBrowseTarget, setUpsellBrowseTarget] = React.useState<UpsellBrowseTarget | null>(null);
  /** Domain checkout: registrant step finished; review before payment is allowed */
  const [registrantStepCompleted, setRegistrantStepCompleted] = React.useState(false);
  const [purchaseAsBusiness, setPurchaseAsBusiness] = React.useState(false);

  const [selectedPaymentMethod, setSelectedPaymentMethod] = React.useState<string | null>(null);
  const [mpesaPhoneNumber, setMpesaPhoneNumber] = React.useState("");
  const [paymentAmount, setPaymentAmount] = React.useState("");
  const [accountReference, setAccountReference] = React.useState("");
  /** Canonical checkout values - STK push for customers always uses these, not form state. */
  const intendedPaymentAmountRef = React.useRef("");
  const intendedAccountReferenceRef = React.useRef("");
  const [accountRefError, setAccountRefError] = React.useState("");
  const [phoneError, setPhoneError] = React.useState("");
  const [amountError, setAmountError] = React.useState("");
  /** Per-line ex VAT amounts keyed for DB / checkout (agency users only). */
  const [priceOverrideByKey, setPriceOverrideByKey] = React.useState<Record<string, string>>({});
  const [checkoutRequestId, setCheckoutRequestId] = React.useState<string | null>(null);
  const [manualTransactionReference, setManualTransactionReference] = React.useState("");
  const [manualTransactionRefError, setManualTransactionRefError] = React.useState("");
  const [jengaCustomer, setJengaCustomer] = React.useState<JengaCustomerFormState>({
    customerFirstName: "",
    customerLastName: "",
    customerEmail: "",
    customerPhone: "",
    customerAddress: "",
    customerPostalCodeZip: "",
    countryCode: "KE",
  });
  const [jengaCustomerErrors, setJengaCustomerErrors] = React.useState<
    Partial<Record<keyof JengaCustomerFormState, string>>
  >({});
  const [jengaRedirecting, setJengaRedirecting] = React.useState(false);
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
    isAgencySide ? "existing_customer" : "myself",
  );
  const [selectedExistingCustomerId, setSelectedExistingCustomerId] = React.useState("");

  const isCartMode = mode === "cart";
  const isTransferMode = mode === "transfer";
  const ctx = productContext;
  const isUpgradeMode = Boolean(ctx?.upgrade?.subscriptionId);
  const isDomainBundle = Boolean(ctx?.domainBundle?.domains?.length);
  const bundleCtx = ctx?.domainBundle ?? null;
  const hasDomain = !!ctx?.domain?.domain;
  const { data: domainsProductId } = trpc.clientSubscriptions.getDomainsProductId.useQuery(undefined, {
    enabled: open && (isCartMode || !!ctx?.productId),
  });

  const isDomainProduct = React.useMemo(() => {
    if (isTransferMode) return true;
    if (isCartMode) {
      return items.some(
        (i) =>
          i.type === "domain" ||
          i.type === "domain_bundle" ||
          i.productId === domainsProductId ||
          !!i.description?.toLowerCase().includes("domain") ||
          !!i.productName?.toLowerCase().includes("domain"),
      );
    }
    const isDomain = hasDomain || isDomainBundle || !!ctx?.productName?.toLowerCase().includes("domain");
    return !!isDomain;
  }, [isTransferMode, isCartMode, items, domainsProductId, hasDomain, isDomainBundle, ctx?.productName]);

  const { data: addOnsData = [] } = trpc.products.getAddOnsForProduct.useQuery(
    { baseProductId: ctx?.productId ?? "" },
    { enabled: open && !!ctx?.productId && !isCartMode && !isDomainBundle }
  );
  const { data: webHostingPricing, isLoading: isLoadingWebHostingPricing } =
    trpc.products.getHostingPlansForPricing.useQuery(undefined, {
      enabled: open && !isCartMode && isDomainProduct,
    });
  const { data: emailHostingPricing, isLoading: isLoadingEmailHostingPricing } =
    trpc.products.getEmailHostingPlansForPricing.useQuery(undefined, {
      enabled: open && !isCartMode && isDomainProduct,
    });
  const webFromPrice = getMinYearlyFromPlans(webHostingPricing?.plans ?? []);
  const emailFromPrice = getMinYearlyFromPlans(emailHostingPricing?.plans ?? []);

  const isCustomerDomainCheckout = isDomainProduct && !isAgencySide;
  const needsRegistrantStep = !isUpgradeMode && (isAgencySide || isCustomerDomainCheckout);

  const userInfoQuery = trpc.userProfile.getUserInfo.useQuery(undefined, {
    enabled: open && (needsRegistrantStep || currentStep === "payment"),
  });

  const customerProfileHref = React.useMemo(() => {
    const slug = location.pathname.split("/").filter(Boolean)[0];
    return slug ? `/${slug}/my-profile` : "/dashboard/my-profile";
  }, [location.pathname]);

  const customersForRegistrantQuery = trpc.userProfile.listCustomersForRegistrant.useQuery(undefined, {
    enabled: open && isAgencySide,
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
    () => buildRegistrantOrderMetadata(registrantType, selectedExistingCustomer),
    [registrantType, selectedExistingCustomer],
  );
  const customerTeamSlug = React.useMemo(
    () => (isAgencySide ? undefined : getCustomerTeamSlugFromPathname(location.pathname)),
    [location.pathname, isAgencySide],
  );
  const { data: checkoutTeamBySlug } = trpc.teams.getTeamIdBySlug.useQuery(
    { slug: customerTeamSlug ?? "" },
    { enabled: open && !!customerTeamSlug && !isAgencySide },
  );
  const teamId = isTransferMode ? transferContext?.teamId : ctx?.teamId;
  const checkoutTeamId = teamId ?? checkoutTeamBySlug?.id ?? undefined;
  const showPurchaseAsBusinessOption = !isAgencySide && !!checkoutTeamId;
  const teamBillingQuery = trpc.teamBilling.getByTeam.useQuery(
    { teamId: checkoutTeamId ?? "" },
    {
      enabled:
        open &&
        !!checkoutTeamId &&
        !isAgencySide &&
        (purchaseAsBusiness || currentStep === "team_billing"),
    },
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
  const teamBillingInitialData = React.useMemo((): CheckoutTeamBillingInitialData | null => {
    if (!teamBilling) return null;
    return {
      legalName: teamBilling.legalName,
      billingEmail: teamBilling.billingEmail,
      billingPhone: teamBilling.billingPhone ?? null,
      addressLine1: teamBilling.addressLine1,
      addressLine2: teamBilling.addressLine2 ?? null,
      city: teamBilling.city,
      state: teamBilling.state ?? null,
      country: teamBilling.country,
      postalCode: teamBilling.postalCode ?? null,
      taxId: teamBilling.taxId ?? null,
      additionalNotes: teamBilling.additionalNotes ?? null,
    };
  }, [teamBilling]);
  const catalogProductId =
    planSelectionProductId ?? (isUpgradeMode && open ? ctx?.productId ?? null : null);
  const {
    data: planSelectionProduct,
    isPending: isPlanCatalogPending,
    isFetching: isPlanCatalogFetching,
    isError: isPlanCatalogError,
  } = trpc.products.getById.useQuery(
    { id: catalogProductId ?? "", includePlans: true },
    {
      enabled: !!catalogProductId,
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  );
  const isPlanCatalogLoading =
    !!catalogProductId &&
    (isPlanCatalogPending || (isPlanCatalogFetching && !planSelectionProduct));
  const productFeatureCatalog =
    (planSelectionProduct as { features?: Array<{ key: string; label: string; description?: string }> } | undefined)
      ?.features ?? [];
  const allCatalogPlans = (planSelectionProduct as {
    plans?: Array<{
      id: string;
      name: string;
      description?: string | null;
      price: string | null;
      currency: string;
      billingCycle: string | null;
      sortOrder?: number;
      planFeatures?: Array<{ key: string; available: boolean; valueOverride?: string }>;
    }>;
  })?.plans ?? [];
  const plans = isUpgradeMode
    ? allCatalogPlans.filter((plan) => {
        if (ctx?.upgrade?.currentPlanId && plan.id === ctx.upgrade.currentPlanId) return false;
        return (plan.sortOrder ?? 0) > (ctx?.upgrade?.minSortOrder ?? -1);
      })
    : allCatalogPlans;

  const displayCurrency = isTransferMode && transferContext
    ? transferContext.currency
    : isDomainBundle && bundleCtx
      ? bundleCtx.bundleCurrency
      : ctx?.domain?.price?.calculated
      ? (ctx.domain.price.calculated as { displayCurrency?: string })?.displayCurrency ?? (ctx.domain.price.calculated as { currency?: string })?.currency ?? "KES"
      : ctx?.domain?.price?.reseller?.currency ?? "KES";
  const domainDisplayPrice = (() => {
    if (!ctx?.domain) return 0;
    const calc = ctx.domain.price?.calculated as { convertedPrice?: number; finalPrice?: number } | undefined;
    const v = calc?.convertedPrice ?? calc?.finalPrice ?? ctx.domain.price?.reseller?.price ?? 0;
    return typeof v === "number" && isFinite(v) ? v : 0;
  })();
  const domainTotal = hasDomain && !isDomainBundle ? domainDisplayPrice * duration : 0;
  const bundleTotal = isDomainBundle && bundleCtx ? bundleCtx.bundlePrice : 0;
  const addOnsTotal = isDomainBundle ? 0 : selectedAddOns.reduce((s, a) => s + a.price, 0);
  const upsellTotal = isDomainBundle ? 0 : selectedUpsellPlans.reduce((s, p) => s + p.price, 0);
  const mainPlanTotal = isDomainBundle ? 0 : selectedMainPlan ? selectedMainPlan.price : 0;
  const productSubtotal = isDomainBundle
    ? bundleTotal
    : domainTotal + addOnsTotal + upsellTotal + mainPlanTotal;

  const totalsByCurrency = getTotalsByCurrency();
  const currenciesInCart = getCurrenciesInCart();
  const primaryCurrency = currenciesInCart[0] ?? "KES";
  const cartSubtotal = totalsByCurrency[primaryCurrency] ?? 0;

  const transferSubtotal = isTransferMode && transferContext ? transferContext.price : 0;
  const subtotal = isTransferMode ? transferSubtotal : isCartMode ? cartSubtotal : productSubtotal;
  const VAT_RATE = 0.16;
  const { vatAmount: taxes, totalIncVat: total } = computeCeilVatTotals(subtotal, VAT_RATE);
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
      if (item.type === "domain_bundle") {
        const bundle = item as DomainBundleCartItem;
        const base = getDomainBundleCartLinePrice(bundle);
        const key = `cart-bundle:${item.id}`;
        const o = isAgencyUser ? parsePriceOverrideInput(priceOverrideByKey[key]) : null;
        return sum + (o ?? base);
      }
      if (item.type === "hivelocity") {
        const hv = item as HivelocityCartItem;
        const b = Number(hv.subtotalExVat ?? hv.totalPrice ?? 0) || 0;
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
    if (isDomainBundle && bundleCtx) {
      const bundleEff =
        isAgencyUser
          ? parsePriceOverrideInput(priceOverrideByKey["product-bundle"]) ?? bundleTotal
          : bundleTotal;
      return bundleEff;
    }
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
    isDomainBundle,
    bundleCtx,
    bundleTotal,
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
  const { vatAmount: effectiveTaxes, totalIncVat: effectiveTotal } = computeCeilVatTotals(
    effectiveSubtotal,
    VAT_RATE,
  );
  const customerMpesaAmount = canonicalMpesaPaymentAmount(effectiveTotal);

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
      captureEvent("mpesa_payment_failed");
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
      const extractTld = (domain?: string) => {
        if (!domain?.includes(".")) return undefined;
        return `.${domain.split(".").slice(1).join(".")}`;
      };

      if (isTransferMode && transferContext) {
        const tld = extractTld(transferContext.domain);
        captureEvent("domain_transfer_completed", {
          ...(tld ? { tld } : {}),
          price: transferContext.price,
          currency: transferContext.currency,
        });
      } else if (isCartMode) {
        captureEvent("storefront_checkout_completed", {
          currency: primaryCurrency,
          items_count: items.length,
          price: effectiveCartSubtotal || cartSubtotal,
        });
        for (const item of items) {
          if (item.type === "domain") {
            const tld = extractTld(item.domain);
            captureEvent("domain_purchased", {
              ...(tld ? { tld } : {}),
              price: getDomainCartLineBasePrice(item),
              currency: primaryCurrency,
              duration_years: 1,
            });
          } else if (item.type === "domain_bundle") {
            const bundle = item as DomainBundleCartItem;
            for (const d of bundle.domains) {
              const tld = extractTld(d.domain);
              captureEvent("domain_purchased", {
                ...(tld ? { tld } : {}),
                price: getDomainBundleCartLinePrice(bundle),
                currency: getDomainBundleCartLineCurrency(bundle) || primaryCurrency,
                duration_years: 1,
                is_bundle: true,
              });
            }
          }
        }
      } else if (ctx?.domain?.domain) {
        const tld = extractTld(ctx.domain.domain);
        captureEvent("domain_purchased", {
          ...(tld ? { tld } : {}),
          price: domainTotal || domainDisplayPrice,
          currency: displayCurrency,
          duration_years: duration,
        });
      } else if (isDomainBundle && bundleCtx) {
        for (const d of bundleCtx.domains) {
          const tld = extractTld(d.domain);
          captureEvent("domain_purchased", {
            ...(tld ? { tld } : {}),
            price: bundleCtx.bundlePrice,
            currency: bundleCtx.bundleCurrency,
            duration_years: duration,
            is_bundle: true,
          });
        }
      }

      if (isCartMode) clearCart();
      setCheckoutRequestId(null);
      orderCreatedForCheckoutRef.current = null;
      if (isTransferMode) {
        void utils.domainTransfer.listTransferRequests.invalidate();
      }
      toast.success("Order submitted for processing.");
      setTimeout(() => {
        window.location.reload();
      }, 2000);
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

  const buildDomainBundleOrderItems = React.useCallback(() => {
    if (!ctx?.productId || !bundleCtx?.domains?.length) return [];
    const str = (n: number) => (Number.isFinite(n) ? String(n) : "0");
    const linePrice = (key: string, base: number) =>
      isAgencyUser ? parsePriceOverrideInput(priceOverrideByKey[key]) ?? base : base;
    const bundlePrice = linePrice("product-bundle", bundleTotal);
    const domainNames = bundleCtx.domains.map((d) => d.domain).filter(Boolean);

    return bundleCtx.domains.map((domainResult, idx) => ({
      productId: ctx.productId,
      primaryDomain: domainResult.domain,
      description: "registration",
      productPlanId: null,
      billingCycle: "YEARLY" as const,
      itemPrice: idx === 0 ? str(bundlePrice) : "0",
      itemSubtotal: idx === 0 ? str(bundlePrice) : "0",
      metadata: {
        ...registrantOrderMetadata,
        [DOMAIN_BUNDLE_METADATA_KEY]: {
          bundleId: bundleCtx.bundleId,
          bundleLabel: bundleCtx.bundleLabel,
          bundlePrice,
          domains: domainNames,
          isBundleLeadItem: idx === 0,
        },
      },
    }));
  }, [
    ctx,
    bundleCtx,
    bundleTotal,
    isAgencyUser,
    priceOverrideByKey,
    registrantOrderMetadata,
  ]);

  const buildDomainProductOrderItems = React.useCallback(() => {
    if (isDomainBundle) return buildDomainBundleOrderItems();
    if (!ctx?.productId || !ctx?.domain?.domain) return [];
    const str = (n: number) => (Number.isFinite(n) ? String(n) : "0");
    const domainName = ctx.domain.domain;
    const linePrice = (key: string, base: number) =>
      isAgencyUser ? parsePriceOverrideInput(priceOverrideByKey[key]) ?? base : base;

    const domainCycle = domainBillingCycleFromYears(duration) as
      | "YEARLY"
      | "BIENNIALLY"
      | "TRIENNIALLY"
      | "QUADRENNIALLY";
    const items: Array<{
      productId: string;
      productPlanId?: string | null;
      billingCycle?: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "TRIENNIALLY" | "QUADRENNIALLY";
      primaryDomain: string;
      description?: string;
      itemPrice: string;
      itemSubtotal: string;
      metadata?: Record<string, unknown>;
    }> = [
      {
        productId: ctx.productId,
        primaryDomain: domainName,
        description: "registration",
        productPlanId: null,
        billingCycle: domainCycle,
        itemPrice: str(linePrice("product-domain", domainTotal)),
        itemSubtotal: str(linePrice("product-domain", domainTotal)),
        metadata: {
          ...registrantOrderMetadata,
          registrationPeriodYears: duration,
        },
      },
    ];

    for (const addon of selectedAddOns) {
      const price = linePrice(`addon:${addon.productId}`, addon.price);
      items.push({
        productId: addon.productId,
        productPlanId: addon.planId,
        billingCycle: "YEARLY",
        primaryDomain: domainName,
        itemPrice: str(price),
        itemSubtotal: str(price),
      });
    }

    if (selectedMainPlan) {
      const price = linePrice(`main-plan:${selectedMainPlan.planId}`, selectedMainPlan.price);
      items.push({
        productId: selectedMainPlan.productId,
        productPlanId: selectedMainPlan.planId,
        billingCycle: selectedMainPlan.billingCycle,
        primaryDomain: domainName,
        itemPrice: str(price),
        itemSubtotal: str(price),
      });
    }

    for (const upsell of selectedUpsellPlans) {
      const price = linePrice(`upsell:${upsell.productId}:${upsell.planId}`, upsell.price);
      items.push({
        productId: upsell.productId,
        productPlanId: upsell.planId,
        billingCycle: upsell.billingCycle,
        primaryDomain: domainName,
        itemPrice: str(price),
        itemSubtotal: str(price),
      });
    }

    return items;
  }, [
    isDomainBundle,
    buildDomainBundleOrderItems,
    ctx,
    domainTotal,
    duration,
    isAgencyUser,
    priceOverrideByKey,
    registrantOrderMetadata,
    selectedAddOns,
    selectedMainPlan,
    selectedUpsellPlans,
  ]);

  const buildUpgradeOrderItems = React.useCallback(() => {
    if (!ctx?.upgrade?.subscriptionId || !selectedMainPlan) return [];
    const str = (n: number) => (Number.isFinite(n) ? String(n) : "0");
    const price = isAgencyUser
      ? parsePriceOverrideInput(priceOverrideByKey[`main-plan:${selectedMainPlan.planId}`]) ??
        selectedMainPlan.price
      : selectedMainPlan.price;
    const primaryDomain = ctx.upgrade.primaryDomain?.trim();
    return [
      {
        productId: selectedMainPlan.productId,
        productPlanId: selectedMainPlan.planId,
        billingCycle: selectedMainPlan.billingCycle,
        ...(primaryDomain ? { primaryDomain } : {}),
        description: "upgrade",
        itemPrice: str(price),
        itemSubtotal: str(price),
        metadata: {
          upgradeFromSubscriptionId: ctx.upgrade.subscriptionId,
        },
      },
    ];
  }, [ctx, isAgencyUser, priceOverrideByKey, selectedMainPlan]);

  // Create order on payment success - called from poll callback to avoid useEffect latency
  const triggerOrderFromPayment = React.useCallback(
    (checkoutRequestIdParam: string) => {
      if (orderCreatedForCheckoutRef.current === checkoutRequestIdParam) return;
      orderCreatedForCheckoutRef.current = checkoutRequestIdParam;
      const str = (n: number) => (Number.isFinite(n) ? String(n) : "0");

      if (isTransferMode && transferContext) {
        const base = transferContext.price;
        const recorded = isAgencyUser ? parsePriceOverrideInput(priceOverrideByKey["transfer"]) ?? base : base;
        // Team transfers use teamId on the order; agency may also set billedForUserId (registrant).
        const billedForUserId =
          isAgencyUser &&
          registrantType === "existing_customer" &&
          selectedExistingCustomerId.trim()
            ? selectedExistingCustomerId.trim()
            : undefined;
        createOrderFromPayment.mutate({
          checkoutRequestId: checkoutRequestIdParam,
          items: [
            {
              productId: transferContext.productId,
              primaryDomain: transferContext.domain,
              description: "transfer",
              productPlanId: null,
              billingCycle: "YEARLY" as const,
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
          ...(transferContext.teamId ? { teamId: transferContext.teamId } : {}),
          ...(billedForUserId ? { billedForUserId } : {}),
        });
        return;
      }
      if (isCartMode) {
        if (!domainsProductId) return;
        const orderItems: Array<{
          productId: string;
          primaryDomain: string;
          description: string;
          productPlanId: null;
          billingCycle?: "YEARLY";
          itemPrice: string;
          itemSubtotal: string;
          metadata?: Record<string, unknown>;
        }> = [];

        for (const item of items) {
          if (item.type === "domain_bundle") {
            const bundle = item as DomainBundleCartItem;
            const key = `cart-bundle:${item.id}`;
            const bundlePrice = isAgencyUser
              ? parsePriceOverrideInput(priceOverrideByKey[key]) ?? getDomainBundleCartLinePrice(bundle)
              : getDomainBundleCartLinePrice(bundle);
            const domainNames = bundle.domains.map((d) => d.domain).filter(Boolean);
            bundle.domains.forEach((domainResult, idx) => {
              orderItems.push({
                productId: domainsProductId,
                primaryDomain: domainResult.domain,
                description: "registration",
                productPlanId: null,
                billingCycle: "YEARLY",
                itemPrice: idx === 0 ? str(bundlePrice) : "0",
                itemSubtotal: idx === 0 ? str(bundlePrice) : "0",
                metadata: {
                  ...registrantOrderMetadata,
                  [DOMAIN_BUNDLE_METADATA_KEY]: {
                    bundleId: bundle.bundleId,
                    bundleLabel: bundle.bundleLabel,
                    bundlePrice,
                    domains: domainNames,
                    isBundleLeadItem: idx === 0,
                  },
                },
              });
            });
            continue;
          }

          if (item.type === "domain" && item.price) {
            const price = getDomainCartLineBasePrice(item);
            const key = `cart-domain:${item.id}`;
            const line = isAgencyUser ? parsePriceOverrideInput(priceOverrideByKey[key]) ?? price : price;
            orderItems.push({
              productId: domainsProductId,
              primaryDomain: item.domain,
              description: "registration",
              productPlanId: null,
              billingCycle: "YEARLY",
              itemPrice: str(line),
              itemSubtotal: str(line),
              metadata: registrantOrderMetadata,
            });
          }
        }

        if (orderItems.length === 0) return;
        const cartBilledForUserId =
          isAgencyUser &&
          registrantType === "existing_customer" &&
          selectedExistingCustomerId.trim()
            ? selectedExistingCustomerId.trim()
            : undefined;
        createOrderFromPayment.mutate({
          checkoutRequestId: checkoutRequestIdParam,
          items: orderItems,
          currency: primaryCurrency,
          ...(checkoutTeamId ? { teamId: checkoutTeamId } : {}),
          ...(cartBilledForUserId ? { billedForUserId: cartBilledForUserId } : {}),
        });
        return;
      }
      if (isUpgradeMode) {
        const upgradeItems = buildUpgradeOrderItems();
        if (upgradeItems.length === 0) return;
        createOrderFromPayment.mutate({
          checkoutRequestId: checkoutRequestIdParam,
          items: upgradeItems,
          currency: selectedMainPlan?.currency ?? displayCurrency,
          ...((checkoutTeamId ?? ctx?.teamId)
            ? { teamId: checkoutTeamId ?? ctx?.teamId }
            : {}),
        });
        return;
      }
      const orderItems = buildDomainProductOrderItems();
      if (orderItems.length === 0) return;
      const billedForUserId =
        isAgencyUser &&
        registrantType === "existing_customer" &&
        selectedExistingCustomerId.trim()
          ? selectedExistingCustomerId.trim()
          : undefined;
      createOrderFromPayment.mutate({
        checkoutRequestId: checkoutRequestIdParam,
        items: orderItems,
        currency: displayCurrency,
        ...((checkoutTeamId ?? ctx?.teamId)
          ? { teamId: checkoutTeamId ?? ctx?.teamId }
          : {}),
        ...(billedForUserId ? { billedForUserId } : {}),
      });
    },
    [
      isTransferMode,
      transferContext,
      isCartMode,
      items,
      domainsProductId,
      primaryCurrency,
      checkoutTeamId,
      ctx,
      displayCurrency,
      createOrderFromPayment,
      isAgencyUser,
      priceOverrideByKey,
      registrantOrderMetadata,
      registrantType,
      selectedExistingCustomerId,
      buildDomainProductOrderItems,
      isUpgradeMode,
      buildUpgradeOrderItems,
      selectedMainPlan,
    ]
  );

  onPaymentSuccessRef.current = triggerOrderFromPayment;

  React.useEffect(() => {
    if (!userInfoQuery.data) return;
    const profile = userInfoQuery.data.profile;
    setJengaCustomer((prev) => ({
      customerFirstName: prev.customerFirstName || profile?.firstName || "",
      customerLastName: prev.customerLastName || profile?.lastName || "",
      customerEmail: prev.customerEmail || userInfoQuery.data.email || "",
      customerPhone: prev.customerPhone || profile?.phone || mpesaPhoneNumber || "",
      customerAddress: prev.customerAddress || profile?.address || "",
      customerPostalCodeZip: prev.customerPostalCodeZip || profile?.postalCode || "",
      countryCode:
        prev.countryCode ||
        (profile?.country?.length === 2 ? profile.country.toUpperCase() : "KE"),
    }));
  }, [userInfoQuery.data, mpesaPhoneNumber]);

  const initiateJengaPayment = trpc.paymentGateway.jenga.initiateCardPayment.useMutation({
    onError: (error) => {
      setJengaRedirecting(false);
      toast.error(error.message || "Failed to start card payment");
    },
  });

  const buildJengaOrderItems = React.useCallback(() => {
    const str = (n: number) => (Number.isFinite(n) ? String(n) : "0");
    if (isTransferMode && transferContext) {
      const base = transferContext.price;
      const recorded = isAgencyUser
        ? parsePriceOverrideInput(priceOverrideByKey["transfer"]) ?? base
        : base;
      return [
        {
          productId: transferContext.productId,
          primaryDomain: transferContext.domain,
          description: "transfer",
          productPlanId: null,
          billingCycle: "YEARLY" as const,
          itemPrice: str(recorded),
          itemSubtotal: str(recorded),
          metadata: {
            domainTransferRequestId: transferContext.domainTransferRequestId,
            transferAuthCode: transferContext.authCode,
            ...registrantOrderMetadata,
          },
        },
      ];
    }
    if (isCartMode) {
      if (!domainsProductId) return [];
      const orderItems: Array<Record<string, unknown>> = [];
      for (const item of items) {
        if (item.type === "domain_bundle") {
          const bundle = item as DomainBundleCartItem;
          const key = `cart-bundle:${item.id}`;
          const bundlePrice = isAgencyUser
            ? parsePriceOverrideInput(priceOverrideByKey[key]) ?? getDomainBundleCartLinePrice(bundle)
            : getDomainBundleCartLinePrice(bundle);
          const domainNames = bundle.domains.map((d) => d.domain).filter(Boolean);
          bundle.domains.forEach((domainResult, idx) => {
            orderItems.push({
              productId: domainsProductId,
              primaryDomain: domainResult.domain,
              description: "registration",
              productPlanId: null,
              billingCycle: "YEARLY",
              itemPrice: idx === 0 ? str(bundlePrice) : "0",
              itemSubtotal: idx === 0 ? str(bundlePrice) : "0",
              metadata: {
                ...registrantOrderMetadata,
                [DOMAIN_BUNDLE_METADATA_KEY]: {
                  bundleId: bundle.bundleId,
                  bundleLabel: bundle.bundleLabel,
                  bundlePrice,
                  domains: domainNames,
                  isBundleLeadItem: idx === 0,
                },
              },
            });
          });
          continue;
        }
        if (item.type === "domain" && item.price) {
          const price = getDomainCartLineBasePrice(item);
          const key = `cart-domain:${item.id}`;
          const line = isAgencyUser
            ? parsePriceOverrideInput(priceOverrideByKey[key]) ?? price
            : price;
          orderItems.push({
            productId: domainsProductId,
            primaryDomain: item.domain,
            description: "registration",
            productPlanId: null,
            billingCycle: "YEARLY",
            itemPrice: str(line),
            itemSubtotal: str(line),
            metadata: registrantOrderMetadata,
          });
        }
      }
      return orderItems;
    }
    return buildDomainProductOrderItems();
  }, [
    isTransferMode,
    transferContext,
    isCartMode,
    items,
    domainsProductId,
    isAgencyUser,
    priceOverrideByKey,
    registrantOrderMetadata,
    buildDomainProductOrderItems,
  ]);

  const handleJengaPayment = async () => {
    const errors = validateJengaCustomerForm(jengaCustomer);
    setJengaCustomerErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast.error("Please complete the billing details for card payment");
      return;
    }

    const amount = Number.parseFloat(
      isAgencyUser ? paymentAmount || customerMpesaAmount : customerMpesaAmount,
    );
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Invalid payment amount");
      return;
    }

    const orderItems = buildJengaOrderItems();
    if (!orderItems.length) {
      toast.error("No order items to pay for");
      return;
    }

    const billedForUserId =
      isAgencyUser &&
      registrantType === "existing_customer" &&
      selectedExistingCustomerId.trim()
        ? selectedExistingCustomerId.trim()
        : undefined;

    const currency = isCartMode
      ? primaryCurrency
      : isTransferMode && transferContext
        ? transferContext.currency
        : displayCurrency;

    const teamIdForOrder = isTransferMode
      ? transferContext?.teamId
      : checkoutTeamId ?? ctx?.teamId;

    setJengaRedirecting(true);
    captureEvent("jenga_payment_initiated", { amount });
    try {
      const response = await initiateJengaPayment.mutateAsync({
        amount,
        currency: (currency as "KES" | "USD" | "EUR" | "GBP" | "TZS" | "UGX") || "KES",
        productType: "Service",
        productDescription: "Nisc Cloud order".slice(0, 200),
        ...jengaCustomer,
        ...(teamIdForOrder ? { teamId: teamIdForOrder } : {}),
        orderIntent: {
          source: "global_buy_now",
          returnPath: "/payment/card/return",
          returnOrigin: window.location.origin,
          items: orderItems,
          currency,
          teamId: teamIdForOrder,
          billedForUserId,
        },
      });
      const data = response.data;
      if (!data?.checkoutUrl || !data.paymentData) {
        setJengaRedirecting(false);
        toast.error("Failed to start card checkout");
        return;
      }
      submitJengaPaymentForm(data.checkoutUrl, data.paymentData);
    } catch {
      setJengaRedirecting(false);
    }
  };

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
            captureEvent("mpesa_payment_completed");
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
    if (!isAgencyUser) return;
    const value = e.target.value.replace(/[^a-zA-Z0-9]/g, "").slice(0, 12);
    setAccountReference(value);
    setAccountRefError(validateAccountReference(value));
  };
  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMpesaPhoneNumber(e.target.value);
    setPhoneError(validatePhoneNumber(e.target.value));
  };
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isAgencyUser) return;
    setPaymentAmount(e.target.value);
    setAmountError(validateAmount(e.target.value));
  };

  const handleMpesaPayment = async () => {
    const resolved = resolveMpesaCheckoutPayment({
      isAgencyUser,
      formAmount: paymentAmount,
      formAccountReference: accountReference,
      checkoutTotalIncVat: effectiveTotal,
      intendedAccountReference: intendedAccountReferenceRef.current,
    });

    const refErr = validateAccountReference(resolved.accountReference);
    const phoneErr = validatePhoneNumber(mpesaPhoneNumber);
    const amtErr = validateAmount(resolved.amountString);
    setAccountRefError(refErr);
    setPhoneError(phoneErr);
    setAmountError(amtErr);
    if (refErr || phoneErr || amtErr) {
      toast.error("Please fix the errors in the form");
      return;
    }

    const amount = resolved.amount;
    const timestamp = Date.now().toString().slice(-9);
    const transactionDesc = isCartMode ? `CART${timestamp}` : isTransferMode && transferContext
      ? (transferContext.domain.replace(/\./g, "").slice(0, 9).toUpperCase() || "TRF") + timestamp
      : (ctx?.domain?.domain?.replace(/\./g, "").slice(0, 9).toUpperCase() ?? "ORD") + timestamp;
    try {
      captureEvent("mpesa_payment_initiated", { amount: amount, phone_length: mpesaPhoneNumber.replace(/\D/g, "").length });
      await initiateMpesaPayment.mutateAsync({
        phoneNumber: mpesaPhoneNumber.trim(),
        amount,
        accountReference: resolved.accountReference,
        transactionDesc: transactionDesc.slice(0, 13),
        checkoutTotalIncVat: effectiveTotal,
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
    const resolved = resolveMpesaCheckoutPayment({
      isAgencyUser,
      formAmount: paymentAmount,
      formAccountReference: accountReference,
      checkoutTotalIncVat: effectiveTotal,
      intendedAccountReference: intendedAccountReferenceRef.current,
    });
    const amount = resolved.amount;
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter a valid payment amount.");
      return;
    }

    try {
      const result = await recordManualPayment.mutateAsync({
        transactionReference: ref,
        amount,
        currency: isCartMode ? primaryCurrency : displayCurrency,
        gateway:
          selectedPaymentMethod === "card"
            ? "JENGA"
            : selectedPaymentMethod === "mpesa"
              ? "MPESA"
              : "OTHER",
        accountReference: resolved.accountReference || undefined,
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

  const buildCheckoutAccountReference = React.useCallback(() => {
    const ts = Date.now().toString().slice(-9);
    return isCartMode
      ? `CART${ts}`.slice(0, 12)
      : isTransferMode && transferContext
        ? (transferContext.domain.replace(/\./g, "").slice(0, 3).toUpperCase() || "TRF") + ts
        : (ctx?.domain?.domain?.replace(/\./g, "").slice(0, 3).toUpperCase() || "ORD") + ts;
  }, [isCartMode, isTransferMode, transferContext, ctx?.domain?.domain]);

  const openForPayment = () => {
    setCurrentStep("payment");
    const amountValue = customerMpesaAmount;
    intendedPaymentAmountRef.current = amountValue;
    setPaymentAmount(amountValue);
    const ref = buildCheckoutAccountReference();
    intendedAccountReferenceRef.current = ref;
    setAccountReference(ref);
    setAccountRefError("");
    setPhoneError("");
    setAmountError("");
  };

  const prevGlobalStepRef = React.useRef<typeof currentStep | null>(null);
  React.useEffect(() => {
    if (!open) {
      prevGlobalStepRef.current = null;
      return;
    }
    const enteredPayment =
      currentStep === "payment" && prevGlobalStepRef.current !== "payment";
    const amountValue = customerMpesaAmount;
    if (currentStep === "payment") {
      if (isAgencyUser) {
        if (enteredPayment) {
          intendedPaymentAmountRef.current = amountValue;
          setPaymentAmount(amountValue);
          const ref = buildCheckoutAccountReference();
          intendedAccountReferenceRef.current = ref;
          setAccountReference(ref);
        }
      } else {
        intendedPaymentAmountRef.current = amountValue;
        setPaymentAmount(amountValue);
        if (enteredPayment) {
          const ref = buildCheckoutAccountReference();
          intendedAccountReferenceRef.current = ref;
          setAccountReference(ref);
        }
      }
    }
    prevGlobalStepRef.current = currentStep;
  }, [open, currentStep, customerMpesaAmount, isAgencyUser, buildCheckoutAccountReference]);

  const goToRegistrantStep = () => {
    setRegistrantStepCompleted(false);
    setCurrentStep("registrant_info");
  };

  const goToReviewOrRegistrant = React.useCallback(() => {
    if (needsRegistrantStep && !registrantStepCompleted) {
      goToRegistrantStep();
      return;
    }
    setCurrentStep("review");
  }, [needsRegistrantStep, registrantStepCompleted]);

  const goToDomainCheckoutStep = () => {
    if (needsRegistrantStep && !registrantStepCompleted) {
      goToRegistrantStep();
      return;
    }
    setCurrentStep("review");
  };

  const continueToPayment = React.useCallback(() => {
    if (needsRegistrantStep && !registrantStepCompleted) {
      goToRegistrantStep();
      return;
    }
    openForPayment();
  }, [needsRegistrantStep, registrantStepCompleted]);

  const proceedFromReview = () => {
    if (needsRegistrantStep && !registrantStepCompleted) {
      goToRegistrantStep();
      return;
    }
    if (purchaseAsBusiness && checkoutTeamId) {
      if (teamBillingQuery.isLoading || teamBillingQuery.isFetching) {
        toast.message("Checking company billing details…");
        return;
      }
      if (needsCheckoutTeamBillingStep(purchaseAsBusiness, teamBilling)) {
        setCurrentStep("team_billing");
        return;
      }
    }
    openForPayment();
  };

  const handleTeamBillingSaved = React.useCallback(async () => {
    const result = await teamBillingQuery.refetch();
    if (isTeamBillingComplete(result.data)) {
      continueToPayment();
    }
  }, [teamBillingQuery, continueToPayment]);

  const upsellToServiceSelected = React.useCallback(
    (plans: SelectedUpsellPlan[]): SelectedServiceUpsell[] =>
      plans.map((p) => ({
        category: "hosting" as const,
        hostingType: p.hostingType,
        productId: p.productId,
        productName: p.productName,
        planId: p.planId,
        planName: p.planName,
        billingCycle: p.billingCycle,
        price: p.price,
        currency: p.currency,
      })),
    [],
  );

  const handleBack = () => {
    if (currentStep === "hosting-upsell") setCurrentStep("product");
    else if (currentStep === "plan-selection") {
      if (isUpgradeMode) {
        close();
        return;
      }
      if (isSelectingMainProductPlan) {
        setPlanSelectionProductId(null);
        setPlanSelectionProductName("");
        setIsSelectingMainProductPlan(false);
        setCurrentStep("product");
      } else {
        setUpsellBrowseTarget(null);
        setSelectedPlanId(null);
        setCurrentStep("hosting-upsell");
      }
    } else if (currentStep === "review" && (isCartMode || ctx)) {
      if (needsRegistrantStep && registrantStepCompleted) {
        setCurrentStep("registrant_info");
        return;
      }
      if (isCartMode) return;
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
      if (isCartMode || isTransferMode) {
        close();
        return;
      }
      if (isDomainBundle) {
        setCurrentStep("product");
      } else if (isDomainProduct) {
        setCurrentStep("hosting-upsell");
      } else {
        setCurrentStep("review");
      }
    } else if (currentStep === "team_billing") {
      setCurrentStep("review");
    } else if (currentStep === "payment") {
      setCurrentStep("review");
    }
  };

  const openUpsellPlanSelection = (target: UpsellBrowseTarget) => {
    const existing = selectedUpsellPlans.find((p) => p.hostingType === target.hostingType);
    setUpsellBrowseTarget(target);
    setSelectedPlanId(existing?.planId ?? null);
    setSelectedBillingCycle(existing?.billingCycle ?? DEFAULT_HOSTING_BILLING_CYCLE);
    setIsSelectingMainProductPlan(false);
    setPlanSelectionProductId(null);
    setPlanSelectionProductName("");
    setCurrentStep("plan-selection");
  };

  const handleHostingBrowsePlans = (type: HostingPlanType) => {
    openUpsellPlanSelection({ hostingType: type });
  };

  const handleHostingRemove = (type: HostingPlanType) => {
    setSelectedUpsellPlans((prev) => prev.filter((p) => p.hostingType !== type));
  };

  const upsellPlanSelectionContext = React.useMemo(() => {
    if (!upsellBrowseTarget) return null;
    return {
      title:
        upsellBrowseTarget.hostingType === "web" ? "Website hosting" : "Email hosting",
      plans:
        upsellBrowseTarget.hostingType === "web"
          ? (webHostingPricing?.plans ?? [])
          : (emailHostingPricing?.plans ?? []),
      productFeatures:
        upsellBrowseTarget.hostingType === "web"
          ? (webHostingPricing?.productFeatures ?? [])
          : (emailHostingPricing?.productFeatures ?? []),
      isLoading:
        upsellBrowseTarget.hostingType === "web"
          ? isLoadingWebHostingPricing
          : isLoadingEmailHostingPricing,
      planType: upsellBrowseTarget.hostingType,
    };
  }, [
    upsellBrowseTarget,
    webHostingPricing,
    emailHostingPricing,
    isLoadingWebHostingPricing,
    isLoadingEmailHostingPricing,
  ]);

  const addSelectedPlanToUpsell = () => {
    if (upsellBrowseTarget && selectedPlanId) {
      const plans = upsellPlanSelectionContext?.plans ?? [];
      const plan = plans.find((p) => p.id === selectedPlanId);
      if (!plan) return;
      const cycle = selectedBillingCycle;
      const upsell = planSelectionToUpsell(plan, upsellBrowseTarget, cycle);
      setSelectedUpsellPlans((prev) => {
        const without = prev.filter((p) => p.hostingType !== upsellBrowseTarget.hostingType);
        return [
          ...without,
          {
            productId: upsell.productId,
            productName: upsell.productName,
            planId: upsell.planId,
            planName: upsell.planName,
            billingCycle: upsell.billingCycle,
            price: upsell.price,
            currency: upsell.currency,
            hostingType: upsell.hostingType,
          },
        ];
      });
      setUpsellBrowseTarget(null);
      setSelectedPlanId(null);
      setCurrentStep("hosting-upsell");
      return;
    }

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
      goToReviewOrRegistrant();
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
      setCurrentStep(isAgencySide ? "registrant_info" : "review");
    } else if (isCartMode) {
      setCurrentStep(isAgencySide ? "registrant_info" : "review");
    } else if (isUpgradeMode && ctx?.productId) {
      setPlanSelectionProductId(ctx.productId);
      setPlanSelectionProductName(ctx.productName);
      setIsSelectingMainProductPlan(true);
      setCurrentStep("plan-selection");
    } else {
      setCurrentStep("product");
    }
    hasInitializedStepRef.current = true;
  }, [open, isCartMode, isTransferMode, isAgencySide, isUpgradeMode, ctx?.productId, ctx?.productName]);

  React.useEffect(() => {
    if (!open) {
      setCouponCode("");
      setDuration(1);
      setSelectedAddOns([]);
      setSelectedUpsellPlans([]);
      setSelectedMainPlan(null);
      setPlanSelectionProductId(null);
      setIsSelectingMainProductPlan(false);
      setUpsellBrowseTarget(null);
      setRegistrantStepCompleted(false);
      setPurchaseAsBusiness(false);
      setSelectedPlanId(null);
      setSelectedBillingCycle(DEFAULT_HOSTING_BILLING_CYCLE);
      setRegistrantType(isAgencySide ? "existing_customer" : "myself");
      setSelectedExistingCustomerId("");
      setSelectedPaymentMethod(null);
      setMpesaPhoneNumber("");
      setPaymentAmount("");
      setAccountReference("");
      intendedPaymentAmountRef.current = "";
      intendedAccountReferenceRef.current = "";
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
        if (isDomainBundle && bundleCtx) {
          return (
            <BuyNowDomainBundleProductStep
              bundleLabel={bundleCtx.bundleLabel}
              domains={bundleCtx.domains}
              bundlePrice={
                isAgencyUser
                  ? parsePriceOverrideInput(priceOverrideByKey["product-bundle"]) ?? bundleTotal
                  : bundleTotal
              }
              displayCurrency={displayCurrency}
            />
          );
        }
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
              <ScrollArea className="h-[280px] w-full" thumbClassName="bg-primary">
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
              </ScrollArea>
            )}
          </div>
        );
      }

      case "hosting-upsell":
        return (
          <BuyNowStepBody>
            <HostingUpsellStep
              domainLabel={ctx?.domain?.domain}
              selected={upsellToServiceSelected(selectedUpsellPlans)}
              webFromPrice={webFromPrice}
              emailFromPrice={emailFromPrice}
              pricePeriodLabel="/mo"
              isLoadingPrices={isLoadingWebHostingPricing || isLoadingEmailHostingPricing}
              onBrowseHostingPlans={handleHostingBrowsePlans}
              onChangeHostingPlan={handleHostingBrowsePlans}
              onRemoveHosting={handleHostingRemove}
            />
          </BuyNowStepBody>
        );

      case "plan-selection":
        if (upsellBrowseTarget && upsellPlanSelectionContext) {
          return (
            <ScrollArea className="h-[min(72vh,44rem)] w-full max-w-[calc(100%-0.5rem)]" thumbClassName="bg-primary">
              <div className="py-2 pl-1 pr-4">
              <HostingPlanSelectionStep
                selectionTitle={upsellPlanSelectionContext.title}
                planType={upsellPlanSelectionContext.planType}
                domainLabel={ctx?.domain?.domain}
                plans={upsellPlanSelectionContext.plans}
                productFeatures={upsellPlanSelectionContext.productFeatures}
                isLoading={upsellPlanSelectionContext.isLoading}
                selectedPlanId={selectedPlanId}
                onSelectPlan={setSelectedPlanId}
                billingCycle={selectedBillingCycle}
                onBillingCycleChange={setSelectedBillingCycle}
              />
              </div>
            </ScrollArea>
          );
        }
        return (
          <BuyNowStepBody>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {isUpgradeMode
                  ? "Choose a higher-priced plan. Downgrades are not available."
                  : <>Choose a plan for <span className="font-medium text-foreground">{planSelectionProductName}</span></>}
              </p>
              {isPlanCatalogLoading ? (
                <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-12">
                  <Spinner className="size-6" />
                  <p className="text-sm text-muted-foreground">Loading plans and features…</p>
                </div>
              ) : isPlanCatalogError ? (
                <div className="rounded-xl border border-dashed border-destructive/40 py-8 text-center text-sm text-destructive">
                  Unable to load plans. Close and try again.
                </div>
              ) : plans.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
                  {isUpgradeMode
                    ? "No higher-priced plans are available."
                    : "No plans available."}
                </div>
              ) : (
                <div className="space-y-2.5">
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
                      <PlanOptionWithFeatures
                        key={plan.id}
                        plan={{
                          id: plan.id,
                          name: plan.name,
                          description: plan.description,
                          features: resolvePlanFeatureDisplay(productFeatureCatalog, plan.planFeatures),
                        }}
                        selected={isSelected}
                        onSelect={(planId) => {
                          setSelectedPlanId(planId);
                          setSelectedBillingCycle(planCycle);
                        }}
                        priceLabel={`${formatPrice(monthlyPrice, plan.currency)}/mo`}
                      >
                        {isSelected ? (
                          <div className="space-y-2 px-3.5 pb-3">
                            <div onClick={(e) => e.stopPropagation()}>
                              <Select
                                value={cycle}
                                onValueChange={(v: HostingBillingCycle) =>
                                  setSelectedBillingCycle(v)
                                }
                              >
                                <SelectTrigger className="w-32 h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                                  <SelectItem value="YEARLY">Yearly</SelectItem>
                                  <SelectItem value="BIENNIALLY">Every 2 years</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <p className="text-xs font-medium text-foreground">
                              {formatPrice(displayTotal, plan.currency)} total
                            </p>
                          </div>
                        ) : null}
                      </PlanOptionWithFeatures>
                    );
                  })}
                </div>
              )}
            </div>
          </BuyNowStepBody>
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
              <ScrollArea className="h-[200px] w-full" thumbClassName="bg-primary">
                <div className="space-y-3 pr-4">
                  {items.map((item) => {
                    let overrideKey: string | null = null;
                    let overrideCurrency = primaryCurrency;
                    let catalogExVat = 0;
                    if (item.type === "domain" && item.price) {
                      overrideKey = `cart-domain:${item.id}`;
                      overrideCurrency = getDomainCartLineCurrency(item);
                      catalogExVat = getDomainCartLineBasePrice(item);
                    } else if (item.type === "domain_bundle") {
                      const bundle = item as DomainBundleCartItem;
                      overrideKey = `cart-bundle:${item.id}`;
                      overrideCurrency = getDomainBundleCartLineCurrency(bundle);
                      catalogExVat = getDomainBundleCartLinePrice(bundle);
                    } else if (item.type === "hivelocity") {
                      const hv = item as HivelocityCartItem;
                      overrideKey = `cart-hivelocity:${item.id}`;
                      overrideCurrency = hv.currency || primaryCurrency;
                      catalogExVat = Number(hv.subtotalExVat ?? hv.totalPrice ?? 0) || 0;
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
              </ScrollArea>
              {showPurchaseAsBusinessOption ? (
                <PurchaseAsBusinessOption
                  value={purchaseAsBusiness}
                  onChange={setPurchaseAsBusiness}
                />
              ) : null}
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
        return (
          <div className="space-y-4">
            {isDomainBundle && bundleCtx ? (
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start gap-4">
                  <div className="min-w-0">
                    <div className="font-medium">Domains bundle</div>
                    <div className="text-sm text-muted-foreground break-words">{bundleCtx.bundleLabel}</div>
                    <div className="text-xs text-muted-foreground mt-1">1 year registration for all domains</div>
                  </div>
                  <div className="font-semibold shrink-0">
                    {formatPrice(
                      isAgencyUser
                        ? parsePriceOverrideInput(priceOverrideByKey["product-bundle"]) ?? bundleTotal
                        : bundleTotal,
                      displayCurrency,
                    )}
                  </div>
                </div>
                <ul className="space-y-1.5 border-t border-border/60 pt-3">
                  {bundleCtx.domains.map((d) => (
                    <li key={d.domain} className="text-sm text-foreground truncate">
                      {d.domain}
                    </li>
                  ))}
                </ul>
                {priceOverrideField(
                  "product-bundle",
                  displayCurrency,
                  isAgencyUser
                    ? parsePriceOverrideInput(priceOverrideByKey["product-bundle"]) ?? bundleTotal
                    : bundleTotal,
                )}
              </div>
            ) : null}
            <ScrollArea className="h-[300px] w-full" thumbClassName="bg-primary">
              <div className="space-y-4 pr-4">
                {hasDomain && ctx?.domain && !isDomainBundle && (
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
                        <div className="font-medium">
                          {isUpgradeMode ? "Upgrade · " : ""}
                          {selectedMainPlan.productName} · {selectedMainPlan.planName}
                        </div>
                        <div className="text-sm text-muted-foreground">{hostingBillingCycleLabel(selectedMainPlan.billingCycle)}</div>
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
                        <div className="font-medium">{p.productName} · {p.planName}</div>
                        <div className="text-sm text-muted-foreground">{hostingBillingCycleLabel(p.billingCycle)}</div>
                      </div>
                      <div className="font-semibold shrink-0">{formatPrice(p.price, p.currency)}</div>
                    </div>
                    {priceOverrideField(`upsell:${p.productId}:${p.planId}`, p.currency, p.price)}
                  </div>
                ))}
              </div>
            </ScrollArea>
            {showPurchaseAsBusinessOption ? (
              <PurchaseAsBusinessOption
                value={purchaseAsBusiness}
                onChange={setPurchaseAsBusiness}
              />
            ) : null}
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

      case "team_billing":
        if (!checkoutTeamId) return null;
        return (
          <BuyNowStepBody className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Company billing details</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Add your company billing information so we can invoice this order correctly.
              </p>
            </div>
            <CheckoutTeamBillingForm
              teamId={checkoutTeamId}
              formId={CHECKOUT_TEAM_BILLING_FORM_ID}
              isLoading={teamBillingQuery.isLoading}
              initialData={teamBillingInitialData}
              onSaved={() => void handleTeamBillingSaved()}
            />
          </BuyNowStepBody>
        );

      case "payment":
        return (
          <BuyNowStepBody className="space-y-6">
            <div className="text-center py-2">
              <h3 className="text-lg font-semibold text-foreground">Choose payment method</h3>
              <p className="text-sm text-muted-foreground">Select your preferred method</p>
            </div>
            <PaymentMethodAccordion
              value={selectedPaymentMethod}
              onValueChange={setSelectedPaymentMethod}
            >
              <PaymentMethodOption
                value="mpesa"
                variant="mpesa"
                trigger={
                  <PaymentMethodTrigger
                    variant="mpesa"
                    icon={<img src="/mpesa.png" alt="M-Pesa" className="h-full w-full object-contain" />}
                    title="M-Pesa"
                    description="Pay instantly from your phone - secured by Nisc Cloud"
                  />
                }
              >
                <PaymentMethodContent>
                    {showPaymentWaiting ? (
                      <div className="py-8 flex flex-col items-center">
                        <Spinner variant="ellipsis" size={48} className="mb-4 text-primary" />
                        <p className="text-sm font-medium">Waiting for payment confirmation...</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <MpesaPaymentFields
                          currency={primaryCurr}
                          canEditPaymentDetails={isAgencyUser}
                          phoneNumber={mpesaPhoneNumber}
                          onPhoneNumberChange={handlePhoneNumberChange}
                          phoneError={phoneError || undefined}
                          amount={isAgencyUser ? paymentAmount : customerMpesaAmount}
                          onAmountChange={handleAmountChange}
                          amountError={amountError || undefined}
                          amountHelperText={
                            isAgencyUser
                              ? `Order total: ${formatPrice(effectiveTotal, primaryCurr)} (editable)`
                              : `Order total: ${formatPrice(effectiveTotal, primaryCurr)}`
                          }
                          accountReference={accountReference}
                          onAccountReferenceChange={handleAccountReferenceChange}
                          accountRefError={accountRefError || undefined}
                          accountRefHelperText={
                            accountRefError ? undefined : `Reference (${accountReference.length}/12)`
                          }
                          idPrefix="global-mpesa"
                        />
                        <div className="flex justify-end pt-1">
                          <MpesaPayButton
                            onClick={handleMpesaPayment}
                            disabled={initiateMpesaPayment.isPending || !mpesaPhoneNumber || !paymentAmount || !accountReference || !!accountRefError || !!phoneError || !!amountError}
                          >
                            {initiateMpesaPayment.isPending ? "Processing..." : "Pay with M-Pesa"}
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
                    icon={<CreditCard className="size-7 text-foreground" />}
                    title="Card"
                    description="Pay securely with Visa, Mastercard and more"
                  />
                }
              >
                <PaymentMethodContent>
                  {jengaRedirecting || initiateJengaPayment.isPending ? (
                    <div className="py-8 flex flex-col items-center">
                      <Spinner variant="ellipsis" size={48} className="mb-4 text-primary" />
                      <p className="text-sm font-medium">Redirecting to secure card payment…</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <JengaCardPaymentFields
                        value={jengaCustomer}
                        onChange={setJengaCustomer}
                        errors={jengaCustomerErrors}
                        idPrefix="global-jenga"
                      />
                      <div className="flex justify-end pt-1">
                        <Button
                          onClick={() => void handleJengaPayment()}
                          disabled={initiateJengaPayment.isPending || jengaRedirecting}
                        >
                          Pay with Card
                        </Button>
                      </div>
                    </div>
                  )}
                </PaymentMethodContent>
              </PaymentMethodOption>
              {isAgencyUser ? (
                <PaymentMethodOption
                  value="manual"
                  trigger={
                    <PaymentMethodTrigger
                      icon={<Receipt className="size-7 text-foreground" />}
                      title="Record payment reference"
                      description="M-Pesa receipt, bank transfer, or other external payment"
                    />
                  }
                >
                  <PaymentMethodContent>
                      <div className="space-y-4">
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
                        <MpesaPaymentFields
                          showPhone={false}
                          currency={primaryCurr}
                          canEditPaymentDetails={isAgencyUser}
                          phoneNumber=""
                          onPhoneNumberChange={() => {}}
                          amount={isAgencyUser ? paymentAmount : customerMpesaAmount}
                          onAmountChange={handleAmountChange}
                          amountError={amountError || undefined}
                          amountHelperText={`Order total: ${formatPrice(effectiveTotal, primaryCurr)}`}
                          accountReference={accountReference}
                          onAccountReferenceChange={handleAccountReferenceChange}
                          accountRefError={accountRefError || undefined}
                          idPrefix="global-manual"
                        />
                        <div className="flex justify-end pt-1">
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
                          >
                            {recordManualPayment.isPending || createOrderFromPayment.isPending
                              ? "Processing…"
                              : "Record payment & complete order"}
                          </Button>
                        </div>
                      </div>
                  </PaymentMethodContent>
                </PaymentMethodOption>
              ) : null}
            </PaymentMethodAccordion>
            <div className="border-t pt-4 mt-8 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span>{formatPrice(effectiveSubtotal, primaryCurr)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Taxes</span><span>{formatPrice(effectiveTaxes, primaryCurr)}</span></div>
              <div className="flex justify-between font-bold text-lg border-t pt-2"><span>Total</span><span>{formatPrice(effectiveTotal, primaryCurr)}</span></div>
            </div>
          </BuyNowStepBody>
        );

      case "registrant_info":
        if (isCustomerDomainCheckout) {
          return (
            <BuyNowStepBody className="space-y-6">
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
            </BuyNowStepBody>
          );
        }

        return (
          <BuyNowStepBody className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-foreground">Registrant details</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Choose a customer in nPanel or use your agency profile for this order.
              </p>
            </div>

            <div className="rounded-xl border border-primary/25 bg-primary/5 px-4 py-3.5 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
              <div className="flex gap-3 min-w-0">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <UserPlus className="size-4" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <p className="text-sm font-medium text-foreground">New customer?</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Create them in nPanel with a complete profile, then return here to process the order on their behalf.
                  </p>
                </div>
              </div>
              <Button size="sm" className="shrink-0 w-full sm:w-auto" asChild>
                <Link to="/agency/clients" onClick={() => close()}>
                  Create customer in nPanel
                </Link>
              </Button>
            </div>

            <div className="grid gap-4">
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
                      Search and select a customer with a complete profile - recommended for client orders.
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
                        This customer&apos;s profile is incomplete. Complete their profile in Clients, or
                        choose another customer.
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
          </BuyNowStepBody>
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
    if (effectiveStep === "product") {
      if (isDomainBundle && bundleCtx) return `Get deal: ${bundleCtx.bundleLabel}`;
      return `Buy ${hasDomain ? ctx?.domain?.domain ?? ctx?.productName : ctx?.productName}`;
    }
    if (effectiveStep === "hosting-upsell") return "Add cloud hosting";
    if (effectiveStep === "plan-selection") {
      if (isUpgradeMode) return `Upgrade ${ctx?.productName ?? "subscription"}`;
      if (upsellBrowseTarget) {
        return upsellBrowseTarget.hostingType === "web" ? "Website hosting plans" : "Email hosting plans";
      }
      return `Select plan: ${planSelectionProductName}`;
    }
    if (effectiveStep === "review") return "Complete and review";
    if (effectiveStep === "registrant_info") {
      return isCustomerDomainCheckout ? "Profile required" : "Registrant details";
    }
    if (effectiveStep === "team_billing") return "Company billing";
    if (effectiveStep === "payment") return "Choose payment method";
    if (effectiveStep === "success") return "Order confirmed";
    if (effectiveStep === "error") return "Payment failed";
    return "Buy now";
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent
        className={cn(
          "max-h-[90vh] flex flex-col overflow-hidden p-0 gap-0",
          effectiveStep === "plan-selection" && upsellBrowseTarget
            ? "sm:max-w-4xl"
            : effectiveStep === "team_billing"
              ? "sm:max-w-2xl"
              : "sm:max-w-[600px]",
        )}
      >
        <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0">
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>
            {effectiveStep === "product" && (isDomainBundle ? "Review bundle details and continue." : "Add optional services and proceed.")}
            {effectiveStep === "hosting-upsell" &&
              "Add website or email hosting for your domain, or skip to checkout."}
            {effectiveStep === "plan-selection" &&
              (isUpgradeMode
                ? "Select a higher plan, then pay. The invoice will show this as an upgrade."
                : upsellBrowseTarget
                ? "Compare plans and pick the billing period that works for you."
                : "Choose a plan to continue.")}
            {effectiveStep === "review" && "Review and proceed to checkout."}
            {effectiveStep === "registrant_info" &&
              (isCustomerDomainCheckout
                ? "Complete your profile before paying for a domain."
                : "Select a customer in nPanel or use your agency profile.")}
            {effectiveStep === "team_billing" &&
              "Enter company billing details used on your invoice. You can update these later in Settings."}
            {effectiveStep === "payment" && "Complete your payment."}
            {effectiveStep === "success" && "Order confirmed."}
            {effectiveStep === "error" && "Payment could not be completed."}
          </DialogDescription>
        </DialogHeader>
        <BuyNowDialogBodyScroll>{renderStep()}</BuyNowDialogBodyScroll>
        <DialogFooter className="gap-2 px-6 pb-6 pt-4 flex-shrink-0 border-t">
          {effectiveStep === "product" && (
            <>
              <Button variant="ghost" onClick={() => close()}>Cancel</Button>
              <Button
                onClick={() => {
                  if (isDomainBundle) {
                    goToDomainCheckoutStep();
                    return;
                  }
                  if (isDomainProduct) setCurrentStep("hosting-upsell");
                  else if (!hasDomain && ctx?.productId) {
                    setPlanSelectionProductId(ctx.productId);
                    setPlanSelectionProductName(ctx.productName);
                    setIsSelectingMainProductPlan(true);
                    setCurrentStep("plan-selection");
                  } else if (isDomainProduct) {
                    goToDomainCheckoutStep();
                  } else goToReviewOrRegistrant();
                }}
              >
                {isDomainBundle
                  ? "Continue"
                  : isDomainProduct
                    ? "Continue"
                    : !hasDomain && ctx?.productId
                      ? "Select plan"
                      : "Proceed to checkout"}
              </Button>
            </>
          )}
          {effectiveStep === "hosting-upsell" && (
            <>
              <Button variant="ghost" onClick={handleBack}>Back</Button>
              <Button
                onClick={() => {
                  if (isDomainProduct) goToDomainCheckoutStep();
                  else goToReviewOrRegistrant();
                }}
              >
                Proceed to checkout
              </Button>
            </>
          )}
          {effectiveStep === "plan-selection" && (
            <>
              <Button variant="ghost" onClick={handleBack}>
                Back
              </Button>
              <Button
                disabled={!selectedPlanId || (!upsellBrowseTarget && isPlanCatalogLoading)}
                onClick={addSelectedPlanToUpsell}
              >
                {upsellBrowseTarget ? "Add to order" : "Continue"}
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
                      (registrantType === "existing_customer" && !isExistingCustomerReady)
                }
                onClick={() => {
                  setRegistrantStepCompleted(true);
                  setCurrentStep("review");
                }}
              >
                {isCustomerDomainCheckout && !isProfileComplete
                  ? "Complete profile to continue"
                  : "Review order"}
              </Button>
            </>
          )}
          {effectiveStep === "team_billing" && (
            <>
              <Button variant="ghost" onClick={handleBack}>
                Back
              </Button>
              <Button type="submit" form={CHECKOUT_TEAM_BILLING_FORM_ID}>
                Save and continue
              </Button>
            </>
          )}
          {effectiveStep === "review" && (
            <>
              <Button variant="ghost" onClick={isCartMode ? () => close() : isTransferMode ? () => close() : handleBack}>
                {isCartMode ? "Cancel" : isTransferMode ? "Cancel" : "Back"}
              </Button>
              <Button onClick={proceedFromReview}>
                {needsRegistrantStep && !registrantStepCompleted
                  ? "Continue to registrant details"
                  : isCartMode || isTransferMode
                    ? "Proceed to payment"
                    : "Choose payment method"}
              </Button>
            </>
          )}
          {effectiveStep === "payment" && (
            <Button
              variant="outline"
              onClick={() => setCurrentStep("review")}
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
