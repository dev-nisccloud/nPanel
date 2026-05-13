/**
 * Domain availability checking for the Zeepo AI Agent.
 *
 * Routes .ke / .co.ke / .or.ke etc. through KENIC EPP and all other
 * extensions through the OpenProvider REST API — both of which are
 * Nisc Cloud's existing backend integrations. The agent never needs to
 * direct users to external registrars.
 *
 * Reuses the same Redis auth-token caching that the OpenProvider tRPC
 * router uses, so tokens are shared across in-process callers.
 */

import { createOpenProviderClient } from "../openprovider-client";
import { checkKenicAvailability } from "../epp/kenic-availability";
import { isKenicDomain } from "../epp/kenic-tlds";
import { getRedisClient } from "../redis";
import { toRetailPrice, DEFAULT_DISPLAY_CURRENCY } from "./pricing";

const OP_TOKEN_KEY = "openprovider:auth-token";
const OP_TOKEN_TTL_SEC = 47 * 60 * 60; // 47 hours (token lasts 48 h)

export type DomainStatus = "available" | "taken" | "reserved" | "unknown";
export type DomainBackend = "kenic" | "openprovider" | "error";

export interface DomainCheckEntry {
	domain: string; // full FQDN e.g. "acme.co.ke"
	status: DomainStatus;
	available: boolean;
	/**
	 * Retail price after platform margin and currency conversion.
	 * Only present for gTLDs via OpenProvider when pricing data is available.
	 */
	price?: { amount: number; currency: string; formatted: string };
	isPremium?: boolean;
	via: DomainBackend;
	error?: string;
}

export interface DomainCheckResult {
	_tool: "check_domain_availability";
	name: string;
	/** All domains with availability + retail pricing in the team's currency. */
	checked: DomainCheckEntry[];
	availableCount: number;
	/** ISO 4217 code that all prices are expressed in. */
	displayCurrency: string;
	checkedAt: string;
}

function normaliseExtension(ext: string): string {
	return ext.startsWith(".") ? ext : `.${ext}`;
}

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
		/* ignore cache errors */
	}
	return null;
}

async function cacheOpToken(token: string): Promise<void> {
	const redis = getRedisClient();
	if (!redis) return;
	const expiresAt = Date.now() + OP_TOKEN_TTL_SEC * 1000;
	await redis
		.setex(
			OP_TOKEN_KEY,
			OP_TOKEN_TTL_SEC,
			JSON.stringify({ token, expiresAt }),
		)
		.catch(() => {});
}

async function checkViaOpenProvider(
	name: string,
	extensions: string[],
	targetCurrency: string,
): Promise<DomainCheckEntry[]> {
	const results: DomainCheckEntry[] = [];
	if (extensions.length === 0) return results;

	const client = createOpenProviderClient();

	// Reuse cached token if valid.
	const cachedToken = await getOpToken();
	if (cachedToken) {
		client.setToken(cachedToken);
	} else {
		try {
			const auth = await client.authenticate({
				username: process.env.OPENPROVIDER_USERNAME ?? "",
				password: process.env.OPENPROVIDER_PASSWORD ?? "",
			});
			if (auth?.data?.token) {
				await cacheOpToken(auth.data.token);
			}
		} catch (e: unknown) {
			// Auth failed — return error entries for all requested extensions.
			const msg =
				e instanceof Error ? e.message : "OpenProvider auth failed";
			for (const ext of extensions) {
				results.push({
					domain: `${name}${ext}`,
					status: "unknown",
					available: false,
					via: "error",
					error: msg,
				});
			}
			return results;
		}
	}

	const domainsToCheck = extensions.map((ext) => ({
		name,
		extension: ext.replace(/^\./, ""),
	}));

	try {
		const response = await client.checkDomains({
			domains: domainsToCheck,
			with_price: true,
			with_whois: false,
		});

		if (response.code !== 0) {
			throw new Error(response.desc || "OpenProvider check failed");
		}

		// Map results back by index (order is preserved by OP).
		const raw = response.data?.results ?? [];
		for (let i = 0; i < domainsToCheck.length; i++) {
			const req = domainsToCheck[i]!;
			const fullDomain = `${req.name}.${req.extension}`;
			const r = raw[i] as
				| {
						status?: string;
						price?: {
							reseller?: { price?: number; currency?: string };
							product?: { price?: number; currency?: string };
						};
						is_premium?: boolean;
				  }
				| undefined;

			if (!r) {
				results.push({
					domain: fullDomain,
					status: "unknown",
					available: false,
					via: "error",
					error: "No result returned",
				});
				continue;
			}

			const status = (r.status ?? "") as string;
			const available = status === "free";
			const statusNorm: DomainStatus =
				status === "free"
					? "available"
					: status === "reserved"
						? "reserved"
						: status === "active" || status === "in use"
							? "taken"
							: "unknown";

			// Prefer reseller price (what Nisc Cloud charges customers), fall back to product.
			const resellerAmt =
				r.price?.reseller?.price ?? r.price?.product?.price ?? null;
			const resellerCur =
				r.price?.reseller?.currency ??
				r.price?.product?.currency ??
				null;

			// Apply platform margin + currency conversion to get the retail price.
			let retailPrice: DomainCheckEntry["price"] | undefined;
			if (resellerAmt != null && resellerCur) {
				const retail = await toRetailPrice(resellerAmt, resellerCur, targetCurrency);
				if (retail) {
					retailPrice = { amount: retail.amount, currency: retail.currency, formatted: retail.formatted };
				}
			}

			results.push({
				domain: fullDomain,
				status: statusNorm,
				available,
				via: "openprovider",
				...(retailPrice ? { price: retailPrice } : {}),
				...(r.is_premium ? { isPremium: true } : {}),
			});
		}
	} catch (e: unknown) {
		const msg =
			e instanceof Error ? e.message : "OpenProvider check failed";
		for (const ext of extensions) {
			results.push({
				domain: `${name}${ext}`,
				status: "unknown",
				available: false,
				via: "error",
				error: msg,
			});
		}
	}

	return results;
}

async function checkViaKenic(
	name: string,
	extensions: string[],
): Promise<DomainCheckEntry[]> {
	const results: DomainCheckEntry[] = [];
	// KENIC EPP does one domain per connection — run sequentially to avoid overwhelming the EPP server.
	for (const ext of extensions) {
		const domain = `${name}${ext}`;
		try {
			const r = await checkKenicAvailability(domain);
			if (r === null) {
				results.push({
					domain,
					status: "unknown",
					available: false,
					via: "error",
					error: "KENIC EPP check unavailable",
				});
			} else {
				results.push({
					domain,
					status: r.available ? "available" : "taken",
					available: r.available,
					via: "kenic",
				});
			}
		} catch (e: unknown) {
			results.push({
				domain,
				status: "unknown",
				available: false,
				via: "error",
				error: e instanceof Error ? e.message : "KENIC check failed",
			});
		}
	}
	return results;
}

/**
 * Check availability for `name` across the requested `extensions`,
 * routing each through the correct backend (KENIC EPP for .ke TLDs,
 * OpenProvider for everything else).
 *
 * @param targetCurrency ISO 4217 code for pricing display (e.g. "KES", "USD").
 *   Defaults to KES (Kenyan Shilling) — the most common currency for Nisc Cloud clients.
 */
export async function agentCheckDomainAvailability(params: {
	name: string;
	extensions: string[];
	targetCurrency?: string;
}): Promise<DomainCheckResult> {
	const { name } = params;
	const extensions = params.extensions.map(normaliseExtension);
	const targetCurrency = (params.targetCurrency ?? DEFAULT_DISPLAY_CURRENCY).toUpperCase();

	const kenicExts = extensions.filter((ext) =>
		isKenicDomain(`x${ext}`),
	);
	const opExts = extensions.filter(
		(ext) => !isKenicDomain(`x${ext}`),
	);

	const [kenicResults, opResults] = await Promise.all([
		checkViaKenic(name, kenicExts),
		checkViaOpenProvider(name, opExts, targetCurrency),
	]);

	const all = [...kenicResults, ...opResults];

	// Sort: available first, then KENIC (.co.ke) before gTLDs for Kenyan context.
	all.sort((a, b) => {
		if (a.available !== b.available) return a.available ? -1 : 1;
		const aKe = a.domain.endsWith(".ke") || a.domain.includes(".co.ke");
		const bKe = b.domain.endsWith(".ke") || b.domain.includes(".co.ke");
		if (aKe && !bKe) return -1;
		if (!aKe && bKe) return 1;
		return a.domain.localeCompare(b.domain);
	});

	return {
		_tool: "check_domain_availability",
		name,
		checked: all,
		availableCount: all.filter((d) => d.available).length,
		displayCurrency: targetCurrency,
		checkedAt: new Date().toISOString(),
	};
}

/** Default extensions to check for a Kenyan business when the model doesn't specify. */
export const DEFAULT_DOMAIN_EXTENSIONS = [
	".co.ke",
	".com",
	".ke",
	".africa",
	".net",
	".org",
];
