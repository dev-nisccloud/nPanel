export type ProvisionInitialUsageCreditsParams = {
    subscriptionId: string;
    productId: string;
    productPlanId: string | null;
    /** User ID for activity log (e.g. order.createdBy or session.user.id). */
    performedByUserId: string;
    /** reset = set balance to plan limit; accumulate = add plan limit to current balance */
    mode?: "reset" | "accumulate";
    /** Agency override: set credits to this value instead of plan limit (Zeepo tokens). */
    tokenGrantOverride?: number;
};
export declare function provisionInitialUsageCreditsForSubscription(params: ProvisionInitialUsageCreditsParams): Promise<{
    created: number;
}>;
