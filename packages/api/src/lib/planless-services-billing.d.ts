/**
 * Planless Nisc services - stable product ids (no nisc_product_plan rows).
 * Pricing comes from external catalogs (OpenProvider TLDs, Hivelocity inventory).
 */
export declare const NISC_DOMAINS_PRODUCT_ID = "nisc-domains";
export declare const NISC_VPS_HOSTING_PRODUCT_ID = "nisc-vps-hosting";
export declare const NISC_VDS_HOSTING_PRODUCT_ID = "nisc-vds-hosting";
export declare const NISC_DEDICATED_SERVERS_PRODUCT_ID = "nisc-dedicated-servers";
export declare const PLANLESS_SERVICE_TYPES: {
    readonly domains: "domains";
    readonly vpsHosting: "vps_hosting";
    readonly vdsHosting: "vds_hosting";
    readonly dedicatedServers: "dedicated_server_hosting";
};
