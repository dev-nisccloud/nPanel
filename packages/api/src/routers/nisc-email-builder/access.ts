import { TRPCError } from "@trpc/server";
import { and, eq } from "@npanel/db";
import { db } from "@npanel/db";
import { nebDesign } from "@npanel/db/schema/nisc-email-builder";
import { teamMember } from "@npanel/db/schema/teams";

export function isAgencyUserRole(role: string | null | undefined): boolean {
	return ["AGENCY_USER", "AGENCY_ADMIN", "AGENCY_SUPER_ADMIN"].includes(
		role ?? "",
	);
}

export function isAgencySuperAdminRole(role: string | null | undefined): boolean {
	return role === "AGENCY_SUPER_ADMIN";
}

export async function assertDesignAccess(params: {
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

	if (design.userId === params.userId) return design;

	if (design.teamId && isAgencyUserRole(params.userRole)) {
		const membership = await db.query.teamMember.findFirst({
			where: and(
				eq(teamMember.teamId, design.teamId),
				eq(teamMember.userId, params.userId),
			),
		});
		if (membership) return design;
	}

	throw new TRPCError({ code: "FORBIDDEN", message: "No access to this design" });
}
