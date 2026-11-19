import { NISC_SEO_PLAN_IDS } from "@/lib/plan-catalog.ts";

/**
 * SEO & AI Search Optimisation: public names and plan-finder rules.
 * Prices and the two paid plans' scope come from the nPanel catalogue.
 */
export const SEO_SERVICE_NAME = "SEO & AI Search Optimisation";
export const SEO_ROUTE = "/services/seo-ai-search";
export const SEO_CHECKOUT_SERVICE_TYPE = "seo_reports";
export const SEO_LEAD_SERVICE = "market";

export const SEO_POLICY = {
  billing: "Billed monthly",
  vatRate: 0.16,
  commitment: "No minimum term. Cancel anytime; cancellation takes effect at the end of the current billing month.",
  expectation: "Search work usually needs at least two months before real results show.",
  guarantee: "We commit to the agreed work and clear reporting. Rankings and AI citations are not guaranteed.",
} as const;

export type PlanKey = "essentials" | "growth" | "enterprise";

export type SeoPlanCopy = {
  key: PlanKey;
  name: string;
  /** Catalogue plan sold at checkout; Enterprise is quote-only. */
  planId: string | null;
  suits: string;
  outcome: string;
  recommended?: boolean;
};

export const SEO_PLANS: Record<PlanKey, SeoPlanCopy> = {
  essentials: {
    key: "essentials",
    name: "Search Essentials",
    planId: NISC_SEO_PLAN_IDS.essentials,
    suits: "One business website establishing search visibility",
    outcome: "A sound technical and content foundation, with clear priorities each month.",
  },
  growth: {
    key: "growth",
    name: "Search Growth",
    planId: NISC_SEO_PLAN_IDS.searchGrowth,
    suits: "One business website competing for more enquiries and sales",
    outcome: "More content, local presence and outreach work each month to compete for enquiries and sales.",
    recommended: true,
  },
  enterprise: {
    key: "enterprise",
    name: "Enterprise",
    planId: null,
    suits: "Ecommerce, large websites, several brands, locations, languages or markets",
    outcome: "A search programme scoped around your sites, markets and approval process.",
  },
};

export const STANDARD_PLAN_KEYS = ["essentials", "growth"] as const;

export const ENTERPRISE_KEY_INCLUSIONS = [
  "Several websites, brands or locations",
  "Technical capacity agreed with you",
  "Content production with your approval workflow",
  "International and multi-market strategy",
  "Custom reporting and an assigned account lead",
];

export const ENTERPRISE_SCOPE = [
  "Multiple sites and locations",
  "Custom technical capacity",
  "Content production and approval workflows",
  "Product and category optimisation",
  "International strategy",
  "An agreed authority-building programme",
  "Custom reporting and integrations",
  "An assigned account lead",
  "An agreed review cadence",
];

/** Enterprise column for the comparison table. The two paid columns come from nPanel. */
export const ENTERPRISE_COMPARISON: { label: string; value: string }[] = [
  { label: "Websites", value: "Several sites and locations" },
  { label: "Starting assessment", value: "Agreed with you" },
  { label: "Priority search queries tracked", value: "Agreed with you" },
  { label: "Existing pages improved", value: "Agreed with you" },
  { label: "New researched articles or service pages", value: "Content production and approval workflow" },
  { label: "Technical implementation", value: "Custom capacity" },
  { label: "AI search foundations", value: "Agreed with you" },
  { label: "Competitors", value: "Agreed with you" },
  { label: "Business information and Google Business Profile", value: "Several locations" },
  { label: "Outreach", value: "Agreed authority-building programme" },
  { label: "AI visibility checks", value: "Agreed with you" },
  { label: "Reporting", value: "Custom reporting and integrations" },
  { label: "Review call", value: "Agreed cadence with an account lead" },
];

/** Definitions that apply whichever scope is live. */
export const SCOPE_DEFINITIONS = [
  { term: "Page improvements", detail: "Defined updates to pages you already have, such as clearer answers, headings, internal links and page details." },
  { term: "New content", detail: "A separate deliverable from page improvements. New articles and landing pages are only included where a plan says so." },
  { term: "Technical work", detail: "Agreed fixes and changes to your existing site. It does not cover redesigns or rebuilds." },
  { term: "Outreach", detail: "Researched approaches to relevant sites. Links are earned, never guaranteed." },
  { term: "Third-party costs", detail: "Publication fees or sponsorships always need your approval first and are billed separately." },
  { term: "AI visibility checks", detail: "Sampled observations of how AI tools answer set questions. Answers change, so these are not rankings." },
];

export const SEO_FAQS = [
  {
    q: "How much does it cost, and is there a minimum term?",
    a: `Search Essentials and Search Growth are billed monthly at the prices shown, plus 16% VAT. ${SEO_POLICY.commitment} Enterprise is priced on an agreed scope.`,
  },
  {
    q: "How long before I see results?",
    a: `${SEO_POLICY.expectation} Timing depends on your site, your competitors and how quickly changes go live. Your monthly report shows what changed.`,
  },
  {
    q: "Do you guarantee rankings or AI citations?",
    a: "No. Search engines and AI tools change how they rank and answer, so no one can promise a position or a citation. We commit to the agreed work and clear reporting.",
  },
  {
    q: "Are SEO, AEO and GEO separate services?",
    a: "No. They are three methods within one service, and every plan uses each of them where it is relevant to your business.",
  },
  {
    q: "Do I need structured data or an llms.txt file to appear in AI answers?",
    a: "No. Both can help software read a site, but neither is required for AI visibility and neither guarantees it.",
  },
  {
    q: "What do I see in nPanel?",
    a: "Search positions, clicks, top pages, queries, traffic and your reports show in nPanel automatically. You do not wait for someone to send them.",
  },
  {
    q: "What if I don’t have a website yet?",
    a: "Search work improves a website you already have. Start with our website design service, or book a consultation and we will plan the site with search in mind.",
  },
];

// ─── Plan finder ──────────────────────────────────────────────────────────────

export type FinderGoal = "enquiries" | "location" | "sales" | "multi";

export const FINDER_GOALS: { value: FinderGoal; label: string }[] = [
  { value: "enquiries", label: "Enquiries for my business" },
  { value: "location", label: "Customers finding my location" },
  { value: "sales", label: "Online sales" },
  { value: "multi", label: "Visibility across multiple brands or markets" },
];

export type FinderAnswers = {
  goal?: FinderGoal;
  /** False when the visitor chose "I don't have a website yet". */
  hasWebsite?: boolean;
  website?: string;
  sites?: "one" | "several";
  locations?: "one" | "several";
  shop?: "standard" | "large";
};

export type FinderStep = "goal" | "website" | "sites" | "locations" | "shop";

/** Questions still relevant for the answers so far, in order. */
export function finderSteps(answers: FinderAnswers): FinderStep[] {
  const steps: FinderStep[] = ["goal", "website"];
  if (answers.hasWebsite === false || answers.goal === "multi") return steps;
  steps.push("sites");
  if (answers.sites === "several") return steps;
  if (answers.goal === "location") steps.push("locations");
  if (answers.goal === "sales") steps.push("shop");
  return steps;
}

export type Recommendation =
  | { kind: "no-website"; reason: string }
  | { kind: "plan"; plan: PlanKey; reason: string };

export function recommendPlan(answers: FinderAnswers): Recommendation | null {
  if (!answers.goal) return null;
  if (answers.hasWebsite === false) {
    return {
      kind: "no-website",
      reason: "Search work improves a website you already have. Start with the website, or talk to us about building one with search in mind.",
    };
  }
  if (answers.goal === "multi") {
    return { kind: "plan", plan: "enterprise", reason: "Several brands or markets need a scope agreed across sites, languages and reporting." };
  }
  if (answers.sites === "several") {
    return { kind: "plan", plan: "enterprise", reason: "Several websites need a scope agreed around each site, so we review it with you first." };
  }
  if (answers.goal === "location") {
    if (answers.locations === "several") {
      return { kind: "plan", plan: "enterprise", reason: "More than one location needs a scope agreed around each location." };
    }
    return { kind: "plan", plan: "growth", reason: "Search Growth includes Google Business Profile work for your location. Search Essentials does not." };
  }
  if (answers.goal === "sales") {
    if (answers.shop === "large") {
      return { kind: "plan", plan: "enterprise", reason: "A large or complex shop needs product and category work sized to the catalogue." };
    }
    return {
      kind: "plan",
      plan: "growth",
      reason: "Online sales means competing for product and comparison searches, which needs more content work and outreach. Search Growth includes outreach. Search Essentials does not.",
    };
  }
  return {
    kind: "plan",
    plan: "essentials",
    reason: "For one website after more enquiries, Search Essentials sets your baseline and improves your most important pages each month. Compare it with Search Growth if you want more content and outreach.",
  };
}

/** Lenient check: accepts "example.com", "www.example.com/page" or a full URL. */
export function looksLikeWebsite(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || /\s/.test(trimmed)) return false;
  try {
    const url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
    return /\.[a-z]{2,}$/i.test(url.hostname);
  } catch {
    return false;
  }
}
