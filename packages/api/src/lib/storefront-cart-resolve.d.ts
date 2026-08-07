import { z } from "zod";
import { storefrontCartQuoteInputSchema } from "./storefront-cart-pricing";
export declare const storefrontCartQuoteRequestSchema: z.ZodObject<{
    handoff: z.ZodOptional<z.ZodString>;
    main: z.ZodOptional<z.ZodObject<{
        serviceType: z.ZodOptional<z.ZodString>;
        planId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        productId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        planName: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        productName: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        billingCycle: z.ZodOptional<z.ZodDefault<z.ZodEnum<{
            MONTHLY: "MONTHLY";
            YEARLY: "YEARLY";
            BIENNIALLY: "BIENNIALLY";
            TRIENNIALLY: "TRIENNIALLY";
            QUADRENNIALLY: "QUADRENNIALLY";
        }>>>;
        locationName: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        bundleDomains: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString>>>;
        transferProvider: z.ZodOptional<z.ZodOptional<z.ZodEnum<{
            kenic: "kenic";
            openprovider: "openprovider";
        }>>>;
        providerPriceAmount: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
        providerPriceCurrency: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        customerPriceAmount: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
        customerPriceCurrency: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    }, z.core.$strip>>;
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
export type StorefrontCartQuoteRequest = z.infer<typeof storefrontCartQuoteRequestSchema>;
export declare function resolveStorefrontCartQuoteInput(input: StorefrontCartQuoteRequest): z.infer<typeof storefrontCartQuoteInputSchema>;
