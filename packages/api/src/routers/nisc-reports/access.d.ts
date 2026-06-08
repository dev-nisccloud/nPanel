import { inArray, type SQL } from "@npanel/db";
type ActorRole = string | null | undefined;
export declare function isAgencyUserRole(role: ActorRole): boolean;
export declare function isAgencySuperAdmin(role: ActorRole): boolean;
/** NISC reports are agency-only. */
export declare function requireAgencyReportAccess(role: ActorRole): void;
export type ReportScope = {
    userId: string;
    role: string;
    /** Optional dashboard filter; empty = all teams. */
    teamIds: string[];
};
/** Agency readers see all data; optional teamIds narrows the result set. */
export declare function resolveReportReadScope(params: {
    userId: string;
    role: ActorRole;
    requestedTeamIds?: string[];
}): Promise<ReportScope>;
/** Optional team filter (agency users only reach this via resolveReportReadScope). */
export declare function buildReportEntityScope(params: {
    teamColumn: Parameters<typeof inArray>[0];
    teamIds: string[];
}): SQL<unknown> | undefined;
/**
 * Write access on report-related resources: owner, or agency super admin override.
 * (Report endpoints are read-only today; use this for future mutations.)
 */
export declare function assertAgencyMutationAccess(params: {
    actorUserId: string;
    role: ActorRole;
    ownerUserId: string;
}): void;
export {};
