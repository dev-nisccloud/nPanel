export declare function processHivelocityOrderItem(order: {
    teamId: string | null;
    userId: string | null;
    createdBy: string | null;
    id: string;
    currency: string;
    orderNumber?: string;
}, item: {
    id: string;
    productId: string;
    productPlanId: string | null;
    billingCycle: string | null;
    itemPrice: string;
    itemSubtotal: string;
    description: string | null;
    metadata: unknown;
    product: {
        name: string;
        serviceType: string;
    };
}): Promise<{
    ok: true;
    subscriptionId: string;
    rawResponse: unknown;
} | {
    ok: false;
    error: string;
    errorDetails?: Record<string, unknown>;
}>;
