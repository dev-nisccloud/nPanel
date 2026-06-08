import { TRPCError } from "@trpc/server";
import { inArray } from "@npanel/db";
export function isAgencyUserRole(role) {
    return role === "AGENCY_USER" || role === "AGENCY_ADMIN" || role === "AGENCY_SUPER_ADMIN";
}
export function isAgencySuperAdmin(role) {
    return role === "AGENCY_SUPER_ADMIN";
}
/** NISC reports are agency-only. */
export function requireAgencyReportAccess(role) {
    if (!isAgencyUserRole(role)) {
        throw new TRPCError({
            code: "FORBIDDEN",
            message: "NISC reports are only available to agency users.",
        });
    }
}
/** Agency readers see all data; optional teamIds narrows the result set. */
export async function resolveReportReadScope(params) {
    requireAgencyReportAccess(params.role);
    return {
        userId: params.userId,
        role: params.role ?? "",
        teamIds: params.requestedTeamIds ?? [],
    };
}
/** Optional team filter (agency users only reach this via resolveReportReadScope). */
export function buildReportEntityScope(params) {
    if (params.teamIds.length === 0)
        return undefined;
    return inArray(params.teamColumn, params.teamIds);
}
/**
 * Write access on report-related resources: owner, or agency super admin override.
 * (Report endpoints are read-only today; use this for future mutations.)
 */
export function assertAgencyMutationAccess(params) {
    requireAgencyReportAccess(params.role);
    if (isAgencySuperAdmin(params.role))
        return;
    if (params.actorUserId === params.ownerUserId)
        return;
    throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only the record owner or an agency super admin can perform this action.",
    });
}
