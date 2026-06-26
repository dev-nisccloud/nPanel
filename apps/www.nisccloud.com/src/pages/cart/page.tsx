import * as React from "react";
import { useSearchParams, Link } from "react-router-dom";
import { ShoppingCart, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
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
import { computeCartCheckoutTotal } from "@/lib/cart-checkout-total.ts";
import { computeHivelocitySummaryLines } from "@/lib/vps-plans-api.ts";
import {
  checkStorefrontEmail,
  createStorefrontOrderFromPayment,
  registerStorefrontCustomer,
  resolveStorefrontProductId,
} from "@/lib/storefront-checkout-api.ts";
import { serviceTypeToHivelocityProductType } from "@/lib/hivelocity-default-hostname.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const NPANEL_URL = import.meta.env.VITE_NPANEL_APP_URL ?? "https://npanel.nisccloud.com";

/** Service types that want a domain upsell */
const HOSTING_TYPES = new Set(["web_hosting", "wordpress_hosting", "email_hosting"]);

/** VPS / VDS / dedicated — require OS + hostname configuration */
const HIVELOCITY_SERVICE_TYPES = new Set(["vps", "vds", "dedicated_servers"]);

function parsePrice(raw: string | null, fallback: number): number {
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

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
// Minimal cart header — logo only, no step indicator
// ---------------------------------------------------------------------------

function CartHeader() {
  return (
    <header className="bg-white border-b border-border sticky top-0 z-20">
      <div className="max-w-5xl mx-auto px-4 md:px-6 h-16 flex items-center">
        <Link to="/" className="shrink-0">
          <img
            src="/nisccloud-logo.svg"
            alt="Nisc Cloud"
            className="h-14 w-auto object-contain"
          />
        </Link>
      </div>
    </header>
  );
}

// ---------------------------------------------------------------------------
// Empty cart state
// ---------------------------------------------------------------------------

function EmptyCart() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center px-4">
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
  const [searchParams, setSearchParams] = useSearchParams();

  // ---- Read URL params ----
  const serviceType = searchParams.get("serviceType") ?? "";
  const planId = searchParams.get("planId") ?? "";
  const productId = searchParams.get("productId") ?? "";
  const planName = searchParams.get("planName") ?? "Selected Plan";
  const productName = searchParams.get("productName") ?? "Nisc Cloud Service";
  const locationName = searchParams.get("locationName") ?? "";
  const currency = searchParams.get("currency") ?? "KES";
  const rawMonthly = searchParams.get("monthlyPrice");
  const rawYearly = searchParams.get("yearlyPrice");
  const initialCycle = (searchParams.get("billingCycle") as BillingCycle | null) ?? "MONTHLY";

  const monthlyPrice = parsePrice(rawMonthly, 0);
  const yearlyPrice = parsePrice(rawYearly, Math.round(monthlyPrice * 12 * 0.8));

  // ---- State ----
  const [billingCycle, setBillingCycle] = React.useState<BillingCycle>(initialCycle);
  const [selectedDomain, setSelectedDomain] = React.useState<SelectedDomain | null>(null);
  const [selectedHostingType, setSelectedHostingType] = React.useState<HostingUpsellType | null>(null);
  const [loadedHostingPlans, setLoadedHostingPlans] = React.useState<Partial<Record<HostingUpsellType, UpsellPlanInfo>>>({});
  const [hostingCycles, setHostingCycles] = React.useState<Partial<Record<HostingUpsellType, BillingCycle>>>({});
  const [step, setStep] = React.useState<1 | 2>(1);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [paymentOpen, setPaymentOpen] = React.useState(false);
  const [checkoutSession, setCheckoutSession] = React.useState<{
    storefrontToken: string;
    teamSlug: string;
    phone: string;
  } | null>(null);

  const hivelocityProductType = serviceTypeToHivelocityProductType(serviceType);
  const isHivelocityPlan = HIVELOCITY_SERVICE_TYPES.has(serviceType) && Boolean(hivelocityProductType);

  const [hivelocityConfig, setHivelocityConfig] = React.useState<HivelocityCheckoutConfig | null>(() => {
    if (!HIVELOCITY_SERVICE_TYPES.has(serviceType)) return null;
    const productType = serviceTypeToHivelocityProductType(serviceType);
    const productIdNum = Number(planId);
    if (!productType || !Number.isFinite(productIdNum) || productIdNum <= 0) return null;
    return createInitialHivelocityConfig({
      productType,
      hivelocityProductId: productIdNum,
      locationName: locationName || "MAIN",
    });
  });

  React.useEffect(() => {
    if (!isHivelocityPlan || !hivelocityProductType) {
      setHivelocityConfig(null);
      return;
    }
    const productIdNum = Number(planId);
    if (!Number.isFinite(productIdNum) || productIdNum <= 0) return;
    setHivelocityConfig(
      createInitialHivelocityConfig({
        productType: hivelocityProductType,
        hivelocityProductId: productIdNum,
        locationName: locationName || "MAIN",
      }),
    );
  }, [isHivelocityPlan, hivelocityProductType, planId, locationName]);

  const [hivelocityPricing, setHivelocityPricing] = React.useState<HivelocityPricingContext | null>(
    null,
  );

  const handleHivelocityPricingContext = React.useCallback((ctx: HivelocityPricingContext) => {
    setHivelocityPricing(ctx);
  }, []);

  // ---- Derived ----
  const hasValidPlan = Boolean(planName && (monthlyPrice > 0 || yearlyPrice > 0));
  const wantsDomainUpsell = HOSTING_TYPES.has(serviceType);
  const wantsHostingUpsell = serviceType === "domain_registration";

  const selectedHostingPlan: SelectedHostingPlan | null =
    selectedHostingType && loadedHostingPlans[selectedHostingType]
      ? { ...loadedHostingPlans[selectedHostingType]! }
      : null;

  const selectedHostingCycle: BillingCycle =
    selectedHostingType ? (hostingCycles[selectedHostingType] ?? "MONTHLY") : "MONTHLY";

  const handlePlanLoaded = React.useCallback(
    (type: HostingUpsellType, plan: UpsellPlanInfo | null) => {
      if (!plan) return;
      setLoadedHostingPlans((prev) => ({ ...prev, [type]: plan }));
    },
    [],
  );

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
    billingCycle,
  };

  // Keep billingCycle in sync with URL param updates (from external sources)
  React.useEffect(() => {
    setBillingCycle(initialCycle);
  }, [initialCycle]);

  const handleBillingCycleChange = (cycle: BillingCycle) => {
    setBillingCycle(cycle);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("billingCycle", cycle);
      return next;
    }, { replace: true });
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

  const canContinueStep1 = React.useMemo(() => {
    if (!isHivelocityPlan) return true;
    if (!hivelocityPricing || hivelocityPricing.loading) return false;
    if (hivelocityPricing.loadError) return false;
    if (!hivelocityConfig || !isHivelocityConfigComplete(hivelocityConfig)) return false;
    if (!hivelocityPricing.selectionValid) return false;
    return true;
  }, [isHivelocityPlan, hivelocityConfig, hivelocityPricing]);

  const checkoutTotal = React.useMemo(
    () =>
      computeCartCheckoutTotal({
        monthlyPrice,
        yearlyPrice,
        billingCycle,
        selectedDomain,
        selectedHostingPlan,
        hostingCycle: selectedHostingCycle,
        hivelocityLines: hivelocitySummaryLines,
      }),
    [
      monthlyPrice,
      yearlyPrice,
      billingCycle,
      selectedDomain,
      selectedHostingPlan,
      selectedHostingCycle,
      hivelocitySummaryLines,
    ],
  );

  const resolvePrimaryDomain = (): string | undefined => {
    if (serviceType === "domain_registration") return planName;
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

    const resolvedProductId = resolveStorefrontProductId(serviceType, productId);
    if (!resolvedProductId) {
      throw new Error("Missing product configuration. Please go back and select a plan again.");
    }

    const order = await createStorefrontOrderFromPayment({
      storefrontToken: checkoutSession.storefrontToken,
      checkoutRequestId,
      planId: planId || undefined,
      productId: resolvedProductId,
      billingCycle,
      primaryDomain: resolvePrimaryDomain(),
    });

    toast.success(`Order ${order.orderNumber} confirmed! Redirecting to your dashboard…`);
    window.location.href = `${NPANEL_URL}/${order.teamSlug}/dashboard`;
  };

  if (!hasValidPlan) return (
    <div className="min-h-screen bg-gray-50">
      <CartHeader />
      <EmptyCart />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <CartHeader />

      <main className="max-w-5xl mx-auto px-4 md:px-6 py-8">
        {/* Step breadcrumb — lives in content, not in header */}
        <div className="mb-5">
          <StepIndicator current={step} />
        </div>

        {/* Page title */}
        <h1 className="text-2xl font-bold text-foreground mb-6">
          {step === 1 ? "Your cart" : "Your details"}
        </h1>

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
                    item={{ ...cartItem, billingCycle }}
                    onBillingCycleChange={handleBillingCycleChange}
                  />

                  {/* Domain upsell — for hosting buyers */}
                  {wantsDomainUpsell && (
                    <DomainUpsell
                      selectedDomain={selectedDomain}
                      onDomainSelect={setSelectedDomain}
                    />
                  )}

                  {/* Hosting upsell — for domain buyers */}
                  {wantsHostingUpsell && (
                    <HostingUpsell
                      selectedType={selectedHostingType}
                      onSelect={setSelectedHostingType}
                      onPlanLoaded={handlePlanLoaded}
                      onCycleChange={handleHostingCycleChange}
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
                    isSubmitting={isSubmitting}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Right column: Order summary (sticky) ── */}
          <div className="lg:sticky lg:top-24">
            <OrderSummary
              item={{ ...cartItem, billingCycle }}
              selectedDomain={selectedDomain}
              selectedHostingPlan={selectedHostingPlan}
              hostingCycle={selectedHostingCycle}
              billingCycle={billingCycle}
              onContinue={handleContinue}
              onRemoveDomain={() => setSelectedDomain(null)}
              onRemoveHostingPlan={selectedHostingType ? () => setSelectedHostingType(null) : undefined}
              isContinueLoading={isSubmitting}
              step={step}
              customerFormId={CUSTOMER_INFO_FORM_ID}
              hivelocityLines={hivelocitySummaryLines}
              continueDisabled={step === 1 && !canContinueStep1}
            />
          </div>
        </div>

        {/* Mobile sticky total bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border px-4 py-3 flex items-center justify-between gap-4 z-30 shadow-lg">
          <div>
            <p className="text-xs text-muted-foreground">Total (incl. VAT)</p>
            <p className="text-base font-bold text-foreground">
              KES {checkoutTotal.total.toLocaleString()}
            </p>
          </div>
          <button
            className="flex-1 max-w-44 h-11 bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed text-primary-foreground font-bold rounded-xl text-sm transition-colors"
            form={step === 2 ? CUSTOMER_INFO_FORM_ID : undefined}
            type={step === 2 ? "submit" : "button"}
            onClick={step === 1 ? handleContinue : undefined}
            disabled={isSubmitting || (step === 1 && !canContinueStep1)}
          >
            {isSubmitting
              ? "Creating account…"
              : step === 1
                ? "Continue →"
                : "Complete Order"}
          </button>
        </div>

        {/* Bottom padding for mobile sticky bar */}
        <div className="h-20 lg:h-0" />
      </main>

      {checkoutSession && (
        <StorefrontPaymentDialog
          open={paymentOpen}
          onOpenChange={setPaymentOpen}
          storefrontToken={checkoutSession.storefrontToken}
          defaultPhone={checkoutSession.phone}
          totalAmount={checkoutTotal.total}
          planId={planId || undefined}
          billingCycle={billingCycle}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
