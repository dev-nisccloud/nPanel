import { TRPCError } from "@trpc/server";
import { randomUUID } from "node:crypto";
import { desc, eq } from "@npanel/db";
import { db } from "@npanel/db";
import { nebDesign, nebGenerationJob, nebMessage, nebSession, } from "@npanel/db/schema/nisc-email-builder";
import { enqueueNebBuildJob } from "../../lib/qstash/nisc-email-builder";
import { buildBrandAgentContext, enrichWebsiteBrand, mergeBrandEnrichment, } from "../../lib/nisc-email-builder/website-brand-extract";
import { classifyChatIntent } from "../../lib/nisc-email-builder/chat-intent";
import { isClearlyOffTopicChatMessage, NEB_CHAT_REFUSAL_MESSAGE, } from "../../lib/nisc-email-builder/chat-scope";
import { getRevisionUndoRedoState, popRevisionRedoSnapshot, popRevisionUndoSnapshot, pushRevisionRedoSnapshot, pushRevisionUndoSnapshot, } from "../../lib/nisc-email-builder/revision-cache";
import { applyRevisionHtmlToDesign } from "../../lib/nisc-email-builder/revision-apply";
import { buildNebSessionHistoryContext } from "../../lib/nisc-email-builder/session-history";
import { protectedProcedure, router } from "../../trpc";
import { assertDesignAccess } from "./access";
import { approveBuildSchema, designIdSchema, generateVariationSchema, retryHtmlBuildSchema, selectVariationSchema, sendChatSchema, startBuildSchema, } from "./schemas";
function isBusy(design) {
    return design.aiStatus === "GENERATING" || design.aiStatus === "HYDRATING_IMAGES";
}
async function enqueueJob(params) {
    const jobId = randomUUID();
    const now = new Date();
    await db.insert(nebGenerationJob).values({
        id: jobId,
        designId: params.designId,
        messageId: params.userMessageId ?? null,
        type: params.type,
        status: "QUEUED",
        input: params.input,
        createdAt: now,
    });
    const { messageId } = await enqueueNebBuildJob(jobId);
    await db
        .update(nebGenerationJob)
        .set({ qstashMessageId: messageId })
        .where(eq(nebGenerationJob.id, jobId));
    return jobId;
}
export const nebChatRouter = router({
    /** Step 1: generate Nano Banana creative mockup */
    startBuild: protectedProcedure.input(startBuildSchema).mutation(async ({ ctx, input }) => {
        const userId = ctx.session?.user?.id;
        if (!userId)
            throw new TRPCError({ code: "UNAUTHORIZED" });
        const design = await assertDesignAccess({
            designId: input.designId,
            userId,
            userRole: ctx.session?.user?.role,
        });
        if (isBusy(design)) {
            throw new TRPCError({ code: "CONFLICT", message: "A job is already in progress" });
        }
        const session = await db.query.nebSession.findFirst({
            where: eq(nebSession.designId, input.designId),
        });
        if (!session)
            throw new TRPCError({ code: "NOT_FOUND", message: "Session missing" });
        const userMessageId = randomUUID();
        const now = new Date();
        let brief = { ...input.brief };
        let brandEnrichment = null;
        if (brief.websiteUrl?.trim()) {
            brandEnrichment = await enrichWebsiteBrand(brief.websiteUrl, {
                companyHint: brief.companyName,
            });
            brief = mergeBrandEnrichment(brief, brandEnrichment);
        }
        // Always derive agent context from the merged brief (user edits win over detection).
        const webContext = buildBrandAgentContext(brief, brandEnrichment);
        const colorLine = brief.brandColors?.filter((c) => c.trim()).join(", ") ?? "";
        const userContent = [
            brief.companyName && `Company: ${brief.companyName}`,
            brief.goal && `Goal: ${brief.goal}`,
            brief.audience && `Audience: ${brief.audience}`,
            brief.tone && `Tone: ${brief.tone}`,
            brief.emailType && `Type: ${brief.emailType}`,
            brief.websiteUrl && `Website: ${brief.websiteUrl}`,
            colorLine && `Brand colors: ${colorLine}`,
            brief.instructions,
        ]
            .filter(Boolean)
            .join("\n");
        await db.insert(nebMessage).values({
            id: userMessageId,
            sessionId: session.id,
            role: "user",
            content: userContent || "Create my email design",
            metadata: {
                brief,
                brandEnrichment: brandEnrichment
                    ? {
                        logoUrl: brandEnrichment.logoUrl,
                        logoSource: brandEnrichment.logoSource,
                        brandColors: brandEnrichment.brandColors,
                        companyContext: brandEnrichment.companyContext,
                        webSearchFound: brandEnrichment.webSearchFound,
                        warnings: brandEnrichment.warnings,
                    }
                    : undefined,
            },
            createdAt: now,
        });
        const prevMeta = design.metadata && typeof design.metadata === "object"
            ? design.metadata
            : {};
        await db
            .update(nebDesign)
            .set({
            brief,
            metadata: {
                ...prevMeta,
                brandWebContext: webContext,
                companyContext: brief.companyContext ??
                    brandEnrichment?.companyContext ??
                    prevMeta.companyContext,
                webSearchFound: brief.webSearchFound ??
                    brandEnrichment?.webSearchFound ??
                    prevMeta.webSearchFound,
                brandEnrichment: brandEnrichment
                    ? {
                        logoSource: brandEnrichment.logoSource,
                        colorSources: brandEnrichment.colorSources,
                        webSearchConducted: brandEnrichment.webSearchConducted,
                    }
                    : prevMeta.brandEnrichment,
            },
            aiStatus: "GENERATING",
            workflowPhase: "BUILDING",
            updatedAt: now,
        })
            .where(eq(nebDesign.id, input.designId));
        const jobId = await enqueueJob({
            designId: input.designId,
            sessionId: session.id,
            type: "DIRECT_BUILD",
            input: { brief, webContext },
            userMessageId,
        });
        return {
            jobId,
            brandPreview: brandEnrichment
                ? {
                    logoUrl: brief.logoUrl ?? brandEnrichment.logoUrl,
                    brandColors: brief.brandColors ?? brandEnrichment.brandColors,
                    companyContext: brief.companyContext ?? brandEnrichment.companyContext,
                    webSearchFound: brief.webSearchFound ?? brandEnrichment.webSearchFound,
                    warnings: brandEnrichment.warnings,
                }
                : null,
        };
    }),
    /** Step 2: user approved mockup → build HTML + hydrate images */
    approveBuild: protectedProcedure.input(approveBuildSchema).mutation(async ({ ctx, input }) => {
        const userId = ctx.session?.user?.id;
        if (!userId)
            throw new TRPCError({ code: "UNAUTHORIZED" });
        const design = await assertDesignAccess({
            designId: input.designId,
            userId,
            userRole: ctx.session?.user?.role,
        });
        if (!design.creativeDesignUrl) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Generate a creative design first",
            });
        }
        if (isBusy(design)) {
            throw new TRPCError({ code: "CONFLICT", message: "Wait for the current job to finish" });
        }
        const session = await db.query.nebSession.findFirst({
            where: eq(nebSession.designId, input.designId),
        });
        if (!session)
            throw new TRPCError({ code: "NOT_FOUND" });
        const now = new Date();
        const userMessageId = randomUUID();
        await db.insert(nebMessage).values({
            id: userMessageId,
            sessionId: session.id,
            role: "user",
            content: "Approved - please build the HTML email.",
            createdAt: now,
        });
        await db
            .update(nebDesign)
            .set({
            aiStatus: "GENERATING",
            workflowPhase: "BUILDING",
            updatedAt: now,
        })
            .where(eq(nebDesign.id, input.designId));
        const meta = design.metadata && typeof design.metadata === "object"
            ? design.metadata
            : {};
        const storedWebContext = typeof meta.brandWebContext === "string" ? meta.brandWebContext : null;
        const jobId = await enqueueJob({
            designId: input.designId,
            sessionId: session.id,
            type: "BUILD_EMAIL",
            input: {
                brief: design.brief,
                webContext: storedWebContext,
            },
            userMessageId,
        });
        return { jobId };
    }),
    /** Regenerate HTML from the approved creative mockup (new build variation). */
    retryHtmlBuild: protectedProcedure
        .input(retryHtmlBuildSchema)
        .mutation(async ({ ctx, input }) => {
        const userId = ctx.session?.user?.id;
        if (!userId)
            throw new TRPCError({ code: "UNAUTHORIZED" });
        const design = await assertDesignAccess({
            designId: input.designId,
            userId,
            userRole: ctx.session?.user?.role,
        });
        if (!design.creativeDesignUrl) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "No approved creative design to build from",
            });
        }
        if (isBusy(design)) {
            throw new TRPCError({ code: "CONFLICT", message: "Wait for the current job to finish" });
        }
        const session = await db.query.nebSession.findFirst({
            where: eq(nebSession.designId, input.designId),
        });
        if (!session)
            throw new TRPCError({ code: "NOT_FOUND" });
        const now = new Date();
        const userMessageId = randomUUID();
        await db.insert(nebMessage).values({
            id: userMessageId,
            sessionId: session.id,
            role: "user",
            content: "Regenerate the HTML email from the approved creative design.",
            createdAt: now,
        });
        await db
            .update(nebDesign)
            .set({
            aiStatus: "GENERATING",
            workflowPhase: "BUILDING",
            updatedAt: now,
        })
            .where(eq(nebDesign.id, input.designId));
        const meta = design.metadata && typeof design.metadata === "object"
            ? design.metadata
            : {};
        const storedWebContext = typeof meta.brandWebContext === "string" ? meta.brandWebContext : null;
        const jobId = await enqueueJob({
            designId: input.designId,
            sessionId: session.id,
            type: "BUILD_EMAIL",
            input: {
                brief: design.brief,
                webContext: storedWebContext,
                buildTrigger: "BUILD_RETRY",
            },
            userMessageId,
        });
        return { jobId };
    }),
    /** Zeepo-style chat - routes by workflow phase */
    sendMessage: protectedProcedure.input(sendChatSchema).mutation(async ({ ctx, input }) => {
        const userId = ctx.session?.user?.id;
        if (!userId)
            throw new TRPCError({ code: "UNAUTHORIZED" });
        const design = await assertDesignAccess({
            designId: input.designId,
            userId,
            userRole: ctx.session?.user?.role,
        });
        if (isBusy(design)) {
            throw new TRPCError({ code: "CONFLICT", message: "Wait for the current job to finish" });
        }
        const session = await db.query.nebSession.findFirst({
            where: eq(nebSession.designId, input.designId),
        });
        if (!session)
            throw new TRPCError({ code: "NOT_FOUND" });
        const userMessageId = randomUUID();
        const now = new Date();
        const brief = (design.brief ?? {});
        const hasHtml = Boolean(design.htmlContent?.trim());
        const currentHtml = input.currentHtml?.trim() || design.htmlContent?.trim() || "";
        await db.insert(nebMessage).values({
            id: userMessageId,
            sessionId: session.id,
            role: "user",
            content: input.message,
            createdAt: now,
        });
        if (isClearlyOffTopicChatMessage(input.message)) {
            await db.insert(nebMessage).values({
                id: randomUUID(),
                sessionId: session.id,
                role: "assistant",
                content: NEB_CHAT_REFUSAL_MESSAGE,
                createdAt: new Date(),
            });
            return { jobId: null, refused: true };
        }
        let jobType;
        let chatIntent = "edit";
        if (hasHtml) {
            if (!currentHtml) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "No email HTML to edit",
                });
            }
            chatIntent = input.intent ?? classifyChatIntent(input.message);
            jobType = chatIntent === "full_revamp" ? "FULL_REVAMP" : "REVISION";
        }
        else if (design.workflowPhase === "AWAITING_APPROVAL") {
            // Legacy path: creative mockup was generated, user is in approval chat
            jobType = "CHAT";
        }
        else if (design.workflowPhase === "BRIEF" ||
            design.workflowPhase === "READY" ||
            design.workflowPhase === "FAILED") {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Start with a creative brief first",
            });
        }
        else {
            // During BUILDING phase without HTML - not ready for chat yet
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Your email is still being generated, please wait",
            });
        }
        await db
            .update(nebDesign)
            .set({ aiStatus: "GENERATING", updatedAt: now })
            .where(eq(nebDesign.id, input.designId));
        const sessionHistory = hasHtml
            ? await buildNebSessionHistoryContext({
                designId: input.designId,
                sessionId: session.id,
            })
            : "";
        const webContext = design.metadata &&
            typeof design.metadata === "object" &&
            typeof design.metadata.webContext === "string"
            ? design.metadata.webContext
            : null;
        const jobId = await enqueueJob({
            designId: input.designId,
            sessionId: session.id,
            type: jobType,
            input: {
                message: input.message,
                brief,
                currentHtml: hasHtml ? currentHtml : undefined,
                sessionHistory,
                intent: chatIntent,
                webContext,
            },
            userMessageId,
        });
        return { jobId, intent: chatIntent };
    }),
    getRevisionUndoState: protectedProcedure
        .input(designIdSchema)
        .query(async ({ ctx, input }) => {
        const userId = ctx.session?.user?.id;
        if (!userId)
            throw new TRPCError({ code: "UNAUTHORIZED" });
        await assertDesignAccess({
            designId: input.designId,
            userId,
            userRole: ctx.session?.user?.role,
        });
        return getRevisionUndoRedoState(input.designId);
    }),
    undoAiRevision: protectedProcedure
        .input(designIdSchema)
        .mutation(async ({ ctx, input }) => {
        const userId = ctx.session?.user?.id;
        if (!userId)
            throw new TRPCError({ code: "UNAUTHORIZED" });
        const design = await assertDesignAccess({
            designId: input.designId,
            userId,
            userRole: ctx.session?.user?.role,
        });
        const snapshot = await popRevisionUndoSnapshot(input.designId);
        if (!snapshot) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Nothing to undo (revision history may have expired)",
            });
        }
        if (design.htmlContent?.trim()) {
            await pushRevisionRedoSnapshot(input.designId, design.htmlContent);
        }
        const applied = await applyRevisionHtmlToDesign({
            designId: input.designId,
            html: snapshot.html,
            changeSummary: "Undo AI edit",
        });
        return { html: applied.html, success: true };
    }),
    redoAiRevision: protectedProcedure
        .input(designIdSchema)
        .mutation(async ({ ctx, input }) => {
        const userId = ctx.session?.user?.id;
        if (!userId)
            throw new TRPCError({ code: "UNAUTHORIZED" });
        const design = await assertDesignAccess({
            designId: input.designId,
            userId,
            userRole: ctx.session?.user?.role,
        });
        const snapshot = await popRevisionRedoSnapshot(input.designId);
        if (!snapshot) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Nothing to redo (revision history may have expired)",
            });
        }
        if (design.htmlContent?.trim()) {
            await pushRevisionUndoSnapshot(input.designId, design.htmlContent);
        }
        const applied = await applyRevisionHtmlToDesign({
            designId: input.designId,
            html: snapshot.html,
            changeSummary: "Redo AI edit",
        });
        return { html: applied.html, success: true };
    }),
    /** Generate another design variation - reuses stored brief + webContext */
    generateVariation: protectedProcedure
        .input(generateVariationSchema)
        .mutation(async ({ ctx, input }) => {
        const userId = ctx.session?.user?.id;
        if (!userId)
            throw new TRPCError({ code: "UNAUTHORIZED" });
        const design = await assertDesignAccess({
            designId: input.designId,
            userId,
            userRole: ctx.session?.user?.role,
        });
        if (isBusy(design)) {
            throw new TRPCError({ code: "CONFLICT", message: "A job is already in progress" });
        }
        if (!design.brief) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Submit a brief first before generating variations",
            });
        }
        const session = await db.query.nebSession.findFirst({
            where: eq(nebSession.designId, input.designId),
        });
        if (!session)
            throw new TRPCError({ code: "NOT_FOUND", message: "Session missing" });
        const meta = design.metadata && typeof design.metadata === "object"
            ? design.metadata
            : {};
        const storedWebContext = typeof meta.brandWebContext === "string" ? meta.brandWebContext : null;
        const now = new Date();
        await db
            .update(nebDesign)
            .set({
            aiStatus: "GENERATING",
            workflowPhase: "DESIGNING",
            updatedAt: now,
        })
            .where(eq(nebDesign.id, input.designId));
        const jobId = await enqueueJob({
            designId: input.designId,
            sessionId: session.id,
            type: "CREATIVE_DESIGN",
            input: { brief: design.brief, webContext: storedWebContext },
        });
        return { jobId };
    }),
    /** Select which variation to use for building the HTML email */
    selectVariation: protectedProcedure
        .input(selectVariationSchema)
        .mutation(async ({ ctx, input }) => {
        const userId = ctx.session?.user?.id;
        if (!userId)
            throw new TRPCError({ code: "UNAUTHORIZED" });
        const design = await assertDesignAccess({
            designId: input.designId,
            userId,
            userRole: ctx.session?.user?.role,
        });
        const meta = design.metadata && typeof design.metadata === "object"
            ? design.metadata
            : {};
        const variations = Array.isArray(meta.designVariations)
            ? meta.designVariations
            : [];
        const chosen = variations.find((v) => v.id === input.variationId);
        if (!chosen) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Variation not found" });
        }
        await db
            .update(nebDesign)
            .set({
            creativeDesignUrl: chosen.url,
            metadata: {
                ...meta,
                design_notes: chosen.notes ?? meta.design_notes,
            },
            workflowPhase: "AWAITING_APPROVAL",
            updatedAt: new Date(),
        })
            .where(eq(nebDesign.id, input.designId));
        return { url: chosen.url };
    }),
    jobStatus: protectedProcedure.input(designIdSchema).query(async ({ ctx, input }) => {
        const userId = ctx.session?.user?.id;
        if (!userId)
            throw new TRPCError({ code: "UNAUTHORIZED" });
        await assertDesignAccess({
            designId: input.designId,
            userId,
            userRole: ctx.session?.user?.role,
        });
        const design = await db.query.nebDesign.findFirst({
            where: eq(nebDesign.id, input.designId),
        });
        const [job] = await db
            .select()
            .from(nebGenerationJob)
            .where(eq(nebGenerationJob.designId, input.designId))
            .orderBy(desc(nebGenerationJob.createdAt))
            .limit(1);
        return {
            aiStatus: design?.aiStatus ?? "IDLE",
            workflowPhase: design?.workflowPhase ?? "BRIEF",
            creativeDesignUrl: design?.creativeDesignUrl ?? null,
            job: job
                ? {
                    id: job.id,
                    type: job.type,
                    status: job.status,
                    errorMessage: job.errorMessage,
                }
                : null,
        };
    }),
});
