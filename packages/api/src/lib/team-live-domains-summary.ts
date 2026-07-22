import { TRPCError } from "@trpc/server";
import { and, eq, inArray, isNotNull, like } from "@npanel/db";
import { db } from "@npanel/db";
import { niscClientSubscription, niscProduct } from "@npanel/db/schema/products";
import { createOpenProviderClient } from "./openprovider-client";
import { domainProductSqlFilter } from "./nisc-domain-product";

type DomainExpiryEntry = {
	domain: string;
	expiryDate: Date;
};

function isExpired(expiryDate: Date, now: Date): boolean {
	return expiryDate < now;
}

function summarizeDomains(domains: DomainExpiryEntry[], now: Date) {
	const total = domains.length;
	const expired = domains.filter((d) => isExpired(d.expiryDate, now)).length;
	return { total, active: total - expired, expired };
}

async function fetchOpenProviderDomainsForTeam(params: {
	openProviderIds: Set<number>;
	domainNames: Set<string>;
}): Promise<DomainExpiryEntry[]> {
	if (params.openProviderIds.size === 0 && params.domainNames.size === 0) {
		return [];
	}

	const client = createOpenProviderClient();
	await client.authenticate({
		username: process.env.OPENPROVIDER_USERNAME!,
		password: process.env.OPENPROVIDER_PASSWORD!,
		ip: process.env.OPENPROVIDER_IP,
	});

	const response = await client.searchDomains({
		limit: 1000,
		offset: 0,
	});

	if (response.code !== 0) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: response.desc,
		});
	}

	const matched: DomainExpiryEntry[] = [];
	for (const domain of response.data.results) {
		let domainString = "";
		if (typeof domain.domain === "string") {
			domainString = domain.domain;
		} else if (domain.domain && typeof domain.domain === "object") {
			const domainObj = domain.domain as { name?: string; extension?: string };
			const ext = domainObj.extension?.startsWith(".")
				? domainObj.extension
				: `.${domainObj.extension ?? ""}`;
			domainString = `${domainObj.name ?? ""}${ext}`;
		}
		if (!domainString) continue;

		const normalized = domainString.toLowerCase();
		const idMatches = params.openProviderIds.has(domain.id);
		const nameMatches = params.domainNames.has(normalized);
		if (!idMatches && !nameMatches) continue;

		matched.push({
			domain: normalized,
			expiryDate: new Date(domain.expiration_date),
		});
	}

	return matched;
}

async function fetchKenicDomainsForTeam(teamId: string, now: Date): Promise<DomainExpiryEntry[]> {
	const rows = await db
		.select({
			primaryDomain: niscClientSubscription.primaryDomain,
			expiryDate: niscClientSubscription.expiryDate,
			subscriptionDate: niscClientSubscription.subscriptionDate,
		})
		.from(niscClientSubscription)
		.innerJoin(niscProduct, eq(niscClientSubscription.productId, niscProduct.id))
		.where(
			and(
				eq(niscClientSubscription.teamId, teamId),
				isNotNull(niscClientSubscription.primaryDomain),
				like(niscClientSubscription.primaryDomain, "%.ke"),
				domainProductSqlFilter(),
			),
		);

	return rows
		.filter((row) => row.primaryDomain)
		.map((row) => {
			const domain = row.primaryDomain!.toLowerCase();
			const expiryDate =
				row.expiryDate ??
				new Date((row.subscriptionDate ?? now).getTime() + 365 * 24 * 60 * 60 * 1000);
			return { domain, expiryDate };
		});
}

export async function getTeamLiveDomainsSummary(teamId: string) {
	const domainProducts = await db
		.select({ id: niscProduct.id })
		.from(niscProduct)
		.where(and(eq(niscProduct.isActive, true), domainProductSqlFilter()));
	const productIds = domainProducts.map((p) => p.id);
	if (productIds.length === 0) {
		return { total: 0, active: 0, expired: 0 };
	}

	const subs = await db.query.niscClientSubscription.findMany({
		where: and(
			eq(niscClientSubscription.teamId, teamId),
			inArray(niscClientSubscription.productId, productIds),
		),
		columns: {
			openProviderId: true,
			primaryDomain: true,
			expiryDate: true,
			subscriptionDate: true,
		},
	});

	if (subs.length === 0) {
		return { total: 0, active: 0, expired: 0 };
	}

	const now = new Date();
	const openProviderIds = new Set<number>();
	const domainNames = new Set<string>();
	for (const sub of subs) {
		if (sub.openProviderId != null) openProviderIds.add(sub.openProviderId);
		if (sub.primaryDomain?.trim()) {
			domainNames.add(sub.primaryDomain.trim().toLowerCase());
		}
	}

	const byDomain = new Map<string, DomainExpiryEntry>();

	let openProviderDomains: DomainExpiryEntry[] = [];
	try {
		openProviderDomains = await fetchOpenProviderDomainsForTeam({
			openProviderIds,
			domainNames,
		});
	} catch (error) {
		console.error("[team-live-domains-summary] OpenProvider fetch failed:", error);
	}

	for (const entry of openProviderDomains) {
		byDomain.set(entry.domain, entry);
	}

	for (const entry of await fetchKenicDomainsForTeam(teamId, now)) {
		byDomain.set(entry.domain, entry);
	}

	for (const sub of subs) {
		const domain = sub.primaryDomain?.trim().toLowerCase();
		if (!domain || byDomain.has(domain)) continue;
		const expiryDate =
			sub.expiryDate ??
			new Date((sub.subscriptionDate ?? now).getTime() + 365 * 24 * 60 * 60 * 1000);
		byDomain.set(domain, { domain, expiryDate });
	}

	return summarizeDomains(Array.from(byDomain.values()), now);
}
