import { eq } from "@npanel/db";
import { db } from "@npanel/db";
import { hostingPlan, hostingSubscription } from "@npanel/db/schema/hosting";

/** Service types provisioned on Plesk. Upgrades must switch the live webspace plan. */
export const PLESK_UPGRADE_SERVICE_TYPES = new Set([
	"web_hosting",
	"email_hosting",
	"wordpress_hosting",
	"website_hosting",
]);

/** Infra upgrades that already have their own provider flow, or are planless. */
export const NON_CATALOG_UPGRADE_SERVICE_TYPES = new Set([
	"dedicated_server_hosting",
	"vps_hosting",
	"vds_hosting",
	"domain_registration",
	"domain_transfer",
	"domains",
]);

const GUID_RE =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isPleskGuid(value: string): boolean {
	return GUID_RE.test(value.trim());
}

export function parseMoneyAmount(value: string | null | undefined): number | null {
	if (value == null) return null;
	const normalized = String(value).replace(/,/g, "").trim();
	if (!normalized) return null;
	const n = Number.parseFloat(normalized);
	return Number.isFinite(n) ? n : null;
}

export function currentCatalogPrice(params: {
	planPrice?: string | null;
	agreedPrice?: string | null;
}): number {
	return parseMoneyAmount(params.planPrice) ?? parseMoneyAmount(params.agreedPrice) ?? 0;
}

export type CatalogPlanIdentity = {
	id: string;
	name: string;
	sortOrder: number;
	billingCycle?: string | null;
	pleskServicePlanId?: string | null;
	pleskFilterId?: string | null;
};

export function catalogPlanRank(plan: { sortOrder?: number | null }): number {
	return typeof plan.sortOrder === "number" && Number.isFinite(plan.sortOrder) ? plan.sortOrder : 0;
}

function normToken(value?: string | null): string {
	return value?.trim().toLowerCase() ?? "";
}

function scalarHint(value: unknown): string | null {
	if (typeof value === "string" && value.trim()) return value.trim();
	if (typeof value === "number" && Number.isFinite(value)) return String(value);
	return null;
}

/** Plan identity already stored on the subscription (serviceRefs / metadata), never a live Plesk read. */
export function extractStoredPlanHints(source: unknown): {
	productPlanId?: string | null;
	pleskPlanId?: string | null;
	pleskPlanGuid?: string | null;
	pleskPlanName?: string | null;
} {
	if (!source || typeof source !== "object" || Array.isArray(source)) return {};
	const rec = source as Record<string, unknown>;
	return {
		productPlanId: scalarHint(rec.productPlanId),
		pleskPlanId:
			scalarHint(rec.pleskServicePlanId) ??
			scalarHint(rec.pleskPlanId) ??
			scalarHint(rec.planId) ??
			scalarHint(rec.servicePlanId),
		pleskPlanGuid: scalarHint(rec.pleskPlanGuid) ?? scalarHint(rec.planGuid),
		pleskPlanName:
			scalarHint(rec.pleskPlanName) ??
			scalarHint(rec.planName) ??
			scalarHint(rec.servicePlanName),
	};
}

/** Resolve the catalog plan the subscription is actually on (plan id / stored service plan), never agreed price. */
export function matchCatalogPlanByServiceDetails(
	plans: CatalogPlanIdentity[],
	details: {
		productPlanId?: string | null;
		pleskPlanId?: string | null;
		pleskPlanGuid?: string | null;
		pleskPlanName?: string | null;
	},
): CatalogPlanIdentity | null {
	if (details.productPlanId) {
		const byId = plans.find((plan) => plan.id === details.productPlanId);
		if (byId) return byId;
	}

	const tokens = [details.pleskPlanId, details.pleskPlanGuid, details.pleskPlanName]
		.map(normToken)
		.filter(Boolean);

	for (const plan of plans) {
		const keys = [plan.pleskServicePlanId, plan.pleskFilterId, plan.name, plan.id]
			.map(normToken)
			.filter(Boolean);
		if (keys.some((key) => tokens.includes(key))) return plan;
	}

	const pleskName = normToken(details.pleskPlanName);
	if (pleskName) {
		const byName = [...plans]
			.sort((a, b) => b.name.length - a.name.length)
			.find((plan) => pleskName.includes(normToken(plan.name)));
		if (byName) return byName;
	}

	return null;
}

export function isHigherCatalogPlan(
	candidate: CatalogPlanIdentity,
	current: CatalogPlanIdentity | null,
): boolean {
	if (current && candidate.id === current.id) return false;
	return catalogPlanRank(candidate) > (current ? catalogPlanRank(current) : -1);
}

export function getPleskWebspaceId(sub: {
	serviceRefs?: unknown;
	pleskFilterId?: string | null;
}): number | null {
	let pleskId: string | null = null;
	const refs = sub.serviceRefs as Record<string, unknown> | null;
	if (
		refs &&
		(typeof refs.pleskSubscriptionId === "string" || typeof refs.pleskSubscriptionId === "number")
	) {
		pleskId = String(refs.pleskSubscriptionId);
	}
	if (!pleskId && sub.pleskFilterId) {
		pleskId = sub.pleskFilterId;
	}
	if (!pleskId) return null;
	const num = Number.parseInt(pleskId, 10);
	return Number.isFinite(num) && num > 0 ? num : null;
}

export function toCatalogPlanIdentity(plan: {
	id: string;
	name: string;
	sortOrder: number;
	billingCycle?: string | null;
	pleskServicePlanId?: string | null;
	pleskFilterId?: string | null;
}): CatalogPlanIdentity {
	return {
		id: plan.id,
		name: plan.name,
		sortOrder: plan.sortOrder,
		billingCycle: plan.billingCycle,
		pleskServicePlanId: plan.pleskServicePlanId,
		pleskFilterId: plan.pleskFilterId,
	};
}

async function loadLinkedHostingPlan(sub: {
	hostingSubscriptionId?: string | null;
	pleskFilterId?: string | null;
	serviceRefs?: unknown;
}) {
	if (sub.hostingSubscriptionId) {
		const [row] = await db
			.select({
				name: hostingPlan.name,
				pleskServicePlanId: hostingPlan.pleskServicePlanId,
				pleskFilterId: hostingPlan.pleskFilterId,
			})
			.from(hostingSubscription)
			.innerJoin(hostingPlan, eq(hostingSubscription.hostingPlanId, hostingPlan.id))
			.where(eq(hostingSubscription.id, sub.hostingSubscriptionId))
			.limit(1);
		if (row) return row;
	}

	const webspaceId = getPleskWebspaceId(sub);
	if (!webspaceId) return null;

	const [row] = await db
		.select({
			name: hostingPlan.name,
			pleskServicePlanId: hostingPlan.pleskServicePlanId,
			pleskFilterId: hostingPlan.pleskFilterId,
		})
		.from(hostingSubscription)
		.innerJoin(hostingPlan, eq(hostingSubscription.hostingPlanId, hostingPlan.id))
		.where(eq(hostingSubscription.pleskFilterId, String(webspaceId)))
		.limit(1);
	return row ?? null;
}

/**
 * Current catalog plan from local rows only: productPlanId, stored service details,
 * then hosting_plan if the subscription is linked. No live Plesk reads.
 */
export async function resolveCurrentCatalogPlanFromDb(
	plans: Array<{
		id: string;
		name: string;
		sortOrder: number;
		billingCycle?: string | null;
		pleskServicePlanId?: string | null;
		pleskFilterId?: string | null;
	}>,
	sub: {
		productPlanId?: string | null;
		hostingSubscriptionId?: string | null;
		pleskFilterId?: string | null;
		serviceRefs?: unknown;
		metadata?: unknown;
	},
): Promise<CatalogPlanIdentity | null> {
	const catalog = plans.map(toCatalogPlanIdentity);

	const fromProductPlan = matchCatalogPlanByServiceDetails(catalog, {
		productPlanId: sub.productPlanId,
	});
	if (fromProductPlan) return fromProductPlan;

	const fromStored = matchCatalogPlanByServiceDetails(catalog, {
		...extractStoredPlanHints(sub.metadata),
		...extractStoredPlanHints(sub.serviceRefs),
	});
	if (fromStored) return fromStored;

	const hostingPlanRow = await loadLinkedHostingPlan(sub);
	if (!hostingPlanRow) return null;

	return matchCatalogPlanByServiceDetails(catalog, {
		pleskPlanId: hostingPlanRow.pleskServicePlanId,
		pleskPlanGuid: hostingPlanRow.pleskFilterId,
		pleskPlanName: hostingPlanRow.name,
	});
}
