/**
 * Nisc Service Orders – independent API schemas and enums.
 * No Prisma or DB types. Used for router input/output and data transformation.
 * UI layer may define its own schemas with the same enum values for full independence.
 */
import { z } from "zod";
// ============================================================================
// Enums – independent from database schema
// ============================================================================
export const billingCycleSchema = z.enum([
    "MONTHLY",
    "YEARLY",
    "BIENNIALLY",
    "TRIENNIALLY",
    "QUADRENNIALLY",
    "CUSTOM",
    "ONE_TIME",
]);
export const niscOrderStatusSchema = z.enum([
    "PENDING",
    "PROCESSING",
    "COMPLETED",
    "FAILED",
    "PARTIAL",
]);
export const niscOrderItemStatusSchema = z.enum([
    "PENDING",
    "PROCESSING",
    "PROVISIONED",
    "FAILED",
    "SKIPPED",
]);
// ============================================================================
// Shared shapes (metadata, name servers)
// ============================================================================
export const transferItemMetadataSchema = z
    .object({
    /** Set when checkout starts (createCheckoutRequest); reused on createFromPayment. */
    domainTransferRequestId: z.string().optional(),
    transferAuthCode: z.string().optional(),
    nameServers: z
        .array(z.object({ name: z.string(), ip: z.string().optional() }))
        .optional(),
    useRegistrantInfo: z.enum(["myself", "customer"]).optional(),
    manualRegistrantDetails: z
        .object({
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        email: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        country: z.string().optional(),
        postalCode: z.string().optional(),
        phone: z.string().optional(),
    })
        .optional(),
})
    .optional();
export const hivelocityPeriodSchema = z.enum([
    "hourly",
    "monthly",
    "quarterly",
    "semi-annually",
    "annually",
    "biennial",
    "triennial",
]);
export const hivelocityInvoiceLineSchema = z.object({
    id: z.string(),
    kind: z.enum(["base", "os", "addon"]),
    name: z.string(),
    description: z.string().optional(),
    amountExVat: z.number(),
    optionId: z.number().optional(),
});
export const hivelocityItemMetadataSchema = z
    .object({
    /** `provision` = new server via Deployment API; `vps_upgrade` = scale-up; `vps_reload` = wipe & reinstall OS; `vps_reactivate` = restore suspended VPS after payment. */
    operation: z
        .enum(["provision", "vps_upgrade", "vps_reload", "vps_reactivate"])
        .default("provision"),
    /** Linked NISC subscription restored when operation is `vps_reactivate`. */
    niscSubscriptionId: z.string().min(1).optional(),
    hivelocityProductId: z.coerce.number().int().positive(),
    /** Existing VPS device id when operation is `vps_upgrade` or `vps_reload`. */
    hivelocityTargetDeviceId: z.coerce.number().int().positive().optional(),
    hivelocityCurrentProductId: z.coerce.number().int().positive().optional(),
    upgradeDeltaUsd: z.coerce.number().optional(),
    /** Target plan monthly price in display currency (ex-VAT). Used for subscription agreedPrice after upgrade. */
    targetMonthlyPriceExVat: z.coerce.number().optional(),
    /** Target plan monthly USD (pre-margin) for providerCost after upgrade. */
    targetMonthlyUsd: z.coerce.number().optional(),
    hivelocityLocationName: z.string().min(1),
    hivelocityOsName: z.string().min(1),
    hivelocityHostname: z.string().min(1),
    hivelocityPeriod: hivelocityPeriodSchema,
    hivelocityOptionIds: z.array(z.coerce.number().int()).default([]),
    /** Hivelocity product option id for the selected OS (Deployment API `options` array). */
    hivelocityOsOptionId: z.coerce.number().int().optional(),
    /** SSH key ids to preserve on reload (POST /device/{id}/reload). */
    hivelocityPublicSshKeyIds: z.array(z.coerce.number().int()).optional(),
    basePriceUsd: z.coerce.number().optional(),
    osPriceUsd: z.coerce.number().optional(),
    addonsPriceUsd: z.coerce.number().optional(),
    subtotalKes: z.coerce.number().optional(),
    totalKes: z.coerce.number().optional(),
    usdToKesRate: z.coerce.number().optional(),
    productType: z.enum(["DEDICATED_SERVERS", "VPS", "VDS"]).optional(),
    invoiceLines: z.array(hivelocityInvoiceLineSchema).optional(),
})
    .superRefine((data, ctx) => {
    if (data.operation === "vps_upgrade" && !data.hivelocityTargetDeviceId) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "hivelocityTargetDeviceId is required for VPS upgrades",
            path: ["hivelocityTargetDeviceId"],
        });
    }
    if (data.operation === "vps_upgrade" && data.productType && data.productType !== "VPS") {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "VPS upgrades require productType VPS",
            path: ["productType"],
        });
    }
    if (data.operation === "vps_reload" && !data.hivelocityTargetDeviceId) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "hivelocityTargetDeviceId is required for VPS OS reloads",
            path: ["hivelocityTargetDeviceId"],
        });
    }
    if (data.operation === "vps_reload" && !data.hivelocityOsOptionId) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "hivelocityOsOptionId is required for VPS OS reloads",
            path: ["hivelocityOsOptionId"],
        });
    }
    if (data.operation === "vps_reload" && data.productType && data.productType !== "VPS") {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "VPS OS reload orders require productType VPS",
            path: ["productType"],
        });
    }
    if (data.operation === "vps_reactivate" && !data.hivelocityTargetDeviceId) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "hivelocityTargetDeviceId is required for VPS reactivation",
            path: ["hivelocityTargetDeviceId"],
        });
    }
    if (data.operation === "vps_reactivate" && !data.niscSubscriptionId) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "niscSubscriptionId is required for VPS reactivation",
            path: ["niscSubscriptionId"],
        });
    }
    if (data.operation === "vps_reactivate" && data.productType && data.productType !== "VPS") {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "VPS reactivation orders require productType VPS",
            path: ["productType"],
        });
    }
});
export const HIVELOCITY_SERVICE_TYPES = [
    "dedicated_server_hosting",
    "vps_hosting",
    "vds_hosting",
];
function isHivelocityMetadataCandidate(value) {
    return value != null && typeof value === "object" && "hivelocityProductId" in value;
}
/** Route metadata to the correct schema. Transfer schema must not run first - it accepts any object. */
export function parseOrderItemMetadata(value) {
    if (value == null)
        return value;
    if (isHivelocityMetadataCandidate(value)) {
        return hivelocityItemMetadataSchema.parse(value);
    }
    return transferItemMetadataSchema.parse(value);
}
export const orderItemMetadataSchema = z.preprocess((value) => {
    if (value == null)
        return value;
    if (isHivelocityMetadataCandidate(value)) {
        return hivelocityItemMetadataSchema.parse(value);
    }
    return value;
}, z.union([hivelocityItemMetadataSchema, transferItemMetadataSchema, z.undefined(), z.null()]));
// ============================================================================
// Create order (agency manual order)
// ============================================================================
export const createOrderItemSchema = z.object({
    productId: z.string(),
    productPlanId: z.string(),
    billingCycle: billingCycleSchema.optional(),
    primaryDomain: z.string().optional(),
    domainSubscriptionId: z.string().optional(),
    metadata: orderItemMetadataSchema,
});
export const createOrderInputSchema = z
    .object({
    userId: z.string().optional(),
    teamId: z.string().optional(),
    items: z.array(createOrderItemSchema).min(1),
    promoCode: z.string().optional(),
    notes: z.string().optional(),
})
    .superRefine((data, ctx) => {
    if (!data.userId && !data.teamId) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Either userId or teamId is required",
            path: ["userId"],
        });
    }
});
// ============================================================================
// Get all / get by id / retry
// ============================================================================
export const getAllNiscOrdersInputSchema = z.object({
    userId: z.string().optional(),
    teamId: z.string().optional(),
    status: niscOrderStatusSchema.optional(),
    limit: z.number().min(1).max(100).default(50),
    offset: z.number().min(0).default(0),
});
export const getNiscOrderByIdInputSchema = z.object({ id: z.string() });
export const retryNiscOrderInputSchema = z.object({ niscOrderId: z.string() });
// ============================================================================
// Create from payment (checkout flow)
// ============================================================================
export const createFromPaymentMetadataSchema = z.record(z.string(), z.unknown()).optional().nullable();
export const createFromPaymentItemSchema = z.object({
    productId: z.string(),
    productPlanId: z.string().nullable().optional(),
    billingCycle: billingCycleSchema.optional(),
    primaryDomain: z.string().optional(),
    description: z.string().optional(),
    itemPrice: z.string(),
    itemSubtotal: z.string(),
    domainSubscriptionId: z.string().optional(),
    /** Passthrough at input; validated in createFromPayment handler by product serviceType. */
    metadata: createFromPaymentMetadataSchema,
});
export const createFromPaymentInputSchema = z.object({
    checkoutRequestId: z.string().min(1),
    items: z.array(createFromPaymentItemSchema).min(1),
    currency: z.string().default("KES"),
    teamId: z.string().optional(),
    /** Agency only: order / subscription owner (e.g. end customer user) instead of the payer session user. */
    billedForUserId: z.string().min(1).optional(),
    /**
     * Agency manual provision: skip invoice creation/email and customer order emails.
     * Stored on order.metadata for the QStash worker path.
     */
    skipInvoice: z.boolean().optional(),
});
