import { type HivelocityFacility, type HivelocityInventoryResponse } from "../types/hivelocity";
export type HivelocityInventoryQuery = {
    location?: string;
    include_custom?: boolean;
    bonding_support?: string | null;
};
/**
 * Cached Hivelocity `/inventory/product` with L1 memory, Redis L2, and in-flight deduplication.
 */
export declare function getCachedHivelocityInventory(query?: HivelocityInventoryQuery): Promise<HivelocityInventoryResponse>;
/**
 * Cached Hivelocity `/inventory/locations`.
 */
export declare function getCachedHivelocityFacilities(vpsLocations?: string): Promise<HivelocityFacility[]>;
