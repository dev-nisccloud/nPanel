import { TRPCError } from "@trpc/server";
import { and, eq } from "@npanel/db";
import { db } from "@npanel/db";
import { nebDesign } from "@npanel/db/schema/nisc-email-builder";
export function isAgencyUserRole(role) {
    return ["AGENCY_USER", "AGENCY_ADMIN", "AGENCY_SUPER_ADMIN"].includes(role ?? "");
}
export function isAgencySuperAdminRole(role) {
    return role === "AGENCY_SUPER_ADMIN";
}
/** Only agency super admins may list or modify designs they do not own. */
export function canManageAllNebDesigns(role) {
    return isAgencySuperAdminRole(role);
}
/**
 * List filter: everyone sees only their own designs; super admin may see all
 * (optionally scoped by teamId).
 */
export function buildNebDesignListWhere(params) {
    const { userId, userRole, teamId } = params;
    if (canManageAllNebDesigns(userRole)) {
        if (teamId)
            return eq(nebDesign.teamId, teamId);
        return undefined;
    }
    const own = eq(nebDesign.userId, userId);
    if (teamId)
        return and(own, eq(nebDesign.teamId, teamId));
    return own;
}
export async function assertDesignAccess(params) {
    const design = await db.query.nebDesign.findFirst({
        where: eq(nebDesign.id, params.designId),
    });
    if (!design) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Design not found" });
    }
    if (design.userId === params.userId)
        return design;
    if (canManageAllNebDesigns(params.userRole))
        return design;
    throw new TRPCError({ code: "FORBIDDEN", message: "No access to this design" });
}
