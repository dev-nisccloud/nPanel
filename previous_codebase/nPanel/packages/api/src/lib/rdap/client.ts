/**
 * RDAP (Registration Data Access Protocol) client for domain status lookup.
 * Uses IANA bootstrap (https://data.iana.org/rdap/dns.json) to find the RDAP
 * server for a TLD, then queries for domain status. Used to determine if a
 * domain is available, locked (transfer prohibited), or ready for transfer.
 * @see https://www.rfc-editor.org/rfc/rfc7482
 * @see https://www.iana.org/assignments/rdap-json-values/rdap-json-values.xhtml
 */

const IANA_RDAP_DNS_BOOTSTRAP = "https://data.iana.org/rdap/dns.json";

/** IANA bootstrap: services array of [ [ "tld1", "tld2" ], [ "url1", "url2" ] ] */
interface BootstrapPayload {
	services: Array<[string[], string[]]>;
}

/** RDAP domain response (subset we need). */
interface RdapDomainResponse {
	objectClassName?: string;
	status?: string[];
	ldhName?: string;
}

let bootstrapCache: Map<string, string> | null = null;
let bootstrapFetchTime = 0;
const BOOTSTRAP_CACHE_MS = 1000 * 60 * 60; // 1 hour

/**
 * Fetch IANA RDAP bootstrap and build a map: TLD (lowercase) -> RDAP base URL.
 * Uses longest-match: e.g. "co.ke" is not in bootstrap but "ke" is, so we look up by "ke".
 */
async function getBootstrap(): Promise<Map<string, string>> {
	const now = Date.now();
	if (bootstrapCache && now - bootstrapFetchTime < BOOTSTRAP_CACHE_MS) {
		return bootstrapCache;
	}
	const res = await fetch(IANA_RDAP_DNS_BOOTSTRAP);
	if (!res.ok) throw new Error(`RDAP bootstrap fetch failed: ${res.status}`);
	const data = (await res.json()) as BootstrapPayload;
	const map = new Map<string, string>();
	for (const [labels, urls] of data.services) {
		const url = urls[0];
		if (!url) continue;
		const base = url.endsWith("/") ? url : `${url}/`;
		for (const label of labels) {
			const tld = label.toLowerCase();
			if (!map.has(tld)) map.set(tld, base);
		}
	}
	bootstrapCache = map;
	bootstrapFetchTime = now;
	return map;
}

/**
 * Resolve RDAP base URL for a domain. IANA bootstrap uses single labels (e.g. "ke", "com").
 * For example.co.ke we look up "ke"; for google.com we look up "com".
 */
async function getRdapBaseUrl(domain: string): Promise<string | null> {
	const parts = domain.toLowerCase().trim().split(".");
	if (parts.length < 2) return null;
	const bootstrap = await getBootstrap();
	const rightmost = parts[parts.length - 1];
	if (rightmost === undefined || rightmost === "") return null;
	return bootstrap.get(rightmost) ?? null;
}

/** Result of an RDAP domain lookup. */
export interface RdapDomainResult {
	/** Domain exists in the registry (not available for registration). */
	exists: boolean;
	/** Domain has client or server transfer prohibited status. */
	locked: boolean;
	/** Raw status values from RDAP (e.g. "client transfer prohibited"). */
	statuses: string[];
	/** RDAP server was found and responded (even with 404). */
	rdapAvailable: boolean;
}

/**
 * Look up domain status via RDAP. Returns exists, locked, and statuses.
 * If the TLD has no RDAP server or the request fails, rdapAvailable is false.
 */
export async function rdapLookup(domain: string): Promise<RdapDomainResult> {
	const normalized = domain.toLowerCase().trim();
	const baseUrl = await getRdapBaseUrl(normalized);
	if (!baseUrl) {
		return { exists: false, locked: false, statuses: [], rdapAvailable: false };
	}
	const url = `${baseUrl}domain/${normalized}`;
	try {
		const res = await fetch(url, {
			headers: { Accept: "application/rdap+json" },
			signal: AbortSignal.timeout(10000),
		});
		if (res.status === 404) {
			return { exists: false, locked: false, statuses: [], rdapAvailable: true };
		}
		if (!res.ok) {
			return { exists: false, locked: false, statuses: [], rdapAvailable: true };
		}
		const data = (await res.json()) as RdapDomainResponse;
		const statuses = Array.isArray(data.status) ? data.status : [];
		const locked = statuses.some(
			(s) =>
				s.toLowerCase().includes("transfer prohibited") ||
				s.toLowerCase().includes("clienttransferprohibited") ||
				s.toLowerCase().includes("servertransferprohibited")
		);
		return {
			exists: true,
			locked,
			statuses,
			rdapAvailable: true,
		};
	} catch {
		return { exists: false, locked: false, statuses: [], rdapAvailable: false };
	}
}
