import { TRPCError } from "@trpc/server";
import { and, asc, count, desc, eq, inArray, sql } from "@npanel/db";
import { randomUUID } from "node:crypto";
import { db } from "@npanel/db";
import { z } from "zod";
import { zeepoAiActivityLog, zeepoAiAttachment, zeepoAiGeneration, zeepoAiImageEditHistory, zeepoAiMessage, zeepoAiSession, zeepoAiToolInvocation, } from "@npanel/db/schema/zeepo-ai";
import { router } from "../../trpc";
import { zeepoAiProcedure } from "./procedures";
import { assertCustomerCanUseZeepoAi, assertZeepoAiTeamAccess, } from "../../lib/zeepo-ai-access";
import { createAiSupportTicket, buildSessionTranscriptSummary } from "../../lib/create-ai-support-ticket";
import { checkWelcomeTokenEligibility, tryGrantWelcomeTokens } from "../../lib/zeepo-ai-free-token-grant";
import { failStaleZeepoAiGenerations } from "./image-generation";
import { createSessionSchema, deleteSessionSchema, getSessionSchema, listLibrarySchema, listSessionsSchema, updateSessionTitleSchema, } from "./schemas";
/** Stable chat order: createdAt, then user before assistant on timestamp ties. */
const zeepoAiMessageThreadOrder = [
    asc(zeepoAiMessage.createdAt),
    sql `case when ${zeepoAiMessage.role} = 'user' then 0 when ${zeepoAiMessage.role} = 'assistant' then 1 else 2 end`,
];
export const zeepoAiSessionsRouter = router({
    create: zeepoAiProcedure.input(createSessionSchema).mutation(async ({ ctx, input }) => {
        const userId = ctx.session?.user?.id;
        if (!userId)
            throw new TRPCError({ code: "UNAUTHORIZED" });
        const teamId = await assertCustomerCanUseZeepoAi({
            userId,
            userRole: ctx.session?.user?.role,
            teamId: input.teamId,
            requireTokens: true,
            tryWelcomeGrant: true,
        });
        const id = randomUUID();
        const now = new Date();
        const title = input.title?.trim() || "New chat";
        await db.insert(zeepoAiSession).values({
            id,
            userId,
            teamId,
            title,
            status: "ACTIVE",
            createdAt: now,
            updatedAt: now,
        });
        await db.insert(zeepoAiActivityLog).values({
            id: randomUUID(),
            sessionId: id,
            userId,
            teamId,
            action: "session.create",
            description: `Created session: ${title}`,
            metadata: null,
            ipAddress: ctx.ipAddress ?? null,
            userAgent: ctx.req.header("user-agent") ?? null,
        });
        return db.query.zeepoAiSession.findFirst({
            where: eq(zeepoAiSession.id, id),
        });
    }),
    list: zeepoAiProcedure.input(listSessionsSchema).query(async ({ ctx, input }) => {
        const userId = ctx.session?.user?.id;
        if (!userId)
            throw new TRPCError({ code: "UNAUTHORIZED" });
        const teamId = await assertZeepoAiTeamAccess({
            userId,
            userRole: ctx.session?.user?.role,
            teamId: input.teamId,
        });
        const conditions = [
            eq(zeepoAiSession.userId, userId),
            eq(zeepoAiSession.status, "ACTIVE"),
            sql `coalesce(${zeepoAiSession.metadata}->>'surface','') <> ${ZEEPO_AI_SUPPORT_FAB_SURFACE}`,
        ];
        if (teamId)
            conditions.push(eq(zeepoAiSession.teamId, teamId));
        const where = and(...conditions);
        const page = input.page;
        const limit = input.limit;
        const offset = (page - 1) * limit;
        const [rows, totalRow] = await Promise.all([
            db.query.zeepoAiSession.findMany({
                where,
                orderBy: [desc(zeepoAiSession.updatedAt)],
                limit,
                offset,
            }),
            db.select({ value: count() }).from(zeepoAiSession).where(where),
        ]);
        return {
            sessions: rows,
            page,
            limit,
            total: Number(totalRow[0]?.value ?? 0),
        };
    }),
    listLibrary: zeepoAiProcedure.input(listLibrarySchema).query(async ({ ctx, input }) => {
        const userId = ctx.session?.user?.id;
        if (!userId)
            throw new TRPCError({ code: "UNAUTHORIZED" });
        // 1) Confirm access (agency → personal library; customer → must be team member).
        const teamId = await assertZeepoAiTeamAccess({
            userId,
            userRole: ctx.session?.user?.role,
            teamId: input.teamId,
        });
        // 2) Resolve sessions that belong to this library.
        // Customer team library = all active sessions for that team (any member).
        // Agency library = the current user's sessions only.
        const sessionConditions = [eq(zeepoAiSession.status, "ACTIVE")];
        if (teamId) {
            sessionConditions.push(eq(zeepoAiSession.teamId, teamId));
        }
        else {
            sessionConditions.push(eq(zeepoAiSession.userId, userId));
        }
        const sessions = await db.query.zeepoAiSession.findMany({
            where: and(...sessionConditions),
            columns: { id: true, title: true },
        });
        if (sessions.length === 0) {
            return { items: [], page: input.page, limit: input.limit, total: 0 };
        }
        const sessionIds = sessions.map((s) => s.id);
        const titleById = new Map(sessions.map((s) => [s.id, s.title ?? "New chat"]));
        const kindFilter = input.kind === "all"
            ? undefined
            : input.kind === "presentation"
                ? inArray(zeepoAiGeneration.kind, ["presentation", "image-presentation"])
                : eq(zeepoAiGeneration.kind, input.kind);
        const generationsWhere = and(inArray(zeepoAiGeneration.sessionId, sessionIds), eq(zeepoAiGeneration.status, "COMPLETED"), kindFilter);
        const page = input.page;
        const limit = input.limit;
        // For image kind or all, also include edit history as independent items
        const includeEditHistory = input.kind === "image" || input.kind === "all";
        if (!includeEditHistory) {
            // Simple case: only generations
            const offset = (page - 1) * limit;
            const [rows, totalRow] = await Promise.all([
                db.query.zeepoAiGeneration.findMany({
                    where: generationsWhere,
                    orderBy: [desc(zeepoAiGeneration.createdAt)],
                    limit,
                    offset,
                }),
                db.select({ value: count() }).from(zeepoAiGeneration).where(generationsWhere),
            ]);
            return {
                items: rows.map((g) => ({
                    ...g,
                    sessionTitle: titleById.get(g.sessionId) ?? "New chat",
                    isEditHistory: false,
                })),
                page,
                limit,
                total: Number(totalRow[0]?.value ?? 0),
            };
        }
        // Complex case: include image edit history as separate items.
        // Paginate via SQL union of (generation ts, edit ts) then hydrate the page.
        // Team library → all edits on those sessions; agency → current user's edits.
        const editHistoryWhere = and(inArray(zeepoAiImageEditHistory.sessionId, sessionIds), ...(teamId ? [] : [eq(zeepoAiImageEditHistory.userId, userId)]));
        const offset = (page - 1) * limit;
        const genCountRow = await db
            .select({ value: count() })
            .from(zeepoAiGeneration)
            .where(generationsWhere);
        const editCountRow = await db
            .select({ value: count() })
            .from(zeepoAiImageEditHistory)
            .where(editHistoryWhere);
        const total = Number(genCountRow[0]?.value ?? 0) + Number(editCountRow[0]?.value ?? 0);
        // Fetch a bounded window (page * limit from each side) then merge-sort 
        // avoids loading the entire library while staying correct for mixed timelines.
        const fetchCap = Math.min(total, offset + limit);
        const [generations, editHistory] = await Promise.all([
            db.query.zeepoAiGeneration.findMany({
                where: generationsWhere,
                orderBy: [desc(zeepoAiGeneration.createdAt)],
                limit: fetchCap,
            }),
            db.query.zeepoAiImageEditHistory.findMany({
                where: editHistoryWhere,
                orderBy: [desc(zeepoAiImageEditHistory.createdAt)],
                limit: fetchCap,
            }),
        ]);
        const editHistoryItems = editHistory.map((edit) => ({
            id: edit.id,
            sessionId: edit.sessionId,
            userId: edit.userId,
            teamId: teamId,
            messageId: null,
            kind: "image",
            provider: edit.provider ?? "gemini",
            status: "COMPLETED",
            progress: null,
            errorMessage: null,
            url: edit.imageUrl,
            thumbnailUrl: null,
            title: edit.label ?? `${edit.operationType} edit`,
            description: edit.prompt ?? null,
            prompt: edit.prompt,
            outputs: { imageUrl: edit.imageUrl },
            metadata: {
                ...(edit.metadata ?? {}),
                operationType: edit.operationType,
                parentGenerationId: edit.generationId,
                isEditHistory: true,
            },
            tokensDebited: edit.tokensDebited,
            providerCostUsdMicros: edit.providerCostUsdMicros,
            modelId: edit.modelId,
            providerRequestId: edit.providerRequestId,
            parentGenerationId: edit.generationId,
            createdAt: edit.createdAt,
            updatedAt: edit.createdAt,
            sessionTitle: titleById.get(edit.sessionId) ?? "New chat",
            isEditHistory: true,
        }));
        const generationItems = generations.map((g) => ({
            ...g,
            sessionTitle: titleById.get(g.sessionId) ?? "New chat",
            isEditHistory: false,
        }));
        const allItems = [...generationItems, ...editHistoryItems].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        const paginatedItems = allItems.slice(offset, offset + limit);
        return {
            items: paginatedItems,
            page,
            limit,
            total,
        };
    }),
    openSupportTicket: zeepoAiProcedure
        .input(z.object({
        sessionId: z.string(),
        phone: z.string().trim().max(40).optional().nullable(),
        intent: z.enum(["support", "sales"]).optional().default("support"),
    }))
        .mutation(async ({ ctx, input }) => {
        const userId = ctx.session?.user?.id;
        if (!userId)
            throw new TRPCError({ code: "UNAUTHORIZED" });
        const summary = await buildSessionTranscriptSummary(input.sessionId);
        return createAiSupportTicket({
            userId,
            userRole: ctx.session?.user?.role,
            teamId: null,
            sessionId: input.sessionId,
            surface: "zeepo_ai",
            subject: input.intent === "sales" ? "Sales enquiry" : "Support request",
            summary,
            intent: input.intent,
            phone: input.phone,
            ipAddress: ctx.ipAddress ?? null,
            userAgent: ctx.req.header("user-agent") ?? null,
        });
    }),
    get: zeepoAiProcedure.input(getSessionSchema).query(async ({ ctx, input }) => {
        const userId = ctx.session?.user?.id;
        if (!userId)
            throw new TRPCError({ code: "UNAUTHORIZED" });
        const session = await db.query.zeepoAiSession.findFirst({
            where: and(eq(zeepoAiSession.id, input.id), eq(zeepoAiSession.userId, userId)),
        });
        if (!session || session.status === "DELETED" || isZeepoAiSupportFabSession(session.metadata)) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
        }
        await failStaleZeepoAiGenerations(input.id);
        // Reap orphan assistant rows left "streaming" after crash/deploy.
        const orphanCutoff = new Date(Date.now() - 35 * 60 * 1000);
        const orphanRows = await db.query.zeepoAiMessage.findMany({
            where: and(eq(zeepoAiMessage.sessionId, input.id), eq(zeepoAiMessage.role, "assistant"), eq(zeepoAiMessage.status, "streaming")),
            columns: { id: true, metadata: true, createdAt: true },
        });
        for (const row of orphanRows) {
            if (row.createdAt.getTime() > orphanCutoff.getTime())
                continue;
            const prev = row.metadata && typeof row.metadata === "object"
                ? row.metadata
                : {};
            await db
                .update(zeepoAiMessage)
                .set({
                status: "error",
                metadata: { ...prev, interrupted: true, orphanReaped: true },
            })
                .where(and(eq(zeepoAiMessage.id, row.id), eq(zeepoAiMessage.status, "streaming")));
        }
        const [messages, generations, attachments, toolInvocations] = await Promise.all([
            db.query.zeepoAiMessage.findMany({
                where: eq(zeepoAiMessage.sessionId, input.id),
                orderBy: [...zeepoAiMessageThreadOrder],
                limit: 500,
            }),
            db.query.zeepoAiGeneration.findMany({
                where: eq(zeepoAiGeneration.sessionId, input.id),
                orderBy: [desc(zeepoAiGeneration.createdAt)],
            }),
            db.query.zeepoAiAttachment.findMany({
                where: eq(zeepoAiAttachment.sessionId, input.id),
                orderBy: [desc(zeepoAiAttachment.createdAt)],
            }),
            db.query.zeepoAiToolInvocation.findMany({
                where: eq(zeepoAiToolInvocation.sessionId, input.id),
                orderBy: [asc(zeepoAiToolInvocation.createdAt)],
                columns: {
                    id: true,
                    messageId: true,
                    toolName: true,
                    status: true,
                    result: true,
                    createdAt: true,
                },
            }),
        ]);
        return {
            session,
            messages,
            generations,
            attachments,
            toolInvocations,
        };
    }),
    updateTitle: zeepoAiProcedure
        .input(updateSessionTitleSchema)
        .mutation(async ({ ctx, input }) => {
        const userId = ctx.session?.user?.id;
        if (!userId)
            throw new TRPCError({ code: "UNAUTHORIZED" });
        const session = await db.query.zeepoAiSession.findFirst({
            where: and(eq(zeepoAiSession.id, input.id), eq(zeepoAiSession.userId, userId)),
        });
        if (!session)
            throw new TRPCError({ code: "NOT_FOUND" });
        await db
            .update(zeepoAiSession)
            .set({ title: input.title, updatedAt: new Date() })
            .where(eq(zeepoAiSession.id, input.id));
        return { id: input.id, title: input.title };
    }),
    delete: zeepoAiProcedure.input(deleteSessionSchema).mutation(async ({ ctx, input }) => {
        const userId = ctx.session?.user?.id;
        if (!userId)
            throw new TRPCError({ code: "UNAUTHORIZED" });
        const session = await db.query.zeepoAiSession.findFirst({
            where: and(eq(zeepoAiSession.id, input.id), eq(zeepoAiSession.userId, userId)),
        });
        if (!session)
            throw new TRPCError({ code: "NOT_FOUND" });
        await db
            .update(zeepoAiSession)
            .set({ status: "DELETED", updatedAt: new Date() })
            .where(eq(zeepoAiSession.id, input.id));
        await db.insert(zeepoAiActivityLog).values({
            id: randomUUID(),
            sessionId: input.id,
            userId,
            teamId: session.teamId,
            action: "session.delete",
            description: "Session deleted",
            metadata: null,
            ipAddress: ctx.ipAddress ?? null,
            userAgent: ctx.req.header("user-agent") ?? null,
        });
        return { ok: true };
    }),
    checkWelcomeEligibility: zeepoAiProcedure
        .input(z.object({ teamId: z.string().optional() }))
        .query(async ({ ctx, input }) => {
        const userId = ctx.session?.user?.id;
        if (!userId)
            throw new TRPCError({ code: "UNAUTHORIZED" });
        const teamId = await assertZeepoAiTeamAccess({
            userId,
            userRole: ctx.session?.user?.role,
            teamId: input.teamId,
        });
        if (!teamId) {
            return { eligible: false, reason: "no_team", tokensIfGranted: 0 };
        }
        return checkWelcomeTokenEligibility(teamId);
    }),
    /** Actually attempt the one-time welcome grant (idempotent). */
    claimWelcomeGrant: zeepoAiProcedure
        .input(z.object({ teamId: z.string() }))
        .mutation(async ({ ctx, input }) => {
        const userId = ctx.session?.user?.id;
        if (!userId)
            throw new TRPCError({ code: "UNAUTHORIZED" });
        const teamId = await assertZeepoAiTeamAccess({
            userId,
            userRole: ctx.session?.user?.role,
            teamId: input.teamId,
        });
        if (!teamId) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "teamId required" });
        }
        return tryGrantWelcomeTokens({ teamId, userId });
    }),
});
