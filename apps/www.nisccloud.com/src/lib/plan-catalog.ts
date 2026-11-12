import { billingCycleToMonths, type BillingCycle } from "@/lib/billing-cycle.ts";

/**
 * Public presentation of nPanel catalogue plans. Only the display layer changes here: plan ids,
 * prices, cart handoffs and orders keep the catalogue's own names (see design/plan-naming-map.md).
 */
type PlanPresentation = { name: string; audience: string };

const PLAN_PRESENTATION: Record<string, PlanPresentation> = {
  "nisc-web-hosting-plan-starter": { name: "Launch", audience: "For a first website or landing page" },
  "nisc-web-hosting-plan-basic": { name: "Grow", audience: "For small business websites and online stores" },
  "nisc-web-hosting-plan-deluxe": { name: "Accelerate", audience: "For busier sites and several websites" },

  nisc_wordpress_hosting_plan_starter: { name: "Launch", audience: "For a first WordPress site or blog" },
  nisc_wordpress_hosting_plan_business: { name: "Business", audience: "For growing business sites and stores" },
  nisc_wordpress_hosting_plan_pro: { name: "Performance", audience: "For high-traffic sites and many installs" },

  "nisc-email-hosting-plan-basic": { name: "Essentials", audience: "For a small team getting started" },
  "nisc-email-hosting-plan-standard": { name: "Business", audience: "For growing teams" },
  "nisc-email-hosting-plan-corporate": { name: "Scale", audience: "For larger teams and departments" },

  "nisc-seo-reports-plan-starter": { name: "Search Foundations", audience: "For one website building visibility" },
  "nisc-seo-reports-plan-growth": { name: "Search Growth", audience: "For businesses competing in several markets" },
  "nisc-seo-reports-plan-pro": { name: "Search Authority", audience: "For multi-site brands that lead their category" },
};

/** Kept in nPanel for existing subscriptions; not sold from the public site. */
const HIDDEN_PLAN_IDS = new Set([
  "nisc-web-hosting-plan-ultimate",
  "dd59f6e8-3892-43e6-a090-8d330400f6aa",
]);

export function publicPlanName(planId: string | null | undefined, catalogueName: string): string {
  return (planId && PLAN_PRESENTATION[planId]?.name) || catalogueName;
}

export function planAudience(planId: string): string | null {
  return PLAN_PRESENTATION[planId]?.audience ?? null;
}

export function isPlanListed(plan: { id: string; niscPrice?: string | null }): boolean {
  return !HIDDEN_PLAN_IDS.has(plan.id);
}

export type CustomTier = {
  name: string;
  audience: string;
  points: string[];
  contactService: "launch" | "market";
  serviceName: string;
};

/** The quote-only fourth tier. It is never a priced or free product. */
export const CUSTOM_TIERS: Partial<Record<string, CustomTier>> = {
  web_hosting: {
    name: "Corporate",
    audience: "For organisations with custom requirements",
    points: [
      "Resources sized to your sites, traffic and team",
      "Migration options agreed up front",
      "A fixed proposal before you commit",
    ],
    contactService: "launch",
    serviceName: "Web Hosting",
  },
  email_hosting: {
    name: "Corporate",
    audience: "For more than 100 mailboxes or custom storage",
    points: [
      "Mailbox count and storage sized to your organisation",
      "Migration from your current provider",
      "A fixed proposal before you commit",
    ],
    contactService: "launch",
    serviceName: "Nisc Mail",
  },
  seo_reports: {
    name: "Corporate Search",
    audience: "For multiple brands, regions or more than 10 websites",
    points: [
      "Scope, markets and reporting agreed with you",
      "Content and outreach volumes to match your goals",
      "A fixed proposal before you commit",
    ],
    contactService: "market",
    serviceName: "SEO, AEO and GEO",
  },
};

export function customTierEnquiryUrl(tier: CustomTier): string {
  const search = new URLSearchParams({
    service: tier.contactService,
    serviceName: tier.serviceName,
    plan: tier.name,
    tier: "corporate",
  });
  return `/contact?${search.toString()}`;
}

/**
 * Price for a term, computed the way the quote API does: plans catalogued per year are priced per
 * year, monthly plans are the monthly rate times the months. There is no multi-term discount.
 */
export function planTermPrice(niscPrice: string | null | undefined, catalogueCycle: string, cycle: BillingCycle): number {
  const price = niscPrice ? parseFloat(niscPrice) : NaN;
  if (!Number.isFinite(price) || price <= 0) return 0;
  const months = billingCycleToMonths(cycle);
  const catalogueMonths =
    catalogueCycle === "YEARLY" ? 12 : catalogueCycle === "BIENNIALLY" ? 24 : catalogueCycle === "TRIENNIALLY" ? 36 : 1;
  if (catalogueMonths === 1) return Math.round(price * months * 100) / 100;
  if (cycle === "MONTHLY") return Math.round(price / catalogueMonths);
  return Math.round((price / catalogueMonths) * months * 100) / 100;
}
