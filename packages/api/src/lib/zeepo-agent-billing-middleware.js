import { TRPCError } from "@trpc/server";
import { and, eq } from "@npanel/db";
import { db } from "@npanel/db";
import { zeepoAgentGeneration, zeepoAgentSession, } from "@npanel/db/schema/zeepo-agent";
import { assertZeepoAgentCanStartTurn, isZeepoAgentAgencyUser, } from "./zeepo-agent-tokens";
import { assertZeepoAgentTeamAccess } from "./zeepo-agent-access";
import { t } from "../trpc";
/** Every tRPC path that triggers Replicate / billable AI work. */
export const ZEEPO_AGENT_BILLABLE_PATHS = new Set([
    "zeepoAgent.chat.sendMessage",
    "zeepoAgent.chat.generateTitle",
    "zeepoAgent.chat.editImage",
    "zeepoAgent.imageEdits.styleTransfer",
    "zeepoAgent.imageEdits.eraseObject",
    "zeepoAgent.imageEdits.swapBackground",
    "zeepoAgent.imageEdits.upscaleImage",
    "zeepoAgent.imageEdits.editText",
    "zeepoAgent.imageEdits.generateVariations",
]);
export function isBillableZeepoAgentPath(path) {
    return ZEEPO_AGENT_BILLABLE_PATHS.has(path);
}
function asRecord(input) {
    if (input && typeof input === "object" && !Array.isArray(input)) {
        return input;
    }
    return {};
}
/** Resolve team + session for token billing from procedure input. */
export async function resolveZeepoBillingContext(params) {
    const input = asRecord(params.rawInput);
    let teamId = typeof input.teamId === "string" && input.teamId.length > 0 ? input.teamId : null;
    let sessionId = typeof input.sessionId === "string" && input.sessionId.length > 0
        ? input.sessionId
        : typeof input.id === "string" && input.id.length > 0
            ? input.id
            : null;
    if (typeof input.generationId === "string" && input.generationId.length > 0) {
        const gen = await db.query.zeepoAgentGeneration.findFirst({
            where: and(eq(zeepoAgentGeneration.id, input.generationId), eq(zeepoAgentGeneration.userId, params.userId)),
            columns: { teamId: true, sessionId: true },
        });
        if (!gen) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Generation not found" });
        }
        teamId = teamId ?? gen.teamId ?? null;
        sessionId = sessionId ?? gen.sessionId ?? null;
    }
    if (sessionId && !teamId) {
        const session = await db.query.zeepoAgentSession.findFirst({
            where: and(eq(zeepoAgentSession.id, sessionId), eq(zeepoAgentSession.userId, params.userId)),
            columns: { teamId: true },
        });
        if (!session) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
        }
        teamId = session.teamId ?? null;
    }
    if (!isZeepoAgentAgencyUser(params.userRole) && teamId) {
        await assertZeepoAgentTeamAccess({
            userId: params.userId,
            userRole: params.userRole,
            teamId,
        });
    }
    return {
        teamId,
        userId: params.userId,
        userRole: params.userRole,
        sessionId,
    };
}
/** Pre-flight token check for billable Zeepo agent mutations (customers only). */
export async function assertZeepoBillableRequestAllowed(params) {
    if (!isBillableZeepoAgentPath(params.path))
        return null;
    if (isZeepoAgentAgencyUser(params.userRole))
        return null;
    const billingCtx = await resolveZeepoBillingContext({
        userId: params.userId,
        userRole: params.userRole,
        rawInput: params.rawInput,
    });
    await assertZeepoAgentCanStartTurn(billingCtx);
    return billingCtx;
}
/**
 * Runs before every Zeepo agent procedure: for customer billable mutations,
 * enforce team access + minimum token balance before handler executes.
 */
export const zeepoAgentBillingMiddleware = t.middleware(async ({ ctx, next, path, rawInput }) => {
    const userId = ctx.session?.user?.id;
    if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    const billingCtx = await assertZeepoBillableRequestAllowed({
        path,
        userId,
        userRole: ctx.session?.user?.role,
        rawInput,
    });
    return next({
        ctx: {
            ...ctx,
            zeepoBilling: billingCtx
                ? { teamId: billingCtx.teamId, sessionId: billingCtx.sessionId ?? null }
                : null,
        },
    });
});
