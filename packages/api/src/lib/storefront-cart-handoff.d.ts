import { z } from "zod";
import { type StorefrontBillingCycle } from "./storefront-cart-pricing";
export declare const storefrontCartHandoffPayloadSchema: z.ZodObject<{
    v: z.ZodLiteral<1>;
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
    iat: z.ZodNumber;
    exp: z.ZodNumber;
}, z.core.$strip>;
export type StorefrontCartHandoffPayload = z.infer<typeof storefrontCartHandoffPayloadSchema>;
export type StorefrontCartHandoffInput = Omit<StorefrontCartHandoffPayload, "v" | "iat" | "exp">;
export declare function signStorefrontCartHandoff(input: StorefrontCartHandoffInput): string;
export type VerifyStorefrontCartHandoffResult = {
    ok: true;
    payload: StorefrontCartHandoffPayload;
} | {
    ok: false;
    reason: "invalid" | "expired" | "malformed";
};
export declare function verifyStorefrontCartHandoff(token: string): VerifyStorefrontCartHandoffResult;
export declare function handoffPayloadToQuoteMain(payload: StorefrontCartHandoffPayload): {
    serviceType: string;
    planId?: string;
    productId?: string;
    planName?: string;
    productName?: string;
    billingCycle: StorefrontBillingCycle;
    locationName?: string;
    bundleDomains?: string[];
};
