import { TRPCError } from "@trpc/server";
import { and, eq, type SQL } from "@npanel/db";
import { db } from "@npanel/db";
import { nebDesign } from "@npanel/db/schema/nisc-email-builder";

export function isAgencyUserRole(role: string | null | undefined): boolean {
	return ["AGENCY_USER", "AGENCY_ADMIN", "AGENCY_SUPER_ADMIN"].includes(
		role ?? "",
	);
}

export function isAgencySuperAdminRole(role: string | null | undefined): boolean {
	return role === "AGENCY_SUPER_ADMIN";
}

/** Only agency super admins may list or modify designs they do not own. */
export function canManageAllNebDesigns(role: string | null | undefined): boolean {
	return isAgencySuperAdminRole(role);
}

/**
 * List filter: everyone sees only their own designs; super admin may see all
 * (optionally scoped by teamId).
 */
export function buildNebDesignListWhere(params: {
	userId: string;
	userRole?: string | null;
	teamId?: string;
}): SQL | undefined {
	const { userId, userRole, teamId } = params;

	if (canManageAllNebDesigns(userRole)) {
		if (teamId) return eq(nebDesign.teamId, teamId);
		return undefined;
	}

	const own = eq(nebDesign.userId, userId);
	if (teamId) return and(own, eq(nebDesign.teamId, teamId));
	return own;
}

/**
 * Check READ access: Owner, team member, or agency user can view.
 */
export async function assertDesignReadAccess(params: {
	designId: string;
	userId: string;
	userRole?: string | null;
}): Promise<typeof nebDesign.$inferSelect> {
	const design = await db.query.nebDesign.findFirst({
		where: eq(nebDesign.id, params.designId),
	});
	if (!design) {
		throw new TRPCError({ code: "NOT_FOUND", message: "Design not found" });
	}

	// Agency users can view ALL designs
	if (isAgencyUserRole(params.userRole)) return design;

	if (design.teamId) {
		const { assertTeamPermission } = await import("../../lib/team-permissions/assert");
		await assertTeamPermission({
			teamId: design.teamId,
			userId: params.userId,
			userRole: params.userRole,
			key: "email_marketing.email_builder",
			access: "read",
		});
		return design;
	}

	if (design.userId === params.userId) return design;

	throw new TRPCError({ code: "FORBIDDEN", message: "No access to this design" });
}

/**
 * Check MUTATION access: Only owner OR agency super admin can mutate.
 */
export async function assertDesignMutateAccess(params: {
	designId: string;
	userId: string;
	userRole?: string | null;
}): Promise<typeof nebDesign.$inferSelect> {
	const design = await db.query.nebDesign.findFirst({
		where: eq(nebDesign.id, params.designId),
	});
	if (!design) {
		throw new TRPCError({ code: "NOT_FOUND", message: "Design not found" });
	}

	// Only agency SUPER ADMIN can override (not regular agency users)
	if (isAgencySuperAdminRole(params.userRole)) return design;

	if (design.teamId) {
		const { assertTeamPermission } = await import("../../lib/team-permissions/assert");
		await assertTeamPermission({
			teamId: design.teamId,
			userId: params.userId,
			userRole: params.userRole,
			key: "email_marketing.email_builder",
			access: "write",
		});
		return design;
	}

	if (design.userId === params.userId) return design;

	throw new TRPCError({
		code: "FORBIDDEN",
		message: "Only the creator or a teammate with write access can modify this design",
	});
}

/**
 * Legacy: For backward compatibility, use read access.
 * @deprecated Use assertDesignReadAccess or assertDesignMutateAccess explicitly.
 */
export async function assertDesignAccess(params: {
	designId: string;
	userId: string;
	userRole?: string | null;
}): Promise<typeof nebDesign.$inferSelect> {
	return assertDesignReadAccess(params);
}
