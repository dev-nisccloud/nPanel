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
            data: import("../../types/hivelocity").HivelocityInventoryResponse | {
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
}>>;
