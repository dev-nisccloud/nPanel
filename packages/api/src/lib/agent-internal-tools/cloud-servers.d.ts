/**
 * Existing VPS / VDS / dedicated subscriptions for Zeepo AI.
 *
 * Agency admin+ → all teams. Customers and AGENCY_USER → active team only.
 * Never returns other teams' servers. Never includes upstream vendor fields.
 */
export type CloudServerKind = "vps" | "vds" | "dedicated";
export interface CloudServerEntry {
    name: string;
    status: "Active" | "Suspended" | "Pending" | "Unknown";
    kind: CloudServerKind;
    hostname: string | null;
    location: string | null;
    billingCycle: string | null;
    expiryDate: string | null;
    nextRenewalDate: string | null;
    autoRenew: boolean | null;
    price: string | null;
    currency: string | null;
    teamName: string | null;
}
export interface CloudServersResult {
    _tool: "get_cloud_servers";
    kind: CloudServerKind | "all";
    isAgency: boolean;
    teamName: string | null;
    servers: CloudServerEntry[];
    totalCount: number;
    activeCount: number;
    suspendedCount: number;
    checkedAt: string;
    error?: string;
}
export declare function agentGetCloudServers(params: {
    kind?: CloudServerKind | "all";
    isAgency: boolean;
    teamId: string | null;
    teamName: string | null;
}): Promise<CloudServersResult>;
