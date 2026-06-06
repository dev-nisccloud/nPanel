/**
 * Hosting plan fetching for the Zeepo AI Agent.
 *
 * Fetches web hosting and email hosting plans from the Nisc Cloud product
 * catalogue - the same data powering the customer-facing pricing tables on
 * the /$slug/hosting and /$slug/emails routes.  Results are returned in a
 * shape that the session-page can detect and render as a pricing card.
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
export interface HostingPlansResult {
    _tool: "get_web_hosting_plans" | "get_email_hosting_plans";
    productFeatures: HostingPlanFeatureRow[];
    plans: HostingPlanEntry[];
    checkedAt: string;
}
/** Fetch web/website hosting plans from the Nisc Cloud catalogue. */
export declare function agentGetWebHostingPlans(): Promise<HostingPlansResult>;
/** Fetch email hosting plans from the Nisc Cloud catalogue. */
export declare function agentGetEmailHostingPlans(): Promise<HostingPlansResult>;
