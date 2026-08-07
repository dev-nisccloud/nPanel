import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements } from "better-auth/plugins/admin/access";
/**
 * Better Auth admin AC mapped onto nPanel's existing `user.role` values.
 * Only AGENCY_SUPER_ADMIN may impersonate; other admin plugin actions stay disabled
 * (agency user management already goes through tRPC).
 */
export const adminStatement = {
    ...defaultStatements,
};
export const adminAcController = createAccessControl(adminStatement);
const noAdminAccess = adminAcController.newRole({
    user: [],
    session: [],
});
/** Agency super admins: impersonate customers only. */
export const agencySuperAdminAc = adminAcController.newRole({
    user: ["impersonate"],
    session: [],
});
export const adminAccessRoles = {
    AGENCY_SUPER_ADMIN: agencySuperAdminAc,
    AGENCY_ADMIN: noAdminAccess,
    AGENCY_USER: noAdminAccess,
    CUSTOMER: noAdminAccess,
};
/** Roles that must never be impersonation targets (agency staff). */
export const agencyAdminRoles = [
    "AGENCY_SUPER_ADMIN",
    "AGENCY_ADMIN",
    "AGENCY_USER",
];
export const IMPERSONATION_SESSION_DURATION_SEC = 60 * 60; // 1 hour
