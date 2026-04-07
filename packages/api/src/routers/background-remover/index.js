import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../../trpc";
import Replicate from "replicate";
import { and, count, desc, eq } from "@npanel/db";
import { db } from "@npanel/db";
import { user } from "@npanel/db/schema/auth";
import { backgroundRemoverGeneration, backgroundRemoverGenerationActivityLog, } from "@npanel/db/schema/image-generator";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { startBackgroundRemovalSchema, startBackgroundRemovalResponseSchema, removeBackgroundSchema, updateBackgroundRemovalAfterUploadSchema, getBackgroundRemovalsSchema, deleteBackgroundRemovalSchema, getBackgroundRemovalsResponseSchema, removeBackgroundResponseSchema, updateBackgroundRemovalAfterUploadResponseSchema, backgroundRemoverGenerationSchema, } from "./schemas";
import { enqueueBackgroundRemoval } from "../../lib/qstash/background-remover";
import { getBackgroundRemoverCreditsForTeam } from "../../lib/background-remover-credits";
const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});
/** Replicate model: 851-labs/background-remover (InSPyReNet). Input: image (URL). Output: URI string. */
const BACKGROUND_REMOVER_MODEL = "851-labs/background-remover:a029dff38972b5fda4ec5d75d7d1cd25aeff621d2cf4946a41055d7db66b80bc";
/**
 * Run Replicate prediction with timeout and better error handling
 */
async function runReplicateWithTimeout(modelIdentifier, input, maxWaitTime = 120000 // 2 minutes default for background removal
) {
    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
            reject(new Error(`Replicate prediction timed out after ${maxWaitTime / 1000} seconds`));
        }, maxWaitTime);
    });
    // Create the actual prediction promise
    const predictionPromise = replicate.run(modelIdentifier, { input });
    // Race between timeout and prediction
    try {
        const output = await Promise.race([predictionPromise, timeoutPromise]);
        return output;
    }
    catch (error) {
        if (error instanceof Error && error.message.includes("timed out")) {
            throw new TRPCError({
                code: "TIMEOUT",
                message: `Background removal took too long. Please try again with a smaller image.`,
            });
        }
        throw error;
    }
}
/**
 * Download image from URL and get metadata
 */
async function downloadImage(imageUrl) {
    const response = await fetch(imageUrl);
    if (!response.ok) {
        throw new Error(`Failed to download image: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = response.headers.get("content-type") || "image/png";
    const size = buffer.length;
    return { buffer, contentType, size };
}
function normalizeStatus(g) {
    const s = g?.status;
    if (s === "QUEUED" || s === "PROCESSING" || s === "COMPLETED" || s === "FAILED")
        return s;
    if (g?.processedImageUrl)
        return "COMPLETED";
    return "QUEUED";
}
function transformBackgroundRemoval(generation) {
    return {
        id: generation.id,
        userId: generation.userId,
        teamId: generation.teamId,
        originalImageUrl: generation.originalImageUrl,
        originalImageKey: generation.originalImageKey ?? "",
        originalImageFileName: generation.originalImageFileName,
        originalImageSize: generation.originalImageSize,
        originalImageMimeType: generation.originalImageMimeType,
        originalImageMetadata: generation.originalImageMetadata ?? null,
        processedImageUrl: generation.processedImageUrl ?? null,
        processedImageKey: generation.processedImageKey ?? null,
        processedImageFileName: generation.processedImageFileName ?? null,
        processedImageSize: generation.processedImageSize ?? null,
        processedImageMimeType: generation.processedImageMimeType ?? null,
        processedImageMetadata: generation.processedImageMetadata ?? null,
        modelId: generation.modelId,
        modelName: generation.modelName ?? null,
        status: normalizeStatus(generation),
        errorMessage: generation.errorMessage ?? null,
        qstashMessageId: generation.qstashMessageId ?? null,
        startedAt: generation.startedAt ?? null,
        completedAt: generation.completedAt ?? null,
        createdAt: generation.createdAt,
        updatedAt: generation.updatedAt,
    };
}
export const backgroundRemoverRouter = router({
    // Start background removal (fire-and-forget via QStash); worker fills processed* when done.
    startBackgroundRemoval: protectedProcedure
        .input(startBackgroundRemovalSchema)
        .output(startBackgroundRemovalResponseSchema)
        .mutation(async ({ ctx, input }) => {
        const userId = ctx.session?.user?.id;
        if (!userId)
            throw new TRPCError({ code: "UNAUTHORIZED" });
        const [currentUser] = await db
            .select({ role: user.role })
            .from(user)
            .where(eq(user.id, userId))
            .limit(1);
        const isCustomer = currentUser?.role === "CUSTOMER" ||
            (Array.isArray(currentUser?.role) &&
                (currentUser?.role).includes("CUSTOMER"));
        if (isCustomer) {
            if (!input.teamId) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Team is required for customer background removal.",
                });
            }
            const creditsResult = await getBackgroundRemoverCreditsForTeam(input.teamId);
            if (!creditsResult) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "No active Background Remover subscription found for this team.",
                });
            }
            const credits = creditsResult.credits;
            if (credits !== null && credits < 1) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "Insufficient credits. You need at least 1 credit to remove backgrounds.",
                });
            }
        }
        const now = new Date();
        const id = randomUUID();
        await db.insert(backgroundRemoverGeneration).values({
            id,
            userId,
            teamId: input.teamId ?? null,
            originalImageUrl: input.image,
            originalImageKey: input.originalImageKey ?? "",
            originalImageFileName: input.originalImageFileName ?? `original-${Date.now()}.png`,
            originalImageSize: input.originalImageSize ?? 0,
            originalImageMimeType: input.originalImageMimeType ?? "image/png",
            originalImageMetadata: null,
            processedImageUrl: null,
            processedImageKey: null,
            processedImageFileName: null,
            processedImageSize: null,
            processedImageMimeType: null,
            processedImageMetadata: null,
            modelId: BACKGROUND_REMOVER_MODEL,
            modelName: "851 Labs Background Remover",
            status: "QUEUED",
            errorMessage: null,
            qstashMessageId: null,
            startedAt: null,
            completedAt: null,
            createdAt: now,
            updatedAt: now,
        });
        const { messageId } = await enqueueBackgroundRemoval(id);
        await db
            .update(backgroundRemoverGeneration)
            .set({ qstashMessageId: messageId, updatedAt: new Date() })
            .where(eq(backgroundRemoverGeneration.id, id));
        await db.insert(backgroundRemoverGenerationActivityLog).values({
            id: randomUUID(),
            backgroundRemoverGenerationId: id,
            userId,
            action: "GENERATE",
            description: "Background removal job enqueued",
            metadata: { model: BACKGROUND_REMOVER_MODEL, qstashMessageId: messageId },
            ipAddress: null,
            userAgent: null,
            createdAt: new Date(),
        });
        return { generationId: id, status: "QUEUED" };
    }),
    // Legacy: synchronous remove (deprecated; use startBackgroundRemoval)
    removeBackground: protectedProcedure
        .input(removeBackgroundSchema)
        .output(removeBackgroundResponseSchema)
        .mutation(async ({ ctx, input }) => {
        const userId = ctx.session?.user?.id;
        if (!userId)
            throw new TRPCError({ code: "UNAUTHORIZED" });
        const ipAddress = undefined;
        const userAgent = undefined;
        const now = new Date();
        try {
            const replicateInput = { image: input.image };
            const output = await runReplicateWithTimeout(BACKGROUND_REMOVER_MODEL, replicateInput, 120000);
            let processedImageUrl;
            if (typeof output === "string") {
                processedImageUrl = output;
            }
            else if (Array.isArray(output) && output.length > 0) {
                processedImageUrl = output[0];
            }
            else if (output && typeof output === "object" && "url" in output) {
                const u = output.url;
                processedImageUrl = typeof u === "string" ? u : String(u);
            }
            else if (output && typeof output === "object" && typeof output.url === "function") {
                processedImageUrl = output.url();
            }
            else {
                throw new Error(`Unexpected output format from Replicate: ${JSON.stringify(output)}`);
            }
            if (!processedImageUrl || typeof processedImageUrl !== "string") {
                throw new Error(`No valid image URL in Replicate response. Output: ${JSON.stringify(output)}`);
            }
            const processedImageData = await downloadImage(processedImageUrl);
            let originalImageData = null;
            if (input.image.startsWith("http://") || input.image.startsWith("https://")) {
                try {
                    originalImageData = await downloadImage(input.image);
                }
                catch (e) {
                    console.warn("Failed to download original image for metadata:", e);
                }
            }
            const generationId = randomUUID();
            const originalImageFileName = originalImageData
                ? `original-${Date.now()}.${originalImageData.contentType.split("/")[1] || "png"}`
                : `original-${Date.now()}.png`;
            const processedImageFileName = `background-removed-${Date.now()}.png`;
            await db.insert(backgroundRemoverGeneration).values({
                id: generationId,
                userId,
                teamId: input.teamId ?? null,
                originalImageUrl: input.image,
                originalImageKey: "",
                originalImageFileName,
                originalImageSize: originalImageData?.size ?? 0,
                originalImageMimeType: originalImageData?.contentType ?? "image/png",
                originalImageMetadata: originalImageData ? { contentType: originalImageData.contentType, size: originalImageData.size } : undefined,
                processedImageUrl,
                processedImageKey: "",
                processedImageFileName,
                processedImageSize: processedImageData.size,
                processedImageMimeType: processedImageData.contentType,
                processedImageMetadata: { model: BACKGROUND_REMOVER_MODEL, contentType: processedImageData.contentType, size: processedImageData.size },
                modelId: BACKGROUND_REMOVER_MODEL,
                modelName: "851 Labs Background Remover",
                status: "COMPLETED",
                errorMessage: null,
                qstashMessageId: null,
                startedAt: now,
                completedAt: now,
                createdAt: now,
                updatedAt: now,
            });
            await db.insert(backgroundRemoverGenerationActivityLog).values({
                id: randomUUID(),
                backgroundRemoverGenerationId: generationId,
                userId,
                action: "GENERATE",
                description: "Removed background from image (sync)",
                metadata: {
                    originalImageFileName,
                    processedImageFileName,
                    model: BACKGROUND_REMOVER_MODEL,
                },
                ipAddress: ipAddress ?? null,
                userAgent: userAgent ?? null,
                createdAt: now,
            });
            return { data: processedImageUrl, generationId };
        }
        catch (error) {
            console.error("Error removing background:", error);
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: error instanceof Error ? error.message : "Failed to remove background",
            });
        }
    }),
    // Update generation after UploadThing upload
    updateGenerationAfterUpload: protectedProcedure
        .input(updateBackgroundRemovalAfterUploadSchema)
        .output(updateBackgroundRemovalAfterUploadResponseSchema)
        .mutation(async ({ ctx, input }) => {
        const userId = ctx.session?.user?.id;
        if (!userId) {
            throw new TRPCError({ code: "UNAUTHORIZED" });
        }
        // Verify ownership
        const [generation] = await db
            .select({ id: backgroundRemoverGeneration.id })
            .from(backgroundRemoverGeneration)
            .where(and(eq(backgroundRemoverGeneration.id, input.generationId), eq(backgroundRemoverGeneration.userId, userId)))
            .limit(1);
        if (!generation) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Generation not found" });
        }
        // Update with UploadThing data
        await db
            .update(backgroundRemoverGeneration)
            .set({
            originalImageUrl: input.originalImageUrl,
            originalImageKey: input.originalImageKey,
            originalImageFileName: input.originalImageFileName,
            originalImageSize: input.originalImageSize,
            originalImageMimeType: input.originalImageMimeType,
            processedImageUrl: input.processedImageUrl,
            processedImageKey: input.processedImageKey,
            processedImageFileName: input.processedImageFileName,
            processedImageSize: input.processedImageSize,
            processedImageMimeType: input.processedImageMimeType,
            updatedAt: new Date(),
        })
            .where(eq(backgroundRemoverGeneration.id, input.generationId));
        return { data: { id: input.generationId } };
    }),
    // Get generations
    getGenerations: protectedProcedure
        .input(getBackgroundRemovalsSchema)
        .output(getBackgroundRemovalsResponseSchema)
        .query(async ({ ctx, input }) => {
        const userId = ctx.session?.user?.id;
        if (!userId) {
            throw new TRPCError({ code: "UNAUTHORIZED" });
        }
        const whereClause = input.teamId
            ? and(eq(backgroundRemoverGeneration.userId, userId), eq(backgroundRemoverGeneration.teamId, input.teamId))
            : eq(backgroundRemoverGeneration.userId, userId);
        const [generations, total] = await Promise.all([
            db
                .select()
                .from(backgroundRemoverGeneration)
                .where(whereClause)
                .orderBy(desc(backgroundRemoverGeneration.createdAt))
                .offset((input.page - 1) * input.limit)
                .limit(input.limit),
            db
                .select({ value: count(backgroundRemoverGeneration.id) })
                .from(backgroundRemoverGeneration)
                .where(whereClause),
        ]);
        const totalCount = Number(total[0]?.value ?? 0);
        // Transform Prisma data to clean API response
        return {
            data: generations.map(transformBackgroundRemoval),
            pagination: {
                page: input.page,
                limit: input.limit,
                total: totalCount,
                totalPages: Math.ceil(totalCount / input.limit),
            },
        };
    }),
    // Delete generation
    deleteGeneration: protectedProcedure
        .input(deleteBackgroundRemovalSchema)
        .mutation(async ({ ctx, input }) => {
        const userId = ctx.session?.user?.id;
        if (!userId) {
            throw new TRPCError({ code: "UNAUTHORIZED" });
        }
        // Check if user has access to this generation
        const [existingGeneration] = await db
            .select()
            .from(backgroundRemoverGeneration)
            .where(and(eq(backgroundRemoverGeneration.id, input.id), eq(backgroundRemoverGeneration.userId, userId)))
            .limit(1);
        if (!existingGeneration) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Generation not found" });
        }
        // Create activity log before deletion
        await db.insert(backgroundRemoverGenerationActivityLog).values({
            id: randomUUID(),
            backgroundRemoverGenerationId: input.id,
            userId,
            action: "DELETE",
            description: `Deleted background removal: ${existingGeneration.processedImageFileName ?? "unknown"}`,
            metadata: {
                originalImageFileName: existingGeneration.originalImageFileName,
                processedImageFileName: existingGeneration.processedImageFileName,
                originalImageKey: existingGeneration.originalImageKey,
                processedImageKey: existingGeneration.processedImageKey,
            },
            ipAddress: null,
            userAgent: null,
            createdAt: new Date(),
        });
        await db
            .delete(backgroundRemoverGeneration)
            .where(eq(backgroundRemoverGeneration.id, input.id));
        return { data: { id: input.id } };
    }),
});
