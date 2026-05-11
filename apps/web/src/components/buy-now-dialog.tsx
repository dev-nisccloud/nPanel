"use client";

import * as React from "react";
import { Link } from "react-router";
import {
  HelpCircle,
  Check,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Server,
  ShieldCheck,
  Trash2,
  Globe,
  BarChart3,
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { trpc, type RouterInputs } from "@/utils/trpc";
import type { UseMutationResult } from "@tanstack/react-query";
import { toast } from "@/components/ui/sonner";
import { useCartStore } from "@/stores/cart-store";

export interface ServicePlanDetails {
  planId: string;
  planName: string;
  planType: string; // e.g., "HOSTING"
  subType?: string; // e.g., "WEB_HOSTING", "EMAIL_HOSTING"
  price: number;
  currency: string;
  billingCycle: "MONTHLY" | "YEARLY" | "BIENNIALLY";
  /** Required for creating Nisc order from payment (product table flow). */
  productId?: string;
  hivelocity?: {
    productType: "DEDICATED_SERVERS" | "VPS" | "VDS";
    hivelocityProductId: number;
    locationName: string;
    baseMonthlyUsd: number;
    baseHourlyUsd: number;
  };
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
  /** If "add_to_cart", dialog stops at review and saves configured item to cart. */
  intent?: "buy_now" | "add_to_cart";
  /** Start non-Hivelocity flows directly on the payment step. */
  startAtPayment?: boolean;
  /** Team SEO Reports path for SEO onboarding (e.g. `/${slug}/seo-reports`). Shown when `plan.subType === "SEO"`. */
  seoReportsHref?: string;
}

type Step = "seo_connect" | "domain" | "hivelocity_config" | "review" | "payment" | "success" | "error";

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

function encodeNumber(n: unknown): number {
  const v = typeof n === "number" ? n : Number(n);
  return Number.isFinite(v) ? v : 0;
}

function StepPill({ active, done, label }: { active: boolean; done: boolean; label: string }) {
  return (
    <div
      className={[
        "flex items-center gap-2 rounded-full border px-3 py-1 text-xs",
        active ? "border-primary bg-primary/5 text-foreground" : done ? "border-emerald-500/40 bg-emerald-500/10 text-foreground" : "text-muted-foreground",
      ].join(" ")}
    >
      <span
        className={[
          "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold",
          active ? "bg-primary text-primary-foreground" : done ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground",
        ].join(" ")}
      >
        {done ? "✓" : "•"}
      </span>
      <span className="whitespace-nowrap">{label}</span>
    </div>
  );
}

export function BuyNowDialog({
  open,
  onOpenChange,
  plan,
  requireDomainStep = false,
  teamId,
  buyDomainHref,
  intent = "buy_now",
  startAtPayment = false,
  seoReportsHref,
}: BuyNowDialogProps) {
  const isHivelocityPlan = Boolean(plan?.hivelocity);
  const isSeoPlan = plan?.subType === "SEO";
  const showSeoConnectStep = Boolean(isSeoPlan);
  const showDomainStep = !!requireDomainStep && !!teamId && !showSeoConnectStep;
  const shouldStartAtPayment =
    startAtPayment && !showDomainStep && !isHivelocityPlan && !showSeoConnectStep && intent === "buy_now";
  const initialStep: Step = showSeoConnectStep
    ? "seo_connect"
    : showDomainStep
      ? "domain"
      : isHivelocityPlan
        ? "hivelocity_config"
        : shouldStartAtPayment
          ? "payment"
          : "review";

  const { addHivelocity } = useCartStore();

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

  // Hivelocity configuration step state
  const [hostname, setHostname] = React.useState("");
  const [selectedOsId, setSelectedOsId] = React.useState<string>("");
  const [selectedOptionIds, setSelectedOptionIds] = React.useState<string[]>([]);

  const hivelocityOsQuery = trpc.hivelocity.getProductOperatingSystems.useQuery(
    { productId: plan?.hivelocity?.hivelocityProductId ?? 0 },
    { enabled: open && isHivelocityPlan && !!plan?.hivelocity?.hivelocityProductId }
  );
  const hivelocityOptionsQuery = trpc.hivelocity.getProductOptions.useQuery(
    { productId: plan?.hivelocity?.hivelocityProductId ?? 0, groupBy: "upgrade" },
    { enabled: open && isHivelocityPlan && !!plan?.hivelocity?.hivelocityProductId }
  );

  const hivelocityPricing = trpc.hivelocityPricingSettings.get.useQuery(
    { productType: plan?.hivelocity?.productType ?? "DEDICATED_SERVERS" },
    { enabled: open && isHivelocityPlan }
  );
  const ratesQuery = trpc.currency.getExchangeRates.useQuery(
    { baseCurrency: "USD" },
    { enabled: open && isHivelocityPlan }
  );

  const hivelocityMarkupFlags = React.useMemo(() => {
    const s = hivelocityPricing.data?.success ? (hivelocityPricing.data.data as any) : null;
    return {
      base: Boolean(s?.marginType),
      os: Boolean(s?.osMarginType),
      addons: Boolean(s?.addonsMarginType),
    };
  }, [hivelocityPricing.data]);

  const usdToKesRate = React.useMemo(() => {
    const r = ratesQuery.data;
    if (!r?.success) return null;
    const rate = (r.data?.rates as Record<string, number> | undefined)?.KES;
    return typeof rate === "number" && Number.isFinite(rate) ? rate : null;
  }, [ratesQuery.data]);

  const formatUsdOrKes = React.useCallback(
    (usdAmount: number) => {
      if (plan?.currency === "KES" && usdToKesRate) return formatPrice(usdAmount * usdToKesRate, "KES");
      return formatPrice(usdAmount, "USD");
    },
    [plan?.currency, usdToKesRate],
  );

  const formatOriginalUsdAndKes = React.useCallback(
    (usdAmount: number) => {
      const usd = formatPrice(usdAmount, "USD");
      const kes = usdToKesRate ? formatPrice(usdAmount * usdToKesRate, "KES") : null;
      return { usd, kes };
    },
    [usdToKesRate],
  );

  const describeProvisioningFeature = React.useCallback((key: "sshKey" | "cloudInit" | "postInstall") => {
    switch (key) {
      case "sshKey":
        return "Allows SSH public keys to be injected during provisioning (recommended).";
      case "cloudInit":
        return "Supports Cloud-init configuration at first boot (automation-friendly).";
      case "postInstall":
        return "Supports running a post-install script after provisioning.";
    }
  }, []);

  const renderProvisioningFeatureBadges = React.useCallback(
    (features: any) => {
      const f = features ?? {};
      const items: Array<{ key: "sshKey" | "cloudInit" | "postInstall"; label: string }> = [
        { key: "sshKey", label: "SSH keys" },
        { key: "cloudInit", label: "Cloud-init" },
        { key: "postInstall", label: "Script" },
      ];
      const enabled = items.filter((it) => Boolean(f?.[it.key]));
      if (enabled.length === 0) return <Badge variant="outline" className="rounded-full">Basic</Badge>;
      return (
        <>
          {enabled.map((it) => (
            <Badge key={it.key} variant="secondary" className="rounded-full" title={describeProvisioningFeature(it.key)}>
              {it.label}
            </Badge>
          ))}
        </>
      );
    },
    [describeProvisioningFeature],
  );

  const applyMarginFor = React.useCallback(
    (bucket: "base" | "os" | "addons", priceUsd: number) => {
      const s = hivelocityPricing.data?.success ? (hivelocityPricing.data.data as any) : null;
      if (!s || !Number.isFinite(priceUsd)) return priceUsd;

      const prefix = bucket === "base" ? "" : bucket === "os" ? "os" : "addons";
      // For base: MarginType/PercentageMargin/FixedMargin/RoundOff map to marginType/percentageMargin/fixedMargin/roundOff
      const marginType = prefix ? (s[`${prefix}MarginType`] ?? null) : (s.marginType ?? null);
      const percentageMargin = prefix ? (s[`${prefix}PercentageMargin`] ?? null) : (s.percentageMargin ?? null);
      const fixedMargin = prefix ? (s[`${prefix}FixedMargin`] ?? null) : (s.fixedMargin ?? null);
      const roundOff = prefix ? (s[`${prefix}RoundOff`] ?? null) : (s.roundOff ?? null);

      let final = priceUsd;
      if (marginType === "PERCENTAGE" && percentageMargin) {
        const p = Number.parseFloat(percentageMargin);
        if (Number.isFinite(p)) final = priceUsd + (priceUsd * p) / 100;
      } else if (marginType === "FIXED" && fixedMargin) {
        const f = Number.parseFloat(fixedMargin);
        if (Number.isFinite(f)) final = priceUsd + f;
      }
      if (roundOff) {
        const ro = Number.parseFloat(roundOff);
        if (Number.isFinite(ro) && ro > 0) final = Math.ceil(final / ro) * ro;
      }
      return final;
    },
    [hivelocityPricing.data],
  );

  const selectedOs = React.useMemo(() => {
    const rows = hivelocityOsQuery.data?.success ? (hivelocityOsQuery.data.data as any[]) : [];
    return rows.find((os) => String(os.id) === selectedOsId) ?? null;
  }, [hivelocityOsQuery.data, selectedOsId]);

  const selectedOsFeatures = React.useMemo(() => {
    return (selectedOs?.operatingSystemFeatures ?? {}) as {
      sshKey?: boolean;
      postInstall?: boolean;
      cloudInit?: boolean;
    };
  }, [selectedOs]);

  const allProductOptions = React.useMemo(() => {
    const data = hivelocityOptionsQuery.data?.success ? (hivelocityOptionsQuery.data.data as Record<string, any[]>) : {};
    return Object.values(data || {}).flat();
  }, [hivelocityOptionsQuery.data]);

  const optionGroupById = React.useMemo(() => {
    const map = new Map<string, string>();
    const data = hivelocityOptionsQuery.data?.success ? (hivelocityOptionsQuery.data.data as Record<string, any[]>) : {};
    for (const [group, rows] of Object.entries(data || {})) {
      for (const r of rows ?? []) {
        const id = String((r as any)?.id ?? "");
        if (!id) continue;
        if (!map.has(id)) map.set(id, group);
      }
    }
    return map;
  }, [hivelocityOptionsQuery.data]);

  const selectedOptions = React.useMemo(() => {
    const data = hivelocityOptionsQuery.data?.success ? (hivelocityOptionsQuery.data.data as Record<string, any[]>) : {};
    const all = Object.values(data || {}).flat();
    return all.filter((opt: any) => selectedOptionIds.includes(String(opt.id)));
  }, [hivelocityOptionsQuery.data, selectedOptionIds]);

  const getAddonOsCompatibilityReason = React.useCallback(
    (addon: any, groupName?: string) => {
      if (!selectedOs) return null; // until OS is selected, don't guess compatibility here

      // Managed services: Windows detection based on OS name (no distro list).
      const g = String(groupName ?? "").trim().toLowerCase();
      if (g.includes("managed service")) {
        const osName = String(selectedOs?.name ?? "").toLowerCase();
        const isWindowsOs = osName.includes("windows");
        const addonName = String(addon?.name ?? "").toLowerCase();
        const isWindowsAddon = addonName.includes("windows");

        if (isWindowsOs && !isWindowsAddon) {
          return `Unavailable for ${selectedOs?.name ?? "Windows OS"}: only managed services with “Windows” in the name are supported.`;
        }
        if (!isWindowsOs && isWindowsAddon) {
          return `Unavailable for ${selectedOs?.name ?? "selected OS"}: Windows managed services require a Windows OS.`;
        }
      }

      const req = (addon?.operatingSystemFeatures ?? null) as
        | { sshKey?: boolean; postInstall?: boolean; cloudInit?: boolean }
        | null;
      if (!req) return null;

      const osF = selectedOsFeatures ?? {};
      const missing: string[] = [];

      if (req.sshKey === true && osF.sshKey !== true) missing.push("SSH keys");
      if (req.cloudInit === true && osF.cloudInit !== true) missing.push("Cloud-init");
      if (req.postInstall === true && osF.postInstall !== true) missing.push("Post-install scripts");

      if (!missing.length) return null;

      const osName = String(selectedOs?.name ?? "selected OS");
      return `Unavailable for ${osName}: requires ${missing.join(", ")} support.`;
    },
    [selectedOs, selectedOsFeatures],
  );

  const getGroupSelectionMode = React.useCallback((groupName: string, rows: any[]) => {
    const g = String(groupName ?? "").trim().toLowerCase();
    // Known mutually-exclusive categories (selecting one should unselect others).
    const singleGroups = [
      "data center",
      "datacenter",
      "location",
      "facility",
      "region",
      "control panel",
      "daily backup",
      "backup",
      "data migration",
      "migration",
      "chassis upgrade",
      "bandwidth",
      "ip address",
      "ip addresses",
    ];
    if (singleGroups.some((k) => g.includes(k))) {
      return "single" as const;
    }
    // Heuristic: if all options look like locations (common tags), force single-select.
    const locationTagHints = ["facility", "datacenter", "data_center", "location", "region"];
    const looksLikeLocation = rows.some((r) => {
      const tags: string[] = Array.isArray(r?.tags) ? r.tags : [];
      const t = tags.join(" ").toLowerCase();
      return locationTagHints.some((h) => t.includes(h));
    });
    if (looksLikeLocation) return "single" as const;
    return "multi" as const;
  }, []);

  // If OS changes, auto-remove any previously selected add-ons that became incompatible.
  React.useEffect(() => {
    if (!open || !isHivelocityPlan) return;
    if (!selectedOs) return;
    if (!selectedOptionIds.length) return;

    const incompatible = new Set<string>();
    for (const opt of allProductOptions) {
      const id = String(opt?.id ?? "");
      if (!id) continue;
      if (!selectedOptionIds.includes(id)) continue;
      const groupName = optionGroupById.get(id);
      const reason = getAddonOsCompatibilityReason(opt, groupName);
      if (reason) incompatible.add(id);
    }

    if (!incompatible.size) return;

    setSelectedOptionIds((prev) => prev.filter((id) => !incompatible.has(id)));
    toast.message("Some add-ons were removed", {
      description: "They’re not compatible with the selected operating system.",
    });
  }, [
    allProductOptions,
    getAddonOsCompatibilityReason,
    isHivelocityPlan,
    open,
    optionGroupById,
    selectedOs,
    selectedOptionIds.length,
    selectedOsId,
  ]);

  const hostnameValid = React.useMemo(() => {
    if (!hostname.trim()) return false;
    return /^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i.test(hostname.trim());
  }, [hostname]);

  const canProceedFromHivelocityConfig = Boolean(selectedOs) && hostnameValid;

  const [osSearch, setOsSearch] = React.useState("");
  const filteredOs = React.useMemo(() => {
    const rows = hivelocityOsQuery.data?.success ? (hivelocityOsQuery.data.data as any[]) : [];
    const q = osSearch.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((os) => String(os?.name ?? "").toLowerCase().includes(q));
  }, [hivelocityOsQuery.data, osSearch]);

  const osPriceUsd = encodeNumber(selectedOs?.monthlyPrice);
  const addonsPriceUsd = React.useMemo(() => selectedOptions.reduce((s, o) => s + encodeNumber(o?.monthlyPrice), 0), [selectedOptions]);
  const addonsCount = selectedOptions.length;
  const extrasUsd = osPriceUsd + addonsPriceUsd;
  const extrasMarginedUsd = React.useMemo(
    () => applyMarginFor("os", osPriceUsd) + applyMarginFor("addons", addonsPriceUsd),
    [applyMarginFor, osPriceUsd, addonsPriceUsd],
  );
  const extrasDisplay = React.useMemo(() => {
    if (!plan?.hivelocity) return 0;
    if (plan.currency === "KES" && usdToKesRate) return extrasMarginedUsd * usdToKesRate;
    return extrasMarginedUsd;
  }, [extrasMarginedUsd, plan?.hivelocity, plan?.currency, usdToKesRate]);

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
    const osMonthlyUsd = selectedOs?.monthlyPrice ? encodeNumber(selectedOs.monthlyPrice) : 0;
    const optionsMonthlyUsd = selectedOptions.reduce((sum, opt) => sum + encodeNumber(opt?.monthlyPrice), 0);
    const hivelocityExtrasDisplay = plan?.hivelocity
      ? (() => {
          const extrasMargined = applyMarginFor("os", osMonthlyUsd) + applyMarginFor("addons", optionsMonthlyUsd);
          if (plan.currency === "KES" && usdToKesRate) return extrasMargined * usdToKesRate;
          return extrasMargined;
        })()
      : 0;
    const effectiveBasePrice = basePrice + hivelocityExtrasDisplay;
    const taxes = effectiveBasePrice * 0.16; // 16% VAT
    const couponDiscount = 0; // TODO: Implement coupon validation
    const subtotal = effectiveBasePrice - couponDiscount;
    const total = subtotal + taxes;
    const displayCurrency = plan?.currency || "KES";
    
    return { basePrice: effectiveBasePrice, taxes, couponDiscount, subtotal, total, displayCurrency };
  }, [plan, selectedOs, selectedOptions, usdToKesRate, applyMarginFor]);

  // Reset state when dialog opens/closes
  React.useEffect(() => {
    if (open && plan) {
      const first: Step = showSeoConnectStep
        ? "seo_connect"
        : showDomainStep
          ? "domain"
          : plan.hivelocity
            ? "hivelocity_config"
            : shouldStartAtPayment
              ? "payment"
              : "review";
      setCurrentStep(first);
      setManualDomain("");
      setSelectedDomainId(null);
      setHostname("");
      setSelectedOsId("");
      setSelectedOptionIds([]);
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
  }, [open, plan, showDomainStep, shouldStartAtPayment, showSeoConnectStep]);

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

  // Create Nisc order from successful payment and enqueue for processing (customer team order)
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
    if (plan.hivelocity) return;
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

  React.useEffect(() => {
    if (currentStep !== "success" || !checkoutRequestId || !plan?.hivelocity) return;
    if (orderCreatedForCheckoutRef.current === checkoutRequestId) return;
    orderCreatedForCheckoutRef.current = checkoutRequestId;
    toast.success("Payment received. Order will be processed shortly.");
  }, [currentStep, checkoutRequestId, plan]);

  // Poll payment status ?? real-time only, no cache
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
    if (currentStep === "seo_connect") {
      setCurrentStep("review");
    } else if (currentStep === "domain") {
      setCurrentStep("review");
    } else if (currentStep === "hivelocity_config") {
      setCurrentStep("review");
    } else if (currentStep === "review") {
      if (intent === "add_to_cart" && plan?.hivelocity) {
        const currency = pricing.displayCurrency;
        const osDisplay = osPriceUsd > 0
          ? plan.currency === "KES" && usdToKesRate
            ? applyMarginFor("os", osPriceUsd) * usdToKesRate
            : applyMarginFor("os", osPriceUsd)
          : 0;

        addHivelocity({
          productType: plan.hivelocity.productType,
          planName: plan.planName,
          planType: plan.planType,
          billingCycle: plan.billingCycle,
          currency,
          basePrice: plan.price,
          hostname: hostname.trim(),
          locationName: plan.hivelocity.locationName,
          hivelocityProductId: plan.hivelocity.hivelocityProductId,
          os: selectedOs
            ? { id: String(selectedOs.id), name: String(selectedOs.name), price: osDisplay }
            : null,
          addons: selectedOptions.map((opt: any) => {
            const id = String(opt?.id ?? "");
            const priceUsd = encodeNumber(opt?.monthlyPrice);
            const display = priceUsd > 0
              ? plan.currency === "KES" && usdToKesRate
                ? applyMarginFor("addons", priceUsd) * usdToKesRate
                : applyMarginFor("addons", priceUsd)
              : 0;
            const group = optionGroupById.get(id);
            return { id, name: String(opt?.name ?? "Add-on"), price: display, group: group ?? undefined };
          }),
          totalPrice: pricing.basePrice,
        });
        toast.success("Added to cart");
        onOpenChange(false);
        return;
      }

      setCurrentStep("payment");
      setPaymentAmount(pricing.total.toString());
    }
  };

  const handleBack = () => {
    if (currentStep === "payment") {
      if (shouldStartAtPayment) {
        onOpenChange(false);
      } else {
        setCurrentStep("review");
      }
    } else if (currentStep === "review" && showSeoConnectStep) {
      setCurrentStep("seo_connect");
    } else if (currentStep === "review" && showDomainStep) {
      setCurrentStep("domain");
    } else if (currentStep === "review" && isHivelocityPlan) {
      setCurrentStep("hivelocity_config");
    }
  };

  if (!plan) {
    return null;
  }

  const renderStep = () => {
    switch (currentStep) {
      case "seo_connect":
        return (
          <div className="space-y-4">
            <div className="text-center py-2">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Connect Search Console &amp; GA4
              </h3>
              <p className="text-sm text-muted-foreground">
                After payment, you&apos;ll link properties in SEO Reports—no add-ons in this checkout.
              </p>
            </div>

            <ol className="list-decimal list-inside space-y-3 text-sm text-foreground">
              <li className="pl-1">
                <span className="font-medium">Pay for this plan</span> on the next screens (review, then M-Pesa).
              </li>
              <li className="pl-1">
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <Globe className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  Search Console
                </span>
                <p className="mt-1 text-muted-foreground pl-0 sm:pl-6">
                  Open SEO Reports → Search Console tab and create/link a subscription for each site you want
                  monitored.
                </p>
              </li>
              <li className="pl-1">
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <BarChart3 className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  Google Analytics 4
                </span>
                <p className="mt-1 text-muted-foreground pl-0 sm:pl-6">
                  Open SEO Reports → Google Analytics 4 tab and link each GA4 property you want reporting for.
                </p>
              </li>
            </ol>

            {seoReportsHref ? (
              <p className="text-sm text-muted-foreground rounded-lg border bg-muted/30 px-3 py-2">
                Tip: bookmark{" "}
                <Link to={seoReportsHref} className="font-medium text-primary hover:underline">
                  your team&apos;s SEO Reports
                </Link>{" "}
                for after checkout.
              </p>
            ) : null}
          </div>
        );

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

      case "hivelocity_config":
        const groupedOptions = hivelocityOptionsQuery.data?.success
          ? (hivelocityOptionsQuery.data.data as Record<string, any[]>)
          : {};
        const groupedOptionsWithoutOs = Object.fromEntries(
          Object.entries(groupedOptions).filter(([group]) => group.trim().toLowerCase() !== "operating system"),
        );
        return (
          <div className="space-y-4">
            <div className="rounded-xl border bg-muted/20 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Server className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold line-clamp-1">{plan.planName}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{plan.planType}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="outline" className="rounded-full">
                      Location: {plan.hivelocity?.locationName}
                    </Badge>
                    <Badge variant="destructive" className="rounded-full">
                      OS required
                    </Badge>
                    <Badge variant="outline" className="rounded-full">
                      Hostname required
                    </Badge>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-xs text-muted-foreground">Monthly price</p>
                  <p className="text-base font-semibold">{formatPrice(plan.price, plan.currency)}</p>
                  {extrasDisplay > 0 ? (
                    <p className="text-xs text-emerald-600 mt-1">+ {formatPrice(extrasDisplay, plan.currency)} extras</p>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1">No extras selected</p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">Operating system</p>
                    <p className="text-xs text-muted-foreground">Choose one to continue</p>
                  </div>
                  <div className="w-48">
                    <Input
                      placeholder="Search OS..."
                      value={osSearch}
                      onChange={(e) => setOsSearch(e.target.value)}
                    />
                  </div>
                </div>

                {hivelocityOsQuery.isLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <Spinner variant="ellipsis" size={36} className="text-primary" />
                  </div>
                ) : hivelocityOsQuery.isError ? (
                  <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm">
                    Failed to load operating systems.
                  </div>
                ) : (
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {filteredOs.map((os) => {
                      const id = String(os.id);
                      const active = id === selectedOsId;
                      const priceUsd = encodeNumber(os.monthlyPrice);
                      const displayUsd = applyMarginFor("os", priceUsd);
                      const features = os.operatingSystemFeatures ?? {};
                      const tags: string[] = Array.isArray((os as any)?.tags) ? ((os as any).tags as string[]) : [];
                      const showOriginal = hivelocityMarkupFlags.os && Math.abs(displayUsd - priceUsd) > 1e-9;
                      const original = formatOriginalUsdAndKes(priceUsd);
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setSelectedOsId(id)}
                          className={[
                            "text-left rounded-xl border p-3 transition",
                            active ? "border-primary bg-primary/5" : "hover:border-primary/40",
                          ].join(" ")}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold line-clamp-1">{os.name}</p>
                              <p className="text-sm font-semibold text-primary mt-1">
                                {priceUsd > 0 ? `${formatUsdOrKes(displayUsd)} /mo` : "Free"}
                              </p>
                              {priceUsd > 0 && showOriginal ? (
                                <div className="mt-1 text-[11px] text-emerald-600">
                                  <div>Original: {original.usd}</div>
                                  {original.kes ? <div>Original (KES): {original.kes}</div> : null}
                                </div>
                              ) : null}
                            </div>
                            {active ? (
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                                ✓
                              </div>
                            ) : (
                              <div className="h-6 w-6 rounded-full border bg-muted/40" />
                            )}
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2">
                            {renderProvisioningFeatureBadges(features)}
                          </div>

                          {tags.length ? (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {tags.slice(0, 6).map((t) => (
                                <Badge key={t} variant="outline" className="rounded-full">
                                  {t}
                                </Badge>
                              ))}
                              {tags.length > 6 ? (
                                <Badge variant="outline" className="rounded-full">
                                  +{tags.length - 6} more
                                </Badge>
                              ) : null}
                            </div>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="rounded-xl border p-4">
                <p className="text-sm font-semibold">Hostname</p>
                <p className="text-xs text-muted-foreground">A fully qualified domain name (FQDN)</p>
                <div className="mt-3 relative">
                  <Input
                    id="hivelocity-hostname"
                    type="text"
                    placeholder="e.g. server.example.com"
                    value={hostname}
                    onChange={(e) => setHostname(e.target.value)}
                    className={`pr-10 ${hostname.trim() ? (hostnameValid ? "border-green-500 focus-visible:ring-green-500" : "border-destructive focus-visible:ring-destructive") : ""}`}
                  />
                  {hostname.trim() ? (
                    hostnameValid ? (
                      <CheckCircle2 className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-green-600" aria-hidden />
                    ) : (
                      <XCircle className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-destructive" aria-hidden />
                    )
                  ) : null}
                </div>
                {!hostname.trim() ? (
                  <p className="text-xs text-muted-foreground mt-2">Required for provisioning.</p>
                ) : hostnameValid ? (
                  <p className="text-xs text-green-600 mt-2">Looks good.</p>
                ) : (
                  <p className="text-xs text-destructive mt-2">Enter a valid FQDN (e.g. server.example.com)</p>
                )}

                <p className="text-xs text-muted-foreground mt-3">
                  Need a domain for your hostname?{" "}
                  <Link
                    to={buyDomainHref ?? "/agency/domains"}
                    className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                  >
                    Buy a domain
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </p>
              </div>

              <div className="rounded-xl border p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">Add-ons (optional)</p>
                    <p className="text-xs text-muted-foreground">Select extras to reflect the true total</p>
                  </div>
                  <Badge variant="outline" className="rounded-full">{addonsCount} selected</Badge>
                </div>

                <div className="mt-3">
                  {Object.entries(groupedOptionsWithoutOs).length === 0 ? (
                    <div className="rounded-lg border bg-muted/20 p-3 text-xs text-muted-foreground">
                      {hivelocityOptionsQuery.isLoading ? "Loading options..." : "No add-ons available for this product."}
                    </div>
                  ) : (
                    <Accordion type="multiple" className="w-full">
                      {Object.entries(groupedOptionsWithoutOs).map(([group, rows]) => (
                        (() => {
                          const selectionMode = getGroupSelectionMode(group, rows as any[]);
                          const groupOptionIds = new Set((rows as any[]).map((r) => String(r?.id ?? "")).filter(Boolean));
                          const selectedInGroupCount = (rows as any[]).filter((r) => selectedOptionIds.includes(String(r.id))).length;
                          return (
                        <AccordionItem key={group} value={group} className="border rounded-lg mb-2">
                          <AccordionTrigger className="px-3 py-3 hover:no-underline">
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{group}</span>
                                {selectionMode === "single" ? (
                                  <Badge variant="secondary" className="rounded-full">Choose one</Badge>
                                ) : null}
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {selectionMode === "single"
                                  ? `${selectedInGroupCount}/1 selected`
                                  : `${selectedInGroupCount} selected`}
                              </span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-3 pb-3">
                            <div className="space-y-2">
                              {rows.map((opt: any) => {
                                const optionId = String(opt.id);
                                const checked = selectedOptionIds.includes(optionId);
                                const priceUsd = encodeNumber(opt.monthlyPrice);
                                const displayUsd = applyMarginFor("addons", priceUsd);
                                const tags: string[] = Array.isArray(opt?.tags) ? (opt.tags as string[]) : [];
                                const expressions: string[] = Array.isArray(opt?.expressions) ? (opt.expressions as string[]) : [];
                                const features = opt?.operatingSystemFeatures ?? null;
                                const showOriginal = hivelocityMarkupFlags.addons && Math.abs(displayUsd - priceUsd) > 1e-9;
                                const original = formatOriginalUsdAndKes(priceUsd);
                                const disabledReason = getAddonOsCompatibilityReason(opt, group);
                                const disabled = Boolean(disabledReason);
                                const optNameLower = String(opt?.name ?? "").toLowerCase();
                                const isManagedServices = String(group ?? "").toLowerCase().includes("managed service");
                                const isCpanelOrWhm = optNameLower.includes("cpanel") || optNameLower.includes("c-panel") || optNameLower.includes("whm");
                                return (
                                  <button
                                    key={optionId}
                                    type="button"
                                    onClick={() =>
                                      {
                                        if (disabled) {
                                          toast.error("Add-on unavailable", { description: disabledReason ?? "Not compatible with selected OS." });
                                          return;
                                        }
                                        setSelectedOptionIds((prev) => {
                                          if (selectionMode === "single") {
                                            // Unselect other options in this group, then toggle this one.
                                            const withoutGroup = prev.filter((id) => !groupOptionIds.has(id));
                                            return checked ? withoutGroup : [...withoutGroup, optionId];
                                          }
                                          if (isManagedServices && isCpanelOrWhm) {
                                            // Within Managed Services, cPanel/WHM options are mutually exclusive.
                                            const cpanelWhmIds = new Set(
                                              (rows as any[])
                                                .filter((r) => {
                                                  const n = String((r as any)?.name ?? "").toLowerCase();
                                                  return n.includes("cpanel") || n.includes("c-panel") || n.includes("whm");
                                                })
                                                .map((r) => String((r as any)?.id ?? ""))
                                                .filter(Boolean),
                                            );
                                            const withoutCpanelWhm = prev.filter((id) => !cpanelWhmIds.has(id));
                                            return checked ? withoutCpanelWhm : [...withoutCpanelWhm, optionId];
                                          }
                                          return prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId];
                                        });
                                      }
                                    }
                                    className={[
                                      "w-full flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left text-sm transition",
                                      disabled
                                        ? "opacity-50 cursor-not-allowed"
                                        : checked
                                          ? "border-primary bg-primary/5"
                                          : "hover:border-primary/40",
                                    ].join(" ")}
                                    disabled={disabled}
                                    title={disabledReason ?? undefined}
                                  >
                                    <span className="min-w-0">
                                      <span className="block font-medium line-clamp-1">{opt.name}</span>
                                      <span className="block text-sm font-semibold text-primary mt-1">
                                        {priceUsd > 0 ? `${formatUsdOrKes(displayUsd)} /mo` : "Free"}
                                      </span>
                                      {priceUsd > 0 && showOriginal ? (
                                        <span className="block mt-1 text-[11px] text-emerald-600">
                                          <span className="block">Original: {original.usd}</span>
                                          {original.kes ? <span className="block">Original (KES): {original.kes}</span> : null}
                                        </span>
                                      ) : null}

                                      {features ? (
                                        <span className="block mt-2">
                                          <span className="block text-[11px] uppercase tracking-wide text-muted-foreground">
                                            Provisioning features
                                          </span>
                                          <span className="mt-1 flex flex-wrap gap-2">
                                            {renderProvisioningFeatureBadges(features)}
                                          </span>
                                        </span>
                                      ) : null}

                                      {disabledReason ? (
                                        <span className="block mt-2 text-xs text-muted-foreground">
                                          {disabledReason}
                                        </span>
                                      ) : null}

                                      {tags.length || expressions.length ? (
                                        <span className="block mt-2">
                                          <span className="block text-[11px] uppercase tracking-wide text-muted-foreground">
                                            Tags & rules
                                          </span>
                                          <span className="mt-1 flex flex-wrap gap-2">
                                            {tags.slice(0, 6).map((t) => (
                                              <Badge key={`t:${t}`} variant="outline" className="rounded-full">
                                                {t}
                                              </Badge>
                                            ))}
                                            {expressions.slice(0, 3).map((e) => (
                                              <Badge key={`e:${e}`} variant="secondary" className="rounded-full" title={e}>
                                                Expr
                                              </Badge>
                                            ))}
                                            {tags.length > 6 ? (
                                              <Badge variant="outline" className="rounded-full">
                                                +{tags.length - 6} tags
                                              </Badge>
                                            ) : null}
                                            {expressions.length > 3 ? (
                                              <Badge variant="secondary" className="rounded-full">
                                                +{expressions.length - 3} expr
                                              </Badge>
                                            ) : null}
                                          </span>
                                        </span>
                                      ) : null}
                                    </span>
                                    <span className="flex items-center gap-2 shrink-0">
                                      {checked ? (
                                        <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                                          <ShieldCheck className="h-4 w-4" /> Added
                                        </span>
                                      ) : (
                                        <span className="text-xs text-muted-foreground">Add</span>
                                      )}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                          );
                        })()
                      ))}
                    </Accordion>
                  )}
                </div>
              </div>

              {!canProceedFromHivelocityConfig ? (
                <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm">
                  <p className="font-medium">Complete required fields</p>
                  <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                    <li>- Select an operating system</li>
                    <li>- Enter a valid hostname</li>
                  </ul>
                </div>
              ) : (
                <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm">
                  <p className="font-medium">Ready to review</p>
                  <p className="text-xs text-muted-foreground mt-1">Next you’ll confirm totals and pay securely via M-Pesa.</p>
                </div>
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
                <div className="rounded-xl border bg-muted/30 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="font-semibold text-foreground line-clamp-2 break-words">
                        {plan.planName}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {plan.planType}
                        {plan.subType && ` - ${plan.subType.replace(/_/g, ' ')}`}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground">Configured monthly</p>
                      <div className="font-semibold text-foreground">
                        {formatPrice(pricing.basePrice, pricing.displayCurrency)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    <div className="rounded-md border bg-background/70 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Billing cycle</p>
                      <p className="font-medium text-foreground mt-0.5">{plan.billingCycle}</p>
                    </div>
                    {plan.hivelocity ? (
                      <>
                        <div className="rounded-md border bg-background/70 px-3 py-2">
                          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Location</p>
                          <p className="font-medium text-foreground mt-0.5">{plan.hivelocity.locationName}</p>
                        </div>
                        <div className="rounded-md border bg-background/70 px-3 py-2 sm:col-span-2">
                          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Operating system</p>
                          <p className="font-medium text-foreground mt-0.5">{selectedOs?.name ?? "Not selected"}</p>
                        </div>
                        <div className="rounded-md border bg-background/70 px-3 py-2 sm:col-span-2">
                          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Hostname</p>
                          <p className="font-medium text-foreground mt-0.5 break-all">{hostname || "Not provided"}</p>
                        </div>
                        <div className="rounded-md border bg-background/70 px-3 py-2">
                          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Add-ons selected</p>
                          <p className="font-medium text-foreground mt-0.5">{addonsCount}</p>
                        </div>
                      </>
                    ) : null}
                  </div>
                </div>

                {plan.hivelocity ? (
                  <div className="rounded-xl border p-4">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Selected items</p>

                    <div className="mt-3 rounded-lg border bg-background/60">
                      <div className="flex items-center justify-between px-3 py-2 text-sm">
                        <span className="font-medium text-foreground">Base plan</span>
                        <span className="font-semibold text-foreground">{formatPrice(plan.price, plan.currency)}</span>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground">Add-ons</p>
                        <p className="text-xs text-muted-foreground">{selectedOptions.length + (selectedOs ? 1 : 0)} items</p>
                      </div>

                      <div className="mt-2 space-y-2">
                        {selectedOs ? (
                          <div className="flex items-start justify-between gap-3 rounded-lg border bg-muted/20 px-3 py-2">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground line-clamp-1">OS: {selectedOs.name}</p>
                              <p className="text-xs text-muted-foreground">Operating system license</p>
                            </div>
                            <div className="shrink-0 text-right">
                              <p className="text-sm font-semibold text-primary">
                                {osPriceUsd > 0 ? `${formatUsdOrKes(applyMarginFor("os", osPriceUsd))} /mo` : "Free"}
                              </p>
                            </div>
                          </div>
                        ) : null}

                        {selectedOptions.length ? (
                          selectedOptions.map((opt: any) => {
                            const id = String(opt?.id ?? "");
                            const priceUsd = encodeNumber(opt?.monthlyPrice);
                            const displayUsd = applyMarginFor("addons", priceUsd);
                            return (
                              <div key={id} className="flex items-start justify-between gap-3 rounded-lg border bg-muted/10 px-3 py-2">
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-foreground line-clamp-1">{opt?.name ?? "Add-on"}</p>
                                  <p className="text-xs text-muted-foreground">Add-on</p>
                                </div>
                                <div className="shrink-0 flex items-center gap-2">
                                  <p className="text-sm font-semibold text-primary">
                                    {priceUsd > 0 ? `${formatUsdOrKes(displayUsd)} /mo` : "Free"}
                                  </p>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                    onClick={() => setSelectedOptionIds((prev) => prev.filter((x) => x !== id))}
                                    aria-label={`Remove ${opt?.name ?? "add-on"}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="rounded-lg border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
                            No add-ons selected.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
              <ScrollBar orientation="vertical" />
            </ScrollArea>

            {/* Coupon Code */}
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Coupon code</div>
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
                  onClick={() => setCouponCode("")}
                  disabled={!couponCode.trim()}
                >
                  Clear
                </Button>
              </div>
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
                  {plan.hivelocity ? (
                    <>
                      Payment for <span className="font-semibold">{plan.planName}</span> has been received. We’ll start provisioning once this checkout is linked to the provisioning pipeline.
                    </>
                  ) : (
                    <>
                      Your service plan <span className="font-semibold">{plan.planName}</span> will be activated on your dashboard in a few minutes.
                    </>
                  )}
                </p>
                {plan.hivelocity ? (
                  <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-foreground">
                    Provisioning is not enabled yet for Dedicated/VPS/VDS. This is payment acknowledgement only.
                  </div>
                ) : null}
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
            {intent === "add_to_cart" ? "Add to cart" : "Buy"} {plan.planName}
          </DialogTitle>
          <DialogDescription className="min-w-0 w-full max-w-full">
            {currentStep === "seo_connect" &&
              "How you will connect Google Search Console and GA4 to nPanel after subscribing"}
            {currentStep === "domain" && "Choose or enter the domain to use with this plan"}
            {currentStep === "hivelocity_config" && "Select OS and required server details"}
            {currentStep === "review" &&
              (intent === "add_to_cart" ? "Review your configuration and add it to cart" : "Review your order and proceed to checkout")}
            {currentStep === "payment" && "Complete your payment"}
            {currentStep === "success" && "Order Confirmed"}
            {currentStep === "error" && "Payment Failed"}
          </DialogDescription>

          {showSeoConnectStep ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <StepPill
                active={currentStep === "seo_connect"}
                done={currentStep !== "seo_connect" && currentStep !== "error"}
                label="Connect"
              />
              <StepPill active={currentStep === "review"} done={currentStep === "payment" || currentStep === "success"} label="Review" />
              {intent !== "add_to_cart" ? (
                <StepPill active={currentStep === "payment"} done={currentStep === "success"} label="Pay" />
              ) : null}
            </div>
          ) : plan.hivelocity ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <StepPill active={currentStep === "hivelocity_config"} done={currentStep !== "hivelocity_config" && currentStep !== "error"} label="Configure" />
              <StepPill active={currentStep === "review"} done={currentStep === "payment" || currentStep === "success"} label="Review" />
              {intent !== "add_to_cart" ? (
                <StepPill active={currentStep === "payment"} done={currentStep === "success"} label="Pay" />
              ) : null}
            </div>
          ) : null}
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
          {currentStep === "seo_connect" && (
            <>
              <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-primary">
                Cancel
              </Button>
              <Button onClick={handleNext} className="bg-primary text-primary-foreground">
                Next: Review
              </Button>
            </>
          )}
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
          {currentStep === "hivelocity_config" && (
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
                disabled={!canProceedFromHivelocityConfig}
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
              {showSeoConnectStep && (
                <Button variant="outline" onClick={() => setCurrentStep("seo_connect")}>
                  Back
                </Button>
              )}
              {showDomainStep && (
                <Button variant="outline" onClick={() => setCurrentStep("domain")}>
                  Back
                </Button>
              )}
              {!showDomainStep && isHivelocityPlan && (
                <Button variant="outline" onClick={() => setCurrentStep("hivelocity_config")}>
                  Back
                </Button>
              )}
              <Button
                onClick={handleNext}
                className="bg-primary text-primary-foreground"
              >
                {intent === "add_to_cart" ? "Add to cart" : "Choose payment method"}
              </Button>
            </>
          )}
          {currentStep === "payment" && (
            <>
              {!shouldStartAtPayment && (
                <Button
                  variant="ghost"
                  onClick={handleBack}
                  className="text-primary"
                >
                  Back
                </Button>
              )}
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
