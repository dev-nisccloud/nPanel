import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../../trpc";
import Replicate from "replicate";
import prisma from "@nPanel/db";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import {
  generateImageSchema,
  updateVariationAfterUploadSchema,
  getGenerationsSchema,
  deleteGenerationSchema,
} from "./schemas";
import { fetch } from "undici";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

/**
 * Run Replicate prediction with timeout and better error handling
 */
async function runReplicateWithTimeout(
  modelIdentifier: string,
  input: Record<string, any>,
  maxWaitTime: number = 300000 // 5 minutes default for image generation
): Promise<any> {
  // Create a timeout promise
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Replicate prediction timed out after ${maxWaitTime / 1000} seconds`));
    }, maxWaitTime);
  });

  // Run the prediction with timeout
  try {
    const output = await Promise.race([
      replicate.run(modelIdentifier as `${string}/${string}`, { input }),
      timeoutPromise,
    ]);
    return output;
  } catch (error) {
    // Provide better error messages
    if (error instanceof Error) {
      if (error.message.includes("timed out")) {
        throw error;
      }
      // Check for common Replicate errors
      if (error.message.includes("No image content found") || error.message.includes("Prediction failed")) {
        throw new Error(
          `Image generation failed. The model may be taking longer than expected or encountered an error. Please try again. Original error: ${error.message}`
        );
      }
    }
    throw error;
  }
}

/**
 * Convert aspect ratio to Replicate format
 * Supported ratios: 1:1, 2:3, 3:2, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9, 21:9
 */
function convertAspectRatio(aspectRatio: string): string {
  const ratioMap: Record<string, string> = {
    "1:1": "1:1",
    "2:3": "2:3",
    "3:2": "3:2",
    "3:4": "3:4",
    "4:3": "4:3",
    "4:5": "4:5",
    "5:4": "5:4",
    "9:16": "9:16",
    "16:9": "16:9",
    "21:9": "21:9",
  };
  return ratioMap[aspectRatio] || "4:3";
}

/**
 * Convert resolution to Replicate format
 */
function convertResolution(resolution: string): string {
  const resolutionMap: Record<string, string> = {
    "1K": "1K",
    "2K": "2K",
    "4K": "4K",
  };
  return resolutionMap[resolution] || "2K";
}

/**
 * Convert output format to Replicate format
 */
function convertOutputFormat(format: string): string {
  const formatMap: Record<string, string> = {
    png: "png",
    jpg: "jpeg",
  };
  return formatMap[format] || "png";
}

export const imageGeneratorRouter = router({
  // Generate images with variations from a prompt with optional reference images
  generateImage: protectedProcedure
    .input(generateImageSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      // Note: Request headers are not available in tRPC context
      const ipAddress = undefined;
      const userAgent = undefined;

      try {
        // Create generation record first
        const generation = await prisma.imageGeneratorGeneration.create({
          data: {
            id: randomUUID(),
            userId,
            teamId: input.teamId ?? null,
            prompt: input.prompt,
            referenceImageUrls: input.referenceImageUrls && input.referenceImageUrls.length > 0 
              ? input.referenceImageUrls 
              : undefined,
            aspectRatio: input.aspectRatio,
            outputFormat: input.outputFormat,
            resolution: input.resolution,
            variationsCount: input.variations,
            modelId: "google/nano-banana-pro",
            modelName: "Nano Banana Pro",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });

        // Prepare Replicate input
        const replicateInput: Record<string, any> = {
          prompt: input.prompt,
          resolution: convertResolution(input.resolution),
          image_input: input.referenceImageUrls || [],
          aspect_ratio: convertAspectRatio(input.aspectRatio),
          output_format: convertOutputFormat(input.outputFormat),
          safety_filter_level: "block_only_high",
        };

        // Generate variations sequentially
        const variations: Array<{
          id: string;
          variationIndex: number;
          imageUrl: string;
          imageKey: string;
          imageFileName: string;
          imageSize: number;
          imageMimeType: string;
        }> = [];

        for (let i = 0; i < input.variations; i++) {
          try {
            // Run Replicate prediction with timeout (5 minutes for image generation)
            const output = await runReplicateWithTimeout(
              "google/nano-banana-pro",
              replicateInput,
              300000
            );

            // Handle different output formats
            let generatedImageUrl: string;
            if (typeof output === "string") {
              generatedImageUrl = output;
            } else if (Array.isArray(output) && output.length > 0) {
              generatedImageUrl = output[0] as string;
            } else if (output && typeof output === "object" && "url" in output) {
              generatedImageUrl = (output as any).url;
            } else {
              throw new Error(
                `Unexpected output format from Replicate: ${JSON.stringify(output)}`
              );
            }

            if (!generatedImageUrl || typeof generatedImageUrl !== "string") {
              throw new Error(
                `No valid image URL found in Replicate response. Output: ${JSON.stringify(output)}`
              );
            }

            // Download image to get metadata
            const imageResponse = await fetch(generatedImageUrl);
            if (!imageResponse.ok) {
              throw new Error(`Failed to download image: ${imageResponse.statusText}`);
            }

            const arrayBuffer = await imageResponse.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const contentType = imageResponse.headers.get("content-type") || `image/${input.outputFormat}`;

            // Create variation record (will be updated after UploadThing upload)
            const variation = await prisma.imageGeneratorVariation.create({
              data: {
                id: randomUUID(),
                imageGeneratorGenerationId: generation.id,
                variationIndex: i + 1,
                imageUrl: generatedImageUrl, // Replicate URL, will be updated after UploadThing upload
                imageKey: "", // Will be set after UploadThing upload
                imageFileName: `ai-generated-${Date.now()}-${i + 1}.${input.outputFormat}`,
                imageSize: buffer.length,
                imageMimeType: contentType,
                imageMetadata: {
                  model: "google/nano-banana-pro",
                  resolution: input.resolution,
                  aspectRatio: input.aspectRatio,
                  outputFormat: input.outputFormat,
                },
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            });

            variations.push({
              id: variation.id,
              variationIndex: variation.variationIndex,
              imageUrl: generatedImageUrl,
              imageKey: "",
              imageFileName: variation.imageFileName,
              imageSize: variation.imageSize,
              imageMimeType: variation.imageMimeType,
            });
          } catch (error) {
            console.error(`Error generating variation ${i + 1}:`, error);
            // Continue with other variations even if one fails
          }
        }

        // Create activity log
        await prisma.imageGeneratorGenerationActivityLog.create({
          data: {
            id: randomUUID(),
            imageGeneratorGenerationId: generation.id,
            userId,
            action: "GENERATE",
            description: `Generated ${variations.length} variation(s) with prompt: ${input.prompt.substring(0, 100)}${input.prompt.length > 100 ? "..." : ""}`,
            metadata: {
              prompt: input.prompt,
              referenceImageCount: input.referenceImageUrls?.length || 0,
              variationsRequested: input.variations,
              variationsGenerated: variations.length,
              model: "google/nano-banana-pro",
              aspectRatio: input.aspectRatio,
              resolution: input.resolution,
              outputFormat: input.outputFormat,
            },
            ipAddress,
            userAgent,
            createdAt: new Date(),
          },
        });

        return {
          generationId: generation.id,
          variations: variations.map((v) => ({
            id: v.id,
            variationIndex: v.variationIndex,
            imageUrl: v.imageUrl,
            imageFileName: v.imageFileName,
            imageSize: v.imageSize,
            imageMimeType: v.imageMimeType,
          })),
        };
      } catch (error) {
        console.error("Error generating images:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to generate images",
        });
      }
    }),

  // Update variation after UploadThing upload
  updateVariationAfterUpload: protectedProcedure
    .input(updateVariationAfterUploadSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      // Verify ownership through generation
      const variation = await prisma.imageGeneratorVariation.findFirst({
        where: {
          id: input.variationId,
        },
        include: {
          imageGeneratorGeneration: true,
        },
      });

      if (!variation || variation.imageGeneratorGeneration.userId !== userId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Variation not found" });
      }

      // Update with UploadThing data
      await prisma.imageGeneratorVariation.update({
        where: { id: input.variationId },
        data: {
          imageUrl: input.imageUrl,
          imageKey: input.imageKey,
          imageFileName: input.imageFileName,
          imageSize: input.imageSize,
          imageMimeType: input.imageMimeType,
          updatedAt: new Date(),
        },
      });

      return { data: { id: input.variationId } };
    }),

  // Get generations
  getGenerations: protectedProcedure
    .input(getGenerationsSchema)
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
        prisma.imageGeneratorGeneration.findMany({
          where,
          include: {
            variations: {
              orderBy: {
                variationIndex: "asc",
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          skip: (input.page - 1) * input.limit,
          take: input.limit,
        }),
        prisma.imageGeneratorGeneration.count({ where }),
      ]);

      return {
        data: generations,
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
    .input(deleteGenerationSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      // Verify ownership
      const generation = await prisma.imageGeneratorGeneration.findFirst({
        where: {
          id: input.id,
          userId,
        },
      });

      if (!generation) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Generation not found" });
      }

      // Delete generation (variations will be cascade deleted)
      await prisma.imageGeneratorGeneration.delete({
        where: { id: input.id },
      });

      // Create activity log
      await prisma.imageGeneratorGenerationActivityLog.create({
        data: {
          id: randomUUID(),
          imageGeneratorGenerationId: input.id,
          userId,
          action: "DELETE",
          description: "Deleted generation",
          createdAt: new Date(),
        },
      });

      return { data: { id: input.id } };
    }),
});
