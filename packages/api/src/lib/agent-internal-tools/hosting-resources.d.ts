/**
 * Hosting resource tools for the Zeepo AI Agent.
 *
 * get_hosting_resources  – list all hosting subscriptions (role-aware)
 *   Agency  → live Plesk XML (all webspaces) enriched with DB billing data
 *   Customer→ nisc_client_subscription DB (web-hosting products for the team)
 *
 * get_hosting_detail – full detail for one subscription identified by domain
 *   Both roles: Plesk XML (live stats) + DB billing overlay
 *   Customer access is scoped to the team's own subscriptions.
 *
 * Sensitive data intentionally omitted from all results:
 *   FTP credentials, numeric Plesk IDs, internal DB identifiers.
 */
export interface HostingMailAccount {
    email: string;
    mailboxEnabled: boolean;
    quotaBytes: number;
    quotaFormatted: string;
    usageBytes: number;
    usageFormatted: string;
    forwardingEnabled: boolean;
    forwardingAddresses: string[];
    aliases: string[];
    autoresponderEnabled: boolean;
}
export interface HostingSubdomain {
    name: string;
    fqdn: string;
}
export interface HostingDatabase {
    name: string;
    type: string;
}
export interface HostingResourceEntry {
    domain: string | null;
    status: "Active" | "Suspended" | "Unknown";
    ipAddress: string | null;
    sslEnabled: boolean;
    diskUsageBytes: number;
    diskLimitBytes: number;
    diskUsageFormatted: string;
    diskLimitFormatted: string;
    trafficBytes: number;
    trafficFormatted: string;
    createdAt: string | null;
    planName: string | null;
    hostingType: string | null;
    billingCycle: string | null;
    expiryDate: string | null;
    nextRenewalDate: string | null;
    autoRenew: boolean | null;
    teamName: string | null;
}
export interface HostingResourcesResult {
    _tool: "get_hosting_resources";
    isAgency: boolean;
    teamName: string | null;
    resources: HostingResourceEntry[];
    totalCount: number;
    activeCount: number;
    suspendedCount: number;
    pleskUnavailable?: boolean;
    checkedAt: string;
}
export interface HostingDetailResult {
    _tool: "get_hosting_detail";
    domain: string;
    found: boolean;
    status: "Active" | "Suspended" | "Unknown";
    ipAddress: string | null;
    sslEnabled: boolean;
    certificateName: string | null;
    diskUsageBytes: number;
    diskLimitBytes: number;
    diskUsageFormatted: string;
    diskLimitFormatted: string;
    trafficBytes: number;
    trafficFormatted: string;
    mailboxCount: number;
    databaseCount: number;
    subdomainCount: number;
    createdAt: string | null;
    planName: string | null;
    hostingType: string | null;
    billingCycle: string | null;
    expiryDate: string | null;
    nextRenewalDate: string | null;
    autoRenew: boolean | null;
    teamName: string | null;
    dnsRecords?: Array<{
        type: string;
        host: string;
        value: string;
        ttl?: number;
    }>;
    mailAccounts?: HostingMailAccount[];
    subdomains?: HostingSubdomain[];
    databases?: HostingDatabase[];
    accessDenied?: boolean;
    pleskUnavailable?: boolean;
    error?: string;
    checkedAt: string;
}
export declare function agentGetHostingResources(params: {
    isAgency: boolean;
    teamId: string | null;
    teamName: string | null;
}): Promise<HostingResourcesResult>;
export declare function agentGetHostingDetail(params: {
    domain: string;
    isAgency: boolean;
    teamId: string | null;
    includeDns: boolean;
    includeMail: boolean;
    includeSubdomains: boolean;
    includeDatabases: boolean;
}): Promise<HostingDetailResult>;
