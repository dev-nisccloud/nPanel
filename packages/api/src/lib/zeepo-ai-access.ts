import { TRPCError } from "@trpc/server";
import { and, eq } from "@npanel/db";
import { db } from "@npanel/db";
import { teamMember } from "@npanel/db/schema/teams";
import { niscClientSubscription } from "@npanel/db/schema/products";
import {
	assertZeepoAiCanStartTurn,
	getZeepoAiTokensForTeam,
	isZeepoAiAgencyUser,
} from "./zeepo-ai-tokens";
import { ZEEPO_AI_PRODUCT_ID } from "./zeepo-ai-billing";

export async function assertUserIsTeamMember(userId: string, teamId: string): Promise<void> {
	const row = await db.query.teamMember.findFirst({
		where: and(eq(teamMember.teamId, teamId), eq(teamMember.userId, userId)),
		columns: { id: true },
	});
	if (!row) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "You do not have access to this team.",
		});
	}
}

export async function assertZeepoAiTeamAccess(params: {
	userId: string;
	userRole: string | null | undefined;
	teamId: string | null | undefined;
}): Promise<string | null> {
	if (isZeepoAiAgencyUser(params.userRole)) {
		return params.teamId ?? null;
	}

	if (!params.teamId) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "teamId is required for Zeepo AI on customer accounts.",
		});
	}

	await assertUserIsTeamMember(params.userId, params.teamId);
	return params.teamId;
}

export async function assertZeepoAiSubscriptionForTeam(teamId: string): Promise<void> {
	const sub = await db.query.niscClientSubscription.findFirst({
		where: and(
			eq(niscClientSubscription.teamId, teamId),
			eq(niscClientSubscription.productId, ZEEPO_AI_PRODUCT_ID),
			eq(niscClientSubscription.status, "ACTIVE"),
		),
		columns: { id: true },
	});

	if (!sub) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "No active Zeepo AI wallet. Purchase tokens to continue.",
		});
	}
}

export async function assertCustomerCanUseZeepoAi(params: {
	userId: string;
	userRole: string | null | undefined;
	teamId: string | null | undefined;
	requireTokens?: boolean;
}): Promise<string | null> {
	const teamId = await assertZeepoAiTeamAccess(params);
	if (isZeepoAiAgencyUser(params.userRole) || !teamId) {
		return teamId;
	}

	await assertZeepoAiSubscriptionForTeam(teamId);

	if (params.requireTokens) {
		await assertZeepoAiCanStartTurn({
			teamId,
			userId: params.userId,
			userRole: params.userRole,
		});
	}

	return teamId;
}

export async function getZeepoAiSubscriptionSummary(teamId: string) {
	const sub = await db.query.niscClientSubscription.findFirst({
		where: and(
			eq(niscClientSubscription.teamId, teamId),
			eq(niscClientSubscription.productId, ZEEPO_AI_PRODUCT_ID),
			eq(niscClientSubscription.status, "ACTIVE"),
		),
		columns: { id: true, productPlanId: true },
	});

	const tokens = await getZeepoAiTokensForTeam(teamId);

	return {
		hasSubscription: Boolean(sub),
		subscriptionId: sub?.id ?? null,
		tokens: tokens?.tokens ?? 0,
	};
}
