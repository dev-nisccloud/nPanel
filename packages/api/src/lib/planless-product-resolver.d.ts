import { niscProduct } from "@npanel/db/schema/products";
import { HIVELOCITY_NISC_PRODUCT_ID_BY_TYPE } from "./planless-services-billing";
type NiscProductRow = typeof niscProduct.$inferSelect;
/**
 * Resolve an active nisc_product row by id.
 * - Exact id lookup first (active only).
 * - Canonical planless ids fall back to a single active legacy row when seed id is missing.
 * - Legacy UUID ids upgrade to the active canonical row when it exists.
 * Name/serviceType matching is only used for canonical-id fallback, never for arbitrary ids.
 */
export declare function resolveActiveNiscProductById(productId: string): Promise<NiscProductRow | null>;
/** Resolved active product id for checkout/orders (canonical when available). */
export declare function resolveActiveNiscProductId(productId: string): Promise<string | null>;
export declare function resolvePlanlessProductIdForCheckout(canonicalId: string): Promise<string | null>;
export declare function resolveHivelocityProductIdForCheckout(productType: keyof typeof HIVELOCITY_NISC_PRODUCT_ID_BY_TYPE): Promise<string | null>;
export declare function isPlanlessCanonicalProductId(productId: string): boolean;
export declare function getCanonicalPlanlessProductId(serviceType: string): string | undefined;
export type PlanlessProductMigrationTarget = {
    canonicalId: string;
    canonicalName: string;
    canonicalActive: boolean;
    legacyProducts: Array<{
        id: string;
        name: string;
        isActive: boolean;
        serviceType: string;
    }>;
};
/** List legacy planless products that should be migrated to each canonical id. */
export declare function listPlanlessLegacyProductMigrationTargets(): Promise<PlanlessProductMigrationTarget[]>;
/** Map each legacy planless product id to its canonical seed id (legacy id -> canonical id). */
export declare function getPlanlessLegacyToCanonicalIdMap(): Promise<Map<string, string>>;
export {};
