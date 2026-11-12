/** Storefront cart billing cycles. */
export type BillingCycle =
  | "MONTHLY"
  | "YEARLY"
  | "BIENNIALLY"
  | "TRIENNIALLY"
  | "QUADRENNIALLY";

/** Hosting, WordPress and email: every term the quote API prices (verified 7 Nov 2026). */
export const SERVICE_BILLING_CYCLES: ReadonlyArray<{
  value: BillingCycle;
  label: string;
}> = [
  { value: "MONTHLY", label: "Monthly" },
  { value: "YEARLY", label: "1 year" },
  { value: "BIENNIALLY", label: "2 years" },
  { value: "TRIENNIALLY", label: "3 years" },
];

const MULTI_TERM_SERVICES = new Set(["web_hosting", "wordpress_hosting", "email_hosting"]);
const MONTHLY_ONLY_SERVICES = new Set(["seo_reports", "email_marketing"]);

/** Terms offered for a service; servers keep 1 and 2 years until 3-year quotes are verified. */
export function billingCyclesFor(serviceType: string): ReadonlyArray<{ value: BillingCycle; label: string }> {
  if (MULTI_TERM_SERVICES.has(serviceType)) return SERVICE_BILLING_CYCLES;
  if (MONTHLY_ONLY_SERVICES.has(serviceType)) return SERVICE_BILLING_CYCLES.slice(0, 1);
  return SERVICE_BILLING_CYCLES.slice(0, 3);
}

/** Domain registration: yearly terms only (never monthly). */
export const DOMAIN_BILLING_CYCLES: ReadonlyArray<{
  value: BillingCycle;
  label: string;
}> = [
  { value: "YEARLY", label: "1 year" },
  { value: "BIENNIALLY", label: "2 years" },
  { value: "TRIENNIALLY", label: "3 years" },
  { value: "QUADRENNIALLY", label: "4 years" },
];

export function billingCycleToMonths(cycle: BillingCycle): number {
  switch (cycle) {
    case "MONTHLY":
      return 1;
    case "YEARLY":
      return 12;
    case "BIENNIALLY":
      return 24;
    case "TRIENNIALLY":
      return 36;
    case "QUADRENNIALLY":
      return 48;
  }
}

export function billingCycleToYears(cycle: BillingCycle): number {
  const months = billingCycleToMonths(cycle);
  return months < 12 ? 1 : Math.round(months / 12);
}

/** Price for the selected period from monthly + yearly base rates. */
export function periodPrice(
  monthly: number,
  yearly: number,
  cycle: BillingCycle,
): number {
  if (cycle === "MONTHLY") return monthly;
  return Math.round(yearly * billingCycleToYears(cycle));
}

export function billingCycleShortSuffix(cycle: BillingCycle): string {
  switch (cycle) {
    case "MONTHLY":
      return "mo";
    case "YEARLY":
      return "yr";
    default:
      // Multi-year terms are priced for the full period, not per year.
      return "term";
  }
}

export function billingCyclePeriodLabel(cycle: BillingCycle): string {
  const found =
    SERVICE_BILLING_CYCLES.find((c) => c.value === cycle) ??
    DOMAIN_BILLING_CYCLES.find((c) => c.value === cycle);
  return found?.label ?? cycle;
}
