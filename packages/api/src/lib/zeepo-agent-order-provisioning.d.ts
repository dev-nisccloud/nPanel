import { type ZeepoAgentPlanType } from "./zeepo-agent-billing";
type PlanMeta = {
    zeepoPlanType: ZeepoAgentPlanType;
    tokenGrant: number;
    accumulateCredits: boolean;
};
export type ZeepoOrderContext = {
    userId: string | null;
    teamId: string | null;
    createdBy: string | null;
    orderId: string;
    currency: string;
};
export declare const ZEEPO_TOKEN_GRANT_OVERRIDE_METADATA_KEY = "zeepoTokenGrantOverride";
export type ZeepoOrderItem = {
    productId: string;
    productPlanId: string | null;
    billingCycle: string | null;
    itemPrice: string;
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
export declare function isZeepoAiAgentProduct(productId: string): boolean;
/**
 * Provision Zeepo AI Agent after payment. Returns subscription id to link on order item.
 */
export declare function provisionZeepoAgentOrderItem(order: ZeepoOrderContext, item: ZeepoOrderItem): Promise<{
    subscriptionId: string;
}>;
/** Read plan metadata for checkout / UI. */
export declare function getZeepoAgentPlanMeta(productPlanId: string): Promise<PlanMeta | null>;
export {};
