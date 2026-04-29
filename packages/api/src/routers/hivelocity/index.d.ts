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
            baseUrl: string;
            status: string;
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
     * Public (TEMP for development): Get product operating systems.
     * Docs: GET /product/{productId}/operating-systems
     *
     * NOTE: This is intentionally `protectedProcedure` so you can test and inspect the live response shape
     * while we finalize types. Switch to `protectedProcedure` before shipping.
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
     * NOTE: This is intentionally `protectedProcedure` so you can test and inspect the live response shape
     * while we finalize types. Switch to `protectedProcedure` before shipping.
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
     * Public (TEMP for development): Get initial password (first-login creds).
     * Docs: GET /device/{deviceId}/initial-password
     */
    getDeviceInitialPassword: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            deviceId: number;
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
            data: import("../../types/hivelocity").HivelocityInventoryResponse;
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
                    stock: "unavailable" | "available" | "limited";
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
                    stock: "unavailable" | "available" | "limited";
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
                    stock: "unavailable" | "available" | "limited";
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
            data: import("../../types/hivelocity").HivelocityInventoryResponse | {
                [x: string]: unknown;
                product_id: number;
                product_name: string;
                stock: "unavailable" | "available" | "limited";
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
                stock: "unavailable" | "available" | "limited";
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
}>>;
