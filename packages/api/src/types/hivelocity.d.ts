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
export declare const hivelocityFacilitySchema: z.ZodObject<{
    id: z.ZodNumber;
    title: z.ZodString;
    code: z.ZodString;
    edge: z.ZodBoolean;
    core: z.ZodBoolean;
    location_option_ids: z.ZodDefault<z.ZodArray<z.ZodNumber>>;
    location: z.ZodObject<{
        city: z.ZodString;
        state: z.ZodString;
        country: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export type HivelocityFacility = z.infer<typeof hivelocityFacilitySchema>;
export declare const hivelocityFacilitiesResponseSchema: z.ZodArray<z.ZodObject<{
    id: z.ZodNumber;
    title: z.ZodString;
    code: z.ZodString;
    edge: z.ZodBoolean;
    core: z.ZodBoolean;
    location_option_ids: z.ZodDefault<z.ZodArray<z.ZodNumber>>;
    location: z.ZodObject<{
        city: z.ZodString;
        state: z.ZodString;
        country: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>>;
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
export declare const hivelocityProductStockSchema: z.ZodObject<{
    product_id: z.ZodNumber;
    product_name: z.ZodPipe<z.ZodUnion<readonly [z.ZodString, z.ZodNull]>, z.ZodTransform<string, string | null>>;
    stock: z.ZodEnum<{
        unavailable: "unavailable";
        available: "available";
        limited: "limited";
    }>;
    data_center: z.ZodString;
    location_option_id: z.ZodNumber;
    edge: z.ZodBoolean;
    core: z.ZodBoolean;
    is_disk_upgradable: z.ZodBoolean;
    is_sps: z.ZodBoolean;
    is_vps: z.ZodBoolean;
    is_vds: z.ZodBoolean;
    product_cpu: z.ZodOptional<z.ZodString>;
    product_cpu_cores: z.ZodOptional<z.ZodString>;
    product_memory: z.ZodOptional<z.ZodString>;
    product_drive: z.ZodOptional<z.ZodString>;
    product_bandwidth: z.ZodOptional<z.ZodString>;
    product_gpu: z.ZodOptional<z.ZodString>;
    processor_info: z.ZodOptional<z.ZodUnknown>;
    product_drive_info: z.ZodOptional<z.ZodUnknown>;
    product_defaults: z.ZodOptional<z.ZodUnknown>;
    product_hourly_price: z.ZodOptional<z.ZodNumber>;
    product_monthly_price: z.ZodOptional<z.ZodNumber>;
    product_quarterly_price: z.ZodOptional<z.ZodNumber>;
    product_semi_annually_price: z.ZodOptional<z.ZodNumber>;
    product_annually_price: z.ZodOptional<z.ZodNumber>;
    product_biennial_price: z.ZodOptional<z.ZodNumber>;
    product_triennial_price: z.ZodOptional<z.ZodNumber>;
    product_on_sale: z.ZodOptional<z.ZodBoolean>;
    product_original_price: z.ZodOptional<z.ZodNumber>;
    product_new: z.ZodOptional<z.ZodBoolean>;
    hourly_location_premium: z.ZodOptional<z.ZodNumber>;
    monthly_location_premium: z.ZodOptional<z.ZodNumber>;
    quarterly_location_premium: z.ZodOptional<z.ZodNumber>;
    semi_annually_location_premium: z.ZodOptional<z.ZodNumber>;
    annually_location_premium: z.ZodOptional<z.ZodNumber>;
    biennial_location_premium: z.ZodOptional<z.ZodNumber>;
    triennial_location_premium: z.ZodOptional<z.ZodNumber>;
    product_disabled_billing_periods: z.ZodOptional<z.ZodArray<z.ZodString>>;
    product_display_price: z.ZodOptional<z.ZodNumber>;
}, z.core.$loose>;
export type HivelocityProductStock = z.infer<typeof hivelocityProductStockSchema>;
/**
 * The `/inventory/product` response is an object keyed by grouping bucket
 * (commonly facility code), each mapping to a list of Stock items.
 */
/**
 * NOTE: We intentionally avoid `z.record(...)` here.
 *
 * In this repo we have multiple Zod versions present (v3 + v4 via transitive deps),
 * and `z.record` internals differ. Using a manual normalizer prevents runtime
 * crashes like `def.valueType._zod` and still keeps output strongly typed.
 */
export type HivelocityInventoryResponse = Record<string, HivelocityProductStock[]>;
export declare function normalizeHivelocityInventory(raw: unknown): HivelocityInventoryResponse;
export declare const hivelocityInventoryResponseSchema: z.ZodPipe<z.ZodUnknown, z.ZodTransform<HivelocityInventoryResponse, unknown>>;
/**
 * `/inventory/product/{productId}` is not fully documented in the public portal.
 * In practice we accept either:
 * - the same grouped Inventory object, or
 * - a flat list of Stock items, or
 * - a single Stock item.
 */
export declare const hivelocityProductByIdResponseSchema: z.ZodUnion<readonly [z.ZodPipe<z.ZodUnknown, z.ZodTransform<HivelocityInventoryResponse, unknown>>, z.ZodArray<z.ZodObject<{
    product_id: z.ZodNumber;
    product_name: z.ZodPipe<z.ZodUnion<readonly [z.ZodString, z.ZodNull]>, z.ZodTransform<string, string | null>>;
    stock: z.ZodEnum<{
        unavailable: "unavailable";
        available: "available";
        limited: "limited";
    }>;
    data_center: z.ZodString;
    location_option_id: z.ZodNumber;
    edge: z.ZodBoolean;
    core: z.ZodBoolean;
    is_disk_upgradable: z.ZodBoolean;
    is_sps: z.ZodBoolean;
    is_vps: z.ZodBoolean;
    is_vds: z.ZodBoolean;
    product_cpu: z.ZodOptional<z.ZodString>;
    product_cpu_cores: z.ZodOptional<z.ZodString>;
    product_memory: z.ZodOptional<z.ZodString>;
    product_drive: z.ZodOptional<z.ZodString>;
    product_bandwidth: z.ZodOptional<z.ZodString>;
    product_gpu: z.ZodOptional<z.ZodString>;
    processor_info: z.ZodOptional<z.ZodUnknown>;
    product_drive_info: z.ZodOptional<z.ZodUnknown>;
    product_defaults: z.ZodOptional<z.ZodUnknown>;
    product_hourly_price: z.ZodOptional<z.ZodNumber>;
    product_monthly_price: z.ZodOptional<z.ZodNumber>;
    product_quarterly_price: z.ZodOptional<z.ZodNumber>;
    product_semi_annually_price: z.ZodOptional<z.ZodNumber>;
    product_annually_price: z.ZodOptional<z.ZodNumber>;
    product_biennial_price: z.ZodOptional<z.ZodNumber>;
    product_triennial_price: z.ZodOptional<z.ZodNumber>;
    product_on_sale: z.ZodOptional<z.ZodBoolean>;
    product_original_price: z.ZodOptional<z.ZodNumber>;
    product_new: z.ZodOptional<z.ZodBoolean>;
    hourly_location_premium: z.ZodOptional<z.ZodNumber>;
    monthly_location_premium: z.ZodOptional<z.ZodNumber>;
    quarterly_location_premium: z.ZodOptional<z.ZodNumber>;
    semi_annually_location_premium: z.ZodOptional<z.ZodNumber>;
    annually_location_premium: z.ZodOptional<z.ZodNumber>;
    biennial_location_premium: z.ZodOptional<z.ZodNumber>;
    triennial_location_premium: z.ZodOptional<z.ZodNumber>;
    product_disabled_billing_periods: z.ZodOptional<z.ZodArray<z.ZodString>>;
    product_display_price: z.ZodOptional<z.ZodNumber>;
}, z.core.$loose>>, z.ZodObject<{
    product_id: z.ZodNumber;
    product_name: z.ZodPipe<z.ZodUnion<readonly [z.ZodString, z.ZodNull]>, z.ZodTransform<string, string | null>>;
    stock: z.ZodEnum<{
        unavailable: "unavailable";
        available: "available";
        limited: "limited";
    }>;
    data_center: z.ZodString;
    location_option_id: z.ZodNumber;
    edge: z.ZodBoolean;
    core: z.ZodBoolean;
    is_disk_upgradable: z.ZodBoolean;
    is_sps: z.ZodBoolean;
    is_vps: z.ZodBoolean;
    is_vds: z.ZodBoolean;
    product_cpu: z.ZodOptional<z.ZodString>;
    product_cpu_cores: z.ZodOptional<z.ZodString>;
    product_memory: z.ZodOptional<z.ZodString>;
    product_drive: z.ZodOptional<z.ZodString>;
    product_bandwidth: z.ZodOptional<z.ZodString>;
    product_gpu: z.ZodOptional<z.ZodString>;
    processor_info: z.ZodOptional<z.ZodUnknown>;
    product_drive_info: z.ZodOptional<z.ZodUnknown>;
    product_defaults: z.ZodOptional<z.ZodUnknown>;
    product_hourly_price: z.ZodOptional<z.ZodNumber>;
    product_monthly_price: z.ZodOptional<z.ZodNumber>;
    product_quarterly_price: z.ZodOptional<z.ZodNumber>;
    product_semi_annually_price: z.ZodOptional<z.ZodNumber>;
    product_annually_price: z.ZodOptional<z.ZodNumber>;
    product_biennial_price: z.ZodOptional<z.ZodNumber>;
    product_triennial_price: z.ZodOptional<z.ZodNumber>;
    product_on_sale: z.ZodOptional<z.ZodBoolean>;
    product_original_price: z.ZodOptional<z.ZodNumber>;
    product_new: z.ZodOptional<z.ZodBoolean>;
    hourly_location_premium: z.ZodOptional<z.ZodNumber>;
    monthly_location_premium: z.ZodOptional<z.ZodNumber>;
    quarterly_location_premium: z.ZodOptional<z.ZodNumber>;
    semi_annually_location_premium: z.ZodOptional<z.ZodNumber>;
    annually_location_premium: z.ZodOptional<z.ZodNumber>;
    biennial_location_premium: z.ZodOptional<z.ZodNumber>;
    triennial_location_premium: z.ZodOptional<z.ZodNumber>;
    product_disabled_billing_periods: z.ZodOptional<z.ZodArray<z.ZodString>>;
    product_display_price: z.ZodOptional<z.ZodNumber>;
}, z.core.$loose>]>;
export type HivelocityProductByIdResponse = z.infer<typeof hivelocityProductByIdResponseSchema>;
