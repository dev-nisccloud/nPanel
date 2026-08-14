import { type ZeepoAiPlanType } from "./zeepo-ai-billing";
type PlanMeta = {
    zeepoPlanType: ZeepoAiPlanType;
    tokenGrant: number;
};
export type ZeepoAiOrderContext = {
    userId: string | null;
    teamId: string | null;
    createdBy: string | null;
    orderId: string;
    currency: string;
};
export type ZeepoAiOrderItem = {
    productId: string;
    productPlanId: string | null;
    billingCycle: string | null;
    itemPrice: string;
    itemSubtotal?: string | null;
    description: string | null;
    metadata?: Record<string, unknown> | null;
    product: {
        name: string;
    };
    productPlan: {
        name: string;
        pricingModel: string;
        price: string | null;
        cost: string | null;
        metadata: unknown;
    } | null;
};
export declare function isZeepoAiProduct(productId: string): boolean;
/**
 * Provision Zeepo AI after payment. Top-ups credit tokens; PAYG creates wallet only.
 * Free welcome tokens are NOT handled here (no invoice path).
 */
export declare function provisionZeepoAiOrderItem(order: ZeepoAiOrderContext, item: ZeepoAiOrderItem): Promise<{
    subscriptionId: string;
}>;
export declare function getZeepoAiPlanMeta(productPlanId: string): Promise<PlanMeta | null>;
export {};
