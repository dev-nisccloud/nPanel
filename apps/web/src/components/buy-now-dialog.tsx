"use client";

import * as React from "react";
import { Link } from "react-router";
import {
  HelpCircle,
  Check,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ShieldCheck,
  Trash2,
  Globe,
  BarChart3,
  User,
  Users,
  Receipt,
  CreditCard,
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { BuyNowDialogBodyScroll } from "@/components/buy-now-dialog-scroll";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
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
import { Badge } from "@/components/ui/badge";
import { trpc, type RouterInputs } from "@/utils/trpc";
import type { UseMutationResult } from "@tanstack/react-query";
import { toast } from "@/components/ui/sonner";
import { useCartStore } from "@/stores/cart-store";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import { useLocation } from "react-router";
import { ComboboxDropdown, type ComboboxItem } from "@npanel/ui/components/combobox-dropdown";
import { HivelocityInvoiceBreakdown } from "@/components/hivelocity-invoice-breakdown";
import {
	HivelocityOsSelectionTable,
	type HivelocityOsTableRow,
} from "@/components/hivelocity-os-selection-table";
import { HivelocityHostnameSection } from "@/components/hivelocity-hostname-section";
import {
	HivelocityConfigSectionHeading,
	HivelocityScrollForMoreHint,
	useIsElementVisibleInScrollArea,
} from "@/components/hivelocity-config-step-guide";
import {
  buildHivelocityInvoiceBreakdown,
  formatNextBillingDate,
  getAvailableHivelocityPeriods,
  getHivelocityPeriodLabel,
  getOptionUsdForBillingPeriod,
  getPeriodPriceSuffix,
  mapHivelocityPeriodToBillingCycle,
  type HivelocityPeriod,
} from "@/lib/hivelocity-checkout";
import {
  generateMpesaAccountReference,
  validateMpesaAccountReference,
} from "@/lib/mpesa-account-reference";
import {
  canonicalMpesaPaymentAmount,
  resolveMpesaCheckoutPayment,
} from "@/lib/mpesa-checkout-payment";
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
import {
  generateDefaultHivelocityHostname,
} from "@/lib/hivelocity-default-hostname";
import {
  collectHivelocityOptionTags,
  dedupeExclusiveGroupOptionIds,
  filterGroupedOptionsExcludingOs,
  filterGroupedOptionsForVpsVdsCheckout,
  getHivelocityAddonDisabledDetails,
  groupHasOptOutOption,
  isHivelocityOptionalSingleSelectGroup,
  isHivelocityOptionGroupMultiSelect,
  validateHivelocityOptionSelection,
} from "@/lib/hivelocity-option-compatibility";
import {
  HivelocityAddonNoSelectionRow,
  HivelocityAddonOptionRow,
} from "@/components/hivelocity-addon-option-row";
import { ceilConvertedPrice, computeCeilVatTotals, paymentTotalString } from "@npanel/api/lib/convert-price";
import { captureEvent } from "@/lib/posthog";

const CHECKOUT_TEAM_BILLING_FORM_ID = "checkout-team-billing-form";

export interface ServicePlanDetails {
  planId: string;
  planName: string;
  planType: string; // e.g., "HOSTING"
  subType?: string; // e.g., "WEB_HOSTING", "EMAIL_HOSTING"
  price: number;
  currency: string;
  billingCycle: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM";
  /** Required for creating Nisc order from payment (product table flow). */
  productId?: string;
  hivelocity?: {
    productType: "DEDICATED_SERVERS" | "VPS" | "VDS";
    hivelocityProductId: number;
    locationName: string;
    locationDisplayName?: string;
    baseMonthlyUsd: number;
    baseHourlyUsd: number;
    /** Display currency prices per billing term (margin + conversion applied). */
    pricesByPeriod?: Partial<Record<HivelocityPeriod, number>>;
    /** Raw USD prices per billing term (pre-margin). */
    baseUsdByPeriod?: Partial<Record<HivelocityPeriod, number>>;
    hourlyRateUsd?: number;
    hourlyRateDisplay?: number;
    disabledBillingPeriods?: string[];
    stock?: "available" | "limited" | "unavailable";
    /** In-place VPS scale-up from an existing instance (skips OS/hostname config). */
    upgrade?: {
      targetDeviceId: number;
      currentHostname: string;
      currentLocationName: string;
      currentOsName: string;
      currentMonthlyUsd: number;
      targetMonthlyUsd: number;
      upgradeDeltaUsd: number;
      targetPlanName: string;
      targetVcpu?: string;
      targetMemory?: string;
      targetDisk?: string;
      targetDisplayMonthlyPrice?: number;
    };
    /** In-place VPS OS reload with a paid OS license (skips OS/hostname config). */
    reload?: {
      targetDeviceId: number;
      currentHostname: string;
      currentLocationName: string;
      currentOsName: string;
      targetOsName: string;
      targetOsOptionId: number;
      osPriceUsd: number;
      hivelocityProductId: number;
      publicSshKeyIds?: number[];
    };
    /** Restore a suspended VPS after customer payment (no upstream details in checkout UI). */
    reactivate?: {
      targetDeviceId: number;
      subscriptionId: string;
      serviceLabel: string;
      reactivationAmount: number;
      reactivationCurrency: string;
    };
  };
}

interface BuyNowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: ServicePlanDetails | null;
  /** When true, show "Connect your domain" step before review (e.g. when opened from hosting/emails) */
  requireDomainStep?: boolean;
  /** Team route slug (customer portal) - used to load domain subscriptions for hostname + domain picker. */
  teamSlug?: string;
  /** Team ID fallback for domain subscriptions when teamSlug is unavailable. */
  teamId?: string;
  /** When set, show a "Need a domain? Buy one" CTA in the domain step (e.g. `/${teamSlug}/domains`) */
  buyDomainHref?: string;
  /**
   * When set with requireDomainStep, the domain step is a confirmation for this FQDN (e.g. opened from
   * domain portfolio) instead of the team domain picker. Still uses the same primaryDomain on the order.
   */
  portfolioDomainName?: string;
  /** If "add_to_cart", dialog stops at review and saves configured item to cart. */
  intent?: "buy_now" | "add_to_cart";
  /** Start non-Hivelocity flows directly on the payment step. */
  startAtPayment?: boolean;
  /** Team SEO Reports path for SEO onboarding (e.g. `/${slug}/seo-reports`). Shown when `plan.subType === "SEO"`. */
  seoReportsHref?: string;
  /**
   * Agency domains-portfolio hosting: after domain confirmation, show who this order is for
   * (your agency account, a client team, or a specific user) before review/payment.
   */
  agencyPortfolioCheckout?: boolean;
}

type Step =
  | "seo_connect"
  | "domain"
  | "agency_billing"
  | "hivelocity_config"
  | "review"
  | "team_billing"
  | "payment"
  | "success"
  | "error";

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
  teamSlug,
  teamId,
  buyDomainHref,
  intent = "buy_now",
  startAtPayment = false,
  seoReportsHref,
  portfolioDomainName,
  agencyPortfolioCheckout = false,
}: BuyNowDialogProps) {
  const isHivelocityPlan = Boolean(plan?.hivelocity);
  const isHivelocityUpgrade = Boolean(plan?.hivelocity?.upgrade);
  const isHivelocityReload = Boolean(plan?.hivelocity?.reload);
  const isHivelocityReactivate = Boolean(plan?.hivelocity?.reactivate);
  const isHivelocityInPlace = isHivelocityUpgrade || isHivelocityReload || isHivelocityReactivate;
  const isVpsOrVdsPlan =
    plan?.hivelocity?.productType === "VPS" || plan?.hivelocity?.productType === "VDS";
  const isSeoPlan = plan?.subType === "SEO";
  const showSeoConnectStep = Boolean(isSeoPlan);
  const portfolioDomainNormalized = React.useMemo(() => {
    const t = portfolioDomainName?.trim() ?? "";
    if (!t) return null;
    return isValidDomain(t) ? t.toLowerCase() : null;
  }, [portfolioDomainName]);
  const showDomainConfirmOnly = Boolean(
    requireDomainStep && (portfolioDomainName?.trim() ?? "") && !showSeoConnectStep,
  );
  const showDomainPicker = Boolean(
    requireDomainStep &&
      !(portfolioDomainName?.trim() ?? "") &&
      !showSeoConnectStep,
  );
  const showDomainStep = showDomainConfirmOnly || showDomainPicker;

  const location = useLocation();
  const resolvedTeamSlug = React.useMemo(
    () => teamSlug ?? getCustomerTeamSlugFromPathname(location.pathname),
    [teamSlug, location.pathname],
  );
  const { data: session } = authClient.useSession();
  const isAgencyUser = React.useMemo(() => {
    const user = session?.user as { role?: string; agencyRoleId?: string | null } | undefined;
    const role = String(user?.role ?? "");
    return role.toUpperCase().includes("AGENCY") || !!user?.agencyRoleId;
  }, [session?.user]);
  const isAgencySide = React.useMemo(() => {
    return location.pathname.startsWith("/agency") || isAgencyUser;
  }, [location.pathname, isAgencyUser]);

  const showAgencyBillingStep = isAgencySide;
  const stepBeforeAgencyBilling = React.useMemo((): Step | null => {
    if (showDomainStep) return "domain";
    if (showSeoConnectStep) return "seo_connect";
    if (isHivelocityPlan && !isHivelocityInPlace) return "hivelocity_config";
    return null;
  }, [showDomainStep, showSeoConnectStep, isHivelocityPlan, isHivelocityInPlace]);
  const shouldStartAtPayment =
    startAtPayment &&
    !showDomainStep &&
    !isHivelocityPlan &&
    !showSeoConnectStep &&
    intent === "buy_now" &&
    !showAgencyBillingStep;
  const initialStep: Step = showSeoConnectStep
    ? "seo_connect"
    : showDomainStep
      ? "domain"
      : isHivelocityPlan && !isHivelocityInPlace
        ? "hivelocity_config"
        : showAgencyBillingStep
          ? "agency_billing"
          : isHivelocityInPlace
            ? "review"
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

  // Same source as customer domains portfolio / Hivelocity hostname picker:
  // niscClientSubscription domain products  not the legacy `domain` table.
  const teamDomainsBySlugQuery = trpc.clientSubscriptions.listForTeamDomains.useQuery(
    { teamSlug: resolvedTeamSlug ?? "" },
    {
      enabled: !!resolvedTeamSlug && showDomainPicker && open,
      staleTime: 60_000,
    },
  );
  const teamDomainsByIdQuery = trpc.clientSubscriptions.getDomainSubscriptions.useQuery(
    { teamId: teamId! },
    {
      enabled: !resolvedTeamSlug && !!teamId && showDomainPicker && open,
      staleTime: 60_000,
    },
  );
  const teamDomains = React.useMemo(() => {
    if (resolvedTeamSlug) {
      return (teamDomainsBySlugQuery.data ?? [])
        .filter(
          (s) =>
            s.primaryDomain?.trim() &&
            s.status !== "CANCELLED" &&
            s.status !== "EXPIRED",
        )
        .map((s) => ({
          id: s.id,
          domainName: s.primaryDomain!.trim(),
        }));
    }
    return (teamDomainsByIdQuery.data ?? [])
      .filter((s) => s.primaryDomain?.trim())
      .map((s) => ({
        id: s.id,
        domainName: s.primaryDomain!.trim(),
      }));
  }, [resolvedTeamSlug, teamDomainsBySlugQuery.data, teamDomainsByIdQuery.data]);

  const manualDomainValid = manualDomain.trim() ? isValidDomain(manualDomain) : false;
  const selectedDomain = selectedDomainId
    ? teamDomains.find((d) => d.id === selectedDomainId)
    : null;
  const effectiveDomain =
    portfolioDomainNormalized ??
    selectedDomain?.domainName ??
    (manualDomainValid ? manualDomain.trim().toLowerCase() : null);
  const canProceedFromDomain = !!effectiveDomain;

  type AgencyLinkType = "self" | "team" | "user";
  const [agencyLinkType, setAgencyLinkType] = React.useState<AgencyLinkType>("self");
  const [selectedAgencyTeamId, setSelectedAgencyTeamId] = React.useState("");
  const [selectedAgencyUserId, setSelectedAgencyUserId] = React.useState("");

  /** Agency portfolio checkout: list all client teams (requires agency role - server enforces). */
  const { data: agencyTeams = [], isLoading: loadingAgencyTeams } = trpc.teams.getAll.useQuery(
    undefined,
    {
      enabled:
        open &&
        showAgencyBillingStep &&
        currentStep === "agency_billing" &&
        agencyLinkType === "team",
    },
  );
  const { data: agencyUsers = [], isLoading: loadingAgencyUsers } =
    trpc.creativeBriefs.listUsersForApprover.useQuery(undefined, {
      enabled: open && currentStep === "agency_billing" && agencyLinkType === "user",
    });

  const agencyTeamItems: ComboboxItem[] = React.useMemo(
    () => agencyTeams.map((t) => ({ id: t.id, label: t.name })),
    [agencyTeams],
  );
  const selectedAgencyTeamItem = agencyTeamItems.find((t) => t.id === selectedAgencyTeamId);
  const agencyUserItems: ComboboxItem[] = React.useMemo(
    () =>
      agencyUsers.map((u) => ({
        id: u.id,
        label: u.name ? `${u.name} (${u.email})` : u.email,
      })),
    [agencyUsers],
  );
  const selectedAgencyUserItem = agencyUserItems.find((u) => u.id === selectedAgencyUserId);

  const { data: checkoutTeamBySlug } = trpc.teams.getTeamIdBySlug.useQuery(
    { slug: resolvedTeamSlug ?? "" },
    {
      enabled: open && !!resolvedTeamSlug && !teamId && !showAgencyBillingStep,
    },
  );

  const resolvedCheckoutTeamId = React.useMemo(() => {
    if (showAgencyBillingStep) {
      if (agencyLinkType === "team") return selectedAgencyTeamId || undefined;
      return undefined;
    }
    return teamId ?? checkoutTeamBySlug?.id ?? undefined;
  }, [showAgencyBillingStep, agencyLinkType, selectedAgencyTeamId, teamId, checkoutTeamBySlug?.id]);

  const resolvedBilledForUserId = React.useMemo(() => {
    if (showAgencyBillingStep && agencyLinkType === "user") return selectedAgencyUserId || undefined;
    return undefined;
  }, [showAgencyBillingStep, agencyLinkType, selectedAgencyUserId]);

  const [purchaseAsBusiness, setPurchaseAsBusiness] = React.useState(false);
  const showPurchaseAsBusinessOption = !isAgencySide && !!resolvedCheckoutTeamId;
  const teamBillingQuery = trpc.teamBilling.getByTeam.useQuery(
    { teamId: resolvedCheckoutTeamId ?? "" },
    {
      enabled:
        open &&
        !!resolvedCheckoutTeamId &&
        !isAgencySide &&
        (purchaseAsBusiness || currentStep === "team_billing"),
    },
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

  const canProceedFromAgencyBilling =
    agencyLinkType === "self" ||
    (agencyLinkType === "team" && !!selectedAgencyTeamId) ||
    (agencyLinkType === "user" && !!selectedAgencyUserId);

  // Hivelocity configuration step state
  const [hostname, setHostname] = React.useState("");
  const [defaultHostname, setDefaultHostname] = React.useState("");
  const defaultHostnameRef = React.useRef("");
  const [selectedOsId, setSelectedOsId] = React.useState<string>("");
  const [selectedOptionIds, setSelectedOptionIds] = React.useState<string[]>([]);
  const [hivelocityPeriod, setHivelocityPeriod] = React.useState<HivelocityPeriod>("monthly");

  const availableHivelocityPeriods = React.useMemo(
    () => getAvailableHivelocityPeriods(plan?.hivelocity?.disabledBillingPeriods),
    [plan?.hivelocity?.disabledBillingPeriods],
  );

  React.useEffect(() => {
    if (!open || !isHivelocityPlan) return;
    if (!availableHivelocityPeriods.some((p) => p.value === hivelocityPeriod)) {
      setHivelocityPeriod(availableHivelocityPeriods[0]?.value ?? "monthly");
    }
  }, [open, isHivelocityPlan, availableHivelocityPeriods, hivelocityPeriod]);

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
      if (plan?.currency === "KES" && usdToKesRate) {
        return formatPrice(ceilConvertedPrice(usdAmount * usdToKesRate), "KES");
      }
      return formatPrice(usdAmount, "USD");
    },
    [plan?.currency, usdToKesRate],
  );

  const formatOriginalUsdAndKes = React.useCallback(
    (usdAmount: number) => {
      const usd = formatPrice(usdAmount, "USD");
      const kes = usdToKesRate
        ? formatPrice(ceilConvertedPrice(usdAmount * usdToKesRate), "KES")
        : null;
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

  const groupedProductOptions = React.useMemo(() => {
    return hivelocityOptionsQuery.data?.success
      ? (hivelocityOptionsQuery.data.data as Record<string, any[]>)
      : {};
  }, [hivelocityOptionsQuery.data]);

  const hivelocityDisplayGroupedOptions = React.useMemo(() => {
    const withoutOs = filterGroupedOptionsExcludingOs(groupedProductOptions);
    if (!isVpsOrVdsPlan) return withoutOs;
    return filterGroupedOptionsForVpsVdsCheckout(withoutOs);
  }, [groupedProductOptions, isVpsOrVdsPlan]);

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

  const getAddonDisabledDetails = React.useCallback(
    (addon: any, groupName?: string, includeInTagSet = false) => {
      const addonId = String(addon?.id ?? "");
      const otherSelected = includeInTagSet
        ? selectedOptions
        : selectedOptions.filter((o) => String(o?.id ?? "") !== addonId);
      const tagsForCheck = collectHivelocityOptionTags(selectedOs, otherSelected);
      return getHivelocityAddonDisabledDetails({
        addon,
        groupName,
        os: selectedOs,
        osFeatures: selectedOsFeatures,
        selectedTags: tagsForCheck,
      });
    },
    [selectedOptions, selectedOs, selectedOsFeatures],
  );

  const hivelocitySelectionValidation = React.useMemo(
    () =>
      validateHivelocityOptionSelection({
        os: selectedOs,
        allOptions: allProductOptions,
        selectedOptionIds,
        groupedOptions: groupedProductOptions,
        osFeatures: selectedOsFeatures,
      }),
    [allProductOptions, groupedProductOptions, selectedOptionIds, selectedOs, selectedOsFeatures],
  );

  const getGroupSelectionMode = React.useCallback((groupName: string, _rows?: any[]) => {
    return isHivelocityOptionGroupMultiSelect(groupName) ? ("multi" as const) : ("single" as const);
  }, []);

  // Dedupe legacy multi-select within the same upgrade category (e.g. Applications).
  React.useEffect(() => {
    if (!open || !isHivelocityPlan) return;
    if (!Object.keys(groupedProductOptions).length) return;
    if (!selectedOptionIds.length) return;

    setSelectedOptionIds((prev) => {
      const next = dedupeExclusiveGroupOptionIds(groupedProductOptions, prev);
      if (next.length === prev.length && next.every((id, i) => id === prev[i])) {
        return prev;
      }
      return next;
    });
  }, [groupedProductOptions, isHivelocityPlan, open, selectedOptionIds.length]);

  // VPS/VDS: drop selections from add-on groups we do not surface in the UI.
  React.useEffect(() => {
    if (!open || !isHivelocityPlan || !isVpsOrVdsPlan) return;
    if (!selectedOptionIds.length) return;

    const visibleIds = new Set(
      Object.values(hivelocityDisplayGroupedOptions)
        .flat()
        .map((opt: any) => String(opt?.id ?? ""))
        .filter(Boolean),
    );

    setSelectedOptionIds((prev) => {
      const next = prev.filter((id) => visibleIds.has(id));
      return next.length === prev.length ? prev : next;
    });
  }, [
    open,
    isHivelocityPlan,
    isVpsOrVdsPlan,
    hivelocityDisplayGroupedOptions,
    selectedOptionIds.length,
  ]);

  // If OS or tag set changes, auto-remove add-ons that became incompatible.
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
      const reason = getAddonDisabledDetails(opt, groupName, true);
      if (reason) incompatible.add(id);
    }

    if (!incompatible.size) return;

    setSelectedOptionIds((prev) => prev.filter((id) => !incompatible.has(id)));
    toast.message("Some add-ons were removed", {
      description: "They’re not compatible with your current OS and add-on selection.",
    });
  }, [
    allProductOptions,
    getAddonDisabledDetails,
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

  const canProceedFromHivelocityConfig =
    Boolean(selectedOs) &&
    hostnameValid &&
    hivelocitySelectionValidation.ok;

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

  const hivelocityBaseDisplayPrice = React.useMemo(() => {
    if (!plan?.hivelocity) return plan?.price ?? 0;
    return plan.hivelocity.pricesByPeriod?.[hivelocityPeriod] ?? plan.price;
  }, [plan, hivelocityPeriod]);

  const periodPriceSuffix = React.useMemo(
    () => getPeriodPriceSuffix(hivelocityPeriod),
    [hivelocityPeriod],
  );

  const convertOptionUsdToDisplay = React.useCallback(
    (monthlyPriceUsd: number, bucket: "os" | "addons") => {
      const periodUsd = getOptionUsdForBillingPeriod(monthlyPriceUsd, hivelocityPeriod);
      const margined = applyMarginFor(bucket, periodUsd);
      if (!Number.isFinite(margined) || margined <= 0) return 0;
      if (plan?.currency === "KES" && usdToKesRate) return ceilConvertedPrice(margined * usdToKesRate);
      return margined;
    },
    [hivelocityPeriod, applyMarginFor, plan?.currency, usdToKesRate],
  );

  const formatPeriodPrice = React.useCallback(
    (amount: number) => {
      if (!Number.isFinite(amount) || amount <= 0) return "Free";
      return `${formatPrice(amount, plan?.currency ?? "KES")}${periodPriceSuffix}`;
    },
    [plan?.currency, periodPriceSuffix],
  );

  const osTableRows = React.useMemo((): HivelocityOsTableRow[] => {
    return filteredOs.map((os) => {
      const id = String(os.id);
      const priceUsd = encodeNumber(os.monthlyPrice);
      const periodUsd = getOptionUsdForBillingPeriod(priceUsd, hivelocityPeriod);
      const displayAmount = convertOptionUsdToDisplay(priceUsd, "os");
      const original = formatOriginalUsdAndKes(periodUsd);
      const isFree = !Number.isFinite(displayAmount) || displayAmount <= 0;

      return {
        id,
        name: String(os.name ?? "Operating system"),
        displayPriceLabel: isFree ? "Free" : formatPeriodPrice(displayAmount),
        originalUsdLabel: priceUsd > 0 ? original.usd : null,
        originalKesLabel: priceUsd > 0 ? original.kes : null,
      };
    });
  }, [
    filteredOs,
    hivelocityPeriod,
    convertOptionUsdToDisplay,
    formatOriginalUsdAndKes,
    formatPeriodPrice,
  ]);

  // Payment state
  const [selectedPaymentMethod, setSelectedPaymentMethod] = React.useState<string | null>(null);
  const [mpesaPhoneNumber, setMpesaPhoneNumber] = React.useState("");
  const [paymentAmount, setPaymentAmount] = React.useState<string>("");
  const [accountReference, setAccountReference] = React.useState<string>("");
  /** Canonical checkout values - used for STK push when the payer is not agency. */
  const intendedPaymentAmountRef = React.useRef("");
  const intendedAccountReferenceRef = React.useRef("");
  
  // Validation errors
  const [accountRefError, setAccountRefError] = React.useState<string>("");
  const [phoneError, setPhoneError] = React.useState<string>("");
  const [amountError, setAmountError] = React.useState<string>("");
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
  const orderCreateInFlightRef = React.useRef<string | null>(null);
  const hivelocityCheckoutSnapshotRef = React.useRef<
    RouterInputs["niscServiceOrders"]["createFromPayment"]["items"][number] | null
  >(null);
  const dialogScrollContainerRef = React.useRef<HTMLDivElement>(null);
  const hivelocityHostnameSectionRef = React.useRef<HTMLDivElement>(null);

  const hivelocityHostnameSectionVisible = useIsElementVisibleInScrollArea(
    dialogScrollContainerRef,
    hivelocityHostnameSectionRef,
    open && currentStep === "hivelocity_config",
  );

  const scrollToHivelocityHostname = React.useCallback(() => {
    hivelocityHostnameSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handleHivelocityOsSelect = React.useCallback(
    (id: string) => {
      setSelectedOsId(id);
      window.requestAnimationFrame(() => {
        if (!hivelocityHostnameSectionRef.current) return;
        const container = dialogScrollContainerRef.current;
        const viewport =
          (container?.querySelector('[data-slot="scroll-area-viewport"]') as HTMLElement | null) ?? container;
        const target = hivelocityHostnameSectionRef.current;
        if (!viewport || !target) {
          target?.scrollIntoView({ behavior: "smooth", block: "start" });
          return;
        }
        const viewportRect = viewport.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();
        const isVisible = targetRect.top >= viewportRect.top && targetRect.top <= viewportRect.bottom - 48;
        if (!isVisible) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    },
    [],
  );

  // Calculate pricing using useMemo to ensure proper reactivity
  const hivelocityInvoiceBreakdown = React.useMemo(() => {
    if (!plan?.hivelocity) return null;

    if (plan.hivelocity.upgrade) {
      const u = plan.hivelocity.upgrade;
      const baseAmountExVat = plan.price;
      return buildHivelocityInvoiceBreakdown({
        serviceProductName: plan.planType,
        planIdentifier: u.targetPlanName,
        locationLabel: `${u.currentLocationName} · Device #${u.targetDeviceId} · Monthly increase`,
        baseAmountExVat,
        os: null,
        addons: [],
      });
    }

    if (plan.hivelocity.reload) {
      const r = plan.hivelocity.reload;
      return buildHivelocityInvoiceBreakdown({
        serviceProductName: plan.planType,
        planIdentifier: r.targetOsName,
        locationLabel: `${r.currentLocationName} · Device #${r.targetDeviceId} · OS license`,
        baseAmountExVat: 0,
        os: {
          id: r.targetOsOptionId,
          name: r.targetOsName,
          amountExVat: plan.price,
        },
        addons: [],
      });
    }

    if (plan.hivelocity.reactivate) {
      const r = plan.hivelocity.reactivate;
      return buildHivelocityInvoiceBreakdown({
        serviceProductName: plan.planType,
        planIdentifier: r.serviceLabel,
        locationLabel: "Restore suspended service access",
        baseAmountExVat: plan.price,
        os: null,
        addons: [],
      });
    }

    const osDisplay = selectedOs
      ? convertOptionUsdToDisplay(encodeNumber(selectedOs.monthlyPrice), "os")
      : 0;

    const addonLines = selectedOptions.map((opt: any) => {
      const id = String(opt?.id ?? "");
      const priceUsd = encodeNumber(opt?.monthlyPrice);
      const display = convertOptionUsdToDisplay(priceUsd, "addons");
      const group = optionGroupById.get(id);
      return {
        id,
        name: String(opt?.name ?? "Add-on"),
        group: group ?? undefined,
        amountExVat: display,
      };
    });

    return buildHivelocityInvoiceBreakdown({
      serviceProductName: plan.planType,
      planIdentifier: plan.planName,
      locationLabel: `${plan.hivelocity.locationDisplayName ?? plan.hivelocity.locationName} · ${getHivelocityPeriodLabel(hivelocityPeriod)}`,
      baseAmountExVat: hivelocityBaseDisplayPrice,
      os: selectedOs
        ? {
            id: selectedOs.id,
            name: String(selectedOs.name),
            amountExVat: osDisplay,
          }
        : null,
      addons: addonLines,
    });
  }, [
    plan,
    selectedOs,
    selectedOptions,
    hivelocityPeriod,
    hivelocityBaseDisplayPrice,
    convertOptionUsdToDisplay,
    optionGroupById,
  ]);

  const pricing = React.useMemo(() => {
    if (plan?.hivelocity && hivelocityInvoiceBreakdown) {
      const displayCurrency = plan.currency || "KES";
      return {
        basePrice: hivelocityInvoiceBreakdown.subtotalExVat,
        taxes: hivelocityInvoiceBreakdown.vatAmount,
        couponDiscount: 0,
        subtotal: hivelocityInvoiceBreakdown.subtotalExVat,
        total: hivelocityInvoiceBreakdown.totalIncVat,
        displayCurrency,
        invoiceBreakdown: hivelocityInvoiceBreakdown,
      };
    }

    const basePrice = plan?.price || 0;
    const { subtotalExVat, vatAmount, totalIncVat } = computeCeilVatTotals(basePrice);
    const displayCurrency = plan?.currency || "KES";

    return {
      basePrice,
      taxes: vatAmount,
      couponDiscount: 0,
      subtotal: subtotalExVat,
      total: totalIncVat,
      displayCurrency,
      invoiceBreakdown: null as ReturnType<typeof buildHivelocityInvoiceBreakdown> | null,
    };
  }, [plan, hivelocityInvoiceBreakdown]);

  const customerMpesaAmount = canonicalMpesaPaymentAmount(pricing.total);

  // Reset state when dialog opens/closes
  React.useEffect(() => {
    if (open && plan) {
      const first: Step = showSeoConnectStep
        ? "seo_connect"
        : showDomainStep
          ? "domain"
          : plan.hivelocity?.upgrade || plan.hivelocity?.reload
            ? showAgencyBillingStep
              ? "agency_billing"
              : "review"
            : plan.hivelocity
              ? "hivelocity_config"
              : showAgencyBillingStep
                ? "agency_billing"
                : shouldStartAtPayment
                  ? "payment"
                  : "review";
      setCurrentStep(first);
      setPurchaseAsBusiness(false);
      setManualDomain("");
      setSelectedDomainId(null);
      defaultHostnameRef.current = plan.hivelocity
        ? generateDefaultHivelocityHostname(plan.hivelocity.productType)
        : "";
      setDefaultHostname(defaultHostnameRef.current);
      setHostname(defaultHostnameRef.current);
      setSelectedOsId("");
      setSelectedOptionIds([]);
      setHivelocityPeriod("monthly");
      setCouponCode("");
      setShowCouponInput(false);
      setSelectedPaymentMethod(null);
      setMpesaPhoneNumber("");
      setPaymentAmount("");
      setAccountReference("");
      intendedPaymentAmountRef.current = "";
      intendedAccountReferenceRef.current = "";
      setAccountRefError("");
      setPhoneError("");
      setAmountError("");
      setManualTransactionReference("");
      setManualTransactionRefError("");
      setCheckoutRequestId(null);
      setPaymentError(null);
      setShouldStopPolling(false);
      pollingStartTimeRef.current = null;
      pollingAttemptsRef.current = 0;
      terminalStateDetectedRef.current = false;
      immediateStepRef.current = null;
      immediatePaymentErrorRef.current = null;
      orderCreatedForCheckoutRef.current = null;
      hivelocityCheckoutSnapshotRef.current = null;
      setAgencyLinkType("self");
      setSelectedAgencyTeamId("");
      setSelectedAgencyUserId("");

      const ref = generateMpesaAccountReference(plan.planName);
      intendedAccountReferenceRef.current = ref;
      setAccountReference(ref);
      setAccountRefError(validateMpesaAccountReference(ref));
    }
  }, [open, plan, showDomainStep, shouldStartAtPayment, showSeoConnectStep, showAgencyBillingStep]);

  // Keep M-Pesa amount aligned with checkout total (service + tax) on the payment step.
  const prevStepRef = React.useRef<Step | null>(null);
  React.useEffect(() => {
    if (!open || !plan) {
      prevStepRef.current = null;
      return;
    }
    const enteredPayment =
      currentStep === "payment" && prevStepRef.current !== "payment";
    const amountValue = customerMpesaAmount;
    if (currentStep === "payment") {
      if (isAgencyUser) {
        if (enteredPayment) {
          intendedPaymentAmountRef.current = amountValue;
          setPaymentAmount(amountValue);
        }
      } else {
        intendedPaymentAmountRef.current = amountValue;
        setPaymentAmount(amountValue);
      }
    }
    prevStepRef.current = currentStep;
  }, [open, plan, currentStep, customerMpesaAmount, isAgencyUser]);

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

  // Amount validation (agency only - customers pay the computed order total)
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isAgencyUser) return;
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

  const handleAccountReferenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isAgencyUser) return;
    const value = e.target.value.replace(/[^a-zA-Z0-9]/g, "").slice(0, 12);
    setAccountReference(value);
    setAccountRefError(validateMpesaAccountReference(value));
  };

  const userInfoQuery = trpc.userProfile.getUserInfo.useQuery(undefined, {
    enabled: open && currentStep === "payment",
    staleTime: 60_000,
  });

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
      captureEvent("mpesa_payment_failed");
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
      const pt = plan?.hivelocity?.productType;
      if (pt === "VPS") {
        captureEvent("vps_subscription_created", {
          plan: plan?.planName || plan?.hivelocity?.hivelocityProductId || "unknown",
          price: plan?.price ?? 0,
          currency: plan?.currency || "KES",
        });
      } else if (pt === "VDS") {
        captureEvent("vds_subscription_created", {
          plan: plan?.planName || plan?.hivelocity?.hivelocityProductId || "unknown",
          price: plan?.price ?? 0,
          currency: plan?.currency || "KES",
        });
      } else if (pt === "DEDICATED_SERVERS") {
        captureEvent("dedicated_server_subscription_created", {
          plan: plan?.planName || plan?.hivelocity?.hivelocityProductId || "unknown",
          price: plan?.price ?? 0,
          currency: plan?.currency || "KES",
        });
      }
      toast.success("Order submitted for processing.");
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    },
    onError: (err: { message?: string }) => {
      console.error("Create order from payment failed:", err);
      toast.error(err.message || "Order could not be created. Please contact support.");
    },
  }) as UseMutationResult<void, { message?: string }, CreateFromPaymentInput>;

  const recordManualPayment = trpc.paymentTransactions.recordManual.useMutation({
    onError: (err: { message?: string }) => {
      toast.error(err.message || "Could not record payment.");
    },
  });

  const buildHivelocityPaymentItem = React.useCallback((): CreateFromPaymentInput["items"][number] | null => {
    if (!plan?.hivelocity || !hivelocityInvoiceBreakdown) return null;

    if (plan.hivelocity.upgrade) {
      const u = plan.hivelocity.upgrade;
      return {
        productId: plan.productId,
        productPlanId: null,
        billingCycle: "MONTHLY",
        description: `VPS upgrade to ${u.targetPlanName} (device ${u.targetDeviceId})`,
        itemPrice: paymentTotalString(hivelocityInvoiceBreakdown.subtotalExVat),
        itemSubtotal: paymentTotalString(hivelocityInvoiceBreakdown.subtotalExVat),
        metadata: {
          operation: "vps_upgrade",
          hivelocityProductId: plan.hivelocity.hivelocityProductId,
          hivelocityTargetDeviceId: u.targetDeviceId,
          hivelocityCurrentProductId: undefined,
          upgradeDeltaUsd: u.upgradeDeltaUsd,
          hivelocityLocationName: u.currentLocationName,
          hivelocityOsName: u.currentOsName,
          hivelocityHostname: u.currentHostname,
          hivelocityPeriod: "monthly",
          hivelocityOptionIds: [],
          basePriceUsd: u.upgradeDeltaUsd,
          osPriceUsd: 0,
          addonsPriceUsd: 0,
          subtotalKes: ceilConvertedPrice(hivelocityInvoiceBreakdown.subtotalExVat),
          totalKes: ceilConvertedPrice(hivelocityInvoiceBreakdown.totalIncVat),
          usdToKesRate: usdToKesRate ?? undefined,
          invoiceLines: hivelocityInvoiceBreakdown.lines,
          productType: "VPS",
        },
      };
    }

    if (plan.hivelocity.reload) {
      const r = plan.hivelocity.reload;
      return {
        productId: plan.productId,
        productPlanId: null,
        billingCycle: "MONTHLY",
        description: `VPS OS reload to ${r.targetOsName} (device ${r.targetDeviceId})`,
        itemPrice: paymentTotalString(hivelocityInvoiceBreakdown.subtotalExVat),
        itemSubtotal: paymentTotalString(hivelocityInvoiceBreakdown.subtotalExVat),
        metadata: {
          operation: "vps_reload",
          hivelocityProductId: r.hivelocityProductId,
          hivelocityTargetDeviceId: r.targetDeviceId,
          hivelocityLocationName: r.currentLocationName,
          hivelocityOsName: r.targetOsName,
          hivelocityOsOptionId: r.targetOsOptionId,
          hivelocityHostname: r.currentHostname,
          hivelocityPeriod: "monthly",
          hivelocityOptionIds: [],
          hivelocityPublicSshKeyIds: r.publicSshKeyIds,
          basePriceUsd: 0,
          osPriceUsd: r.osPriceUsd,
          addonsPriceUsd: 0,
          subtotalKes: ceilConvertedPrice(hivelocityInvoiceBreakdown.subtotalExVat),
          totalKes: ceilConvertedPrice(hivelocityInvoiceBreakdown.totalIncVat),
          usdToKesRate: usdToKesRate ?? undefined,
          invoiceLines: hivelocityInvoiceBreakdown.lines,
          productType: "VPS",
        },
      };
    }

    if (plan.hivelocity.reactivate) {
      const r = plan.hivelocity.reactivate;
      return {
        productId: plan.productId,
        productPlanId: null,
        billingCycle: plan.billingCycle,
        description: `Restore ${r.serviceLabel}`,
        itemPrice: paymentTotalString(hivelocityInvoiceBreakdown.subtotalExVat),
        itemSubtotal: paymentTotalString(hivelocityInvoiceBreakdown.subtotalExVat),
        metadata: {
          operation: "vps_reactivate",
          niscSubscriptionId: r.subscriptionId,
          hivelocityProductId: plan.hivelocity!.hivelocityProductId,
          hivelocityTargetDeviceId: r.targetDeviceId,
          hivelocityLocationName: "Reactivation",
          hivelocityOsName: "Reactivation",
          hivelocityHostname: "reactivation.local",
          hivelocityPeriod: "monthly",
          hivelocityOptionIds: [],
          basePriceUsd: r.reactivationAmount,
          osPriceUsd: 0,
          addonsPriceUsd: 0,
          subtotalKes: ceilConvertedPrice(hivelocityInvoiceBreakdown.subtotalExVat),
          totalKes: ceilConvertedPrice(hivelocityInvoiceBreakdown.totalIncVat),
          usdToKesRate: usdToKesRate ?? undefined,
          invoiceLines: hivelocityInvoiceBreakdown.lines,
          productType: "VPS",
        },
      };
    }

    if (!selectedOs) return null;

    const osPriceUsd = getOptionUsdForBillingPeriod(
      encodeNumber(selectedOs.monthlyPrice),
      hivelocityPeriod,
    );
    const addonsPriceUsd = selectedOptions.reduce(
      (s, o) => s + getOptionUsdForBillingPeriod(encodeNumber(o?.monthlyPrice), hivelocityPeriod),
      0,
    );

    return {
      productId: plan.productId,
      productPlanId: null,
      billingCycle: mapHivelocityPeriodToBillingCycle(hivelocityPeriod),
      description: `${plan.planName} @ ${plan.hivelocity.locationDisplayName ?? plan.hivelocity.locationName}`,
      itemPrice: paymentTotalString(hivelocityInvoiceBreakdown.subtotalExVat),
      itemSubtotal: paymentTotalString(hivelocityInvoiceBreakdown.subtotalExVat),
      metadata: {
        hivelocityProductId: Number(plan.hivelocity.hivelocityProductId),
        hivelocityLocationName: plan.hivelocity.locationName,
        hivelocityOsName: String(selectedOs.name),
        hivelocityOsOptionId: Number(selectedOs.id),
        hivelocityHostname: hostname.trim(),
        hivelocityPeriod,
        hivelocityOptionIds: selectedOptions
          .map((o: { id?: unknown }) => Number(o?.id))
          .filter((n) => Number.isFinite(n)),
        basePriceUsd:
          plan.hivelocity.baseUsdByPeriod?.[hivelocityPeriod] ?? plan.hivelocity.baseMonthlyUsd,
        osPriceUsd,
        addonsPriceUsd,
        subtotalKes: ceilConvertedPrice(hivelocityInvoiceBreakdown.subtotalExVat),
        totalKes: ceilConvertedPrice(hivelocityInvoiceBreakdown.totalIncVat),
        usdToKesRate: usdToKesRate ?? undefined,
        invoiceLines: hivelocityInvoiceBreakdown.lines,
        productType: plan.hivelocity.productType,
      },
    };
  }, [
    plan,
    hivelocityInvoiceBreakdown,
    selectedOs,
    hivelocityPeriod,
    selectedOptions,
    hostname,
    usdToKesRate,
  ]);

  const openPaymentStep = React.useCallback(() => {
    setCurrentStep("payment");
    const amountValue = customerMpesaAmount;
    intendedPaymentAmountRef.current = amountValue;
    setPaymentAmount(amountValue);
    if (plan) {
      hivelocityCheckoutSnapshotRef.current = buildHivelocityPaymentItem();
      const ref = generateMpesaAccountReference(plan.planName);
      intendedAccountReferenceRef.current = ref;
      setAccountReference(ref);
      setAccountRefError(validateMpesaAccountReference(ref));
    }
  }, [customerMpesaAmount, plan, buildHivelocityPaymentItem]);

  const handleTeamBillingSaved = React.useCallback(async () => {
    const result = await teamBillingQuery.refetch();
    if (isTeamBillingComplete(result.data)) {
      openPaymentStep();
    }
  }, [teamBillingQuery, openPaymentStep]);

  // When payment step reaches success and we have plan+team+domain, create order and send to processing (once per checkout)
  React.useEffect(() => {
    if (currentStep !== "success" || !checkoutRequestId || !plan?.productId) return;
    if (plan.hivelocity) {
      if (!hivelocityCheckoutSnapshotRef.current) return;
    } else if (showDomainStep && !effectiveDomain) {
      return;
    }
    if (orderCreatedForCheckoutRef.current === checkoutRequestId) return;
    if (orderCreateInFlightRef.current === checkoutRequestId) return;

    orderCreateInFlightRef.current = checkoutRequestId;

    const markOrderCreateFinished = () => {
      if (orderCreateInFlightRef.current === checkoutRequestId) {
        orderCreateInFlightRef.current = null;
      }
    };

    const hivelocityItem = hivelocityCheckoutSnapshotRef.current;
    if (plan.hivelocity && hivelocityItem) {
      createOrderFromPayment.mutate(
        {
          checkoutRequestId,
          ...(resolvedCheckoutTeamId ? { teamId: resolvedCheckoutTeamId } : {}),
          ...(resolvedBilledForUserId ? { billedForUserId: resolvedBilledForUserId } : {}),
          currency: plan.currency ?? "KES",
          items: [hivelocityItem],
        },
        {
          onSuccess: () => {
            orderCreatedForCheckoutRef.current = checkoutRequestId;
            markOrderCreateFinished();
          },
          onError: () => {
            markOrderCreateFinished();
          },
        },
      );
      return;
    }

    // Order lines stay ex-VAT; createFromPayment / provisioning add ceil VAT for agreedPrice + totals.
    const exVatStr = paymentTotalString(pricing.subtotal);
    createOrderFromPayment.mutate(
      {
        checkoutRequestId,
        ...(resolvedCheckoutTeamId ? { teamId: resolvedCheckoutTeamId } : {}),
        ...(resolvedBilledForUserId ? { billedForUserId: resolvedBilledForUserId } : {}),
        currency: plan.currency ?? "KES",
        items: [
          {
            productId: plan.productId,
            productPlanId: plan.planId,
            billingCycle: plan.billingCycle,
            primaryDomain: showDomainStep ? effectiveDomain ?? undefined : undefined,
            itemPrice: exVatStr,
            itemSubtotal: exVatStr,
            description: plan.planName,
          },
        ],
      },
      {
        onSuccess: () => {
          orderCreatedForCheckoutRef.current = checkoutRequestId;
          markOrderCreateFinished();
        },
        onError: () => {
          markOrderCreateFinished();
        },
      },
    );
  }, [
    currentStep,
    checkoutRequestId,
    plan,
    resolvedCheckoutTeamId,
    resolvedBilledForUserId,
    showDomainStep,
    effectiveDomain,
    createOrderFromPayment,
    isAgencyUser,
    accountReference,
    pricing.total,
  ]);

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
              captureEvent("mpesa_payment_completed", { amount: typeof amount !== "undefined" ? amount : 0 });
              setCurrentStep("success");
            } else {
              const errorMessage = getUserFriendlyError(numericResultCode, response.data.resultDesc);
              captureEvent("mpesa_payment_failed", { error_code: String(numericResultCode) });
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
    const resolved = resolveMpesaCheckoutPayment({
      isAgencyUser,
      formAmount: paymentAmount,
      formAccountReference: accountReference,
      checkoutTotalIncVat: pricing.total,
      intendedAccountReference: intendedAccountReferenceRef.current,
    });

    if (!mpesaPhoneNumber || !resolved.amountString || !resolved.accountReference) {
      toast.error("Please fill in all required fields");
      return;
    }

    const refErr = validateMpesaAccountReference(resolved.accountReference);
    if (refErr) {
      setAccountRefError(refErr);
      toast.error("Please fix the errors before proceeding");
      return;
    }

    if (phoneError) {
      toast.error("Please fix the errors before proceeding");
      return;
    }

    const amount = resolved.amount;
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
    captureEvent("mpesa_payment_initiated", { amount: amount, phone_length: (typeof formattedPhone !== "undefined" ? formattedPhone : mpesaPhoneNumber).replace(/\D/g, "").length });
    initiateMpesaPayment.mutate({
      phoneNumber: formattedPhone,
      amount: amount,
      accountReference: resolved.accountReference,
      transactionDesc,
      ...(resolvedCheckoutTeamId && { teamId: resolvedCheckoutTeamId }),
    });
  };

  const initiateJengaPayment = trpc.paymentGateway.jenga.initiateCardPayment.useMutation({
    onError: (error) => {
      setJengaRedirecting(false);
      toast.error(error.message || "Failed to start card payment");
    },
  });

  const handleJengaPayment = () => {
    if (!plan?.productId) {
      toast.error("Plan details are missing");
      return;
    }

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

    const hivelocityItem = hivelocityCheckoutSnapshotRef.current;
    const exVatStr = paymentTotalString(pricing.subtotal);
    const items =
      plan.hivelocity && hivelocityItem
        ? [hivelocityItem]
        : [
            {
              productId: plan.productId,
              productPlanId: plan.planId,
              billingCycle: plan.billingCycle,
              primaryDomain: showDomainStep ? effectiveDomain ?? undefined : undefined,
              itemPrice: exVatStr,
              itemSubtotal: exVatStr,
              description: plan.planName,
            },
          ];

    setJengaRedirecting(true);
    captureEvent("jenga_payment_initiated", { amount });
    initiateJengaPayment.mutate(
      {
        amount,
        currency: (plan.currency as "KES" | "USD" | "EUR" | "GBP" | "TZS" | "UGX") || "KES",
        productType: "Service",
        productDescription: (plan.planName || "Service").slice(0, 200),
        ...jengaCustomer,
        ...(resolvedCheckoutTeamId ? { teamId: resolvedCheckoutTeamId } : {}),
        orderIntent: {
          source: "buy_now",
          returnPath: "/payment/card/return",
          returnOrigin: window.location.origin,
          items,
          currency: plan.currency ?? "KES",
          teamId: resolvedCheckoutTeamId,
          billedForUserId: resolvedBilledForUserId,
        },
      },
      {
        onSuccess: (response) => {
          const data = response.data;
          if (!data?.checkoutUrl || !data.paymentData) {
            setJengaRedirecting(false);
            toast.error("Failed to start card checkout");
            return;
          }
          submitJengaPaymentForm(data.checkoutUrl, data.paymentData);
        },
      },
    );
  };

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
      checkoutTotalIncVat: pricing.total,
      intendedAccountReference: intendedAccountReferenceRef.current,
    });
    const amount = resolved.amount;
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter a valid payment amount.");
      return;
    }

    const transactionDesc = (`Purchase: ${plan?.planName || "Service Plan"}`).slice(0, 200);

    try {
      const result = await recordManualPayment.mutateAsync({
        transactionReference: ref,
        amount,
        currency: plan?.currency ?? "KES",
        gateway:
          selectedPaymentMethod === "card"
            ? "JENGA"
            : selectedPaymentMethod === "mpesa"
              ? "MPESA"
              : "OTHER",
        accountReference: resolved.accountReference || undefined,
        transactionDesc,
        ...(resolvedCheckoutTeamId ? { teamId: resolvedCheckoutTeamId } : {}),
      });
      setCheckoutRequestId(result.checkoutRequestId);
      terminalStateDetectedRef.current = true;
      setShouldStopPolling(true);
      setPaymentError(null);
      immediateStepRef.current = "success";
      immediatePaymentErrorRef.current = null;
      setCurrentStep("success");
      toast.success("Payment recorded and order submitted.");
    } catch {
      // onError toast
    }
  };

  const handleNext = () => {
    if (currentStep === "seo_connect") {
      setCurrentStep(showAgencyBillingStep ? "agency_billing" : "review");
    } else if (currentStep === "domain") {
      setCurrentStep(showAgencyBillingStep ? "agency_billing" : "review");
    } else if (currentStep === "agency_billing") {
      setCurrentStep("review");
    } else if (currentStep === "hivelocity_config") {
      if (!hivelocitySelectionValidation.ok) {
        toast.error("Incompatible add-ons selected", {
          description: hivelocitySelectionValidation.reasons[0],
        });
        return;
      }
      setCurrentStep(showAgencyBillingStep ? "agency_billing" : "review");
    } else if (currentStep === "review") {
      if (intent === "add_to_cart" && plan?.hivelocity && hivelocityInvoiceBreakdown) {
        const currency = pricing.displayCurrency;
        const osPriceUsd = encodeNumber(selectedOs?.monthlyPrice);
        const addonsPriceUsd = selectedOptions.reduce(
          (s, o) => s + encodeNumber(o?.monthlyPrice),
          0,
        );

        addHivelocity({
          productType: plan.hivelocity.productType,
          niscProductId: plan.productId,
          planName: plan.planName,
          planType: plan.planType,
          billingCycle: mapHivelocityPeriodToBillingCycle(hivelocityPeriod),
          hivelocityPeriod,
          currency,
          basePrice: hivelocityBaseDisplayPrice,
          hostname: hostname.trim(),
          locationName: plan.hivelocity.locationName,
          locationDisplayName: plan.hivelocity.locationDisplayName ?? plan.hivelocity.locationName,
          hivelocityProductId: plan.hivelocity.hivelocityProductId,
          os: selectedOs
            ? {
                id: String(selectedOs.id),
                name: String(selectedOs.name),
                price:
                  hivelocityInvoiceBreakdown.lines.find((l) => l.kind === "os")?.amountExVat ?? 0,
                priceUsd: getOptionUsdForBillingPeriod(osPriceUsd, hivelocityPeriod),
              }
            : null,
          addons: selectedOptions.map((opt: any) => {
            const id = String(opt?.id ?? "");
            const priceUsd = encodeNumber(opt?.monthlyPrice);
            const line = hivelocityInvoiceBreakdown.lines.find((l) => l.id === `addon-${id}`);
            const group = optionGroupById.get(id);
            return {
              id,
              name: String(opt?.name ?? "Add-on"),
              price: line?.amountExVat ?? 0,
              group: group ?? undefined,
              priceUsd: getOptionUsdForBillingPeriod(priceUsd, hivelocityPeriod),
            };
          }),
          invoiceLines: hivelocityInvoiceBreakdown.lines,
          subtotalExVat: hivelocityInvoiceBreakdown.subtotalExVat,
          vatAmount: hivelocityInvoiceBreakdown.vatAmount,
          totalPrice: hivelocityInvoiceBreakdown.subtotalExVat,
          selectedOptionIds: selectedOptions
            .map((o: any) => Number(o?.id))
            .filter((n) => Number.isFinite(n)),
          basePriceUsdMonthly: plan.hivelocity.baseUsdByPeriod?.[hivelocityPeriod] ?? plan.hivelocity.baseMonthlyUsd,
          osPriceUsdMonthly: osPriceUsd,
          addonsPriceUsdMonthly: addonsPriceUsd,
        });
        toast.success("Added to cart");
        onOpenChange(false);
        return;
      }

      if (purchaseAsBusiness && resolvedCheckoutTeamId) {
        if (teamBillingQuery.isLoading || teamBillingQuery.isFetching) {
          toast.message("Checking company billing details…");
          return;
        }
        if (needsCheckoutTeamBillingStep(purchaseAsBusiness, teamBilling)) {
          setCurrentStep("team_billing");
          return;
        }
      }

      openPaymentStep();
    }
  };

  const handleBack = () => {
    if (currentStep === "payment") {
      if (shouldStartAtPayment) {
        onOpenChange(false);
      } else {
        setCurrentStep("review");
      }
    } else if (currentStep === "team_billing") {
      setCurrentStep("review");
    } else if (currentStep === "review") {
      if (showAgencyBillingStep) {
        setCurrentStep("agency_billing");
      } else if (showSeoConnectStep) {
        setCurrentStep("seo_connect");
      } else if (showDomainStep) {
        setCurrentStep("domain");
      } else if (isHivelocityPlan) {
        setCurrentStep("hivelocity_config");
      }
    } else if (currentStep === "agency_billing") {
      if (stepBeforeAgencyBilling) {
        setCurrentStep(stepBeforeAgencyBilling);
      } else {
        onOpenChange(false);
      }
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
                After payment, you&apos;ll link properties in SEO Reports-no add-ons in this checkout.
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
        if (showDomainConfirmOnly) {
          const rawPortfolio = portfolioDomainName?.trim() ?? "";
          return (
            <div className="space-y-4">
              <div className="text-center py-2">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Confirm domain for this purchase
                </h3>
                <p className="text-sm text-muted-foreground">
                  You are purchasing this hosting plan for the domain you are viewing in your portfolio.
                  Confirm to continue to review and payment.
                </p>
              </div>

              <div className="rounded-lg border bg-muted/30 px-4 py-6 text-center">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Domain
                </p>
                <p className="mt-2 text-xl font-semibold font-mono text-foreground break-all">
                  {rawPortfolio || "-"}
                </p>
              </div>

              {!portfolioDomainNormalized && rawPortfolio ? (
                <p className="text-sm text-destructive text-center">
                  This value is not a valid domain name (expected format like example.com).
                </p>
              ) : null}

              {buyDomainHref ? (
                <p className="text-sm text-muted-foreground text-center">
                  Need a different domain?{" "}
                  <Link
                    to={buyDomainHref}
                    className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                  >
                    Browse or buy domains
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </p>
              ) : null}
            </div>
          );
        }

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
              {!!(resolvedTeamSlug || teamId) && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="domain-select">Domains owned by your organization</Label>
                    <Select
                      value={selectedDomainId ?? ""}
                      onValueChange={(v) => {
                        setSelectedDomainId(v || null);
                        setManualDomain("");
                      }}
                    >
                      <SelectTrigger id="domain-select" className="w-full">
                        <SelectValue placeholder="Select a domain from your organization" />
                      </SelectTrigger>
                      <SelectContent>
                        {teamDomains.map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.domainName}
                          </SelectItem>
                        ))}
                        {teamDomains.length === 0 ? (
                          <SelectItem value="__none__" disabled>
                            No domains in your portfolio
                          </SelectItem>
                        ) : null}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="relative flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="shrink-0">or</span>
                    <span className="h-px flex-1 bg-border" />
                  </div>
                </>
              )}

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
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <HivelocityConfigSectionHeading
                step={1}
                title="Operating system"
                description="Choose one option from the list below."
                required
              />
              <HivelocityOsSelectionTable
                searchQuery={osSearch}
                onSearchChange={setOsSearch}
                rows={osTableRows}
                selectedId={selectedOsId}
                onSelect={handleHivelocityOsSelect}
                isLoading={hivelocityOsQuery.isLoading}
                isError={hivelocityOsQuery.isError}
                priceColumnHint={periodPriceSuffix.trim() || undefined}
                showOriginalPriceColumns={isAgencyUser}
              />
            </div>

            <HivelocityScrollForMoreHint
              visible={!hivelocityHostnameSectionVisible}
              onScrollToNext={scrollToHivelocityHostname}
            />

            <div ref={hivelocityHostnameSectionRef} className="space-y-2 scroll-mt-4">
              <HivelocityConfigSectionHeading
                step={2}
                title="Hostname"
                description="Set the server FQDN used during provisioning."
                required
              />
              <HivelocityHostnameSection
                enabled={open && currentStep === "hivelocity_config"}
                hostname={hostname}
                onHostnameChange={setHostname}
                defaultHostname={defaultHostname}
                isAgencySide={isAgencySide}
                teamSlug={teamSlug}
                teamId={teamId}
                buyDomainHref={buyDomainHref}
              />
            </div>

            <div className="space-y-2 scroll-mt-4">
              <HivelocityConfigSectionHeading
                step={3}
                title="Add-ons"
                description="Optional extras - review these before continuing."
              />
              <div className="rounded-xl border p-4">
                <div className="flex items-center justify-end gap-3">
                  <Badge variant="outline" className="rounded-full">{addonsCount} selected</Badge>
                </div>

                <div className="mt-3">
                  {Object.entries(hivelocityDisplayGroupedOptions).length === 0 ? (
                    <div className="rounded-lg border bg-muted/20 p-3 text-xs text-muted-foreground">
                      {hivelocityOptionsQuery.isLoading ? "Loading options..." : "No add-ons available for this product."}
                    </div>
                  ) : (
                    <Accordion type="multiple" className="w-full">
                      {Object.entries(hivelocityDisplayGroupedOptions).map(([group, rows]) => (
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
                              {selectionMode === "single" &&
                              isHivelocityOptionalSingleSelectGroup(group) &&
                              !groupHasOptOutOption(rows as any[]) ? (
                                <HivelocityAddonNoSelectionRow
                                  checked={selectedInGroupCount === 0}
                                  onSelect={() =>
                                    setSelectedOptionIds((prev) =>
                                      prev.filter((id) => !groupOptionIds.has(id)),
                                    )
                                  }
                                  label="No selection"
                                  description={`Skip ${group} - nothing from this category will be added.`}
                                />
                              ) : null}
                              {(rows as any[]).map((opt: any) => {
                                const optionId = String(opt.id);
                                const checked = selectedOptionIds.includes(optionId);
                                const priceUsd = encodeNumber(opt.monthlyPrice);
                                const periodUsd = getOptionUsdForBillingPeriod(priceUsd, hivelocityPeriod);
                                const displayAmount = convertOptionUsdToDisplay(priceUsd, "addons");
                                const marginedPeriodUsd = applyMarginFor("addons", periodUsd);
                                const tags: string[] = Array.isArray(opt?.tags) ? (opt.tags as string[]) : [];
                                const expressions: string[] = Array.isArray(opt?.expressions)
                                  ? (opt.expressions as string[])
                                  : [];
                                const features = opt?.operatingSystemFeatures ?? null;
                                const showOriginal =
                                  hivelocityMarkupFlags.addons &&
                                  Math.abs(marginedPeriodUsd - periodUsd) > 1e-9;
                                const original = formatOriginalUsdAndKes(periodUsd);
                                const disabledDetails = checked
                                  ? null
                                  : getAddonDisabledDetails(opt, group);
                                const disabled = Boolean(disabledDetails);
                                const optNameLower = String(opt?.name ?? "").toLowerCase();
                                const isManagedServices = String(group ?? "")
                                  .toLowerCase()
                                  .includes("managed service");
                                const isCpanelOrWhm =
                                  optNameLower.includes("cpanel") ||
                                  optNameLower.includes("c-panel") ||
                                  optNameLower.includes("whm");

                                const handleToggle = () => {
                                  if (disabled) {
                                    toast.error("Add-on unavailable", {
                                      description: disabledDetails?.fix ?? disabledDetails?.reason,
                                    });
                                    return;
                                  }
                                  setSelectedOptionIds((prev) => {
                                    if (selectionMode === "single") {
                                      const withoutGroup = prev.filter((id) => !groupOptionIds.has(id));
                                      return checked ? withoutGroup : [...withoutGroup, optionId];
                                    }
                                    if (isManagedServices && isCpanelOrWhm) {
                                      const cpanelWhmIds = new Set(
                                        (rows as any[])
                                          .filter((r) => {
                                            const n = String((r as any)?.name ?? "").toLowerCase();
                                            return (
                                              n.includes("cpanel") ||
                                              n.includes("c-panel") ||
                                              n.includes("whm")
                                            );
                                          })
                                          .map((r) => String((r as any)?.id ?? ""))
                                          .filter(Boolean),
                                      );
                                      const withoutCpanelWhm = prev.filter((id) => !cpanelWhmIds.has(id));
                                      return checked ? withoutCpanelWhm : [...withoutCpanelWhm, optionId];
                                    }
                                    return prev.includes(optionId)
                                      ? prev.filter((id) => id !== optionId)
                                      : [...prev, optionId];
                                  });
                                };

                                return (
                                  <HivelocityAddonOptionRow
                                    key={optionId}
                                    name={String(opt.name ?? optionId)}
                                    checked={checked}
                                    disabled={disabled}
                                    disabledDetails={disabledDetails}
                                    displayPriceLabel={formatPeriodPrice(displayAmount)}
                                    originalUsdLabel={priceUsd > 0 && showOriginal ? original.usd : null}
                                    originalKesLabel={priceUsd > 0 && showOriginal ? original.kes : null}
                                    showOriginal={priceUsd > 0 && showOriginal}
                                    features={features}
                                    tags={tags}
                                    expressions={expressions}
                                    renderFeatureBadges={renderProvisioningFeatureBadges}
                                    onSelect={handleToggle}
                                  />
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
            </div>

            {!canProceedFromHivelocityConfig ? (
                <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm">
                  <p className="font-medium">Complete required fields</p>
                  <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                    {!selectedOs ? <li>- Select an operating system</li> : null}
                    {!hostnameValid ? <li>- Enter a valid hostname</li> : null}
                    {!hivelocitySelectionValidation.ok
                      ? hivelocitySelectionValidation.reasons.map((reason) => (
                          <li key={reason}>- {reason}</li>
                        ))
                      : null}
                  </ul>
                </div>
              ) : (
                <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm">
                  <p className="font-medium">Ready to review</p>
                  <p className="text-xs text-muted-foreground mt-1">Next you’ll confirm totals and pay securely via M-Pesa.</p>
                </div>
              )}
          </div>
        );

      case "agency_billing":
        return (
          <div className="space-y-6 py-2">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-foreground">Who is this hosting for?</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Choose whether this order is for your agency, a client organization, or a specific user. This sets
                how the subscription is linked after payment.
              </p>
            </div>

            <div className="grid gap-3">
              <button
                type="button"
                className={cn(
                  "relative flex cursor-pointer rounded-lg border bg-card p-4 text-left shadow-sm transition-all hover:border-primary/50",
                  agencyLinkType === "self" ? "border-primary ring-1 ring-primary" : "border-border",
                )}
                onClick={() => setAgencyLinkType("self")}
              >
                <div className="flex w-full items-start gap-3">
                  <div
                    className={cn(
                      "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                      agencyLinkType === "self" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                    )}
                  >
                    <User className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground">My agency account</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Bill as the agency; hosting is provisioned under your account context.
                    </p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                className={cn(
                  "relative flex cursor-pointer rounded-lg border bg-card p-4 text-left shadow-sm transition-all hover:border-primary/50",
                  agencyLinkType === "team" ? "border-primary ring-1 ring-primary" : "border-border",
                )}
                onClick={() => setAgencyLinkType("team")}
              >
                <div className="flex w-full items-start gap-3">
                  <div
                    className={cn(
                      "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                      agencyLinkType === "team" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                    )}
                  >
                    <Users className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-3">
                    <div>
                      <p className="font-semibold text-foreground">A client organization</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Link this hosting to an organization you manage (same as domain subscription linking).
                      </p>
                    </div>
                    {agencyLinkType === "team" ? (
                      loadingAgencyTeams ? (
                        <div className="flex h-10 items-center justify-center rounded-md border">
                          <Spinner size={18} />
                        </div>
                      ) : (
                        <ComboboxDropdown
                          items={agencyTeamItems}
                          selectedItem={selectedAgencyTeamItem}
                          onSelect={(item) => setSelectedAgencyTeamId(item.id)}
                          placeholder="Select an organization..."
                          searchPlaceholder="Search organizations..."
                          emptyResults="No organizations found"
                        />
                      )
                    ) : null}
                  </div>
                </div>
              </button>

              <button
                type="button"
                className={cn(
                  "relative flex cursor-pointer rounded-lg border bg-card p-4 text-left shadow-sm transition-all hover:border-primary/50",
                  agencyLinkType === "user" ? "border-primary ring-1 ring-primary" : "border-border",
                )}
                onClick={() => setAgencyLinkType("user")}
              >
                <div className="flex w-full items-start gap-3">
                  <div
                    className={cn(
                      "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                      agencyLinkType === "user" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                    )}
                  >
                    <User className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-3">
                    <div>
                      <p className="font-semibold text-foreground">A specific user</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Assign the subscription to an individual user (end customer).
                      </p>
                    </div>
                    {agencyLinkType === "user" ? (
                      loadingAgencyUsers ? (
                        <div className="flex h-10 items-center justify-center rounded-md border">
                          <Spinner size={18} />
                        </div>
                      ) : (
                        <ComboboxDropdown
                          items={agencyUserItems}
                          selectedItem={selectedAgencyUserItem}
                          onSelect={(item) => setSelectedAgencyUserId(item.id)}
                          placeholder="Select a user..."
                          searchPlaceholder="Search users..."
                          emptyResults="No users found"
                        />
                      )
                    ) : null}
                  </div>
                </div>
              </button>
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

            <ScrollArea className="h-[300px] w-full" thumbClassName="bg-primary">
              <div className="space-y-4 pr-4">
                {plan.hivelocity ? (
                  <>
                    {plan.hivelocity.upgrade ? (
                      <div className="rounded-md border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-900/10 px-3 py-3 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                        <p className="font-semibold">Before checkout</p>
                        <p>
                          The VPS must be powered off before the upgrade runs. Shut it down from the overview tab and wait until status is off, then complete payment.
                        </p>
                        <p>Your data is preserved during the upgrade. Downgrades are not supported.</p>
                      </div>
                    ) : null}
                    {plan.hivelocity.reload ? (
                      <div className="rounded-md border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/10 px-3 py-3 text-xs text-red-900 dark:text-red-200 space-y-1">
                        <p className="font-semibold">Before checkout</p>
                        <p>
                          The VPS must be powered off before the reload runs. Shut it down from the overview tab and wait until status is off, then complete payment.
                        </p>
                        <p>All data on the primary disk will be permanently deleted when the reload starts.</p>
                      </div>
                    ) : null}
                    {plan.hivelocity.reactivate ? (
                      <div className="rounded-md border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-900/10 px-3 py-3 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                        <p className="font-semibold">Service restoration</p>
                        <p>
                          Pay the recurring charge below to restore access. Your service will be reactivated automatically after payment is confirmed.
                        </p>
                      </div>
                    ) : null}
                    <div className="rounded-xl border bg-muted/30 p-4">
                      <div className="font-semibold text-foreground line-clamp-2 break-words">{plan.planName}</div>
                      <div className="text-sm text-muted-foreground mt-1">{plan.planType}</div>
                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        {plan.hivelocity.reactivate ? (
                          <>
                            <div className="rounded-md border bg-background/70 px-3 py-2 sm:col-span-2">
                              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Service</p>
                              <p className="font-medium text-foreground mt-0.5">
                                {plan.hivelocity.reactivate.serviceLabel}
                              </p>
                            </div>
                            <div className="rounded-md border bg-background/70 px-3 py-2 sm:col-span-2">
                              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Recurring charge</p>
                              <p className="font-medium text-foreground mt-0.5">
                                {formatPrice(plan.price, plan.currency)}
                              </p>
                            </div>
                          </>
                        ) : plan.hivelocity.reload ? (
                          <>
                            <div className="rounded-md border bg-background/70 px-3 py-2">
                              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Device</p>
                              <p className="font-medium text-foreground mt-0.5">#{plan.hivelocity.reload.targetDeviceId}</p>
                            </div>
                            <div className="rounded-md border bg-background/70 px-3 py-2">
                              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Location</p>
                              <p className="font-medium text-foreground mt-0.5">{plan.hivelocity.reload.currentLocationName}</p>
                            </div>
                            <div className="rounded-md border bg-background/70 px-3 py-2 sm:col-span-2">
                              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Target operating system</p>
                              <p className="font-medium text-foreground mt-0.5">{plan.hivelocity.reload.targetOsName}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Replacing {plan.hivelocity.reload.currentOsName}
                              </p>
                            </div>
                            <div className="rounded-md border bg-background/70 px-3 py-2 sm:col-span-2">
                              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Hostname</p>
                              <p className="font-medium text-foreground mt-0.5 break-all">{plan.hivelocity.reload.currentHostname}</p>
                            </div>
                            <div className="rounded-md border bg-background/70 px-3 py-2 sm:col-span-2">
                              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">OS license</p>
                              <p className="font-medium text-foreground mt-0.5">
                                {formatPrice(plan.price, plan.currency)}/mo
                              </p>
                            </div>
                          </>
                        ) : plan.hivelocity.upgrade ? (
                          <>
                            <div className="rounded-md border bg-background/70 px-3 py-2">
                              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Device</p>
                              <p className="font-medium text-foreground mt-0.5">#{plan.hivelocity.upgrade.targetDeviceId}</p>
                            </div>
                            <div className="rounded-md border bg-background/70 px-3 py-2">
                              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Location</p>
                              <p className="font-medium text-foreground mt-0.5">{plan.hivelocity.upgrade.currentLocationName}</p>
                            </div>
                            <div className="rounded-md border bg-background/70 px-3 py-2 sm:col-span-2">
                              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Target plan</p>
                              <p className="font-medium text-foreground mt-0.5">{plan.hivelocity.upgrade.targetPlanName}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {[
                                  plan.hivelocity.upgrade.targetVcpu && `${plan.hivelocity.upgrade.targetVcpu} vCPU`,
                                  plan.hivelocity.upgrade.targetMemory && `${plan.hivelocity.upgrade.targetMemory} RAM`,
                                  plan.hivelocity.upgrade.targetDisk && `${plan.hivelocity.upgrade.targetDisk} disk`,
                                ]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </p>
                            </div>
                            <div className="rounded-md border bg-background/70 px-3 py-2 sm:col-span-2">
                              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Hostname</p>
                              <p className="font-medium text-foreground mt-0.5 break-all">{plan.hivelocity.upgrade.currentHostname}</p>
                            </div>
                            <div className="rounded-md border bg-background/70 px-3 py-2 sm:col-span-2">
                              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Pricing</p>
                              <p className="font-medium text-foreground mt-0.5">
                                Monthly increase: {formatPrice(plan.price, plan.currency)}/mo
                              </p>
                              {plan.hivelocity.upgrade.targetDisplayMonthlyPrice != null ? (
                                <p className="text-xs text-muted-foreground mt-1">
                                  New plan total after upgrade:{" "}
                                  {formatPrice(plan.hivelocity.upgrade.targetDisplayMonthlyPrice, plan.currency)}/mo
                                </p>
                              ) : null}
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="rounded-md border bg-background/70 px-3 py-2">
                              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Billing period</p>
                              <p className="font-medium text-foreground mt-0.5">{getHivelocityPeriodLabel(hivelocityPeriod)}</p>
                            </div>
                            <div className="rounded-md border bg-background/70 px-3 py-2">
                              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Location</p>
                              <p className="font-medium text-foreground mt-0.5">
                                {plan.hivelocity.locationDisplayName ?? plan.hivelocity.locationName}
                              </p>
                            </div>
                            <div className="rounded-md border bg-background/70 px-3 py-2 sm:col-span-2">
                              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Operating system</p>
                              <p className="font-medium text-foreground mt-0.5">{selectedOs?.name ?? "Not selected"}</p>
                            </div>
                            <div className="rounded-md border bg-background/70 px-3 py-2 sm:col-span-2">
                              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Hostname</p>
                              <p className="font-medium text-foreground mt-0.5 break-all">{hostname || "Not provided"}</p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {!plan.productId ? (
                      <div className="rounded-md border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-900/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-200">
                        Service product is not linked yet. An active nPanel product for this server type is required before checkout can complete.
                      </div>
                    ) : null}

                    {pricing.invoiceBreakdown ? (
                      <HivelocityInvoiceBreakdown
                        breakdown={pricing.invoiceBreakdown}
                        currency={pricing.displayCurrency}
                        formatPrice={formatPrice}
                        title="Invoice line items"
                      />
                    ) : null}
                  </>
                ) : (
                  <div className="rounded-xl border bg-muted/30 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="font-semibold text-foreground line-clamp-2 break-words">
                          {plan.planName}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {plan.planType}
                          {plan.subType && ` - ${plan.subType.replace(/_/g, " ")}`}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-muted-foreground">Price</p>
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
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {showPurchaseAsBusinessOption ? (
              <PurchaseAsBusinessOption
                value={purchaseAsBusiness}
                onChange={setPurchaseAsBusiness}
              />
            ) : null}

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

            {/* Taxes & Fees - non-Hivelocity only (Hivelocity totals are in invoice breakdown) */}
            {!plan.hivelocity ? (
              <>
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

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>{formatPrice(pricing.total, pricing.displayCurrency)}</span>
                  </div>
                </div>
              </>
            ) : null}

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

      case "team_billing":
        if (!resolvedCheckoutTeamId) return null;
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Company billing details</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Add your company billing information so we can invoice this order correctly.
              </p>
            </div>
            <CheckoutTeamBillingForm
              teamId={resolvedCheckoutTeamId}
              formId={CHECKOUT_TEAM_BILLING_FORM_ID}
              isLoading={teamBillingQuery.isLoading}
              initialData={teamBillingInitialData}
              onSaved={() => void handleTeamBillingSaved()}
            />
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
                          <MpesaPaymentFields
                            currency={pricing.displayCurrency}
                            canEditPaymentDetails={isAgencyUser}
                            phoneNumber={mpesaPhoneNumber}
                            onPhoneNumberChange={handlePhoneNumberChange}
                            phoneError={phoneError || undefined}
                            amount={isAgencyUser ? paymentAmount : customerMpesaAmount}
                            onAmountChange={handleAmountChange}
                            amountError={amountError || undefined}
                            amountHelperText={
                              isAgencyUser
                                ? `Order total: ${formatPrice(pricing.total, pricing.displayCurrency)} (editable)`
                                : `Order total: ${formatPrice(pricing.total, pricing.displayCurrency)}`
                            }
                            accountReference={accountReference}
                            onAccountReferenceChange={handleAccountReferenceChange}
                            accountRefError={accountRefError || undefined}
                            accountRefHelperText={
                              accountRefError
                                ? undefined
                                : `Auto-generated (${accountReference.length}/12)`
                            }
                            idPrefix="buy-mpesa"
                          />

                          <div className="flex justify-end pt-1">
                            <MpesaPayButton
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
                              className="disabled:opacity-50"
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
                    <div className="flex flex-col items-center justify-center py-8">
                      <Spinner variant="ellipsis" size={48} className="mb-4 text-primary" />
                      <p className="text-sm font-medium text-foreground mb-2">
                        Redirecting to secure card payment…
                      </p>
                      <p className="text-xs text-muted-foreground text-center">
                        You will enter your card details on a secure payment page.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4 pt-2">
                      <JengaCardPaymentFields
                        value={jengaCustomer}
                        onChange={setJengaCustomer}
                        errors={jengaCustomerErrors}
                        idPrefix="buy-jenga"
                      />
                      <div className="flex justify-end pt-1">
                        <Button
                          onClick={handleJengaPayment}
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
                            <label htmlFor="manual-transaction-ref" className="text-sm font-medium text-foreground">
                              Transaction reference <span className="text-destructive">*</span>
                            </label>
                            <Input
                              id="manual-transaction-ref"
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
                            currency={pricing.displayCurrency}
                            canEditPaymentDetails={isAgencyUser}
                            phoneNumber=""
                            onPhoneNumberChange={() => {}}
                            amount={isAgencyUser ? paymentAmount : customerMpesaAmount}
                            onAmountChange={handleAmountChange}
                            amountError={amountError || undefined}
                            amountHelperText={`Order total: ${formatPrice(pricing.total, pricing.displayCurrency)}`}
                            accountReference={accountReference}
                            onAccountReferenceChange={handleAccountReferenceChange}
                            accountRefError={accountRefError || undefined}
                            idPrefix="buy-manual"
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
                    createOrderFromPayment.isPending ? (
                      <>Submitting your server order for provisioning…</>
                    ) : createOrderFromPayment.isError ? (
                      <>
                        Payment for <span className="font-semibold">{plan.planName}</span> was received, but the order could not be created automatically. Please contact support with your M-Pesa reference.
                      </>
                    ) : createOrderFromPayment.isSuccess ? (
                      <>
                        Your server <span className="font-semibold">{plan.planName}</span>
                        {hostname.trim() ? (
                          <>
                            {" "}
                            (<span className="font-mono text-xs">{hostname.trim()}</span>)
                          </>
                        ) : null}{" "}
                        is being provisioned and will appear on your dashboard in a few minutes.
                      </>
                    ) : (
                      <>Confirming your order…</>
                    )
                  ) : (
                    <>
                      Your service plan <span className="font-semibold">{plan.planName}</span> will be activated on your dashboard in a few minutes.
                    </>
                  )}
                </p>
                {plan.hivelocity && createOrderFromPayment.isError ? (
                  <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-foreground">
                    {createOrderFromPayment.error?.message ??
                      "Order creation failed. Please contact support with your M-Pesa reference."}
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

  const hivelocityNextBillingDate = React.useMemo(
    () => formatNextBillingDate(hivelocityPeriod),
    [hivelocityPeriod],
  );

  const hivelocityConfigFooterBar =
    currentStep === "hivelocity_config" && plan?.hivelocity && hivelocityInvoiceBreakdown ? (
      <div className="flex flex-col gap-2 min-w-0 flex-1 text-left">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4">
          <div className="min-w-0 sm:w-[180px] shrink-0">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
              Billing period
            </p>
            <Select
              value={hivelocityPeriod}
              onValueChange={(v) => setHivelocityPeriod(v as HivelocityPeriod)}
            >
              <SelectTrigger className="h-9 mt-1">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                {availableHivelocityPeriods.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="block w-full">
                      <SelectItem
                        value="hourly"
                        disabled
                        className="pointer-events-auto cursor-not-allowed opacity-50"
                      >
                        Hourly
                      </SelectItem>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-[240px] text-left">
                    Hourly billing is not available for your account. Contact support for more
                    information, or choose another billing cycle.
                  </TooltipContent>
                </Tooltip>
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              {getHivelocityPeriodLabel(hivelocityPeriod)} price
            </p>
            <p className="text-xl font-bold leading-tight text-foreground">
              {formatPrice(hivelocityInvoiceBreakdown.subtotalExVat, plan.currency)}
            </p>
            {hivelocityNextBillingDate ? (
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Next billing: {hivelocityNextBillingDate}
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground border-t pt-2">
          <span className="line-clamp-1">
            Server {formatPeriodPrice(hivelocityBaseDisplayPrice)}
          </span>
          {selectedOs ? (
            <span className="line-clamp-1">
              OS {formatPeriodPrice(convertOptionUsdToDisplay(encodeNumber(selectedOs.monthlyPrice), "os"))}
            </span>
          ) : null}
          {selectedOptions.length > 0 ? (
            <span>
              {selectedOptions.length} add-on{selectedOptions.length === 1 ? "" : "s"}{" "}
              {formatPeriodPrice(
                selectedOptions.reduce(
                  (sum, o) => sum + convertOptionUsdToDisplay(encodeNumber(o?.monthlyPrice), "addons"),
                  0,
                ),
              )}
            </span>
          ) : null}
        </div>
      </div>
    ) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "flex max-h-[90vh] flex-col overflow-hidden w-full p-0 gap-0",
          currentStep === "team_billing" ? "sm:max-w-2xl" : "sm:max-w-[600px]",
        )}
      >
        <DialogHeader className="min-w-0 w-full px-6 pt-6 pb-4 flex-shrink-0">
          <DialogTitle className="line-clamp-1 break-words truncate min-w-0 w-full max-w-full">
            {intent === "add_to_cart" ? "Add to cart" : "Buy"} {plan.planName}
          </DialogTitle>
          <DialogDescription className="min-w-0 w-full max-w-full">
            {currentStep === "seo_connect" &&
              "How you will connect Google Search Console and GA4 to nPanel after subscribing"}
            {currentStep === "domain" &&
              (showDomainConfirmOnly
                ? "Confirm the domain this hosting purchase applies to"
                : "Choose or enter the domain to use with this plan")}
            {currentStep === "agency_billing" &&
              "Choose whether this order is for your agency, a client organization, or a specific user"}
            {currentStep === "hivelocity_config" && "Choose OS, hostname, and optional add-ons - scroll through all sections"}
            {currentStep === "review" &&
              (intent === "add_to_cart" ? "Review your configuration and add it to cart" : "Review your order and proceed to checkout")}
            {currentStep === "team_billing" &&
              "Enter company billing details used on your invoice. You can update these later in Settings."}
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

        <BuyNowDialogBodyScroll scrollRef={dialogScrollContainerRef}>
          {renderStep()}
        </BuyNowDialogBodyScroll>

        <DialogFooter
          className={cn(
            "gap-2 px-6 pb-6 pt-4 flex-shrink-0 border-t",
            currentStep === "hivelocity_config" && "!flex-col !items-stretch",
          )}
        >
          {currentStep === "seo_connect" && (
            <>
              <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-primary">
                Cancel
              </Button>
              <Button onClick={handleNext} className="bg-primary text-primary-foreground">
                {showAgencyBillingStep ? "Next" : "Next: Review"}
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
                {showAgencyBillingStep ? "Next" : "Next: Review"}
              </Button>
            </>
          )}
          {currentStep === "agency_billing" && (
            <>
              <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-primary">
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  if (stepBeforeAgencyBilling) {
                    setCurrentStep(stepBeforeAgencyBilling);
                  } else {
                    onOpenChange(false);
                  }
                }}
              >
                Back
              </Button>
              <Button
                onClick={handleNext}
                disabled={!canProceedFromAgencyBilling}
                className="bg-primary text-primary-foreground"
              >
                Next: Review
              </Button>
            </>
          )}
          {currentStep === "hivelocity_config" && (
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 w-full">
              {hivelocityConfigFooterBar}
              <div className="flex flex-wrap gap-2 shrink-0 sm:justify-end">
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
                  {showAgencyBillingStep ? "Next" : "Next: Review"}
                </Button>
              </div>
            </div>
          )}
          {currentStep === "team_billing" && (
            <>
              <Button variant="outline" onClick={() => setCurrentStep("review")}>
                Back
              </Button>
              <Button type="submit" form={CHECKOUT_TEAM_BILLING_FORM_ID}>
                Save and continue
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
              {showAgencyBillingStep && (
                <Button variant="outline" onClick={() => setCurrentStep("agency_billing")}>
                  Back
                </Button>
              )}
              {!showAgencyBillingStep && showSeoConnectStep && (
                <Button variant="outline" onClick={() => setCurrentStep("seo_connect")}>
                  Back
                </Button>
              )}
              {!showAgencyBillingStep && !showSeoConnectStep && showDomainStep && (
                <Button variant="outline" onClick={() => setCurrentStep("domain")}>
                  Back
                </Button>
              )}
              {!showAgencyBillingStep && !showSeoConnectStep && !showDomainStep && isHivelocityPlan && !isHivelocityInPlace && (
                <Button variant="outline" onClick={() => setCurrentStep("hivelocity_config")}>
                  Back
                </Button>
              )}
              <Button
                onClick={handleNext}
                className="bg-primary text-primary-foreground"
                disabled={intent === "buy_now" && isHivelocityPlan && !plan?.productId}
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
