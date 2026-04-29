import { z } from "zod";
import { protectedProcedure, router } from "../../trpc";
import { getHivelocityEnvStatus, hivelocityRequest } from "../../lib/hivelocity-client";
import { hivelocityFacilitiesResponseSchema, normalizeHivelocityInventory, hivelocityProductByIdResponseSchema, } from "../../types/hivelocity";
const HivelocityPeriodSchema = z.enum([
    "hourly",
    "monthly",
    "quarterly",
    "semi-annually",
    "annually",
    "biennial",
    "triennial",
]);
const ProductsQuerySchema = z
    .object({
    location: z
        .enum(["MAIN", "CUSTOM_DISPLAY", "MASSIVESTORAGE", "GPU", "OUTLET", "LANDING"])
        .default("MAIN")
        .optional(),
    include_custom: z.boolean().default(false).optional(),
    bonding_support: z.string().nullable().default(null).optional(),
    group_by: z.string().default("facility").optional(),
})
    .optional();
const DedicatedPlansQuerySchema = z
    .object({
    location: z
        .enum(["MAIN", "CUSTOM_DISPLAY", "MASSIVESTORAGE", "GPU", "OUTLET", "LANDING"])
        .default("MAIN")
        .optional(),
    include_custom: z.boolean().default(false).optional(),
    bonding_support: z.string().nullable().default(null).optional(),
    facility_code: z.string().optional(),
    search: z.string().optional(),
    limit: z.number().int().min(1).max(100).default(24).optional(),
    cursor: z.number().int().min(0).default(0).optional(), // offset-based cursor
})
    .optional();
const VpsPlansQuerySchema = DedicatedPlansQuerySchema;
const VdsPlansQuerySchema = DedicatedPlansQuerySchema;
let dedicatedPlansCache = new Map();
function buildCacheKey(input) {
    return JSON.stringify({
        location: input?.location ?? "MAIN",
        include_custom: input?.include_custom ?? false,
        bonding_support: input?.bonding_support ?? null,
    });
}
export const hivelocityRouter = router({
    /**
     * Private: quick integration check.
     */
    healthCheck: protectedProcedure.query(() => {
        return {
            status: "OK",
            ...getHivelocityEnvStatus(),
        };
    }),
    /**
     * Private: Get all facilities (inventory locations).
     * Docs: GET /inventory/locations (this endpoint is public per Hivelocity docs).
     */
    getFacilities: protectedProcedure
        .input(z
        .object({
        vpsLocations: z.string().optional(),
    })
        .optional())
        .query(async ({ input }) => {
        const raw = await hivelocityRequest("/inventory/locations", {
            query: {
                vpsLocations: input?.vpsLocations,
            },
            requireApiKey: false,
        });
        const data = hivelocityFacilitiesResponseSchema.parse(raw);
        return { success: true, data };
    }),
    /**
     * Public (TEMP for development): Get product operating systems.
     * Docs: GET /product/{productId}/operating-systems
     *
     * NOTE: This is intentionally `protectedProcedure` so you can test and inspect the live response shape
     * while we finalize types. Switch to `protectedProcedure` before shipping.
     */
    getProductOperatingSystems: protectedProcedure
        .input(z.object({ productId: z.number().int().positive() }))
        .query(async ({ input }) => {
        const raw = await hivelocityRequest(`/product/${input.productId}/operating-systems`, {
            requireApiKey: true,
        });
        return { success: true, data: raw };
    }),
    /**
     * Public (TEMP for development): Get product options/add-ons.
     * Docs: GET /product/{productId}/options?groupBy=upgrade
     *
     * NOTE: This is intentionally `protectedProcedure` so you can test and inspect the live response shape
     * while we finalize types. Switch to `protectedProcedure` before shipping.
     */
    getProductOptions: protectedProcedure
        .input(z.object({
        productId: z.number().int().positive(),
        groupBy: z.string().optional().default("upgrade"),
    }))
        .query(async ({ input }) => {
        const raw = await hivelocityRequest(`/product/${input.productId}/options`, {
            query: { groupBy: input.groupBy },
            requireApiKey: true,
        });
        return { success: true, data: raw };
    }),
    /**
     * Public (TEMP for development): Provision an instant compute device (recommended endpoint).
     * Docs: POST /compute/
     *
     * NOTE: This creates billable resources in Hivelocity. Use only in test accounts.
     */
    provisionComputeDevice: protectedProcedure
        .input(z.object({
        productId: z.number().int().positive(),
        locationName: z.string().min(1),
        osName: z.string().min(1),
        hostname: z.string().min(1),
        period: HivelocityPeriodSchema.optional(),
        publicSshKeyId: z.number().int().optional(),
        vlanId: z.number().int().optional(),
        script: z.string().optional(),
        customIPXEScriptURL: z.string().url().optional(),
        customIPXEScriptContents: z.string().optional(),
        forceDeviceId: z.number().int().optional(),
        ignitionId: z.number().int().optional(),
        bondingSupport: z.boolean().optional(),
        tags: z.array(z.string()).optional(),
        /**
         * Add-on option ids. This field is used by the Hivelocity store.
         * Not explicitly present in the BareMetalDeviceCreate schema in the docs,
         * but is required for full purchase configuration. Kept optional for now.
         */
        optionIds: z.array(z.number().int()).optional(),
    }))
        .mutation(async ({ input }) => {
        const raw = await hivelocityRequest("/compute/", {
            method: "POST",
            requireApiKey: true,
            body: input,
        });
        return { success: true, data: raw };
    }),
    /**
     * Public (TEMP for development): Provision an instant bare metal device (legacy endpoint).
     * Docs: POST /bare-metal-devices/
     */
    provisionBareMetalDevice: protectedProcedure
        .input(z.object({
        productId: z.number().int().positive(),
        locationName: z.string().min(1),
        osName: z.string().min(1),
        hostname: z.string().min(1),
        period: HivelocityPeriodSchema.optional(),
        publicSshKeyId: z.number().int().optional(),
        vlanId: z.number().int().optional(),
        script: z.string().optional(),
        customIPXEScriptURL: z.string().url().optional(),
        customIPXEScriptContents: z.string().optional(),
        forceDeviceId: z.number().int().optional(),
        ignitionId: z.number().int().optional(),
        bondingSupport: z.boolean().optional(),
        tags: z.array(z.string()).optional(),
        optionIds: z.array(z.number().int()).optional(),
    }))
        .mutation(async ({ input }) => {
        const raw = await hivelocityRequest("/bare-metal-devices/", {
            method: "POST",
            requireApiKey: true,
            body: input,
        });
        return { success: true, data: raw };
    }),
    /**
     * Public (TEMP for development): Get order by id (used to poll provisioning status).
     * Docs: GET /order/{orderId}
     */
    getOrderById: protectedProcedure
        .input(z.object({ orderId: z.number().int().positive() }))
        .query(async ({ input }) => {
        const raw = await hivelocityRequest(`/order/${input.orderId}`, { requireApiKey: true });
        return { success: true, data: raw };
    }),
    /**
     * Public (TEMP for development): Get compute device by id.
     * Docs: GET /compute/{deviceId}
     */
    getComputeDeviceById: protectedProcedure
        .input(z.object({ deviceId: z.number().int().positive() }))
        .query(async ({ input }) => {
        const raw = await hivelocityRequest(`/compute/${input.deviceId}`, { requireApiKey: true });
        return { success: true, data: raw };
    }),
    /**
     * Public (TEMP for development): Get all compute devices.
     * Docs: GET /compute/
     */
    getComputeDevices: protectedProcedure.query(async () => {
        const raw = await hivelocityRequest("/compute/", { requireApiKey: true });
        return { success: true, data: raw };
    }),
    /**
     * Public (TEMP for development): Get all devices (Device API).
     * Docs: GET /device/
     *
     * Notes:
     * - Hivelocity documentation shows `rack_id` as a filter.
     * - In practice, Hivelocity also supports filtering by `orderId` (used in their quickstart docs),
     *   so we expose it here for testing even if not present in the OpenAPI schema.
     */
    getDevices: protectedProcedure
        .input(z
        .object({
        rack_id: z.number().int().optional(),
        orderId: z.number().int().optional(),
    })
        .optional())
        .query(async ({ input }) => {
        const raw = await hivelocityRequest("/device/", {
            query: {
                rack_id: input?.rack_id,
                orderId: input?.orderId,
            },
            requireApiKey: true,
        });
        return { success: true, data: raw };
    }),
    /**
     * Public (TEMP for development): Get initial password (first-login creds).
     * Docs: GET /device/{deviceId}/initial-password
     */
    getDeviceInitialPassword: protectedProcedure
        .input(z.object({ deviceId: z.number().int().positive() }))
        .query(async ({ input }) => {
        const raw = await hivelocityRequest(`/device/${input.deviceId}/initial-password`, {
            requireApiKey: true,
        });
        return { success: true, data: raw };
    }),
    /**
     * Private: Get all products.
     * Docs: GET /inventory/product
     */
    getProducts: protectedProcedure.input(ProductsQuerySchema).query(async ({ input }) => {
        const raw = await hivelocityRequest("/inventory/product", {
            query: {
                location: input?.location,
                include_custom: input?.include_custom,
                bonding_support: input?.bonding_support,
                group_by: input?.group_by,
            },
            requireApiKey: true,
        });
        const data = normalizeHivelocityInventory(raw);
        return { success: true, data };
    }),
    /**
     * Private: Dedicated server plans (paginated).
     *
     * Why this exists:
     * - `/inventory/product` can be very large and will overwhelm the browser if rendered at once.
     * - Hivelocity does not document native pagination for this endpoint, so we fetch once,
     *   normalize + filter server-side, then return a slice.
     */
    getDedicatedServerPlans: protectedProcedure.input(DedicatedPlansQuerySchema).query(async ({ input }) => {
        const limit = input?.limit ?? 24;
        const cursor = input?.cursor ?? 0;
        const facilityCode = input?.facility_code?.trim() || undefined;
        const search = input?.search?.trim().toLowerCase() || "";
        // Cache the raw inventory for a short TTL to prevent re-fetching on every page click.
        const cacheKey = buildCacheKey(input);
        const now = Date.now();
        const TTL_MS = 60_000;
        const cached = dedicatedPlansCache.get(cacheKey);
        let inventory;
        if (cached && now - cached.atMs < TTL_MS) {
            inventory = cached.inventory;
        }
        else {
            const raw = await hivelocityRequest("/inventory/product", {
                query: {
                    location: input?.location,
                    include_custom: input?.include_custom,
                    bonding_support: input?.bonding_support,
                    group_by: "facility",
                },
                requireApiKey: true,
            });
            inventory = normalizeHivelocityInventory(raw);
            dedicatedPlansCache.set(cacheKey, { atMs: now, inventory });
        }
        const all = Object.values(inventory).flat();
        let dedicated = all.filter((p) => p.is_vps === false && p.is_vds === false);
        if (facilityCode) {
            dedicated = dedicated.filter((p) => p.data_center === facilityCode);
        }
        if (search.length > 0) {
            dedicated = dedicated.filter((p) => {
                const hay = [
                    p.product_name,
                    p.product_cpu,
                    p.product_memory,
                    p.product_drive,
                    p.product_bandwidth,
                    String(p.product_id),
                    p.data_center,
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();
                return hay.includes(search);
            });
        }
        // Deterministic ordering to keep paging stable and prevent duplicates.
        const stockRank = (s) => (s === "available" ? 0 : s === "limited" ? 1 : 2);
        dedicated.sort((a, b) => {
            const sr = stockRank(a.stock) - stockRank(b.stock);
            if (sr !== 0)
                return sr;
            const ap = a.product_monthly_price ?? Number.POSITIVE_INFINITY;
            const bp = b.product_monthly_price ?? Number.POSITIVE_INFINITY;
            if (ap !== bp)
                return ap - bp;
            if (a.product_id !== b.product_id)
                return a.product_id - b.product_id;
            return a.location_option_id - b.location_option_id;
        });
        const total = dedicated.length;
        const items = dedicated.slice(cursor, cursor + limit);
        const nextCursor = cursor + limit < total ? cursor + limit : null;
        return {
            success: true,
            data: {
                items,
                total,
                nextCursor,
            },
        };
    }),
    /**
     * Private: VPS plans (paginated).
     */
    getVpsPlans: protectedProcedure.input(VpsPlansQuerySchema).query(async ({ input }) => {
        const limit = input?.limit ?? 24;
        const cursor = input?.cursor ?? 0;
        const facilityCode = input?.facility_code?.trim() || undefined;
        const search = input?.search?.trim().toLowerCase() || "";
        const cacheKey = buildCacheKey(input);
        const now = Date.now();
        const TTL_MS = 60_000;
        const cached = dedicatedPlansCache.get(cacheKey);
        let inventory;
        if (cached && now - cached.atMs < TTL_MS) {
            inventory = cached.inventory;
        }
        else {
            const raw = await hivelocityRequest("/inventory/product", {
                query: {
                    location: input?.location,
                    include_custom: input?.include_custom,
                    bonding_support: input?.bonding_support,
                    group_by: "facility",
                },
                requireApiKey: true,
            });
            inventory = normalizeHivelocityInventory(raw);
            dedicatedPlansCache.set(cacheKey, { atMs: now, inventory });
        }
        const all = Object.values(inventory).flat();
        let rows = all.filter((p) => p.is_vps === true);
        if (facilityCode)
            rows = rows.filter((p) => p.data_center === facilityCode);
        if (search.length > 0) {
            rows = rows.filter((p) => {
                const hay = [
                    p.product_name,
                    p.product_cpu,
                    p.product_memory,
                    p.product_drive,
                    p.product_bandwidth,
                    String(p.product_id),
                    p.data_center,
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();
                return hay.includes(search);
            });
        }
        const stockRank = (s) => (s === "available" ? 0 : s === "limited" ? 1 : 2);
        rows.sort((a, b) => {
            const sr = stockRank(a.stock) - stockRank(b.stock);
            if (sr !== 0)
                return sr;
            const ap = a.product_monthly_price ?? Number.POSITIVE_INFINITY;
            const bp = b.product_monthly_price ?? Number.POSITIVE_INFINITY;
            if (ap !== bp)
                return ap - bp;
            if (a.product_id !== b.product_id)
                return a.product_id - b.product_id;
            return a.location_option_id - b.location_option_id;
        });
        const total = rows.length;
        const items = rows.slice(cursor, cursor + limit);
        const nextCursor = cursor + limit < total ? cursor + limit : null;
        return { success: true, data: { items, total, nextCursor } };
    }),
    /**
     * Private: VDS plans (paginated).
     */
    getVdsPlans: protectedProcedure.input(VdsPlansQuerySchema).query(async ({ input }) => {
        const limit = input?.limit ?? 24;
        const cursor = input?.cursor ?? 0;
        const facilityCode = input?.facility_code?.trim() || undefined;
        const search = input?.search?.trim().toLowerCase() || "";
        const cacheKey = buildCacheKey(input);
        const now = Date.now();
        const TTL_MS = 60_000;
        const cached = dedicatedPlansCache.get(cacheKey);
        let inventory;
        if (cached && now - cached.atMs < TTL_MS) {
            inventory = cached.inventory;
        }
        else {
            const raw = await hivelocityRequest("/inventory/product", {
                query: {
                    location: input?.location,
                    include_custom: input?.include_custom,
                    bonding_support: input?.bonding_support,
                    group_by: "facility",
                },
                requireApiKey: true,
            });
            inventory = normalizeHivelocityInventory(raw);
            dedicatedPlansCache.set(cacheKey, { atMs: now, inventory });
        }
        const all = Object.values(inventory).flat();
        let rows = all.filter((p) => p.is_vds === true);
        if (facilityCode)
            rows = rows.filter((p) => p.data_center === facilityCode);
        if (search.length > 0) {
            rows = rows.filter((p) => {
                const hay = [
                    p.product_name,
                    p.product_cpu,
                    p.product_memory,
                    p.product_drive,
                    p.product_bandwidth,
                    String(p.product_id),
                    p.data_center,
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();
                return hay.includes(search);
            });
        }
        const stockRank = (s) => (s === "available" ? 0 : s === "limited" ? 1 : 2);
        rows.sort((a, b) => {
            const sr = stockRank(a.stock) - stockRank(b.stock);
            if (sr !== 0)
                return sr;
            const ap = a.product_monthly_price ?? Number.POSITIVE_INFINITY;
            const bp = b.product_monthly_price ?? Number.POSITIVE_INFINITY;
            if (ap !== bp)
                return ap - bp;
            if (a.product_id !== b.product_id)
                return a.product_id - b.product_id;
            return a.location_option_id - b.location_option_id;
        });
        const total = rows.length;
        const items = rows.slice(cursor, cursor + limit);
        const nextCursor = cursor + limit < total ? cursor + limit : null;
        return { success: true, data: { items, total, nextCursor } };
    }),
    /**
     * Private: Get product by productId.
     * Docs: GET /inventory/product/{productId}
     */
    getProduct: protectedProcedure
        .input(z.object({
        productId: z.number().int().positive(),
    }))
        .query(async ({ input }) => {
        const raw = await hivelocityRequest(`/inventory/product/${input.productId}`, {
            requireApiKey: true,
        });
        const data = hivelocityProductByIdResponseSchema.parse(raw);
        return { success: true, data };
    }),
});
