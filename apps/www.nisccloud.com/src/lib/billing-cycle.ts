/** Storefront cart billing cycles. */
export type BillingCycle =
  | "MONTHLY"
  | "YEARLY"
  | "BIENNIALLY"
  | "TRIENNIALLY"
  | "QUADRENNIALLY";

/** Services (hosting, VPS, etc.): 1 / 12 / 24 / 48 months. */
export const SERVICE_BILLING_CYCLES: ReadonlyArray<{
  value: BillingCycle;
  label: string;
}> = [
  { value: "MONTHLY", label: "1 month" },
  { value: "YEARLY", label: "12 months" },
  { value: "BIENNIALLY", label: "24 months" },
  { value: "QUADRENNIALLY", label: "48 months" },
];

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
  return cycle === "MONTHLY" ? "mo" : "yr";
}

export function billingCyclePeriodLabel(cycle: BillingCycle): string {
  const found =
    SERVICE_BILLING_CYCLES.find((c) => c.value === cycle) ??
    DOMAIN_BILLING_CYCLES.find((c) => c.value === cycle);
  return found?.label ?? cycle;
}
