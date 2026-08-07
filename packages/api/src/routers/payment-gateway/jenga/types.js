import { z } from "zod";
export const JENGA_CURRENCIES = ["KES", "TZS", "UGX", "USD", "EUR", "GBP"];
export const jengaCustomerFieldsSchema = z.object({
    customerFirstName: z.string().min(1).max(100),
    customerLastName: z.string().min(1).max(100),
    customerEmail: z.string().email().max(200),
    customerPhone: z
        .string()
        .min(10)
        .max(20)
        .regex(/^[+\d\s()-]+$/, "Invalid phone number"),
    customerAddress: z.string().min(1).max(200),
    customerPostalCodeZip: z.string().min(1).max(20),
    countryCode: z
        .string()
        .length(2)
        .regex(/^[A-Z]{2}$/, "Country code must be Alpha-2 (e.g. KE)"),
});
export const jengaOrderReferenceSchema = z
    .string()
    .min(8)
    .max(32)
    .regex(/^[a-zA-Z0-9]+$/, "Order reference must be alphanumeric");
export const jengaOrderIntentSchema = z.object({
    source: z.enum(["buy_now", "global_buy_now", "storefront"]),
    returnPath: z.string().optional(),
    returnOrigin: z.string().url().optional(),
    items: z.array(z.unknown()).optional(),
    currency: z.string().optional(),
    teamId: z.string().optional(),
    billedForUserId: z.string().optional(),
    skipInvoice: z.boolean().optional(),
    /** Storefront cart snapshot for createFromPayment */
    cart: z.unknown().optional(),
    planId: z.string().optional(),
    productId: z.string().optional(),
    billingCycle: z.string().optional(),
    primaryDomain: z.string().optional(),
});
export const initiateCardPaymentInputSchema = jengaCustomerFieldsSchema.extend({
    amount: z.number().positive(),
    currency: z.enum(JENGA_CURRENCIES).default("KES"),
    productType: z.enum(["Product", "Service"]).default("Service"),
    productDescription: z.string().min(1).max(200),
    paymentTimeLimit: z.string().min(1).max(20).optional(),
    teamId: z.string().optional(),
    /** Order intent for post-redirect createFromPayment */
    orderIntent: jengaOrderIntentSchema.optional(),
});
export const getJengaPaymentStatusInputSchema = z.object({
    orderReference: jengaOrderReferenceSchema,
});
export const jengaCallbackQuerySchema = z.object({
    transactionId: z.string().optional(),
    status: z.string().optional(),
    date: z.string().optional(),
    desc: z.string().optional(),
    amount: z.string().optional(),
    orderReference: z.string().optional(),
    hash: z.string().optional(),
    extraData: z.string().optional(),
});
export const jengaIpnPayloadSchema = z.object({
    callbackType: z.literal("IPN"),
    customer: z.object({
        name: z.string(),
        mobileNumber: z.string(),
        reference: z.string(),
    }),
    transaction: z.object({
        date: z.string(),
        reference: z.string(),
        paymentMode: z.string(),
        amount: z.number(),
        currency: z.string(),
        billNumber: z.string(),
        servedBy: z.string().optional(),
        additionalInfo: z.string().optional(),
        orderAmount: z.number(),
        serviceCharge: z.number(),
        orderCurrency: z.string(),
        status: z.enum(["SUCCESS", "FAILED"]),
        remarks: z.string().optional(),
    }),
    bank: z.object({
        reference: z.string(),
        transactionType: z.string(),
        account: z.string().nullable().optional(),
    }),
});
