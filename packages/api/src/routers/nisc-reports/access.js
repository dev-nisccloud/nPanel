import { and, eq, inArray, or } from "@npanel/db";
import { db } from "@npanel/db";
import { team, teamMember } from "@npanel/db/schema/teams";
export function isAgencyUserRole(role) {
    return role === "AGENCY_USER" || role === "AGENCY_ADMIN" || role === "AGENCY_SUPER_ADMIN";
}
export async function resolveReportReadScope(params) {
    const { userId, role, requestedTeamIds } = params;
    const isAgencyUser = isAgencyUserRole(role);
    if (isAgencyUser) {
        return { isAgencyUser, userId, teamIds: requestedTeamIds ?? [] };
    }
    const [memberRows, ownedRows] = await Promise.all([
        db.query.teamMember.findMany({
            where: eq(teamMember.userId, userId),
            columns: { teamId: true },
        }),
        db.query.team.findMany({
            where: eq(team.createdById, userId),
            columns: { id: true },
        }),
    ]);
    const accessibleTeamIds = new Set();
    for (const row of memberRows)
        accessibleTeamIds.add(row.teamId);
    for (const row of ownedRows)
        accessibleTeamIds.add(row.id);
    const requested = requestedTeamIds?.length ? new Set(requestedTeamIds) : null;
    const scopedTeamIds = requested
        ? Array.from(accessibleTeamIds).filter((teamId) => requested.has(teamId))
        : Array.from(accessibleTeamIds);
    return { isAgencyUser, userId, teamIds: scopedTeamIds };
}
export function buildOwnerOrTeamReadScope(params) {
    if (params.isAgencyUser)
        return undefined;
    if (params.teamIds.length === 0)
        return params.ownerCondition;
    return or(params.ownerCondition, inArray(params.teamColumn, params.teamIds));
}
export function buildTeamReadScope(params) {
    if (params.isAgencyUser)
        return undefined;
    if (params.teamIds.length === 0)
        return and(eq(params.teamColumn, "__no_team_access__"));
    return inArray(params.teamColumn, params.teamIds);
}
