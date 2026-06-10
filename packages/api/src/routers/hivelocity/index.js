import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router } from "../../trpc";
import { hivelocityProcedure } from "./procedures";
import { isHivelocityDevelopmentMode } from "../../lib/hivelocity-errors";
import { getHivelocityEnvStatus, hivelocityRequest, hivelocityRequestTimed, } from "../../lib/hivelocity-client";
import { assertUserCanReadTeamCloud, buildHivelocitySubscriptionServiceLabel, collectHivelocityDeviceIdsForTeam, collectTeamHivelocitySubscriptionContext, getTeamIdBySlugForHivelocity, isAgencyUserRole, maybeAssertTeamHivelocityDeviceAccess, redactSuspendedHivelocityResourceForCustomer, teamHivelocityAccessSchema, } from "./team-hivelocity-access";
import { getRedisClient } from "../../lib/redis";
import { getCachedHivelocityFacilities, getCachedHivelocityInventory } from "../../lib/hivelocity-inventory-cache";
import { normalizeVpsPasswordResetRequestResult } from "../../lib/hivelocity-vps-password-reset";
import { assertValidSshPublicKey, createHivelocitySshKey, deleteHivelocitySshKey, listHivelocitySshKeys, updateVpsDeployedSshKeys, } from "../../lib/hivelocity-vps-ssh-keys";
import { resolveCustomerVpsRecurringCharge } from "../../lib/hivelocity-customer-recurring-charge";
import { reactivateHivelocityVpsInstance, suspendHivelocityVpsInstance, } from "../../lib/hivelocity-vps-instance-suspend";
import { normalizeHivelocityInventory, hivelocityProductByIdResponseSchema, hivelocityDeviceDumpSchema, hivelocityVpsSchema, hivelocityVpsSnapshotScheduleCreateSchema, hivelocityVpsVolumeCreateSchema, } from "../../types/hivelocity";
const HivelocityPeriodSchema = z.enum([
    "hourly",
    "monthly",
    "quarterly",
    "semi-annually",
    "annually",
    "biennial",
    "triennial",
]);
const VPS_POWER_ACTION_KEY = (deviceId) => `vps:power-action:${deviceId}`;
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
function matchesPlanKind(product, kind) {
    if (kind === "vps")
        return product.is_vps === true;
    if (kind === "vds")
        return product.is_vds === true;
    return product.is_vps === false && product.is_vds === false;
}
function paginateHivelocityPlans(inventory, kind, opts) {
    const facilityCode = opts.facilityCode?.trim() || undefined;
    const search = opts.search?.trim().toLowerCase() || "";
    const all = Object.values(inventory).flat();
    let rows = all.filter((p) => matchesPlanKind(p, kind));
    if (facilityCode) {
        rows = rows.filter((p) => p.data_center === facilityCode);
    }
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
    const items = rows.slice(opts.cursor, opts.cursor + opts.limit);
    const nextCursor = opts.cursor + opts.limit < total ? opts.cursor + opts.limit : null;
    return { items, total, nextCursor };
}
/** Merged /device + /vps account resources (before list filters). */
async function fetchMergedHivelocityResources() {
    const parallelStart = Date.now();
    const [deviceResult, vpsResult] = await Promise.all([
        hivelocityRequestTimed("/device/", { requireApiKey: true }),
        hivelocityRequestTimed("/vps/", { requireApiKey: true }),
    ]);
    const parallelMs = Date.now() - parallelStart;
    const rawDevices = deviceResult.data;
    const rawVps = vpsResult.data;
    const mergeStart = Date.now();
    const deviceArray = Array.isArray(rawDevices) ? rawDevices : [];
    const deviceResources = deviceArray
        .map((item) => hivelocityDeviceDumpSchema.safeParse(item))
        .filter((r) => r.success)
        .map((r) => {
        const device = r.data;
        const typeStr = (device.deviceType ?? "").toUpperCase();
        const groupStr = (device.deviceTypeGroup ?? "").toUpperCase();
        let resourceType = "dedicated";
        if (typeStr.includes("VPS") || groupStr.includes("VPS")) {
            resourceType = "vps";
        }
        else if (typeStr.includes("VDS") || device.tags.some((t) => t.toUpperCase() === "VDS")) {
            resourceType = "vds";
        }
        return {
            ...device,
            resourceType,
        };
    });
    const vpsArray = Array.isArray(rawVps) ? rawVps : [];
    const vpsMap = new Map();
    vpsArray.forEach((v) => {
        const parsed = hivelocityVpsSchema.safeParse(v);
        if (parsed.success) {
            const deviceId = parsed.data.deviceId || parsed.data.id;
            if (deviceId)
                vpsMap.set(Number(deviceId), parsed.data);
        }
    });
    const mergedResources = [];
    const seenDeviceIds = new Set();
    deviceResources.forEach((dev) => {
        const deviceId = dev.deviceId;
        if (deviceId)
            seenDeviceIds.add(deviceId);
        if (dev.resourceType === "vps" && deviceId && vpsMap.has(deviceId)) {
            const vpsData = vpsMap.get(deviceId);
            mergedResources.push({
                ...vpsData,
                ...dev,
                resourceType: "vps",
            });
        }
        else {
            mergedResources.push(dev);
        }
    });
    vpsMap.forEach((vps, deviceId) => {
        if (!seenDeviceIds.has(deviceId)) {
            mergedResources.push({ ...vps, resourceType: "vps" });
        }
    });
    const mergeMs = Date.now() - mergeStart;
    return {
        resources: mergedResources,
        timing: {
            hivelocity: {
                device: deviceResult.timing,
                vps: vpsResult.timing,
                parallelMs,
            },
            mergeMs,
            counts: {
                deviceRows: deviceArray.length,
                vpsRows: vpsArray.length,
                merged: mergedResources.length,
            },
        },
    };
}
function resourceRowDeviceId(r) {
    const id = Number(r.deviceId ?? r.id);
    return Number.isFinite(id) && id > 0 ? id : null;
}
function applyHivelocityResourceListFilters(mergedResources, typeFilter, search, facilityCode) {
    let all = mergedResources;
    if (typeFilter !== "all") {
        all = all.filter((r) => r.resourceType === typeFilter);
    }
    if (facilityCode) {
        all = all.filter((r) => {
            if (r.resourceType === "vps" && !("location" in r)) {
                return (r.facilityCode ?? "").toLowerCase() === facilityCode.toLowerCase();
            }
            const loc = r.location;
            const code = loc?.facility || loc?.facilityCode || loc?.code || r.facilityCode || "";
            const title = loc?.facility_title || loc?.city || "";
            return (code.toLowerCase() === facilityCode.toLowerCase() ||
                title.toLowerCase().includes(facilityCode.toLowerCase()));
        });
    }
    if (search.length > 0) {
        all = all.filter((r) => {
            const common = [r.hostname, r.primaryIp ?? "", r.resourceType];
            if (r.resourceType === "vps" && !("location" in r)) {
                common.push(r.osName ?? "");
                common.push(r.facilityCode ?? "");
                common.push(r.id);
            }
            else {
                const d = r;
                const loc = d.location;
                common.push(d.name);
                common.push(d.deviceType ?? "");
                common.push(loc?.facility || loc?.facilityCode || loc?.code || "");
                common.push(loc?.facility_title || loc?.city || "");
                common.push(String(d.deviceId || ""));
                common.push(...(d.tags ?? []));
            }
            return common
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
                .includes(search);
        });
    }
    return all;
}
function paginateHivelocityResourceList(all, limit, cursor) {
    const total = all.length;
    const items = all.slice(cursor, cursor + limit);
    const nextCursor = cursor + limit < total ? cursor + limit : null;
    const counts = {
        dedicated: all.filter((r) => r.resourceType === "dedicated").length,
        vds: all.filter((r) => r.resourceType === "vds").length,
        vps: all.filter((r) => r.resourceType === "vps").length,
        total,
    };
    return { items, total, nextCursor, counts };
}
export const hivelocityRouter = router({
    /**
     * Private: quick integration check.
     */
    healthCheck: hivelocityProcedure.query(() => {
        const env = getHivelocityEnvStatus();
        if (isHivelocityDevelopmentMode()) {
            return { status: "OK", ...env };
        }
        return {
            status: "OK",
            configured: env.hasApiKey && env.hasBillingInfoId,
        };
    }),
    /**
     * Private: Get all facilities (inventory locations).
     * Docs: GET /inventory/locations (this endpoint is public per Hivelocity docs).
     */
    getFacilities: hivelocityProcedure
        .input(z
        .object({
        vpsLocations: z.string().optional(),
    })
        .optional())
        .query(async ({ input }) => {
        const data = await getCachedHivelocityFacilities(input?.vpsLocations);
        return { success: true, data };
    }),
    /**
     * Public (TEMP for development): Get product operating systems.
     * Docs: GET /product/{productId}/operating-systems
     *
     * NOTE: This is intentionally `hivelocityProcedure` so you can test and inspect the live response shape
     * while we finalize types. Switch to `hivelocityProcedure` before shipping.
     */
    getProductOperatingSystems: hivelocityProcedure
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
     * NOTE: This is intentionally `hivelocityProcedure` so you can test and inspect the live response shape
     * while we finalize types. Switch to `hivelocityProcedure` before shipping.
     */
    getProductOptions: hivelocityProcedure
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
    provisionComputeDevice: hivelocityProcedure
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
    provisionBareMetalDevice: hivelocityProcedure
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
    getOrderById: hivelocityProcedure
        .input(z.object({ orderId: z.number().int().positive() }))
        .query(async ({ input }) => {
        const raw = await hivelocityRequest(`/order/${input.orderId}`, { requireApiKey: true });
        return { success: true, data: raw };
    }),
    /**
     * Public (TEMP for development): Get compute device by id.
     * Docs: GET /compute/{deviceId}
     */
    getComputeDeviceById: hivelocityProcedure
        .input(z.object({ deviceId: z.number().int().positive() }).and(teamHivelocityAccessSchema))
        .query(async ({ ctx, input }) => {
        await maybeAssertTeamHivelocityDeviceAccess({ ctx, input });
        const raw = await hivelocityRequest(`/compute/${input.deviceId}`, { requireApiKey: true });
        return { success: true, data: raw };
    }),
    /**
     * Public (TEMP for development): Get all compute devices.
     * Docs: GET /compute/
     */
    getComputeDevices: hivelocityProcedure.query(async () => {
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
    getDevices: hivelocityProcedure
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
     * Public (TEMP for development): Get device IP assignments.
     * Docs: GET /device/{deviceId}/ips
     */
    getDeviceIps: hivelocityProcedure
        .input(z.object({ deviceId: z.number().int().positive() }).and(teamHivelocityAccessSchema))
        .query(async ({ ctx, input }) => {
        await maybeAssertTeamHivelocityDeviceAccess({ ctx, input });
        const raw = await hivelocityRequest(`/device/${input.deviceId}/ips`, { requireApiKey: true });
        return { success: true, data: raw };
    }),
    /**
     * Public (TEMP for development): Get all device services.
     * Docs: GET /device/{deviceId}/services
     */
    getDeviceServices: hivelocityProcedure
        .input(z
        .object({
        deviceId: z.number().int().positive(),
        group_by: z.string().default("flat").optional(),
        type_code: z.string().default("all").optional(),
    })
        .and(teamHivelocityAccessSchema))
        .query(async ({ ctx, input }) => {
        await maybeAssertTeamHivelocityDeviceAccess({ ctx, input });
        const raw = await hivelocityRequest(`/device/${input.deviceId}/services`, {
            query: {
                group_by: input.group_by,
                type_code: input.type_code,
            },
            requireApiKey: true,
        });
        return { success: true, data: raw };
    }),
    /**
     * Public (TEMP for development): Get available upgrade options for a VPS product.
     * Docs: GET /vps/{deviceId}/available-product-upgrades
     */
    getVpsUpgrades: hivelocityProcedure
        .input(z.object({ deviceId: z.number().int().positive() }).and(teamHivelocityAccessSchema))
        .query(async ({ ctx, input }) => {
        await maybeAssertTeamHivelocityDeviceAccess({ ctx, input });
        const raw = await hivelocityRequest(`/vps/${input.deviceId}/available-product-upgrades`, {
            requireApiKey: true,
        });
        return { success: true, data: raw };
    }),
    /**
     * Private: Get all products.
     * Docs: GET /inventory/product
     */
    getProducts: hivelocityProcedure.input(ProductsQuerySchema).query(async ({ input }) => {
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
    getDedicatedServerPlans: hivelocityProcedure.input(DedicatedPlansQuerySchema).query(async ({ input }) => {
        const limit = input?.limit ?? 24;
        const cursor = input?.cursor ?? 0;
        const inventory = await getCachedHivelocityInventory({
            location: input?.location,
            include_custom: input?.include_custom,
            bonding_support: input?.bonding_support,
        });
        const data = paginateHivelocityPlans(inventory, "dedicated", {
            facilityCode: input?.facility_code,
            search: input?.search,
            limit,
            cursor,
        });
        return { success: true, data };
    }),
    /**
     * Private: VPS plans (paginated).
     */
    getVpsPlans: hivelocityProcedure.input(VpsPlansQuerySchema).query(async ({ input }) => {
        const limit = input?.limit ?? 24;
        const cursor = input?.cursor ?? 0;
        const inventory = await getCachedHivelocityInventory({
            location: input?.location,
            include_custom: input?.include_custom,
            bonding_support: input?.bonding_support,
        });
        const data = paginateHivelocityPlans(inventory, "vps", {
            facilityCode: input?.facility_code,
            search: input?.search,
            limit,
            cursor,
        });
        return { success: true, data };
    }),
    /**
     * Private: VDS plans (paginated).
     */
    getVdsPlans: hivelocityProcedure.input(VdsPlansQuerySchema).query(async ({ input }) => {
        const limit = input?.limit ?? 24;
        const cursor = input?.cursor ?? 0;
        const inventory = await getCachedHivelocityInventory({
            location: input?.location,
            include_custom: input?.include_custom,
            bonding_support: input?.bonding_support,
        });
        const data = paginateHivelocityPlans(inventory, "vds", {
            facilityCode: input?.facility_code,
            search: input?.search,
            limit,
            cursor,
        });
        return { success: true, data };
    }),
    /**
     * Private: Get product by productId.
     * Docs: GET /inventory/product/{productId}
     */
    getProduct: hivelocityProcedure
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
    // ---------------------------------------------------------------------------
    // Account Resource Procedures
    // These call the *account-scoped* APIs to list devices already provisioned
    // in the authenticated Hivelocity account (not the public inventory catalogue).
    // ---------------------------------------------------------------------------
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
    getMyDevices: hivelocityProcedure
        .input(z.object({
        search: z.string().trim().optional(),
        facilityCode: z.string().trim().optional(),
        powerStatus: z.enum(["on", "off", "all"]).default("all").optional(),
        limit: z.number().int().min(1).max(200).default(50).optional(),
        cursor: z.number().int().min(0).default(0).optional(),
    }).optional())
        .query(async ({ input }) => {
        const limit = input?.limit ?? 50;
        const cursor = input?.cursor ?? 0;
        const search = input?.search?.toLowerCase() ?? "";
        const facilityCode = input?.facilityCode?.trim() ?? "";
        const powerStatusFilter = input?.powerStatus ?? "all";
        const raw = await hivelocityRequest("/device/", { requireApiKey: true });
        // Parse row-by-row so one bad record never kills the whole list.
        const rawArray = Array.isArray(raw) ? raw : [];
        let devices = rawArray
            .map((item) => hivelocityDeviceDumpSchema.safeParse(item))
            .filter((r) => r.success)
            .map((r) => r.data);
        // Facility filter (location is now an object, extract titles/codes)
        if (facilityCode) {
            devices = devices.filter((d) => {
                const loc = d.location;
                const code = loc?.facility || loc?.facilityCode || loc?.code || "";
                const title = loc?.facility_title || loc?.city || "";
                return (code.toLowerCase() === facilityCode.toLowerCase() ||
                    title.toLowerCase().includes(facilityCode.toLowerCase()));
            });
        }
        // Power status filter (powerStatus is now an object)
        if (powerStatusFilter !== "all") {
            devices = devices.filter((d) => {
                const ps = d.powerStatus?.status || d.powerStatus;
                return String(ps || "unknown").toLowerCase() === powerStatusFilter;
            });
        }
        // Search filter - match against updated field names (name, deviceType)
        if (search.length > 0) {
            devices = devices.filter((d) => {
                const loc = d.location;
                const haystack = [
                    d.hostname,
                    d.primaryIp,
                    d.name,
                    d.deviceType ?? "",
                    loc?.facility || loc?.facilityCode || loc?.code || "",
                    loc?.facility_title || loc?.city || "",
                    String(d.deviceId || ""),
                    ...(d.tags ?? []),
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();
                return haystack.includes(search);
            });
        }
        const total = devices.length;
        const items = devices.slice(cursor, cursor + limit);
        const nextCursor = cursor + limit < total ? cursor + limit : null;
        return { success: true, data: { items, total, nextCursor } };
    }),
    /**
     * Get all VPS instances in the account (paginated + filtered).
     *
     * Docs: GET /vps/
     * Schema: VPS
     *
     * Note: This is a completely separate endpoint from /device/ with its own
     * schema - VPS instances are NOT returned by /device/.
     *
     * Supports:
     * - Free-text search (hostname, primaryIp, osName, id)
     * - Facility filter (facilityCode)
     * - Cursor-based pagination
     */
    getMyVpsInstances: hivelocityProcedure
        .input(z.object({
        search: z.string().trim().optional(),
        facilityCode: z.string().trim().optional(),
        limit: z.number().int().min(1).max(200).default(50).optional(),
        cursor: z.number().int().min(0).default(0).optional(),
    }).optional())
        .query(async ({ input }) => {
        const limit = input?.limit ?? 50;
        const cursor = input?.cursor ?? 0;
        const search = input?.search?.toLowerCase() ?? "";
        const facilityCode = input?.facilityCode?.trim() ?? "";
        const raw = await hivelocityRequest("/vps/", { requireApiKey: true });
        const rawArray = Array.isArray(raw) ? raw : [];
        let instances = rawArray
            .map((item) => hivelocityVpsSchema.safeParse(item))
            .filter((r) => r.success)
            .map((r) => r.data);
        // Facility filter
        if (facilityCode) {
            instances = instances.filter((v) => v.facilityCode?.toLowerCase() === facilityCode.toLowerCase());
        }
        // Search filter
        if (search.length > 0) {
            instances = instances.filter((v) => {
                const haystack = [
                    v.hostname,
                    v.primaryIp ?? "",
                    v.osName ?? "",
                    v.facilityCode ?? "",
                    v.id,
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();
                return haystack.includes(search);
            });
        }
        const total = instances.length;
        const items = instances.slice(cursor, cursor + limit);
        const nextCursor = cursor + limit < total ? cursor + limit : null;
        return { success: true, data: { items, total, nextCursor } };
    }),
    /**
     * Get ALL account resources in a single unified call (dedicated + VPS + VDS).
     *
     * Implementation:
     * - Fetches /device/ and /vps/ in parallel (Promise.all).
     * - Enriches each record with a `resourceType` discriminant:
     *   - "vps"  → came from /vps/
     *   - "vds"  → came from /device/ AND productName contains "VDS" (case-insensitive)
     *   - "dedicated" → all other /device/ records
     *
     * Supports:
     * - type: "dedicated" | "vps" | "vds" | "all"
     * - Free-text search
     * - Facility filter
     * - Cursor-based pagination over the merged + sorted result
     */
    getMyAllResources: hivelocityProcedure
        .input(z.object({
        type: z.enum(["dedicated", "vps", "vds", "all"]).default("all").optional(),
        search: z.string().trim().optional(),
        facilityCode: z.string().trim().optional(),
        limit: z.number().int().min(1).max(200).default(50).optional(),
        cursor: z.number().int().min(0).default(0).optional(),
    }).optional())
        .query(async ({ input }) => {
        const totalStart = Date.now();
        const limit = input?.limit ?? 50;
        const cursor = input?.cursor ?? 0;
        const search = input?.search?.toLowerCase() ?? "";
        const facilityCode = input?.facilityCode?.trim() ?? "";
        const typeFilter = input?.type ?? "all";
        const { resources: mergedResources, timing: fetchTiming } = await fetchMergedHivelocityResources();
        const filterStart = Date.now();
        const all = applyHivelocityResourceListFilters(mergedResources, typeFilter, search, facilityCode);
        const filterMs = Date.now() - filterStart;
        const paginateStart = Date.now();
        const { items, total, nextCursor, counts } = paginateHivelocityResourceList(all, limit, cursor);
        const paginateMs = Date.now() - paginateStart;
        const totalMs = Date.now() - totalStart;
        console.info(`[hivelocity:getMyAllResources] type=${typeFilter} total=${totalMs}ms ` +
            `deviceApi=${fetchTiming.hivelocity.device.durationMs}ms ` +
            `vpsApi=${fetchTiming.hivelocity.vps.durationMs}ms ` +
            `merge=${fetchTiming.mergeMs}ms filter=${filterMs}ms paginate=${paginateMs}ms ` +
            `counts device=${fetchTiming.counts.deviceRows} vps=${fetchTiming.counts.vpsRows} merged=${fetchTiming.counts.merged} filtered=${all.length}`);
        return {
            success: true,
            data: { items, total, nextCursor, counts },
            ...(isHivelocityDevelopmentMode()
                ? {
                    timing: {
                        ...fetchTiming,
                        filterMs,
                        paginateMs,
                        totalMs,
                        filteredCount: all.length,
                        returnedCount: items.length,
                        typeFilter,
                    },
                }
                : {}),
        };
    }),
    /**
     * Team-scoped server list: only Hivelocity devices linked to the team's NiscClientSubscription
     * (serviceRefs.hivelocityDeviceId) for products named VPS hosting, VDS hosting, or Dedicated servers hosting (case-insensitive).
     */
    getTeamMyResources: hivelocityProcedure
        .input(z.object({
        teamSlug: z.string().min(1),
        type: z.enum(["dedicated", "vps", "vds"]),
        search: z.string().trim().optional(),
        facilityCode: z.string().trim().optional(),
        limit: z.number().int().min(1).max(200).default(50).optional(),
        cursor: z.number().int().min(0).default(0).optional(),
    }))
        .query(async ({ ctx, input }) => {
        const totalStart = Date.now();
        const session = ctx.session;
        if (!session?.user?.id) {
            throw new TRPCError({ code: "UNAUTHORIZED", message: "You must be logged in" });
        }
        const limit = input.limit ?? 50;
        const cursor = input.cursor ?? 0;
        const search = input.search?.toLowerCase() ?? "";
        const facilityCode = input.facilityCode?.trim() ?? "";
        const teamLookupStart = Date.now();
        const teamId = await getTeamIdBySlugForHivelocity(input.teamSlug);
        const teamLookupMs = Date.now() - teamLookupStart;
        if (!teamId) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Team not found" });
        }
        const accessStart = Date.now();
        await assertUserCanReadTeamCloud(teamId, session.user.id, session.user.role);
        const accessCheckMs = Date.now() - accessStart;
        const subscriptionLookupStart = Date.now();
        const allowed = await collectHivelocityDeviceIdsForTeam(teamId, input.type);
        const subscriptionLookupMs = Date.now() - subscriptionLookupStart;
        const { resources: merged, timing: fetchTiming } = await fetchMergedHivelocityResources();
        const scopeStart = Date.now();
        const scoped = merged.filter((r) => {
            const id = resourceRowDeviceId(r);
            return id != null && allowed.has(id) && r.resourceType === input.type;
        });
        const scopeMs = Date.now() - scopeStart;
        const filterStart = Date.now();
        const all = applyHivelocityResourceListFilters(scoped, input.type, search, facilityCode);
        const filterMs = Date.now() - filterStart;
        const paginateStart = Date.now();
        let { items, total, nextCursor, counts } = paginateHivelocityResourceList(all, limit, cursor);
        const paginateMs = Date.now() - paginateStart;
        if (!isAgencyUserRole(session.user.role)) {
            const subscriptionContext = await collectTeamHivelocitySubscriptionContext(teamId, input.type);
            items = await Promise.all(items.map(async (item) => {
                const deviceId = resourceRowDeviceId(item);
                if (deviceId == null)
                    return item;
                const sub = subscriptionContext.get(deviceId);
                if (sub?.status !== "SUSPENDED")
                    return item;
                const redacted = redactSuspendedHivelocityResourceForCustomer(deviceId, input.type, sub);
                if (input.type !== "vps")
                    return redacted;
                const recurring = await resolveCustomerVpsRecurringCharge({
                    deviceId,
                    agreedPrice: sub.agreedPrice,
                    agreedCurrency: sub.agreedCurrency,
                    billingCycle: sub.billingCycle,
                });
                return {
                    ...redacted,
                    reactivationAmount: recurring.amount,
                    reactivationCurrency: recurring.currency,
                    billingCycle: recurring.billingCycle ?? sub.billingCycle,
                };
            }));
        }
        const totalMs = Date.now() - totalStart;
        console.info(`[hivelocity:getTeamMyResources] type=${input.type} total=${totalMs}ms ` +
            `teamLookup=${teamLookupMs}ms access=${accessCheckMs}ms subscriptions=${subscriptionLookupMs}ms ` +
            `deviceApi=${fetchTiming.hivelocity.device.durationMs}ms vpsApi=${fetchTiming.hivelocity.vps.durationMs}ms ` +
            `scope=${scopeMs}ms filter=${filterMs}ms paginate=${paginateMs}ms allowed=${allowed.size} filtered=${all.length}`);
        return {
            success: true,
            data: { items, total, nextCursor, counts },
            ...(isHivelocityDevelopmentMode()
                ? {
                    timing: {
                        ...fetchTiming,
                        db: { teamLookupMs, accessCheckMs, subscriptionLookupMs },
                        scopeMs,
                        filterMs,
                        paginateMs,
                        totalMs,
                        allowedDeviceCount: allowed.size,
                        filteredCount: all.length,
                        returnedCount: items.length,
                        typeFilter: input.type,
                    },
                }
                : {}),
        };
    }),
    /**
     * Customer: payment context for a suspended VPS - no upstream device details.
     */
    getCustomerSuspendedVpsContext: hivelocityProcedure
        .input(z.object({
        deviceId: z.number().int().positive(),
        teamSlug: z.string().min(1),
        teamResourceCategory: z.enum(["vps", "vds", "dedicated"]),
    }))
        .query(async ({ ctx, input }) => {
        const session = ctx.session;
        if (!session?.user?.id) {
            throw new TRPCError({ code: "UNAUTHORIZED", message: "You must be logged in" });
        }
        if (isAgencyUserRole(session.user.role)) {
            return { suspended: false };
        }
        const teamId = await getTeamIdBySlugForHivelocity(input.teamSlug);
        if (!teamId) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Team not found" });
        }
        await assertUserCanReadTeamCloud(teamId, session.user.id, session.user.role);
        const allowed = await collectHivelocityDeviceIdsForTeam(teamId, input.teamResourceCategory);
        if (!allowed.has(input.deviceId)) {
            throw new TRPCError({ code: "FORBIDDEN", message: "You do not have access to this server" });
        }
        const subscriptionContext = await collectTeamHivelocitySubscriptionContext(teamId, input.teamResourceCategory);
        const sub = subscriptionContext.get(input.deviceId);
        if (!sub || sub.status !== "SUSPENDED") {
            return { suspended: false };
        }
        const recurring = await resolveCustomerVpsRecurringCharge({
            deviceId: input.deviceId,
            agreedPrice: sub.agreedPrice,
            agreedCurrency: sub.agreedCurrency,
            billingCycle: sub.billingCycle,
        });
        return {
            suspended: true,
            subscriptionId: sub.subscriptionId,
            serviceLabel: buildHivelocitySubscriptionServiceLabel(sub),
            amount: recurring.amount,
            currency: recurring.currency,
            billingCycle: recurring.billingCycle,
            productId: sub.productId,
        };
    }),
    /**
     * Private: Get device details (standard /device/{id}).
     */
    getDeviceDetails: hivelocityProcedure
        .input(z.object({ deviceId: z.number().int() }).and(teamHivelocityAccessSchema))
        .query(async ({ ctx, input }) => {
        await maybeAssertTeamHivelocityDeviceAccess({ ctx, input });
        try {
            const raw = await hivelocityRequest(`/device/${input.deviceId}`, { requireApiKey: true });
            const parsed = hivelocityDeviceDumpSchema.safeParse(raw);
            if (!parsed.success) {
                console.error("Hivelocity device schema mismatch:", parsed.error);
                // Return raw data as fallback if schema fails but we have an object
                return { success: true, data: (raw && typeof raw === 'object') ? raw : null };
            }
            return { success: true, data: parsed.data };
        }
        catch (err) {
            console.error("Hivelocity getDeviceDetails error:", err);
            return { success: true, data: null };
        }
    }),
    /**
     * Private: Get VPS-specific details (/vps/{id}).
     */
    getVpsDetails: hivelocityProcedure
        .input(z.object({ deviceId: z.number().int() }).and(teamHivelocityAccessSchema))
        .query(async ({ ctx, input }) => {
        await maybeAssertTeamHivelocityDeviceAccess({ ctx, input });
        try {
            const raw = await hivelocityRequest(`/vps/${input.deviceId}`, { requireApiKey: true });
            const parsed = hivelocityVpsSchema.safeParse(raw);
            if (!parsed.success) {
                console.error("Hivelocity VPS schema mismatch:", parsed.error);
                return { success: true, data: (raw && typeof raw === 'object') ? raw : null };
            }
            return { success: true, data: parsed.data };
        }
        catch (err) {
            // VPS endpoint often 404s for non-Cloud devices that are still tagged as VPS
            return { success: true, data: null };
        }
    }),
    /**
     * Private: Get VPS event log.
     */
    getVpsEvents: hivelocityProcedure
        .input(z.object({ deviceId: z.number().int() }).and(teamHivelocityAccessSchema))
        .query(async ({ ctx, input }) => {
        await maybeAssertTeamHivelocityDeviceAccess({ ctx, input });
        const raw = await hivelocityRequest(`/vps/${input.deviceId}/events`, { requireApiKey: true });
        return { success: true, data: raw };
    }),
    /**
     * Private: Get VPS metrics charts (Base64).
     */
    getVpsMetrics: hivelocityProcedure
        .input(z
        .object({
        deviceId: z.number().int(),
        metricType: z.enum(["CPU_USAGE", "MEMORY_USAGE", "DISK_RW", "NETWORK_USAGE"]),
        startTime: z.number().int().optional(),
        endTime: z.number().int().optional(),
        imageWidth: z.number().int().optional(),
        imageHeight: z.number().int().optional(),
    })
        .and(teamHivelocityAccessSchema))
        .query(async ({ ctx, input }) => {
        await maybeAssertTeamHivelocityDeviceAccess({ ctx, input });
        const { deviceId, teamSlug: _ts, teamResourceCategory: _trc, ...query } = input;
        const raw = await hivelocityRequest(`/vps/${deviceId}/metrics`, {
            query,
            requireApiKey: true,
        });
        return { success: true, data: raw };
    }),
    /**
     * Private: Get VPS volumes.
     */
    getVpsVolumes: hivelocityProcedure
        .input(z.object({ deviceId: z.number().int() }).and(teamHivelocityAccessSchema))
        .query(async ({ ctx, input }) => {
        await maybeAssertTeamHivelocityDeviceAccess({ ctx, input });
        const raw = await hivelocityRequest("/vps/volume", {
            query: { deviceId: input.deviceId },
            requireApiKey: true,
        });
        return { success: true, data: raw };
    }),
    devicePowerAction: hivelocityProcedure
        .input(z
        .object({
        deviceId: z.number().int(),
        action: z.enum(["on", "off", "reboot", "boot", "shutdown"]),
    })
        .and(teamHivelocityAccessSchema))
        .mutation(async ({ ctx, input }) => {
        await maybeAssertTeamHivelocityDeviceAccess({ ctx, input });
        // Map on/off to boot/shutdown if needed, or just pass as is if API supports both.
        // The OpenAPI says boot/reboot/shutdown.
        let apiAction = input.action;
        if (apiAction === "on")
            apiAction = "boot";
        if (apiAction === "off")
            apiAction = "shutdown";
        const raw = await hivelocityRequest(`/device/${input.deviceId}/power`, {
            method: "POST",
            query: { action: apiAction },
            requireApiKey: true,
        });
        // If successful, store pending state in Redis
        if (raw && (raw.success !== false)) {
            const redis = getRedisClient();
            if (redis) {
                let targetStatus = "ON";
                if (apiAction === "shutdown" || apiAction === "off")
                    targetStatus = "OFF";
                await redis.setex(VPS_POWER_ACTION_KEY(input.deviceId), 600, // 10 minutes TTL
                JSON.stringify({
                    targetStatus,
                    action: input.action,
                    timestamp: Date.now()
                })).catch(e => console.error("Redis set pending action error:", e));
            }
        }
        return { success: true, data: raw };
    }),
    /**
     * Private: Get device power status (ON/OFF).
     */
    getDevicePowerStatus: hivelocityProcedure
        .input(z.object({ deviceId: z.number().int() }).and(teamHivelocityAccessSchema))
        .query(async ({ ctx, input }) => {
        await maybeAssertTeamHivelocityDeviceAccess({ ctx, input });
        const raw = await hivelocityRequest(`/device/${input.deviceId}/power`, { requireApiKey: true });
        // Check Redis for pending action
        const redis = getRedisClient();
        let pendingAction = null;
        if (redis) {
            const key = VPS_POWER_ACTION_KEY(input.deviceId);
            const cached = await redis.get(key).catch(() => null);
            if (cached) {
                try {
                    const data = typeof cached === 'string' ? JSON.parse(cached) : cached;
                    const rawStatus = raw?.powerStatus || raw?.status || (typeof raw === 'string' ? raw : null);
                    const currentStatus = typeof rawStatus === 'object' ? rawStatus.status : rawStatus;
                    if (currentStatus === data.targetStatus) {
                        // Status reconciled, clear Redis
                        await redis.del(key).catch(() => null);
                    }
                    else {
                        pendingAction = data;
                    }
                }
                catch (e) {
                    console.error("Error parsing pending action:", e);
                }
            }
        }
        return { success: true, data: { ...raw, pendingAction } };
    }),
    /**
     * Private: Get device switch ports and IP assignments.
     */
    getDevicePorts: hivelocityProcedure
        .input(z.object({ deviceId: z.number().int() }).and(teamHivelocityAccessSchema))
        .query(async ({ ctx, input }) => {
        await maybeAssertTeamHivelocityDeviceAccess({ ctx, input });
        const raw = await hivelocityRequest(`/device/${input.deviceId}/ports`, { requireApiKey: true });
        return { success: true, data: raw };
    }),
    /**
     * Private: Get initial SSH credentials (user, password, port).
     */
    getDeviceInitialCreds: hivelocityProcedure
        .input(z.object({ deviceId: z.number().int() }).and(teamHivelocityAccessSchema))
        .query(async ({ ctx, input }) => {
        await maybeAssertTeamHivelocityDeviceAccess({ ctx, input });
        const raw = await hivelocityRequest(`/device/${input.deviceId}/initial-creds`, { requireApiKey: true });
        return { success: true, data: raw };
    }),
    /**
     * Private: Get initial SSH password.
     */
    getDeviceInitialPassword: hivelocityProcedure
        .input(z.object({ deviceId: z.number().int() }).and(teamHivelocityAccessSchema))
        .query(async ({ ctx, input }) => {
        await maybeAssertTeamHivelocityDeviceAccess({ ctx, input });
        const raw = await hivelocityRequest(`/device/${input.deviceId}/initial-password`, { requireApiKey: true });
        return { success: true, data: raw };
    }),
    /**
     * Private: Check if facility supports IPMI whitelist.
     */
    getIpmiWhitelistSupported: hivelocityProcedure
        .input(z.object({ deviceId: z.number().int() }).and(teamHivelocityAccessSchema))
        .query(async ({ ctx, input }) => {
        await maybeAssertTeamHivelocityDeviceAccess({ ctx, input });
        const raw = await hivelocityRequest(`/device/${input.deviceId}/ipmi/whitelist-supported`, { requireApiKey: true });
        return { success: true, data: raw };
    }),
    /**
     * Private: Get all VPS Snapshot Schedules for a device/facility.
     */
    getVpsSnapshotSchedules: hivelocityProcedure
        .input(z
        .object({
        deviceId: z.number().int().optional(),
        facilityCode: z.string().optional(),
        clientId: z.number().int().optional(),
    })
        .and(teamHivelocityAccessSchema))
        .query(async ({ ctx, input }) => {
        await maybeAssertTeamHivelocityDeviceAccess({ ctx, input });
        const { teamSlug: _ts, teamResourceCategory: _trc, ...query } = input;
        const raw = await hivelocityRequest("/vps/snapshotSchedule", {
            query,
            requireApiKey: true,
        });
        return { success: true, data: raw };
    }),
    /**
     * Private: Create a VPS Snapshot Schedule.
     */
    createVpsSnapshotSchedule: hivelocityProcedure
        .input(hivelocityVpsSnapshotScheduleCreateSchema
        .extend({ deviceId: z.number().int().optional() })
        .and(teamHivelocityAccessSchema))
        .mutation(async ({ ctx, input }) => {
        await maybeAssertTeamHivelocityDeviceAccess({ ctx, input });
        const { teamSlug: _ts, teamResourceCategory: _trc, deviceId: _deviceId, ...body } = input;
        const raw = await hivelocityRequest("/vps/snapshotSchedule", {
            method: "POST",
            body,
            requireApiKey: true,
        });
        return { success: true, data: raw };
    }),
    /**
     * Private: Create a new VPS Volume.
     */
    createVpsVolume: hivelocityProcedure
        .input(hivelocityVpsVolumeCreateSchema.and(teamHivelocityAccessSchema))
        .mutation(async ({ ctx, input }) => {
        await maybeAssertTeamHivelocityDeviceAccess({ ctx, input });
        const { teamSlug: _ts, teamResourceCategory: _trc, ...body } = input;
        const raw = await hivelocityRequest("/vps/volume", {
            method: "POST",
            body,
            requireApiKey: true,
        });
        return { success: true, data: raw };
    }),
    /**
     * Private: Resize a VPS Volume.
     */
    resizeVpsVolume: hivelocityProcedure
        .input(z
        .object({
        volumeId: z.string(),
        size: z.number().int(),
        deviceId: z.number().int().optional(),
    })
        .and(teamHivelocityAccessSchema))
        .mutation(async ({ ctx, input }) => {
        await maybeAssertTeamHivelocityDeviceAccess({ ctx, input });
        const { volumeId, teamSlug: _ts, teamResourceCategory: _trc, ...body } = input;
        const raw = await hivelocityRequest(`/vps/volume/${volumeId}`, {
            method: "PUT",
            body,
            requireApiKey: true,
        });
        return { success: true, data: raw };
    }),
    /**
     * Private: Delete a VPS Volume.
     */
    deleteVpsVolume: hivelocityProcedure
        .input(z
        .object({
        volumeId: z.string(),
        deviceId: z.number().int().optional(),
    })
        .and(teamHivelocityAccessSchema))
        .mutation(async ({ ctx, input }) => {
        await maybeAssertTeamHivelocityDeviceAccess({ ctx, input });
        const { volumeId, teamSlug: _ts, teamResourceCategory: _trc, ...body } = input;
        const raw = await hivelocityRequest(`/vps/volume/${volumeId}`, {
            method: "DELETE",
            body,
            requireApiKey: true,
        });
        return { success: true, data: raw };
    }),
    /**
     * Private: Get a volume's list of upgradable sizes.
     */
    getVpsVolumeAvailableSizes: hivelocityProcedure
        .input(z.object({ volumeId: z.string() }))
        .query(async ({ input }) => {
        const raw = await hivelocityRequest(`/vps/volume/${input.volumeId}/available-sizes`, {
            requireApiKey: true,
        });
        return { success: true, data: raw };
    }),
    /**
     * Private: Restore a VPS Volume Snapshot.
     */
    restoreVpsSnapshot: hivelocityProcedure
        .input(z.object({
        snapshotId: z.string(),
        facilityCode: z.string(),
        clientId: z.number().int().optional()
    }))
        .mutation(async ({ input }) => {
        const { snapshotId, ...body } = input;
        const raw = await hivelocityRequest(`/vps/snapshot/${snapshotId}`, {
            method: "POST",
            body,
            requireApiKey: true,
        });
        return { success: true, data: raw };
    }),
    /**
     * Private: Delete a VPS Volume Snapshot.
     */
    deleteVpsSnapshot: hivelocityProcedure
        .input(z.object({
        snapshotId: z.string(),
        facilityCode: z.string().optional(),
        clientId: z.number().int().optional()
    }))
        .mutation(async ({ input }) => {
        const { snapshotId, ...query } = input;
        const raw = await hivelocityRequest(`/vps/snapshot/${snapshotId}`, {
            method: "DELETE",
            query,
            requireApiKey: true,
        });
        return { success: true, data: raw };
    }),
    /**
     * Private: Get all VPS Volume Snapshots available.
     */
    getVpsSnapshots: hivelocityProcedure
        .input(z.object({
        facilityCode: z.string(),
        clientId: z.number().int().optional()
    }))
        .query(async ({ input }) => {
        const raw = await hivelocityRequest("/vps/snapshot", {
            query: input,
            requireApiKey: true,
        });
        return { success: true, data: raw };
    }),
    /**
     * Private: Create a manual VPS Volume Snapshot.
     */
    createVpsSnapshot: hivelocityProcedure
        .input(z.object({
        volumeId: z.string(),
        name: z.string(),
        facilityCode: z.string(),
        clientId: z.number().int().optional()
    }))
        .mutation(async ({ input }) => {
        const raw = await hivelocityRequest("/vps/snapshot", {
            method: "POST",
            body: input,
            requireApiKey: true,
        });
        return { success: true, data: raw };
    }),
    /**
     * Private: Delete a VPS Snapshot Schedule.
     */
    deleteVpsSnapshotSchedule: hivelocityProcedure
        .input(z.object({
        snapshotScheduleId: z.string(),
        facilityCode: z.string()
    }))
        .mutation(async ({ input }) => {
        const { snapshotScheduleId, ...query } = input;
        const raw = await hivelocityRequest(`/vps/snapshotSchedule/${snapshotScheduleId}`, {
            method: "DELETE",
            query,
            requireApiKey: true,
        });
        return { success: true, data: raw };
    }),
    /**
     * Private: Initiate an OS reload.
     */
    reloadDevice: hivelocityProcedure
        .input(z
        .object({
        deviceId: z.number().int(),
        operatingSystemId: z.number().int().optional(),
        publicSshKeyIds: z.array(z.number().int()).optional(),
        script: z.string().optional(),
    })
        .and(teamHivelocityAccessSchema))
        .mutation(async ({ ctx, input }) => {
        await maybeAssertTeamHivelocityDeviceAccess({ ctx, input });
        const { deviceId, teamSlug: _ts, teamResourceCategory: _trc, ...body } = input;
        const raw = await hivelocityRequest(`/device/${deviceId}/reload`, {
            method: "POST",
            body,
            requireApiKey: true,
        });
        return { success: true, data: raw };
    }),
    /**
     * Private: Update device metadata (name, hostname).
     */
    updateDevice: hivelocityProcedure
        .input(z
        .object({
        deviceId: z.number().int(),
        name: z.string().optional(),
        hostname: z.string().optional(),
    })
        .and(teamHivelocityAccessSchema))
        .mutation(async ({ ctx, input }) => {
        await maybeAssertTeamHivelocityDeviceAccess({ ctx, input });
        const { deviceId, teamSlug: _ts, teamResourceCategory: _trc, ...body } = input;
        const raw = await hivelocityRequest(`/device/${deviceId}`, {
            method: "PUT",
            body,
            requireApiKey: true,
        });
        return { success: true, data: raw };
    }),
    /**
     * Private: Request token to reset root password for VPS.
     * Token is emailed to the Hivelocity account contact - not returned in the published API schema.
     */
    vpsRequestResetPasswordToken: hivelocityProcedure
        .input(z.object({ deviceId: z.number().int() }).and(teamHivelocityAccessSchema))
        .mutation(async ({ ctx, input }) => {
        await maybeAssertTeamHivelocityDeviceAccess({ ctx, input });
        const raw = await hivelocityRequest(`/vps/${input.deviceId}/reset-password`, {
            method: "POST",
            requireApiKey: true,
        });
        return { success: true, data: normalizeVpsPasswordResetRequestResult(raw) };
    }),
    /**
     * Private: Reset VPS root password (requires token and device to be powered off).
     */
    vpsResetRootPassword: hivelocityProcedure
        .input(z
        .object({
        deviceId: z.number().int(),
        token: z.string().min(1),
    })
        .and(teamHivelocityAccessSchema))
        .mutation(async ({ ctx, input }) => {
        await maybeAssertTeamHivelocityDeviceAccess({ ctx, input });
        const { deviceId, token } = input;
        const raw = await hivelocityRequest(`/vps/${deviceId}/reset-password`, {
            method: "PUT",
            body: { token },
            requireApiKey: true,
        });
        return { success: true, data: raw };
    }),
    /**
     * Private: List VPS ISOs available in a facility (GET /vps/iso).
     */
    listVpsIsos: hivelocityProcedure
        .input(z.object({ facilityCode: z.string().min(1) }))
        .query(async ({ input }) => {
        const raw = await hivelocityRequest("/vps/iso", {
            query: { facilityCode: input.facilityCode },
            requireApiKey: true,
        });
        return { success: true, data: raw };
    }),
    /**
     * Private: Get OS reload options for a device (GET /device/{deviceId}/reload).
     */
    getDeviceReloadInfo: hivelocityProcedure
        .input(z.object({ deviceId: z.number().int() }).and(teamHivelocityAccessSchema))
        .query(async ({ ctx, input }) => {
        await maybeAssertTeamHivelocityDeviceAccess({ ctx, input });
        const raw = await hivelocityRequest(`/device/${input.deviceId}/reload`, {
            requireApiKey: true,
        });
        return { success: true, data: raw };
    }),
    /**
     * Private: Attach ISO to VPS.
     */
    vpsAttachIso: hivelocityProcedure
        .input(z
        .object({
        deviceId: z.number().int(),
        isoId: z.string(),
    })
        .and(teamHivelocityAccessSchema))
        .mutation(async ({ ctx, input }) => {
        await maybeAssertTeamHivelocityDeviceAccess({ ctx, input });
        const raw = await hivelocityRequest(`/vps/${input.deviceId}/attachiso`, {
            method: "POST",
            body: { isoId: input.isoId },
            requireApiKey: true,
        });
        return { success: true, data: raw };
    }),
    /**
     * Private: Detach ISO from VPS.
     */
    vpsDetachIso: hivelocityProcedure
        .input(z.object({ deviceId: z.number().int() }).and(teamHivelocityAccessSchema))
        .mutation(async ({ ctx, input }) => {
        await maybeAssertTeamHivelocityDeviceAccess({ ctx, input });
        const raw = await hivelocityRequest(`/vps/${input.deviceId}/detachiso`, {
            method: "POST",
            requireApiKey: true,
        });
        return { success: true, data: raw };
    }),
    /**
     * Private: Get one-time browser console URL for VPS.
     */
    vpsGetConsoleUrl: hivelocityProcedure
        .input(z.object({ deviceId: z.number().int() }).and(teamHivelocityAccessSchema))
        .mutation(async ({ ctx, input }) => {
        await maybeAssertTeamHivelocityDeviceAccess({ ctx, input });
        const raw = await hivelocityRequest(`/vps/${input.deviceId}/console`, {
            method: "POST",
            requireApiKey: true,
        });
        return { success: true, data: raw };
    }),
    /**
     * Private: List account SSH public keys (GET /ssh_key/).
     */
    listSshKeys: hivelocityProcedure.query(async () => {
        const data = await listHivelocitySshKeys();
        return { success: true, data };
    }),
    /**
     * Private: Add an SSH public key to the account (POST /ssh_key/).
     */
    createSshKey: hivelocityProcedure
        .input(z.object({
        name: z.string().min(1).max(128),
        publicKey: z.string().min(32).max(16_384),
    }))
        .mutation(async ({ input }) => {
        assertValidSshPublicKey(input.publicKey);
        const data = await createHivelocitySshKey(input.name, input.publicKey);
        return { success: true, data };
    }),
    /**
     * Private: Remove an SSH public key from the account (DELETE /ssh_key/{id}).
     */
    deleteSshKey: hivelocityProcedure
        .input(z.object({ sshKeyId: z.number().int() }))
        .mutation(async ({ input }) => {
        await deleteHivelocitySshKey(input.sshKeyId);
        return { success: true };
    }),
    /**
     * Private: Replace SSH keys deployed on a VPS (PUT /vps/{deviceId}).
     * Instance must be powered off.
     */
    updateVpsSshKeys: hivelocityProcedure
        .input(z
        .object({
        deviceId: z.number().int(),
        sshKeyIds: z.array(z.number().int()),
    })
        .and(teamHivelocityAccessSchema))
        .mutation(async ({ ctx, input }) => {
        await maybeAssertTeamHivelocityDeviceAccess({ ctx, input });
        const data = await updateVpsDeployedSshKeys(input.deviceId, input.sshKeyIds);
        return { success: true, data };
    }),
    /**
     * Agency: suspend customer panel access and power off the VPS upstream.
     */
    suspendVpsInstance: hivelocityProcedure
        .input(z.object({
        deviceId: z.number().int(),
        subscriptionId: z.string().min(1),
    }))
        .mutation(async ({ ctx, input }) => {
        const session = ctx.session;
        if (!session?.user?.id) {
            throw new TRPCError({ code: "UNAUTHORIZED", message: "You must be logged in" });
        }
        const data = await suspendHivelocityVpsInstance({
            deviceId: input.deviceId,
            subscriptionId: input.subscriptionId,
            userId: session.user.id,
            role: session.user.role,
        });
        return { success: true, data };
    }),
    /**
     * Agency: restore customer panel access and boot the VPS if we powered it off on suspend.
     */
    reactivateVpsInstance: hivelocityProcedure
        .input(z.object({
        deviceId: z.number().int(),
        subscriptionId: z.string().min(1),
    }))
        .mutation(async ({ ctx, input }) => {
        const session = ctx.session;
        if (!session?.user?.id) {
            throw new TRPCError({ code: "UNAUTHORIZED", message: "You must be logged in" });
        }
        const data = await reactivateHivelocityVpsInstance({
            deviceId: input.deviceId,
            subscriptionId: input.subscriptionId,
            userId: session.user.id,
            role: session.user.role,
        });
        return { success: true, data };
    }),
    /**
     * Private: Get a short-lived ticket for authenticating cross-origin WebSockets.
     */
    getWsTicket: hivelocityProcedure.mutation(async ({ ctx }) => {
        const redis = getRedisClient();
        if (!redis)
            throw new Error("Redis required for WS tickets");
        const ticket = crypto.randomUUID();
        await redis.setex(`ws-ticket:${ticket}`, 60, ctx.session.user.id);
        return { ticket };
    }),
});
