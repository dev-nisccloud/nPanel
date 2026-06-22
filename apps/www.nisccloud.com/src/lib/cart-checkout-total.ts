import type { BillingCycle } from "@/pages/cart/_components/CartItem.tsx";
import type { SelectedDomain } from "@/pages/cart/_components/DomainUpsell.tsx";
import type { SelectedHostingPlan } from "@/pages/cart/_components/OrderSummary.tsx";
import type { HivelocitySummaryLine } from "@/lib/vps-plans-api.ts";

export function computeCartCheckoutTotal(params: {
  monthlyPrice: number;
  yearlyPrice: number;
  billingCycle: BillingCycle;
  selectedDomain: SelectedDomain | null;
  selectedHostingPlan: SelectedHostingPlan | null;
  hostingCycle: BillingCycle;
  hivelocityLines?: HivelocitySummaryLine[];
}): { subtotal: number; taxAmount: number; total: number } {
  const main =
    params.billingCycle === "YEARLY" ? params.yearlyPrice : params.monthlyPrice;

  const domain =
    params.selectedDomain && !params.selectedDomain.isExisting
      ? (params.selectedDomain.priceKes ?? 0)
      : 0;

  const hosting = params.selectedHostingPlan
    ? params.hostingCycle === "YEARLY"
      ? params.selectedHostingPlan.yearlyPrice
      : params.selectedHostingPlan.monthlyPrice
    : 0;

  const hivelocityExtras = (params.hivelocityLines ?? []).reduce((s, l) => s + l.priceKes, 0);

  const subtotal = main + domain + hosting + hivelocityExtras;
  const taxAmount = Math.round(subtotal * 0.16);
  const total = subtotal + taxAmount;

  return { subtotal, taxAmount, total };
}
