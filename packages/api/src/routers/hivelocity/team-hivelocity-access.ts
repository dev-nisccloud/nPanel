import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { and, eq, ilike, sql } from "@npanel/db";
import { db } from "@npanel/db";
import {
	niscClientSubscription,
	niscProduct,
	niscProductPlan,
} from "@npanel/db/schema/products";
import { team, teamMember } from "@npanel/db/schema/teams";
import { assertTeamModulePermission } from "../../lib/team-permissions/assert";

export type TeamHivelocityResourceCategory = "vps" | "vds" | "dedicated";

/** Optional team scope for Hivelocity device calls - both fields required together. */
export const teamHivelocityAccessSchema = z
	.object({
		teamSlug: z.string().min(1).optional(),
		teamResourceCategory: z.enum(["vps", "vds", "dedicated"]).optional(),
	})
	.superRefine((v, ctx) => {
		if (Boolean(v.teamSlug) !== Boolean(v.teamResourceCategory)) {
			ctx.addIssue({
				code: "custom",
				message: "teamSlug and teamResourceCategory must both be set or both omitted",
				path: ["teamSlug"],
			});
		}
	});

export const isAgencyUserRole = (role: string | null | undefined) =>
	["AGENCY_USER", "AGENCY_ADMIN", "AGENCY_SUPER_ADMIN"].includes(role ?? "");

export type TeamHivelocitySubscriptionContext = {
	subscriptionId: string;
	status: string;
	name: string | null;
	agreedPrice: string | null;
	agreedCurrency: string | null;
	billingCycle: string | null;
	productId: string;
	productName: string;
	productPlanName: string | null;
};

function parseLinkedDeviceId(serviceRefs: unknown): number | null {
	const refs = serviceRefs as Record<string, unknown> | null;
	const raw = refs?.hivelocityDeviceId;
	const n = typeof raw === "number" ? raw : typeof raw === "string" ? parseInt(raw, 10) : NaN;
	return !Number.isNaN(n) && n > 0 ? n : null;
}

/** Subscription rows linked to Hivelocity devices for a team + product category. */
export async function collectTeamHivelocitySubscriptionContext(
	teamId: string,
	category: TeamHivelocityResourceCategory,
): Promise<Map<number, TeamHivelocitySubscriptionContext>> {
	const productCond = productNameConditionForCategory(category);
	const rows = await db
		.select({
			subscriptionId: niscClientSubscription.id,
			status: niscClientSubscription.status,
			name: niscClientSubscription.name,
			agreedPrice: niscClientSubscription.agreedPrice,
			agreedCurrency: niscClientSubscription.agreedCurrency,
			billingCycle: niscClientSubscription.billingCycle,
			productId: niscClientSubscription.productId,
			productName: niscProduct.name,
			productPlanName: niscProductPlan.name,
			serviceRefs: niscClientSubscription.serviceRefs,
		})
		.from(niscClientSubscription)
		.innerJoin(niscProduct, eq(niscClientSubscription.productId, niscProduct.id))
		.leftJoin(niscProductPlan, eq(niscClientSubscription.productPlanId, niscProductPlan.id))
		.where(and(eq(niscClientSubscription.teamId, teamId), productCond));

	const out = new Map<number, TeamHivelocitySubscriptionContext>();
	for (const row of rows) {
		const deviceId = parseLinkedDeviceId(row.serviceRefs);
		if (deviceId == null) continue;
		out.set(deviceId, {
			subscriptionId: row.subscriptionId,
			status: row.status,
			name: row.name,
			agreedPrice: row.agreedPrice,
			agreedCurrency: row.agreedCurrency,
			billingCycle: row.billingCycle,
			productId: row.productId,
			productName: row.productName,
			productPlanName: row.productPlanName,
		});
	}
	return out;
}

export function buildHivelocitySubscriptionServiceLabel(ctx: TeamHivelocitySubscriptionContext): string {
	const trimmedName = ctx.name?.trim();
	if (trimmedName) return trimmedName;
	const base = ctx.productPlanName?.trim()
		? `${ctx.productName} - ${ctx.productPlanName}`
		: ctx.productName;
	return base;
}

export function redactSuspendedHivelocityResourceForCustomer(
	deviceId: number,
	resourceType: TeamHivelocityResourceCategory,
	sub: TeamHivelocitySubscriptionContext,
) {
	const amount = sub.agreedPrice != null ? Number.parseFloat(sub.agreedPrice) : 0;
	return {
		deviceId,
		id: deviceId,
		resourceType,
		panelSuspended: true as const,
		subscriptionId: sub.subscriptionId,
		serviceLabel: buildHivelocitySubscriptionServiceLabel(sub),
		reactivationAmount: Number.isFinite(amount) ? amount : 0,
		reactivationCurrency: sub.agreedCurrency ?? "KES",
		billingCycle: sub.billingCycle,
		productId: sub.productId,
	};
}

function productNameConditionForCategory(category: TeamHivelocityResourceCategory) {
	if (category === "vps") return ilike(niscProduct.name, "%vps hosting%");
	if (category === "vds") return ilike(niscProduct.name, "%vds hosting%");
	return ilike(niscProduct.name, "%dedicated servers hosting%");
}

export async function getTeamIdBySlugForHivelocity(slug: string): Promise<string | null> {
	const [row] = await db.select({ id: team.id }).from(team).where(eq(team.slug, slug)).limit(1);
	return row?.id ?? null;
}

export async function assertUserCanReadTeamCloud(
	teamId: string,
	userId: string,
	role: string | null | undefined,
): Promise<void> {
	if (isAgencyUserRole(role)) return;
	const [memberRow, ownerRow] = await Promise.all([
		db.query.teamMember.findFirst({
			where: and(eq(teamMember.teamId, teamId), eq(teamMember.userId, userId)),
			columns: { id: true },
		}),
		db.query.team.findFirst({
			where: and(eq(team.id, teamId), eq(team.createdById, userId)),
			columns: { id: true },
		}),
	]);
	if (!memberRow && !ownerRow) {
		throw new TRPCError({ code: "FORBIDDEN", message: "You do not have access to this team" });
	}
}

/**
 * Device IDs linked to the team via nisc_client_subscription.serviceRefs.hivelocityDeviceId
 * for products whose names match the cloud category (same naming as subscription creation UI).
 */
export async function collectHivelocityDeviceIdsForTeam(
	teamId: string,
	category: TeamHivelocityResourceCategory,
): Promise<Set<number>> {
	const productCond = productNameConditionForCategory(category);
	const rows = await db
		.select({ serviceRefs: niscClientSubscription.serviceRefs })
		.from(niscClientSubscription)
		.innerJoin(niscProduct, eq(niscClientSubscription.productId, niscProduct.id))
		.where(and(eq(niscClientSubscription.teamId, teamId), productCond));

	const out = new Set<number>();
	for (const r of rows) {
		const refs = r.serviceRefs as Record<string, unknown> | null;
		const raw = refs?.hivelocityDeviceId;
		const n = typeof raw === "number" ? raw : typeof raw === "string" ? parseInt(raw, 10) : NaN;
		if (!Number.isNaN(n) && n > 0) out.add(n);
	}
	return out;
}

async function assertHivelocitySubscriptionActiveForCustomer(params: {
	teamId: string;
	deviceId: number;
	category: TeamHivelocityResourceCategory;
	role: string | null | undefined;
}): Promise<void> {
	if (isAgencyUserRole(params.role)) return;

	const productCond = productNameConditionForCategory(params.category);
	const idStr = String(params.deviceId);
	const [row] = await db
		.select({ status: niscClientSubscription.status })
		.from(niscClientSubscription)
		.innerJoin(niscProduct, eq(niscClientSubscription.productId, niscProduct.id))
		.where(
			and(
				eq(niscClientSubscription.teamId, params.teamId),
				productCond,
				sql`(${niscClientSubscription.serviceRefs}->>'hivelocityDeviceId') = ${idStr}`,
			),
		)
		.limit(1);

	if (row?.status === "SUSPENDED") {
		throw new TRPCError({
			code: "FORBIDDEN",
			message:
				"This server has been suspended and is temporarily unavailable. Contact Nisc Cloud support to restore access.",
		});
	}
}

export async function assertHivelocityDeviceLinkedToTeam(params: {
	teamSlug: string;
	deviceId: number;
	category: TeamHivelocityResourceCategory;
	userId: string;
	role: string | null | undefined;
}): Promise<void> {
	const teamId = await getTeamIdBySlugForHivelocity(params.teamSlug);
	if (!teamId) {
		throw new TRPCError({ code: "NOT_FOUND", message: "Team not found" });
	}
	await assertUserCanReadTeamCloud(teamId, params.userId, params.role);
	await assertTeamModulePermission({
		teamId,
		userId: params.userId,
		userRole: params.role,
		module: `servers.${params.category === "dedicated" ? "dedicated" : params.category}`,
		access: "read",
	});
	const allowed = await collectHivelocityDeviceIdsForTeam(teamId, params.category);
	if (!allowed.has(params.deviceId)) {
		throw new TRPCError({ code: "FORBIDDEN", message: "You do not have access to this server" });
	}
	await assertHivelocitySubscriptionActiveForCustomer({
		teamId,
		deviceId: params.deviceId,
		category: params.category,
		role: params.role,
	});
}

type SessionUser = { id: string; role: string | null };

export async function maybeAssertTeamHivelocityDeviceAccess(params: {
	ctx: { session: { user: SessionUser } | null };
	input: {
		deviceId?: number;
		teamSlug?: string;
		teamResourceCategory?: TeamHivelocityResourceCategory;
	};
}): Promise<void> {
	const { teamSlug, teamResourceCategory, deviceId } = params.input;
	if (!teamSlug || !teamResourceCategory || deviceId == null) return;
	const userId = params.ctx.session?.user?.id;
	if (!userId) {
		throw new TRPCError({ code: "UNAUTHORIZED", message: "You must be logged in" });
	}
	await assertHivelocityDeviceLinkedToTeam({
		teamSlug,
		deviceId,
		category: teamResourceCategory,
		userId,
		role: params.ctx.session?.user?.role ?? null,
	});
}
