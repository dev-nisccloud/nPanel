import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../../trpc";
import Replicate from "replicate";
import prisma from "@nPanel/db";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { fetch } from "undici";
import {
  removeBackgroundSchema,
  updateBackgroundRemovalAfterUploadSchema,
  getBackgroundRemovalsSchema,
  deleteBackgroundRemovalSchema,
  getBackgroundRemovalsResponseSchema,
  removeBackgroundResponseSchema,
  updateBackgroundRemovalAfterUploadResponseSchema,
  backgroundRemoverGenerationSchema,
} from "./schemas";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

/**
 * Run Replicate prediction with timeout and better error handling
 */
async function runReplicateWithTimeout(
  modelIdentifier: string,
  input: Record<string, any>,
  maxWaitTime: number = 120000 // 2 minutes default for background removal
): Promise<any> {
  // Create a timeout promise
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Replicate prediction timed out after ${maxWaitTime / 1000} seconds`));
    }, maxWaitTime);
  });

  // Create the actual prediction promise
  const predictionPromise = replicate.run(modelIdentifier as `${string}/${string}`, { input });

  // Race between timeout and prediction
  try {
    const output = await Promise.race([predictionPromise, timeoutPromise]);
    return output;
  } catch (error) {
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
async function downloadImage(imageUrl: string): Promise<{
  buffer: Buffer;
  contentType: string;
  size: number;
}> {
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

/**
 * Transform function to ensure clean data (no Prisma types leak)
 */
function transformBackgroundRemoval(generation: any): z.infer<typeof backgroundRemoverGenerationSchema> {
  return {
    id: generation.id,
    userId: generation.userId,
    teamId: generation.teamId,
    originalImageUrl: generation.originalImageUrl,
    originalImageKey: generation.originalImageKey,
    originalImageFileName: generation.originalImageFileName,
    originalImageSize: generation.originalImageSize,
    originalImageMimeType: generation.originalImageMimeType,
    originalImageMetadata: generation.originalImageMetadata ?? null,
    processedImageUrl: generation.processedImageUrl,
    processedImageKey: generation.processedImageKey,
    processedImageFileName: generation.processedImageFileName,
    processedImageSize: generation.processedImageSize,
    processedImageMimeType: generation.processedImageMimeType,
    processedImageMetadata: generation.processedImageMetadata ?? null,
    modelId: generation.modelId,
    modelName: generation.modelName,
    createdAt: generation.createdAt,
    updatedAt: generation.updatedAt,
  };
}

export const backgroundRemoverRouter = router({
  // Remove background from an image
  removeBackground: protectedProcedure
    .input(removeBackgroundSchema)
    .output(removeBackgroundResponseSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      // Note: Request headers are not available in tRPC context
      const ipAddress = undefined;
      const userAgent = undefined;

      try {
        // Prepare Replicate input
        const replicateInput: Record<string, any> = {
          image: input.image,
        };

        // Run Replicate prediction with timeout (2 minutes for background removal)
        const output = await runReplicateWithTimeout(
          "cjwbw/rembg:fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003",
          replicateInput,
          120000
        );

        // Handle different output formats
        // Sometimes output is a string (URL), sometimes an array of URLs
        let processedImageUrl: string;
        if (typeof output === "string") {
          processedImageUrl = output;
        } else if (Array.isArray(output) && output.length > 0) {
          processedImageUrl = output[0] as string;
        } else if (output && typeof output === "object" && "url" in output) {
          processedImageUrl = (output as any).url;
        } else {
          throw new Error(
            `Unexpected output format from Replicate: ${JSON.stringify(output)}`
          );
        }

        if (!processedImageUrl || typeof processedImageUrl !== "string") {
          throw new Error(
            `No valid image URL found in Replicate response. Output: ${JSON.stringify(output)}`
          );
        }

        // Download processed image to get metadata
        const processedImageData = await downloadImage(processedImageUrl);

        // Download original image to get metadata (if it's a URL)
        let originalImageData: { buffer: Buffer; contentType: string; size: number } | null = null;
        if (input.image.startsWith("http://") || input.image.startsWith("https://")) {
          try {
            originalImageData = await downloadImage(input.image);
          } catch (error) {
            console.warn("Failed to download original image for metadata:", error);
          }
        }

        // Save generation to database
        // Note: We'll upload to UploadThing client-side and update the record
        // For now, we save with the Replicate URLs
        const generation = await prisma.backgroundRemoverGeneration.create({
          data: {
            id: randomUUID(),
            userId,
            teamId: input.teamId ?? null,
            originalImageUrl: input.image, // Will be updated after UploadThing upload
            originalImageKey: "", // Will be set after UploadThing upload
            originalImageFileName: originalImageData
              ? `original-${Date.now()}.${originalImageData.contentType.split("/")[1] || "png"}`
              : `original-${Date.now()}.png`,
            originalImageSize: originalImageData?.size || 0,
            originalImageMimeType: originalImageData?.contentType || "image/png",
            originalImageMetadata: originalImageData
              ? {
                  contentType: originalImageData.contentType,
                  size: originalImageData.size,
                }
              : undefined,
            processedImageUrl, // Will be updated after UploadThing upload
            processedImageKey: "", // Will be set after UploadThing upload
            processedImageFileName: `background-removed-${Date.now()}.png`,
            processedImageSize: processedImageData.size,
            processedImageMimeType: processedImageData.contentType,
            processedImageMetadata: {
              model: "cjwbw/rembg:fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003",
              contentType: processedImageData.contentType,
              size: processedImageData.size,
            },
            modelId: "cjwbw/rembg:fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003",
            modelName: "Remove Background",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });

        // Create activity log
        await prisma.backgroundRemoverGenerationActivityLog.create({
          data: {
            id: randomUUID(),
            backgroundRemoverGenerationId: generation.id,
            userId,
            action: "GENERATE",
            description: `Removed background from image`,
            metadata: {
              originalImageFileName: generation.originalImageFileName,
              processedImageFileName: generation.processedImageFileName,
              model: "cjwbw/rembg:fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003",
            },
            ipAddress,
            userAgent,
            createdAt: new Date(),
          },
        });

        return {
          data: processedImageUrl,
          generationId: generation.id, // Return ID so client can update after UploadThing upload
        };
      } catch (error) {
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
      const generation = await prisma.backgroundRemoverGeneration.findFirst({
        where: {
          id: input.generationId,
          userId,
        },
      });

      if (!generation) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Generation not found" });
      }

      // Update with UploadThing data
      await prisma.backgroundRemoverGeneration.update({
        where: { id: input.generationId },
        data: {
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
        },
      });

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

      const where: any = {
        userId,
      };

      if (input.teamId) {
        where.teamId = input.teamId;
      }

      const [generations, total] = await Promise.all([
        prisma.backgroundRemoverGeneration.findMany({
          where,
          orderBy: {
            createdAt: "desc",
          },
          skip: (input.page - 1) * input.limit,
          take: input.limit,
        }),
        prisma.backgroundRemoverGeneration.count({ where }),
      ]);

      // Transform Prisma data to clean API response
      return {
        data: generations.map(transformBackgroundRemoval),
        pagination: {
          page: input.page,
          limit: input.limit,
          total,
          totalPages: Math.ceil(total / input.limit),
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
      const existingGeneration = await prisma.backgroundRemoverGeneration.findFirst({
        where: {
          id: input.id,
          userId,
        },
      });

      if (!existingGeneration) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Generation not found" });
      }

      // Create activity log before deletion
      await prisma.backgroundRemoverGenerationActivityLog.create({
        data: {
          id: randomUUID(),
          backgroundRemoverGenerationId: input.id,
          userId,
          action: "DELETE",
          description: `Deleted background removal: ${existingGeneration.processedImageFileName}`,
          metadata: {
            originalImageFileName: existingGeneration.originalImageFileName,
            processedImageFileName: existingGeneration.processedImageFileName,
            originalImageKey: existingGeneration.originalImageKey,
            processedImageKey: existingGeneration.processedImageKey,
          },
          ipAddress: undefined,
          userAgent: undefined,
          createdAt: new Date(),
        },
      });

      await prisma.backgroundRemoverGeneration.delete({
        where: { id: input.id },
      });

      return { data: { id: input.id } };
    }),
});
