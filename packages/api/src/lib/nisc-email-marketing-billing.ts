/**
 * Nisc Email Marketing - stable product and plan ids (seeded by apps/server).
 */

import { TRPCError } from "@trpc/server";
import { and, eq, exists, ilike, inArray, or } from "@npanel/db";
import { db } from "@npanel/db";
import { niscClientSubscription, niscProduct, team } from "@npanel/db/schema";

/** Stable product id - seeded by apps/server/src/scripts/seed-nisc-email-marketing-product.ts */
export const NISC_EMAIL_MARKETING_PRODUCT_ID = "nisc-email-marketing";

export const NISC_EMAIL_MARKETING_PLAN_IDS = {
	starter: "nisc-email-marketing-plan-starter",
	growth: "nisc-email-marketing-plan-growth",
	pro: "nisc-email-marketing-plan-pro",
} as const;

/** Teams can be linked only while the subscription is still usable. */
export const NISC_EM_LINKABLE_SUBSCRIPTION_STATUSES = [
	"ACTIVE",
	"PENDING",
	"PROCESSING",
] as const;

/** Subscription usage row kinds on nisc_client_subscription_usage. */
export const NISC_EM_CONTACTS_USAGE_KIND = "nisc_em_contacts";
export const NISC_EM_EMAILS_MONTHLY_USAGE_KIND = "nisc_em_emails_monthly";

export async function getNiscEmailMarketingProductIds(): Promise<string[]> {
	const products = await db
		.select({ id: niscProduct.id })
		.from(niscProduct)
		.where(
			or(
				eq(niscProduct.id, NISC_EMAIL_MARKETING_PRODUCT_ID),
				eq(niscProduct.serviceType, "nisc_email_marketing"),
				ilike(niscProduct.name, "%nisc email marketing%"),
				ilike(niscProduct.name, "%email marketing%"),
			),
		);
	return products.map((p) => p.id);
}

export async function teamHasNiscEmailMarketingSubscription(teamId: string): Promise<boolean> {
	const productIds = await getNiscEmailMarketingProductIds();
	if (productIds.length === 0) return false;

	const [row] = await db
		.select({ id: niscClientSubscription.id })
		.from(niscClientSubscription)
		.where(
			and(
				eq(niscClientSubscription.teamId, teamId),
				inArray(niscClientSubscription.productId, productIds),
				inArray(niscClientSubscription.status, [...NISC_EM_LINKABLE_SUBSCRIPTION_STATUSES]),
			),
		)
		.limit(1);

	return Boolean(row);
}

export async function assertTeamHasNiscEmailMarketingSubscription(teamId: string): Promise<void> {
	const ok = await teamHasNiscEmailMarketingSubscription(teamId);
	if (!ok) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message:
				"This organization does not have an existing NISC Email Marketing subscription. Link only to organizations that already have this service.",
		});
	}
}

function isAgencyUserRole(role: string | null | undefined): boolean {
	return ["AGENCY_USER", "AGENCY_ADMIN", "AGENCY_SUPER_ADMIN"].includes(role ?? "");
}

/** Agency-only, one-time link. Rejects customers and already-linked resources. */
export async function assertCanLinkNiscEmResource(params: {
	role: string | null | undefined;
	currentTeamId: string | null | undefined;
	nextTeamId: string;
}): Promise<void> {
	if (!isAgencyUserRole(params.role)) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "Only agency users can link email marketing resources to an organization",
		});
	}
	if (params.currentTeamId) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "This resource is already linked to an organization",
		});
	}
	await assertTeamHasNiscEmailMarketingSubscription(params.nextTeamId);
}

export async function listTeamsWithNiscEmailMarketingSubscription(): Promise<
	Array<{ id: string; name: string; slug: string }>
> {
	const productIds = await getNiscEmailMarketingProductIds();
	if (productIds.length === 0) return [];

	return db
		.select({
			id: team.id,
			name: team.name,
			slug: team.slug,
		})
		.from(team)
		.where(
			exists(
				db
					.select({ id: niscClientSubscription.id })
					.from(niscClientSubscription)
					.where(
						and(
							eq(niscClientSubscription.teamId, team.id),
							inArray(niscClientSubscription.productId, productIds),
							inArray(
								niscClientSubscription.status,
								[...NISC_EM_LINKABLE_SUBSCRIPTION_STATUSES],
							),
						),
					),
			),
		)
		.orderBy(team.name);
}
