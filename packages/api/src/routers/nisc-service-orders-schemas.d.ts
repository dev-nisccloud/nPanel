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
    COMPLETED: "COMPLETED";
    FAILED: "FAILED";
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
    domainTransferRequestId: z.ZodOptional<z.ZodString>;
    transferAuthCode: z.ZodOptional<z.ZodString>;
    nameServers: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        ip: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>;
    useRegistrantInfo: z.ZodOptional<z.ZodEnum<{
        customer: "customer";
        myself: "myself";
    }>>;
    manualRegistrantDetails: z.ZodOptional<z.ZodObject<{
        firstName: z.ZodOptional<z.ZodString>;
        lastName: z.ZodOptional<z.ZodString>;
        email: z.ZodOptional<z.ZodString>;
        address: z.ZodOptional<z.ZodString>;
        city: z.ZodOptional<z.ZodString>;
        country: z.ZodOptional<z.ZodString>;
        postalCode: z.ZodOptional<z.ZodString>;
        phone: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>>;
export type TransferItemMetadata = z.infer<typeof transferItemMetadataSchema>;
export declare const hivelocityPeriodSchema: z.ZodEnum<{
    hourly: "hourly";
    monthly: "monthly";
    quarterly: "quarterly";
    "semi-annually": "semi-annually";
    annually: "annually";
    biennial: "biennial";
    triennial: "triennial";
}>;
export type HivelocityPeriod = z.infer<typeof hivelocityPeriodSchema>;
export declare const hivelocityInvoiceLineSchema: z.ZodObject<{
    id: z.ZodString;
    kind: z.ZodEnum<{
        base: "base";
        os: "os";
        addon: "addon";
    }>;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    amountExVat: z.ZodNumber;
    optionId: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export type HivelocityInvoiceLine = z.infer<typeof hivelocityInvoiceLineSchema>;
export declare const hivelocityItemMetadataSchema: z.ZodObject<{
    operation: z.ZodDefault<z.ZodEnum<{
        provision: "provision";
        vps_upgrade: "vps_upgrade";
        vps_reload: "vps_reload";
        vps_reactivate: "vps_reactivate";
    }>>;
    niscSubscriptionId: z.ZodOptional<z.ZodString>;
    hivelocityProductId: z.ZodCoercedNumber<unknown>;
    hivelocityTargetDeviceId: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    hivelocityCurrentProductId: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    upgradeDeltaUsd: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    hivelocityLocationName: z.ZodString;
    hivelocityOsName: z.ZodString;
    hivelocityHostname: z.ZodString;
    hivelocityPeriod: z.ZodEnum<{
        hourly: "hourly";
        monthly: "monthly";
        quarterly: "quarterly";
        "semi-annually": "semi-annually";
        annually: "annually";
        biennial: "biennial";
        triennial: "triennial";
    }>;
    hivelocityOptionIds: z.ZodDefault<z.ZodArray<z.ZodCoercedNumber<unknown>>>;
    hivelocityOsOptionId: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    hivelocityPublicSshKeyIds: z.ZodOptional<z.ZodArray<z.ZodCoercedNumber<unknown>>>;
    basePriceUsd: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    osPriceUsd: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    addonsPriceUsd: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    subtotalKes: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    totalKes: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    usdToKesRate: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    productType: z.ZodOptional<z.ZodEnum<{
        DEDICATED_SERVERS: "DEDICATED_SERVERS";
        VPS: "VPS";
        VDS: "VDS";
    }>>;
    invoiceLines: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        kind: z.ZodEnum<{
            base: "base";
            os: "os";
            addon: "addon";
        }>;
        name: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        amountExVat: z.ZodNumber;
        optionId: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export type HivelocityItemMetadata = z.infer<typeof hivelocityItemMetadataSchema>;
export declare const HIVELOCITY_SERVICE_TYPES: readonly ["dedicated_server_hosting", "vps_hosting", "vds_hosting"];
/** Route metadata to the correct schema. Transfer schema must not run first - it accepts any object. */
export declare function parseOrderItemMetadata(value: unknown): TransferItemMetadata | HivelocityItemMetadata | undefined | null;
export declare const orderItemMetadataSchema: z.ZodPipe<z.ZodTransform<{} | null | undefined, unknown>, z.ZodUnion<readonly [z.ZodObject<{
    operation: z.ZodDefault<z.ZodEnum<{
        provision: "provision";
        vps_upgrade: "vps_upgrade";
        vps_reload: "vps_reload";
        vps_reactivate: "vps_reactivate";
    }>>;
    niscSubscriptionId: z.ZodOptional<z.ZodString>;
    hivelocityProductId: z.ZodCoercedNumber<unknown>;
    hivelocityTargetDeviceId: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    hivelocityCurrentProductId: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    upgradeDeltaUsd: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    hivelocityLocationName: z.ZodString;
    hivelocityOsName: z.ZodString;
    hivelocityHostname: z.ZodString;
    hivelocityPeriod: z.ZodEnum<{
        hourly: "hourly";
        monthly: "monthly";
        quarterly: "quarterly";
        "semi-annually": "semi-annually";
        annually: "annually";
        biennial: "biennial";
        triennial: "triennial";
    }>;
    hivelocityOptionIds: z.ZodDefault<z.ZodArray<z.ZodCoercedNumber<unknown>>>;
    hivelocityOsOptionId: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    hivelocityPublicSshKeyIds: z.ZodOptional<z.ZodArray<z.ZodCoercedNumber<unknown>>>;
    basePriceUsd: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    osPriceUsd: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    addonsPriceUsd: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    subtotalKes: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    totalKes: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    usdToKesRate: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    productType: z.ZodOptional<z.ZodEnum<{
        DEDICATED_SERVERS: "DEDICATED_SERVERS";
        VPS: "VPS";
        VDS: "VDS";
    }>>;
    invoiceLines: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        kind: z.ZodEnum<{
            base: "base";
            os: "os";
            addon: "addon";
        }>;
        name: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        amountExVat: z.ZodNumber;
        optionId: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>>;
}, z.core.$strip>, z.ZodOptional<z.ZodObject<{
    domainTransferRequestId: z.ZodOptional<z.ZodString>;
    transferAuthCode: z.ZodOptional<z.ZodString>;
    nameServers: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        ip: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>;
    useRegistrantInfo: z.ZodOptional<z.ZodEnum<{
        customer: "customer";
        myself: "myself";
    }>>;
    manualRegistrantDetails: z.ZodOptional<z.ZodObject<{
        firstName: z.ZodOptional<z.ZodString>;
        lastName: z.ZodOptional<z.ZodString>;
        email: z.ZodOptional<z.ZodString>;
        address: z.ZodOptional<z.ZodString>;
        city: z.ZodOptional<z.ZodString>;
        country: z.ZodOptional<z.ZodString>;
        postalCode: z.ZodOptional<z.ZodString>;
        phone: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>>, z.ZodUndefined, z.ZodNull]>>;
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
    metadata: z.ZodPipe<z.ZodTransform<{} | null | undefined, unknown>, z.ZodUnion<readonly [z.ZodObject<{
        operation: z.ZodDefault<z.ZodEnum<{
            provision: "provision";
            vps_upgrade: "vps_upgrade";
            vps_reload: "vps_reload";
            vps_reactivate: "vps_reactivate";
        }>>;
        niscSubscriptionId: z.ZodOptional<z.ZodString>;
        hivelocityProductId: z.ZodCoercedNumber<unknown>;
        hivelocityTargetDeviceId: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
        hivelocityCurrentProductId: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
        upgradeDeltaUsd: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
        hivelocityLocationName: z.ZodString;
        hivelocityOsName: z.ZodString;
        hivelocityHostname: z.ZodString;
        hivelocityPeriod: z.ZodEnum<{
            hourly: "hourly";
            monthly: "monthly";
            quarterly: "quarterly";
            "semi-annually": "semi-annually";
            annually: "annually";
            biennial: "biennial";
            triennial: "triennial";
        }>;
        hivelocityOptionIds: z.ZodDefault<z.ZodArray<z.ZodCoercedNumber<unknown>>>;
        hivelocityOsOptionId: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
        hivelocityPublicSshKeyIds: z.ZodOptional<z.ZodArray<z.ZodCoercedNumber<unknown>>>;
        basePriceUsd: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
        osPriceUsd: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
        addonsPriceUsd: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
        subtotalKes: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
        totalKes: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
        usdToKesRate: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
        productType: z.ZodOptional<z.ZodEnum<{
            DEDICATED_SERVERS: "DEDICATED_SERVERS";
            VPS: "VPS";
            VDS: "VDS";
        }>>;
        invoiceLines: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            kind: z.ZodEnum<{
                base: "base";
                os: "os";
                addon: "addon";
            }>;
            name: z.ZodString;
            description: z.ZodOptional<z.ZodString>;
            amountExVat: z.ZodNumber;
            optionId: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>>>;
    }, z.core.$strip>, z.ZodOptional<z.ZodObject<{
        domainTransferRequestId: z.ZodOptional<z.ZodString>;
        transferAuthCode: z.ZodOptional<z.ZodString>;
        nameServers: z.ZodOptional<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            ip: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>>;
        useRegistrantInfo: z.ZodOptional<z.ZodEnum<{
            customer: "customer";
            myself: "myself";
        }>>;
        manualRegistrantDetails: z.ZodOptional<z.ZodObject<{
            firstName: z.ZodOptional<z.ZodString>;
            lastName: z.ZodOptional<z.ZodString>;
            email: z.ZodOptional<z.ZodString>;
            address: z.ZodOptional<z.ZodString>;
            city: z.ZodOptional<z.ZodString>;
            country: z.ZodOptional<z.ZodString>;
            postalCode: z.ZodOptional<z.ZodString>;
            phone: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$strip>>, z.ZodUndefined, z.ZodNull]>>;
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
        metadata: z.ZodPipe<z.ZodTransform<{} | null | undefined, unknown>, z.ZodUnion<readonly [z.ZodObject<{
            operation: z.ZodDefault<z.ZodEnum<{
                provision: "provision";
                vps_upgrade: "vps_upgrade";
                vps_reload: "vps_reload";
                vps_reactivate: "vps_reactivate";
            }>>;
            niscSubscriptionId: z.ZodOptional<z.ZodString>;
            hivelocityProductId: z.ZodCoercedNumber<unknown>;
            hivelocityTargetDeviceId: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
            hivelocityCurrentProductId: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
            upgradeDeltaUsd: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
            hivelocityLocationName: z.ZodString;
            hivelocityOsName: z.ZodString;
            hivelocityHostname: z.ZodString;
            hivelocityPeriod: z.ZodEnum<{
                hourly: "hourly";
                monthly: "monthly";
                quarterly: "quarterly";
                "semi-annually": "semi-annually";
                annually: "annually";
                biennial: "biennial";
                triennial: "triennial";
            }>;
            hivelocityOptionIds: z.ZodDefault<z.ZodArray<z.ZodCoercedNumber<unknown>>>;
            hivelocityOsOptionId: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
            hivelocityPublicSshKeyIds: z.ZodOptional<z.ZodArray<z.ZodCoercedNumber<unknown>>>;
            basePriceUsd: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
            osPriceUsd: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
            addonsPriceUsd: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
            subtotalKes: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
            totalKes: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
            usdToKesRate: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
            productType: z.ZodOptional<z.ZodEnum<{
                DEDICATED_SERVERS: "DEDICATED_SERVERS";
                VPS: "VPS";
                VDS: "VDS";
            }>>;
            invoiceLines: z.ZodOptional<z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                kind: z.ZodEnum<{
                    base: "base";
                    os: "os";
                    addon: "addon";
                }>;
                name: z.ZodString;
                description: z.ZodOptional<z.ZodString>;
                amountExVat: z.ZodNumber;
                optionId: z.ZodOptional<z.ZodNumber>;
            }, z.core.$strip>>>;
        }, z.core.$strip>, z.ZodOptional<z.ZodObject<{
            domainTransferRequestId: z.ZodOptional<z.ZodString>;
            transferAuthCode: z.ZodOptional<z.ZodString>;
            nameServers: z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                ip: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>>>;
            useRegistrantInfo: z.ZodOptional<z.ZodEnum<{
                customer: "customer";
                myself: "myself";
            }>>;
            manualRegistrantDetails: z.ZodOptional<z.ZodObject<{
                firstName: z.ZodOptional<z.ZodString>;
                lastName: z.ZodOptional<z.ZodString>;
                email: z.ZodOptional<z.ZodString>;
                address: z.ZodOptional<z.ZodString>;
                city: z.ZodOptional<z.ZodString>;
                country: z.ZodOptional<z.ZodString>;
                postalCode: z.ZodOptional<z.ZodString>;
                phone: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>>;
        }, z.core.$strip>>, z.ZodUndefined, z.ZodNull]>>;
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
        COMPLETED: "COMPLETED";
        FAILED: "FAILED";
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
export declare const createFromPaymentMetadataSchema: z.ZodNullable<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
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
    metadata: z.ZodNullable<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
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
        metadata: z.ZodNullable<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
    }, z.core.$strip>>;
    currency: z.ZodDefault<z.ZodString>;
    teamId: z.ZodOptional<z.ZodString>;
    billedForUserId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type CreateFromPaymentInput = z.infer<typeof createFromPaymentInputSchema>;
