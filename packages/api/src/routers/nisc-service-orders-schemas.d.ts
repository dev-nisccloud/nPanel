/**
 * Nisc Service Orders – independent API schemas and enums.
 * No Prisma or DB types. Used for router input/output and data transformation.
 * UI layer may define its own schemas with the same enum values for full independence.
 */
import { z } from "zod";
export declare const billingCycleSchema: z.ZodEnum<{
    MONTHLY: "MONTHLY";
    YEARLY: "YEARLY";
    BIENNIALLY: "BIENNIALLY";
    CUSTOM: "CUSTOM";
}>;
export type BillingCycle = z.infer<typeof billingCycleSchema>;
export declare const niscOrderStatusSchema: z.ZodEnum<{
    PENDING: "PENDING";
    PROCESSING: "PROCESSING";
    FAILED: "FAILED";
    COMPLETED: "COMPLETED";
    PARTIAL: "PARTIAL";
}>;
export type NiscOrderStatus = z.infer<typeof niscOrderStatusSchema>;
export declare const niscOrderItemStatusSchema: z.ZodEnum<{
    PENDING: "PENDING";
    PROCESSING: "PROCESSING";
    FAILED: "FAILED";
    PROVISIONED: "PROVISIONED";
    SKIPPED: "SKIPPED";
}>;
export type NiscOrderItemStatus = z.infer<typeof niscOrderItemStatusSchema>;
export declare const transferItemMetadataSchema: z.ZodOptional<z.ZodObject<{
    transferAuthCode: z.ZodOptional<z.ZodString>;
    nameServers: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        ip: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>;
}, z.core.$strip>>;
export type TransferItemMetadata = z.infer<typeof transferItemMetadataSchema>;
export declare const createOrderItemSchema: z.ZodObject<{
    productId: z.ZodString;
    productPlanId: z.ZodString;
    billingCycle: z.ZodOptional<z.ZodEnum<{
        MONTHLY: "MONTHLY";
        YEARLY: "YEARLY";
        BIENNIALLY: "BIENNIALLY";
        CUSTOM: "CUSTOM";
    }>>;
    primaryDomain: z.ZodOptional<z.ZodString>;
    domainSubscriptionId: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodObject<{
        transferAuthCode: z.ZodOptional<z.ZodString>;
        nameServers: z.ZodOptional<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            ip: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const createOrderInputSchema: z.ZodObject<{
    userId: z.ZodOptional<z.ZodString>;
    teamId: z.ZodOptional<z.ZodString>;
    items: z.ZodArray<z.ZodObject<{
        productId: z.ZodString;
        productPlanId: z.ZodString;
        billingCycle: z.ZodOptional<z.ZodEnum<{
            MONTHLY: "MONTHLY";
            YEARLY: "YEARLY";
            BIENNIALLY: "BIENNIALLY";
            CUSTOM: "CUSTOM";
        }>>;
        primaryDomain: z.ZodOptional<z.ZodString>;
        domainSubscriptionId: z.ZodOptional<z.ZodString>;
        metadata: z.ZodOptional<z.ZodObject<{
            transferAuthCode: z.ZodOptional<z.ZodString>;
            nameServers: z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                ip: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>>>;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
    promoCode: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type CreateOrderItemInput = z.infer<typeof createOrderItemSchema>;
export type CreateOrderInput = z.infer<typeof createOrderInputSchema>;
export declare const getAllNiscOrdersInputSchema: z.ZodObject<{
    userId: z.ZodOptional<z.ZodString>;
    teamId: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<{
        PENDING: "PENDING";
        PROCESSING: "PROCESSING";
        FAILED: "FAILED";
        COMPLETED: "COMPLETED";
        PARTIAL: "PARTIAL";
    }>>;
    limit: z.ZodDefault<z.ZodNumber>;
    offset: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip>;
export type GetAllNiscOrdersInput = z.infer<typeof getAllNiscOrdersInputSchema>;
export declare const getNiscOrderByIdInputSchema: z.ZodObject<{
    id: z.ZodString;
}, z.core.$strip>;
export type GetNiscOrderByIdInput = z.infer<typeof getNiscOrderByIdInputSchema>;
export declare const retryNiscOrderInputSchema: z.ZodObject<{
    niscOrderId: z.ZodString;
}, z.core.$strip>;
export type RetryNiscOrderInput = z.infer<typeof retryNiscOrderInputSchema>;
export declare const createFromPaymentItemSchema: z.ZodObject<{
    productId: z.ZodString;
    productPlanId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    billingCycle: z.ZodOptional<z.ZodEnum<{
        MONTHLY: "MONTHLY";
        YEARLY: "YEARLY";
        BIENNIALLY: "BIENNIALLY";
        CUSTOM: "CUSTOM";
    }>>;
    primaryDomain: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    itemPrice: z.ZodString;
    itemSubtotal: z.ZodString;
    domainSubscriptionId: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodObject<{
        transferAuthCode: z.ZodOptional<z.ZodString>;
        nameServers: z.ZodOptional<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            ip: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type CreateFromPaymentItemInput = z.infer<typeof createFromPaymentItemSchema>;
export declare const createFromPaymentInputSchema: z.ZodObject<{
    checkoutRequestId: z.ZodString;
    items: z.ZodArray<z.ZodObject<{
        productId: z.ZodString;
        productPlanId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        billingCycle: z.ZodOptional<z.ZodEnum<{
            MONTHLY: "MONTHLY";
            YEARLY: "YEARLY";
            BIENNIALLY: "BIENNIALLY";
            CUSTOM: "CUSTOM";
        }>>;
        primaryDomain: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        itemPrice: z.ZodString;
        itemSubtotal: z.ZodString;
        domainSubscriptionId: z.ZodOptional<z.ZodString>;
        metadata: z.ZodOptional<z.ZodObject<{
            transferAuthCode: z.ZodOptional<z.ZodString>;
            nameServers: z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                ip: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>>>;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
    currency: z.ZodDefault<z.ZodString>;
    teamId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type CreateFromPaymentInput = z.infer<typeof createFromPaymentInputSchema>;
