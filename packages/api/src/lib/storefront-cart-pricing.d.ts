import { z } from "zod";
export declare const storefrontBillingCycleSchema: z.ZodEnum<{
    MONTHLY: "MONTHLY";
    YEARLY: "YEARLY";
    BIENNIALLY: "BIENNIALLY";
    TRIENNIALLY: "TRIENNIALLY";
    QUADRENNIALLY: "QUADRENNIALLY";
}>;
export type StorefrontBillingCycle = z.infer<typeof storefrontBillingCycleSchema>;
/** Service checkout: 1 / 12 / 24 / 48 months. */
export declare const STOREFRONT_SERVICE_BILLING_CYCLES: readonly ["MONTHLY", "YEARLY", "BIENNIALLY", "QUADRENNIALLY"];
/** Domain registration terms (years only  never monthly). */
export declare const STOREFRONT_DOMAIN_BILLING_CYCLES: readonly ["YEARLY", "BIENNIALLY", "TRIENNIALLY", "QUADRENNIALLY"];
export declare function billingCycleToMonths(cycle: string | null | undefined): number | null;
export declare function billingCycleToYears(cycle: string | null | undefined): number;
export declare function isDomainYearlyBillingCycle(cycle: string | null | undefined): boolean;
/** Domains never use MONTHLY; transfers are always 1 year. */
export declare function normalizeStorefrontMainBillingCycle(serviceType: string, billingCycle: StorefrontBillingCycle): StorefrontBillingCycle;
export declare const storefrontCartMainLineSchema: z.ZodObject<{
    serviceType: z.ZodString;
    planId: z.ZodOptional<z.ZodString>;
    productId: z.ZodOptional<z.ZodString>;
    planName: z.ZodOptional<z.ZodString>;
    productName: z.ZodOptional<z.ZodString>;
    billingCycle: z.ZodDefault<z.ZodEnum<{
        MONTHLY: "MONTHLY";
        YEARLY: "YEARLY";
        BIENNIALLY: "BIENNIALLY";
        TRIENNIALLY: "TRIENNIALLY";
        QUADRENNIALLY: "QUADRENNIALLY";
    }>>;
    locationName: z.ZodOptional<z.ZodString>;
    bundleDomains: z.ZodOptional<z.ZodArray<z.ZodString>>;
    transferProvider: z.ZodOptional<z.ZodEnum<{
        kenic: "kenic";
        openprovider: "openprovider";
    }>>;
    providerPriceAmount: z.ZodOptional<z.ZodNumber>;
    providerPriceCurrency: z.ZodOptional<z.ZodString>;
    customerPriceAmount: z.ZodOptional<z.ZodNumber>;
    customerPriceCurrency: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const storefrontCartQuoteInputSchema: z.ZodObject<{
    main: z.ZodObject<{
        serviceType: z.ZodString;
        planId: z.ZodOptional<z.ZodString>;
        productId: z.ZodOptional<z.ZodString>;
        planName: z.ZodOptional<z.ZodString>;
        productName: z.ZodOptional<z.ZodString>;
        billingCycle: z.ZodDefault<z.ZodEnum<{
            MONTHLY: "MONTHLY";
            YEARLY: "YEARLY";
            BIENNIALLY: "BIENNIALLY";
            TRIENNIALLY: "TRIENNIALLY";
            QUADRENNIALLY: "QUADRENNIALLY";
        }>>;
        locationName: z.ZodOptional<z.ZodString>;
        bundleDomains: z.ZodOptional<z.ZodArray<z.ZodString>>;
        transferProvider: z.ZodOptional<z.ZodEnum<{
            kenic: "kenic";
            openprovider: "openprovider";
        }>>;
        providerPriceAmount: z.ZodOptional<z.ZodNumber>;
        providerPriceCurrency: z.ZodOptional<z.ZodString>;
        customerPriceAmount: z.ZodOptional<z.ZodNumber>;
        customerPriceCurrency: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    transferAuthCode: z.ZodOptional<z.ZodString>;
    upsellDomain: z.ZodOptional<z.ZodObject<{
        domain: z.ZodString;
        isExisting: z.ZodOptional<z.ZodBoolean>;
        isTransfer: z.ZodOptional<z.ZodBoolean>;
        provider: z.ZodOptional<z.ZodEnum<{
            kenic: "kenic";
            openprovider: "openprovider";
        }>>;
    }, z.core.$strip>>;
    upsellHosting: z.ZodOptional<z.ZodObject<{
        serviceType: z.ZodEnum<{
            web_hosting: "web_hosting";
            wordpress_hosting: "wordpress_hosting";
            email_hosting: "email_hosting";
        }>;
        planId: z.ZodString;
        billingCycle: z.ZodEnum<{
            MONTHLY: "MONTHLY";
            YEARLY: "YEARLY";
            BIENNIALLY: "BIENNIALLY";
            TRIENNIALLY: "TRIENNIALLY";
            QUADRENNIALLY: "QUADRENNIALLY";
        }>;
    }, z.core.$strip>>;
    hivelocity: z.ZodOptional<z.ZodObject<{
        hivelocityProductId: z.ZodNumber;
        locationName: z.ZodString;
        selectedOsId: z.ZodString;
        selectedOptionIds: z.ZodArray<z.ZodNumber>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type StorefrontCartQuoteInput = z.infer<typeof storefrontCartQuoteInputSchema>;
export type StorefrontCartQuote = {
    currency: string;
    monthlyPrice: number;
    yearlyPrice: number;
    planName: string;
    productName: string;
    serviceType: string;
    planId?: string;
    productId?: string;
    locationName?: string;
    billingCycle: StorefrontBillingCycle;
    subtotal: number;
    taxAmount: number;
    total: number;
};
/** Derive monthly/yearly KES from a plan's stored price + billing cycle. */
export declare function derivePlanPricingKes(niscPrice: string | null | undefined, planBillingCycle: string | null | undefined, checkoutCycle: StorefrontBillingCycle): {
    monthly: number;
    yearly: number;
};
export declare function pickCheckoutPrice(pricing: {
    monthly: number;
    yearly: number;
}, billingCycle: StorefrontBillingCycle): number;
export declare function resolveNiscPlanQuote(planId: string, billingCycle: StorefrontBillingCycle): Promise<{
    monthly: number;
    yearly: number;
    planName: string;
    currency: string;
}>;
export declare function resolveDomainRetailPriceKes(domain: string): Promise<number>;
export declare function resolveDomainTransferUpsellPriceKes(domain: string): Promise<number>;
export declare function resolveMainLineQuote(main: StorefrontCartQuoteInput["main"], hivelocity: StorefrontCartQuoteInput["hivelocity"]): Promise<{
    monthly: number;
    yearly: number;
    planName: string;
    productName: string;
    currency: string;
}>;
export declare function computeStorefrontCartQuote(input: StorefrontCartQuoteInput): Promise<StorefrontCartQuote>;
