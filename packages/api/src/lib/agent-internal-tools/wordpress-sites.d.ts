/**
 * WordPress sites for Zeepo AI.
 *
 * Agency admin+ → every WordPress install on Nisc Cloud servers, with team labels.
 * Customers and AGENCY_USER → sites they own (linked instance / WP hosting
 * subscription) OR WordPress on hosting they own, including subdomains
 * (blog.ashut.com if they own ashut.com). Same cascade as the WordPress details page.
 *
 * Never returns credentials, filesystem paths, Plesk owner IDs, or panel URLs.
 */
export type WordPressSiteKind = "wordpress_hosting" | "on_hosting";
export type WordPressSiteStatus = "Online" | "Offline" | "Unknown";
export type WordPressSecurityStatus = "Secure" | "Needs attention" | "Unknown";
export type WordPressBillingStatus = "Active" | "Suspended" | "Pending" | "Unknown";
export interface WordPressSiteEntry {
    title: string;
    domain: string | null;
    url: string | null;
    version: string | null;
    phpVersion: string | null;
    sslEnabled: boolean | null;
    status: WordPressSiteStatus;
    infected: boolean | null;
    unsupported: boolean | null;
    multisite: boolean | null;
    security: WordPressSecurityStatus;
    pluginUpdates: number | null;
    themeUpdates: number | null;
    availableWpVersion: string | null;
    kind: WordPressSiteKind;
    isSubdomain: boolean;
    planName: string | null;
    billingStatus: WordPressBillingStatus | null;
    expiryDate: string | null;
    teamName: string | null;
}
export interface WordPressSitesResult {
    _tool: "get_wordpress_sites";
    isAgency: boolean;
    teamName: string | null;
    domainFilter: string | null;
    sites: WordPressSiteEntry[];
    totalCount: number;
    onlineCount: number;
    needsAttentionCount: number;
    checkedAt: string;
    error?: string;
}
export declare function agentGetWordPressSites(params: {
    isAgency: boolean;
    teamId: string | null;
    teamName: string | null;
    domain?: string;
}): Promise<WordPressSitesResult>;
