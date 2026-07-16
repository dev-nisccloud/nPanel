import * as React from "react";
import { useSearchParams, Link } from "react-router-dom";
import { ShoppingCart, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import Navbar from "@/pages/_components/Navbar.tsx";
import { TransferEppCodeField } from "./_components/TransferEppCodeField.tsx";
import { CartPageSkeleton } from "./_components/CartPageSkeleton.tsx";
import { CartItem } from "./_components/CartItem.tsx";
import { DomainUpsell } from "./_components/DomainUpsell.tsx";
import { HostingUpsell } from "./_components/HostingUpsell.tsx";
import { OrderSummary } from "./_components/OrderSummary.tsx";
import { CustomerInfoStep, CUSTOMER_INFO_FORM_ID } from "./_components/CustomerInfoStep.tsx";
import { StorefrontPaymentDialog } from "./_components/StorefrontPaymentDialog.tsx";
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
import { computeHivelocitySummaryLines } from "@/lib/vps-plans-api.ts";
import {
  checkStorefrontEmail,
  createStorefrontOrderFromPayment,
  registerStorefrontCustomer,
  resolveStorefrontProductId,
  type StorefrontCartQuoteRequest,
} from "@/lib/storefront-checkout-api.ts";
import { useStorefrontCartQuote } from "@/lib/use-storefront-cart-quote.ts";
import { serviceTypeToHivelocityProductType } from "@/lib/hivelocity-default-hostname.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const NPANEL_URL = import.meta.env.VITE_NPANEL_APP_URL ?? "https://npanel.nisccloud.com";

/** Service types that want a domain upsell */
const HOSTING_TYPES = new Set(["web_hosting", "wordpress_hosting", "email_hosting"]);

/** VPS / VDS / dedicated  require OS + hostname configuration */
const HIVELOCITY_SERVICE_TYPES = new Set(["vps", "vds", "dedicated_servers"]);

// ---------------------------------------------------------------------------
// Step indicator
// ---------------------------------------------------------------------------

const STEPS = [
  { id: 1, label: "Your cart" },
  { id: 2, label: "Your details" },
];

function StepIndicator({ current }: { current: 1 | 2 }) {
  return (
    <div className="flex items-center gap-2">
      {STEPS.map((step, idx) => (
        <React.Fragment key={step.id}>
          <div className="flex items-center gap-2">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                step.id <= current
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {step.id}
            </div>
            <span
              className={`text-sm font-medium hidden sm:block transition-colors ${
                step.id <= current ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {step.label}
            </span>
          </div>
          {idx < STEPS.length - 1 && (
            <div
              className={`flex-1 h-px mx-1 transition-colors ${
                current > step.id ? "bg-primary/50" : "bg-border"
              }`}
              style={{ minWidth: 24 }}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty cart state
// ---------------------------------------------------------------------------

function EmptyCart() {
  return (
    <div className="flex flex-col items-center justify-center pt-24 md:pt-28 pb-24 text-center px-4">
      <ShoppingCart className="w-12 h-12 text-muted-foreground/40 mb-4" />
      <h2 className="text-xl font-bold text-foreground mb-2">Your cart is empty</h2>
      <p className="text-muted-foreground mb-6 max-w-xs">
        Browse our services and select a plan to get started.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to home
      </Link>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function CartPage() {
  const [searchParams] = useSearchParams();
  const handoff = searchParams.get("h")?.trim() ?? "";

  // ---- State ----
  const [billingCycle, setBillingCycle] = React.useState<BillingCycle | null>(null);
  const billingCycleUserSetRef = React.useRef(false);
  const [selectedDomain, setSelectedDomain] = React.useState<SelectedDomain | null>(null);
  const [transferAuthCode, setTransferAuthCode] = React.useState("");
  const [selectedHostingType, setSelectedHostingType] = React.useState<HostingUpsellType | null>(null);
  const loadedHostingPlansRef = React.useRef<Partial<Record<HostingUpsellType, UpsellPlanInfo>>>({});
  const [selectedHostingPlanInfo, setSelectedHostingPlanInfo] =
    React.useState<UpsellPlanInfo | null>(null);
  const [hostingCycles, setHostingCycles] = React.useState<Partial<Record<HostingUpsellType, BillingCycle>>>({});
  const [step, setStep] = React.useState<1 | 2>(1);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [paymentOpen, setPaymentOpen] = React.useState(false);
  const [checkoutSession, setCheckoutSession] = React.useState<{
    storefrontToken: string;
    teamSlug: string;
    phone: string;
  } | null>(null);
  const [hivelocityConfig, setHivelocityConfig] = React.useState<HivelocityCheckoutConfig | null>(null);
  const [hivelocityPricing, setHivelocityPricing] = React.useState<HivelocityPricingContext | null>(
    null,
  );
  const [hostingUpsellLoading, setHostingUpsellLoading] = React.useState(true);
  const [hasRevealedPage, setHasRevealedPage] = React.useState(false);

  const handleHivelocityPricingContext = React.useCallback((ctx: HivelocityPricingContext) => {
    setHivelocityPricing(ctx);
  }, []);

  const cartQuoteRequest = React.useMemo((): StorefrontCartQuoteRequest | null => {
    if (!handoff) return null;

    const request: StorefrontCartQuoteRequest = { handoff };

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
    hivelocityConfig,
    transferAuthCode,
  ]);

  const { quote, quoteError, quoteInitialLoading, quoteRefreshing } = useStorefrontCartQuote(cartQuoteRequest);

  const serviceType = quote?.serviceType ?? "";
  const planId = quote?.planId ?? "";
  const productId = quote?.productId ?? "";
  const planName = quote?.planName ?? "Selected Plan";
  const productName = quote?.productName ?? "Nisc Cloud Service";
  const locationName = quote?.locationName ?? "";
  const currency = quote?.currency ?? "KES";

  const displayBillingCycle: BillingCycle =
    billingCycle ?? quote?.billingCycle ?? "MONTHLY";

  React.useEffect(() => {
    if (!quote?.billingCycle || billingCycleUserSetRef.current) return;
    setBillingCycle(quote.billingCycle);
  }, [quote?.billingCycle]);

  const hivelocityProductType = serviceTypeToHivelocityProductType(serviceType);
  const isHivelocityPlan = HIVELOCITY_SERVICE_TYPES.has(serviceType) && Boolean(hivelocityProductType);

  React.useEffect(() => {
    if (!quote || !isHivelocityPlan || !hivelocityProductType) {
      setHivelocityConfig(null);
      return;
    }
    const productIdNum = Number(quote.planId);
    if (!Number.isFinite(productIdNum) || productIdNum <= 0) return;
    setHivelocityConfig((prev) =>
      prev ??
      createInitialHivelocityConfig({
        productType: hivelocityProductType,
        hivelocityProductId: productIdNum,
        locationName: quote.locationName || "MAIN",
      }),
    );
  }, [quote, isHivelocityPlan, hivelocityProductType]);

  const wantsDomainUpsell = HOSTING_TYPES.has(serviceType);
  const wantsHostingUpsell =
    serviceType === "domain_registration" || serviceType === "domain_transfer";
  const isDomainTransfer = serviceType === "domain_transfer";

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
    ? { ...selectedHostingPlanInfo }
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

  const handleHostingCycleChange = React.useCallback(
    (type: HostingUpsellType, cycle: BillingCycle) => {
      setHostingCycles((prev) => ({ ...prev, [type]: cycle }));
    },
    [],
  );

  const cartItem: CartItemData = {
    planName,
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

  const handleContinue = () => {
    if (step === 1) {
      setStep(2);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

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

  const quoteSummaryLoading = quoteRefreshing;

  const canContinueStep1 = React.useMemo(() => {
    if (quoteInitialLoading || !quote || quoteSummaryLoading) return false;
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
    isDomainTransfer,
    transferAuthCode,
    selectedDomain,
    isHivelocityPlan,
    hivelocityConfig,
    hivelocityConfigComplete,
    hivelocityPricing,
  ]);

  const showQuoteErrorBanner = Boolean(
    quoteError &&
    !quoteSummaryLoading &&
    (!isHivelocityPlan || hivelocityConfigComplete),
  );

  const checkoutTotal = quote?.total ?? 0;

  const resolvePrimaryDomain = (): string | undefined => {
    if (serviceType === "domain_registration" || serviceType === "domain_transfer") return planName;
    // Existing domains name the hosting subscription; purchased domains also link hosting to that name.
    if (selectedDomain?.domain) return selectedDomain.domain;
    return undefined;
  };

  const handleSubmit = async (info: CustomerInfo) => {
    setIsSubmitting(true);
    try {
      const exists = await checkStorefrontEmail(info.email);
      if (exists) {
        toast.error(
          "An account with this email already exists. Sign in to nPanel to complete your purchase.",
        );
        return;
      }

      const reg = await registerStorefrontCustomer({
        firstName: info.firstName,
        lastName: info.lastName,
        email: info.email,
        phone: info.phone,
        companyName: info.companyName,
        password: info.password,
        acceptedTermsAndConditions: true,
        planName,
      });

      setCheckoutSession({
        storefrontToken: reg.storefrontToken,
        teamSlug: reg.teamSlug,
        phone: info.phone,
      });
      setPaymentOpen(true);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create your account. Please try again.",
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
    });

    toast.success(`Order ${order.orderNumber} confirmed! Redirecting to your dashboard…`);
    window.location.href = `${NPANEL_URL}/${order.teamSlug}/dashboard`;
  };

  if (!handoff) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <EmptyCart />
    </div>
  );

  if (quoteError && !quote && !quoteInitialLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-5xl mx-auto px-4 md:px-6 pt-24 md:pt-28 pb-8">
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {quoteError}
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium text-sm mt-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {showSkeleton && <CartPageSkeleton />}

      {canMountContent && (
        <main
          className={
            showSkeleton
              ? "max-w-5xl mx-auto px-4 md:px-6 pt-24 md:pt-28 pb-8 invisible absolute inset-x-0 top-0 opacity-0 pointer-events-none h-0 overflow-hidden"
              : "max-w-5xl mx-auto px-4 md:px-6 pt-24 md:pt-28 pb-8 animate-in fade-in duration-300"
          }
          aria-hidden={showSkeleton}
        >
        {/* Step breadcrumb  lives in content, not in header */}
        <div className="mb-6">
          <StepIndicator current={step} />
        </div>

        {/* Page title */}
        <h1 className="text-2xl font-bold text-foreground mb-6">
          {step === 1 ? "Your cart" : "Your details"}
        </h1>

        {showQuoteErrorBanner && (
          <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {quoteError}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
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
                  />

                  {isDomainTransfer && (
                    <TransferEppCodeField
                      domain={planName}
                      value={transferAuthCode}
                      onChange={setTransferAuthCode}
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

                  {/* Hosting upsell  for domain buyers */}
                  {wantsHostingUpsell && (
                    <HostingUpsell
                      selectedType={selectedHostingType}
                      onSelect={handleHostingTypeSelect}
                      onPlanLoaded={handlePlanLoaded}
                      onCycleChange={handleHostingCycleChange}
                      onLoadingChange={handleHostingUpsellLoadingChange}
                      domainName={planName}
                    />
                  )}

                  {isHivelocityPlan && hivelocityConfig && (
                    <HivelocityConfigStep
                      config={hivelocityConfig}
                      onChange={setHivelocityConfig}
                      onPricingContext={handleHivelocityPricingContext}
                    />
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
                  />
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
              onRemoveDomain={() => setSelectedDomain(null)}
              onRemoveHostingPlan={selectedHostingType ? () => handleHostingTypeSelect(null) : undefined}
              isContinueLoading={isSubmitting}
              step={step}
              customerFormId={CUSTOMER_INFO_FORM_ID}
              hivelocityLines={isHivelocityPlan ? [] : hivelocitySummaryLines}
              continueDisabled={step === 1 && !canContinueStep1}
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
            />
          </div>
        </div>

        {/* Mobile sticky total bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border px-4 py-3 flex items-center justify-between gap-4 z-30 shadow-lg">
          <div>
            <p className="text-xs text-muted-foreground">Total (incl. VAT)</p>
            {quoteSummaryLoading ? (
              <div className="h-5 w-28 bg-accent animate-pulse rounded mt-0.5" />
            ) : (
              <p className="text-base font-bold text-foreground">
                KES {checkoutTotal.toLocaleString()}
              </p>
            )}
          </div>
          <button
            className="flex-1 max-w-44 h-11 bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed text-primary-foreground font-bold rounded-xl text-sm transition-colors"
            form={step === 2 ? CUSTOMER_INFO_FORM_ID : undefined}
            type={step === 2 ? "submit" : "button"}
            onClick={step === 1 ? handleContinue : undefined}
            disabled={isSubmitting || showSkeleton || quoteSummaryLoading || (step === 1 && !canContinueStep1)}
          >
            {quoteSummaryLoading
              ? "Please wait…"
              : isSubmitting
              ? "Processing…"
              : step === 1
                ? "Continue →"
                : "Complete Order"}
          </button>
        </div>

        {/* Bottom padding for mobile sticky bar */}
        <div className="h-20 lg:h-0" />
        </main>
      )}

      {checkoutSession && cartQuoteRequest && !showSkeleton && (
        <StorefrontPaymentDialog
          open={paymentOpen}
          onOpenChange={setPaymentOpen}
          storefrontToken={checkoutSession.storefrontToken}
          defaultPhone={checkoutSession.phone}
          totalAmount={checkoutTotal}
          cart={cartQuoteRequest}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
