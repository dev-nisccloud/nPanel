import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "@npanel/db";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { db } from "@npanel/db";
import { zeepoCanvasGeneration, zeepoCanvasActivityLog } from "@npanel/db/schema/zeepo-canvas";
import { protectedProcedure, router } from "../../trpc";
import { startGenerationSchema, getGenerationSchema, getGenerationsByNodeSchema, } from "./schemas";
// Ensure this file exists in packages/api/src/lib/qstash/zeepo-canvas.ts next.
import { enqueueZeepoCanvasGeneration } from "../../lib/qstash/zeepo-canvas";
import { redactReplicateHostedUrlsDeep } from "../../lib/replicate-hosted-url";
export const zeepoCanvasGenerateRouter = router({
    start: protectedProcedure
        .input(startGenerationSchema)
        .mutation(async ({ ctx, input }) => {
        const userId = ctx.session?.user?.id;
        if (!userId) {
            throw new TRPCError({ code: "UNAUTHORIZED" });
        }
        const now = new Date();
        const generationId = randomUUID();
        // 1. Create the generation record in "QUEUED" state
        await db.insert(zeepoCanvasGeneration).values({
            id: generationId,
            projectId: input.projectId,
            nodeId: input.nodeId,
            userId,
            teamId: input.teamId ?? null,
            modelCategory: input.modelCategory,
            modelId: input.modelId,
            prompt: input.prompt ?? null,
            inputs: input.inputs ?? null,
            status: "QUEUED",
            errorMessage: null,
            qstashMessageId: null,
            createdAt: now,
            updatedAt: now,
        });
        // 2. Enqueue the job to QStash
        let qstashMessageId = null;
        try {
            const result = await enqueueZeepoCanvasGeneration(generationId);
            qstashMessageId = result.messageId;
            await db
                .update(zeepoCanvasGeneration)
                .set({ qstashMessageId: result.messageId, updatedAt: new Date() })
                .where(eq(zeepoCanvasGeneration.id, generationId));
        }
        catch (err) {
            console.error("QStash enqueue failed for Zeepo Canvas:", err);
            await db
                .update(zeepoCanvasGeneration)
                .set({
                status: "FAILED",
                errorMessage: err instanceof Error ? err.message : "Failed to enqueue job",
                updatedAt: new Date(),
            })
                .where(eq(zeepoCanvasGeneration.id, generationId));
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: err instanceof Error ? err.message : "Failed to start generation",
            });
        }
        // 3. Log activity
        await db.insert(zeepoCanvasActivityLog).values({
            id: randomUUID(),
            projectId: input.projectId,
            userId,
            action: "GENERATE",
            description: `Started ${input.modelCategory} generation using ${input.modelId}`,
            metadata: {
                nodeId: input.nodeId,
                modelId: input.modelId,
                prompt: input.prompt,
                qstashMessageId,
            },
            ipAddress: ctx.ipAddress ?? null,
            userAgent: ctx.req.header("user-agent") ?? null,
        });
        return {
            generationId,
            status: "QUEUED",
        };
    }),
    getGeneration: protectedProcedure
        .input(getGenerationSchema)
        .query(async ({ ctx, input }) => {
        const userId = ctx.session?.user?.id;
        if (!userId) {
            throw new TRPCError({ code: "UNAUTHORIZED" });
        }
        const generation = await db.query.zeepoCanvasGeneration.findFirst({
            where: eq(zeepoCanvasGeneration.id, input.generationId),
        });
        if (!generation) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Generation not found",
            });
        }
        const safe = {
            ...generation,
            outputs: redactReplicateHostedUrlsDeep(generation.outputs),
        };
        return { data: safe };
    }),
    getGenerationsByNode: protectedProcedure
        .input(getGenerationsByNodeSchema)
        .query(async ({ ctx, input }) => {
        const userId = ctx.session?.user?.id;
        if (!userId) {
            throw new TRPCError({ code: "UNAUTHORIZED" });
        }
        const generations = await db.query.zeepoCanvasGeneration.findMany({
            where: and(eq(zeepoCanvasGeneration.projectId, input.projectId), eq(zeepoCanvasGeneration.nodeId, input.nodeId)),
            orderBy: [desc(zeepoCanvasGeneration.createdAt)],
        });
        const sanitized = generations.map((row) => ({
            ...row,
            outputs: redactReplicateHostedUrlsDeep(row.outputs),
        }));
        return { data: sanitized };
    }),
});
