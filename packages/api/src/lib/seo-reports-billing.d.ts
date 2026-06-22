/**
 * SEO Reports - stable product and plan ids (seeded by apps/server).
 */
/** Stable product id - seeded by apps/server/src/scripts/seed-seo-reports-product.ts */
export declare const NISC_SEO_REPORTS_PRODUCT_ID = "nisc-seo-reports";
export declare const NISC_SEO_REPORTS_PLAN_IDS: {
    readonly starter: "nisc-seo-reports-plan-starter";
    readonly growth: "nisc-seo-reports-plan-growth";
    readonly pro: "nisc-seo-reports-plan-pro";
};
/** Linked Search Console properties per team plan. */
export declare const SEO_GSC_SITES_USAGE_KIND = "seo_gsc_sites";
/** Linked GA4 properties per team plan. */
export declare const SEO_GA4_PROPERTIES_USAGE_KIND = "seo_ga4_properties";
/**
 * Canonical feature rows for SEO pricing table.
 * Used as a fallback in getSeoPlansForPricing when the product's features
 * field is empty (e.g. before a full re-seed).
 */
export declare const SEO_PRODUCT_FEATURES: readonly [{
    readonly key: "websites";
    readonly label: "Websites managed";
    readonly description: "Sites we actively optimize and monitor for organic search growth";
}, {
    readonly key: "keywords";
    readonly label: "Keywords tracked";
    readonly description: "Live keyword positions monitored across Google for each site";
}, {
    readonly key: "gsc_sites";
    readonly label: "Search Console sites";
    readonly description: "Google Search Console properties linked for click/impression data";
}, {
    readonly key: "ga4_properties";
    readonly label: "GA4 properties";
    readonly description: "Google Analytics 4 properties connected for traffic insights";
}, {
    readonly key: "reports_per_month";
    readonly label: "SEO reports / month";
    readonly description: "Full audit reports generated and delivered each calendar month";
}, {
    readonly key: "on_page_audit";
    readonly label: "On-page audit";
    readonly description: "Automated crawl of title tags, meta descriptions, headings, and content gaps";
}, {
    readonly key: "backlink_analysis";
    readonly label: "Backlink analysis";
    readonly description: "Review of inbound links, authority scores, and toxic link detection";
}, {
    readonly key: "competitor_tracking";
    readonly label: "Competitor tracking";
    readonly description: "Side-by-side keyword and ranking comparison against named competitors";
}, {
    readonly key: "white_label";
    readonly label: "White-label reports";
    readonly description: "Reports branded with your logo and colours for client delivery";
}, {
    readonly key: "team_access";
    readonly label: "Team access";
    readonly description: "Invite colleagues to view progress and reports alongside your agency";
}];
