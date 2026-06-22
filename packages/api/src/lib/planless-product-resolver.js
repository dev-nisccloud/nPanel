import { and, asc, eq, ilike, ne, or } from "@npanel/db";
import { db } from "@npanel/db";
import { niscProduct } from "@npanel/db/schema/products";
import { HIVELOCITY_NISC_PRODUCT_ID_BY_TYPE, NISC_DEDICATED_SERVERS_PRODUCT_ID, NISC_DOMAINS_PRODUCT_ID, NISC_VDS_HOSTING_PRODUCT_ID, NISC_VPS_HOSTING_PRODUCT_ID, PLANLESS_SERVICE_TYPES, } from "./planless-services-billing";
const PLANLESS_CANONICAL_IDS = new Set([
    NISC_DOMAINS_PRODUCT_ID,
    NISC_VPS_HOSTING_PRODUCT_ID,
    NISC_VDS_HOSTING_PRODUCT_ID,
    NISC_DEDICATED_SERVERS_PRODUCT_ID,
]);
const CANONICAL_ID_BY_SERVICE_TYPE = {
    [PLANLESS_SERVICE_TYPES.domains]: NISC_DOMAINS_PRODUCT_ID,
    domain_registration: NISC_DOMAINS_PRODUCT_ID,
    [PLANLESS_SERVICE_TYPES.vpsHosting]: NISC_VPS_HOSTING_PRODUCT_ID,
    [PLANLESS_SERVICE_TYPES.vdsHosting]: NISC_VDS_HOSTING_PRODUCT_ID,
    [PLANLESS_SERVICE_TYPES.dedicatedServers]: NISC_DEDICATED_SERVERS_PRODUCT_ID,
};
function legacyMatchForCanonicalId(productId) {
    switch (productId) {
        case NISC_DOMAINS_PRODUCT_ID:
            return or(eq(niscProduct.serviceType, PLANLESS_SERVICE_TYPES.domains), eq(niscProduct.serviceType, "domain_registration"), ilike(niscProduct.name, "%domain%"));
        case NISC_VPS_HOSTING_PRODUCT_ID:
            return or(eq(niscProduct.serviceType, PLANLESS_SERVICE_TYPES.vpsHosting), ilike(niscProduct.name, "%vps%"));
        case NISC_VDS_HOSTING_PRODUCT_ID:
            return or(eq(niscProduct.serviceType, PLANLESS_SERVICE_TYPES.vdsHosting), ilike(niscProduct.name, "%vds%"));
        case NISC_DEDICATED_SERVERS_PRODUCT_ID:
            return or(eq(niscProduct.serviceType, PLANLESS_SERVICE_TYPES.dedicatedServers), ilike(niscProduct.name, "%dedicated%"));
        default:
            return null;
    }
}
async function loadActiveProductById(id) {
    const [row] = await db
        .select()
        .from(niscProduct)
        .where(and(eq(niscProduct.id, id), eq(niscProduct.isActive, true)))
        .limit(1);
    return row ?? null;
}
/** When a legacy row is active, prefer the canonical planless id if that row is also active. */
async function preferActiveCanonicalProduct(product) {
    const canonicalId = CANONICAL_ID_BY_SERVICE_TYPE[product.serviceType];
    if (!canonicalId || product.id === canonicalId)
        return product;
    const canonical = await loadActiveProductById(canonicalId);
    return canonical ?? product;
}
async function findActiveLegacyPlanlessProduct(canonicalId) {
    const legacyMatch = legacyMatchForCanonicalId(canonicalId);
    if (!legacyMatch)
        return null;
    const rows = await db
        .select()
        .from(niscProduct)
        .where(and(eq(niscProduct.isActive, true), legacyMatch))
        .orderBy(asc(niscProduct.sortOrder), asc(niscProduct.createdAt));
    const canonicalRow = rows.find((row) => row.id === canonicalId);
    if (canonicalRow)
        return canonicalRow;
    return rows[0] ?? null;
}
/**
 * Resolve an active nisc_product row by id.
 * - Exact id lookup first (active only).
 * - Canonical planless ids fall back to a single active legacy row when seed id is missing.
 * - Legacy UUID ids upgrade to the active canonical row when it exists.
 * Name/serviceType matching is only used for canonical-id fallback, never for arbitrary ids.
 */
export async function resolveActiveNiscProductById(productId) {
    const trimmed = productId.trim();
    if (!trimmed)
        return null;
    const exact = await loadActiveProductById(trimmed);
    if (exact) {
        return preferActiveCanonicalProduct(exact);
    }
    if (isPlanlessCanonicalProductId(trimmed)) {
        const legacy = await findActiveLegacyPlanlessProduct(trimmed);
        return legacy ? preferActiveCanonicalProduct(legacy) : null;
    }
    return null;
}
/** Resolved active product id for checkout/orders (canonical when available). */
export async function resolveActiveNiscProductId(productId) {
    const product = await resolveActiveNiscProductById(productId);
    return product?.id ?? null;
}
export async function resolvePlanlessProductIdForCheckout(canonicalId) {
    return resolveActiveNiscProductId(canonicalId);
}
export async function resolveHivelocityProductIdForCheckout(productType) {
    return resolveActiveNiscProductId(HIVELOCITY_NISC_PRODUCT_ID_BY_TYPE[productType]);
}
export function isPlanlessCanonicalProductId(productId) {
    return PLANLESS_CANONICAL_IDS.has(productId.trim());
}
export function getCanonicalPlanlessProductId(serviceType) {
    return CANONICAL_ID_BY_SERVICE_TYPE[serviceType];
}
const PLANLESS_MIGRATION_TARGETS = [
    { canonicalId: NISC_DOMAINS_PRODUCT_ID, label: "Domains" },
    { canonicalId: NISC_VPS_HOSTING_PRODUCT_ID, label: "VPS Hosting" },
    { canonicalId: NISC_VDS_HOSTING_PRODUCT_ID, label: "VDS Hosting" },
    { canonicalId: NISC_DEDICATED_SERVERS_PRODUCT_ID, label: "Dedicated Servers" },
];
/** List legacy planless products that should be migrated to each canonical id. */
export async function listPlanlessLegacyProductMigrationTargets() {
    const results = [];
    for (const target of PLANLESS_MIGRATION_TARGETS) {
        const [canonical] = await db
            .select({
            id: niscProduct.id,
            name: niscProduct.name,
            isActive: niscProduct.isActive,
        })
            .from(niscProduct)
            .where(eq(niscProduct.id, target.canonicalId))
            .limit(1);
        const legacyMatch = legacyMatchForCanonicalId(target.canonicalId);
        const legacyProducts = legacyMatch
            ? await db
                .select({
                id: niscProduct.id,
                name: niscProduct.name,
                isActive: niscProduct.isActive,
                serviceType: niscProduct.serviceType,
            })
                .from(niscProduct)
                .where(and(ne(niscProduct.id, target.canonicalId), legacyMatch))
                .orderBy(asc(niscProduct.sortOrder), asc(niscProduct.createdAt))
            : [];
        results.push({
            canonicalId: target.canonicalId,
            canonicalName: canonical?.name ?? target.label,
            canonicalActive: canonical?.isActive ?? false,
            legacyProducts,
        });
    }
    return results;
}
/** Map each legacy planless product id to its canonical seed id (legacy id -> canonical id). */
export async function getPlanlessLegacyToCanonicalIdMap() {
    const map = new Map();
    const targets = await listPlanlessLegacyProductMigrationTargets();
    for (const target of targets) {
        for (const legacy of target.legacyProducts) {
            map.set(legacy.id, target.canonicalId);
        }
    }
    return map;
}
