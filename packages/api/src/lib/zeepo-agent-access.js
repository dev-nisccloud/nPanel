import { TRPCError } from "@trpc/server";
import { and, eq } from "@npanel/db";
import { db } from "@npanel/db";
import { teamMember } from "@npanel/db/schema/teams";
import { assertZeepoAgentCanStartTurn, getZeepoAgentTokensForTeam, isZeepoAgentAgencyUser, } from "./zeepo-agent-tokens";
import { ZEEPO_AI_AGENT_PRODUCT_ID } from "./zeepo-agent-billing";
import { niscClientSubscription } from "@npanel/db/schema/products";
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
/** Customers must pass teamId and be a member; agency users may omit teamId. */
export async function assertZeepoAgentTeamAccess(params) {
    if (isZeepoAgentAgencyUser(params.userRole)) {
        return params.teamId ?? null;
    }
    if (!params.teamId) {
        throw new TRPCError({
            code: "BAD_REQUEST",
            message: "teamId is required for Zeepo AI Agent on customer accounts.",
        });
    }
    await assertUserIsTeamMember(params.userId, params.teamId);
    return params.teamId;
}
export async function assertZeepoAgentSubscriptionForTeam(teamId) {
    const sub = await db.query.niscClientSubscription.findFirst({
        where: and(eq(niscClientSubscription.teamId, teamId), eq(niscClientSubscription.productId, ZEEPO_AI_AGENT_PRODUCT_ID), eq(niscClientSubscription.status, "ACTIVE")),
        columns: { id: true },
    });
    if (!sub) {
        throw new TRPCError({
            code: "FORBIDDEN",
            message: "No active Zeepo AI Agent subscription. Purchase a plan to continue.",
        });
    }
}
/** Customer session create: must have active subscription (PAYG counts). */
export async function assertCustomerCanUseZeepoAgent(params) {
    const teamId = await assertZeepoAgentTeamAccess(params);
    if (isZeepoAgentAgencyUser(params.userRole) || !teamId) {
        return teamId;
    }
    await assertZeepoAgentSubscriptionForTeam(teamId);
    if (params.requireTokens) {
        await assertZeepoAgentCanStartTurn({
            teamId,
            userId: params.userId,
            userRole: params.userRole,
        });
    }
    return teamId;
}
export async function getZeepoAgentSubscriptionSummary(teamId) {
    const sub = await db.query.niscClientSubscription.findFirst({
        where: and(eq(niscClientSubscription.teamId, teamId), eq(niscClientSubscription.productId, ZEEPO_AI_AGENT_PRODUCT_ID), eq(niscClientSubscription.status, "ACTIVE")),
        columns: { id: true, productPlanId: true },
    });
    const tokens = await getZeepoAgentTokensForTeam(teamId);
    return {
        hasSubscription: Boolean(sub),
        subscriptionId: sub?.id ?? null,
        tokens: tokens?.tokens ?? 0,
    };
}
