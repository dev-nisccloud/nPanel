/**
 * Bump version to invalidate all product caches. Call after create/update/delete product or plan.
 */
export declare function invalidateProductsCache(): Promise<void>;
/**
 * Get from cache. Returns null on miss or if Redis unavailable.
 */
export declare function getCached<T>(keyParts: string[]): Promise<T | null>;
/**
 * Set cache with TTL. Uses STALE_TTL so we can serve stale while revalidating later if needed.
 */
export declare function setCached(keyParts: string[], value: unknown): Promise<void>;
/** Cache key for getAll (optional filter). */
export declare function listKey(input?: {
    category?: string;
    serviceType?: string;
    isActive?: boolean;
}): string[];
/** Cache key for getById. */
export declare function idKey(id: string, includePlans: boolean): string[];
/** Cache key for getAddOnsForProduct. */
export declare function addonsKey(baseProductId: string): string[];
/** Cache key for getHostingProductsForUpsell. */
export declare function hostingUpsellKey(): string[];
/** Cache key for getDigitalMarketingPlansForUpsell. */
export declare function digitalMarketingUpsellKey(): string[];
