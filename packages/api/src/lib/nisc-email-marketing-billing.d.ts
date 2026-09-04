/**
 * Nisc Email Marketing - stable product and plan ids (seeded by apps/server).
 */
/** Stable product id - seeded by apps/server/src/scripts/seed-nisc-email-marketing-product.ts */
export declare const NISC_EMAIL_MARKETING_PRODUCT_ID = "nisc-email-marketing";
export declare const NISC_EMAIL_MARKETING_PLAN_IDS: {
    readonly starter: "nisc-email-marketing-plan-starter";
    readonly growth: "nisc-email-marketing-plan-growth";
    readonly pro: "nisc-email-marketing-plan-pro";
};
/** Subscription usage row kinds on nisc_client_subscription_usage. */
export declare const NISC_EM_CONTACTS_USAGE_KIND = "nisc_em_contacts";
export declare const NISC_EM_EMAILS_MONTHLY_USAGE_KIND = "nisc_em_emails_monthly";
export declare const NISC_EM_LINKABLE_SUBSCRIPTION_STATUSES: readonly ["ACTIVE", "PENDING", "PROCESSING"];
export declare function getNiscEmailMarketingProductIds(): Promise<string[]>;
export declare function teamHasNiscEmailMarketingSubscription(teamId: string): Promise<boolean>;
export declare function assertTeamHasNiscEmailMarketingSubscription(teamId: string): Promise<void>;
export declare function assertCanLinkNiscEmResource(params: {
    role: string | null | undefined;
    currentTeamId: string | null | undefined;
    nextTeamId: string;
}): Promise<void>;
export declare function listTeamsWithNiscEmailMarketingSubscription(): Promise<Array<{
    id: string;
    name: string;
    slug: string;
}>>;
