import { storefrontCartQuoteRequestSchema } from "../../lib/storefront-cart-resolve";
export declare const storefrontCartRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /** Issue a signed handoff token for buy-now navigation (?h=…). */
    createHandoff: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            serviceType: string;
            productId?: string | undefined;
            billingCycle?: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "TRIENNIALLY" | "QUADRENNIALLY" | undefined;
            productName?: string | undefined;
            locationName?: string | undefined;
            providerPriceAmount?: number | undefined;
            providerPriceCurrency?: string | undefined;
            customerPriceAmount?: number | undefined;
            customerPriceCurrency?: string | undefined;
            planId?: string | undefined;
            planName?: string | undefined;
            bundleDomains?: string[] | undefined;
            transferProvider?: "kenic" | "openprovider" | undefined;
        };
        output: {
            handoff: string;
        };
        meta: object;
    }>;
    /** Resolve authoritative pricing (domains re-checked via KENIC/OpenProvider). */
    quote: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            handoff?: string | undefined;
            main?: {
                serviceType?: string | undefined;
                planId?: string | undefined;
                productId?: string | undefined;
                planName?: string | undefined;
                productName?: string | undefined;
                billingCycle?: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "TRIENNIALLY" | "QUADRENNIALLY" | undefined;
                locationName?: string | undefined;
                bundleDomains?: string[] | undefined;
                transferProvider?: "kenic" | "openprovider" | undefined;
                providerPriceAmount?: number | undefined;
                providerPriceCurrency?: string | undefined;
                customerPriceAmount?: number | undefined;
                customerPriceCurrency?: string | undefined;
            } | undefined;
            transferAuthCode?: string | undefined;
            upsellDomain?: {
                domain: string;
                isExisting?: boolean | undefined;
                isTransfer?: boolean | undefined;
                provider?: "kenic" | "openprovider" | undefined;
            } | undefined;
            upsellHosting?: {
                serviceType: "web_hosting" | "wordpress_hosting" | "email_hosting";
                planId: string;
                billingCycle: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "TRIENNIALLY" | "QUADRENNIALLY";
            } | undefined;
            hivelocity?: {
                hivelocityProductId: number;
                locationName: string;
                selectedOsId: string;
                selectedOptionIds: number[];
            } | undefined;
        };
        output: import("../../lib/storefront-cart-pricing").StorefrontCartQuote;
        meta: object;
    }>;
}>>;
export { storefrontCartQuoteRequestSchema as quoteRequestSchema };
