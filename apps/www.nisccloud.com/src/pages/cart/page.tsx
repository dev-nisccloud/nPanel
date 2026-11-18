import * as React from "react";
import { useSearchParams, Link } from "react-router-dom";
import { ShoppingCart, ArrowLeft, ArrowRight, Check, Globe, Lock, Mail, MessageSquare, Server } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { publicPlanName, publicProductName } from "@/lib/plan-catalog.ts";
import { trackEvent } from "@/lib/track.ts";
import Navbar from "@/pages/_components/Navbar.tsx";
import { TransferEppCodeField } from "./_components/TransferEppCodeField.tsx";
import {
  TransferNameserverChoice,
  type TransferNameserverMode,
} from "./_components/TransferNameserverChoice.tsx";
import { CartPageSkeleton } from "./_components/CartPageSkeleton.tsx";
import { CartItem } from "./_components/CartItem.tsx";
import { DomainUpsell } from "./_components/DomainUpsell.tsx";
import { HostingUpsell } from "./_components/HostingUpsell.tsx";
import { OutreachUpsell, type SelectedOutreachPlan } from "./_components/OutreachUpsell.tsx";
import { OrderSummary } from "./_components/OrderSummary.tsx";
import { CheckoutFooter } from "./_components/CheckoutFooter.tsx";
import { CheckoutEmailCodeDialog } from "./_components/CheckoutEmailCodeDialog.tsx";
import { Turnstile } from "@/components/Turnstile.tsx";
import { CustomerInfoStep, CUSTOMER_INFO_FORM_ID, SIGNED_IN_CHECKOUT_FORM_ID, SIGNED_IN_ORG_FORM_ID, SIGNED_IN_PROFILE_FORM_ID } from "./_components/CustomerInfoStep.tsx";
import type { CustomerInfoIdentity } from "./_components/CustomerInfoStep.tsx";
import {
  StorefrontPaymentDialog,
  resumeStorefrontJengaCheckout,
} from "./_components/StorefrontPaymentDialog.tsx";
import {
  HivelocityConfigStep,
  createInitialHivelocityConfig,
  isHivelocityConfigComplete,
  type HivelocityCheckoutConfig,
  type HivelocityPricingContext,
} from "./_components/HivelocityConfigStep.tsx";
import type { BillingCycle, CartItemData } from "./_components/CartItem.tsx";
import type { SelectedDomain } from "./_components/DomainUpsell.tsx";
import type { HostingUpsellType, UpsellPlanInfo } from "./_components/HostingUpsell.tsx";
import type { SelectedHostingPlan } from "./_components/OrderSummary.tsx";
import type { CustomerInfo } from "./_components/CustomerInfoStep.tsx";
import { computeHivelocitySummaryLines, formatOptionPriceKes } from "@/lib/vps-plans-api.ts";
import { describeServerSelection } from "./_components/server-options.ts";
import {
  clearStorefrontCartDraft,
  clearStorefrontCartResume,
  completeStorefrontProfile,
  createStorefrontOrderFromPayment,
  createStorefrontOrganization,
  fetchStorefrontCheckoutIdentity,
  issueStorefrontCheckoutToken,
  loadStorefrontCartDraft,
  peekStorefrontCartResume,
  persistStorefrontCartDraft,
  registerStorefrontCustomer,
  resolveStorefrontProductId,
  sendCheckoutEmailCode,
  type StorefrontCartDraft,
  type StorefrontCartQuoteRequest,
  type StorefrontJengaCustomer,
  type StorefrontProfilePrefill,
} from "@/lib/storefront-checkout-api.ts";
import { useStorefrontCartQuote } from "@/lib/use-storefront-cart-quote.ts";
import { serviceTypeToHivelocityProductType } from "@/lib/hivelocity-default-hostname.ts";
import { useCurrency } from "@/components/providers/currency.tsx";
import { formatCurrency } from "@/lib/currency.ts";
import { isOneTimeService } from "@/lib/billing-cycle.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const NPANEL_URL = import.meta.env.VITE_NPANEL_APP_URL ?? "https://npanel.nisccloud.com";

/** Service types that want a domain upsell */
/** Hosting, email and servers can take a domain, but a domain is not required to check out. */
const HOSTING_TYPES = new Set([
  "web_hosting",
  "wordpress_hosting",
  "email_hosting",
  "vps",
  "vds",
  "dedicated_servers",
]);

/** Services served from Nisc nameservers, so a transferred domain should point at us. */
const NISC_DNS_SERVICE_TYPES = new Set(["web_hosting", "wordpress_hosting", "email_hosting"]);

/** VPS / VDS / dedicated  require OS + hostname configuration */
const HIVELOCITY_SERVICE_TYPES = new Set(["vps", "vds", "dedicated_servers"]);

function readHandoffFromLocation(): string {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("h")?.trim() ?? "";
}

/** One-shot draft load for initial state (survives login redirect / refresh). */
let cachedDraftHandoff = "";
let cachedDraft: StorefrontCartDraft | null | undefined;

function getInitialCartDraft(handoff?: string): StorefrontCartDraft | null {
  const key = (handoff ?? readHandoffFromLocation()).trim();
  if (!key) return null;
  if (cachedDraft !== undefined && cachedDraftHandoff === key) return cachedDraft;
  cachedDraftHandoff = key;
  cachedDraft = loadStorefrontCartDraft(key);
  return cachedDraft;
}

// ---------------------------------------------------------------------------
// Step indicator
// ---------------------------------------------------------------------------

const STEPS = [
  { id: 1, label: "Review" },
  { id: 2, label: "Details" },
  { id: 3, label: "Payment" },
] as const;

const STEP_NUDGE: Record<1 | 2 | 3, string> = {
  1: "Next: your details, then payment.",
  2: "Almost done. Payment is the last step.",
  3: "Last step. Confirm the payment on your phone or card.",
};

/**
 * A thin checkout meter, not a card. It starts nearly half full (endowed progress)
 * and the fill turns green once payment is the only step left, so the finish
 * reads as close rather than as a warning.
 */
function CheckoutProgress({ current }: { current: 1 | 2 | 3 }) {
  const fill = current === 1 ? 42 : current === 2 ? 78 : 94;
  const finishing = current >= 2;
  return (
    <nav aria-label="Checkout progress">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          <span className={finishing ? "font-semibold text-emerald-700 dark:text-emerald-400" : "font-semibold text-foreground"}>
            Step {current} of {STEPS.length}
          </span>
          <span className="ml-2">{STEP_NUDGE[current]}</span>
        </p>
        <ol className="hidden shrink-0 items-center gap-2.5 sm:flex">
          {STEPS.map((step) => {
            const done = step.id < current;
            const active = step.id === current;
            return (
              <li key={step.id} aria-current={active ? "step" : undefined} className="flex items-center gap-1.5">
                <span
                  className={`flex size-5 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                    done || active
                      ? finishing
                        ? "bg-emerald-600 text-white"
                        : "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {done ? <Check className="size-3" strokeWidth={3} aria-hidden /> : step.id}
                </span>
                <span className={`text-xs ${active ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                  {step.label}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
      <div
        className="mt-2 h-1 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={fill}
        aria-label="Checkout completion"
      >
        <div
          className={`h-full rounded-full transition-[width,background-color] duration-500 ease-out motion-reduce:transition-none ${
            current === 3
              ? "bg-emerald-500"
              : current === 2
                ? "bg-gradient-to-r from-primary to-emerald-500"
                : "bg-primary"
          }`}
          style={{ width: `${fill}%` }}
        />
      </div>
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Empty cart state
// ---------------------------------------------------------------------------

const START_POINTS = [
  { label: "Web hosting", desc: "Put your website online", href: "/hosting/web-hosting", icon: Server },
  { label: "Domains", desc: "Register .co.ke, .ke, .com and more", href: "/hosting/domains", icon: Globe },
  { label: "Business email", desc: "Email on your own domain", href: "/hosting/email", icon: Mail },
  { label: "Zepo AI credits", desc: "One-time packs, no monthly plan", href: "/services/zepo-ai", icon: MessageSquare },
] as const;

function EmptyCart() {
  return (
    <main id="main-content" className="mx-auto w-full max-w-6xl flex-1 px-4 pt-28 pb-16 md:px-6 md:pt-32 xl:px-8">
      <ShoppingCart className="size-8 text-primary" aria-hidden />
      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">Your cart is empty</h1>
      <p className="mt-2 max-w-md text-base text-muted-foreground">
        Pick where you'd like to start. Prices are in your currency and locked before you pay.
      </p>
      <ul className="mt-8 grid max-w-3xl gap-3 sm:grid-cols-2">
        {START_POINTS.map(({ label, desc, href, icon: Icon }) => (
          <li key={href}>
            <Link
              to={href}
              className="group flex min-h-[72px] items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Icon className="size-5 shrink-0 text-primary" aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block text-base font-semibold text-foreground">{label}</span>
                <span className="block text-sm text-muted-foreground">{desc}</span>
              </span>
              <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary motion-reduce:transition-none" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
      <Link
        to="/pricing"
        className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-md text-sm font-semibold text-primary hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        See all pricing
        <ArrowRight className="size-4" aria-hidden />
      </Link>
    </main>
  );
}

/** Expired or tampered checkout links can't be retried; everything else (network, API) can. */
function isDeadCheckoutLink(message: string): boolean {
  return /checkout link|select your plan again/i.test(message);
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function CartPage() {
  const { currency: selectedCurrency } = useCurrency();
  const [searchParams, setSearchParams] = useSearchParams();
  const handoff = searchParams.get("h")?.trim() ?? "";
  const resumeFromQuery = searchParams.get("resume") === "1";
  const resumeFromStorage =
    typeof window !== "undefined" && handoff ? peekStorefrontCartResume(handoff) : false;
  const shouldResumeCheckout = resumeFromQuery || resumeFromStorage;

  // ---- State (seeded from sessionStorage draft so login redirect never resets options) ----
  const [billingCycle, setBillingCycle] = React.useState<BillingCycle | null>(() => {
    return getInitialCartDraft()?.billingCycle ?? null;
  });
  const billingCycleUserSetRef = React.useRef(
    Boolean(getInitialCartDraft()?.billingCycleUserSet),
  );
  const [selectedDomain, setSelectedDomain] = React.useState<SelectedDomain | null>(() => {
    return getInitialCartDraft()?.selectedDomain ?? null;
  });
  const [transferAuthCode, setTransferAuthCode] = React.useState(() => {
    return getInitialCartDraft()?.transferAuthCode ?? "";
  });
  const [selectedHostingType, setSelectedHostingType] = React.useState<HostingUpsellType | null>(
    () => getInitialCartDraft()?.selectedHostingType ?? null,
  );
  const loadedHostingPlansRef = React.useRef<Partial<Record<HostingUpsellType, UpsellPlanInfo>>>(
    (() => {
      const draft = getInitialCartDraft();
      return draft?.selectedHostingType && draft.selectedHostingPlanInfo
        ? { [draft.selectedHostingType]: draft.selectedHostingPlanInfo }
        : {};
    })(),
  );
  const [selectedHostingPlanInfo, setSelectedHostingPlanInfo] =
    React.useState<UpsellPlanInfo | null>(
      () => getInitialCartDraft()?.selectedHostingPlanInfo ?? null,
    );
  const [hostingCycles, setHostingCycles] = React.useState<
    Partial<Record<HostingUpsellType, BillingCycle>>
  >(() => getInitialCartDraft()?.hostingCycles ?? {});
  const [selectedOutreach, setSelectedOutreach] = React.useState<SelectedOutreachPlan | null>(
    () => getInitialCartDraft()?.selectedOutreach ?? null,
  );
  const [outreachCycle, setOutreachCycle] = React.useState<BillingCycle>(
    () => getInitialCartDraft()?.outreachBillingCycle ?? "MONTHLY",
  );
  const [step, setStep] = React.useState<1 | 2>(shouldResumeCheckout ? 2 : 1);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [checkoutIdentity, setCheckoutIdentity] = React.useState<CustomerInfoIdentity>({
    status: shouldResumeCheckout ? "loading" : "guest",
  });
  const resumeHandledRef = React.useRef(false);
  const [paymentOpen, setPaymentOpen] = React.useState(false);
  const [paymentAttempt, setPaymentAttempt] = React.useState<{
    totalAmount: number;
    currency: "KES" | "USD";
    cart: StorefrontCartQuoteRequest;
    quoteToken: string;
  } | null>(null);
  const [checkoutSession, setCheckoutSession] = React.useState<{
    storefrontToken: string;
    teamSlug: string;
    phone: string;
    jengaCustomer?: Partial<StorefrontJengaCustomer>;
  } | null>(null);
  const [jengaResumePending, setJengaResumePending] = React.useState(false);
  const [hivelocityConfig, setHivelocityConfig] = React.useState<HivelocityCheckoutConfig | null>(
    () => getInitialCartDraft()?.hivelocityConfig ?? null,
  );
  const [hivelocityPricing, setHivelocityPricing] = React.useState<HivelocityPricingContext | null>(
    null,
  );
  const [hostingUpsellLoading, setHostingUpsellLoading] = React.useState(true);
  const [hasRevealedPage, setHasRevealedPage] = React.useState(false);
  const [transferNameserverChoice, setTransferNameserverChoice] =
    React.useState<TransferNameserverMode | null>(
      () => getInitialCartDraft()?.transferNameservers ?? null,
    );

  const cartDraftSnapshot = React.useMemo(
    (): StorefrontCartDraft => ({
      billingCycle,
      billingCycleUserSet: billingCycleUserSetRef.current,
      selectedDomain,
      transferAuthCode,
      selectedHostingType,
      selectedHostingPlanInfo,
      hostingCycles,
      selectedOutreach,
      outreachBillingCycle: outreachCycle,
      hivelocityConfig,
      transferNameservers: transferNameserverChoice,
    }),
    [
      transferNameserverChoice,
      billingCycle,
      selectedDomain,
      transferAuthCode,
      selectedHostingType,
      selectedHostingPlanInfo,
      hostingCycles,
      selectedOutreach,
      outreachCycle,
      hivelocityConfig,
    ],
  );
  const cartDraftSnapshotRef = React.useRef(cartDraftSnapshot);
  cartDraftSnapshotRef.current = cartDraftSnapshot;

  // Persist cart options continuously so a full-page login round-trip can restore them.
  React.useEffect(() => {
    if (!handoff) return;
    persistStorefrontCartDraft(handoff, cartDraftSnapshot);
  }, [handoff, cartDraftSnapshot]);

  const flushCartDraft = React.useCallback(() => {
    if (!handoff) return;
    persistStorefrontCartDraft(handoff, cartDraftSnapshotRef.current);
  }, [handoff]);

  const handleHivelocityPricingContext = React.useCallback((ctx: HivelocityPricingContext) => {
    setHivelocityPricing(ctx);
  }, []);

  const cartQuoteRequest = React.useMemo((): StorefrontCartQuoteRequest | null => {
    if (!handoff) return null;

    const request: StorefrontCartQuoteRequest = {
      handoff,
      currency: selectedCurrency,
      billingCountry: checkoutSession?.jengaCustomer?.countryCode,
    };

    // Only override handoff billing cycle after the user toggles it on the cart page.
    if (billingCycleUserSetRef.current && billingCycle) {
      request.main = { billingCycle };
    }

    if (selectedDomain) {
      request.upsellDomain = {
        domain: selectedDomain.domain,
        isExisting: selectedDomain.isExisting,
        isTransfer: selectedDomain.isTransfer,
        provider: selectedDomain.provider,
      };
    }

    const hostingPlan = selectedHostingType ? selectedHostingPlanInfo : undefined;
    if (selectedHostingType && hostingPlan) {
      request.upsellHosting = {
        serviceType: selectedHostingType,
        planId: hostingPlan.planId,
        billingCycle: hostingCycles[selectedHostingType] ?? "YEARLY",
      };
    }

    if (selectedOutreach) {
      request.upsellOutreach = { planId: selectedOutreach.planId, billingCycle: outreachCycle };
    }

    if (hivelocityConfig?.selectedOsId) {
      request.hivelocity = {
        hivelocityProductId: hivelocityConfig.hivelocityProductId,
        locationName: hivelocityConfig.locationName,
        selectedOsId: hivelocityConfig.selectedOsId,
        selectedOptionIds: hivelocityConfig.selectedOptionIds,
      };
    }

    if (transferAuthCode.trim()) {
      request.transferAuthCode = transferAuthCode.trim();
    }

    return request;
  }, [
    handoff,
    billingCycle,
    selectedDomain,
    selectedHostingType,
    selectedHostingPlanInfo,
    hostingCycles,
    selectedOutreach,
    outreachCycle,
    hivelocityConfig,
    transferAuthCode,
    selectedCurrency,
    checkoutSession?.jengaCustomer?.countryCode,
  ]);

  const {
    quote,
    quoteError,
    quoteInitialLoading,
    quoteRefreshing,
    quoteExpiresIn,
    quoteExpired,
    retryQuote,
  } = useStorefrontCartQuote(cartQuoteRequest);

  const serviceType = quote?.serviceType ?? "";
  const planId = quote?.planId ?? "";
  const productId = quote?.productId ?? "";
  const planName = quote?.planName ?? "Selected Plan";
  const productName = publicProductName(quote?.serviceType ?? "", quote?.productName ?? "Nisc Cloud Service");
  const locationName = quote?.locationName ?? "";
  const currency = quote?.currency ?? "KES";

  const displayBillingCycle: BillingCycle =
    billingCycle ?? quote?.billingCycle ?? "MONTHLY";

  const recommendedTransferNameservers: TransferNameserverMode =
    NISC_DNS_SERVICE_TYPES.has(serviceType) || selectedHostingType ? "nisc" : "keep";
  const transferNameservers = transferNameserverChoice ?? recommendedTransferNameservers;

  React.useEffect(() => {
    if (!quote?.billingCycle || billingCycleUserSetRef.current) return;
    setBillingCycle(quote.billingCycle);
  }, [quote?.billingCycle]);

  const hivelocityProductType = serviceTypeToHivelocityProductType(serviceType);
  const isHivelocityPlan = HIVELOCITY_SERVICE_TYPES.has(serviceType) && Boolean(hivelocityProductType);

  React.useEffect(() => {
    // Wait for quote before clearing  otherwise a restored VPS/VDS draft is wiped while loading.
    if (!quote) return;
    if (!isHivelocityPlan || !hivelocityProductType) {
      setHivelocityConfig(null);
      return;
    }
    const productIdNum = Number(quote.planId);
    if (!Number.isFinite(productIdNum) || productIdNum <= 0) return;
    setHivelocityConfig((prev) => {
      if (
        prev &&
        prev.hivelocityProductId === productIdNum &&
        prev.productType === hivelocityProductType
      ) {
        return prev;
      }
      return createInitialHivelocityConfig({
        productType: hivelocityProductType,
        hivelocityProductId: productIdNum,
        locationName: quote.locationName || "MAIN",
      });
    });
  }, [quote, isHivelocityPlan, hivelocityProductType]);

  const wantsDomainUpsell = HOSTING_TYPES.has(serviceType);
  const wantsHostingUpsell =
    serviceType === "domain_registration" || serviceType === "domain_transfer";
  const isDomainTransfer = serviceType === "domain_transfer";
  const wantsOutreachUpsell =
    Boolean(serviceType) && serviceType !== "email_marketing" && !isOneTimeService(serviceType);

  React.useEffect(() => {
    if (!quote) return;
    if (quote.serviceType !== "domain_registration" && quote.serviceType !== "domain_transfer") {
      setHostingUpsellLoading(false);
    }
  }, [quote?.serviceType]);

  const handleHostingUpsellLoadingChange = React.useCallback((loading: boolean) => {
    setHostingUpsellLoading(loading);
  }, []);

  const hivelocityConfigComplete = Boolean(
    hivelocityConfig && isHivelocityConfigComplete(hivelocityConfig),
  );

  const isPageReady = React.useMemo(() => {
    if (quoteInitialLoading || !quote) return false;
    // Login resume opens step 2  step-1 config/upsell UIs are unmounted, so don't wait on them.
    if (step === 2) return true;
    if (isHivelocityPlan) {
      if (!hivelocityConfig) return false;
      if (!hivelocityPricing || hivelocityPricing.loading) return false;
    }
    if (
      quote.serviceType === "domain_registration" ||
      quote.serviceType === "domain_transfer"
    ) {
      if (hostingUpsellLoading) return false;
    }
    return true;
  }, [
    quoteInitialLoading,
    quote,
    step,
    isHivelocityPlan,
    hivelocityConfig,
    hivelocityPricing,
    hostingUpsellLoading,
  ]);

  React.useEffect(() => {
    if (isPageReady) setHasRevealedPage(true);
  }, [isPageReady]);

  const showSkeleton = !hasRevealedPage && !quoteError;
  const canMountContent = Boolean(quote && !quoteInitialLoading);

  const selectedHostingPlan: SelectedHostingPlan | null = selectedHostingPlanInfo
    ? { ...selectedHostingPlanInfo, serviceType: selectedHostingType }
    : null;

  const selectedHostingCycle: BillingCycle =
    selectedHostingType ? (hostingCycles[selectedHostingType] ?? "YEARLY") : "YEARLY";

  const monthlyPrice = quote?.monthlyPrice ?? 0;
  const yearlyPrice = quote?.yearlyPrice ?? 0;

  const selectedHostingTypeRef = React.useRef(selectedHostingType);
  selectedHostingTypeRef.current = selectedHostingType;

  const handlePlanLoaded = React.useCallback(
    (type: HostingUpsellType, plan: UpsellPlanInfo | null) => {
      if (!plan) return;
      loadedHostingPlansRef.current[type] = plan;
      setSelectedHostingPlanInfo((current) => {
        if (selectedHostingTypeRef.current !== type) return current;
        return plan;
      });
    },
    [],
  );

  const handleHostingTypeSelect = React.useCallback((type: HostingUpsellType | null) => {
    setSelectedHostingType(type);
    if (type) {
      setHostingCycles((prev) => ({ ...prev, [type]: prev[type] ?? "YEARLY" }));
      setSelectedHostingPlanInfo(loadedHostingPlansRef.current[type] ?? null);
    } else {
      setSelectedHostingPlanInfo(null);
    }
  }, []);

  const removeWithUndo = React.useCallback(
    (message: string, remove: () => void, restore: () => void) => {
      remove();
      toast(message, { action: { label: "Undo", onClick: restore } });
    },
    [],
  );

  const handleRemoveDomain = () => {
    const previous = selectedDomain;
    if (!previous) return;
    removeWithUndo(`${previous.domain} removed`, () => setSelectedDomain(null), () => setSelectedDomain(previous));
  };

  const handleRemoveHosting = () => {
    const previous = selectedHostingType;
    if (!previous) return;
    removeWithUndo("Hosting removed", () => handleHostingTypeSelect(null), () => handleHostingTypeSelect(previous));
  };

  const handleRemoveOutreach = () => {
    const previous = selectedOutreach;
    if (!previous) return;
    removeWithUndo("Nisc Outreach removed", () => setSelectedOutreach(null), () => setSelectedOutreach(previous));
  };

  const handleRemoveMainItem = () => {
    const previous = handoff;
    flushCartDraft();
    removeWithUndo(
      "Removed from your cart",
      () => setSearchParams({}),
      () => setSearchParams({ h: previous }),
    );
  };

  const scrollToAddon = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  };

  const recommendedOutreachRef = React.useRef<SelectedOutreachPlan | null>(null);
  const rememberRecommendedOutreach = React.useCallback((plan: SelectedOutreachPlan) => {
    recommendedOutreachRef.current = plan;
  }, []);

  const addSuggestedHosting = () => {
    handleHostingTypeSelect("web_hosting");
    toast.success("Website hosting added", {
      action: { label: "Undo", onClick: () => handleHostingTypeSelect(null) },
    });
    scrollToAddon("addon-hosting");
  };

  const addSuggestedOutreach = () => {
    const plan = recommendedOutreachRef.current;
    if (!plan) {
      scrollToAddon("addon-outreach");
      return;
    }
    const previous = selectedOutreach;
    setSelectedOutreach(plan);
    toast.success(`${plan.name} added`, {
      action: { label: "Undo", onClick: () => setSelectedOutreach(previous) },
    });
    scrollToAddon("addon-outreach");
  };

  const handleHostingCycleChange = React.useCallback(
    (type: HostingUpsellType, cycle: BillingCycle) => {
      setHostingCycles((prev) => ({ ...prev, [type]: cycle }));
    },
    [],
  );

  const cartItem: CartItemData = {
    planName: publicPlanName(planId, planName),
    productName,
    serviceType,
    monthlyPrice,
    yearlyPrice,
    currency,
    billingCycle: displayBillingCycle,
  };

  const handleBillingCycleChange = (cycle: BillingCycle) => {
    billingCycleUserSetRef.current = true;
    setBillingCycle(cycle);
  };

  const applySignedInIdentity = React.useCallback(
    (identity: Awaited<ReturnType<typeof fetchStorefrontCheckoutIdentity>>) => {
      if (!identity.authenticated) {
        setCheckoutIdentity({ status: "guest" });
        return;
      }
      clearStorefrontCartResume();
      setCheckoutIdentity({
        status: "signed-in",
        userName: identity.user.name,
        userEmail: identity.user.email,
        profileComplete: identity.profile.complete,
        profilePrefill: identity.profile.prefill,
        teams: identity.teams,
      });
    },
    [],
  );

  // After "Sign in" on the cart → nPanel login → redirect back (URL ?resume=1 and/or sessionStorage).
  React.useEffect(() => {
    if (!shouldResumeCheckout || !handoff || resumeHandledRef.current) return;
    resumeHandledRef.current = true;

    let cancelled = false;
    setStep(2);
    setCheckoutIdentity({ status: "loading" });

    void fetchStorefrontCheckoutIdentity()
      .then((identity) => {
        if (cancelled) return;
        applySignedInIdentity(identity);
        if (identity.authenticated) {
          toast.success(`Signed in as ${identity.user.name}`);
        } else {
          toast.message("You're back  sign in again if checkout still shows the guest form.");
        }
      })
      .catch(() => {
        if (!cancelled) setCheckoutIdentity({ status: "guest" });
      })
      .finally(() => {
        if (cancelled) return;
        // Drop resume so a later refresh relies on sessionStorage / Continue, not re-toast.
        if (searchParams.get("resume") === "1") {
          const next = new URLSearchParams(searchParams);
          next.delete("resume");
          setSearchParams(next, { replace: true });
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldResumeCheckout, handoff, applySignedInIdentity]);

  const quoteSummaryLoading = quoteRefreshing;

  const canContinueStep1 = React.useMemo(() => {
    if (quoteInitialLoading || !quote || quoteSummaryLoading || quoteExpired) return false;
    if (quoteError) return false;
    if (isDomainTransfer && !transferAuthCode.trim()) return false;
    if (selectedDomain?.isTransfer && !transferAuthCode.trim()) return false;
    if (!isHivelocityPlan) return true;
    if (!hivelocityPricing || hivelocityPricing.loading) return false;
    if (hivelocityPricing.loadError) return false;
    if (!hivelocityConfigComplete) return false;
    if (!hivelocityPricing.selectionValid) return false;
    if (!hivelocityConfig?.selectedOsId) return false;
    return true;
  }, [
    quoteInitialLoading,
    quote,
    quoteError,
    quoteSummaryLoading,
    quoteExpired,
    isDomainTransfer,
    transferAuthCode,
    selectedDomain,
    isHivelocityPlan,
    hivelocityConfig,
    hivelocityConfigComplete,
    hivelocityPricing,
  ]);

  const handleContinue = () => {
    if (step === 1) {
      if (!canContinueStep1) return;
      setCheckoutIdentity({ status: "loading" });
      setStep(2);
      trackEvent("checkout_start", { service: serviceType || "unknown" });
      window.scrollTo({ top: 0, behavior: "smooth" });
      void fetchStorefrontCheckoutIdentity()
        .then(applySignedInIdentity)
        .catch(() => {
          setCheckoutIdentity({ status: "guest" });
        });
    }
  };

  const detailsFormId = React.useMemo(() => {
    if (checkoutIdentity.status !== "signed-in") return CUSTOMER_INFO_FORM_ID;
    if (!checkoutIdentity.profileComplete) return SIGNED_IN_PROFILE_FORM_ID;
    if (checkoutIdentity.teams.length === 0) return SIGNED_IN_ORG_FORM_ID;
    return SIGNED_IN_CHECKOUT_FORM_ID;
  }, [checkoutIdentity]);

  const hivelocitySummaryLines = React.useMemo(() => {
    if (!hivelocityConfig || !hivelocityPricing || hivelocityPricing.loading) return [];
    return computeHivelocitySummaryLines({
      selectedOsId: hivelocityConfig.selectedOsId,
      selectedOptionIds: hivelocityConfig.selectedOptionIds,
      osList: hivelocityPricing.osList,
      addonGroups: hivelocityPricing.addonGroups,
      pricing: hivelocityPricing.pricing,
      kesRate: hivelocityPricing.kesRate,
    });
  }, [hivelocityConfig, hivelocityPricing]);

  const serverComponents = React.useMemo(() => {
    if (!isHivelocityPlan || !hivelocityConfig || !hivelocityPricing || hivelocityPricing.loading) return [];
    const { osList, addonGroups, pricing, kesRate } = hivelocityPricing;
    return describeServerSelection({
      selectedOsId: hivelocityConfig.selectedOsId,
      selectedOptionIds: hivelocityConfig.selectedOptionIds,
      osList,
      addonGroups,
      osPrice: (usd) => formatOptionPriceKes(usd, pricing?.os ?? null, kesRate),
      addonPrice: (usd) => formatOptionPriceKes(usd, pricing?.addons ?? null, kesRate),
    });
  }, [isHivelocityPlan, hivelocityConfig, hivelocityPricing]);

  const showQuoteErrorBanner = Boolean(
    quoteError &&
    !quoteSummaryLoading &&
    (!isHivelocityPlan || hivelocityConfigComplete),
  );

  const checkoutTotal = quote?.total ?? 0;

  const capturePaymentAttempt = () => {
    if (!quote || !cartQuoteRequest || quoteExpired || quoteRefreshing) {
      throw new Error("Pricing changed before payment opened. Refresh the quote and try again.");
    }
    return {
      totalAmount: quote.total,
      currency: quote.currency,
      cart: cartQuoteRequest,
      quoteToken: quote.quoteToken,
    };
  };

  const resolvePrimaryDomain = (): string | undefined => {
    if (serviceType === "domain_registration" || serviceType === "domain_transfer") return planName;
    // Existing domains name the hosting subscription; purchased domains also link hosting to that name.
    if (selectedDomain?.domain) return selectedDomain.domain;
    return undefined;
  };

  const [pendingInfo, setPendingInfo] = React.useState<CustomerInfo | null>(null);
  const [emailCodeOpen, setEmailCodeOpen] = React.useState(false);
  const [captchaToken, setCaptchaToken] = React.useState<string | null>(null);
  const [captchaResetKey, setCaptchaResetKey] = React.useState(0);

  const registerAndOpenPayment = async (info: CustomerInfo, emailProof: string) => {
    setIsSubmitting(true);
    try {
      const attempt = capturePaymentAttempt();
      const reg = await registerStorefrontCustomer({
        firstName: info.firstName,
        lastName: info.lastName,
        email: info.email,
        phone: info.phone,
        companyName: info.companyName,
        password: info.password,
        emailProof,
        acceptedTermsAndConditions: true,
        planName,
      });

      setCheckoutSession({
        storefrontToken: reg.storefrontToken,
        teamSlug: reg.teamSlug,
        phone: info.phone,
        jengaCustomer: {
          customerFirstName: info.firstName,
          customerLastName: info.lastName,
          customerEmail: info.email,
          customerPhone: info.phone,
          customerAddress: "",
          customerPostalCodeZip: "",
          countryCode: "KE",
        },
      });
      setPaymentAttempt(attempt);
      setPaymentOpen(true);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create your account. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (info: CustomerInfo) => {
    setIsSubmitting(true);
    try {
      capturePaymentAttempt();
      await sendCheckoutEmailCode(info.email, captchaToken);
      setPendingInfo(info);
      setEmailCodeOpen(true);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "We couldn't send your code. Please try again.",
      );
    } finally {
      setCaptchaResetKey((value) => value + 1);
      setIsSubmitting(false);
    }
  };

  const handleEmailVerified = (emailProof: string) => {
    setEmailCodeOpen(false);
    if (pendingInfo) void registerAndOpenPayment(pendingInfo, emailProof);
  };

  const handleSignedInSubmit = async (teamId: string) => {
    setIsSubmitting(true);
    try {
      const attempt = capturePaymentAttempt();
      const issued = await issueStorefrontCheckoutToken(teamId);
      const prefill =
        checkoutIdentity.status === "signed-in"
          ? checkoutIdentity.profilePrefill
          : null;
      const email =
        checkoutIdentity.status === "signed-in" ? checkoutIdentity.userEmail : "";
      const phone = prefill?.phone || "";
      setCheckoutSession({
        storefrontToken: issued.storefrontToken,
        teamSlug: issued.teamSlug,
        phone,
        jengaCustomer: prefill
          ? {
              customerFirstName: prefill.firstName,
              customerLastName: prefill.lastName,
              customerEmail: email,
              customerPhone: prefill.phone,
              customerAddress: prefill.address,
              customerPostalCodeZip: prefill.postalCode,
              countryCode:
                prefill.country.length === 2 ? prefill.country.toUpperCase() : "KE",
            }
          : undefined,
      });
      setPaymentAttempt(attempt);
      setPaymentOpen(true);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to start checkout. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteProfile = async (profile: StorefrontProfilePrefill) => {
    setIsSubmitting(true);
    try {
      const result = await completeStorefrontProfile(profile);
      setCheckoutIdentity((prev) => {
        if (prev.status !== "signed-in") return prev;
        return {
          ...prev,
          userName: result.displayName || prev.userName,
          userEmail: prev.userEmail,
          profileComplete: result.complete,
          profilePrefill: result.prefill,
        };
      });
      if (!result.complete) {
        toast.error("Some required profile fields are still missing.");
        return;
      }
      toast.success("Profile saved. Continue with your organization.");
      // Refresh teams in case nothing else changed
      const identity = await fetchStorefrontCheckoutIdentity();
      applySignedInIdentity(identity);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save your profile. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateOrganization = async (name: string) => {
    setIsSubmitting(true);
    try {
      const org = await createStorefrontOrganization(name);
      setCheckoutIdentity((prev) => {
        if (prev.status !== "signed-in") return prev;
        return {
          ...prev,
          teams: [...prev.teams, org],
        };
      });
      toast.success("Organization created.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create organization. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentSuccess = async (checkoutRequestId: string) => {
    if (!checkoutSession) {
      throw new Error("Checkout session expired. Please refresh and try again.");
    }

    const resolvedProductId =
      resolveStorefrontProductId(serviceType, productId) ||
      (serviceType === "domain_transfer" ? productId : "");
    if (!resolvedProductId) {
      throw new Error("Missing product configuration. Please go back and select a plan again.");
    }

    const order = await createStorefrontOrderFromPayment({
      storefrontToken: checkoutSession.storefrontToken,
      checkoutRequestId,
      planId: planId || undefined,
      productId: resolvedProductId,
      billingCycle: displayBillingCycle,
      primaryDomain: resolvePrimaryDomain(),
      cart: cartQuoteRequest ?? undefined,
      quoteToken: quote?.quoteToken ?? "",
      serverHostname: hivelocityConfig?.hostname.trim() || undefined,
      transferNameservers,
    });

    clearStorefrontCartDraft();
    clearStorefrontCartResume();
    trackEvent("checkout_success", {
      service: serviceType || "unknown",
      method: "mpesa",
      billing_cycle: displayBillingCycle,
    });
    toast.success(`Order ${order.orderNumber} confirmed! Redirecting to your dashboard…`);
    window.location.href = `${NPANEL_URL}/${order.teamSlug}/dashboard`;
  };

  // Resume after hosted card redirect (?cardRef=...)
  React.useEffect(() => {
    const cardRef =
      searchParams.get("cardRef")?.trim() ||
      searchParams.get("jengaRef")?.trim();
    if (!cardRef || jengaResumePending) return;

    const raw = sessionStorage.getItem("storefront_jenga_checkout");
    if (!raw) {
      toast.error("Could not resume card payment. Please try checkout again.");
      return;
    }

    let stored: {
      storefrontToken: string;
      orderReference: string;
      cart?: StorefrontCartQuoteRequest;
      quoteToken?: string;
    };
    try {
      stored = JSON.parse(raw) as typeof stored;
    } catch {
      toast.error("Could not resume card payment. Please try checkout again.");
      return;
    }

    if (stored.orderReference !== cardRef) {
      toast.error("Payment reference mismatch. Please try checkout again.");
      return;
    }

    setJengaResumePending(true);
    setCheckoutSession({
      storefrontToken: stored.storefrontToken,
      teamSlug: "",
      phone: "",
    });

    void resumeStorefrontJengaCheckout({
      storefrontToken: stored.storefrontToken,
      orderReference: cardRef,
      onSuccess: async (orderReference) => {
        const resolvedProductId =
          resolveStorefrontProductId(serviceType, productId) ||
          (serviceType === "domain_transfer" ? productId : "");
        if (!resolvedProductId) {
          throw new Error("Missing product configuration. Please select a plan again.");
        }
        const order = await createStorefrontOrderFromPayment({
          storefrontToken: stored.storefrontToken,
          checkoutRequestId: orderReference,
          planId: planId || undefined,
          productId: resolvedProductId,
          billingCycle: displayBillingCycle,
          primaryDomain: resolvePrimaryDomain(),
          cart: stored.cart ?? cartQuoteRequest ?? undefined,
          quoteToken: stored.quoteToken ?? quote?.quoteToken ?? "",
          serverHostname: hivelocityConfig?.hostname.trim() || undefined,
          transferNameservers,
        });
        sessionStorage.removeItem("storefront_jenga_checkout");
        clearStorefrontCartDraft();
        clearStorefrontCartResume();
        trackEvent("checkout_success", {
          service: serviceType || "unknown",
          method: "card",
          billing_cycle: displayBillingCycle,
        });
        toast.success(`Order ${order.orderNumber} confirmed! Redirecting to your dashboard…`);
        window.location.href = `${NPANEL_URL}/${order.teamSlug}/dashboard`;
      },
    }).catch((err) => {
      setJengaResumePending(false);
      trackEvent("checkout_failure", { method: "card", stage: "confirmation" });
      toast.error(err instanceof Error ? err.message : "Card payment confirmation failed.");
    });
  }, [
    searchParams,
    jengaResumePending,
    serviceType,
    productId,
    planId,
    displayBillingCycle,
    cartQuoteRequest,
  ]);

  if (!handoff) return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />
      <EmptyCart />
      <CheckoutFooter />
    </div>
  );

  if (quoteError && !quote && !quoteInitialLoading) {
    const deadLink = isDeadCheckoutLink(quoteError);
    return (
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <Navbar />
        <main id="main-content" className="mx-auto w-full max-w-6xl flex-1 px-4 pt-28 pb-16 md:px-6 md:pt-32 xl:px-8">
          <div role="alert">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {!deadLink
                ? "We couldn't price your order"
                : /expired/i.test(quoteError)
                  ? "This checkout link has expired"
                  : "This checkout link isn't valid"}
            </h1>
            <p className="mt-2 max-w-md text-base text-muted-foreground">
              {!deadLink
                ? quoteError
                : /expired/i.test(quoteError)
                  ? "Checkout links last a limited time so prices stay accurate. Pick your plan again and you'll be straight back here."
                  : "The link is incomplete or was changed. Pick your plan again and you'll be straight back here."}
            </p>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {deadLink ? (
              <Link
                to="/pricing"
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Choose a plan
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            ) : (
              <button
                type="button"
                onClick={retryQuote}
                className="inline-flex min-h-11 items-center rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Try again
              </button>
            )}
            <Link
              to={deadLink ? "/" : "/pricing"}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-5 text-sm font-semibold text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {deadLink ? (
                <>
                  <ArrowLeft className="size-4" aria-hidden />
                  Back to home
                </>
              ) : (
                "See all pricing"
              )}
            </Link>
          </div>
        </main>
        <CheckoutFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {showSkeleton && <CartPageSkeleton />}

      {canMountContent && (
        <main
          id="main-content"
          className={
            showSkeleton
              ? "max-w-6xl mx-auto px-4 md:px-6 xl:px-8 pt-24 md:pt-28 pb-8 invisible absolute inset-x-0 top-0 opacity-0 pointer-events-none h-0 overflow-hidden"
              : "max-w-6xl mx-auto px-4 md:px-6 xl:px-8 pt-24 md:pt-28 pb-8 animate-in fade-in duration-300"
          }
          aria-hidden={showSkeleton}
        >
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {step === 1 ? "Review your order" : "Your details"}
            </h1>
            <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Lock className="size-3.5" aria-hidden />
              {step === 1
                ? "Prices are checked and locked before you pay."
                : "Used for your nPanel account and invoices."}
            </p>
          </div>
        </div>

        <div className="mb-5">
          <CheckoutProgress current={paymentOpen ? 3 : step} />
        </div>

        {showQuoteErrorBanner && (
          <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            <p>{quoteError}</p>
            <button
              type="button"
              onClick={retryQuote}
              className="mt-3 rounded-lg border border-destructive/30 px-3 py-2 text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Retry current pricing
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px] gap-6 xl:gap-8 items-start">
          {/* ── Left column ── */}
          <div className="space-y-4">
            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.div
                  key="cart-step"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  {/* Cart item */}
                  <CartItem
                    item={cartItem}
                    onBillingCycleChange={handleBillingCycleChange}
                    onRemove={handleRemoveMainItem}
                  />

                  {isDomainTransfer && (
                    <TransferEppCodeField
                      domain={planName}
                      value={transferAuthCode}
                      onChange={setTransferAuthCode}
                    />
                  )}

                  {isDomainTransfer && (
                    <TransferNameserverChoice
                      domain={planName}
                      value={transferNameservers}
                      recommended={recommendedTransferNameservers}
                      onChange={setTransferNameserverChoice}
                    />
                  )}

                  {/* Domain upsell  for hosting buyers */}
                  {wantsDomainUpsell && (
                    <DomainUpsell
                      selectedDomain={selectedDomain}
                      onDomainSelect={(domain) => {
                        setSelectedDomain(domain);
                        if (!domain?.isTransfer) setTransferAuthCode("");
                      }}
                      transferAuthCode={transferAuthCode}
                      onTransferAuthCodeChange={setTransferAuthCode}
                    />
                  )}

                  {wantsDomainUpsell && selectedDomain?.isTransfer && (
                    <TransferNameserverChoice
                      domain={selectedDomain.domain}
                      value={transferNameservers}
                      recommended={recommendedTransferNameservers}
                      onChange={setTransferNameserverChoice}
                    />
                  )}

                  {/* Hosting upsell  for domain buyers */}
                  {wantsHostingUpsell && (
                    <div id="addon-hosting" className="scroll-mt-28">
                    <HostingUpsell
                      selectedType={selectedHostingType}
                      onSelect={handleHostingTypeSelect}
                      onPlanLoaded={handlePlanLoaded}
                      onCycleChange={handleHostingCycleChange}
                      onLoadingChange={handleHostingUpsellLoadingChange}
                      domainName={planName}
                      initialCycles={hostingCycles}
                      initialSelectedPlanIds={
                        selectedHostingType && selectedHostingPlanInfo
                          ? { [selectedHostingType]: selectedHostingPlanInfo.planId }
                          : undefined
                      }
                    />
                    </div>
                  )}

                  {isHivelocityPlan && hivelocityConfig && (
                    <HivelocityConfigStep
                      config={hivelocityConfig}
                      onChange={setHivelocityConfig}
                      onPricingContext={handleHivelocityPricingContext}
                      planName={cartItem.planName}
                    />
                  )}

                  {wantsOutreachUpsell && (
                    <div id="addon-outreach" className="scroll-mt-28">
                    <OutreachUpsell
                      selectedPlanId={selectedOutreach?.planId ?? null}
                      onSelect={setSelectedOutreach}
                      billingCycle={outreachCycle}
                      onBillingCycleChange={setOutreachCycle}
                      currency={currency as "KES" | "USD"}
                      kesToDisplayRate={quote?.fxRate ?? 1}
                      onRecommendedReady={rememberRecommendedOutreach}
                    />
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="info-step"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ duration: 0.2 }}
                >
                  <CustomerInfoStep
                    onBack={() => setStep(1)}
                    onSubmit={handleSubmit}
                    onSignedInSubmit={handleSignedInSubmit}
                    onCompleteProfile={handleCompleteProfile}
                    onCreateOrganization={handleCreateOrganization}
                    onBeforeSignIn={flushCartDraft}
                    identity={checkoutIdentity}
                  />
                  {checkoutIdentity.status !== "signed-in" && (
                    <Turnstile onToken={setCaptchaToken} resetKey={captchaResetKey} className="mt-4" />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Right column: Order summary (sticky) ── */}
          <div className="lg:sticky lg:top-24">
            <OrderSummary
              item={cartItem}
              selectedDomain={selectedDomain}
              selectedHostingPlan={selectedHostingPlan}
              hostingCycle={selectedHostingCycle}
              billingCycle={displayBillingCycle}
              onContinue={handleContinue}
              onRemoveDomain={handleRemoveDomain}
              onRemoveHostingPlan={selectedHostingType ? handleRemoveHosting : undefined}
              selectedOutreach={wantsOutreachUpsell ? selectedOutreach : null}
              outreachCycle={outreachCycle}
              onRemoveOutreach={handleRemoveOutreach}
              addonSuggestions={
                step === 1
                  ? [
                      ...(wantsHostingUpsell && !selectedHostingType
                        ? [{ id: "addon-hosting", label: "Website hosting", serviceType: "web_hosting", onAdd: addSuggestedHosting }]
                        : []),
                      ...(wantsOutreachUpsell && !selectedOutreach
                        ? [{ id: "addon-outreach", label: "Nisc Outreach", serviceType: "email_marketing", onAdd: addSuggestedOutreach }]
                        : []),
                    ]
                  : []
              }
              isContinueLoading={isSubmitting}
              step={step}
              customerFormId={detailsFormId}
              hivelocityLines={isHivelocityPlan ? [] : hivelocitySummaryLines}
              serverComponents={serverComponents}
              continueDisabled={
                (step === 1 && !canContinueStep1) ||
                quoteExpired ||
                (step === 2 && checkoutIdentity.status === "loading")
              }
              authoritativeTotals={
                quote && !quoteSummaryLoading
                  ? {
                      subtotal: quote.subtotal,
                      taxAmount: quote.taxAmount,
                      total: quote.total,
                    }
                  : undefined
              }
              quoteSummaryLoading={quoteSummaryLoading}
              currency={currency as "KES" | "USD"}
              kesToDisplayRate={quote?.fxRate ?? 1}
              quoteExpiresAt={quote?.quoteExpiresAt}
              quoteExpiresIn={quoteExpiresIn}
              quoteExpired={quoteExpired}
              onRefreshQuote={retryQuote}
              taxRate={quote?.taxRate}
            />
          </div>
        </div>

        {/* Mobile sticky total bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border px-4 py-3 flex items-center justify-between gap-4 z-30 shadow-lg">
          <div>
            <p className="text-xs text-muted-foreground">Total (incl. VAT)</p>
            {quoteSummaryLoading ? (
              <div className="h-5 w-28 bg-accent animate-pulse rounded mt-0.5" />
            ) : (
              <p className="text-base font-bold text-foreground">
                {formatCurrency(checkoutTotal, currency as "KES" | "USD")}
              </p>
            )}
          </div>
          <button
            className="flex-1 max-w-44 h-11 bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed text-primary-foreground font-bold rounded-xl text-sm transition-colors"
            form={step === 2 ? detailsFormId : undefined}
            type={step === 2 ? "submit" : "button"}
            onClick={step === 1 ? handleContinue : undefined}
            disabled={
              isSubmitting ||
              showSkeleton ||
              quoteSummaryLoading ||
              quoteExpired ||
              (step === 1 && !canContinueStep1) ||
              (step === 2 && checkoutIdentity.status === "loading")
            }
          >
            {quoteSummaryLoading
              ? "Please wait…"
              : isSubmitting
              ? "Processing…"
              : step === 1
                ? "Continue to checkout"
                : checkoutIdentity.status === "signed-in"
                  ? !checkoutIdentity.profileComplete
                    ? "Save profile"
                    : checkoutIdentity.teams.length === 0
                      ? "Create organization"
                      : "Continue to payment"
                  : "Continue to payment"}
          </button>
        </div>

        </main>
      )}

      {!showSkeleton && (
        <div className="pb-20 lg:pb-0">
          <CheckoutFooter />
        </div>
      )}

      {checkoutSession && paymentAttempt && !showSkeleton && (
        <StorefrontPaymentDialog
          open={paymentOpen}
          onOpenChange={(open) => {
            setPaymentOpen(open);
            if (!open) setPaymentAttempt(null);
          }}
          storefrontToken={checkoutSession.storefrontToken}
          defaultPhone={checkoutSession.phone}
          totalAmount={paymentAttempt.totalAmount}
          currency={paymentAttempt.currency}
          cart={paymentAttempt.cart}
          quoteToken={paymentAttempt.quoteToken}
          customerPrefill={checkoutSession.jengaCustomer}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
      {pendingInfo && (
        <CheckoutEmailCodeDialog
          open={emailCodeOpen}
          email={pendingInfo.email}
          onOpenChange={setEmailCodeOpen}
          onVerified={handleEmailVerified}
        />
      )}
      {jengaResumePending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="rounded-xl border border-border bg-card px-6 py-5 text-center shadow-lg space-y-2">
            <p className="font-medium text-foreground">Confirming card payment…</p>
            <p className="text-xs text-muted-foreground">Please wait while we create your order.</p>
          </div>
        </div>
      )}
    </div>
  );
}
