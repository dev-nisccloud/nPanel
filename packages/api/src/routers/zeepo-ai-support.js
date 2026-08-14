/**
 * Live AI Support sessions for the FAB (guest cookie or authenticated user).
 * Does not require a Zeepo AI wallet. Sessions are tagged surface=support_fab
 * so they never mix into the Zeepo AI product history.
 */
import { randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, sql } from "@npanel/db";
import { z } from "zod";
import { db } from "@npanel/db";
import { zeepoAiActivityLog, zeepoAiMessage, zeepoAiSession, zeepoAiToolInvocation } from "@npanel/db/schema/zeepo-ai";
import { isAllowedStorefrontBrowserMutation, isAllowedStorefrontBrowserRequest } from "@npanel/auth/landing-page-origins";
import { loadActiveGuestSession } from "../lib/support-guest-session";
import { ZEEPO_AI_SUPPORT_FAB_SURFACE, isZeepoAiSupportFabSession, } from "../lib/zeepo-ai-support";
import { createAiSupportTicket, buildSessionTranscriptSummary } from "../lib/create-ai-support-ticket";
import { assertZeepoAiTeamAccess } from "../lib/zeepo-ai-access";
import { protectedProcedure, publicProcedure, router } from "../trpc";
const getOrCreateInput = z.object({
    teamId: z.string().optional(),
});
const getSessionInput = z.object({
    id: z.string(),
});
const openTicketInput = z.object({
    sessionId: z.string(),
    phone: z.string().trim().max(40).optional().nullable(),
    intent: z.enum(["support", "sales"]).optional().default("support"),
});
const messageThreadOrder = [
    asc(zeepoAiMessage.createdAt),
    sql `case when ${zeepoAiMessage.role} = 'user' then 0 when ${zeepoAiMessage.role} = 'assistant' then 1 else 2 end`,
];
function assertLandingOrigin(ctx) {
    if (!isAllowedStorefrontBrowserRequest(ctx.req.raw.headers)) {
        throw new TRPCError({
            code: "FORBIDDEN",
            message: "Live AI Support for guests is only available from the Nisc Cloud website",
        });
    }
}
function assertLandingMutation(ctx) {
    if (!isAllowedStorefrontBrowserMutation(ctx.req.raw.headers)) {
        throw new TRPCError({
            code: "FORBIDDEN",
            message: "Live AI Support for guests is only available from the Nisc Cloud website",
        });
    }
}
async function resolveGuest(ctx, opts) {
    if (opts?.mutation)
        assertLandingMutation(ctx);
    else
        assertLandingOrigin(ctx);
    const sessionRow = await loadActiveGuestSession(ctx, { refresh: true });
    if (!sessionRow) {
        throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Guest support session required",
        });
    }
    return sessionRow;
}
async function findSupportFabSession(userId, teamId) {
    const rows = await db.query.zeepoAiSession.findMany({
        where: and(eq(zeepoAiSession.userId, userId), eq(zeepoAiSession.status, "ACTIVE")),
        orderBy: [desc(zeepoAiSession.updatedAt)],
        limit: 40,
    });
    return (rows.find((row) => {
        if (!isZeepoAiSupportFabSession(row.metadata))
            return false;
        if (teamId)
            return row.teamId === teamId;
        return row.teamId == null;
    }) ?? null);
}
async function createSupportFabSession(params) {
    const id = randomUUID();
    const now = new Date();
    await db.insert(zeepoAiSession).values({
        id,
        userId: params.userId,
        teamId: params.teamId,
        title: "Live AI Support",
        status: "ACTIVE",
        metadata: {
            surface: ZEEPO_AI_SUPPORT_FAB_SURFACE,
            ...(params.guestSessionId ? { guestSessionId: params.guestSessionId } : {}),
        },
        createdAt: now,
        updatedAt: now,
    });
    await db.insert(zeepoAiActivityLog).values({
        id: randomUUID(),
        sessionId: id,
        userId: params.userId,
        teamId: params.teamId,
        action: "session.create",
        description: "Created Live AI Support session",
        metadata: { surface: ZEEPO_AI_SUPPORT_FAB_SURFACE },
        ipAddress: params.ipAddress ?? null,
        userAgent: params.userAgent ?? null,
    });
    return db.query.zeepoAiSession.findFirst({
        where: eq(zeepoAiSession.id, id),
    });
}
async function loadSupportSessionPayload(sessionId, userId) {
    const session = await db.query.zeepoAiSession.findFirst({
        where: and(eq(zeepoAiSession.id, sessionId), eq(zeepoAiSession.userId, userId)),
    });
    if (!session || session.status === "DELETED" || !isZeepoAiSupportFabSession(session.metadata)) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
    }
    const [messages, toolInvocations] = await Promise.all([
        db.query.zeepoAiMessage.findMany({
            where: eq(zeepoAiMessage.sessionId, sessionId),
            orderBy: [...messageThreadOrder],
            limit: 200,
            columns: {
                id: true,
                role: true,
                content: true,
                status: true,
                metadata: true,
                createdAt: true,
            },
        }),
        db.query.zeepoAiToolInvocation.findMany({
            where: eq(zeepoAiToolInvocation.sessionId, sessionId),
            orderBy: [asc(zeepoAiToolInvocation.createdAt)],
            columns: {
                id: true,
                messageId: true,
                toolName: true,
                status: true,
                result: true,
            },
        }),
    ]);
    return { session, messages, toolInvocations };
}
export const zeepoAiSupportRouter = router({
    getOrCreate: protectedProcedure.input(getOrCreateInput).mutation(async ({ ctx, input }) => {
        const userId = ctx.session?.user?.id;
        if (!userId)
            throw new TRPCError({ code: "UNAUTHORIZED" });
        let teamId = null;
        if (input.teamId) {
            teamId = await assertZeepoAiTeamAccess({
                userId,
                userRole: ctx.session?.user?.role,
                teamId: input.teamId,
            });
        }
        const existing = await findSupportFabSession(userId, teamId);
        if (existing)
            return existing;
        const created = await createSupportFabSession({
            userId,
            teamId,
            ipAddress: ctx.ipAddress ?? null,
            userAgent: ctx.req.header("user-agent") ?? null,
        });
        if (!created) {
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to start Live AI Support" });
        }
        return created;
    }),
    getSession: protectedProcedure.input(getSessionInput).query(async ({ ctx, input }) => {
        const userId = ctx.session?.user?.id;
        if (!userId)
            throw new TRPCError({ code: "UNAUTHORIZED" });
        return loadSupportSessionPayload(input.id, userId);
    }),
    openTicket: protectedProcedure.input(openTicketInput).mutation(async ({ ctx, input }) => {
        const userId = ctx.session?.user?.id;
        if (!userId)
            throw new TRPCError({ code: "UNAUTHORIZED" });
        const summary = await buildSessionTranscriptSummary(input.sessionId);
        return createAiSupportTicket({
            userId,
            userRole: ctx.session?.user?.role,
            teamId: null,
            sessionId: input.sessionId,
            surface: "support_fab",
            subject: input.intent === "sales" ? "Sales enquiry" : "Support request",
            summary,
            intent: input.intent,
            phone: input.phone,
            ipAddress: ctx.ipAddress ?? null,
            userAgent: ctx.req.header("user-agent") ?? null,
        });
    }),
    guest: router({
        getOrCreate: publicProcedure.mutation(async ({ ctx }) => {
            const guest = await resolveGuest(ctx, { mutation: true });
            const existing = await findSupportFabSession(guest.guestUserId, null);
            if (existing)
                return existing;
            const created = await createSupportFabSession({
                userId: guest.guestUserId,
                teamId: null,
                guestSessionId: guest.id,
                ipAddress: ctx.ipAddress ?? null,
                userAgent: ctx.req.header("user-agent") ?? null,
            });
            if (!created) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to start Live AI Support",
                });
            }
            return created;
        }),
        getSession: publicProcedure.input(getSessionInput).query(async ({ ctx, input }) => {
            const guest = await resolveGuest(ctx);
            return loadSupportSessionPayload(input.id, guest.guestUserId);
        }),
        openTicket: publicProcedure.input(openTicketInput).mutation(async ({ ctx, input }) => {
            const guest = await resolveGuest(ctx, { mutation: true });
            const summary = await buildSessionTranscriptSummary(input.sessionId);
            return createAiSupportTicket({
                userId: guest.guestUserId,
                userRole: "GUEST",
                teamId: null,
                sessionId: input.sessionId,
                surface: "support_fab",
                subject: input.intent === "sales" ? "Sales enquiry" : "Support request",
                summary,
                intent: input.intent,
                phone: input.phone ?? guest.phone,
                ipAddress: ctx.ipAddress ?? null,
                userAgent: ctx.req.header("user-agent") ?? null,
            });
        }),
    }),
});
