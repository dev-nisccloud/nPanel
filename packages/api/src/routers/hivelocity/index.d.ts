import { type HivelocityRequestTiming } from "../../lib/hivelocity-client";
import { type HivelocityAnyResource, type HivelocityInventoryResponse } from "../../types/hivelocity";
export type HivelocityResourcesFetchTiming = {
    hivelocity: {
        device: HivelocityRequestTiming;
        /** Not used for list views; kept for dev timing UI compatibility. */
        vps?: HivelocityRequestTiming;
        parallelMs: number;
        source: "device";
    };
    mergeMs: number;
    counts: {
        deviceRows: number;
        vpsRows: number;
        merged: number;
    };
};
export declare const hivelocityRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * Private: quick integration check.
     */
    healthCheck: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: {
            hasApiKey: boolean;
            hasBillingInfoId: boolean;
            baseUrl: string;
            status: string;
            configured?: undefined;
        } | {
            status: string;
            configured: boolean;
        };
        meta: object;
    }>;
    /**
     * Private: Get all facilities (inventory locations).
     * Docs: GET /inventory/locations (this endpoint is public per Hivelocity docs).
     */
    getFacilities: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            vpsLocations?: string | undefined;
        } | undefined;
        output: {
            success: boolean;
            data: {
                id: number;
                title: string;
                code: string;
                edge: boolean;
                core: boolean;
                location_option_ids: number[];
                location: {
                    city: string;
                    state: string;
                    country: string;
                };
            }[];
        };
        meta: object;
    }>;
    /**
     * Public: Get all facilities (inventory locations) without auth.
     * Used by the public website to resolve data_center codes to city names.
     */
    publicGetFacilities: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            vpsLocations?: string | undefined;
        } | undefined;
        output: {
            success: boolean;
            data: {
                id: number;
                title: string;
                code: string;
                edge: boolean;
                core: boolean;
                location_option_ids: number[];
                location: {
                    city: string;
                    state: string;
                    country: string;
                };
            }[];
        };
        meta: object;
    }>;
    /**
     * Public (TEMP for development): Get product operating systems.
     * Docs: GET /product/{productId}/operating-systems
     *
     * NOTE: This is intentionally `hivelocityProcedure` so you can test and inspect the live response shape
     * while we finalize types. Switch to `hivelocityProcedure` before shipping.
     */
    getProductOperatingSystems: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            productId: number;
        };
        output: {
            success: boolean;
            data: unknown;
        };
        meta: object;
    }>;
    /**
     * Public (TEMP for development): Get product options/add-ons.
     * Docs: GET /product/{productId}/options?groupBy=upgrade
     *
     * NOTE: This is intentionally `hivelocityProcedure` so you can test and inspect the live response shape
     * while we finalize types. Switch to `hivelocityProcedure` before shipping.
     */
    getProductOptions: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            productId: number;
            groupBy?: string | undefined;
        };
        output: {
            success: boolean;
            data: unknown;
        };
        meta: object;
    }>;
    /** Public storefront: operating systems for a Hivelocity product (no auth). */
    publicGetProductOperatingSystems: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            productId: number;
        };
        output: {
            success: boolean;
            data: unknown;
        };
        meta: object;
    }>;
    /** Public storefront: add-on options for a Hivelocity product (no auth). */
    publicGetProductOptions: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            productId: number;
            groupBy?: string | undefined;
        };
        output: {
            success: boolean;
            data: unknown;
        };
        meta: object;
    }>;
    /**
     * Public (TEMP for development): Provision an instant compute device (recommended endpoint).
     * Docs: POST /compute/
     *
     * NOTE: This creates billable resources in Hivelocity. Use only in test accounts.
     */
    provisionComputeDevice: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            productId: number;
            locationName: string;
            osName: string;
            hostname: string;
            period?: "hourly" | "monthly" | "quarterly" | "semi-annually" | "annually" | "biennial" | "triennial" | undefined;
            publicSshKeyId?: number | undefined;
            vlanId?: number | undefined;
            script?: string | undefined;
            customIPXEScriptURL?: string | undefined;
            customIPXEScriptContents?: string | undefined;
            forceDeviceId?: number | undefined;
            ignitionId?: number | undefined;
            bondingSupport?: boolean | undefined;
            tags?: string[] | undefined;
            optionIds?: number[] | undefined;
        };
        output: {
            success: boolean;
            data: unknown;
        };
        meta: object;
    }>;
    /**
     * Public (TEMP for development): Provision an instant bare metal device (legacy endpoint).
     * Docs: POST /bare-metal-devices/
     */
    provisionBareMetalDevice: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            productId: number;
            locationName: string;
            osName: string;
            hostname: string;
            period?: "hourly" | "monthly" | "quarterly" | "semi-annually" | "annually" | "biennial" | "triennial" | undefined;
            publicSshKeyId?: number | undefined;
            vlanId?: number | undefined;
            script?: string | undefined;
            customIPXEScriptURL?: string | undefined;
            customIPXEScriptContents?: string | undefined;
            forceDeviceId?: number | undefined;
            ignitionId?: number | undefined;
            bondingSupport?: boolean | undefined;
            tags?: string[] | undefined;
            optionIds?: number[] | undefined;
        };
        output: {
            success: boolean;
            data: unknown;
        };
        meta: object;
    }>;
    /**
     * Public (TEMP for development): Get order by id (used to poll provisioning status).
     * Docs: GET /order/{orderId}
     */
    getOrderById: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            orderId: number;
        };
        output: {
            success: boolean;
            data: unknown;
        };
        meta: object;
    }>;
    /**
     * Public (TEMP for development): Get compute device by id.
     * Docs: GET /compute/{deviceId}
     */
    getComputeDeviceById: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            deviceId: number;
        } & {
            teamSlug?: string | undefined;
            teamResourceCategory?: "vps" | "vds" | "dedicated" | undefined;
        };
        output: {
            success: boolean;
            data: unknown;
        };
        meta: object;
    }>;
    /**
     * Public (TEMP for development): Get all compute devices.
     * Docs: GET /compute/
     */
    getComputeDevices: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: {
            success: boolean;
            data: unknown;
        };
        meta: object;
    }>;
    /**
     * Public (TEMP for development): Get all devices (Device API).
     * Docs: GET /device/
     *
     * Notes:
     * - Hivelocity documentation shows `rack_id` as a filter.
     * - In practice, Hivelocity also supports filtering by `orderId` (used in their quickstart docs),
     *   so we expose it here for testing even if not present in the OpenAPI schema.
     */
    getDevices: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            rack_id?: number | undefined;
            orderId?: number | undefined;
        } | undefined;
        output: {
            success: boolean;
            data: unknown;
        };
        meta: object;
    }>;
    /**
     * Public (TEMP for development): Get device IP assignments.
     * Docs: GET /device/{deviceId}/ips
     */
    getDeviceIps: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            deviceId: number;
        } & {
            teamSlug?: string | undefined;
            teamResourceCategory?: "vps" | "vds" | "dedicated" | undefined;
        };
        output: {
            success: boolean;
            data: unknown;
        };
        meta: object;
    }>;
    /**
     * Public (TEMP for development): Get all device services.
     * Docs: GET /device/{deviceId}/services
     */
    getDeviceServices: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            deviceId: number;
            group_by?: string | undefined;
            type_code?: string | undefined;
        } & {
            teamSlug?: string | undefined;
            teamResourceCategory?: "vps" | "vds" | "dedicated" | undefined;
        };
        output: {
            success: boolean;
            data: unknown;
        };
        meta: object;
    }>;
    /**
     * Public (TEMP for development): Get available upgrade options for a VPS product.
     * Docs: GET /vps/{deviceId}/available-product-upgrades
     */
    getVpsUpgrades: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            deviceId: number;
        } & {
            teamSlug?: string | undefined;
            teamResourceCategory?: "vps" | "vds" | "dedicated" | undefined;
        };
        output: {
            success: boolean;
            data: unknown;
        };
        meta: object;
    }>;
    /**
     * Private: Get all products.
     * Docs: GET /inventory/product
     */
    getProducts: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            location?: "MAIN" | "CUSTOM_DISPLAY" | "MASSIVESTORAGE" | "GPU" | "OUTLET" | "LANDING" | undefined;
            include_custom?: boolean | undefined;
            bonding_support?: string | null | undefined;
            group_by?: string | undefined;
        } | undefined;
        output: {
            success: boolean;
            data: HivelocityInventoryResponse;
        };
        meta: object;
    }>;
    /**
     * Private: Dedicated server plans (paginated).
     *
     * Why this exists:
     * - `/inventory/product` can be very large and will overwhelm the browser if rendered at once.
     * - Hivelocity does not document native pagination for this endpoint, so we fetch once,
     *   normalize + filter server-side, then return a slice.
     */
    getDedicatedServerPlans: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            location?: "MAIN" | "CUSTOM_DISPLAY" | "MASSIVESTORAGE" | "GPU" | "OUTLET" | "LANDING" | undefined;
            include_custom?: boolean | undefined;
            bonding_support?: string | null | undefined;
            facility_code?: string | undefined;
            search?: string | undefined;
            limit?: number | undefined;
            cursor?: number | undefined;
        } | undefined;
        output: {
            success: boolean;
            data: {
                items: {
                    [x: string]: unknown;
                    product_id: number;
                    product_name: string;
                    stock: "available" | "limited" | "unavailable";
                    data_center: string;
                    location_option_id: number;
                    edge: boolean;
                    core: boolean;
                    is_disk_upgradable: boolean;
                    is_sps: boolean;
                    is_vps: boolean;
                    is_vds: boolean;
                    product_cpu?: string | undefined;
                    product_cpu_cores?: string | undefined;
                    product_memory?: string | undefined;
                    product_drive?: string | undefined;
                    product_bandwidth?: string | undefined;
                    product_gpu?: string | undefined;
                    processor_info?: unknown;
                    product_drive_info?: unknown;
                    product_defaults?: unknown;
                    product_hourly_price?: number | undefined;
                    product_monthly_price?: number | undefined;
                    product_quarterly_price?: number | undefined;
                    product_semi_annually_price?: number | undefined;
                    product_annually_price?: number | undefined;
                    product_biennial_price?: number | undefined;
                    product_triennial_price?: number | undefined;
                    product_on_sale?: boolean | undefined;
                    product_original_price?: number | undefined;
                    product_new?: boolean | undefined;
                    hourly_location_premium?: number | undefined;
                    monthly_location_premium?: number | undefined;
                    quarterly_location_premium?: number | undefined;
                    semi_annually_location_premium?: number | undefined;
                    annually_location_premium?: number | undefined;
                    biennial_location_premium?: number | undefined;
                    triennial_location_premium?: number | undefined;
                    product_disabled_billing_periods?: string[] | undefined;
                    product_display_price?: number | undefined;
                }[];
                total: number;
                nextCursor: number | null;
            };
        };
        meta: object;
    }>;
    /**
     * Private: VPS plans (paginated).
     */
    getVpsPlans: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            location?: "MAIN" | "CUSTOM_DISPLAY" | "MASSIVESTORAGE" | "GPU" | "OUTLET" | "LANDING" | undefined;
            include_custom?: boolean | undefined;
            bonding_support?: string | null | undefined;
            facility_code?: string | undefined;
            search?: string | undefined;
            limit?: number | undefined;
            cursor?: number | undefined;
        } | undefined;
        output: {
            success: boolean;
            data: {
                items: {
                    [x: string]: unknown;
                    product_id: number;
                    product_name: string;
                    stock: "available" | "limited" | "unavailable";
                    data_center: string;
                    location_option_id: number;
                    edge: boolean;
                    core: boolean;
                    is_disk_upgradable: boolean;
                    is_sps: boolean;
                    is_vps: boolean;
                    is_vds: boolean;
                    product_cpu?: string | undefined;
                    product_cpu_cores?: string | undefined;
                    product_memory?: string | undefined;
                    product_drive?: string | undefined;
                    product_bandwidth?: string | undefined;
                    product_gpu?: string | undefined;
                    processor_info?: unknown;
                    product_drive_info?: unknown;
                    product_defaults?: unknown;
                    product_hourly_price?: number | undefined;
                    product_monthly_price?: number | undefined;
                    product_quarterly_price?: number | undefined;
                    product_semi_annually_price?: number | undefined;
                    product_annually_price?: number | undefined;
                    product_biennial_price?: number | undefined;
                    product_triennial_price?: number | undefined;
                    product_on_sale?: boolean | undefined;
                    product_original_price?: number | undefined;
                    product_new?: boolean | undefined;
                    hourly_location_premium?: number | undefined;
                    monthly_location_premium?: number | undefined;
                    quarterly_location_premium?: number | undefined;
                    semi_annually_location_premium?: number | undefined;
                    annually_location_premium?: number | undefined;
                    biennial_location_premium?: number | undefined;
                    triennial_location_premium?: number | undefined;
                    product_disabled_billing_periods?: string[] | undefined;
                    product_display_price?: number | undefined;
                }[];
                total: number;
                nextCursor: number | null;
            };
        };
        meta: object;
    }>;
    /**
     * Public: VPS plans (paginated)  no auth required.
     * Used by the landing page to display live plans without login.
     */
    publicGetVpsPlans: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            location?: "MAIN" | "CUSTOM_DISPLAY" | "MASSIVESTORAGE" | "GPU" | "OUTLET" | "LANDING" | undefined;
            include_custom?: boolean | undefined;
            bonding_support?: string | null | undefined;
            facility_code?: string | undefined;
            search?: string | undefined;
            limit?: number | undefined;
            cursor?: number | undefined;
        } | undefined;
        output: {
            success: boolean;
            data: {
                items: {
                    [x: string]: unknown;
                    product_id: number;
                    product_name: string;
                    stock: "available" | "limited" | "unavailable";
                    data_center: string;
                    location_option_id: number;
                    edge: boolean;
                    core: boolean;
                    is_disk_upgradable: boolean;
                    is_sps: boolean;
                    is_vps: boolean;
                    is_vds: boolean;
                    product_cpu?: string | undefined;
                    product_cpu_cores?: string | undefined;
                    product_memory?: string | undefined;
                    product_drive?: string | undefined;
                    product_bandwidth?: string | undefined;
                    product_gpu?: string | undefined;
                    processor_info?: unknown;
                    product_drive_info?: unknown;
                    product_defaults?: unknown;
                    product_hourly_price?: number | undefined;
                    product_monthly_price?: number | undefined;
                    product_quarterly_price?: number | undefined;
                    product_semi_annually_price?: number | undefined;
                    product_annually_price?: number | undefined;
                    product_biennial_price?: number | undefined;
                    product_triennial_price?: number | undefined;
                    product_on_sale?: boolean | undefined;
                    product_original_price?: number | undefined;
                    product_new?: boolean | undefined;
                    hourly_location_premium?: number | undefined;
                    monthly_location_premium?: number | undefined;
                    quarterly_location_premium?: number | undefined;
                    semi_annually_location_premium?: number | undefined;
                    annually_location_premium?: number | undefined;
                    biennial_location_premium?: number | undefined;
                    triennial_location_premium?: number | undefined;
                    product_disabled_billing_periods?: string[] | undefined;
                    product_display_price?: number | undefined;
                }[];
                total: number;
                nextCursor: number | null;
            };
        };
        meta: object;
    }>;
    /**
     * Public: Dedicated server plans (paginated)  no auth required.
     * Used by the landing page to display live plans without login.
     */
    publicGetDedicatedServerPlans: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            location?: "MAIN" | "CUSTOM_DISPLAY" | "MASSIVESTORAGE" | "GPU" | "OUTLET" | "LANDING" | undefined;
            include_custom?: boolean | undefined;
            bonding_support?: string | null | undefined;
            facility_code?: string | undefined;
            search?: string | undefined;
            limit?: number | undefined;
            cursor?: number | undefined;
        } | undefined;
        output: {
            success: boolean;
            data: {
                items: {
                    [x: string]: unknown;
                    product_id: number;
                    product_name: string;
                    stock: "available" | "limited" | "unavailable";
                    data_center: string;
                    location_option_id: number;
                    edge: boolean;
                    core: boolean;
                    is_disk_upgradable: boolean;
                    is_sps: boolean;
                    is_vps: boolean;
                    is_vds: boolean;
                    product_cpu?: string | undefined;
                    product_cpu_cores?: string | undefined;
                    product_memory?: string | undefined;
                    product_drive?: string | undefined;
                    product_bandwidth?: string | undefined;
                    product_gpu?: string | undefined;
                    processor_info?: unknown;
                    product_drive_info?: unknown;
                    product_defaults?: unknown;
                    product_hourly_price?: number | undefined;
                    product_monthly_price?: number | undefined;
                    product_quarterly_price?: number | undefined;
                    product_semi_annually_price?: number | undefined;
                    product_annually_price?: number | undefined;
                    product_biennial_price?: number | undefined;
                    product_triennial_price?: number | undefined;
                    product_on_sale?: boolean | undefined;
                    product_original_price?: number | undefined;
                    product_new?: boolean | undefined;
                    hourly_location_premium?: number | undefined;
                    monthly_location_premium?: number | undefined;
                    quarterly_location_premium?: number | undefined;
                    semi_annually_location_premium?: number | undefined;
                    annually_location_premium?: number | undefined;
                    biennial_location_premium?: number | undefined;
                    triennial_location_premium?: number | undefined;
                    product_disabled_billing_periods?: string[] | undefined;
                    product_display_price?: number | undefined;
                }[];
                total: number;
                nextCursor: number | null;
            };
        };
        meta: object;
    }>;
    /**
     * Public: VDS plans (paginated)  no auth required.
     * Used by the landing page to display live plans without login.
     */
    publicGetVdsPlans: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            location?: "MAIN" | "CUSTOM_DISPLAY" | "MASSIVESTORAGE" | "GPU" | "OUTLET" | "LANDING" | undefined;
            include_custom?: boolean | undefined;
            bonding_support?: string | null | undefined;
            facility_code?: string | undefined;
            search?: string | undefined;
            limit?: number | undefined;
            cursor?: number | undefined;
        } | undefined;
        output: {
            success: boolean;
            data: {
                items: {
                    [x: string]: unknown;
                    product_id: number;
                    product_name: string;
                    stock: "available" | "limited" | "unavailable";
                    data_center: string;
                    location_option_id: number;
                    edge: boolean;
                    core: boolean;
                    is_disk_upgradable: boolean;
                    is_sps: boolean;
                    is_vps: boolean;
                    is_vds: boolean;
                    product_cpu?: string | undefined;
                    product_cpu_cores?: string | undefined;
                    product_memory?: string | undefined;
                    product_drive?: string | undefined;
                    product_bandwidth?: string | undefined;
                    product_gpu?: string | undefined;
                    processor_info?: unknown;
                    product_drive_info?: unknown;
                    product_defaults?: unknown;
                    product_hourly_price?: number | undefined;
                    product_monthly_price?: number | undefined;
                    product_quarterly_price?: number | undefined;
                    product_semi_annually_price?: number | undefined;
                    product_annually_price?: number | undefined;
                    product_biennial_price?: number | undefined;
                    product_triennial_price?: number | undefined;
                    product_on_sale?: boolean | undefined;
                    product_original_price?: number | undefined;
                    product_new?: boolean | undefined;
                    hourly_location_premium?: number | undefined;
                    monthly_location_premium?: number | undefined;
                    quarterly_location_premium?: number | undefined;
                    semi_annually_location_premium?: number | undefined;
                    annually_location_premium?: number | undefined;
                    biennial_location_premium?: number | undefined;
                    triennial_location_premium?: number | undefined;
                    product_disabled_billing_periods?: string[] | undefined;
                    product_display_price?: number | undefined;
                }[];
                total: number;
                nextCursor: number | null;
            };
        };
        meta: object;
    }>;
    /**
     * Private: VDS plans (paginated).
     */
    getVdsPlans: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            location?: "MAIN" | "CUSTOM_DISPLAY" | "MASSIVESTORAGE" | "GPU" | "OUTLET" | "LANDING" | undefined;
            include_custom?: boolean | undefined;
            bonding_support?: string | null | undefined;
            facility_code?: string | undefined;
            search?: string | undefined;
            limit?: number | undefined;
            cursor?: number | undefined;
        } | undefined;
        output: {
            success: boolean;
            data: {
                items: {
                    [x: string]: unknown;
                    product_id: number;
                    product_name: string;
                    stock: "available" | "limited" | "unavailable";
                    data_center: string;
                    location_option_id: number;
                    edge: boolean;
                    core: boolean;
                    is_disk_upgradable: boolean;
                    is_sps: boolean;
                    is_vps: boolean;
                    is_vds: boolean;
                    product_cpu?: string | undefined;
                    product_cpu_cores?: string | undefined;
                    product_memory?: string | undefined;
                    product_drive?: string | undefined;
                    product_bandwidth?: string | undefined;
                    product_gpu?: string | undefined;
                    processor_info?: unknown;
                    product_drive_info?: unknown;
                    product_defaults?: unknown;
                    product_hourly_price?: number | undefined;
                    product_monthly_price?: number | undefined;
                    product_quarterly_price?: number | undefined;
                    product_semi_annually_price?: number | undefined;
                    product_annually_price?: number | undefined;
                    product_biennial_price?: number | undefined;
                    product_triennial_price?: number | undefined;
                    product_on_sale?: boolean | undefined;
                    product_original_price?: number | undefined;
                    product_new?: boolean | undefined;
                    hourly_location_premium?: number | undefined;
                    monthly_location_premium?: number | undefined;
                    quarterly_location_premium?: number | undefined;
                    semi_annually_location_premium?: number | undefined;
                    annually_location_premium?: number | undefined;
                    biennial_location_premium?: number | undefined;
                    triennial_location_premium?: number | undefined;
                    product_disabled_billing_periods?: string[] | undefined;
                    product_display_price?: number | undefined;
                }[];
                total: number;
                nextCursor: number | null;
            };
        };
        meta: object;
    }>;
    /**
     * Private: Get product by productId.
     * Docs: GET /inventory/product/{productId}
     */
    getProduct: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            productId: number;
        };
        output: {
            success: boolean;
            data: HivelocityInventoryResponse | {
                [x: string]: unknown;
                product_id: number;
                product_name: string;
                stock: "available" | "limited" | "unavailable";
                data_center: string;
                location_option_id: number;
                edge: boolean;
                core: boolean;
                is_disk_upgradable: boolean;
                is_sps: boolean;
                is_vps: boolean;
                is_vds: boolean;
                product_cpu?: string | undefined;
                product_cpu_cores?: string | undefined;
                product_memory?: string | undefined;
                product_drive?: string | undefined;
                product_bandwidth?: string | undefined;
                product_gpu?: string | undefined;
                processor_info?: unknown;
                product_drive_info?: unknown;
                product_defaults?: unknown;
                product_hourly_price?: number | undefined;
                product_monthly_price?: number | undefined;
                product_quarterly_price?: number | undefined;
                product_semi_annually_price?: number | undefined;
                product_annually_price?: number | undefined;
                product_biennial_price?: number | undefined;
                product_triennial_price?: number | undefined;
                product_on_sale?: boolean | undefined;
                product_original_price?: number | undefined;
                product_new?: boolean | undefined;
                hourly_location_premium?: number | undefined;
                monthly_location_premium?: number | undefined;
                quarterly_location_premium?: number | undefined;
                semi_annually_location_premium?: number | undefined;
                annually_location_premium?: number | undefined;
                biennial_location_premium?: number | undefined;
                triennial_location_premium?: number | undefined;
                product_disabled_billing_periods?: string[] | undefined;
                product_display_price?: number | undefined;
            } | {
                [x: string]: unknown;
                product_id: number;
                product_name: string;
                stock: "available" | "limited" | "unavailable";
                data_center: string;
                location_option_id: number;
                edge: boolean;
                core: boolean;
                is_disk_upgradable: boolean;
                is_sps: boolean;
                is_vps: boolean;
                is_vds: boolean;
                product_cpu?: string | undefined;
                product_cpu_cores?: string | undefined;
                product_memory?: string | undefined;
                product_drive?: string | undefined;
                product_bandwidth?: string | undefined;
                product_gpu?: string | undefined;
                processor_info?: unknown;
                product_drive_info?: unknown;
                product_defaults?: unknown;
                product_hourly_price?: number | undefined;
                product_monthly_price?: number | undefined;
                product_quarterly_price?: number | undefined;
                product_semi_annually_price?: number | undefined;
                product_annually_price?: number | undefined;
                product_biennial_price?: number | undefined;
                product_triennial_price?: number | undefined;
                product_on_sale?: boolean | undefined;
                product_original_price?: number | undefined;
                product_new?: boolean | undefined;
                hourly_location_premium?: number | undefined;
                monthly_location_premium?: number | undefined;
                quarterly_location_premium?: number | undefined;
                semi_annually_location_premium?: number | undefined;
                annually_location_premium?: number | undefined;
                biennial_location_premium?: number | undefined;
                triennial_location_premium?: number | undefined;
                product_disabled_billing_periods?: string[] | undefined;
                product_display_price?: number | undefined;
            }[];
        };
        meta: object;
    }>;
    /**
     * Get all bare-metal / VDS devices in the account (paginated + filtered).
     *
     * Docs: GET /device/
     * Schema: Device-dump
     *
     * Supports:
     * - Free-text search (hostname, IP, customName, productName, tags)
     * - Facility filter (facilityCode)
     * - Power-status filter ("on" | "off" | "all")
     * - Cursor-based pagination
     */
    getMyDevices: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            search?: string | undefined;
            facilityCode?: string | undefined;
            powerStatus?: "on" | "off" | "all" | undefined;
            limit?: number | undefined;
            cursor?: number | undefined;
        } | undefined;
        output: {
            success: boolean;
            data: {
                items: {
                    [x: string]: unknown;
                    name: string;
                    tags: string[];
                    deviceId?: number | undefined;
                    hostname?: string | undefined;
                    primaryIp?: string | undefined;
                    status?: string | undefined;
                    deviceType?: string | undefined;
                    deviceTypeGroup?: string | undefined;
                    powerStatus?: unknown;
                    location?: unknown;
                    billingInfo?: {
                        period?: string | undefined;
                        price?: number | undefined;
                    } | undefined;
                    displayedTags?: {
                        key: string;
                        value: any;
                    }[] | undefined;
                    isManaged?: boolean | null | undefined;
                    ipmiEnabled?: boolean | null | undefined;
                    hasCancellation?: boolean | null | undefined;
                    isReload?: boolean | null | undefined;
                    spsStatus?: string | undefined;
                    monitorsUp?: number | undefined;
                    monitorsTotal?: number | undefined;
                    servicePlan?: number | undefined;
                    productId?: number | undefined;
                    lastInvoiceId?: number | undefined;
                    createdDate?: string | undefined;
                }[];
                total: number;
                nextCursor: number | null;
            };
        };
        meta: object;
    }>;
    /**
     * Get all VPS instances in the account (paginated + filtered).
     *
     * List source: GET /device/ filtered to VPS rows (official docs include virtual
     * devices). GET /vps/ is reserved for per-instance VPS management on detail pages.
     */
    getMyVpsInstances: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            search?: string | undefined;
            facilityCode?: string | undefined;
            limit?: number | undefined;
            cursor?: number | undefined;
        } | undefined;
        output: {
            success: boolean;
            data: {
                items: HivelocityAnyResource[];
                total: number;
                nextCursor: number | null;
            };
        };
        meta: object;
    }>;
    /**
     * Get ALL account resources in a single unified call (dedicated + VPS + VDS).
     *
     * Implementation: GET /device/ (official docs: bare-metal + virtual devices).
     * Classifies each row as dedicated, vds, or vps from deviceType/deviceTypeGroup.
     */
    getMyAllResources: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            type?: "vps" | "vds" | "dedicated" | "all" | undefined;
            search?: string | undefined;
            facilityCode?: string | undefined;
            limit?: number | undefined;
            cursor?: number | undefined;
        } | undefined;
        output: {
            timing?: {
                filterMs: number;
                paginateMs: number;
                totalMs: number;
                filteredCount: number;
                returnedCount: number;
                typeFilter: "vps" | "vds" | "dedicated" | "all";
                hivelocity: {
                    device: HivelocityRequestTiming;
                    /** Not used for list views; kept for dev timing UI compatibility. */
                    vps?: HivelocityRequestTiming;
                    parallelMs: number;
                    source: "device";
                };
                mergeMs: number;
                counts: {
                    deviceRows: number;
                    vpsRows: number;
                    merged: number;
                };
            } | undefined;
            success: boolean;
            data: {
                items: HivelocityAnyResource[];
                total: number;
                nextCursor: number | null;
                counts: {
                    dedicated: number;
                    vds: number;
                    vps: number;
                    total: number;
                };
            };
        };
        meta: object;
    }>;
    /**
     * Team-scoped server list: only Hivelocity devices linked to the team's NiscClientSubscription
     * (serviceRefs.hivelocityDeviceId) for products named VPS hosting, VDS hosting, or Dedicated servers hosting (case-insensitive).
     */
    getTeamMyResources: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            teamSlug: string;
            type: "vps" | "vds" | "dedicated";
            search?: string | undefined;
            facilityCode?: string | undefined;
            limit?: number | undefined;
            cursor?: number | undefined;
        };
        output: {
            timing?: {
                db: {
                    teamLookupMs: number;
                    accessCheckMs: number;
                    subscriptionLookupMs: number;
                };
                scopeMs: number;
                filterMs: number;
                paginateMs: number;
                totalMs: number;
                allowedDeviceCount: number;
                filteredCount: number;
                returnedCount: number;
                typeFilter: "vps" | "vds" | "dedicated";
                hivelocity: {
                    device: HivelocityRequestTiming;
                    /** Not used for list views; kept for dev timing UI compatibility. */
                    vps?: HivelocityRequestTiming;
                    parallelMs: number;
                    source: "device";
                };
                mergeMs: number;
                counts: {
                    deviceRows: number;
                    vpsRows: number;
                    merged: number;
                };
            } | undefined;
            success: boolean;
            data: {
                items: HivelocityAnyResource[];
                total: number;
                nextCursor: number | null;
                counts: {
                    dedicated: number;
                    vds: number;
                    vps: number;
                    total: number;
                };
            };
        };
        meta: object;
    }>;
    /**
     * Customer: payment context for a suspended VPS - no upstream device details.
     */
    getCustomerSuspendedVpsContext: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            deviceId: number;
            teamSlug: string;
            teamResourceCategory: "vps" | "vds" | "dedicated";
        };
        output: {
            suspended: false;
            subscriptionId?: undefined;
            serviceLabel?: undefined;
            amount?: undefined;
            currency?: undefined;
            billingCycle?: undefined;
            productId?: undefined;
        } | {
            suspended: true;
            subscriptionId: string;
            serviceLabel: string;
            amount: number;
            currency: string;
            billingCycle: string | null;
            productId: string;
        };
        meta: object;
    }>;
    /**
     * Private: Get device details (standard /device/{id}).
     */
    getDeviceDetails: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            deviceId: number;
        } & {
            teamSlug?: string | undefined;
            teamResourceCategory?: "vps" | "vds" | "dedicated" | undefined;
        };
        output: {
            success: boolean;
            data: object | null;
        };
        meta: object;
    }>;
    /**
     * Private: Get VPS-specific details (/vps/{id}).
     */
    getVpsDetails: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            deviceId: number;
        } & {
            teamSlug?: string | undefined;
            teamResourceCategory?: "vps" | "vds" | "dedicated" | undefined;
        };
        output: {
            success: boolean;
            data: object | null;
        };
        meta: object;
    }>;
    /**
     * Private: Get VPS event log.
     */
    getVpsEvents: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            deviceId: number;
        } & {
            teamSlug?: string | undefined;
            teamResourceCategory?: "vps" | "vds" | "dedicated" | undefined;
        };
        output: {
            success: boolean;
            data: unknown;
        };
        meta: object;
    }>;
    /**
     * Private: Get VPS metrics charts (Base64).
     */
    getVpsMetrics: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            deviceId: number;
            metricType: "CPU_USAGE" | "MEMORY_USAGE" | "DISK_RW" | "NETWORK_USAGE";
            startTime?: number | undefined;
            endTime?: number | undefined;
            imageWidth?: number | undefined;
            imageHeight?: number | undefined;
        } & {
            teamSlug?: string | undefined;
            teamResourceCategory?: "vps" | "vds" | "dedicated" | undefined;
        };
        output: {
            success: boolean;
            data: unknown;
        };
        meta: object;
    }>;
    /**
     * Private: Get VPS volumes.
     */
    getVpsVolumes: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            deviceId: number;
        } & {
            teamSlug?: string | undefined;
            teamResourceCategory?: "vps" | "vds" | "dedicated" | undefined;
        };
        output: {
            success: boolean;
            data: unknown;
        };
        meta: object;
    }>;
    devicePowerAction: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            deviceId: number;
            action: "on" | "off" | "reboot" | "boot" | "shutdown";
        } & {
            teamSlug?: string | undefined;
            teamResourceCategory?: "vps" | "vds" | "dedicated" | undefined;
        };
        output: {
            success: boolean;
            data: any;
        };
        meta: object;
    }>;
    /**
     * Private: Get device power status (ON/OFF).
     */
    getDevicePowerStatus: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            deviceId: number;
        } & {
            teamSlug?: string | undefined;
            teamResourceCategory?: "vps" | "vds" | "dedicated" | undefined;
        };
        output: {
            success: boolean;
            data: any;
        };
        meta: object;
    }>;
    /**
     * Private: Get device switch ports and IP assignments.
     */
    getDevicePorts: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            deviceId: number;
        } & {
            teamSlug?: string | undefined;
            teamResourceCategory?: "vps" | "vds" | "dedicated" | undefined;
        };
        output: {
            success: boolean;
            data: unknown;
        };
        meta: object;
    }>;
    /**
     * Private: Get initial SSH credentials (user, password, port).
     */
    getDeviceInitialCreds: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            deviceId: number;
        } & {
            teamSlug?: string | undefined;
            teamResourceCategory?: "vps" | "vds" | "dedicated" | undefined;
        };
        output: {
            success: boolean;
            data: unknown;
        };
        meta: object;
    }>;
    /**
     * Private: Get initial SSH password.
     */
    getDeviceInitialPassword: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            deviceId: number;
        } & {
            teamSlug?: string | undefined;
            teamResourceCategory?: "vps" | "vds" | "dedicated" | undefined;
        };
        output: {
            success: boolean;
            data: unknown;
        };
        meta: object;
    }>;
    /**
     * Private: Check if facility supports IPMI whitelist.
     */
    getIpmiWhitelistSupported: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            deviceId: number;
        } & {
            teamSlug?: string | undefined;
            teamResourceCategory?: "vps" | "vds" | "dedicated" | undefined;
        };
        output: {
            success: boolean;
            data: unknown;
        };
        meta: object;
    }>;
    /**
     * Private: Get all VPS Snapshot Schedules for a device/facility.
     */
    getVpsSnapshotSchedules: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            deviceId?: number | undefined;
            facilityCode?: string | undefined;
            clientId?: number | undefined;
        } & {
            teamSlug?: string | undefined;
            teamResourceCategory?: "vps" | "vds" | "dedicated" | undefined;
        };
        output: {
            success: boolean;
            data: unknown;
        };
        meta: object;
    }>;
    /**
     * Private: Create a VPS Snapshot Schedule.
     */
    createVpsSnapshotSchedule: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            [x: string]: unknown;
            timezone: string;
            volumeId: string;
            intervalType: "MONTHLY" | "DAILY" | "WEEKLY" | "HOURLY";
            maxSnapshots: number;
            facilityCode: string;
            hour?: number | undefined;
            minute?: number | undefined;
            day?: number | undefined;
            weekday?: number | undefined;
            clientId?: number | undefined;
            deviceId?: number | undefined;
        } & {
            teamSlug?: string | undefined;
            teamResourceCategory?: "vps" | "vds" | "dedicated" | undefined;
        };
        output: {
            success: boolean;
            data: unknown;
        };
        meta: object;
    }>;
    /**
     * Private: Create a new VPS Volume.
     */
    createVpsVolume: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            deviceId: number;
            size: number;
        } & {
            teamSlug?: string | undefined;
            teamResourceCategory?: "vps" | "vds" | "dedicated" | undefined;
        };
        output: {
            success: boolean;
            data: unknown;
        };
        meta: object;
    }>;
    /**
     * Private: Resize a VPS Volume.
     */
    resizeVpsVolume: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            volumeId: string;
            size: number;
            deviceId?: number | undefined;
        } & {
            teamSlug?: string | undefined;
            teamResourceCategory?: "vps" | "vds" | "dedicated" | undefined;
        };
        output: {
            success: boolean;
            data: unknown;
        };
        meta: object;
    }>;
    /**
     * Private: Delete a VPS Volume.
     */
    deleteVpsVolume: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            volumeId: string;
            deviceId?: number | undefined;
        } & {
            teamSlug?: string | undefined;
            teamResourceCategory?: "vps" | "vds" | "dedicated" | undefined;
        };
        output: {
            success: boolean;
            data: unknown;
        };
        meta: object;
    }>;
    /**
     * Private: Get a volume's list of upgradable sizes.
     */
    getVpsVolumeAvailableSizes: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            volumeId: string;
        };
        output: {
            success: boolean;
            data: unknown;
        };
        meta: object;
    }>;
    /**
     * Private: Restore a VPS Volume Snapshot.
     */
    restoreVpsSnapshot: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            snapshotId: string;
            facilityCode: string;
            clientId?: number | undefined;
        };
        output: {
            success: boolean;
            data: unknown;
        };
        meta: object;
    }>;
    /**
     * Private: Delete a VPS Volume Snapshot.
     */
    deleteVpsSnapshot: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            snapshotId: string;
            facilityCode?: string | undefined;
            clientId?: number | undefined;
        };
        output: {
            success: boolean;
            data: unknown;
        };
        meta: object;
    }>;
    /**
     * Private: Get all VPS Volume Snapshots available.
     */
    getVpsSnapshots: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            facilityCode: string;
            clientId?: number | undefined;
        };
        output: {
            success: boolean;
            data: unknown;
        };
        meta: object;
    }>;
    /**
     * Private: Create a manual VPS Volume Snapshot.
     */
    createVpsSnapshot: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            volumeId: string;
            name: string;
            facilityCode: string;
            clientId?: number | undefined;
        };
        output: {
            success: boolean;
            data: unknown;
        };
        meta: object;
    }>;
    /**
     * Private: Delete a VPS Snapshot Schedule.
     */
    deleteVpsSnapshotSchedule: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            snapshotScheduleId: string;
            facilityCode: string;
        };
        output: {
            success: boolean;
            data: unknown;
        };
        meta: object;
    }>;
    /**
     * Private: Initiate an OS reload.
     */
    reloadDevice: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            deviceId: number;
            operatingSystemId?: number | undefined;
            publicSshKeyIds?: number[] | undefined;
            script?: string | undefined;
        } & {
            teamSlug?: string | undefined;
            teamResourceCategory?: "vps" | "vds" | "dedicated" | undefined;
        };
        output: {
            success: boolean;
            data: unknown;
        };
        meta: object;
    }>;
    /**
     * Private: Update device metadata (name, hostname).
     */
    updateDevice: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            deviceId: number;
            name?: string | undefined;
            hostname?: string | undefined;
        } & {
            teamSlug?: string | undefined;
            teamResourceCategory?: "vps" | "vds" | "dedicated" | undefined;
        };
        output: {
            success: boolean;
            data: unknown;
        };
        meta: object;
    }>;
    /**
     * Private: Request token to reset root password for VPS.
     * Token is emailed to the Hivelocity account contact - not returned in the published API schema.
     */
    vpsRequestResetPasswordToken: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            deviceId: number;
        } & {
            teamSlug?: string | undefined;
            teamResourceCategory?: "vps" | "vds" | "dedicated" | undefined;
        };
        output: {
            success: boolean;
            data: import("../../lib/hivelocity-vps-password-reset").VpsPasswordResetRequestResult;
        };
        meta: object;
    }>;
    /**
     * Private: Reset VPS root password (requires token and device to be powered off).
     */
    vpsResetRootPassword: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            deviceId: number;
            token: string;
        } & {
            teamSlug?: string | undefined;
            teamResourceCategory?: "vps" | "vds" | "dedicated" | undefined;
        };
        output: {
            success: boolean;
            data: unknown;
        };
        meta: object;
    }>;
    /**
     * Private: List VPS ISOs available in a facility (GET /vps/iso).
     */
    listVpsIsos: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            facilityCode: string;
        };
        output: {
            success: boolean;
            data: unknown;
        };
        meta: object;
    }>;
    /**
     * Private: Get OS reload options for a device (GET /device/{deviceId}/reload).
     */
    getDeviceReloadInfo: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            deviceId: number;
        } & {
            teamSlug?: string | undefined;
            teamResourceCategory?: "vps" | "vds" | "dedicated" | undefined;
        };
        output: {
            success: boolean;
            data: unknown;
        };
        meta: object;
    }>;
    /**
     * Private: Attach ISO to VPS.
     */
    vpsAttachIso: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            deviceId: number;
            isoId: string;
        } & {
            teamSlug?: string | undefined;
            teamResourceCategory?: "vps" | "vds" | "dedicated" | undefined;
        };
        output: {
            success: boolean;
            data: unknown;
        };
        meta: object;
    }>;
    /**
     * Private: Detach ISO from VPS.
     */
    vpsDetachIso: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            deviceId: number;
        } & {
            teamSlug?: string | undefined;
            teamResourceCategory?: "vps" | "vds" | "dedicated" | undefined;
        };
        output: {
            success: boolean;
            data: unknown;
        };
        meta: object;
    }>;
    /**
     * Private: Get one-time browser console URL for VPS.
     */
    vpsGetConsoleUrl: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            deviceId: number;
        } & {
            teamSlug?: string | undefined;
            teamResourceCategory?: "vps" | "vds" | "dedicated" | undefined;
        };
        output: {
            success: boolean;
            data: unknown;
        };
        meta: object;
    }>;
    /**
     * Private: List account SSH public keys (GET /ssh_key/).
     */
    listSshKeys: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: {
            success: boolean;
            data: import("../../lib/hivelocity-vps-ssh-keys").HivelocitySshKey[];
        };
        meta: object;
    }>;
    /**
     * Private: Add an SSH public key to the account (POST /ssh_key/).
     */
    createSshKey: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            name: string;
            publicKey: string;
        };
        output: {
            success: boolean;
            data: import("../../lib/hivelocity-vps-ssh-keys").HivelocitySshKey;
        };
        meta: object;
    }>;
    /**
     * Private: Remove an SSH public key from the account (DELETE /ssh_key/{id}).
     */
    deleteSshKey: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            sshKeyId: number;
        };
        output: {
            success: boolean;
        };
        meta: object;
    }>;
    /**
     * Private: Replace SSH keys deployed on a VPS (PUT /vps/{deviceId}).
     * Instance must be powered off.
     */
    updateVpsSshKeys: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            deviceId: number;
            sshKeyIds: number[];
        } & {
            teamSlug?: string | undefined;
            teamResourceCategory?: "vps" | "vds" | "dedicated" | undefined;
        };
        output: {
            success: boolean;
            data: unknown;
        };
        meta: object;
    }>;
    /**
     * Agency: suspend customer panel access and power off the VPS upstream.
     */
    suspendVpsInstance: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            deviceId: number;
            subscriptionId: string;
        };
        output: {
            success: boolean;
            data: {
                upstreamPoweredOff: boolean;
            };
        };
        meta: object;
    }>;
    /**
     * Agency: restore customer panel access and boot the VPS if we powered it off on suspend.
     */
    reactivateVpsInstance: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            deviceId: number;
            subscriptionId: string;
        };
        output: {
            success: boolean;
            data: {
                upstreamPoweredOn: boolean;
            };
        };
        meta: object;
    }>;
    /**
     * Private: Get a short-lived ticket for authenticating cross-origin WebSockets.
     */
    getWsTicket: import("@trpc/server").TRPCMutationProcedure<{
        input: void;
        output: {
            ticket: `${string}-${string}-${string}-${string}-${string}`;
        };
        meta: object;
    }>;
}>>;
