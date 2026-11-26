/**
 * Domain contact edits.
 * Agency super admins can update details and replace the owner.
 * A customer team member can update details only, and only for a domain
 * subscription on the team in the portfolio URL.
 */
import { TRPCError } from "@trpc/server";
import { and, eq, ilike, isNull } from "@npanel/db";
import { db } from "@npanel/db";
import { user as userTable } from "@npanel/db/schema/auth";
import { team, teamMember } from "@npanel/db/schema/teams";
import { niscClientSubscription, niscProduct } from "@npanel/db/schema/products";
import { domainProductSqlFilter } from "./nisc-domain-product";

export async function assertDomainContactEditAccess(params: {
	userId: string;
	intent: "update" | "replace";
	teamSlug?: string | null;
	openProviderId?: number | null;
	domainName?: string | null;
}): Promise<void> {
	const [userRow] = await db
		.select({ role: userTable.role })
		.from(userTable)
		.where(eq(userTable.id, params.userId))
		.limit(1);

	if (!userRow) {
		throw new TRPCError({ code: "UNAUTHORIZED", message: "User not found" });
	}

	if (userRow.role === "AGENCY_SUPER_ADMIN") return;

	if (params.intent !== "update") {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "You do not have permission to replace a domain owner",
		});
	}

	const slug = params.teamSlug?.trim();
	if (!slug) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "You do not have permission to edit domain contacts",
		});
	}

	const [teamRow] = await db
		.select({ id: team.id, createdById: team.createdById })
		.from(team)
		.where(eq(team.slug, slug))
		.limit(1);

	if (!teamRow) {
		throw new TRPCError({ code: "NOT_FOUND", message: "Team not found" });
	}

	const [member] = await db
		.select({ id: teamMember.id })
		.from(teamMember)
		.where(and(eq(teamMember.teamId, teamRow.id), eq(teamMember.userId, params.userId)))
		.limit(1);

	if (!member && teamRow.createdById !== params.userId) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "You do not have access to this team",
		});
	}

	const domainName = params.domainName?.trim().toLowerCase().replace(/\.$/, "");
	const identity =
		params.openProviderId != null && params.openProviderId > 0
			? eq(niscClientSubscription.openProviderId, params.openProviderId)
			: domainName
				? ilike(niscClientSubscription.primaryDomain, domainName)
				: null;

	if (!identity) {
		throw new TRPCError({ code: "BAD_REQUEST", message: "Domain not found" });
	}

	const rows = await db
		.select({ id: niscClientSubscription.id })
		.from(niscClientSubscription)
		.innerJoin(niscProduct, eq(niscClientSubscription.productId, niscProduct.id))
		.where(
			and(
				eq(niscClientSubscription.teamId, teamRow.id),
				identity,
				domainProductSqlFilter(),
				isNull(niscClientSubscription.upgradedToSubscriptionId),
				isNull(niscClientSubscription.downgradedToSubscriptionId),
			),
		)
		.limit(1);

	if (!rows[0]) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "You do not have access to this domain",
		});
	}
}
