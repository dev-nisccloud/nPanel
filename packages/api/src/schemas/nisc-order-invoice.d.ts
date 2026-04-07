import { z } from "zod";
/** Billing cycle for subscription/plan – API enum. */
export declare const billingCycleSchema: z.ZodEnum<{
    MONTHLY: "MONTHLY";
    YEARLY: "YEARLY";
    BIENNIALLY: "BIENNIALLY";
}>;
export type BillingCycleType = z.infer<typeof billingCycleSchema>;
/** Product reference (name only) in an order item. */
export declare const orderItemProductSchema: z.ZodObject<{
    name: z.ZodString;
}, z.core.$strip>;
/** Product plan reference (name only), optional for items without a plan. */
export declare const orderItemProductPlanSchema: z.ZodNullable<z.ZodObject<{
    name: z.ZodString;
}, z.core.$strip>>;
/** Single Nisc order item as used for invoice creation. */
export declare const niscOrderItemForInvoiceSchema: z.ZodObject<{
    itemPrice: z.ZodString;
    itemSubtotal: z.ZodString;
    primaryDomain: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    billingCycle: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    product: z.ZodObject<{
        name: z.ZodString;
    }, z.core.$strip>;
    productPlan: z.ZodNullable<z.ZodObject<{
        name: z.ZodString;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type NiscOrderItemForInvoice = z.infer<typeof niscOrderItemForInvoiceSchema>;
/** Nisc order with items as accepted for auto-invoice creation. */
export declare const niscOrderForInvoiceSchema: z.ZodObject<{
    id: z.ZodString;
    teamId: z.ZodNullable<z.ZodString>;
    currency: z.ZodString;
    orderNumber: z.ZodString;
    createdAt: z.ZodCoercedDate<unknown>;
    orderItems: z.ZodArray<z.ZodObject<{
        itemPrice: z.ZodString;
        itemSubtotal: z.ZodString;
        primaryDomain: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        billingCycle: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        product: z.ZodObject<{
            name: z.ZodString;
        }, z.core.$strip>;
        productPlan: z.ZodNullable<z.ZodObject<{
            name: z.ZodString;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type NiscOrderForInvoice = z.infer<typeof niscOrderForInvoiceSchema>;
