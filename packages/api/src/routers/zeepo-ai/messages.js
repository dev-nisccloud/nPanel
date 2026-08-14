import { TRPCError } from "@trpc/server";
import { and, eq } from "@npanel/db";
import { randomUUID } from "node:crypto";
import { db } from "@npanel/db";
import { zeepoAiActivityLog, zeepoAiAttachment, zeepoAiMessage, zeepoAiSession, } from "@npanel/db/schema/zeepo-ai";
import { router } from "../../trpc";
import { zeepoAiProcedure } from "./procedures";
import { messageFeedbackSchema, registerAttachmentSchema } from "./schemas";
import { ZEEPO_AI_SKILLS } from "./tools";
export const zeepoAiMessagesRouter = router({
    feedback: zeepoAiProcedure.input(messageFeedbackSchema).mutation(async ({ ctx, input }) => {
        const userId = ctx.session?.user?.id;
        if (!userId)
            throw new TRPCError({ code: "UNAUTHORIZED" });
        const message = await db.query.zeepoAiMessage.findFirst({
            where: eq(zeepoAiMessage.id, input.messageId),
        });
        if (!message || message.role !== "assistant") {
            throw new TRPCError({ code: "NOT_FOUND", message: "Message not found" });
        }
        const session = await db.query.zeepoAiSession.findFirst({
            where: and(eq(zeepoAiSession.id, message.sessionId), eq(zeepoAiSession.userId, userId)),
        });
        if (!session)
            throw new TRPCError({ code: "FORBIDDEN" });
        const prev = (message.metadata ?? {});
        const nextMeta = {
            ...prev,
            feedback: input.feedback === "clear" ? null : input.feedback,
            feedbackAt: new Date().toISOString(),
        };
        await db
            .update(zeepoAiMessage)
            .set({ metadata: nextMeta })
            .where(eq(zeepoAiMessage.id, input.messageId));
        await db.insert(zeepoAiActivityLog).values({
            id: randomUUID(),
            sessionId: message.sessionId,
            userId,
            teamId: session.teamId,
            action: "message.feedback",
            description: `Feedback: ${input.feedback}`,
            metadata: {
                messageId: input.messageId,
                feedback: input.feedback,
                modelId: prev.modelId ?? null,
            },
            ipAddress: ctx.ipAddress ?? null,
            userAgent: ctx.req.header("user-agent") ?? null,
        });
        return { ok: true, feedback: input.feedback === "clear" ? null : input.feedback };
    }),
    registerAttachment: zeepoAiProcedure
        .input(registerAttachmentSchema)
        .mutation(async ({ ctx, input }) => {
        const userId = ctx.session?.user?.id;
        if (!userId)
            throw new TRPCError({ code: "UNAUTHORIZED" });
        const session = await db.query.zeepoAiSession.findFirst({
            where: and(eq(zeepoAiSession.id, input.sessionId), eq(zeepoAiSession.userId, userId)),
        });
        if (!session)
            throw new TRPCError({ code: "NOT_FOUND" });
        const { assertAllowedZeepoAiMediaUrl } = await import("../../lib/zeepo-ai-media-url");
        assertAllowedZeepoAiMediaUrl(input.url, "Attachment");
        const id = randomUUID();
        await db.insert(zeepoAiAttachment).values({
            id,
            sessionId: input.sessionId,
            userId,
            url: input.url,
            storageKey: input.storageKey ?? null,
            name: input.name,
            mimeType: input.mimeType,
            sizeBytes: input.sizeBytes ?? null,
            createdAt: new Date(),
        });
        return { id, url: input.url, name: input.name, mimeType: input.mimeType };
    }),
});
export const zeepoAiSkillsRouter = router({
    list: zeepoAiProcedure.query(async () => {
        return ZEEPO_AI_SKILLS.map(({ id, category, title, description, available, starterPrompt }) => ({
            id,
            category,
            title,
            description,
            available,
            starterPrompt: starterPrompt ?? null,
        }));
    }),
});
