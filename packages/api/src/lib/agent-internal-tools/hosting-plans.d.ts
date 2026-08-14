/**
 * Hosting plan fetching for Zeepo AI.
 *
 * Fetches web, email, and WordPress hosting plans from the Nisc Cloud product
 * catalogue - the same data powering the customer-facing pricing tables.
 * Results are returned in a shape that chat can render as a pricing card.
 */
export interface HostingPlanFeatureRow {
    key: string;
    label: string;
}
export interface HostingPlanEntry {
    id: string;
    name: string;
    niscPrice: string | null;
    niscCurrency: string;
    billingCycle: string;
    isPopular: boolean;
    isRecommended: boolean;
    productId: string;
    productName: string;
    featureValues: Array<{
        available: boolean;
        valueOverride: string | null;
    }>;
}
export type HostingPlansToolName = "get_web_hosting_plans" | "get_email_hosting_plans" | "get_wordpress_hosting_plans";
export interface HostingPlansResult {
    _tool: HostingPlansToolName;
    productFeatures: HostingPlanFeatureRow[];
    plans: HostingPlanEntry[];
    checkedAt: string;
}
/** Fetch web/website hosting plans from the Nisc Cloud catalogue. */
export declare function agentGetWebHostingPlans(): Promise<HostingPlansResult>;
/** Fetch email hosting plans from the Nisc Cloud catalogue. */
export declare function agentGetEmailHostingPlans(): Promise<HostingPlansResult>;
/** Fetch WordPress hosting plans from the Nisc Cloud catalogue. */
export declare function agentGetWordPressHostingPlans(): Promise<HostingPlansResult>;
