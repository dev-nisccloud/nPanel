import { TRPCError } from "@trpc/server";
import { and, eq } from "@npanel/db";
import { db } from "@npanel/db";
import { teamMember } from "@npanel/db/schema/teams";
import { niscClientSubscription } from "@npanel/db/schema/products";
import { assertZeepoAiCanStartTurn, getZeepoAiTokensForTeam, isZeepoAiAgencyUser, } from "./zeepo-ai-tokens";
import { ZEEPO_AI_PRODUCT_ID } from "./zeepo-ai-billing";
import { tryGrantWelcomeTokens } from "./zeepo-ai-free-token-grant";
export async function assertUserIsTeamMember(userId, teamId) {
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
export async function assertZeepoAiTeamAccess(params) {
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
export async function assertZeepoAiSubscriptionForTeam(teamId) {
    const sub = await db.query.niscClientSubscription.findFirst({
        where: and(eq(niscClientSubscription.teamId, teamId), eq(niscClientSubscription.productId, ZEEPO_AI_PRODUCT_ID), eq(niscClientSubscription.status, "ACTIVE")),
        columns: { id: true },
    });
    if (!sub) {
        throw new TRPCError({
            code: "FORBIDDEN",
            message: "No active Zeepo AI wallet. Purchase tokens to continue.",
        });
    }
}
export async function assertCustomerCanUseZeepoAi(params) {
    const teamId = await assertZeepoAiTeamAccess(params);
    if (isZeepoAiAgencyUser(params.userRole) || !teamId) {
        return teamId;
    }
    // Welcome grant may bootstrap the PAYG wallet for eligible teams first.
    if (params.tryWelcomeGrant) {
        await tryGrantWelcomeTokens({
            teamId,
            userId: params.userId,
        });
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
export async function getZeepoAiSubscriptionSummary(teamId) {
    const sub = await db.query.niscClientSubscription.findFirst({
        where: and(eq(niscClientSubscription.teamId, teamId), eq(niscClientSubscription.productId, ZEEPO_AI_PRODUCT_ID), eq(niscClientSubscription.status, "ACTIVE")),
        columns: { id: true, productPlanId: true },
    });
    const tokens = await getZeepoAiTokensForTeam(teamId);
    return {
        hasSubscription: Boolean(sub),
        subscriptionId: sub?.id ?? null,
        tokens: tokens?.tokens ?? 0,
    };
}
