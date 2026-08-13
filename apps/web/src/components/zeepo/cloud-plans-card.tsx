"use client";

import * as React from "react";
import { Server, Cpu, HardDrive } from "lucide-react";
import { BuyNowDialog, type ServicePlanDetails } from "@/components/buy-now-dialog";
import { Button } from "@/components/ui/button";
import { useHivelocityPricing } from "@/hooks/use-hivelocity-pricing";
import { buildHivelocityPlanForCheckout } from "@/lib/build-hivelocity-service-plan";
import { PlanCard } from "@/routes/agency.vps/_components/plan-card";
import type { VpsPlan } from "@/routes/agency.vps/schema";
import { useZeepoCheckoutTeam } from "@/components/zeepo/use-zeepo-checkout-team";
import { trpc } from "@/utils/trpc";
import { toast } from "@/components/ui/sonner";
import type {
  AgentCloudPlanEntry,
  AgentCloudPlansResult,
} from "@/stores/zeepo-payment-store";

const KIND_META = {
  vps: { label: "VPS Hosting Plans", planTypeLabel: "VPS Hosting", Icon: Server },
  vds: { label: "VDS Hosting Plans", planTypeLabel: "VDS Hosting", Icon: Cpu },
  dedicated: {
    label: "Dedicated Server Plans",
    planTypeLabel: "Dedicated Servers",
    Icon: HardDrive,
  },
} as const;

const PAGE_SIZE = 12;

function toVpsPlan(plan: AgentCloudPlanEntry): VpsPlan {
  return {
    product_id: plan.product_id,
    product_name: plan.product_name,
    data_center: plan.data_center,
    location_option_id: plan.location_option_id,
    stock: plan.stock,
    is_vps: plan.is_vps,
    is_vds: plan.is_vds,
    product_cpu_cores: plan.product_cpu_cores,
    product_cpu: plan.product_cpu,
    processor_info: plan.processor_info,
    product_memory: plan.product_memory,
    product_drive: plan.product_drive,
    product_drive_info: plan.product_drive_info,
    product_bandwidth: plan.product_bandwidth,
    product_hourly_price: plan.product_hourly_price,
    product_monthly_price: plan.product_monthly_price,
    product_on_sale: plan.product_on_sale,
    product_original_price: plan.product_original_price,
    product_new: plan.product_new,
  };
}

function planKey(plan: AgentCloudPlanEntry): string {
  return `${plan.data_center}-${plan.product_id}-${plan.location_option_id}`;
}

export function ZeepoCloudPlansCard({ result }: { result: AgentCloudPlansResult }) {
  const { teamId, teamSlug } = useZeepoCheckoutTeam();
  const meta = KIND_META[result.kind];
  const Icon = meta.Icon;
  const pricing = useHivelocityPricing(result.plans[0]?.checkout?.productType ?? "VPS");
  const utils = trpc.useUtils();
  const [buyNowOpen, setBuyNowOpen] = React.useState(false);
  const [selectedPlan, setSelectedPlan] = React.useState<ServicePlanDetails | null>(null);
  const [dialogIntent, setDialogIntent] = React.useState<"buy_now" | "add_to_cart">("buy_now");
  const [plans, setPlans] = React.useState(result.plans);
  const [hasMore, setHasMore] = React.useState(result.hasMore);
  const [totalCount, setTotalCount] = React.useState(result.totalCount);
  const [nextCursor, setNextCursor] = React.useState<number | null>(
    result.nextCursor ?? (result.hasMore ? result.plans.length : null),
  );
  const [loadingMore, setLoadingMore] = React.useState(false);

  React.useEffect(() => {
    setPlans(result.plans);
    setHasMore(result.hasMore);
    setTotalCount(result.totalCount);
    setNextCursor(result.nextCursor ?? (result.hasMore ? result.plans.length : null));
  }, [result]);

  const openCheckout = React.useCallback(
    (plan: AgentCloudPlanEntry, intent: "buy_now" | "add_to_cart") => {
      const checkout = plan.checkout;
      if (!checkout) return;
      const periods = checkout.usdByPeriod;
      setDialogIntent(intent);
      setSelectedPlan(
        buildHivelocityPlanForCheckout(
          {
            product_id: checkout.inventoryProductId,
            product_name: plan.product_name,
            data_center: checkout.locationName,
            stock: plan.stock,
            product_disabled_billing_periods: checkout.disabledBillingPeriods,
            product_monthly_price: periods.monthly,
            product_hourly_price: checkout.usdHourly,
            product_quarterly_price: periods.quarterly,
            product_semi_annually_price: periods["semi-annually"],
            product_annually_price: periods.annually,
            product_biennial_price: periods.biennial,
            product_triennial_price: periods.triennial,
            __baseUsd: { monthly: checkout.usdMonthly, hourly: checkout.usdHourly },
          },
          {
            productType: checkout.productType,
            planTypeLabel: meta.planTypeLabel,
            displayCurrency: result.displayCurrency,
            niscProductId: result.niscProductId,
            locationDisplayName: plan.locationDisplayName,
            pricing,
          },
        ),
      );
      setBuyNowOpen(true);
    },
    [meta.planTypeLabel, pricing, result.displayCurrency, result.niscProductId],
  );

  const handleShowMore = React.useCallback(async () => {
    if (nextCursor == null || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await utils.zeepoAi.cloudPlans.list.fetch({
        kind: result.kind,
        search: result.search || undefined,
        cursor: nextCursor,
        limit: PAGE_SIZE,
      });
      setPlans((prev) => {
        const seen = new Set(prev.map(planKey));
        const appended = page.plans.filter((p) => !seen.has(planKey(p)));
        return [...prev, ...appended];
      });
      setTotalCount(page.totalCount);
      setHasMore(page.hasMore);
      setNextCursor(page.nextCursor);
    } catch {
      toast.error("Couldn't load more plans. Please try again.");
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, nextCursor, result.kind, result.search, utils]);

  return (
    <>
      <div className="w-full max-w-full rounded-2xl rounded-bl-md border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 border-b bg-muted/30 px-3 py-2.5">
          <Icon className="size-3.5 shrink-0 text-primary" />
          <span className="min-w-0 truncate text-sm font-semibold text-foreground">
            {result.matchMode === "best" && result.filterSummary
              ? `Best match · ${result.filterSummary}`
              : meta.label}
          </span>
          {plans.length > 0 ? (
            <span className="shrink-0 rounded-full border border-primary/20 bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
              {result.matchMode === "best"
                ? "1 plan"
                : `${hasMore ? `${plans.length} of ${totalCount}` : plans.length} ${
                    plans.length === 1 ? "plan" : "plans"
                  }`}
            </span>
          ) : null}
        </div>

        {plans.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No plans available at the moment.
          </p>
        ) : (
          <div className="max-h-[36rem] overflow-y-auto p-2.5 sm:p-3">
            <div
              className={
                plans.length === 1
                  ? "grid gap-3 grid-cols-1 max-w-md"
                  : "grid gap-3 grid-cols-1 sm:grid-cols-2"
              }
            >
              {plans.map((plan) => (
                <PlanCard
                  key={planKey(plan)}
                  plan={toVpsPlan(plan)}
                  locationName={plan.locationDisplayName}
                  displayCurrency={result.displayCurrency}
                  onBuyNow={() => openCheckout(plan, "buy_now")}
                  onAddToCart={() => openCheckout(plan, "add_to_cart")}
                />
              ))}
            </div>
            {hasMore ? (
              <div className="mt-3 flex flex-col items-center gap-2">
                <p className="text-xs text-muted-foreground">
                  Showing {plans.length} of {totalCount} plans
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void handleShowMore()}
                  disabled={loadingMore}
                >
                  {loadingMore ? "Loading..." : "Show more"}
                </Button>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {selectedPlan ? (
        <BuyNowDialog
          open={buyNowOpen}
          onOpenChange={setBuyNowOpen}
          plan={selectedPlan}
          requireDomainStep={false}
          intent={dialogIntent}
          teamId={teamId ?? undefined}
          teamSlug={teamSlug ?? undefined}
          buyDomainHref={teamSlug ? `/${teamSlug}/domains` : undefined}
        />
      ) : null}
    </>
  );
}
