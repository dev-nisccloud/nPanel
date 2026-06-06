import { z } from "zod";
/**
 * Hivelocity Facilities (/inventory/locations)
 *
 * Notes:
 * - `edge` indicates an Edge facility (usually code prefixed with `EDGE-`).
 * - `core` indicates a Core facility.
 * - `location_option_ids` are IDs used by Hivelocity internally to represent selectable
 *   "location options" for inventory/products in that facility. You'll see the related
 *   field `location_option_id` on `/inventory/product` items (used to tie a product
 *   permutation to a specific facility option).
 */
export const hivelocityFacilitySchema = z.object({
    id: z.number().int(),
    title: z.string(),
    code: z.string(),
    edge: z.boolean(),
    core: z.boolean(),
    location_option_ids: z.array(z.number().int()).default([]),
    location: z.object({
        city: z.string(),
        state: z.string(),
        country: z.string(),
    }),
});
export const hivelocityFacilitiesResponseSchema = z.array(hivelocityFacilitySchema);
/**
 * Hivelocity Products Inventory
 *
 * Endpoints:
 * - GET /inventory/product
 * - GET /inventory/product/{productId}
 *
 * The Hivelocity OpenAPI schema models `/inventory/product` as an object whose keys are
 * grouping buckets (commonly facility codes like "ALB1", "TPA1", etc) and whose values
 * are arrays of `Stock` records.
 */
export const hivelocityProductStockSchema = z
    .object({
    product_id: z.number().int(),
    // API returns null frequently for bare-metal rows; normalize for consumers.
    product_name: z
        .union([z.string(), z.null()])
        .transform((v) => (typeof v === "string" ? v : "")),
    stock: z.enum(["available", "limited", "unavailable"]),
    data_center: z.string(),
    location_option_id: z.number().int(),
    edge: z.boolean(),
    core: z.boolean(),
    is_disk_upgradable: z.boolean(),
    is_sps: z.boolean(),
    is_vps: z.boolean(),
    is_vds: z.boolean(),
    // Human-readable spec strings (present for many bare-metal products)
    product_cpu: z.string().optional(),
    product_cpu_cores: z.string().optional(),
    product_memory: z.string().optional(),
    product_drive: z.string().optional(),
    product_bandwidth: z.string().optional(),
    product_gpu: z.string().optional(),
    // Structured spec blobs (shape varies by product)
    processor_info: z.unknown().optional(),
    product_drive_info: z.unknown().optional(),
    product_defaults: z.unknown().optional(),
    // Pricing fields
    product_hourly_price: z.number().optional(),
    product_monthly_price: z.number().optional(),
    product_quarterly_price: z.number().optional(),
    product_semi_annually_price: z.number().optional(),
    product_annually_price: z.number().optional(),
    product_biennial_price: z.number().optional(),
    product_triennial_price: z.number().optional(),
    // Outlet/sale fields
    product_on_sale: z.boolean().optional(),
    product_original_price: z.number().optional(),
    product_new: z.boolean().optional(),
    // Per-location premiums (may be 0)
    hourly_location_premium: z.number().optional(),
    monthly_location_premium: z.number().optional(),
    quarterly_location_premium: z.number().optional(),
    semi_annually_location_premium: z.number().optional(),
    annually_location_premium: z.number().optional(),
    biennial_location_premium: z.number().optional(),
    triennial_location_premium: z.number().optional(),
    // Billing availability
    product_disabled_billing_periods: z.array(z.string()).optional(),
    // Deprecated (still observed in some payloads)
    product_display_price: z.number().optional(),
})
    .passthrough();
export function normalizeHivelocityInventory(raw) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw))
        return {};
    const normalized = {};
    for (const [bucket, value] of Object.entries(raw)) {
        if (!Array.isArray(value)) {
            normalized[bucket] = [];
            continue;
        }
        // Parse row-by-row so one bad row never wipes a whole facility bucket.
        normalized[bucket] = value
            .map((item) => hivelocityProductStockSchema.safeParse(item))
            .filter((r) => r.success)
            .map((r) => r.data);
    }
    return normalized;
}
// Kept for places that want a Zod schema handle (e.g. unions). Parses using the normalizer.
export const hivelocityInventoryResponseSchema = z.unknown().transform((v) => normalizeHivelocityInventory(v));
/**
 * `/inventory/product/{productId}` is not fully documented in the public portal.
 * In practice we accept either:
 * - the same grouped Inventory object, or
 * - a flat list of Stock items, or
 * - a single Stock item.
 */
export const hivelocityProductByIdResponseSchema = z.union([
    // For by-id, accept either normalized inventory, a flat list, or a single item.
    hivelocityInventoryResponseSchema,
    z.array(hivelocityProductStockSchema),
    hivelocityProductStockSchema,
]);
// ---------------------------------------------------------------------------
// Account Device Resources
// ---------------------------------------------------------------------------
/**
 * Hivelocity Device (GET /device/ → Device-dump)
 *
 * Schema matches the official Hivelocity OpenAPI v2 spec exactly.
 *
 * Key field notes (verified from the swagger JSON):
 * - Only `name` is marked required per the spec.
 * - `powerStatus` is typed as `object` in the spec (NOT a string).
 *   Using z.unknown() so the object never causes parse failures.
 * - `location`    is also typed as `object` (not a string).
 * - `name`        is the user-given custom name.
 * - `status`      is "active" | "inactive" (device lifecycle, not power).
 * - `deviceType`  is the hardware description ("1U Server", "VDS", etc).
 */
export const hivelocityDeviceDumpSchema = z
    .object({
    // Required custom name
    name: z.string(),
    deviceId: z.number().int().optional(),
    hostname: z
        .union([z.string(), z.null()])
        .transform((v) => v ?? "")
        .optional(),
    primaryIp: z
        .union([z.string(), z.null()])
        .transform((v) => v ?? "")
        .optional(),
    // Lifecycle status e.g. "active"
    status: z.string().optional(),
    // Hardware description e.g. "VPS Instance", "1U Server"
    deviceType: z.string().optional(),
    deviceTypeGroup: z.string().optional(),
    // Power status (can be string "ON"/"OFF" or an object in some responses)
    powerStatus: z.unknown().optional(),
    // Detailed location object seen in live response
    location: z
        .object({
        facility: z.string().optional(),
        facility_title: z.string().optional(),
        rack: z.string().optional(),
        rack_id: z.number().int().optional(),
        row_name: z.string().optional(),
        position: z.string().optional(),
    })
        .partial()
        .or(z.unknown())
        .optional(),
    // Billing info seen in live response
    billingInfo: z
        .object({
        period: z.string().optional(),
        price: z.number().optional(),
    })
        .partial()
        .optional(),
    tags: z.array(z.string()).default([]),
    displayedTags: z
        .array(z.object({
        key: z.string(),
        value: z.any(),
    }))
        .optional(),
    isManaged: z.boolean().nullish(),
    ipmiEnabled: z.boolean().nullish(),
    hasCancellation: z.boolean().nullish(),
    isReload: z.boolean().nullish(),
    spsStatus: z.string().optional(),
    monitorsUp: z.number().int().optional(),
    monitorsTotal: z.number().int().optional(),
    servicePlan: z.number().int().optional(),
    productId: z.number().int().optional(),
    lastInvoiceId: z.number().int().optional(),
    createdDate: z.string().optional(),
})
    .passthrough();
export const hivelocityDevicesResponseSchema = z.array(hivelocityDeviceDumpSchema);
// ---------------------------------------------------------------------------
/**
 * Hivelocity VPS Instance (GET /vps/ → VPS)
 *
 * Dedicated VPS instances in the account. These come from a completely separate
 * endpoint and schema from bare-metal devices.
 *
 * Fields from the `VPS` definition in the official OpenAPI spec.
 */
export const hivelocityVpsSchema = z
    .object({
    id: z.union([z.string(), z.number()]).transform((v) => String(v)).optional(),
    hostname: z
        .union([z.string(), z.null()])
        .transform((v) => v ?? "")
        .optional(),
    status: z
        .union([z.string(), z.null()])
        .transform((v) => v ?? "unknown")
        .optional(),
    primaryIp: z
        .union([z.string(), z.null()])
        .transform((v) => v ?? "")
        .optional(),
    // vCPU count
    cpus: z.number().int().optional(),
    // RAM in GB
    memory: z.number().optional(),
    // Primary disk in GB
    disk: z.number().optional(),
    osName: z
        .union([z.string(), z.null()])
        .transform((v) => v ?? "")
        .optional(),
    facilityCode: z
        .union([z.string(), z.null()])
        .transform((v) => v ?? "")
        .optional(),
    networkId: z
        .union([z.string(), z.null()])
        .transform((v) => v ?? null)
        .nullable()
        .optional(),
    hostId: z
        .union([z.string(), z.null()])
        .transform((v) => v ?? null)
        .nullable()
        .optional(),
    storageId: z
        .union([z.string(), z.null()])
        .transform((v) => v ?? null)
        .nullable()
        .optional(),
    createdAt: z
        .union([z.string(), z.null()])
        .transform((v) => v ?? null)
        .nullable()
        .optional(),
})
    .passthrough();
export const hivelocityVpsListResponseSchema = z.array(hivelocityVpsSchema);
// ---------------------------------------------------------------------------
// Storage & Snapshot Resources
// ---------------------------------------------------------------------------
export const hivelocityVpsSnapshotScheduleSchema = z.object({
    snapshotScheduleId: z.string().optional(),
    volumeId: z.string(),
    intervalType: z.enum(["HOURLY", "DAILY", "WEEKLY", "MONTHLY"]),
    timezone: z.string(),
    hour: z.number().int().min(0).max(23).optional(),
    minute: z.number().int().min(0).max(59).optional(),
    day: z.number().int().min(1).max(28).optional(),
    weekday: z.number().int().min(1).max(7).optional(),
    maxSnapshots: z.number().int().positive(),
}).passthrough();
export const hivelocityVpsSnapshotScheduleCreateSchema = hivelocityVpsSnapshotScheduleSchema.omit({
    snapshotScheduleId: true,
}).extend({
    facilityCode: z.string(),
    clientId: z.number().int().optional(),
});
export const hivelocityVpsVolumeSchema = z.object({
    volumeId: z.string(),
    deviceId: z.number().int(),
    facilityCode: z.string(),
    size: z.number().int(), // in bytes
    type: z.enum(["ROOT", "DATADISK"]),
    createdAt: z.string().optional(),
}).passthrough();
export const hivelocityVpsVolumeCreateSchema = z.object({
    deviceId: z.number().int(),
    size: z.number().int(), // in GiB (50, 100, 200, 500)
});
export const hivelocityVpsVolumeUpdateSchema = z.object({
    deviceId: z.number().int().optional(),
    size: z.number().int(), // in GiB
});
export const hivelocityVpsVolumeDeleteSchema = z.object({
    deviceId: z.number().int().optional(),
});
export const hivelocityVpsSnapshotRestoreSchema = z.object({
    facilityCode: z.string(),
    clientId: z.number().int().optional(),
});
export const hivelocityNetworkTaskSchema = z.object({
    taskId: z.string(),
    clientId: z.number().int().optional(),
    deviceId: z.number().int().optional(),
    result: z.string().nullable().optional(), // Success|Pending|Failed
    metaData: z.string().optional(),
    taskCreated: z.unknown().optional(),
    taskUpdated: z.unknown().optional(),
}).passthrough();
