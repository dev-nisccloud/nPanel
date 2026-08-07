/**
 * Nisc Payment Gateway - Access Control
 *
 * Role-based access control for the Nisc Payment Gateway:
 * - Agency users: Can view ALL records (queries), mutations limited to owner or super admin
 * - Normal users/customers: Can only see their own records (filtered by userId and optional teamId)
 */
import { type SQL } from "@npanel/db";
type ActorRole = string | null | undefined;
export declare function isAgencyUserRole(role: ActorRole): boolean;
export declare function isAgencySuperAdmin(role: ActorRole): boolean;
export type GatewayAccessScope = {
    userId: string;
    role: string;
    isAgencyUser: boolean;
    /** For non-agency users, optional team IDs to filter by */
    teamIds: string[];
};
/**
 * Resolve access scope for queries:
 * - Agency users: Can see all records (no userId filtering)
 * - Normal users: Can only see their own records (filtered by userId and optional teamId)
 */
export declare function resolveGatewayReadScope(params: {
    userId: string;
    role: ActorRole;
    requestedTeamIds?: string[];
}): Promise<GatewayAccessScope>;
/**
 * Build WHERE clause for merchant/record filtering based on access scope.
 *
 * @param userIdColumn - The userId column to filter by (e.g., niscPaymentGatewayMerchant.userId)
 * @param teamIdColumn - The teamId column to filter by (e.g., niscPaymentGatewayMerchant.teamId)
 * @param scope - The access scope from resolveGatewayReadScope
 * @returns SQL condition or undefined (for agency users who can see all)
 */
export declare function buildGatewayAccessFilter(params: {
    userIdColumn: any;
    teamIdColumn: any;
    scope: GatewayAccessScope;
}): SQL<unknown> | undefined;
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
export declare function assertGatewayMutationAccess(params: {
    actorUserId: string;
    role: ActorRole;
    ownerUserId: string;
}): void;
/**
 * Assert that the current user can read a specific record.
 *
 * Rules:
 * - Agency users: Can read any record
 * - Normal users: Can only read their own records or records from their team
 *
 * @throws {TRPCError} If access is denied
 */
export declare function assertGatewayReadAccess(params: {
    actorUserId: string;
    role: ActorRole;
    ownerUserId: string;
    teamId?: string | null;
    requestedTeamIds?: string[];
}): void;
export {};
