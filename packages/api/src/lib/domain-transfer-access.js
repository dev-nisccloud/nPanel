/**
 * Shared helpers for domain transfer requests.
 * Customer lists are scoped in domain-transfer router; agency sees all.
 * Payment completion trusts the request id from checkout (same ids shown in UI).
 */
import { eq } from "@npanel/db";
import { db } from "@npanel/db";
import { user as userTable } from "@npanel/db/schema/auth";
import { teamMember } from "@npanel/db/schema/teams";
export function isAgencyUserRole(role) {
    const r = role ?? "";
    if (["AGENCY_USER", "AGENCY_ADMIN", "AGENCY_SUPER_ADMIN"].includes(r))
        return true;
    return r.toUpperCase().includes("AGENCY");
}
/** DB-backed agency check (role or assigned agency RBAC role). */
export async function userIsAgencyStaff(userId) {
    const [row] = await db
        .select({ role: userTable.role, agencyRoleId: userTable.agencyRoleId })
        .from(userTable)
        .where(eq(userTable.id, userId))
        .limit(1);
    if (!row)
        return false;
    if (isAgencyUserRole(row.role))
        return true;
    return !!row.agencyRoleId?.trim();
}
export async function getMemberTeamIds(userId) {
    const memberships = await db
        .select({ teamId: teamMember.teamId })
        .from(teamMember)
        .where(eq(teamMember.userId, userId));
    return memberships.map((m) => m.teamId);
}
