/**
 * VPS / VDS / dedicated plan catalogue for Zeepo AI.
 *
 * Returns Nisc Cloud retail prices (margin + KES conversion applied).
 * Checkout internals are attached for the UI and stripped before the model sees them.
 * Never expose upstream vendor names in errors or payload copy.
 */
import { type HivelocityProductTypeKey } from "../hivelocity-display-pricing";
export type CloudPlanKind = "vps" | "vds" | "dedicated";
export type CloudPlansToolName = "get_vps_plans" | "get_vds_plans" | "get_dedicated_server_plans";
export interface CloudPlanCheckout {
    productType: HivelocityProductTypeKey;
    inventoryProductId: number;
    locationName: string;
    disabledBillingPeriods: string[];
    usdMonthly: number;
    usdHourly: number;
    usdByPeriod: {
        hourly: number;
        monthly: number;
        quarterly: number;
        "semi-annually": number;
        annually: number;
        biennial: number;
        triennial: number;
    };
}
export interface CloudPlanEntry {
    product_id: number;
    product_name: string;
    data_center: string;
    locationDisplayName: string;
    location_option_id: number;
    stock: "available" | "limited" | "unavailable";
    is_vps: boolean;
    is_vds: boolean;
    product_cpu?: string;
    product_cpu_cores?: string;
    processor_info?: unknown;
    product_memory?: string;
    product_drive?: string;
    product_drive_info?: unknown;
    product_bandwidth?: string;
    product_new?: boolean;
    product_on_sale?: boolean;
    product_hourly_price: number;
    product_monthly_price: number;
    product_original_price?: number;
    checkout: CloudPlanCheckout;
}
export interface CloudPlansResult {
    _tool: CloudPlansToolName;
    kind: CloudPlanKind;
    displayCurrency: "KES" | "USD";
    niscProductId: string;
    search: string;
    filterSummary: string | null;
    matchMode: "browse" | "best";
    plans: CloudPlanEntry[];
    totalCount: number;
    hasMore: boolean;
    nextCursor: number | null;
    checkedAt: string;
}
export type CloudPlanQuery = {
    search?: string;
    limit?: number;
    cursor?: number;
    ramGb?: number;
    cores?: number;
    cpu?: "intel" | "amd";
    diskGb?: number;
    location?: string;
};
export declare function agentGetCloudPlans(params: CloudPlanQuery & {
    kind: CloudPlanKind;
}): Promise<CloudPlansResult>;
export declare function agentGetVpsPlans(opts?: CloudPlanQuery & {
    ram_gb?: number;
    disk_gb?: number;
}): Promise<CloudPlansResult>;
export declare function agentGetVdsPlans(opts?: CloudPlanQuery & {
    ram_gb?: number;
    disk_gb?: number;
}): Promise<CloudPlansResult>;
export declare function agentGetDedicatedServerPlans(opts?: CloudPlanQuery & {
    ram_gb?: number;
    disk_gb?: number;
}): Promise<CloudPlansResult>;
