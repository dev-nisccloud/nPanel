import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import type { CartItemData, BillingCycle } from "./CartItem.tsx";
import type { SelectedDomain } from "./DomainUpsell.tsx";
import type { HivelocitySummaryLine } from "@/lib/vps-plans-api.ts";

export type { HivelocitySummaryLine };

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SelectedHostingPlan {
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
}

interface OrderSummaryProps {
  item: CartItemData;
  selectedDomain: SelectedDomain | null;
  selectedHostingPlan: SelectedHostingPlan | null;
  hostingCycle: BillingCycle;
  billingCycle: BillingCycle;
  onContinue: () => void;
  onRemoveDomain?: () => void;
  onRemoveHostingPlan?: () => void;
  isContinueLoading?: boolean;
  step: 1 | 2;
  /** When set on step 2, the CTA submits this form instead of calling onContinue. */
  customerFormId?: string;
  /** Billable Hivelocity OS / add-on lines (VPS, VDS, dedicated). */
  hivelocityLines?: HivelocitySummaryLine[];
  /** Disable continue until required cart fields are complete. */
  continueDisabled?: boolean;
  /** Server-computed totals override client-side math when present. */
  authoritativeTotals?: { subtotal: number; taxAmount: number; total: number };
  /** First load — full-page skeleton handles this; used for non-hivelocity carts. */
  quoteInitialLoading?: boolean;
  /** Background price validation (e.g. OS / add-on changes on VPS/VDS/dedicated). */
  quoteSummaryLoading?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmt(amount: number) {
  return `KES ${amount.toLocaleString("en-KE", { minimumFractionDigits: 0 })}`;
}

function getItemPrice(item: CartItemData) {
  return item.billingCycle === "YEARLY" ? item.yearlyPrice : item.monthlyPrice;
}

function OrderSummaryPricingSkeleton() {
  return (
    <div className="space-y-3" aria-hidden="true">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="h-4 w-16 shrink-0" />
      </div>
      <div className="flex items-center justify-between pt-1">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-16" />
      </div>
      <div className="flex items-center justify-between pt-2">
        <Skeleton className="h-5 w-12" />
        <Skeleton className="h-7 w-28" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function OrderSummary({
  item,
  selectedDomain,
  selectedHostingPlan,
  hostingCycle,
  billingCycle,
  onContinue,
  onRemoveDomain,
  onRemoveHostingPlan,
  isContinueLoading,
  step,
  customerFormId,
  hivelocityLines = [],
  continueDisabled = false,
  authoritativeTotals,
  quoteInitialLoading = false,
  quoteSummaryLoading = false,
}: OrderSummaryProps) {
  const isYearly = billingCycle === "YEARLY";
  const mainPrice = getItemPrice(item);

  // Existing-domain costs nothing; purchased domain adds to total
  const domainPrice = selectedDomain && !selectedDomain.isExisting
    ? (selectedDomain.priceKes ?? 0)
    : 0;

  const hostingPrice = selectedHostingPlan
    ? hostingCycle === "YEARLY"
      ? selectedHostingPlan.yearlyPrice
      : selectedHostingPlan.monthlyPrice
    : 0;

  const hivelocityExtras = hivelocityLines.reduce((s, l) => s + l.priceKes, 0);

  const taxRate = 0.16;
  const clientSubtotal = mainPrice + domainPrice + hostingPrice + hivelocityExtras;
  const subtotal = authoritativeTotals?.subtotal ?? clientSubtotal;
  const taxAmount =
    authoritativeTotals?.taxAmount ?? Math.round(clientSubtotal * taxRate);
  const total = authoritativeTotals?.total ?? clientSubtotal + Math.round(clientSubtotal * taxRate);
  const summaryBusy = quoteSummaryLoading || (quoteInitialLoading && !authoritativeTotals);

  return (
    <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 pt-5 pb-4 border-b border-border">
        <h2 className="text-base font-bold text-foreground">Order summary</h2>
      </div>

      <div className="px-5 py-4 space-y-3">
        {summaryBusy ? (
          <OrderSummaryPricingSkeleton />
        ) : (
          <>
        {/* Main plan */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground leading-tight">{item.planName}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {item.serviceType === "domain_registration"
                ? "1 year · Annual registration"
                : isYearly
                  ? "12-month billing cycle"
                  : "Monthly billing cycle"}{" "}
              · {item.productName}
            </p>
          </div>
          <span className="text-sm font-semibold text-foreground whitespace-nowrap">
            {fmt(mainPrice)}
          </span>
        </div>

        {/* Domain line */}
        {selectedDomain && (
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground truncate">
                {selectedDomain.domain}
              </p>
              <p className="text-xs text-muted-foreground">
                {selectedDomain.isExisting
                  ? "Existing domain · connect after setup"
                  : "Domain registration · 1 year"}
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-sm font-semibold text-foreground whitespace-nowrap">
                {selectedDomain.isExisting ? "—" : domainPrice > 0 ? fmt(domainPrice) : "Free"}
              </span>
              {onRemoveDomain && (
                <button
                  onClick={onRemoveDomain}
                  className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  aria-label="Remove domain"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Hosting upsell line */}
        {selectedHostingPlan && (
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground truncate">
                {selectedHostingPlan.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {hostingCycle === "YEARLY" ? "12-month billing cycle" : "Monthly billing cycle"}
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-sm font-semibold text-foreground whitespace-nowrap">
                {fmt(hostingPrice)}
              </span>
              {onRemoveHostingPlan && (
                <button
                  onClick={onRemoveHostingPlan}
                  className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  aria-label="Remove hosting plan"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {hivelocityLines.map((line) => (
          <div key={line.id} className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground truncate">{line.name}</p>
              <p className="text-xs text-muted-foreground">
                {line.kind === "os" ? "Operating system license" : "Add-on"} · Monthly
              </p>
            </div>
            <span className="text-sm font-semibold text-foreground whitespace-nowrap shrink-0">
              {fmt(line.priceKes)}
            </span>
          </div>
        ))}

        <Separator className="my-1" />

        {/* Taxes */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>VAT (16%)</span>
          <span>{fmt(taxAmount)}</span>
        </div>

        {/* Total */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-base font-bold text-foreground">Total</span>
          <span className="text-xl font-bold text-foreground">{fmt(total)}</span>
        </div>

        {/* Coupon — re-enable when promo codes are supported
        <button className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 font-medium mt-1 group">
          <Tag className="w-4 h-4 group-hover:scale-110 transition-transform" />
          Have a coupon code?
        </button>
        */}
          </>
        )}
      </div>

      {/* CTA */}
      <div className="px-5 pb-5 pt-2">
        <Button
          type={step === 2 && customerFormId ? "submit" : "button"}
          form={step === 2 ? customerFormId : undefined}
          className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base shadow-sm transition-all"
          onClick={step === 1 ? onContinue : undefined}
          disabled={isContinueLoading || summaryBusy || (step === 1 && continueDisabled)}
        >
          {summaryBusy
            ? "Please wait…"
            : isContinueLoading
            ? "Processing…"
            : step === 1
              ? "Continue →"
              : "Complete Order"}
        </Button>

        <p className="text-xs text-muted-foreground text-center mt-3">
          Secure payment · All prices include VAT
        </p>
      </div>
    </div>
  );
}
