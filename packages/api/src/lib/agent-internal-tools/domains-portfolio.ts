/**
 * Domains portfolio for the Zeepo AI Agent.
 *
 * Agency view  – merges live registry data with .ke subscriptions from the DB,
 *                matching what the agency/domains-portfolio page shows.
 *
 * Customer view – reads nisc_client_subscription rows scoped to the session team
 *                 (same source as the /$slug/domains-portfolio page).
 */

import { and, desc, eq, ilike, inArray, isNotNull, like } from "@npanel/db";
import { db } from "@npanel/db";
import { niscClientSubscription, niscProduct } from "@npanel/db/schema/products";
import { user as userTable } from "@npanel/db/schema/auth";
import { team as teamTable } from "@npanel/db/schema/teams";
import { createOpenProviderClient } from "../openprovider-client";
import { getRedisClient } from "../redis";
import { domainProductSqlFilter } from "../nisc-domain-product";

// ── Shared types ──────────────────────────────────────────────────────────────

export type PortfolioDomainStatus =
	| "ACTIVE"
	| "EXPIRED"
	| "PENDING"
	| "SUSPENDED"
	| "UNKNOWN";

export interface PortfolioDomainEntry {
	domain: string;
	status: PortfolioDomainStatus;
	expiryDate: string | null;
	registrationDate: string | null;
	autoRenewal: boolean;
	// Internal tracking only - not exposed to agent
	// source: "openprovider" | "kenic" | "subscription";
	/** Agency only – registrant/team name from registry or subscription record */
	clientName?: string;
}

export interface DomainsPortfolioResult {
	_tool: "get_domains_portfolio";
	/** true = agency-wide portfolio; false = team-scoped customer portfolio */
	isAgency: boolean;
	/** Customer only: the team name to display (e.g. "you own these under Acme Ltd") */
	teamName: string | null;
	domains: PortfolioDomainEntry[];
	totalCount: number;
	activeCount: number;
	expiredCount: number;
	/** true when the backend returned results but there are more (OP pagination cap) */
	hasMore: boolean;
	checkedAt: string;
}

// ── OpenProvider token cache (shared with domains.ts) ────────────────────────

const OP_TOKEN_KEY = "openprovider:auth-token";

async function getOpToken(): Promise<string | null> {
	const redis = getRedisClient();
	if (!redis) return null;
	try {
		const cached = await redis.get(OP_TOKEN_KEY);
		if (!cached) return null;
		const parsed =
			typeof cached === "string"
				? (JSON.parse(cached) as { token?: string; expiresAt?: number })
				: (cached as { token?: string; expiresAt?: number });
		if (
			parsed?.token &&
			typeof parsed.expiresAt === "number" &&
			parsed.expiresAt > Date.now()
		) {
			return parsed.token;
		}
	} catch {
		/* ignore */
	}
	return null;
}

async function cacheOpToken(token: string): Promise<void> {
	const redis = getRedisClient();
	if (!redis) return;
	const TTL = 47 * 60 * 60;
	const expiresAt = Date.now() + TTL * 1000;
	await redis
		.setex(OP_TOKEN_KEY, TTL, JSON.stringify({ token, expiresAt }))
		.catch(() => {});
}

// ── Status helpers ────────────────────────────────────────────────────────────

function opStatusToPortfolio(
	rawStatus: string,
	expiryDate?: string,
): PortfolioDomainStatus {
	const now = new Date();
	if (expiryDate && new Date(expiryDate) < now) return "EXPIRED";
	const map: Record<string, PortfolioDomainStatus> = {
		ACT: "ACTIVE",
		ACTIVE: "ACTIVE",
		REQ: "PENDING",
		PENDING: "PENDING",
		DEL: "EXPIRED",
		EXPIRED: "EXPIRED",
		FAIL: "SUSPENDED",
		SUSPENDED: "SUSPENDED",
	};
	return map[rawStatus.toUpperCase()] ?? "UNKNOWN";
}

const SUB_STATUS_MAP: Record<string, PortfolioDomainStatus> = {
	ACTIVE: "ACTIVE",
	PENDING: "PENDING",
	PROCESSING: "PENDING",
	SUSPENDED: "SUSPENDED",
	CANCELLED: "EXPIRED",
	EXPIRED: "EXPIRED",
	FAILED: "UNKNOWN",
	UPGRADED: "ACTIVE",
	DOWNGRADED: "ACTIVE",
};

// ── Agency portfolio ──────────────────────────────────────────────────────────

const OP_PAGE_SIZE = 100;

async function fetchAgencyPortfolio(): Promise<DomainsPortfolioResult> {
	const [opEntries, kenicEntries] = await Promise.all([
		fetchOpenProviderDomains(),
		fetchKenicDomains(),
	]);

	const domains = [...opEntries.entries, ...kenicEntries];

	const activeCount = domains.filter((d) => d.status === "ACTIVE").length;
	const expiredCount = domains.filter((d) => d.status === "EXPIRED").length;

	// Sort: active first, then by domain name
	domains.sort((a, b) => {
		if (a.status === "ACTIVE" && b.status !== "ACTIVE") return -1;
		if (a.status !== "ACTIVE" && b.status === "ACTIVE") return 1;
		return a.domain.localeCompare(b.domain);
	});

	return {
		_tool: "get_domains_portfolio",
		isAgency: true,
		teamName: null,
		domains,
		totalCount: domains.length,
		activeCount,
		expiredCount,
		hasMore: opEntries.hasMore,
		checkedAt: new Date().toISOString(),
	};
}

async function fetchOpenProviderDomains(): Promise<{
	entries: PortfolioDomainEntry[];
	hasMore: boolean;
}> {
	const entries: PortfolioDomainEntry[] = [];
	try {
		const client = createOpenProviderClient();
		const cached = await getOpToken();
		if (cached) {
			client.setToken(cached);
		} else {
			const auth = await client.authenticate({
				username: process.env.OPENPROVIDER_USERNAME ?? "",
				password: process.env.OPENPROVIDER_PASSWORD ?? "",
			});
			if (auth?.data?.token) await cacheOpToken(auth.data.token);
		}

		const resp = await client.searchDomains({
			limit: OP_PAGE_SIZE,
			offset: 0,
			with_customer_info: false,
		} as any);

		if (resp?.code !== 0) return { entries, hasMore: false };

		const results = (resp.data?.results ?? []) as any[];
		const total: number = resp.data?.total ?? results.length;

		for (const d of results) {
			const domainStr =
				typeof d.domain === "object"
					? `${d.domain.name}.${d.domain.extension}`
					: String(d.domain ?? "");
			if (!domainStr) continue;

			const ownerName =
				d.owner_handle ??
				d.customerName ??
				"";

			entries.push({
				domain: domainStr,
				status: opStatusToPortfolio(
					d.status ?? "",
					d.expiration_date,
				),
				expiryDate: d.expiration_date ?? null,
				registrationDate: d.creation_date ?? null,
				autoRenewal: d.autorenew === "on",
				// source: "openprovider", // Hidden from agent
				clientName: ownerName || undefined,
			});
		}

		return { entries, hasMore: total > OP_PAGE_SIZE };
	} catch {
		return { entries, hasMore: false };
	}
}

async function fetchKenicDomains(): Promise<PortfolioDomainEntry[]> {
	try {
		const rows = await db
			.select({
				primaryDomain: niscClientSubscription.primaryDomain,
				status: niscClientSubscription.status,
				expiryDate: niscClientSubscription.expiryDate,
				subscriptionDate: niscClientSubscription.subscriptionDate,
				userName: userTable.name,
				teamName: teamTable.name,
			})
			.from(niscClientSubscription)
			.innerJoin(niscProduct, eq(niscClientSubscription.productId, niscProduct.id))
			.leftJoin(userTable, eq(niscClientSubscription.userId, userTable.id))
			.leftJoin(teamTable, eq(niscClientSubscription.teamId, teamTable.id))
			.where(
				and(
					isNotNull(niscClientSubscription.primaryDomain),
					like(niscClientSubscription.primaryDomain, "%.ke"),
					domainProductSqlFilter(),
				),
			)
			.orderBy(desc(niscClientSubscription.subscriptionDate));

		const now = new Date();
		return rows.map((row) => {
			const domain = row.primaryDomain ?? "";
			const expiry =
				row.expiryDate ??
				new Date(
					(row.subscriptionDate ?? now).getTime() +
						365 * 24 * 60 * 60 * 1000,
				);
			const isExpired = expiry < now;
			const mappedStatus: PortfolioDomainStatus = isExpired
				? "EXPIRED"
				: (SUB_STATUS_MAP[row.status] ?? "ACTIVE");

			return {
				domain,
				status: mappedStatus,
				expiryDate: expiry.toISOString(),
				registrationDate: row.subscriptionDate?.toISOString() ?? null,
				autoRenewal: false,
				// source: "kenic" as const, // Hidden from agent
				clientName: row.teamName ?? row.userName ?? undefined,
			};
		});
	} catch {
		return [];
	}
}

// ── Customer portfolio ────────────────────────────────────────────────────────

async function fetchCustomerPortfolio(
	teamId: string,
	teamName: string | null,
): Promise<DomainsPortfolioResult> {
	try {
		// Resolve domain product IDs (Domains product only  never hosting with a .ke primaryDomain).
		const domainProducts = await db
			.select({ id: niscProduct.id })
			.from(niscProduct)
			.where(and(eq(niscProduct.isActive, true), domainProductSqlFilter()));
		const productIds = domainProducts.map((p) => p.id);

		const domains: PortfolioDomainEntry[] = [];

		if (productIds.length > 0) {
			const subs = await db.query.niscClientSubscription.findMany({
				where: and(
					eq(niscClientSubscription.teamId, teamId),
					inArray(niscClientSubscription.productId, productIds),
				),
				orderBy: (s, { desc: d }) => [d(s.createdAt)],
				columns: {
					primaryDomain: true,
					status: true,
					subscriptionDate: true,
					expiryDate: true,
					autoRenew: true,
				},
			});

			for (const sub of subs) {
				if (!sub.primaryDomain) continue;
				const now = new Date();
				const expiry = sub.expiryDate ?? null;
				const isExpired = expiry ? expiry < now : false;
				const mappedStatus: PortfolioDomainStatus = isExpired
					? "EXPIRED"
					: (SUB_STATUS_MAP[sub.status] ?? "ACTIVE");

				domains.push({
					domain: sub.primaryDomain,
					status: mappedStatus,
					expiryDate: expiry?.toISOString() ?? null,
					registrationDate: sub.subscriptionDate?.toISOString() ?? null,
					autoRenewal: sub.autoRenew ?? false,
					// source: "subscription", // Hidden from agent
				});
			}
		}

		// Sort: active first, then by expiry (soonest first)
		domains.sort((a, b) => {
			if (a.status === "ACTIVE" && b.status !== "ACTIVE") return -1;
			if (a.status !== "ACTIVE" && b.status === "ACTIVE") return 1;
			return a.domain.localeCompare(b.domain);
		});

		const activeCount = domains.filter((d) => d.status === "ACTIVE").length;
		const expiredCount = domains.filter((d) => d.status === "EXPIRED").length;

		return {
			_tool: "get_domains_portfolio",
			isAgency: false,
			teamName,
			domains,
			totalCount: domains.length,
			activeCount,
			expiredCount,
			hasMore: false,
			checkedAt: new Date().toISOString(),
		};
	} catch {
		return {
			_tool: "get_domains_portfolio",
			isAgency: false,
			teamName,
			domains: [],
			totalCount: 0,
			activeCount: 0,
			expiredCount: 0,
			hasMore: false,
			checkedAt: new Date().toISOString(),
		};
	}
}

// ── Public entry point ────────────────────────────────────────────────────────

export async function agentGetDomainsPortfolio(params: {
	isAgency: boolean;
	teamId: string | null;
	teamName: string | null;
}): Promise<DomainsPortfolioResult> {
	if (params.isAgency) {
		return fetchAgencyPortfolio();
	}
	if (!params.teamId) {
		return {
			_tool: "get_domains_portfolio",
			isAgency: false,
			teamName: params.teamName,
			domains: [],
			totalCount: 0,
			activeCount: 0,
			expiredCount: 0,
			hasMore: false,
			checkedAt: new Date().toISOString(),
		};
	}
	return fetchCustomerPortfolio(params.teamId, params.teamName);
}
