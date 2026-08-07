import { z } from "zod";
export declare const JENGA_CURRENCIES: readonly ["KES", "TZS", "UGX", "USD", "EUR", "GBP"];
export type JengaCurrency = (typeof JENGA_CURRENCIES)[number];
export type JengaEnvironment = "test" | "live";
export interface JengaConfig {
    apiKey: string;
    merchantCode: string;
    consumerSecret: string;
    privateKeyPath: string;
    environment: JengaEnvironment;
    defaultCallbackUrl: string;
    ipnUsername?: string;
    ipnPassword?: string;
    paymentTimeLimit?: string;
    defaultCountryCode?: string;
    defaultCurrency?: string;
}
export interface JengaAuthResponse {
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
    issuedAt: string;
    tokenType: "Bearer";
}
export declare const jengaCustomerFieldsSchema: z.ZodObject<{
    customerFirstName: z.ZodString;
    customerLastName: z.ZodString;
    customerEmail: z.ZodString;
    customerPhone: z.ZodString;
    customerAddress: z.ZodString;
    customerPostalCodeZip: z.ZodString;
    countryCode: z.ZodString;
}, z.core.$strip>;
export declare const jengaOrderReferenceSchema: z.ZodString;
export declare const jengaOrderIntentSchema: z.ZodObject<{
    source: z.ZodEnum<{
        buy_now: "buy_now";
        global_buy_now: "global_buy_now";
        storefront: "storefront";
    }>;
    returnPath: z.ZodOptional<z.ZodString>;
    returnOrigin: z.ZodOptional<z.ZodString>;
    items: z.ZodOptional<z.ZodArray<z.ZodUnknown>>;
    currency: z.ZodOptional<z.ZodString>;
    teamId: z.ZodOptional<z.ZodString>;
    billedForUserId: z.ZodOptional<z.ZodString>;
    skipInvoice: z.ZodOptional<z.ZodBoolean>;
    cart: z.ZodOptional<z.ZodUnknown>;
    planId: z.ZodOptional<z.ZodString>;
    productId: z.ZodOptional<z.ZodString>;
    billingCycle: z.ZodOptional<z.ZodString>;
    primaryDomain: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const initiateCardPaymentInputSchema: z.ZodObject<{
    customerFirstName: z.ZodString;
    customerLastName: z.ZodString;
    customerEmail: z.ZodString;
    customerPhone: z.ZodString;
    customerAddress: z.ZodString;
    customerPostalCodeZip: z.ZodString;
    countryCode: z.ZodString;
    amount: z.ZodNumber;
    currency: z.ZodDefault<z.ZodEnum<{
        USD: "USD";
        EUR: "EUR";
        GBP: "GBP";
        KES: "KES";
        TZS: "TZS";
        UGX: "UGX";
    }>>;
    productType: z.ZodDefault<z.ZodEnum<{
        Product: "Product";
        Service: "Service";
    }>>;
    productDescription: z.ZodString;
    paymentTimeLimit: z.ZodOptional<z.ZodString>;
    teamId: z.ZodOptional<z.ZodString>;
    orderIntent: z.ZodOptional<z.ZodObject<{
        source: z.ZodEnum<{
            buy_now: "buy_now";
            global_buy_now: "global_buy_now";
            storefront: "storefront";
        }>;
        returnPath: z.ZodOptional<z.ZodString>;
        returnOrigin: z.ZodOptional<z.ZodString>;
        items: z.ZodOptional<z.ZodArray<z.ZodUnknown>>;
        currency: z.ZodOptional<z.ZodString>;
        teamId: z.ZodOptional<z.ZodString>;
        billedForUserId: z.ZodOptional<z.ZodString>;
        skipInvoice: z.ZodOptional<z.ZodBoolean>;
        cart: z.ZodOptional<z.ZodUnknown>;
        planId: z.ZodOptional<z.ZodString>;
        productId: z.ZodOptional<z.ZodString>;
        billingCycle: z.ZodOptional<z.ZodString>;
        primaryDomain: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type InitiateCardPaymentInput = z.infer<typeof initiateCardPaymentInputSchema>;
export declare const getJengaPaymentStatusInputSchema: z.ZodObject<{
    orderReference: z.ZodString;
}, z.core.$strip>;
export interface JengaPaymentRequest {
    orderAmount: number;
    orderReference: string;
    currency: string;
    productType: "Product" | "Service";
    productDescription: string;
    paymentTimeLimit: string;
    customerFirstName: string;
    customerLastName: string;
    customerEmail: string;
    customerPhone: string;
    customerAddress: string;
    customerPostalCodeZip: string;
    countryCode: string;
    callbackUrl?: string;
    extraData?: string;
    secondaryReference?: string;
}
export interface JengaPaymentInitResult {
    checkoutUrl: string;
    paymentData: Record<string, string>;
}
export declare const jengaCallbackQuerySchema: z.ZodObject<{
    transactionId: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodString>;
    date: z.ZodOptional<z.ZodString>;
    desc: z.ZodOptional<z.ZodString>;
    amount: z.ZodOptional<z.ZodString>;
    orderReference: z.ZodOptional<z.ZodString>;
    hash: z.ZodOptional<z.ZodString>;
    extraData: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type JengaCallbackQuery = z.infer<typeof jengaCallbackQuerySchema>;
export declare const jengaIpnPayloadSchema: z.ZodObject<{
    callbackType: z.ZodLiteral<"IPN">;
    customer: z.ZodObject<{
        name: z.ZodString;
        mobileNumber: z.ZodString;
        reference: z.ZodString;
    }, z.core.$strip>;
    transaction: z.ZodObject<{
        date: z.ZodString;
        reference: z.ZodString;
        paymentMode: z.ZodString;
        amount: z.ZodNumber;
        currency: z.ZodString;
        billNumber: z.ZodString;
        servedBy: z.ZodOptional<z.ZodString>;
        additionalInfo: z.ZodOptional<z.ZodString>;
        orderAmount: z.ZodNumber;
        serviceCharge: z.ZodNumber;
        orderCurrency: z.ZodString;
        status: z.ZodEnum<{
            FAILED: "FAILED";
            SUCCESS: "SUCCESS";
        }>;
        remarks: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    bank: z.ZodObject<{
        reference: z.ZodString;
        transactionType: z.ZodString;
        account: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export type JengaIpnPayload = z.infer<typeof jengaIpnPayloadSchema>;
export type JengaPaymentMetadata = {
    source?: "buy_now" | "global_buy_now" | "storefront";
    returnPath?: string;
    returnOrigin?: string;
    orderReference: string;
    customer?: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        address: string;
        postalCode: string;
        countryCode: string;
    };
    items?: unknown[];
    currency?: string;
    teamId?: string;
    billedForUserId?: string;
    skipInvoice?: boolean;
    cart?: unknown;
    planId?: string;
    productId?: string;
    billingCycle?: string;
    primaryDomain?: string;
};
