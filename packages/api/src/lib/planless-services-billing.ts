/**
 * Planless Nisc services - stable product ids (no nisc_product_plan rows).
 * Pricing comes from external catalogs (OpenProvider TLDs, Hivelocity inventory).
 */

export const NISC_DOMAINS_PRODUCT_ID = "nisc-domains";
export const NISC_VPS_HOSTING_PRODUCT_ID = "nisc-vps-hosting";
export const NISC_VDS_HOSTING_PRODUCT_ID = "nisc-vds-hosting";
export const NISC_DEDICATED_SERVERS_PRODUCT_ID = "nisc-dedicated-servers";

export const PLANLESS_SERVICE_TYPES = {
	domains: "domains",
	vpsHosting: "vps_hosting",
	vdsHosting: "vds_hosting",
	dedicatedServers: "dedicated_server_hosting",
} as const;
