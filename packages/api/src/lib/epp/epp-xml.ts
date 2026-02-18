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
