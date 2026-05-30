/** Parent domain for default Hivelocity server hostnames (FQDN suffix). */
export const HIVELOCITY_DEFAULT_HOSTNAME_DOMAIN =
	(import.meta.env.VITE_HIVELOCITY_DEFAULT_HOSTNAME_DOMAIN as string | undefined)?.trim().toLowerCase() ||
	"nisccloud.com";

export type HivelocityDefaultHostnameProductType = "DEDICATED_SERVERS" | "VPS" | "VDS";

const HOSTNAME_SUFFIX_BY_PRODUCT: Record<HivelocityDefaultHostnameProductType, string> = {
	VPS: "vps",
	VDS: "vds",
	DEDICATED_SERVERS: "ds",
};

function randomHostnameToken(): string {
	return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`.replace(
		/[^a-z0-9]/g,
		"",
	).slice(0, 16);
}

/** e.g. `mpkxfyu852t7fgki-vps.nisccloud.com` */
export function getDefaultHostnameSuffix(
	productType: HivelocityDefaultHostnameProductType,
): string {
	return HOSTNAME_SUFFIX_BY_PRODUCT[productType] ?? "ds";
}

/** Build `{random}-{vps|vds|ds}.{domain}` under {@link HIVELOCITY_DEFAULT_HOSTNAME_DOMAIN}. */
export function generateDefaultHivelocityHostname(
	productType: HivelocityDefaultHostnameProductType,
): string {
	const suffix = getDefaultHostnameSuffix(productType);
	const label = `${randomHostnameToken()}-${suffix}`.slice(0, 63);
	return `${label}.${HIVELOCITY_DEFAULT_HOSTNAME_DOMAIN}`;
}

/** Hostname label (first dot-separated segment), e.g. `abc-vps` from `abc-vps.example.com`. */
export function getHostnameLabelFromFqdn(fqdn: string): string {
	const trimmed = fqdn.trim().toLowerCase();
	const dot = trimmed.indexOf(".");
	return dot === -1 ? trimmed : trimmed.slice(0, dot);
}

/** Keep auto-generated label; swap zone for a domain from the user's subscription. */
export function buildHostnameWithCustomDomain(defaultFqdn: string, domain: string): string {
	const label = getHostnameLabelFromFqdn(defaultFqdn);
	const zone = domain.trim().toLowerCase().replace(/^\.+|\.+$/g, "");
	if (!label || !zone) return defaultFqdn;
	return `${label}.${zone}`;
}

export function isHostnameUnderDefaultDomain(hostname: string): boolean {
	const trimmed = hostname.trim().toLowerCase();
	const domain = HIVELOCITY_DEFAULT_HOSTNAME_DOMAIN.toLowerCase();
	return trimmed === domain || trimmed.endsWith(`.${domain}`);
}

/** Admin / ops reference for default hostname DNS (see docs/hivelocity-provisioning.md §16.1). */
export function getHivelocityDefaultHostnameDnsSetup() {
	const domain = HIVELOCITY_DEFAULT_HOSTNAME_DOMAIN;
	return {
		domain,
		audience: "admin",
		docSection: "docs/hivelocity-provisioning.md §16.1",
		usesWildcard: false,
		summary:
			`This is not wildcard DNS. Each default hostname (e.g. mpkxfyu852t7fgki-vps.${domain}) gets its own A record to that server's unique IP after provisioning.`,
		checklist: [
			`Confirm ${domain} DNS is hosted in OpenProvider / nPanel and API credentials (OPENPROVIDER_*) work in production.`,
			`Ensure ${domain} nameservers are authoritative for the OpenProvider zone you edit via API.`,
			`Add ${domain} to the agency domain portfolio with DNS management enabled.`,
			"Do not add *.nisccloud.com wildcard A - each server has a different IP.",
			"Smoke-test: create then delete a temporary A record (e.g. hv-dns-test) to verify the zone is writable.",
			"Request Hivelocity PTR/rDNS for your IP blocks to match assigned hostnames.",
		],
		automationRecord: {
			type: "A",
			name: `{random-token}-{vps|vds|ds}`,
			value: `{server-public-ip}`,
			ttl: "300–3600",
			note: "One A record per server hostname, created after provisioning when the IP is known.",
		},
		reverseDnsNote:
			"For reverse DNS (PTR), configure your Hivelocity IP block with Hivelocity support so PTR matches the assigned hostname.",
	};
}
