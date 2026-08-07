/**
 * Nisc Payment Gateway - Access Control
 *
 * Role-based access control for the Nisc Payment Gateway:
 * - Agency users: Can view ALL records (queries), mutations limited to owner or super admin
 * - Normal users/customers: Can only see their own records (filtered by userId and optional teamId)
 */
import { TRPCError } from "@trpc/server";
import { eq, or, and, inArray } from "@npanel/db";
// =============================================================================
// ROLE CHECKS
// =============================================================================
export function isAgencyUserRole(role) {
    return role === "AGENCY_USER" || role === "AGENCY_ADMIN" || role === "AGENCY_SUPER_ADMIN";
}
export function isAgencySuperAdmin(role) {
    return role === "AGENCY_SUPER_ADMIN";
}
/**
 * Resolve access scope for queries:
 * - Agency users: Can see all records (no userId filtering)
 * - Normal users: Can only see their own records (filtered by userId and optional teamId)
 */
export async function resolveGatewayReadScope(params) {
    const isAgency = isAgencyUserRole(params.role);
    return {
        userId: params.userId,
        role: params.role ?? "",
        isAgencyUser: isAgency,
        teamIds: params.requestedTeamIds ?? [],
    };
}
/**
 * Build WHERE clause for merchant/record filtering based on access scope.
 *
 * @param userIdColumn - The userId column to filter by (e.g., niscPaymentGatewayMerchant.userId)
 * @param teamIdColumn - The teamId column to filter by (e.g., niscPaymentGatewayMerchant.teamId)
 * @param scope - The access scope from resolveGatewayReadScope
 * @returns SQL condition or undefined (for agency users who can see all)
 */
export function buildGatewayAccessFilter(params) {
    const { userIdColumn, teamIdColumn, scope } = params;
    // Agency users can see ALL records
    if (scope.isAgencyUser) {
        return undefined;
    }
    // Normal users: filter by userId and optional teamIds
    const conditions = [eq(userIdColumn, scope.userId)];
    if (scope.teamIds.length > 0) {
        conditions.push(inArray(teamIdColumn, scope.teamIds));
    }
    return or(...conditions);
}
/**
 * Assert that the current user can mutate (create/update/delete) a record.
 *
 * Rules:
 * - Agency super admin: Can mutate any record
 * - Record owner: Can mutate their own record
 * - Other users: Cannot mutate
 *
 * @throws {TRPCError} If access is denied
 */
export function assertGatewayMutationAccess(params) {
    // Agency super admin can mutate anything
    if (isAgencySuperAdmin(params.role)) {
        return;
    }
    // Record owner can mutate their own record
    if (params.actorUserId === params.ownerUserId) {
        return;
    }
    throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only the record owner or an agency super admin can perform this action.",
    });
}
/**
 * Assert that the current user can read a specific record.
 *
 * Rules:
 * - Agency users: Can read any record
 * - Normal users: Can only read their own records or records from their team
 *
 * @throws {TRPCError} If access is denied
 */
export function assertGatewayReadAccess(params) {
    // Agency users can read anything
    if (isAgencyUserRole(params.role)) {
        return;
    }
    // Normal users can read their own records
    if (params.actorUserId === params.ownerUserId) {
        return;
    }
    // Normal users can read team records if teamId is provided
    if (params.teamId && params.requestedTeamIds?.includes(params.teamId)) {
        return;
    }
    throw new TRPCError({
        code: "FORBIDDEN",
        message: "Access denied to this record.",
    });
}
