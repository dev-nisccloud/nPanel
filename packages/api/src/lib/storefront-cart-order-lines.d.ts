import { computeStorefrontCartQuote, type StorefrontBillingCycle, type StorefrontCartQuoteInput } from "./storefront-cart-pricing";
export type StorefrontCartOrderLine = {
    productId: string;
    productPlanId: string | null;
    billingCycle: StorefrontBillingCycle;
    primaryDomain: string | null;
    itemPrice: number;
    description: string | null;
    metadata: Record<string, unknown> | null;
};
export declare function buildStorefrontCartOrderLines(input: {
    cart: StorefrontCartQuoteInput;
    primaryDomain?: string;
    fallbackProductId?: string;
}): Promise<{
    lines: StorefrontCartOrderLine[];
    quote: Awaited<ReturnType<typeof computeStorefrontCartQuote>>;
}>;
