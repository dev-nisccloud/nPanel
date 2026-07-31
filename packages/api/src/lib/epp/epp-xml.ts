/**
 * EPP XML command builders for KENIC (RFC 5730, 5731).
 * Object and extension URIs match the live greeting from registry.kenic.or.ke.
 */

/** Escape string for use inside XML text content. */
function escapeXml(s: string): string {
	return s
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;");
}

/** Default objURIs from KENIC greeting (contact, domain, host). */
const DEFAULT_OBJ_URIS = [
	"urn:ietf:params:xml:ns:contact-1.0",
	"urn:ietf:params:xml:ns:domain-1.0",
	"urn:ietf:params:xml:ns:host-1.0",
];

/** Default extURIs from KENIC greeting. */
const DEFAULT_EXT_URIS = [
	"urn:ietf:params:xml:ns:rgp-1.0",
	"urn:ietf:params:xml:ns:secDNS-1.1",
	"urn:ietf:params:xml:ns:epp:fee-1.0",
	"https://finance.coccaregistry.org",
];

/** Generate a unique client transaction ID (clTRID). */
function clTrId(): string {
	return `npanel-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Build EPP <login> command (RFC 5730).
 * Use the same objURI and extURI as in the server greeting so the server enables those services.
 */
export function buildLoginXml(
	clId: string,
	pw: string,
	options?: { objURIs?: string[]; extURIs?: string[] }
): string {
	const objURIs = options?.objURIs ?? DEFAULT_OBJ_URIS;
	const extURIs = options?.extURIs ?? DEFAULT_EXT_URIS;
	const objUriElements = objURIs.map((u) => `<objURI>${escapeXml(u)}</objURI>`).join("");
	const extUriElements = extURIs.map((u) => `<extURI>${escapeXml(u)}</extURI>`).join("");

	return `<?xml version="1.0" encoding="UTF-8"?>
<epp xmlns="urn:ietf:params:xml:ns:epp-1.0">
  <command>
    <login>
      <clID>${escapeXml(clId)}</clID>
      <pw>${escapeXml(pw)}</pw>
      <options>
        <version>1.0</version>
        <lang>en</lang>
      </options>
      <svcs>
        ${objUriElements}
        <svcExtension>
          ${extUriElements}
        </svcExtension>
      </svcs>
    </login>
    <clTRID>${escapeXml(clTrId())}</clTRID>
  </command>
</epp>`;
}

/**
 * Build EPP <logout> command (RFC 5730).
 */
export function buildLogoutXml(): string {
	return `<?xml version="1.0" encoding="UTF-8"?>
<epp xmlns="urn:ietf:params:xml:ns:epp-1.0">
  <command>
    <logout/>
    <clTRID>${escapeXml(clTrId())}</clTRID>
  </command>
</epp>`;
}

/**
 * Build EPP domain:check command (RFC 5731).
 * @param domains - Full domain names (e.g. ["example.ke", "test.ke"]).
 */
export function buildDomainCheckXml(domains: string[]): string {
	return buildDomainCheckXmlInternal(domains, null);
}

/**
 * Options for domain check with fee extension (RFC 8748).
 * When set, the check command includes <extension><fee:check> so the server can return pricing.
 */
export interface DomainCheckFeeOptions {
	/** Currency code (e.g. "USD", "KES"). Omit to use server default. */
	currency?: string;
	/** Registration period in years for create/renew/transfer fee query. Default 1. */
	periodYears?: number;
	/** Launch phase (RFC 8334), e.g. "sunrise", "landrush", "open", "claims". Omit for current phase. */
	phase?: string;
	/** Launch subphase (RFC 8334), e.g. "landrush", "open". Use with phase. */
	subphase?: string;
	/** If true, include fee:command name="restore" to get redemption/restore fee in response. */
	includeRestoreFee?: boolean;
}

/**
 * Build EPP domain:check command with fee extension (RFC 8748).
 * Server may return fee:chkData in the response extension with create/renew/transfer fees per domain.
 */
export function buildDomainCheckWithFeeXml(
	domains: string[],
	options?: DomainCheckFeeOptions
): string {
	return buildDomainCheckXmlInternal(domains, options ?? {});
}

function buildDomainCheckXmlInternal(
	domains: string[],
	feeOptions: DomainCheckFeeOptions | null
): string {
	const nameElements = domains
		.map((d) => `<domain:name>${escapeXml(d)}</domain:name>`)
		.join("");

	const periodYears = feeOptions?.periodYears ?? 1;
	const currency = feeOptions?.currency;
	const currencyEl = currency ? `<fee:currency>${escapeXml(currency)}</fee:currency>` : "";
	const phaseAttr = feeOptions?.phase ? ` phase="${escapeXml(feeOptions.phase)}"` : "";
	const subphaseAttr = feeOptions?.subphase ? ` subphase="${escapeXml(feeOptions.subphase)}"` : "";

	const createCmd = `<fee:command name="create"${phaseAttr}${subphaseAttr}>\n          <fee:period unit="y">${periodYears}</fee:period>\n        </fee:command>`;
	const renewCmd = `<fee:command name="renew"${phaseAttr}${subphaseAttr}>\n          <fee:period unit="y">${periodYears}</fee:period>\n        </fee:command>`;
	const transferCmd = `<fee:command name="transfer"${phaseAttr}${subphaseAttr}>\n          <fee:period unit="y">${periodYears}</fee:period>\n        </fee:command>`;
	const restoreCmd =
		feeOptions?.includeRestoreFee === true
			? `\n        <fee:command name="restore"/>`
			: "";

	const feeExtension =
		feeOptions === null
			? ""
			: `
    <extension>
      <fee:check xmlns:fee="urn:ietf:params:xml:ns:epp:fee-1.0">
        ${currencyEl}
        ${createCmd}
        ${renewCmd}
        ${transferCmd}${restoreCmd}
      </fee:check>
    </extension>`;

	return `<?xml version="1.0" encoding="UTF-8"?>
<epp xmlns="urn:ietf:params:xml:ns:epp-1.0" xmlns:domain="urn:ietf:params:xml:ns:domain-1.0">
  <command>
    <check>
      <domain:check>
        ${nameElements}
      </domain:check>
    </check>${feeExtension}
    <clTRID>${escapeXml(clTrId())}</clTRID>
  </command>
</epp>`;
}

// ---------------------------------------------------------------------------
// Contact create (RFC 3733). Used for KENIC "customer" (registrant/admin/tech).
// ---------------------------------------------------------------------------

export interface ContactCreatePostalInfo {
	name: string;
	org?: string;
	street: string | string[];
	city: string;
	sp?: string;
	pc: string;
	cc: string;
}

export interface ContactCreateParams {
	/** Contact id (server may allow server-assigned if omitted; KENIC typically requires it). */
	id: string;
	/** At least one of int (international) or loc (local). */
	postalInfo: ContactCreatePostalInfo | [ContactCreatePostalInfo, ContactCreatePostalInfo];
	/** E.164 format, e.g. +254.123456789 */
	voice: string;
	fax?: string;
	email: string;
	authInfo?: string;
	/** Which fields to disclose in WHOIS; flag 0 = hide, 1 = show. */
	disclose?: { flag: 0 | 1; elements?: ("name" | "org" | "addr" | "voice" | "fax" | "email")[] };
}

function formatStreet(street: string | string[]): string {
	const arr = Array.isArray(street) ? street : [street];
	return arr.map((s) => `<contact:street>${escapeXml(s)}</contact:street>`).join("\n        ");
}

function formatPostalInfo(p: ContactCreatePostalInfo, type: "int" | "loc"): string {
	const street = formatStreet(p.street);
	return `<contact:postalInfo type="${type}">
      <contact:name>${escapeXml(p.name)}</contact:name>${p.org ? `\n      <contact:org>${escapeXml(p.org)}</contact:org>` : ""}
      <contact:addr>
        ${street}
        <contact:city>${escapeXml(p.city)}</contact:city>${p.sp ? `\n        <contact:sp>${escapeXml(p.sp)}</contact:sp>` : ""}
        <contact:pc>${escapeXml(p.pc)}</contact:pc>
        <contact:cc>${escapeXml(p.cc)}</contact:cc>
      </contact:addr>
    </contact:postalInfo>`;
}

/**
 * Build EPP contact:create command (RFC 3733).
 */
export function buildContactCreateXml(params: ContactCreateParams): string {
	const postal = Array.isArray(params.postalInfo)
		? params.postalInfo.map((p, i) => formatPostalInfo(p, i === 0 ? "int" : "loc")).join("\n    ")
		: formatPostalInfo(params.postalInfo, "int");
	const fax = params.fax ? `\n    <contact:fax>${escapeXml(params.fax)}</contact:fax>` : "";
	const auth =
		params.authInfo != null
			? `\n    <contact:authInfo>\n      <contact:pw>${escapeXml(params.authInfo)}</contact:pw>\n    </contact:authInfo>`
			: "";
	const disclose =
		params.disclose != null
			? `\n    <contact:disclose flag="${params.disclose.flag}">${(params.disclose.elements ?? []).map((e) => `<contact:${e}/>`).join("")}\n    </contact:disclose>`
			: "";

	return `<?xml version="1.0" encoding="UTF-8"?>
<epp xmlns="urn:ietf:params:xml:ns:epp-1.0" xmlns:contact="urn:ietf:params:xml:ns:contact-1.0">
  <command>
    <create>
      <contact:create>
    <contact:id>${escapeXml(params.id)}</contact:id>
    ${postal}
    <contact:voice>${escapeXml(params.voice)}</contact:voice>${fax}
    <contact:email>${escapeXml(params.email)}</contact:email>${auth}${disclose}
      </contact:create>
    </create>
    <clTRID>${escapeXml(clTrId())}</clTRID>
  </command>
</epp>`;
}

// ---------------------------------------------------------------------------
// Domain create (RFC 5731). Registrant and contact ids must exist (create contacts first).
// ---------------------------------------------------------------------------

export interface DomainCreateParams {
	/** Full domain name (e.g. example.co.ke). */
	name: string;
	/** Registration period in years. Default 1. */
	period?: number;
	/** Nameservers: hostObj = host names, or hostAttr = name + ips. */
	ns?: { type: "hostObj"; hosts: string[] } | { type: "hostAttr"; hosts: Array<{ name: string; addrs?: string[] }> };
	/** Registrant contact id (required). */
	registrant: string;
	/** Admin contact id(s). */
	adminContacts?: string[];
	/** Tech contact id(s). */
	techContacts?: string[];
	/** Domain authInfo (password) for transfer lock. */
	authInfo?: string;
}

/**
 * Build EPP domain:create command (RFC 5731).
 */
export function buildDomainCreateXml(params: DomainCreateParams): string {
	const period = params.period ?? 1;
	const periodEl = `<domain:period unit="y">${period}</domain:period>`;

	let nsEl = "";
	if (params.ns) {
		if (params.ns.type === "hostObj") {
			nsEl = params.ns.hosts.map((h) => `<domain:hostObj>${escapeXml(h)}</domain:hostObj>`).join("\n        ");
		} else {
			nsEl = params.ns.hosts
				.map((h) => {
					const addrs =
						h.addrs?.length ?
							h.addrs.map((a) => `<domain:hostAddr>${escapeXml(a)}</domain:hostAddr>`).join("\n          ")
						: "";
					return `<domain:hostAttr>\n          <domain:hostName>${escapeXml(h.name)}</domain:hostName>${addrs ? "\n          " + addrs : ""}\n        </domain:hostAttr>`;
				})
				.join("\n        ");
		}
		nsEl = `\n    <domain:ns>\n        ${nsEl}\n    </domain:ns>`;
	}

	const adminEl =
		params.adminContacts?.length ?
			params.adminContacts.map((c) => `\n    <domain:contact type="admin">${escapeXml(c)}</domain:contact>`).join("")
		: "";
	const techEl =
		params.techContacts?.length ?
			params.techContacts.map((c) => `\n    <domain:contact type="tech">${escapeXml(c)}</domain:contact>`).join("")
		: "";
	const authEl =
		params.authInfo != null
			? `\n    <domain:authInfo>\n      <domain:pw>${escapeXml(params.authInfo)}</domain:pw>\n    </domain:authInfo>`
			: "";

	return `<?xml version="1.0" encoding="UTF-8"?>
<epp xmlns="urn:ietf:params:xml:ns:epp-1.0" xmlns:domain="urn:ietf:params:xml:ns:domain-1.0">
  <command>
    <create>
      <domain:create>
    <domain:name>${escapeXml(params.name)}</domain:name>
    ${periodEl}${nsEl}
    <domain:registrant>${escapeXml(params.registrant)}</domain:registrant>${adminEl}${techEl}${authEl}
      </domain:create>
    </create>
    <clTRID>${escapeXml(clTrId())}</clTRID>
  </command>
</epp>`;
}

// ---------------------------------------------------------------------------
// Domain transfer (RFC 5731). op="request" = gaining registrar requests transfer.
// ---------------------------------------------------------------------------

export interface DomainTransferParams {
	/** Full domain name (e.g. example.co.ke). */
	name: string;
	/** Auth code from losing registrar (required for transfer). */
	authCode: string;
	/** Optional roid from domain info at losing registrar. */
	roid?: string;
	/** Period to add on transfer (years). Optional; often 1. */
	period?: number;
}

/**
 * Build EPP domain:transfer command with op="request" (RFC 5731).
 */
export function buildDomainTransferXml(params: DomainTransferParams): string {
	const periodEl =
		params.period != null && params.period > 0
			? `\n    <domain:period unit="y">${params.period}</domain:period>`
			: "";
	const roidAttr = params.roid ? ` roid="${escapeXml(params.roid)}"` : "";

	return `<?xml version="1.0" encoding="UTF-8"?>
<epp xmlns="urn:ietf:params:xml:ns:epp-1.0" xmlns:domain="urn:ietf:params:xml:ns:domain-1.0">
  <command>
    <transfer op="request">
      <domain:transfer>
    <domain:name>${escapeXml(params.name)}</domain:name>${periodEl}
    <domain:authInfo>
      <domain:pw${roidAttr}>${escapeXml(params.authCode)}</domain:pw>
    </domain:authInfo>
      </domain:transfer>
    </transfer>
    <clTRID>${escapeXml(clTrId())}</clTRID>
  </command>
</epp>`;
}
/**
 * Build EPP domain:info command (RFC 5731).
 */
export function buildDomainInfoXml(domain: string, authInfo?: string): string {
	const authEl = authInfo
		? `\n        <domain:authInfo>\n          <domain:pw>${escapeXml(authInfo)}</domain:pw>\n        </domain:authInfo>`
		: "";

	return `<?xml version="1.0" encoding="UTF-8"?>
<epp xmlns="urn:ietf:params:xml:ns:epp-1.0" xmlns:domain="urn:ietf:params:xml:ns:domain-1.0">
  <command>
    <info>
      <domain:info>
        <domain:name>${escapeXml(domain)}</domain:name>${authEl}
      </domain:info>
    </info>
    <clTRID>${escapeXml(clTrId())}</clTRID>
  </command>
</epp>`;
}

/**
 * Build EPP contact:info command (RFC 5733).
 */
export function buildContactInfoXml(id: string, authInfo?: string): string {
	const authEl = authInfo
		? `\n        <contact:authInfo>\n          <contact:pw>${escapeXml(authInfo)}</contact:pw>\n        </contact:authInfo>`
		: "";

	return `<?xml version="1.0" encoding="UTF-8"?>
<epp xmlns="urn:ietf:params:xml:ns:epp-1.0" xmlns:contact="urn:ietf:params:xml:ns:contact-1.0">
  <command>
    <info>
      <contact:info>
        <contact:id>${escapeXml(id)}</contact:id>${authEl}
      </contact:info>
    </info>
    <clTRID>${escapeXml(clTrId())}</clTRID>
  </command>
</epp>`;
}
/**
 * Build EPP domain:update command (RFC 5731) for nameservers.
 */
export function buildDomainUpdateXml(params: {
	domain: string;
	addNs?: string[];
	remNs?: string[];
	authInfo?: string;
	addStatus?: string[];
	remStatus?: string[];
}): string {
	const addParts: string[] = [];
	if (params.addNs && params.addNs.length > 0) {
		const ns = params.addNs.map((n) => `          <domain:hostObj>${escapeXml(n)}</domain:hostObj>`).join("\n");
		addParts.push(`        <domain:ns>\n${ns}\n        </domain:ns>`);
	}
	if (params.addStatus && params.addStatus.length > 0) {
		for (const status of params.addStatus) {
			addParts.push(`        <domain:status s="${escapeXml(status)}"/>`);
		}
	}
	const addEl =
		addParts.length > 0
			? `\n      <domain:add>\n${addParts.join("\n")}\n      </domain:add>`
			: "";

	const remParts: string[] = [];
	if (params.remNs && params.remNs.length > 0) {
		const ns = params.remNs.map((n) => `          <domain:hostObj>${escapeXml(n)}</domain:hostObj>`).join("\n");
		remParts.push(`        <domain:ns>\n${ns}\n        </domain:ns>`);
	}
	if (params.remStatus && params.remStatus.length > 0) {
		for (const status of params.remStatus) {
			remParts.push(`        <domain:status s="${escapeXml(status)}"/>`);
		}
	}
	const remEl =
		remParts.length > 0
			? `\n      <domain:rem>\n${remParts.join("\n")}\n      </domain:rem>`
			: "";

	const chgEl =
		params.authInfo != null
			? `\n      <domain:chg>\n        <domain:authInfo>\n          <domain:pw>${escapeXml(params.authInfo)}</domain:pw>\n        </domain:authInfo>\n      </domain:chg>`
			: "";

	return `<?xml version="1.0" encoding="UTF-8"?>
<epp xmlns="urn:ietf:params:xml:ns:epp-1.0" xmlns:domain="urn:ietf:params:xml:ns:domain-1.0">
  <command>
    <update>
      <domain:update>
        <domain:name>${escapeXml(params.domain)}</domain:name>${addEl}${remEl}${chgEl}
      </domain:update>
    </update>
    <clTRID>${escapeXml(clTrId())}</clTRID>
  </command>
</epp>`;
}

/**
 * Build EPP host:check command (RFC 5732).
 */
export function buildHostCheckXml(hosts: string[]): string {
	const hostEls = hosts.map((h) => `        <host:name>${escapeXml(h)}</host:name>`).join("\n");
	return `<?xml version="1.0" encoding="UTF-8"?>
<epp xmlns="urn:ietf:params:xml:ns:epp-1.0" xmlns:host="urn:ietf:params:xml:ns:host-1.0">
  <command>
    <check>
      <host:check>
${hostEls}
      </host:check>
    </check>
    <clTRID>${escapeXml(clTrId())}</clTRID>
  </command>
</epp>`;
}

/**
 * Build EPP host:create command (RFC 5732).
 */
export function buildHostCreateXml(host: string, ips?: { v4?: string[]; v6?: string[] }): string {
	let addrEls = "";
	if (ips) {
		if (ips.v4) {
			addrEls += ips.v4.map((ip) => `        <host:addr ip="v4">${escapeXml(ip)}</host:addr>`).join("\n");
		}
		if (ips.v6) {
			addrEls += ips.v6.map((ip) => `        <host:addr ip="v6">${escapeXml(ip)}</host:addr>`).join("\n");
		}
	}

	return `<?xml version="1.0" encoding="UTF-8"?>
<epp xmlns="urn:ietf:params:xml:ns:epp-1.0" xmlns:host="urn:ietf:params:xml:ns:host-1.0">
  <command>
    <create>
      <host:create>
        <host:name>${escapeXml(host)}</host:name>${addrEls ? `\n${addrEls}` : ""}
      </host:create>
    </create>
    <clTRID>${escapeXml(clTrId())}</clTRID>
  </command>
</epp>`;
}

/**
 * Build CoCCA finance:info command (non-RFC extension).
 * KENIC advertises https://finance.coccaregistry.org in its EPP greeting.
 * @see https://faq.cocca.org.nz/ — response entries are TLD|CURRENCY|BALANCE
 */
export function buildFinanceInfoXml(): string {
	return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<epp xmlns="urn:ietf:params:xml:ns:epp-1.0">
  <command>
    <info>
      <finance:info xmlns:finance="https://finance.coccaregistry.org"/>
    </info>
    <clTRID>${escapeXml(clTrId())}</clTRID>
  </command>
</epp>`;
}
