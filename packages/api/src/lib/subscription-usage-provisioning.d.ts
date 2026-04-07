export type ProvisionInitialUsageCreditsParams = {
    subscriptionId: string;
    productId: string;
    productPlanId: string | null;
    /** User ID for activity log (e.g. order.createdBy or session.user.id). */
    performedByUserId: string;
};
export declare function provisionInitialUsageCreditsForSubscription(params: ProvisionInitialUsageCreditsParams): Promise<{
    created: number;
}>;
