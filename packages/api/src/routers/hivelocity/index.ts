import { z } from "zod";
import { protectedProcedure, router } from "../../trpc";
import { getHivelocityEnvStatus, hivelocityRequest } from "../../lib/hivelocity-client";
import {
	hivelocityFacilitiesResponseSchema,
	normalizeHivelocityInventory,
	hivelocityProductByIdResponseSchema,
	hivelocityDeviceDumpSchema,
	hivelocityVpsSchema,
	hivelocityVpsSnapshotScheduleCreateSchema,
	hivelocityVpsVolumeCreateSchema,
	type HivelocityDeviceDump,
	type HivelocityVps,
	type HivelocityAnyResource,
} from "../../types/hivelocity";

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

type DedicatedPlansCacheKey = string;
let dedicatedPlansCache: Map<
	DedicatedPlansCacheKey,
	{ atMs: number; inventory: ReturnType<typeof normalizeHivelocityInventory> }
> = new Map();

function buildCacheKey(input: z.infer<typeof DedicatedPlansQuerySchema> | undefined): DedicatedPlansCacheKey {
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
		.input(
			z
				.object({
					vpsLocations: z.string().optional(),
				})
				.optional(),
		)
		.query(async ({ input }) => {
			const raw = await hivelocityRequest<unknown>("/inventory/locations", {
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
			const raw = await hivelocityRequest<unknown>(`/product/${input.productId}/operating-systems`, {
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
		.input(
			z.object({
				productId: z.number().int().positive(),
				groupBy: z.string().optional().default("upgrade"),
			}),
		)
		.query(async ({ input }) => {
			const raw = await hivelocityRequest<unknown>(`/product/${input.productId}/options`, {
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
		.input(
			z.object({
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
			}),
		)
		.mutation(async ({ input }) => {
			const raw = await hivelocityRequest<unknown>("/compute/", {
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
		.input(
			z.object({
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
			}),
		)
		.mutation(async ({ input }) => {
			const raw = await hivelocityRequest<unknown>("/bare-metal-devices/", {
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
			const raw = await hivelocityRequest<unknown>(`/order/${input.orderId}`, { requireApiKey: true });
			return { success: true, data: raw };
		}),

	/**
	 * Public (TEMP for development): Get compute device by id.
	 * Docs: GET /compute/{deviceId}
	 */
	getComputeDeviceById: protectedProcedure
		.input(z.object({ deviceId: z.number().int().positive() }))
		.query(async ({ input }) => {
			const raw = await hivelocityRequest<unknown>(`/compute/${input.deviceId}`, { requireApiKey: true });
			return { success: true, data: raw };
		}),

	/**
	 * Public (TEMP for development): Get all compute devices.
	 * Docs: GET /compute/
	 */
	getComputeDevices: protectedProcedure.query(async () => {
		const raw = await hivelocityRequest<unknown>("/compute/", { requireApiKey: true });
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
		.input(
			z
				.object({
					rack_id: z.number().int().optional(),
					orderId: z.number().int().optional(),
				})
				.optional(),
		)
		.query(async ({ input }) => {
			const raw = await hivelocityRequest<unknown>("/device/", {
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
			const raw = await hivelocityRequest<unknown>(`/device/${input.deviceId}/initial-password`, {
				requireApiKey: true,
			});
			return { success: true, data: raw };
		}),

	/**
	 * Public (TEMP for development): Get device IP assignments.
	 * Docs: GET /device/{deviceId}/ips
	 */
	getDeviceIps: protectedProcedure
		.input(z.object({ deviceId: z.number().int().positive() }))
		.query(async ({ input }) => {
			const raw = await hivelocityRequest<unknown>(`/device/${input.deviceId}/ips`, { requireApiKey: true });
			return { success: true, data: raw };
		}),

	/**
	 * Public (TEMP for development): Get all device services.
	 * Docs: GET /device/{deviceId}/services
	 */
	getDeviceServices: protectedProcedure
		.input(
			z.object({
				deviceId: z.number().int().positive(),
				group_by: z.string().default("flat").optional(),
				type_code: z.string().default("all").optional(),
			})
		)
		.query(async ({ input }) => {
			const raw = await hivelocityRequest<unknown>(`/device/${input.deviceId}/services`, {
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
	getVpsUpgrades: protectedProcedure
		.input(z.object({ deviceId: z.number().int().positive() }))
		.query(async ({ input }) => {
			const raw = await hivelocityRequest<unknown>(`/vps/${input.deviceId}/available-product-upgrades`, {
				requireApiKey: true,
			});
			return { success: true, data: raw };
		}),

	/**
	 * Private: Get all products.
	 * Docs: GET /inventory/product
	 */
	getProducts: protectedProcedure.input(ProductsQuerySchema).query(async ({ input }) => {
		const raw = await hivelocityRequest<unknown>("/inventory/product", {
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
		let inventory: ReturnType<typeof normalizeHivelocityInventory>;

		if (cached && now - cached.atMs < TTL_MS) {
			inventory = cached.inventory;
		} else {
			const raw = await hivelocityRequest<unknown>("/inventory/product", {
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
		const stockRank = (s: string) => (s === "available" ? 0 : s === "limited" ? 1 : 2);
		dedicated.sort((a, b) => {
			const sr = stockRank(a.stock) - stockRank(b.stock);
			if (sr !== 0) return sr;
			const ap = a.product_monthly_price ?? Number.POSITIVE_INFINITY;
			const bp = b.product_monthly_price ?? Number.POSITIVE_INFINITY;
			if (ap !== bp) return ap - bp;
			if (a.product_id !== b.product_id) return a.product_id - b.product_id;
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
		let inventory: ReturnType<typeof normalizeHivelocityInventory>;

		if (cached && now - cached.atMs < TTL_MS) {
			inventory = cached.inventory;
		} else {
			const raw = await hivelocityRequest<unknown>("/inventory/product", {
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

		if (facilityCode) rows = rows.filter((p) => p.data_center === facilityCode);

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

		const stockRank = (s: string) => (s === "available" ? 0 : s === "limited" ? 1 : 2);
		rows.sort((a, b) => {
			const sr = stockRank(a.stock) - stockRank(b.stock);
			if (sr !== 0) return sr;
			const ap = a.product_monthly_price ?? Number.POSITIVE_INFINITY;
			const bp = b.product_monthly_price ?? Number.POSITIVE_INFINITY;
			if (ap !== bp) return ap - bp;
			if (a.product_id !== b.product_id) return a.product_id - b.product_id;
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
		let inventory: ReturnType<typeof normalizeHivelocityInventory>;

		if (cached && now - cached.atMs < TTL_MS) {
			inventory = cached.inventory;
		} else {
			const raw = await hivelocityRequest<unknown>("/inventory/product", {
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

		if (facilityCode) rows = rows.filter((p) => p.data_center === facilityCode);

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

		const stockRank = (s: string) => (s === "available" ? 0 : s === "limited" ? 1 : 2);
		rows.sort((a, b) => {
			const sr = stockRank(a.stock) - stockRank(b.stock);
			if (sr !== 0) return sr;
			const ap = a.product_monthly_price ?? Number.POSITIVE_INFINITY;
			const bp = b.product_monthly_price ?? Number.POSITIVE_INFINITY;
			if (ap !== bp) return ap - bp;
			if (a.product_id !== b.product_id) return a.product_id - b.product_id;
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
		.input(
			z.object({
				productId: z.number().int().positive(),
			}),
		)
		.query(async ({ input }) => {
			const raw = await hivelocityRequest<unknown>(`/inventory/product/${input.productId}`, {
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
	getMyDevices: protectedProcedure
		.input(
			z.object({
				search: z.string().trim().optional(),
				facilityCode: z.string().trim().optional(),
				powerStatus: z.enum(["on", "off", "all"]).default("all").optional(),
				limit: z.number().int().min(1).max(200).default(50).optional(),
				cursor: z.number().int().min(0).default(0).optional(),
			}).optional(),
		)
		.query(async ({ input }) => {
			const limit = input?.limit ?? 50;
			const cursor = input?.cursor ?? 0;
			const search = input?.search?.toLowerCase() ?? "";
			const facilityCode = input?.facilityCode?.trim() ?? "";
			const powerStatusFilter = input?.powerStatus ?? "all";

			const raw = await hivelocityRequest<unknown>("/device/", { requireApiKey: true });

			// Parse row-by-row so one bad record never kills the whole list.
			const rawArray = Array.isArray(raw) ? raw : [];
			let devices = rawArray
				.map((item) => hivelocityDeviceDumpSchema.safeParse(item))
				.filter((r): r is { success: true; data: HivelocityDeviceDump } => r.success)
				.map((r) => r.data);

			// Facility filter (location is now an object, extract titles/codes)
			if (facilityCode) {
				devices = devices.filter((d) => {
					const loc = d.location as any;
					const code = loc?.facility || loc?.facilityCode || loc?.code || "";
					const title = loc?.facility_title || loc?.city || "";
					return (
						code.toLowerCase() === facilityCode.toLowerCase() ||
						title.toLowerCase().includes(facilityCode.toLowerCase())
					);
				});
			}

			// Power status filter (powerStatus is now an object)
			if (powerStatusFilter !== "all") {
				devices = devices.filter((d) => {
					const ps = (d.powerStatus as any)?.status || d.powerStatus;
					return String(ps || "unknown").toLowerCase() === powerStatusFilter;
				});
			}

			// Search filter — match against updated field names (name, deviceType)
			if (search.length > 0) {
				devices = devices.filter((d) => {
					const loc = d.location as any;
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
	 * schema — VPS instances are NOT returned by /device/.
	 *
	 * Supports:
	 * - Free-text search (hostname, primaryIp, osName, id)
	 * - Facility filter (facilityCode)
	 * - Cursor-based pagination
	 */
	getMyVpsInstances: protectedProcedure
		.input(
			z.object({
				search: z.string().trim().optional(),
				facilityCode: z.string().trim().optional(),
				limit: z.number().int().min(1).max(200).default(50).optional(),
				cursor: z.number().int().min(0).default(0).optional(),
			}).optional(),
		)
		.query(async ({ input }) => {
			const limit = input?.limit ?? 50;
			const cursor = input?.cursor ?? 0;
			const search = input?.search?.toLowerCase() ?? "";
			const facilityCode = input?.facilityCode?.trim() ?? "";

			const raw = await hivelocityRequest<unknown>("/vps/", { requireApiKey: true });

			const rawArray = Array.isArray(raw) ? raw : [];
			let instances = rawArray
				.map((item) => hivelocityVpsSchema.safeParse(item))
				.filter((r): r is { success: true; data: HivelocityVps } => r.success)
				.map((r) => r.data);

			// Facility filter
			if (facilityCode) {
				instances = instances.filter(
					(v) => v.facilityCode?.toLowerCase() === facilityCode.toLowerCase(),
				);
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
	getMyAllResources: protectedProcedure
		.input(
			z.object({
				type: z.enum(["dedicated", "vps", "vds", "all"]).default("all").optional(),
				search: z.string().trim().optional(),
				facilityCode: z.string().trim().optional(),
				limit: z.number().int().min(1).max(200).default(50).optional(),
				cursor: z.number().int().min(0).default(0).optional(),
			}).optional(),
		)
		.query(async ({ input }) => {
			const limit = input?.limit ?? 50;
			const cursor = input?.cursor ?? 0;
			const search = input?.search?.toLowerCase() ?? "";
			const facilityCode = input?.facilityCode?.trim() ?? "";
			const typeFilter = input?.type ?? "all";

			// Parallel fetch — VPS instances live in a completely separate namespace.
			const [rawDevices, rawVps] = await Promise.all([
				hivelocityRequest<unknown>("/device/", { requireApiKey: true }),
				hivelocityRequest<unknown>("/vps/", { requireApiKey: true }),
			]);

			// --- Classify device records ---
			const deviceArray = Array.isArray(rawDevices) ? rawDevices : [];
			const deviceResources: HivelocityAnyResource[] = deviceArray
				.map((item) => hivelocityDeviceDumpSchema.safeParse(item))
				.filter((r): r is { success: true; data: HivelocityDeviceDump } => r.success)
				.map((r) => {
					const device = r.data;
					const typeStr = (device.deviceType ?? "").toUpperCase();
					const groupStr = (device.deviceTypeGroup ?? "").toUpperCase();
					
					let resourceType: "dedicated" | "vds" | "vps" = "dedicated";
					if (typeStr.includes("VPS") || groupStr.includes("VPS")) {
						resourceType = "vps";
					} else if (typeStr.includes("VDS") || device.tags.some(t => t.toUpperCase() === "VDS")) {
						resourceType = "vds";
					}

					return {
						...device,
						resourceType,
					};
				});

			// --- Classify VPS records ---
			const vpsArray = Array.isArray(rawVps) ? rawVps : [];
			const vpsMap = new Map<number, HivelocityVps>();
			vpsArray.forEach((v) => {
				const parsed = hivelocityVpsSchema.safeParse(v);
				if (parsed.success) {
					const deviceId = (parsed.data as any).deviceId || (parsed.data as any).id;
					if (deviceId) vpsMap.set(Number(deviceId), parsed.data);
				}
			});

			// --- Merge ---
			const mergedResources: HivelocityAnyResource[] = [];
			const seenDeviceIds = new Set<number>();

			deviceResources.forEach((dev: any) => {
				const deviceId = dev.deviceId;
				if (deviceId) seenDeviceIds.add(deviceId);

				if (dev.resourceType === "vps" && deviceId && vpsMap.has(deviceId)) {
					const vpsData = vpsMap.get(deviceId)!;
					mergedResources.push({
						...vpsData,
						...dev, // Prefer device data for core metadata (billing, location) but keep VPS tech specs
						resourceType: "vps" as const,
					});
				} else {
					mergedResources.push(dev);
				}
			});

			// Add VPS instances that didn't appear in the /device/ list
			vpsMap.forEach((vps, deviceId) => {
				if (!seenDeviceIds.has(deviceId)) {
					mergedResources.push({ ...vps, resourceType: "vps" as const });
				}
			});

			let all = mergedResources;

			// Type filter
			if (typeFilter !== "all") {
				all = all.filter((r) => r.resourceType === typeFilter);
			}

			// Facility filter
			if (facilityCode) {
				all = all.filter((r) => {
					if (r.resourceType === "vps" && !("location" in r)) {
						return (r.facilityCode ?? "").toLowerCase() === facilityCode.toLowerCase();
					}
					const loc = (r as any).location as any;
					const code = loc?.facility || loc?.facilityCode || loc?.code || (r as any).facilityCode || "";
					const title = loc?.facility_title || loc?.city || "";
					return (
						code.toLowerCase() === facilityCode.toLowerCase() ||
						title.toLowerCase().includes(facilityCode.toLowerCase())
					);
				});
			}

			// Search filter
			if (search.length > 0) {
				all = all.filter((r) => {
					const common = [
						r.hostname,
						r.primaryIp ?? "",
						r.resourceType,
					];

					if (r.resourceType === "vps" && !("location" in r)) {
						common.push((r as HivelocityVps).osName ?? "");
						common.push((r as HivelocityVps).facilityCode ?? "");
						common.push(r.id);
					} else {
						const d = r as HivelocityDeviceDump;
						const loc = d.location as any;
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

			const total = all.length;
			const items = all.slice(cursor, cursor + limit);
			const nextCursor = cursor + limit < total ? cursor + limit : null;

			// Summary counts (after type + facility + search filters, before pagination)
			const counts = {
				dedicated: all.filter((r) => r.resourceType === "dedicated").length,
				vds: all.filter((r) => r.resourceType === "vds").length,
				vps: all.filter((r) => r.resourceType === "vps").length,
				total,
			};

			return { success: true, data: { items, total, nextCursor, counts } };
		}),

	/**
	 * Private: Get device details (standard /device/{id}).
	 */
	getDeviceDetails: protectedProcedure
		.input(z.object({ deviceId: z.number().int() }))
		.query(async ({ input }) => {
			try {
				const raw = await hivelocityRequest<unknown>(`/device/${input.deviceId}`, { requireApiKey: true });
				const parsed = hivelocityDeviceDumpSchema.safeParse(raw);
				if (!parsed.success) {
					console.error("Hivelocity device schema mismatch:", parsed.error);
					// Return raw data as fallback if schema fails but we have an object
					return { success: true, data: (raw && typeof raw === 'object') ? raw : null };
				}
				return { success: true, data: parsed.data };
			} catch (err) {
				console.error("Hivelocity getDeviceDetails error:", err);
				return { success: true, data: null };
			}
		}),

	/**
	 * Private: Get VPS-specific details (/vps/{id}).
	 */
	getVpsDetails: protectedProcedure
		.input(z.object({ deviceId: z.number().int() }))
		.query(async ({ input }) => {
			try {
				const raw = await hivelocityRequest<unknown>(`/vps/${input.deviceId}`, { requireApiKey: true });
				const parsed = hivelocityVpsSchema.safeParse(raw);
				if (!parsed.success) {
					console.error("Hivelocity VPS schema mismatch:", parsed.error);
					return { success: true, data: (raw && typeof raw === 'object') ? raw : null };
				}
				return { success: true, data: parsed.data };
			} catch (err) {
				// VPS endpoint often 404s for non-Cloud devices that are still tagged as VPS
				return { success: true, data: null };
			}
		}),

	/**
	 * Private: Get VPS event log.
	 */
	getVpsEvents: protectedProcedure
		.input(z.object({ deviceId: z.number().int() }))
		.query(async ({ input }) => {
			const raw = await hivelocityRequest<unknown>(`/vps/${input.deviceId}/events`, { requireApiKey: true });
			return { success: true, data: raw };
		}),

	/**
	 * Private: Get VPS metrics charts (Base64).
	 */
	getVpsMetrics: protectedProcedure
		.input(
			z.object({
				deviceId: z.number().int(),
				metricType: z.enum(["CPU_USAGE", "MEMORY_USAGE", "DISK_RW", "NETWORK_USAGE"]),
				startTime: z.number().int().optional(),
				endTime: z.number().int().optional(),
				imageWidth: z.number().int().optional(),
				imageHeight: z.number().int().optional(),
			}),
		)
		.query(async ({ input }) => {
			const { deviceId, ...query } = input;
			const raw = await hivelocityRequest<unknown>(`/vps/${deviceId}/metrics`, {
				query,
				requireApiKey: true,
			});
			return { success: true, data: raw };
		}),

	/**
	 * Private: Get VPS volumes.
	 */
	getVpsVolumes: protectedProcedure
		.input(z.object({ deviceId: z.number().int() }))
		.query(async ({ input }) => {
			const raw = await hivelocityRequest<unknown>("/vps/volume", {
				query: { deviceId: input.deviceId },
				requireApiKey: true,
			});
			return { success: true, data: raw };
		}),

	/**
	 * Private: Power on, off, or reboot a device.
	 */
	devicePowerAction: protectedProcedure
		.input(
			z.object({
				deviceId: z.number().int(),
				action: z.enum(["on", "off", "reboot", "boot", "shutdown"]),
			}),
		)
		.mutation(async ({ input }) => {
			// Map on/off to boot/shutdown if needed, or just pass as is if API supports both.
			// The OpenAPI says boot/reboot/shutdown.
			let apiAction = input.action;
			if (apiAction === "on") apiAction = "boot";
			if (apiAction === "off") apiAction = "shutdown";

			const raw = await hivelocityRequest<unknown>(`/device/${input.deviceId}/power`, {
				method: "POST",
				query: { action: apiAction },
				requireApiKey: true,
			});
			return { success: true, data: raw };
		}),

	/**
	 * Private: Get device power status (ON/OFF).
	 */
	getDevicePowerStatus: protectedProcedure
		.input(z.object({ deviceId: z.number().int() }))
		.query(async ({ input }) => {
			const raw = await hivelocityRequest<unknown>(`/device/${input.deviceId}/power`, { requireApiKey: true });
			return { success: true, data: raw };
		}),

	/**
	 * Private: Get device switch ports and IP assignments.
	 */
	getDevicePorts: protectedProcedure
		.input(z.object({ deviceId: z.number().int() }))
		.query(async ({ input }) => {
			const raw = await hivelocityRequest<unknown>(`/device/${input.deviceId}/ports`, { requireApiKey: true });
			return { success: true, data: raw };
		}),

	/**
	 * Private: Get initial SSH credentials (user, password, port).
	 */
	getDeviceInitialCreds: protectedProcedure
		.input(z.object({ deviceId: z.number().int() }))
		.query(async ({ input }) => {
			const raw = await hivelocityRequest<unknown>(`/device/${input.deviceId}/initial-creds`, { requireApiKey: true });
			return { success: true, data: raw };
		}),

	/**
	 * Private: Get initial SSH password.
	 */
	getDeviceInitialPassword: protectedProcedure
		.input(z.object({ deviceId: z.number().int() }))
		.query(async ({ input }) => {
			const raw = await hivelocityRequest<unknown>(`/device/${input.deviceId}/initial-password`, { requireApiKey: true });
			return { success: true, data: raw };
		}),

	/**
	 * Private: Check if facility supports IPMI whitelist.
	 */
	getIpmiWhitelistSupported: protectedProcedure
		.input(z.object({ deviceId: z.number().int() }))
		.query(async ({ input }) => {
			const raw = await hivelocityRequest<unknown>(`/device/${input.deviceId}/ipmi/whitelist-supported`, { requireApiKey: true });
			return { success: true, data: raw };
		}),

	/**
	 * Private: Get all VPS Snapshot Schedules for a device/facility.
	 */
	getVpsSnapshotSchedules: protectedProcedure
		.input(z.object({ 
			deviceId: z.number().int().optional(),
			facilityCode: z.string().optional(),
			clientId: z.number().int().optional()
		}))
		.query(async ({ input }) => {
			const raw = await hivelocityRequest<unknown>("/vps/snapshotSchedule", {
				query: input,
				requireApiKey: true,
			});
			return { success: true, data: raw };
		}),

	/**
	 * Private: Create a VPS Snapshot Schedule.
	 */
	createVpsSnapshotSchedule: protectedProcedure
		.input(hivelocityVpsSnapshotScheduleCreateSchema)
		.mutation(async ({ input }) => {
			const raw = await hivelocityRequest<unknown>("/vps/snapshotSchedule", {
				method: "POST",
				body: input,
				requireApiKey: true,
			});
			return { success: true, data: raw };
		}),

	/**
	 * Private: Create a new VPS Volume.
	 */
	createVpsVolume: protectedProcedure
		.input(hivelocityVpsVolumeCreateSchema)
		.mutation(async ({ input }) => {
			const raw = await hivelocityRequest<unknown>("/vps/volume", {
				method: "POST",
				body: input,
				requireApiKey: true,
			});
			return { success: true, data: raw };
		}),

	/**
	 * Private: Resize a VPS Volume.
	 */
	resizeVpsVolume: protectedProcedure
		.input(z.object({ 
			volumeId: z.string(), 
			size: z.number().int(),
			deviceId: z.number().int().optional()
		}))
		.mutation(async ({ input }) => {
			const { volumeId, ...body } = input;
			const raw = await hivelocityRequest<unknown>(`/vps/volume/${volumeId}`, {
				method: "PUT",
				body,
				requireApiKey: true,
			});
			return { success: true, data: raw };
		}),

	/**
	 * Private: Delete a VPS Volume.
	 */
	deleteVpsVolume: protectedProcedure
		.input(z.object({ 
			volumeId: z.string(),
			deviceId: z.number().int().optional()
		}))
		.mutation(async ({ input }) => {
			const { volumeId, ...body } = input;
			const raw = await hivelocityRequest<unknown>(`/vps/volume/${volumeId}`, {
				method: "DELETE",
				body,
				requireApiKey: true,
			});
			return { success: true, data: raw };
		}),

	/**
	 * Private: Get a volume's list of upgradable sizes.
	 */
	getVpsVolumeAvailableSizes: protectedProcedure
		.input(z.object({ volumeId: z.string() }))
		.query(async ({ input }) => {
			const raw = await hivelocityRequest<unknown>(`/vps/volume/${input.volumeId}/available-sizes`, {
				requireApiKey: true,
			});
			return { success: true, data: raw };
		}),

	/**
	 * Private: Restore a VPS Volume Snapshot.
	 */
	restoreVpsSnapshot: protectedProcedure
		.input(z.object({ 
			snapshotId: z.string(),
			facilityCode: z.string(),
			clientId: z.number().int().optional()
		}))
		.mutation(async ({ input }) => {
			const { snapshotId, ...body } = input;
			const raw = await hivelocityRequest<unknown>(`/vps/snapshot/${snapshotId}`, {
				method: "POST",
				body,
				requireApiKey: true,
			});
			return { success: true, data: raw };
		}),

	/**
	 * Private: Delete a VPS Volume Snapshot.
	 */
	deleteVpsSnapshot: protectedProcedure
		.input(z.object({ 
			snapshotId: z.string(),
			facilityCode: z.string().optional(),
			clientId: z.number().int().optional()
		}))
		.mutation(async ({ input }) => {
			const { snapshotId, ...query } = input;
			const raw = await hivelocityRequest<unknown>(`/vps/snapshot/${snapshotId}`, {
				method: "DELETE",
				query,
				requireApiKey: true,
			});
			return { success: true, data: raw };
		}),

	/**
	 * Private: Get all VPS Volume Snapshots available.
	 */
	getVpsSnapshots: protectedProcedure
		.input(z.object({ 
			facilityCode: z.string(),
			clientId: z.number().int().optional()
		}))
		.query(async ({ input }) => {
			const raw = await hivelocityRequest<unknown>("/vps/snapshot", {
				query: input,
				requireApiKey: true,
			});
			return { success: true, data: raw };
		}),

	/**
	 * Private: Create a manual VPS Volume Snapshot.
	 */
	createVpsSnapshot: protectedProcedure
		.input(z.object({
			volumeId: z.string(),
			name: z.string(),
			facilityCode: z.string(),
			clientId: z.number().int().optional()
		}))
		.mutation(async ({ input }) => {
			const raw = await hivelocityRequest<unknown>("/vps/snapshot", {
				method: "POST",
				body: input,
				requireApiKey: true,
			});
			return { success: true, data: raw };
		}),

	/**
	 * Private: Delete a VPS Snapshot Schedule.
	 */
	deleteVpsSnapshotSchedule: protectedProcedure
		.input(z.object({ 
			snapshotScheduleId: z.string(),
			facilityCode: z.string()
		}))
		.mutation(async ({ input }) => {
			const { snapshotScheduleId, ...query } = input;
			const raw = await hivelocityRequest<unknown>(`/vps/snapshotSchedule/${snapshotScheduleId}`, {
				method: "DELETE",
				query,
				requireApiKey: true,
			});
			return { success: true, data: raw };
		}),

	/**
	 * Private: Initiate an OS reload.
	 */
	reloadDevice: protectedProcedure
		.input(
			z.object({
				deviceId: z.number().int(),
				operatingSystemId: z.number().int().optional(),
				publicSshKeyIds: z.array(z.number().int()).optional(),
				script: z.string().optional(),
			}),
		)
		.mutation(async ({ input }) => {
			const { deviceId, ...body } = input;
			const raw = await hivelocityRequest<unknown>(`/device/${deviceId}/reload`, {
				method: "POST",
				body,
				requireApiKey: true,
			});
			return { success: true, data: raw };
		}),

	/**
	 * Private: Update device metadata (name, hostname).
	 */
	updateDevice: protectedProcedure
		.input(
			z.object({
				deviceId: z.number().int(),
				name: z.string().optional(),
				hostname: z.string().optional(),
			}),
		)
		.mutation(async ({ input }) => {
			const { deviceId, ...body } = input;
			const raw = await hivelocityRequest<unknown>(`/device/${deviceId}`, {
				method: "PUT",
				body,
				requireApiKey: true,
			});
			return { success: true, data: raw };
		}),

	/**
	 * Private: Request token to reset root password for VPS.
	 */
	vpsRequestResetPasswordToken: protectedProcedure
		.input(z.object({ deviceId: z.number().int() }))
		.mutation(async ({ input }) => {
			const raw = await hivelocityRequest<unknown>(`/vps/${input.deviceId}/reset-password`, {
				method: "POST",
				requireApiKey: true,
			});
			return { success: true, data: raw };
		}),

	/**
	 * Private: Reset VPS root password (requires token and device to be powered off).
	 */
	vpsResetRootPassword: protectedProcedure
		.input(z.object({ 
			deviceId: z.number().int(),
			token: z.string().min(1)
		}))
		.mutation(async ({ input }) => {
			const { deviceId, token } = input;
			const raw = await hivelocityRequest<unknown>(`/vps/${deviceId}/reset-password`, {
				method: "PUT",
				body: { token },
				requireApiKey: true,
			});
			return { success: true, data: raw };
		}),

	/**
	 * Private: Attach ISO to VPS.
	 */
	vpsAttachIso: protectedProcedure
		.input(
			z.object({
				deviceId: z.number().int(),
				isoId: z.string(),
			}),
		)
		.mutation(async ({ input }) => {
			const raw = await hivelocityRequest<unknown>(`/vps/${input.deviceId}/attachiso`, {
				method: "POST",
				body: { isoId: input.isoId },
				requireApiKey: true,
			});
			return { success: true, data: raw };
		}),

	/**
	 * Private: Detach ISO from VPS.
	 */
	vpsDetachIso: protectedProcedure
		.input(z.object({ deviceId: z.number().int() }))
		.mutation(async ({ input }) => {
			const raw = await hivelocityRequest<unknown>(`/vps/${input.deviceId}/detachiso`, {
				method: "POST",
				requireApiKey: true,
			});
			return { success: true, data: raw };
		}),

	/**
	 * Private: Get one-time browser console URL for VPS.
	 */
	vpsGetConsoleUrl: protectedProcedure
		.input(z.object({ deviceId: z.number().int() }))
		.mutation(async ({ input }) => {
			const raw = await hivelocityRequest<unknown>(`/vps/${input.deviceId}/console`, {
				method: "POST",
				requireApiKey: true,
			});
			return { success: true, data: raw };
		}),
});


