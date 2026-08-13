/**
 * Existing VPS / VDS / dedicated subscriptions for Zeepo AI.
 *
 * Agency admin+ → all teams. Customers and AGENCY_USER → active team only.
 * Never returns other teams' servers. Never includes upstream vendor fields.
 */

import { and, eq, ilike, inArray, or } from "@npanel/db";
import { db } from "@npanel/db";
import { niscClientSubscription, niscProduct } from "@npanel/db/schema/products";
import { team as teamTable } from "@npanel/db/schema/teams";
import { PLANLESS_SERVICE_TYPES } from "../planless-services-billing";

export type CloudServerKind = "vps" | "vds" | "dedicated";

export interface CloudServerEntry {
	name: string;
	status: "Active" | "Suspended" | "Pending" | "Unknown";
	kind: CloudServerKind;
	hostname: string | null;
	location: string | null;
	billingCycle: string | null;
	expiryDate: string | null;
	nextRenewalDate: string | null;
	autoRenew: boolean | null;
	price: string | null;
	currency: string | null;
	teamName: string | null;
}

export interface CloudServersResult {
	_tool: "get_cloud_servers";
	kind: CloudServerKind | "all";
	isAgency: boolean;
	teamName: string | null;
	servers: CloudServerEntry[];
	totalCount: number;
	activeCount: number;
	suspendedCount: number;
	checkedAt: string;
	error?: string;
}

const SERVICE_TYPE_BY_KIND: Record<CloudServerKind, string> = {
	vps: PLANLESS_SERVICE_TYPES.vpsHosting,
	vds: PLANLESS_SERVICE_TYPES.vdsHosting,
	dedicated: PLANLESS_SERVICE_TYPES.dedicatedServers,
};

const NAME_FILTER_BY_KIND: Record<CloudServerKind, string> = {
	vps: "%vps hosting%",
	vds: "%vds hosting%",
	dedicated: "%dedicated servers hosting%",
};

const MAX_ROWS = 50;

function mapStatus(raw: string | null | undefined): CloudServerEntry["status"] {
	const s = (raw ?? "").toUpperCase();
	if (s === "ACTIVE") return "Active";
	if (s === "SUSPENDED") return "Suspended";
	if (s === "PENDING") return "Pending";
	return "Unknown";
}

function productWhere(kind: CloudServerKind | "all") {
	if (kind === "all") {
		return or(
			eq(niscProduct.serviceType, SERVICE_TYPE_BY_KIND.vps),
			eq(niscProduct.serviceType, SERVICE_TYPE_BY_KIND.vds),
			eq(niscProduct.serviceType, SERVICE_TYPE_BY_KIND.dedicated),
			ilike(niscProduct.name, NAME_FILTER_BY_KIND.vps),
			ilike(niscProduct.name, NAME_FILTER_BY_KIND.vds),
			ilike(niscProduct.name, NAME_FILTER_BY_KIND.dedicated),
		);
	}
	return or(
		eq(niscProduct.serviceType, SERVICE_TYPE_BY_KIND[kind]),
		ilike(niscProduct.name, NAME_FILTER_BY_KIND[kind]),
	);
}

function inferKind(serviceType: string | null, productName: string | null): CloudServerKind {
	const st = (serviceType ?? "").toLowerCase();
	const name = (productName ?? "").toLowerCase();
	if (st === SERVICE_TYPE_BY_KIND.vds || name.includes("vds")) return "vds";
	if (st === SERVICE_TYPE_BY_KIND.dedicated || name.includes("dedicated")) return "dedicated";
	return "vps";
}

function readMetaString(meta: unknown, keys: string[]): string | null {
	if (!meta || typeof meta !== "object" || Array.isArray(meta)) return null;
	const rec = meta as Record<string, unknown>;
	for (const key of keys) {
		const v = rec[key];
		if (typeof v === "string" && v.trim()) {
			return v.replace(/\bhivelocity\b/gi, "").replace(/\s+/g, " ").trim() || null;
		}
	}
	return null;
}

export async function agentGetCloudServers(params: {
	kind?: CloudServerKind | "all";
	isAgency: boolean;
	teamId: string | null;
	teamName: string | null;
}): Promise<CloudServersResult> {
	const kind = params.kind ?? "all";
	const checkedAt = new Date().toISOString();
	const empty = (error?: string): CloudServersResult => ({
		_tool: "get_cloud_servers",
		kind,
		isAgency: params.isAgency,
		teamName: params.teamName,
		servers: [],
		totalCount: 0,
		activeCount: 0,
		suspendedCount: 0,
		checkedAt,
		error,
	});

	if (!params.isAgency && !params.teamId) {
		return empty("Team context is required.");
	}

	const productRows = await db
		.select({ id: niscProduct.id })
		.from(niscProduct)
		.where(productWhere(kind));
	const productIds = [...new Set(productRows.map((r) => r.id))];
	if (productIds.length === 0) return empty();

	const where = params.isAgency
		? inArray(niscClientSubscription.productId, productIds)
		: and(
				eq(niscClientSubscription.teamId, params.teamId!),
				inArray(niscClientSubscription.productId, productIds),
			);

	const subs = await db.query.niscClientSubscription.findMany({
		where,
		orderBy: (s, { desc: d }) => [d(s.createdAt)],
		limit: MAX_ROWS,
		columns: {
			id: true,
			name: true,
			status: true,
			billingCycle: true,
			expiryDate: true,
			nextRenewalDate: true,
			autoRenew: true,
			agreedPrice: true,
			agreedCurrency: true,
			teamId: true,
			metadata: true,
			productId: true,
		},
		with: {
			product: { columns: { name: true, serviceType: true } },
		},
	});

	const teamIds = [
		...new Set(subs.map((s) => s.teamId).filter((id): id is string => Boolean(id))),
	];
	const teamNameById = new Map<string, string>();
	if (params.isAgency && teamIds.length > 0) {
		const teams = await db
			.select({ id: teamTable.id, name: teamTable.name })
			.from(teamTable)
			.where(inArray(teamTable.id, teamIds));
		for (const t of teams) teamNameById.set(t.id, t.name);
	}

	const servers: CloudServerEntry[] = subs.map((sub) => {
		const product = (sub as { product?: { name: string; serviceType: string } }).product;
		const hostname =
			readMetaString(sub.metadata, ["hostname", "hivelocityHostname"]) ?? sub.name ?? null;
		const location = readMetaString(sub.metadata, ["locationDisplayName", "locationName"]);
		return {
			name: sub.name?.trim() || product?.name || "Server",
			status: mapStatus(sub.status),
			kind: inferKind(product?.serviceType ?? null, product?.name ?? null),
			hostname,
			location,
			billingCycle: sub.billingCycle,
			expiryDate: sub.expiryDate?.toISOString() ?? null,
			nextRenewalDate: sub.nextRenewalDate?.toISOString() ?? null,
			autoRenew: sub.autoRenew ?? null,
			price: sub.agreedPrice,
			currency: sub.agreedCurrency,
			teamName: params.isAgency && sub.teamId ? (teamNameById.get(sub.teamId) ?? null) : params.teamName,
		};
	});

	return {
		_tool: "get_cloud_servers",
		kind,
		isAgency: params.isAgency,
		teamName: params.teamName,
		servers,
		totalCount: servers.length,
		activeCount: servers.filter((s) => s.status === "Active").length,
		suspendedCount: servers.filter((s) => s.status === "Suspended").length,
		checkedAt,
	};
}
