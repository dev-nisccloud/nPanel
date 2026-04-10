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
