/**
 * RDAP client for domain WHOIS lookups.
 *
 * Uses the IANA bootstrap registry (https://data.iana.org/rdap/dns.json) to
 * resolve the correct RDAP server per TLD, then fetches and normalises the
 * response into a single consistent shape.
 *
 * Types are derived from real responses collected from:
 *   - Verisign  (.com / .net)  — gTLD, ICANN-compliant, registrant GDPR-redacted
 *   - Nominet   (.co.uk / .uk) — ccTLD, redacted array + richer nameserver objects
 *   - KENIC     (.ke / .co.ke) — ccTLD via https://rdap.kenic.or.ke/
 *
 * KENIC quirks:
 *   • Bootstrap maps only "ke"; all sub-TLDs (.co.ke, .or.ke …) share the same server
 *   • Registrar entity in the domain response has NO vcardArray — the full vcard
 *     lives at the entity href. We detect this and do a second fetch to enrich the
 *     registrar with address, phone, and email. Only fires for same-origin entity URLs
 *     to avoid cross-registry requests on gTLDs.
 *   • Domain link uses rel:"related" instead of rel:"self"
 *   • Extra event actions: "reregistration", "transfer", "registrar expiration"
 */

// ---- Internal RDAP wire types -----------------------------------------------

type VcardProperty = [string, Record<string, unknown>, string, unknown];

interface RdapLink {
	value?: string;
	rel: string;
	href: string;
	title?: string;
	type?: string;
}

interface RdapEvent {
	eventAction: string;
	eventDate: string;
	eventActor?: string;
}

interface RdapPublicId {
	type: string;
	identifier: string;
}

interface RdapDsData {
	keyTag: number;
	algorithm: number;
	digestType: number;
	digest: string;
}

interface RdapSecureDns {
	delegationSigned: boolean;
	maxSigLife?: number;
	dsData?: RdapDsData[];
}

interface RdapEntity {
	objectClassName?: string;
	handle?: string;
	roles: string[];
	links?: RdapLink[];
	publicIds?: RdapPublicId[];
	vcardArray?: ["vcard", VcardProperty[]];
	entities?: RdapEntity[];
	remarks?: Array<{ title: string; type?: string; description: string[] }>;
	events?: RdapEvent[];
	status?: string[];
}

interface RdapNameserver {
	objectClassName?: string;
	ldhName: string;
	unicodeName?: string;
	handle?: string;
	links?: RdapLink[];
	status?: string[];
	events?: RdapEvent[];
	ipAddresses?: { v4?: string[]; v6?: string[] };
}

interface RdapDomainResponse {
	objectClassName: "domain";
	handle: string;
	ldhName: string;
	unicodeName?: string;
	links: RdapLink[];
	status: string[];
	events: RdapEvent[];
	entities: RdapEntity[];
	nameservers: RdapNameserver[];
	secureDNS: RdapSecureDns;
	rdapConformance: string[];
	notices?: Array<{ title: string; description: string[]; links?: RdapLink[] }>;
	publicIds?: RdapPublicId[];
	redacted?: unknown[];
}

// ---- Public output types ----------------------------------------------------

export interface WhoisDsData {
	keyTag: number;
	algorithm: number;
	digestType: number;
	/** Hex digest — normalised to lowercase */
	digest: string;
}

export interface WhoisRegistrar {
	name: string | null;
	/** Registry handle (KENIC: "NCL3", gTLD: "292") */
	handle: string | null;
	/** IANA numeric registrar ID (gTLDs only) */
	ianaId: string | null;
	/** Registrar website or RDAP entity URL */
	url: string | null;
	// ---- Direct contact (enriched from entity fetch when not inline) ----
	email: string | null;
	phone: string | null;
	street: string | null;
	city: string | null;
	postalCode: string | null;
	country: string | null;
	// ---- Abuse contact ----
	abuseEmail: string | null;
	abusePhone: string | null;
}

export interface WhoisContact {
	name: string | null;
	organization: string | null;
	email: string | null;
	phone: string | null;
	street: string | null;
	city: string | null;
	country: string | null;
}

export interface WhoisDomainEvent {
	action: string;
	date: string;
	/** Actor name when present (e.g. registrar on transfer/reregistration) */
	actor: string | null;
}

export interface WhoisResult {
	domain: string;
	handle: string | null;
	unicodeName: string | null;
	source: "rdap";
	registrationDate: string | null;
	expiryDate: string | null;
	updatedDate: string | null;
	/** Transfer date — present in KENIC responses */
	transferDate: string | null;
	status: string[];
	registrar: WhoisRegistrar | null;
	/** Often null/GDPR-redacted for gTLDs */
	registrant: WhoisContact | null;
	adminContact: WhoisContact | null;
	techContact: WhoisContact | null;
	nameservers: string[];
	dnssec: "signedDelegation" | "unsigned" | null;
	dsData: WhoisDsData[];
	/** Full raw event log from the RDAP response, newest-first */
	events: WhoisDomainEvent[];
	rdapUrl: string | null;
	error: string | null;
}

// ---- IANA bootstrap cache ---------------------------------------------------

interface BootstrapCache {
	services: Array<[string[], string[]]>;
	fetchedAt: number;
}

const BOOTSTRAP_TTL_MS = 24 * 60 * 60 * 1_000;
const BOOTSTRAP_URL = "https://data.iana.org/rdap/dns.json";
const RDAP_HEADERS = {
	Accept: "application/rdap+json, application/json",
	"User-Agent": "nPanel/1.0 RDAP-Whois",
};

let bootstrapCache: BootstrapCache | null = null;

async function fetchBootstrap(): Promise<Array<[string[], string[]]>> {
	const now = Date.now();
	if (bootstrapCache && now - bootstrapCache.fetchedAt < BOOTSTRAP_TTL_MS) {
		return bootstrapCache.services;
	}
	const res = await fetch(BOOTSTRAP_URL, {
		headers: { "User-Agent": "nPanel/1.0 RDAP-Whois" },
		signal: AbortSignal.timeout(10_000),
	});
	if (!res.ok) throw new Error(`RDAP bootstrap fetch failed: ${res.status}`);
	const data = (await res.json()) as { services: Array<[string[], string[]]> };
	bootstrapCache = { services: data.services, fetchedAt: now };
	return data.services;
}

export async function resolveRdapBaseUrl(tld: string): Promise<string | null> {
	const services = await fetchBootstrap();
	const lower = tld.toLowerCase().replace(/^\./, "");
	for (const [tlds, urls] of services) {
		if (tlds.some((t) => t.toLowerCase() === lower)) return urls[0] ?? null;
	}
	return null;
}

// ---- jCard (RFC 7095) helpers -----------------------------------------------

function vcardProp(props: VcardProperty[], name: string): string | null {
	for (const p of props) {
		if (p[0] === name) {
			const val = p[3];
			if (typeof val === "string") return val || null;
			if (Array.isArray(val)) return (val as string[]).filter(Boolean).join(", ") || null;
		}
	}
	return null;
}

/**
 * adr value: ["poBox", "ext", street, city, region, postalCode, country]
 */
function vcardAdr(props: VcardProperty[]): {
	street: string | null;
	city: string | null;
	postalCode: string | null;
	country: string | null;
} {
	for (const p of props) {
		if (p[0] === "adr") {
			const val = p[3];
			if (Array.isArray(val) && val.length >= 7) {
				return {
					street: typeof val[2] === "string" ? val[2] || null : null,
					city: typeof val[3] === "string" ? val[3] || null : null,
					postalCode: typeof val[5] === "string" ? val[5] || null : null,
					country: typeof val[6] === "string" ? val[6] || null : null,
				};
			}
		}
	}
	return { street: null, city: null, postalCode: null, country: null };
}

function parseVcard(entity: RdapEntity): WhoisContact {
	const vcardArray = entity.vcardArray;
	if (!vcardArray || !Array.isArray(vcardArray[1])) {
		return {
			name: null,
			organization: null,
			email: null,
			phone: null,
			street: null,
			city: null,
			country: null,
		};
	}
	const props = vcardArray[1];
	const adr = vcardAdr(props);
	return {
		name: vcardProp(props, "fn"),
		organization: vcardProp(props, "org"),
		email: vcardProp(props, "email"),
		phone: vcardProp(props, "tel"),
		street: adr.street,
		city: adr.city,
		country: adr.country,
	};
}

// ---- Registrar entity enrichment --------------------------------------------

/**
 * When the registrar entity in the domain response has no vcardArray (KENIC pattern),
 * we look for a same-origin RDAP entity URL in the entity's links and return it for
 * a follow-up fetch. Returns null for gTLDs where the vcard is already inline.
 */
function extractRegistrarEntityUrl(entity: RdapEntity, baseUrl: string): string | null {
	// Already have inline vcard — no extra fetch needed
	if (entity.vcardArray) return null;

	const links = entity.links ?? [];
	const entityLink = links.find(
		(l) => l.type === "application/rdap+json" && l.href.includes("/entity/"),
	);
	if (!entityLink) return null;

	// Only fetch from the same origin as the RDAP server we used for the domain —
	// prevents unintended cross-registry requests.
	try {
		const linkOrigin = new URL(entityLink.href).origin;
		const baseOrigin = new URL(baseUrl).origin;
		if (linkOrigin !== baseOrigin) return null;
	} catch {
		return null;
	}

	return entityLink.href;
}

/**
 * Fetch a KENIC registrar entity URL and return the enriched contact fields.
 * Fails silently — the caller merges these into the base registrar object.
 */
async function fetchRegistrarEntityEnrichment(
	url: string,
): Promise<Pick<WhoisRegistrar, "email" | "phone" | "street" | "city" | "postalCode" | "country"> | null> {
	try {
		const res = await fetch(url, {
			headers: RDAP_HEADERS,
			signal: AbortSignal.timeout(8_000),
		});
		if (!res.ok) return null;

		const entity = (await res.json()) as RdapEntity;
		if (!entity.vcardArray || !Array.isArray(entity.vcardArray[1])) return null;

		const props = entity.vcardArray[1];
		const adr = vcardAdr(props);

		return {
			email: vcardProp(props, "email"),
			phone: vcardProp(props, "tel"),
			street: adr.street,
			city: adr.city,
			postalCode: adr.postalCode,
			country: adr.country,
		};
	} catch {
		return null;
	}
}

// ---- Entity parser ----------------------------------------------------------

function parseEntities(
	entities: RdapEntity[],
	baseUrl: string,
): {
	registrar: WhoisRegistrar | null;
	registrarEntityUrl: string | null;
	registrant: WhoisContact | null;
	adminContact: WhoisContact | null;
	techContact: WhoisContact | null;
} {
	let registrar: WhoisRegistrar | null = null;
	let registrarEntityUrl: string | null = null;
	let registrant: WhoisContact | null = null;
	let adminContact: WhoisContact | null = null;
	let techContact: WhoisContact | null = null;

	for (const entity of entities) {
		const roles = entity.roles ?? [];

		if (roles.includes("registrar")) {
			const nested = entity.entities ?? [];

			// Name: try inline vcardArray first; fall back to nested abuse entity fn (KENIC)
			let name: string | null = null;
			let email: string | null = null;
			let phone: string | null = null;
			let street: string | null = null;
			let city: string | null = null;
			let postalCode: string | null = null;
			let country: string | null = null;

			if (entity.vcardArray) {
				const props = entity.vcardArray[1];
				name = vcardProp(props, "fn");
				email = vcardProp(props, "email");
				phone = vcardProp(props, "tel");
				const adr = vcardAdr(props);
				street = adr.street;
				city = adr.city;
				postalCode = adr.postalCode;
				country = adr.country;
			} else if (nested.length > 0 && nested[0]?.vcardArray) {
				// KENIC: registrar name is on the nested abuse entity
				name = vcardProp(nested[0].vcardArray[1], "fn");
			}

			// Registrar website URL
			const links = entity.links ?? [];
			let url: string | null =
				links.find((l) => l.rel === "about" || l.rel === "self")?.href ?? null;
			if (!url && entity.vcardArray) {
				url = vcardProp(entity.vcardArray[1], "url");
			}

			// IANA registrar ID (gTLDs only)
			const publicIds = entity.publicIds ?? [];
			const ianaId =
				publicIds.find((p) => p.type === "IANA Registrar ID")?.identifier ?? null;

			// Abuse contact
			let abuseEmail: string | null = null;
			let abusePhone: string | null = null;
			for (const n of nested) {
				if ((n.roles ?? []).includes("abuse") && n.vcardArray) {
					const props = n.vcardArray[1];
					abuseEmail = vcardProp(props, "email");
					abusePhone = vcardProp(props, "tel");
				}
			}

			registrar = {
				name,
				handle: entity.handle ?? null,
				ianaId,
				url,
				email,
				phone,
				street,
				city,
				postalCode,
				country,
				abuseEmail,
				abusePhone,
			};

			// Check if we should fetch enriched entity data (KENIC: no inline vcard)
			registrarEntityUrl = extractRegistrarEntityUrl(entity, baseUrl);
		}

		if (roles.includes("registrant")) registrant = parseVcard(entity);
		if (roles.includes("administrative")) adminContact = parseVcard(entity);
		if (roles.includes("technical")) techContact = parseVcard(entity);
	}

	return { registrar, registrarEntityUrl, registrant, adminContact, techContact };
}

// ---- Event parser -----------------------------------------------------------

// Actions that are internal/duplicative and don't add value in the events timeline
const HIDDEN_EVENT_ACTIONS = new Set(["last update of RDAP database", "registrar expiration"]);

function parseEvents(rawEvents: RdapEvent[]): {
	registrationDate: string | null;
	expiryDate: string | null;
	updatedDate: string | null;
	transferDate: string | null;
	events: WhoisDomainEvent[];
} {
	let registrationDate: string | null = null;
	let expiryDate: string | null = null;
	let updatedDate: string | null = null;
	let transferDate: string | null = null;

	for (const e of rawEvents) {
		switch (e.eventAction) {
			case "registration":
				registrationDate = e.eventDate;
				break;
			case "expiration":
			case "registrar expiration":
				if (!expiryDate || e.eventAction === "expiration") expiryDate = e.eventDate;
				break;
			case "last changed":
				updatedDate = e.eventDate;
				break;
			case "transfer":
				transferDate = e.eventDate;
				break;
		}
	}

	// Build the displayable event log — filter noise, sort newest first
	const events: WhoisDomainEvent[] = rawEvents
		.filter((e) => !HIDDEN_EVENT_ACTIONS.has(e.eventAction))
		.map((e) => ({
			action: e.eventAction,
			date: e.eventDate,
			actor: e.eventActor ?? null,
		}))
		.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

	return { registrationDate, expiryDate, updatedDate, transferDate, events };
}

// ---- TLD helpers ------------------------------------------------------------

function tldVariants(domain: string): string[] {
	const parts = domain.toLowerCase().split(".");
	return Array.from({ length: parts.length - 1 }, (_, i) => parts.slice(i + 1).join("."));
}

function cleanNsName(ldhName: string): string {
	return ldhName.toLowerCase().replace(/\.$/, "");
}

// ---- Main lookup ------------------------------------------------------------

export async function rdapLookup(domain: string): Promise<WhoisResult> {
	const lower = domain.toLowerCase().trim();

	const empty: WhoisResult = {
		domain: lower,
		handle: null,
		unicodeName: null,
		source: "rdap",
		registrationDate: null,
		expiryDate: null,
		updatedDate: null,
		transferDate: null,
		status: [],
		registrar: null,
		registrant: null,
		adminContact: null,
		techContact: null,
		nameservers: [],
		dnssec: null,
		dsData: [],
		events: [],
		rdapUrl: null,
		error: null,
	};

	try {
		let baseUrl: string | null = null;
		for (const tld of tldVariants(lower)) {
			baseUrl = await resolveRdapBaseUrl(tld);
			if (baseUrl) break;
		}

		if (!baseUrl) return { ...empty, error: "No RDAP server found for this TLD" };

		const lookupUrl = `${baseUrl.replace(/\/$/, "")}/domain/${encodeURIComponent(lower)}`;

		const res = await fetch(lookupUrl, {
			headers: RDAP_HEADERS,
			signal: AbortSignal.timeout(15_000),
		});

		if (res.status === 404) return { ...empty, error: "Domain not found" };
		if (!res.ok) return { ...empty, error: `RDAP server returned HTTP ${res.status}` };

		const data = (await res.json()) as RdapDomainResponse;

		const { events, ...parsedDates } = parseEvents(data.events ?? []);
		const { registrar, registrarEntityUrl, registrant, adminContact, techContact } =
			parseEntities(data.entities ?? [], baseUrl);

		// ── Registrar entity enrichment (KENIC: fetch full entity for address/phone/email) ──
		let enrichedRegistrar = registrar;
		if (registrar && registrarEntityUrl) {
			const enrichment = await fetchRegistrarEntityEnrichment(registrarEntityUrl);
			if (enrichment) {
				enrichedRegistrar = { ...registrar, ...enrichment };
			}
		}

		const nameservers = (data.nameservers ?? [])
			.map((ns) => cleanNsName(ns.ldhName))
			.filter(Boolean);

		const secureDns = data.secureDNS;
		const dnssec: WhoisResult["dnssec"] =
			secureDns?.delegationSigned === true
				? "signedDelegation"
				: secureDns?.delegationSigned === false
					? "unsigned"
					: null;

		const dsData: WhoisDsData[] = (secureDns?.dsData ?? []).map((d) => ({
			keyTag: d.keyTag,
			algorithm: d.algorithm,
			digestType: d.digestType,
			digest: d.digest.toLowerCase(),
		}));

		const links = data.links ?? [];
		const rdapUrl =
			links.find((l) => l.rel === "self")?.href ??
			links.find((l) => l.rel === "related")?.href ??
			lookupUrl;

		return {
			domain: lower,
			handle: data.handle ?? null,
			unicodeName: data.unicodeName ?? null,
			source: "rdap",
			...parsedDates,
			status: data.status ?? [],
			registrar: enrichedRegistrar,
			registrant,
			adminContact,
			techContact,
			nameservers,
			dnssec,
			dsData,
			events,
			rdapUrl,
			error: null,
		};
	} catch (err) {
		if (err instanceof Error && err.name === "TimeoutError") {
			return { ...empty, error: "RDAP server timed out" };
		}
		return { ...empty, error: err instanceof Error ? err.message : "RDAP lookup failed" };
	}
}
