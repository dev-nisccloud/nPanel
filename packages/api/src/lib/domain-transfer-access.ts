/**
 * Shared helpers for domain transfer requests.
 * Customer lists are scoped in domain-transfer router; agency sees all.
 * Payment completion trusts the request id from checkout (same ids shown in UI).
 */
import { TRPCError } from "@trpc/server";
import { eq } from "@npanel/db";
import { db } from "@npanel/db";
import { user as userTable } from "@npanel/db/schema/auth";
import { teamMember } from "@npanel/db/schema/teams";

export function isAgencyUserRole(role: string | null | undefined): boolean {
	const r = role ?? "";
	if (["AGENCY_USER", "AGENCY_ADMIN", "AGENCY_SUPER_ADMIN"].includes(r)) return true;
	return r.toUpperCase().includes("AGENCY");
}

/** DB-backed agency check (role or assigned agency RBAC role). */
export async function userIsAgencyStaff(userId: string): Promise<boolean> {
	const [row] = await db
		.select({ role: userTable.role, agencyRoleId: userTable.agencyRoleId })
		.from(userTable)
		.where(eq(userTable.id, userId))
		.limit(1);
	if (!row) return false;
	if (isAgencyUserRole(row.role)) return true;
	return !!row.agencyRoleId?.trim();
}

export async function getMemberTeamIds(userId: string): Promise<string[]> {
	const memberships = await db
		.select({ teamId: teamMember.teamId })
		.from(teamMember)
		.where(eq(teamMember.userId, userId));
	return memberships.map((m) => m.teamId);
}

export async function assertAgencyStaff(userId: string): Promise<void> {
	const ok = await userIsAgencyStaff(userId);
	if (!ok) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "Only agency users can perform this action.",
		});
	}
}

/** DB role must be AGENCY_SUPER_ADMIN. Session role is not trusted. */
export async function assertAgencySuperAdmin(userId: string): Promise<void> {
	const [row] = await db
		.select({ role: userTable.role })
		.from(userTable)
		.where(eq(userTable.id, userId))
		.limit(1);

	if (!row) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "User not found",
		});
	}

	if (row.role !== "AGENCY_SUPER_ADMIN") {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "You do not have permission to edit domain contacts",
		});
	}
}
