import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../../trpc";
import Replicate from "replicate";
import prisma from "@nPanel/db";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import {
  generateImageSchema,
  removeBgSchema,
  generateImageResponseSchema,
  updateGenerationAfterUploadResponseSchema,
  removeBgResponseSchema,
} from "./schemas";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

/** Replicate model: 851-labs/background-remover (InSPyReNet). Input: image (URL). Output: URI string. */
const BACKGROUND_REMOVER_MODEL =
  "851-labs/background-remover:a029dff38972b5fda4ec5d75d7d1cd25aeff621d2cf4946a41055d7db66b80bc";

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
 * Download image from URL and upload to UploadThing
 * This is a helper function to store generated images
 */
async function uploadImageToUploadThing(
  imageUrl: string,
  fileName: string = "generated-image.png"
): Promise<{ url: string; key: string; size: number; type: string }> {
  // Download the image
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const contentType = response.headers.get("content-type") || "image/png";

  // Upload to UploadThing via API
  // Note: This requires a server-side upload endpoint or we handle it client-side
  // For now, we'll return the Replicate URL and handle UploadThing upload client-side
  // This is a placeholder - you may want to implement server-side UploadThing upload
  return {
    url: imageUrl, // Return original URL for now
    key: "", // Will be set when uploaded to UploadThing
    size: buffer.length,
    type: contentType,
  };
}

export const imageGenAiRouter = router({
  // Generate an image from a prompt with optional reference images
  generateImage: protectedProcedure
    .input(generateImageSchema)
    .output(generateImageResponseSchema)
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
          prompt: input.prompt,
          resolution: "2K",
          image_input: input.referenceImageUrls || [],
          aspect_ratio: "4:3",
          output_format: "png",
          safety_filter_level: "block_only_high",
        };

        // Run Replicate prediction with timeout (5 minutes for image generation)
        const output = await runReplicateWithTimeout(
          "google/nano-banana-pro",
          replicateInput,
          300000
        );

        // Handle different output formats
        // Sometimes output is a string (URL), sometimes an array of URLs
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

        // Download and get image metadata
        const imageData = await uploadImageToUploadThing(generatedImageUrl);

        // Save generation to database
        // Note: We'll upload to UploadThing client-side and update the record
        // For now, we save with the Replicate URL
        const generation = await prisma.imageGenAiGeneration.create({
          data: {
            id: randomUUID(),
            userId,
            teamId: input.teamId ?? null,
            prompt: input.prompt,
            referenceImageUrls: input.referenceImageUrls && input.referenceImageUrls.length > 0 
              ? input.referenceImageUrls 
              : undefined,
            imageUrl: generatedImageUrl, // Will be updated after UploadThing upload
            imageKey: "", // Will be set after UploadThing upload
            imageFileName: `ai-generated-${Date.now()}.png`,
            imageSize: imageData.size,
            imageMimeType: imageData.type,
            imageMetadata: {
              model: "google/nano-banana-pro",
              resolution: "2K",
              aspectRatio: "4:3",
              outputFormat: "png",
            },
            modelId: "google/nano-banana-pro",
            modelName: "Nano Banana Pro",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });

        // Create activity log
        await prisma.imageGenAiGenerationActivityLog.create({
          data: {
            id: randomUUID(),
            imageGenAiGenerationId: generation.id,
            userId,
            action: "GENERATE",
            description: `Generated image with prompt: ${input.prompt.substring(0, 100)}${input.prompt.length > 100 ? "..." : ""}`,
            metadata: {
              prompt: input.prompt,
              referenceImageCount: input.referenceImageUrls?.length || 0,
              model: "google/nano-banana-pro",
            },
            ipAddress,
            userAgent,
            createdAt: new Date(),
          },
        });

        return {
          data: generatedImageUrl,
          generationId: generation.id, // Return ID so client can update after UploadThing upload
        };
      } catch (error) {
        console.error("Error generating image:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to generate image",
        });
      }
    }),

  // Update generation after UploadThing upload
  updateGenerationAfterUpload: protectedProcedure
    .input(
      z.object({
        generationId: z.string(),
        imageUrl: z.string().url(),
        imageKey: z.string(),
        imageFileName: z.string(),
        imageSize: z.number().int().positive(),
        imageMimeType: z.string(),
      })
    )
    .output(updateGenerationAfterUploadResponseSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      // Verify ownership
      const generation = await prisma.imageGenAiGeneration.findFirst({
        where: {
          id: input.generationId,
          userId,
        },
      });

      if (!generation) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Generation not found" });
      }

      // Update with UploadThing data
      await prisma.imageGenAiGeneration.update({
        where: { id: input.generationId },
        data: {
          imageUrl: input.imageUrl,
          imageKey: input.imageKey,
          imageFileName: input.imageFileName,
          imageSize: input.imageSize,
          imageMimeType: input.imageMimeType,
          updatedAt: new Date(),
        },
      });

      return { data: { id: input.generationId } };
    }),

  // Remove background from an image (851-labs/background-remover)
  removeBg: protectedProcedure
    .input(removeBgSchema)
    .output(removeBgResponseSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      try {
        const replicateInput = { image: input.image };
        const output = await replicate.run(
          BACKGROUND_REMOVER_MODEL as `${string}/${string}`,
          { input: replicateInput }
        );

        let url: string;
        if (typeof output === "string") {
          url = output;
        } else if (Array.isArray(output) && output.length > 0) {
          url = output[0] as string;
        } else if (output && typeof output === "object" && "url" in output) {
          const u = (output as { url?: string }).url;
          url = typeof u === "string" ? u : String(u);
        } else if (output && typeof output === "object" && typeof (output as { url?: () => string }).url === "function") {
          url = (output as { url: () => string }).url();
        } else {
          throw new Error(`Unexpected output from Replicate: ${JSON.stringify(output)}`);
        }
        return { data: url };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to remove background",
        });
      }
    }),
});








