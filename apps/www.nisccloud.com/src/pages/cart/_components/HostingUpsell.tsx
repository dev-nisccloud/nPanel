import * as React from "react";
import { Check, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { cn } from "@/lib/utils.ts";
import type { BillingCycle } from "./CartItem.tsx";
import {
  fetchSharedHostingPlansPublic,
  fetchWordPressHostingPlansPublic,
  fetchEmailHostingPlansPublic,
  type SharedHostingPricingData,
} from "@/lib/vps-plans-api.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type HostingUpsellType = "web_hosting" | "wordpress_hosting" | "email_hosting";

export interface UpsellPlanInfo {
  planId: string;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
}

interface HostingUpsellProps {
  selectedType: HostingUpsellType | null;
  onSelect: (type: HostingUpsellType | null) => void;
  /** Called whenever live plan data is loaded for a slot */
  onPlanLoaded?: (type: HostingUpsellType, plan: UpsellPlanInfo | null) => void;
  /** Called when the user changes the billing cycle for a plan */
  onCycleChange?: (type: HostingUpsellType, cycle: BillingCycle) => void;
  /** Called when async plan fetch completes (loading → false). */
  onLoadingChange?: (loading: boolean) => void;
  domainName?: string;
}

// ---------------------------------------------------------------------------
// Inline SVG icons — exact same paths as the nPanel dashboard Icons component
// ---------------------------------------------------------------------------

function HostingIcon({ className }: { className?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M19.3198 10.7498H4.68977C2.79977 10.7498 1.25977 9.20978 1.25977 7.31978V4.68977C1.25977 2.79977 2.79977 1.25977 4.68977 1.25977H19.3198C21.2098 1.25977 22.7498 2.79977 22.7498 4.68977V7.31978C22.7498 9.20978 21.2098 10.7498 19.3198 10.7498ZM4.67976 2.74977C3.60976 2.74977 2.74977 3.61976 2.74977 4.67976V7.30977C2.74977 8.37977 3.61976 9.23978 4.67976 9.23978H19.3098C20.3798 9.23978 21.2398 8.36977 21.2398 7.30977V4.67976C21.2398 3.60976 20.3698 2.74977 19.3098 2.74977H4.67976Z" />
      <path d="M19.3198 22.7498H4.68977C2.79977 22.7498 1.25977 21.2098 1.25977 19.3198V16.6898C1.25977 14.7998 2.79977 13.2598 4.68977 13.2598H19.3198C21.2098 13.2598 22.7498 14.7998 22.7498 16.6898V19.3198C22.7498 21.2098 21.2098 22.7498 19.3198 22.7498ZM4.67976 14.7498C3.60976 14.7498 2.74977 15.6198 2.74977 16.6798V19.3098C2.74977 20.3798 3.61976 21.2398 4.67976 21.2398H19.3098C20.3798 21.2398 21.2398 20.3698 21.2398 19.3098V16.6798C21.2398 15.6098 20.3698 14.7498 19.3098 14.7498H4.67976Z" />
      <path d="M6 7.75C5.59 7.75 5.25 7.41 5.25 7V5C5.25 4.59 5.59 4.25 6 4.25C6.41 4.25 6.75 4.59 6.75 5V7C6.75 7.41 6.41 7.75 6 7.75Z" />
      <path d="M10 7.75C9.59 7.75 9.25 7.41 9.25 7V5C9.25 4.59 9.59 4.25 10 4.25C10.41 4.25 10.75 4.59 10.75 5V7C10.75 7.41 10.41 7.75 10 7.75Z" />
      <path d="M6 19.75C5.59 19.75 5.25 19.41 5.25 19V17C5.25 16.59 5.59 16.25 6 16.25C6.41 16.25 6.75 16.59 6.75 17V19C6.75 19.41 6.41 19.75 6 19.75Z" />
      <path d="M10 19.75C9.59 19.75 9.25 19.41 9.25 19V17C9.25 16.59 9.59 16.25 10 16.25C10.41 16.25 10.75 16.59 10.75 17V19C10.75 19.41 10.41 19.75 10 19.75Z" />
      <path d="M18 6.75H14C13.59 6.75 13.25 6.41 13.25 6C13.25 5.59 13.59 5.25 14 5.25H18C18.41 5.25 18.75 5.59 18.75 6C18.75 6.41 18.41 6.75 18 6.75Z" />
      <path d="M18 18.75H14C13.59 18.75 13.25 18.41 13.25 18C13.25 17.59 13.59 17.25 14 17.25H18C18.41 17.25 18.75 17.59 18.75 18C18.75 18.41 18.41 18.75 18 18.75Z" />
    </svg>
  );
}

function WordPressIcon({ className }: { className?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M21.469 6.825c.84 1.537 1.318 3.3 1.318 5.175 0 3.979-2.156 7.456-5.363 9.325l3.295-9.527c.615-1.54.82-2.771.82-3.864 0-.405-.026-.78-.07-1.11m-7.981.105c.647-.03 1.232-.105 1.232-.105.582-.075.514-.93-.067-.899 0 0-1.755.135-2.88.135-1.064 0-2.85-.15-2.85-.15-.585-.03-.661.855-.075.885 0 0 .54.061 1.125.09l1.68 4.605-2.37 7.08L5.354 6.9c.649-.03 1.234-.1 1.234-.1.585-.075.516-.93-.065-.896 0 0-1.746.138-2.874.138-.2 0-.438-.008-.69-.015C4.911 3.15 8.235 1.215 12 1.215c2.809 0 5.365 1.072 7.286 2.833-.046-.003-.091-.009-.141-.009-1.06 0-1.812.923-1.812 1.914 0 .89.513 1.643 1.06 2.531.411.72.89 1.643.89 2.977 0 .915-.354 1.994-.821 3.479l-1.075 3.585-3.9-11.61.001.014zM12 22.784c-1.059 0-2.081-.153-3.048-.437l3.237-9.406 3.315 9.087c.024.053.05.101.078.149-1.12.393-2.325.609-3.582.609M1.211 12c0-1.564.336-3.05.935-4.39L7.29 21.709C3.694 19.96 1.212 16.271 1.211 12M12 0C5.385 0 0 5.385 0 12s5.385 12 12 12 12-5.385 12-12S18.615 0 12 0" />
    </svg>
  );
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17 21.25H7C3.35 21.25 1.25 19.15 1.25 15.5V8.5C1.25 4.85 3.35 2.75 7 2.75H12C12.41 2.75 12.75 3.09 12.75 3.5C12.75 3.91 12.41 4.25 12 4.25H7C4.14 4.25 2.75 5.64 2.75 8.5V15.5C2.75 18.36 4.14 19.75 7 19.75H17C19.86 19.75 21.25 18.36 21.25 15.5V11.5C21.25 11.09 21.59 10.75 22 10.75C22.41 10.75 22.75 11.09 22.75 11.5V15.5C22.75 19.15 20.65 21.25 17 21.25Z" />
      <path d="M11.9998 12.8707C11.1598 12.8707 10.3098 12.6108 9.65978 12.0808L6.52978 9.58076C6.20978 9.32076 6.14978 8.85075 6.40978 8.53075C6.66978 8.21075 7.13977 8.15076 7.45977 8.41076L10.5898 10.9108C11.3498 11.5208 12.6398 11.5208 13.3998 10.9108C13.7198 10.6508 14.1898 10.7008 14.4498 11.0308C14.7098 11.3508 14.6598 11.8308 14.3298 12.0808C13.6898 12.6108 12.8398 12.8707 11.9998 12.8707Z" />
      <path d="M16.7402 9.75023C16.3302 9.75023 16.0502 9.61022 15.8702 9.48022C15.5402 9.24022 15.0302 8.64024 15.3302 7.32024L15.3802 7.11023C15.4002 7.03023 15.3402 6.84023 15.2902 6.78023L14.9402 6.43022C14.3502 5.83022 14.1202 5.13023 14.3202 4.50023C14.5202 3.88023 15.1102 3.44023 15.9402 3.30023L16.3202 3.24023C16.3902 3.22023 16.5302 3.12023 16.5702 3.05023L16.8502 2.48022C17.2402 1.69022 17.8402 1.24023 18.5002 1.24023C19.1602 1.24023 19.7602 1.69022 20.1502 2.48022L20.4302 3.05023C20.4602 3.11023 20.6102 3.22023 20.6802 3.24023L21.0602 3.30023C21.8902 3.44023 22.4802 3.88023 22.6802 4.50023C22.8802 5.12023 22.6602 5.82022 22.0602 6.43022L21.7102 6.78023C21.6602 6.84023 21.6002 7.03023 21.6202 7.11023L21.6702 7.32024C21.9702 8.64024 21.4602 9.24022 21.1302 9.48022C20.8002 9.72022 20.0802 10.0102 18.9302 9.32024L18.6802 9.17023C18.6102 9.13023 18.4102 9.13023 18.3402 9.17023L18.0802 9.32024C17.5402 9.64024 17.0902 9.75023 16.7402 9.75023Z" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Slot definitions (static metadata per service type)
// ---------------------------------------------------------------------------

interface UpsellSlot {
  id: HostingUpsellType;
  label: string;
  tagline: string;
  icon: React.ReactNode;
  fetch: () => Promise<SharedHostingPricingData>;
}

const SLOTS: UpsellSlot[] = [
  {
    id: "web_hosting",
    label: "Website Hosting",
    tagline: "Build and host a fast, professional website",
    icon: <HostingIcon />,
    fetch: fetchSharedHostingPlansPublic,
  },
  {
    id: "wordpress_hosting",
    label: "WordPress Hosting",
    tagline: "Optimised servers for WordPress sites",
    icon: <WordPressIcon />,
    fetch: fetchWordPressHostingPlansPublic,
  },
  {
    id: "email_hosting",
    label: "Professional Email",
    tagline: "Get email at your own domain",
    icon: <MailIcon />,
    fetch: fetchEmailHostingPlansPublic,
  },
];

// Static fallback features per type (used when API returns no feature data)
const FALLBACK_FEATURES: Record<HostingUpsellType, FeatureRow[]> = {
  web_hosting: [
    { label: "Websites", value: "Up to 3" },
    { label: "SSD storage", value: "20 GB" },
    { label: "SSL certificate", value: null },
    { label: "Uptime guarantee", value: "99.9%" },
  ],
  wordpress_hosting: [
    { label: "WordPress pre-installed", value: null },
    { label: "Auto-updates & backups", value: null },
    { label: "SSL certificate", value: null },
    { label: "Performance cache", value: null },
  ],
  email_hosting: [
    { label: "Mailbox storage", value: "5 GB" },
    { label: "Spam & virus protection", value: null },
    { label: "Webmail & mobile sync", value: null },
    { label: "Custom domain address", value: null },
  ],
};

// ---------------------------------------------------------------------------
// Internal plan data structure
// ---------------------------------------------------------------------------

interface FeatureRow {
  label: string;
  value: string | null; // null = show checkmark; string = show value
}

interface LivePlan {
  planId: string;
  name: string;
  productName: string;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  features: FeatureRow[];
  isRecommended: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildLivePlan(
  pick: SharedHostingPricingData["plans"][number],
  yearlyPick: SharedHostingPricingData["plans"][number] | undefined,
  data: SharedHostingPricingData,
  type: HostingUpsellType,
): LivePlan {
  const monthlyPrice = parseFloat(pick.niscPrice ?? "0") || 0;
  const yearlyPrice = yearlyPick
    ? parseFloat(yearlyPick.niscPrice ?? "0") || 0
    : Math.round(monthlyPrice * 12 * 0.8);

  const feats: FeatureRow[] =
    data.productFeatures.length && pick.featureValues.length
      ? data.productFeatures
          .map((f, i) => {
            const cell = pick.featureValues[i];
            if (!cell?.available) return null;
            return {
              label: f.label,
              value: cell.valueOverride != null && cell.valueOverride !== "" ? cell.valueOverride : null,
            };
          })
          .filter((f): f is FeatureRow => f !== null)
          .slice(0, 5)
      : [];

  return {
    planId: pick.id,
    name: pick.name,
    productName: pick.productName,
    monthlyPrice,
    yearlyPrice,
    currency: pick.niscCurrency || "KES",
    features: feats.length ? feats : FALLBACK_FEATURES[type],
    isRecommended: pick.isRecommended || pick.isPopular,
  };
}

function buildAllLivePlans(data: SharedHostingPricingData, type: HostingUpsellType): LivePlan[] {
  const monthly = data.plans.filter((p) => p.billingCycle === "MONTHLY");
  const yearly = data.plans.filter((p) => p.billingCycle === "YEARLY");
  const pool = monthly.length ? monthly : data.plans;
  if (!pool.length) return [];

  return pool.map((pick) => {
    const yearlyPick = yearly.find((p) => p.name === pick.name);
    return buildLivePlan(pick, yearlyPick, data, type);
  });
}

function toUpsellPlanInfo(plan: LivePlan): UpsellPlanInfo {
  return {
    planId: plan.planId,
    name: plan.name,
    monthlyPrice: plan.monthlyPrice,
    yearlyPrice: plan.yearlyPrice,
    currency: plan.currency,
  };
}

function fmt(amount: number, currency: string) {
  return `${currency} ${amount.toLocaleString("en-KE")}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function HostingUpsell({ selectedType, onSelect, onPlanLoaded, onCycleChange, onLoadingChange, domainName }: HostingUpsellProps) {
  const [plansCatalog, setPlansCatalog] = React.useState<
    Partial<Record<HostingUpsellType, LivePlan[]>>
  >({});
  const [selectedPlanId, setSelectedPlanId] = React.useState<
    Partial<Record<HostingUpsellType, string>>
  >({});
  const [showAllPlans, setShowAllPlans] = React.useState<
    Partial<Record<HostingUpsellType, boolean>>
  >({});
  const [loading, setLoading] = React.useState(true);
  const [cycles, setCycles] = React.useState<Partial<Record<HostingUpsellType, BillingCycle>>>({});
  const notifyRef = React.useRef(onPlanLoaded);
  notifyRef.current = onPlanLoaded;
  const cycleNotifyRef = React.useRef(onCycleChange);
  cycleNotifyRef.current = onCycleChange;

  const handleCycleChange = (type: HostingUpsellType, cycle: BillingCycle) => {
    setCycles((prev) => ({ ...prev, [type]: cycle }));
    cycleNotifyRef.current?.(type, cycle);
  };

  const getCycle = (type: HostingUpsellType): BillingCycle => cycles[type] ?? "YEARLY";

  const getActivePlan = React.useCallback(
    (type: HostingUpsellType): LivePlan | undefined => {
      const catalog = plansCatalog[type];
      if (!catalog?.length) return undefined;
      const pickedId = selectedPlanId[type];
      if (pickedId) return catalog.find((p) => p.planId === pickedId);
      return catalog.find((p) => p.isRecommended) ?? catalog[0];
    },
    [plansCatalog, selectedPlanId],
  );

  const handlePlanPick = (type: HostingUpsellType, plan: LivePlan) => {
    setSelectedPlanId((prev) => ({ ...prev, [type]: plan.planId }));
    notifyRef.current?.(type, toUpsellPlanInfo(plan));
  };

  const handleSelectType = (type: HostingUpsellType, isCurrentlySelected: boolean) => {
    if (isCurrentlySelected) {
      onSelect(null);
      return;
    }

    const defaultCycle = cycles[type] ?? "YEARLY";
    if (!cycles[type]) handleCycleChange(type, defaultCycle);

    const plan = getActivePlan(type);
    if (plan) {
      setSelectedPlanId((prev) => ({ ...prev, [type]: plan.planId }));
      notifyRef.current?.(type, toUpsellPlanInfo(plan));
    }

    onSelect(type);
  };

  React.useEffect(() => {
    let active = true;
    setLoading(true);

    Promise.allSettled(
      SLOTS.map((s) =>
        s.fetch().then((data) => ({
          id: s.id as HostingUpsellType,
          plans: buildAllLivePlans(data, s.id),
        })),
      ),
    ).then((results) => {
      if (!active) return;
      const nextCatalog: Partial<Record<HostingUpsellType, LivePlan[]>> = {};
      const nextSelected: Partial<Record<HostingUpsellType, string>> = {};

      for (const r of results) {
        if (r.status !== "fulfilled") continue;
        const { id, plans } = r.value;
        if (!plans.length) {
          notifyRef.current?.(id, null);
          continue;
        }
        nextCatalog[id] = plans;
        const best = plans.find((p) => p.isRecommended) ?? plans[0];
        nextSelected[id] = best.planId;
        notifyRef.current?.(id, toUpsellPlanInfo(best));
      }

      setPlansCatalog(nextCatalog);
      setSelectedPlanId(nextSelected);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  React.useEffect(() => {
    onLoadingChange?.(loading);
  }, [loading, onLoadingChange]);

  return (
    <div className="bg-white border border-border rounded-2xl p-5 shadow-sm">
      <h3 className="text-base font-bold text-foreground mb-1">
        Turn your domain into a website
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        Add hosting to go live right away. Pick one, you can always upgrade later.
      </p>
      {/* <p className="text-sm text-muted-foreground mb-4">
        {domainName
          ? `Get ${domainName} free for the 1st year with any hosting plan below.`
          : "Add hosting to go live right away. Pick one — you can always upgrade later."}
      </p> */}

      {/* Single "Recommended for you" badge — shown once at top if any plan is recommended */}
      {!loading && Object.values(plansCatalog).some((list) => list?.some((p) => p.isRecommended)) && (
        <div className="mb-3 flex items-center gap-2">
          <Badge className="bg-primary/10 text-primary border-primary/20 text-xs font-medium px-2.5 py-0.5">
            ⭐ Recommended for you
          </Badge>
          <span className="text-xs text-muted-foreground">
            {SLOTS.find((s) => plansCatalog[s.id]?.some((p) => p.isRecommended))?.label} highlighted below
          </span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 py-6 justify-center text-muted-foreground text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading hosting plans…
        </div>
      ) : (
        <div className="space-y-3">
          {SLOTS.map((slot) => {
            const catalog = plansCatalog[slot.id] ?? [];
            const plan = getActivePlan(slot.id);
            const isSelected = selectedType === slot.id;
            const isRecommended = plan?.isRecommended ?? false;
            const features = plan?.features ?? FALLBACK_FEATURES[slot.id];
            const otherPlansCount = catalog.length > 1 ? catalog.length - 1 : 0;
            const isExpanded = Boolean(showAllPlans[slot.id]);

            return (
              <div
                key={slot.id}
                className={cn(
                  "rounded-xl border-2 p-4 cursor-pointer transition-all",
                  isSelected
                    ? "border-primary bg-primary/5"
                    : isRecommended
                      ? "border-primary/30 hover:border-primary/60 bg-primary/[0.02]"
                      : "border-border hover:border-primary/40 bg-white",
                )}
                onClick={() => handleSelectType(slot.id, isSelected)}
              >
                <div className="flex items-start gap-3">
                  {/* Radio circle */}
                  <div
                    className={cn(
                      "mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors",
                      isSelected ? "border-primary bg-primary" : "border-muted-foreground/40",
                    )}
                  >
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>

                  {/* Icon */}
                  <div className="p-2 rounded-lg shrink-0 bg-primary/10">
                    <span className="text-primary">{slot.icon}</span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-foreground">
                          {plan ? `${plan.name} — ${slot.label}` : slot.label}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        {plan ? (
                          <p className="text-base font-bold text-foreground">
                            {getCycle(slot.id) === "YEARLY"
                              ? fmt(plan.yearlyPrice, plan.currency)
                              : fmt(plan.monthlyPrice, plan.currency)}
                            <span className="text-xs font-normal text-muted-foreground">
                              /{getCycle(slot.id) === "YEARLY" ? "yr" : "mo"}
                            </span>
                          </p>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground mt-0.5 mb-2">{slot.tagline}</p>

                    {/* Billing cycle — visible when selected */}
                    {isSelected && plan && (
                      <div className="flex items-center gap-2 mb-2" onClick={(e) => e.stopPropagation()}>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">Billing cycle</span>
                        <Select
                          value={getCycle(slot.id)}
                          onValueChange={(v) => handleCycleChange(slot.id, v as BillingCycle)}
                        >
                          <SelectTrigger className="h-8 text-xs rounded-lg w-44">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MONTHLY" className="text-xs">
                              Monthly · {fmt(plan.monthlyPrice, plan.currency)}/mo
                            </SelectItem>
                            <SelectItem value="YEARLY" className="text-xs">
                              12 months · {fmt(plan.yearlyPrice, plan.currency)}/yr
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Other plans picker */}
                    {isSelected && otherPlansCount > 0 && (
                      <div className="mb-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80"
                          onClick={() =>
                            setShowAllPlans((prev) => ({
                              ...prev,
                              [slot.id]: !prev[slot.id],
                            }))
                          }
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="w-3.5 h-3.5" />
                              Hide other plans
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-3.5 h-3.5" />
                              View other plans ({otherPlansCount} more)
                            </>
                          )}
                        </button>

                        {isExpanded && (
                          <div className="mt-2 rounded-lg border border-border bg-muted/20 p-2 space-y-1">
                            {catalog.map((option) => {
                              const isActive = option.planId === plan?.planId;
                              const cycle = getCycle(slot.id);
                              const price =
                                cycle === "YEARLY"
                                  ? fmt(option.yearlyPrice, option.currency)
                                  : fmt(option.monthlyPrice, option.currency);

                              return (
                                <button
                                  key={option.planId}
                                  type="button"
                                  className={cn(
                                    "w-full flex items-center justify-between gap-2 rounded-md px-2.5 py-2 text-left transition-colors",
                                    isActive
                                      ? "bg-primary/10 border border-primary/30"
                                      : "hover:bg-muted/60 border border-transparent",
                                  )}
                                  onClick={() => handlePlanPick(slot.id, option)}
                                >
                                  <span className="min-w-0">
                                    <span className="block text-xs font-semibold text-foreground truncate">
                                      {option.name}
                                      {option.isRecommended && (
                                        <span className="ml-1.5 text-[10px] font-medium text-primary">
                                          Recommended
                                        </span>
                                      )}
                                    </span>
                                  </span>
                                  <span className="text-xs font-semibold text-foreground whitespace-nowrap shrink-0">
                                    {price}
                                    <span className="text-muted-foreground font-normal">
                                      /{cycle === "YEARLY" ? "yr" : "mo"}
                                    </span>
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Features: label — value or checkmark */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 border-t border-border pt-2.5">
                      {features.map((f) => (
                        <div key={f.label} className="flex items-center justify-between gap-1 min-w-0">
                          <span className="text-xs text-muted-foreground truncate">{f.label}</span>
                          {f.value != null ? (
                            <span className="text-xs font-semibold text-foreground whitespace-nowrap ml-1">
                              {f.value}
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary/10 shrink-0">
                              <Check className="w-2.5 h-2.5 text-primary stroke-[3]" />
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedType && (
        <Button
          variant="ghost"
          size="sm"
          className="mt-3 w-full text-muted-foreground hover:text-destructive text-xs"
          onClick={() => onSelect(null)}
        >
          No thanks, I only need the domain
        </Button>
      )}

      {!selectedType && !loading && (
        <p className="text-xs text-muted-foreground text-center mt-3">
          No hosting needed — skip and continue with the domain only.
        </p>
      )}
    </div>
  );
}
