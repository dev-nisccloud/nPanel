import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "@npanel/db";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { db } from "@npanel/db";
import { imageGenAiGeneration, imageGenAiGenerationActivityLog, } from "@npanel/db/schema/imagegen-studio";
import { protectedProcedure, router } from "../../trpc";
import { getAiGenerationsSchema, deleteAiGenerationSchema, getAiGenerationsResponseSchema, imageGenAiGenerationSchema, } from "./schemas";
import { getUserTeamIds, orUserOrTeamMember, personalScope } from "./team-scope";
/**
 * Transform function to ensure clean data (no ORM types leak)
 */
function transformAiGeneration(gen) {
    let referenceImageUrls = [];
    if (gen.referenceImageUrls) {
        if (typeof gen.referenceImageUrls === "string") {
            try {
                referenceImageUrls = JSON.parse(gen.referenceImageUrls);
            }
            catch {
                referenceImageUrls = [];
            }
        }
        else if (Array.isArray(gen.referenceImageUrls)) {
            referenceImageUrls = gen.referenceImageUrls;
        }
    }
    return {
        id: gen.id,
        prompt: gen.prompt,
        referenceImageUrls,
        imageUrl: gen.imageUrl,
        imageFileName: gen.imageFileName,
        imageSize: gen.imageSize,
        imageMimeType: gen.imageMimeType,
        imageMetadata: gen.imageMetadata ?? null,
        modelId: gen.modelId,
        modelName: gen.modelName,
        createdAt: gen.createdAt,
        updatedAt: gen.updatedAt,
    };
}
export const imageGenAiGenerationsRouter = router({
    list: protectedProcedure
        .input(getAiGenerationsSchema)
        .output(getAiGenerationsResponseSchema)
        .query(async ({ ctx, input }) => {
        const userId = ctx.session?.user?.id;
        if (!userId) {
            throw new TRPCError({ code: "UNAUTHORIZED" });
        }
        const { page, limit, teamId } = input;
        const userTeamIds = await getUserTeamIds(userId);
        let whereCond;
        if (teamId) {
            if (!userTeamIds.includes(teamId)) {
                return { data: [], nextPage: null };
            }
            whereCond = eq(imageGenAiGeneration.teamId, teamId);
        }
        else {
            whereCond = personalScope(imageGenAiGeneration.userId, imageGenAiGeneration.teamId, userId);
        }
        const generations = await db
            .select({
            id: imageGenAiGeneration.id,
            prompt: imageGenAiGeneration.prompt,
            referenceImageUrls: imageGenAiGeneration.referenceImageUrls,
            imageUrl: imageGenAiGeneration.imageUrl,
            imageFileName: imageGenAiGeneration.imageFileName,
            imageSize: imageGenAiGeneration.imageSize,
            imageMimeType: imageGenAiGeneration.imageMimeType,
            imageMetadata: imageGenAiGeneration.imageMetadata,
            modelId: imageGenAiGeneration.modelId,
            modelName: imageGenAiGeneration.modelName,
            createdAt: imageGenAiGeneration.createdAt,
            updatedAt: imageGenAiGeneration.updatedAt,
        })
            .from(imageGenAiGeneration)
            .where(whereCond)
            .orderBy(desc(imageGenAiGeneration.createdAt))
            .limit(limit)
            .offset((page - 1) * limit);
        return {
            data: generations.map(transformAiGeneration),
            nextPage: generations.length === limit ? page + 1 : null,
        };
    }),
    delete: protectedProcedure
        .input(deleteAiGenerationSchema)
        .output(z.object({ data: z.object({ id: z.string() }) }))
        .mutation(async ({ ctx, input }) => {
        const userId = ctx.session?.user?.id;
        if (!userId) {
            throw new TRPCError({ code: "UNAUTHORIZED" });
        }
        const ipAddress = undefined;
        const userAgent = undefined;
        const userTeamIds = await getUserTeamIds(userId);
        const existingGeneration = await db.query.imageGenAiGeneration.findFirst({
            where: and(eq(imageGenAiGeneration.id, input.id), orUserOrTeamMember(imageGenAiGeneration.userId, imageGenAiGeneration.teamId, userId, userTeamIds)),
        });
        if (!existingGeneration) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Generation not found" });
        }
        await db.insert(imageGenAiGenerationActivityLog).values({
            id: randomUUID(),
            imageGenAiGenerationId: input.id,
            userId,
            action: "DELETE",
            description: `Deleted AI generation: ${existingGeneration.imageFileName}`,
            metadata: {
                prompt: existingGeneration.prompt,
                imageFileName: existingGeneration.imageFileName,
                imageKey: existingGeneration.imageKey,
            },
            ipAddress: ipAddress ?? null,
            userAgent: userAgent ?? null,
            createdAt: new Date(),
        });
        await db
            .delete(imageGenAiGeneration)
            .where(eq(imageGenAiGeneration.id, input.id));
        return { data: { id: input.id } };
    }),
});
