/**
 * SEO Reports - stable product and plan ids (seeded by apps/server).
 */

/** Stable product id - seeded by apps/server/src/scripts/seed-seo-reports-product.ts */
export const NISC_SEO_REPORTS_PRODUCT_ID = "nisc-seo-reports";

export const NISC_SEO_REPORTS_PLAN_IDS = {
	starter: "nisc-seo-reports-plan-starter",
	growth: "nisc-seo-reports-plan-growth",
	pro: "nisc-seo-reports-plan-pro",
} as const;

/** Linked Search Console properties per team plan. */
export const SEO_GSC_SITES_USAGE_KIND = "seo_gsc_sites";
/** Linked GA4 properties per team plan. */
export const SEO_GA4_PROPERTIES_USAGE_KIND = "seo_ga4_properties";

/**
 * Canonical feature rows for SEO pricing table.
 * Used as a fallback in getSeoPlansForPricing when the product's features
 * field is empty (e.g. before a full re-seed).
 */
export const SEO_PRODUCT_FEATURES = [
  { key: "websites", label: "Websites managed", description: "Sites we actively optimize and monitor for organic search growth" },
  { key: "keywords", label: "Keywords tracked", description: "Live keyword positions monitored across Google for each site" },
  { key: "gsc_sites", label: "Search Console sites", description: "Google Search Console properties linked for click/impression data" },
  { key: "ga4_properties", label: "GA4 properties", description: "Google Analytics 4 properties connected for traffic insights" },
  { key: "reports_per_month", label: "SEO reports / month", description: "Full audit reports generated and delivered each calendar month" },
  { key: "on_page_audit", label: "On-page audit", description: "Automated crawl of title tags, meta descriptions, headings, and content gaps" },
  { key: "backlink_analysis", label: "Backlink analysis", description: "Review of inbound links, authority scores, and toxic link detection" },
  { key: "competitor_tracking", label: "Competitor tracking", description: "Side-by-side keyword and ranking comparison against named competitors" },
  { key: "white_label", label: "White-label reports", description: "Reports branded with your logo and colours for client delivery" },
  { key: "team_access", label: "Team access", description: "Invite colleagues to view progress and reports alongside your agency" },
] as const;
