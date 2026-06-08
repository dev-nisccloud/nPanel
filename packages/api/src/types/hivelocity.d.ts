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
        available: "available";
        unavailable: "unavailable";
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
        available: "available";
        unavailable: "unavailable";
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
        available: "available";
        unavailable: "unavailable";
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
export declare const hivelocityDeviceDumpSchema: z.ZodObject<{
    name: z.ZodString;
    deviceId: z.ZodOptional<z.ZodNumber>;
    hostname: z.ZodOptional<z.ZodPipe<z.ZodUnion<readonly [z.ZodString, z.ZodNull]>, z.ZodTransform<string, string | null>>>;
    primaryIp: z.ZodOptional<z.ZodPipe<z.ZodUnion<readonly [z.ZodString, z.ZodNull]>, z.ZodTransform<string, string | null>>>;
    status: z.ZodOptional<z.ZodString>;
    deviceType: z.ZodOptional<z.ZodString>;
    deviceTypeGroup: z.ZodOptional<z.ZodString>;
    powerStatus: z.ZodOptional<z.ZodUnknown>;
    location: z.ZodOptional<z.ZodUnion<[z.ZodObject<{
        facility: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        facility_title: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        rack: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        rack_id: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
        row_name: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        position: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    }, z.core.$strip>, z.ZodUnknown]>>;
    billingInfo: z.ZodOptional<z.ZodObject<{
        period: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        price: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    }, z.core.$strip>>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString>>;
    displayedTags: z.ZodOptional<z.ZodArray<z.ZodObject<{
        key: z.ZodString;
        value: z.ZodAny;
    }, z.core.$strip>>>;
    isManaged: z.ZodOptional<z.ZodNullable<z.ZodBoolean>>;
    ipmiEnabled: z.ZodOptional<z.ZodNullable<z.ZodBoolean>>;
    hasCancellation: z.ZodOptional<z.ZodNullable<z.ZodBoolean>>;
    isReload: z.ZodOptional<z.ZodNullable<z.ZodBoolean>>;
    spsStatus: z.ZodOptional<z.ZodString>;
    monitorsUp: z.ZodOptional<z.ZodNumber>;
    monitorsTotal: z.ZodOptional<z.ZodNumber>;
    servicePlan: z.ZodOptional<z.ZodNumber>;
    productId: z.ZodOptional<z.ZodNumber>;
    lastInvoiceId: z.ZodOptional<z.ZodNumber>;
    createdDate: z.ZodOptional<z.ZodString>;
}, z.core.$loose>;
export type HivelocityDeviceDump = z.infer<typeof hivelocityDeviceDumpSchema>;
export declare const hivelocityDevicesResponseSchema: z.ZodArray<z.ZodObject<{
    name: z.ZodString;
    deviceId: z.ZodOptional<z.ZodNumber>;
    hostname: z.ZodOptional<z.ZodPipe<z.ZodUnion<readonly [z.ZodString, z.ZodNull]>, z.ZodTransform<string, string | null>>>;
    primaryIp: z.ZodOptional<z.ZodPipe<z.ZodUnion<readonly [z.ZodString, z.ZodNull]>, z.ZodTransform<string, string | null>>>;
    status: z.ZodOptional<z.ZodString>;
    deviceType: z.ZodOptional<z.ZodString>;
    deviceTypeGroup: z.ZodOptional<z.ZodString>;
    powerStatus: z.ZodOptional<z.ZodUnknown>;
    location: z.ZodOptional<z.ZodUnion<[z.ZodObject<{
        facility: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        facility_title: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        rack: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        rack_id: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
        row_name: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        position: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    }, z.core.$strip>, z.ZodUnknown]>>;
    billingInfo: z.ZodOptional<z.ZodObject<{
        period: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        price: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    }, z.core.$strip>>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString>>;
    displayedTags: z.ZodOptional<z.ZodArray<z.ZodObject<{
        key: z.ZodString;
        value: z.ZodAny;
    }, z.core.$strip>>>;
    isManaged: z.ZodOptional<z.ZodNullable<z.ZodBoolean>>;
    ipmiEnabled: z.ZodOptional<z.ZodNullable<z.ZodBoolean>>;
    hasCancellation: z.ZodOptional<z.ZodNullable<z.ZodBoolean>>;
    isReload: z.ZodOptional<z.ZodNullable<z.ZodBoolean>>;
    spsStatus: z.ZodOptional<z.ZodString>;
    monitorsUp: z.ZodOptional<z.ZodNumber>;
    monitorsTotal: z.ZodOptional<z.ZodNumber>;
    servicePlan: z.ZodOptional<z.ZodNumber>;
    productId: z.ZodOptional<z.ZodNumber>;
    lastInvoiceId: z.ZodOptional<z.ZodNumber>;
    createdDate: z.ZodOptional<z.ZodString>;
}, z.core.$loose>>;
/**
 * Hivelocity VPS Instance (GET /vps/ → VPS)
 *
 * Dedicated VPS instances in the account. These come from a completely separate
 * endpoint and schema from bare-metal devices.
 *
 * Fields from the `VPS` definition in the official OpenAPI spec.
 */
export declare const hivelocityVpsSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodPipe<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>, z.ZodTransform<string, string | number>>>;
    hostname: z.ZodOptional<z.ZodPipe<z.ZodUnion<readonly [z.ZodString, z.ZodNull]>, z.ZodTransform<string, string | null>>>;
    status: z.ZodOptional<z.ZodPipe<z.ZodUnion<readonly [z.ZodString, z.ZodNull]>, z.ZodTransform<string, string | null>>>;
    primaryIp: z.ZodOptional<z.ZodPipe<z.ZodUnion<readonly [z.ZodString, z.ZodNull]>, z.ZodTransform<string, string | null>>>;
    cpus: z.ZodOptional<z.ZodNumber>;
    memory: z.ZodOptional<z.ZodNumber>;
    disk: z.ZodOptional<z.ZodNumber>;
    osName: z.ZodOptional<z.ZodPipe<z.ZodUnion<readonly [z.ZodString, z.ZodNull]>, z.ZodTransform<string, string | null>>>;
    facilityCode: z.ZodOptional<z.ZodPipe<z.ZodUnion<readonly [z.ZodString, z.ZodNull]>, z.ZodTransform<string, string | null>>>;
    networkId: z.ZodOptional<z.ZodNullable<z.ZodPipe<z.ZodUnion<readonly [z.ZodString, z.ZodNull]>, z.ZodTransform<string | null, string | null>>>>;
    hostId: z.ZodOptional<z.ZodNullable<z.ZodPipe<z.ZodUnion<readonly [z.ZodString, z.ZodNull]>, z.ZodTransform<string | null, string | null>>>>;
    storageId: z.ZodOptional<z.ZodNullable<z.ZodPipe<z.ZodUnion<readonly [z.ZodString, z.ZodNull]>, z.ZodTransform<string | null, string | null>>>>;
    createdAt: z.ZodOptional<z.ZodNullable<z.ZodPipe<z.ZodUnion<readonly [z.ZodString, z.ZodNull]>, z.ZodTransform<string | null, string | null>>>>;
}, z.core.$loose>;
export type HivelocityVps = z.infer<typeof hivelocityVpsSchema>;
export declare const hivelocityVpsListResponseSchema: z.ZodArray<z.ZodObject<{
    id: z.ZodOptional<z.ZodPipe<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>, z.ZodTransform<string, string | number>>>;
    hostname: z.ZodOptional<z.ZodPipe<z.ZodUnion<readonly [z.ZodString, z.ZodNull]>, z.ZodTransform<string, string | null>>>;
    status: z.ZodOptional<z.ZodPipe<z.ZodUnion<readonly [z.ZodString, z.ZodNull]>, z.ZodTransform<string, string | null>>>;
    primaryIp: z.ZodOptional<z.ZodPipe<z.ZodUnion<readonly [z.ZodString, z.ZodNull]>, z.ZodTransform<string, string | null>>>;
    cpus: z.ZodOptional<z.ZodNumber>;
    memory: z.ZodOptional<z.ZodNumber>;
    disk: z.ZodOptional<z.ZodNumber>;
    osName: z.ZodOptional<z.ZodPipe<z.ZodUnion<readonly [z.ZodString, z.ZodNull]>, z.ZodTransform<string, string | null>>>;
    facilityCode: z.ZodOptional<z.ZodPipe<z.ZodUnion<readonly [z.ZodString, z.ZodNull]>, z.ZodTransform<string, string | null>>>;
    networkId: z.ZodOptional<z.ZodNullable<z.ZodPipe<z.ZodUnion<readonly [z.ZodString, z.ZodNull]>, z.ZodTransform<string | null, string | null>>>>;
    hostId: z.ZodOptional<z.ZodNullable<z.ZodPipe<z.ZodUnion<readonly [z.ZodString, z.ZodNull]>, z.ZodTransform<string | null, string | null>>>>;
    storageId: z.ZodOptional<z.ZodNullable<z.ZodPipe<z.ZodUnion<readonly [z.ZodString, z.ZodNull]>, z.ZodTransform<string | null, string | null>>>>;
    createdAt: z.ZodOptional<z.ZodNullable<z.ZodPipe<z.ZodUnion<readonly [z.ZodString, z.ZodNull]>, z.ZodTransform<string | null, string | null>>>>;
}, z.core.$loose>>;
export declare const hivelocityVpsSnapshotScheduleSchema: z.ZodObject<{
    snapshotScheduleId: z.ZodOptional<z.ZodString>;
    volumeId: z.ZodString;
    intervalType: z.ZodEnum<{
        MONTHLY: "MONTHLY";
        DAILY: "DAILY";
        WEEKLY: "WEEKLY";
        HOURLY: "HOURLY";
    }>;
    timezone: z.ZodString;
    hour: z.ZodOptional<z.ZodNumber>;
    minute: z.ZodOptional<z.ZodNumber>;
    day: z.ZodOptional<z.ZodNumber>;
    weekday: z.ZodOptional<z.ZodNumber>;
    maxSnapshots: z.ZodNumber;
}, z.core.$loose>;
export type HivelocityVpsSnapshotSchedule = z.infer<typeof hivelocityVpsSnapshotScheduleSchema>;
export declare const hivelocityVpsSnapshotScheduleCreateSchema: z.ZodObject<{
    timezone: z.ZodString;
    day: z.ZodOptional<z.ZodNumber>;
    volumeId: z.ZodString;
    intervalType: z.ZodEnum<{
        MONTHLY: "MONTHLY";
        DAILY: "DAILY";
        WEEKLY: "WEEKLY";
        HOURLY: "HOURLY";
    }>;
    hour: z.ZodOptional<z.ZodNumber>;
    minute: z.ZodOptional<z.ZodNumber>;
    weekday: z.ZodOptional<z.ZodNumber>;
    maxSnapshots: z.ZodNumber;
    facilityCode: z.ZodString;
    clientId: z.ZodOptional<z.ZodNumber>;
}, z.core.$loose>;
export declare const hivelocityVpsVolumeSchema: z.ZodObject<{
    volumeId: z.ZodString;
    deviceId: z.ZodNumber;
    facilityCode: z.ZodString;
    size: z.ZodNumber;
    type: z.ZodEnum<{
        ROOT: "ROOT";
        DATADISK: "DATADISK";
    }>;
    createdAt: z.ZodOptional<z.ZodString>;
}, z.core.$loose>;
export type HivelocityVpsVolume = z.infer<typeof hivelocityVpsVolumeSchema>;
export declare const hivelocityVpsVolumeCreateSchema: z.ZodObject<{
    deviceId: z.ZodNumber;
    size: z.ZodNumber;
}, z.core.$strip>;
export declare const hivelocityVpsVolumeUpdateSchema: z.ZodObject<{
    deviceId: z.ZodOptional<z.ZodNumber>;
    size: z.ZodNumber;
}, z.core.$strip>;
export declare const hivelocityVpsVolumeDeleteSchema: z.ZodObject<{
    deviceId: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export declare const hivelocityVpsSnapshotRestoreSchema: z.ZodObject<{
    facilityCode: z.ZodString;
    clientId: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export declare const hivelocityNetworkTaskSchema: z.ZodObject<{
    taskId: z.ZodString;
    clientId: z.ZodOptional<z.ZodNumber>;
    deviceId: z.ZodOptional<z.ZodNumber>;
    result: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    metaData: z.ZodOptional<z.ZodString>;
    taskCreated: z.ZodOptional<z.ZodUnknown>;
    taskUpdated: z.ZodOptional<z.ZodUnknown>;
}, z.core.$loose>;
export type HivelocityNetworkTask = z.infer<typeof hivelocityNetworkTaskSchema>;
export type HivelocityResourceType = "dedicated" | "vds" | "vps";
/** Bare-metal device enriched with a computed resource-type discriminant. */
export type HivelocityDeviceResource = HivelocityDeviceDump & {
    resourceType: "dedicated" | "vds";
};
/** VPS instance enriched with a resource-type discriminant. */
export type HivelocityVpsResource = HivelocityVps & {
    resourceType: "vps";
};
export type HivelocityAnyResource = HivelocityDeviceResource | HivelocityVpsResource;
