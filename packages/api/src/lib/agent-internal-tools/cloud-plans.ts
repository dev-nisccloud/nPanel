/**
 * VPS / VDS / dedicated plan catalogue for Zeepo AI.
 *
 * Returns Nisc Cloud retail prices (margin + KES conversion applied).
 * Checkout internals are attached for the UI and stripped before the model sees them.
 * Never expose upstream vendor names in errors or payload copy.
 */

import { and, eq, ilike, or } from "@npanel/db";
import { db } from "@npanel/db";
import { niscProduct } from "@npanel/db/schema/products";
import { ceilConvertedPrice } from "../convert-price";
import {
	applyHivelocityMarginUsd,
	getDefaultHivelocityMarginSettings,
	resolveUsdToKesExchangeRate,
	type HivelocityProductTypeKey,
} from "../hivelocity-display-pricing";
import { resolveHivelocityPublicMessageFromError } from "../hivelocity-errors";
import {
	getCachedHivelocityFacilities,
	getCachedHivelocityInventory,
} from "../hivelocity-inventory-cache";
import {
	HIVELOCITY_NISC_PRODUCT_ID_BY_TYPE,
	pickActivePlanlessProductId,
	PLANLESS_SERVICE_TYPES,
} from "../planless-services-billing";
import type { HivelocityProductStock } from "../../types/hivelocity";

export type CloudPlanKind = "vps" | "vds" | "dedicated";

export type CloudPlansToolName =
	| "get_vps_plans"
	| "get_vds_plans"
	| "get_dedicated_server_plans";

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

const KIND_TO_TOOL: Record<CloudPlanKind, CloudPlansToolName> = {
	vps: "get_vps_plans",
	vds: "get_vds_plans",
	dedicated: "get_dedicated_server_plans",
};

const KIND_TO_PRODUCT_TYPE: Record<CloudPlanKind, HivelocityProductTypeKey> = {
	vps: "VPS",
	vds: "VDS",
	dedicated: "DEDICATED_SERVERS",
};

const KIND_TO_CANONICAL_ID: Record<CloudPlanKind, string> = {
	vps: HIVELOCITY_NISC_PRODUCT_ID_BY_TYPE.VPS,
	vds: HIVELOCITY_NISC_PRODUCT_ID_BY_TYPE.VDS,
	dedicated: HIVELOCITY_NISC_PRODUCT_ID_BY_TYPE.DEDICATED_SERVERS,
};

const KIND_TO_SERVICE_TYPE: Record<CloudPlanKind, string> = {
	vps: PLANLESS_SERVICE_TYPES.vpsHosting,
	vds: PLANLESS_SERVICE_TYPES.vdsHosting,
	dedicated: PLANLESS_SERVICE_TYPES.dedicatedServers,
};

function niscDisplayName(name: string | null | undefined): string {
	const cleaned = (name ?? "")
		.replace(/\bhivelocity\b/gi, "")
		.replace(/\s+/g, " ")
		.trim();
	return cleaned || "Custom plan";
}

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 24;

function parseMemoryGb(mem: string | undefined): number | null {
	if (!mem) return null;
	const lower = mem.toLowerCase().replace(/,/g, "");
	const units: Record<string, number> = { mb: 1 / 1024, gb: 1, tb: 1024 };
	let total = 0;
	const re =
		/(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)\s*(mb|gb|tb)|(\d+(?:\.\d+)?)\s*(mb|gb|tb)/gi;
	let match: RegExpExecArray | null;
	while ((match = re.exec(lower)) !== null) {
		if (match[1] && match[2] && match[3]) {
			total += Number(match[1]) * Number(match[2]) * (units[match[3]] ?? 1);
		} else if (match[4] && match[5]) {
			total += Number(match[4]) * (units[match[5]] ?? 1);
		}
	}
	return total > 0 ? total : null;
}

function parseDiskGb(drive: string | undefined, driveInfo: unknown): number | null {
	if (driveInfo && typeof driveInfo === "object" && !Array.isArray(driveInfo)) {
		const r = driveInfo as Record<string, unknown>;
		const size = r.size ?? r.capacity ?? r.total;
		if (typeof size === "number" && size > 0) {
			return size > 10_000 ? size / 1024 : size;
		}
		if (typeof size === "string") {
			const parsed = parseMemoryGb(size);
			if (parsed != null) return parsed;
		}
	}
	return parseMemoryGb(drive);
}

function parseCores(product: HivelocityProductStock): number | null {
	const info = product.processor_info;
	if (info && typeof info === "object" && !Array.isArray(info)) {
		const r = info as Record<string, unknown>;
		if (typeof r.vcpus === "number" && r.vcpus > 0) return r.vcpus;
		if (typeof r.cores === "number" && r.cores > 0) return r.cores;
	}
	const text = `${product.product_cpu_cores ?? ""} ${product.product_cpu ?? ""}`.replace(
		/<[^>]*>/g,
		" ",
	);
	const labeled = text.match(/(\d+)\s*(?:v\s*cpus?|cpus?|cores?)/i);
	if (labeled?.[1]) return Number(labeled[1]);
	return null;
}

function cpuBrand(name: string | undefined): "intel" | "amd" | null {
	const n = (name ?? "").toLowerCase();
	if (n.includes("amd")) return "amd";
	if (n.includes("intel")) return "intel";
	return null;
}

function specDistance(actual: number | null, wanted: number): number {
	if (actual == null || !Number.isFinite(actual) || actual <= 0) return 45;
	const diff = actual - wanted;
	if (diff === 0) return 0;
	const ratio = Math.abs(diff) / wanted;
	if (diff > 0) return Math.min(18, ratio * 12);
	return Math.min(80, ratio * 50);
}

function locationHaystack(
	product: HivelocityProductStock,
	titleByCode: Map<string, string>,
): string {
	return [product.data_center, titleByCode.get(product.data_center)]
		.filter(Boolean)
		.join(" ")
		.toLowerCase();
}

function parseSpecFromSearch(search: string): CloudPlanQuery {
	const q: CloudPlanQuery = {};
	let rest = search.toLowerCase();

	const disk = rest.match(/(\d+(?:\.\d+)?)\s*(gb|tb)\s*(?:ssd|nvme|hdd|disk|storage|drive)/i);
	if (disk) {
		const n = Number(disk[1]);
		q.diskGb = disk[2]?.toLowerCase() === "tb" ? n * 1024 : n;
		rest = rest.replace(disk[0], " ");
	}

	const ram = rest.match(/(\d+(?:\.\d+)?)\s*(gb|tb)(?:\s*ram)?/i);
	if (ram) {
		const n = Number(ram[1]);
		q.ramGb = ram[2]?.toLowerCase() === "tb" ? n * 1024 : n;
		rest = rest.replace(ram[0], " ");
	}

	const cores = rest.match(/(\d+)\s*(?:v\s*cpus?|cpus?|cores?)/i);
	if (cores) {
		q.cores = Number(cores[1]);
		rest = rest.replace(cores[0], " ");
	}

	if (/\bamd\b/i.test(rest)) {
		q.cpu = "amd";
		rest = rest.replace(/\bamd\b/gi, " ");
	} else if (/\bintel\b/i.test(rest)) {
		q.cpu = "intel";
		rest = rest.replace(/\bintel\b/gi, " ");
	}

	const location = rest
		.replace(/\b(vps|vds|dedicated|server|servers|plan|plans|ram|cpu|core|with|and|the|a|an)\b/gi, " ")
		.replace(/\s+/g, " ")
		.trim();
	if (location.length >= 2) q.location = location;

	return q;
}

function hasMachineSpec(q: CloudPlanQuery): boolean {
	return q.ramGb != null || q.cores != null || q.cpu != null || q.diskGb != null;
}

function hasSpec(q: CloudPlanQuery): boolean {
	return hasMachineSpec(q) || Boolean(q.location?.trim());
}

function filterSummary(q: CloudPlanQuery): string | null {
	const parts: string[] = [];
	if (q.ramGb != null) parts.push(`${q.ramGb} GB RAM`);
	if (q.cores != null) parts.push(`${q.cores} cores`);
	if (q.cpu) parts.push(q.cpu === "amd" ? "AMD" : "Intel");
	if (q.diskGb != null) parts.push(`${q.diskGb} GB disk`);
	if (q.location?.trim()) parts.push(q.location.trim());
	return parts.length ? parts.join(" · ") : null;
}

function scorePlan(
	product: HivelocityProductStock,
	wanted: CloudPlanQuery,
	titleByCode: Map<string, string>,
): number {
	let score = 0;
	if (wanted.ramGb != null) score += specDistance(parseMemoryGb(product.product_memory), wanted.ramGb);
	if (wanted.cores != null) score += specDistance(parseCores(product), wanted.cores);
	if (wanted.diskGb != null) {
		score += specDistance(parseDiskGb(product.product_drive, product.product_drive_info), wanted.diskGb) * 0.6;
	}
	if (wanted.cpu) {
		const brand = cpuBrand(product.product_name);
		score += brand === wanted.cpu ? 0 : 22;
	}
	if (wanted.location?.trim()) {
		const loc = wanted.location.trim().toLowerCase();
		score += locationHaystack(product, titleByCode).includes(loc) ? 0 : 16;
	}
	if (product.stock === "unavailable") score += 35;
	else if (product.stock === "limited") score += 4;
	score += (product.product_monthly_price ?? 0) / 50_000;
	return score;
}

function matchesPlanKind(product: HivelocityProductStock, kind: CloudPlanKind): boolean {
	if (kind === "vps") return product.is_vps === true;
	if (kind === "vds") return product.is_vds === true;
	return product.is_vps === false && product.is_vds === false;
}

function usdByPeriod(p: HivelocityProductStock): CloudPlanCheckout["usdByPeriod"] {
	const monthly = Number(p.product_monthly_price ?? 0);
	return {
		hourly: monthly,
		monthly,
		quarterly: Number(p.product_quarterly_price ?? monthly * 3),
		"semi-annually": Number(p.product_semi_annually_price ?? monthly * 6),
		annually: Number(p.product_annually_price ?? monthly * 12),
		biennial: Number(p.product_biennial_price ?? monthly * 24),
		triennial: Number(p.product_triennial_price ?? monthly * 36),
	};
}

function toRetail(usd: number, margin: Awaited<ReturnType<typeof getDefaultHivelocityMarginSettings>>, kesRate: number | null): number {
	const margined = applyHivelocityMarginUsd(margin, usd);
	if (kesRate != null && Number.isFinite(kesRate) && kesRate > 0) {
		return ceilConvertedPrice(margined * kesRate);
	}
	return margined;
}

async function resolveNiscProductId(kind: CloudPlanKind): Promise<string> {
	const canonical = KIND_TO_CANONICAL_ID[kind];
	const serviceType = KIND_TO_SERVICE_TYPE[kind];
	const products = await db.query.niscProduct.findMany({
		where: and(
			eq(niscProduct.isActive, true),
			eq(niscProduct.hidden, false),
			or(eq(niscProduct.serviceType, serviceType), ilike(niscProduct.name, `%${kind} hosting%`)),
		),
		columns: { id: true },
	});
	return pickActivePlanlessProductId(products, canonical) ?? canonical;
}

export async function agentGetCloudPlans(
	params: CloudPlanQuery & { kind: CloudPlanKind },
): Promise<CloudPlansResult> {
	const kind = params.kind;
	const limit = Math.min(MAX_LIMIT, Math.max(1, params.limit ?? DEFAULT_LIMIT));
	const cursor = Math.max(0, params.cursor ?? 0);
	const search = params.search?.trim().toLowerCase() ?? "";
	const parsedFromSearch = !hasSpec(params) && search ? parseSpecFromSearch(search) : {};
	const spec: CloudPlanQuery = {
		ramGb: params.ramGb ?? parsedFromSearch.ramGb,
		cores: params.cores ?? parsedFromSearch.cores,
		cpu: params.cpu ?? parsedFromSearch.cpu,
		diskGb: params.diskGb ?? parsedFromSearch.diskGb,
		location: params.location ?? parsedFromSearch.location,
	};
	const bestMatch = hasMachineSpec(spec);
	const productType = KIND_TO_PRODUCT_TYPE[kind];

	try {
		const [inventory, facilities, margin, kesRate, niscProductId] = await Promise.all([
			getCachedHivelocityInventory({ location: "MAIN", include_custom: false }),
			getCachedHivelocityFacilities().catch(() => [] as Awaited<ReturnType<typeof getCachedHivelocityFacilities>>),
			getDefaultHivelocityMarginSettings(productType),
			resolveUsdToKesExchangeRate(),
			resolveNiscProductId(kind),
		]);

		const titleByCode = new Map<string, string>();
		for (const f of facilities) {
			const label = f.title?.trim() || [f.location?.city, f.location?.country].filter(Boolean).join(", ");
			if (label) titleByCode.set(f.code, label);
		}

		const displayCurrency: "KES" | "USD" = kesRate != null ? "KES" : "USD";

		let rows = Object.values(inventory).flat().filter((p) => matchesPlanKind(p, kind));

		if (spec.location?.trim() && !bestMatch) {
			const loc = spec.location.trim().toLowerCase();
			const inLocation = rows.filter((p) => locationHaystack(p, titleByCode).includes(loc));
			if (inLocation.length > 0) rows = inLocation;
		}

		if (bestMatch) {
			if (spec.location?.trim()) {
				const loc = spec.location.trim().toLowerCase();
				const inLocation = rows.filter((p) => locationHaystack(p, titleByCode).includes(loc));
				if (inLocation.length > 0) rows = inLocation;
			}
			rows.sort((a, b) => scorePlan(a, spec, titleByCode) - scorePlan(b, spec, titleByCode));
		} else if (search.length > 0) {
			rows = rows.filter((p) => {
				const locationLabel = titleByCode.get(p.data_center) ?? p.data_center;
				const hay = [
					p.product_name,
					p.product_cpu,
					p.product_memory,
					p.product_drive,
					p.product_bandwidth,
					p.data_center,
					locationLabel,
				]
					.filter(Boolean)
					.join(" ")
					.toLowerCase();
				return hay.includes(search);
			});
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
		} else {
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
		}

		const totalCount = bestMatch ? Math.min(1, rows.length) : rows.length;
		const pageLimit = bestMatch ? 1 : limit;
		const pageCursor = bestMatch ? 0 : cursor;
		const slice = rows.slice(pageCursor, pageCursor + pageLimit);
		const nextCursor =
			bestMatch || pageCursor + slice.length >= rows.length ? null : pageCursor + slice.length;

		const plans: CloudPlanEntry[] = slice.map((p) => {
			const monthlyUsd = Number(p.product_monthly_price ?? 0);
			const hourlyUsd = Number(p.product_hourly_price ?? 0);
			const originalUsd = p.product_original_price != null ? Number(p.product_original_price) : undefined;
			const periods = usdByPeriod(p);

			return {
				product_id: p.product_id,
				product_name: niscDisplayName(p.product_name),
				data_center: p.data_center,
				locationDisplayName: titleByCode.get(p.data_center) ?? p.data_center,
				location_option_id: p.location_option_id,
				stock: p.stock,
				is_vps: p.is_vps,
				is_vds: p.is_vds,
				product_cpu: p.product_cpu,
				product_cpu_cores: p.product_cpu_cores,
				processor_info: p.processor_info,
				product_memory: p.product_memory,
				product_drive: p.product_drive,
				product_drive_info: p.product_drive_info,
				product_bandwidth: p.product_bandwidth,
				product_new: p.product_new,
				product_on_sale: p.product_on_sale,
				product_hourly_price: toRetail(hourlyUsd, margin, kesRate),
				product_monthly_price: toRetail(monthlyUsd, margin, kesRate),
				product_original_price:
					originalUsd != null && Number.isFinite(originalUsd)
						? toRetail(originalUsd, margin, kesRate)
						: undefined,
				checkout: {
					productType,
					inventoryProductId: p.product_id,
					locationName: p.data_center,
					disabledBillingPeriods: p.product_disabled_billing_periods ?? [],
					usdMonthly: monthlyUsd,
					usdHourly: hourlyUsd,
					usdByPeriod: periods,
				},
			};
		});

		return {
			_tool: KIND_TO_TOOL[kind],
			kind,
			displayCurrency,
			niscProductId,
			search,
			filterSummary: bestMatch ? filterSummary(spec) : null,
			matchMode: bestMatch ? "best" : "browse",
			plans,
			totalCount,
			hasMore: nextCursor != null,
			nextCursor,
			checkedAt: new Date().toISOString(),
		};
	} catch (e) {
		throw new Error(
			resolveHivelocityPublicMessageFromError(
				e,
				"Couldn't load those plans right now. Please try again.",
			),
		);
	}
}

function toCloudPlanQuery(
	opts?: CloudPlanQuery & {
		ram_gb?: number;
		disk_gb?: number;
	},
): CloudPlanQuery {
	if (!opts) return {};
	return {
		search: opts.search,
		limit: opts.limit,
		cursor: opts.cursor,
		ramGb: opts.ramGb ?? opts.ram_gb,
		cores: opts.cores,
		cpu: opts.cpu,
		diskGb: opts.diskGb ?? opts.disk_gb,
		location: opts.location,
	};
}

export async function agentGetVpsPlans(
	opts?: CloudPlanQuery & { ram_gb?: number; disk_gb?: number },
) {
	return agentGetCloudPlans({ kind: "vps", ...toCloudPlanQuery(opts) });
}

export async function agentGetVdsPlans(
	opts?: CloudPlanQuery & { ram_gb?: number; disk_gb?: number },
) {
	return agentGetCloudPlans({ kind: "vds", ...toCloudPlanQuery(opts) });
}

export async function agentGetDedicatedServerPlans(
	opts?: CloudPlanQuery & { ram_gb?: number; disk_gb?: number },
) {
	return agentGetCloudPlans({ kind: "dedicated", ...toCloudPlanQuery(opts) });
}
