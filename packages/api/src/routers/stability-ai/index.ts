import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../../trpc";

const aspectRatioSchema = z.enum([
  "21:9",
  "16:9",
  "3:2",
  "5:4",
  "1:1",
  "4:5",
  "2:3",
  "9:16",
  "9:21",
]);

const stylePresetSchema = z.enum([
  "3d-model",
  "analog-film",
  "anime",
  "cinematic",
  "comic-book",
  "digital-art",
  "enhance",
  "fantasy-art",
  "isometric",
  "line-art",
  "low-poly",
  "modeling-compound",
  "neon-punk",
  "origami",
  "photographic",
  "pixel-art",
  "tile-texture",
]);

const outputFormatSchema = z.enum(["webp", "jpeg", "png"]);

const modelTypeSchema = z.enum(["ultra", "core", "sd3"]);

const sd3ModelSchema = z.enum([
  "sd3.5-large",
  "sd3.5-large-turbo",
  "sd3.5-medium",
  "sd3.5-flash",
]);

// Generate image input schema
const generateImageInputSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  negativePrompt: z.string().optional().default(""),
  aspectRatio: aspectRatioSchema.default("1:1"),
  stylePreset: stylePresetSchema.optional(),
  seed: z.number().int().min(0).max(4294967295).optional().default(0),
  outputFormat: outputFormatSchema.default("png"),
  model: modelTypeSchema.default("core"),
  sd3Model: sd3ModelSchema.optional(), // Only used when model is "sd3"
});

export const stabilityAiRouter = router({
  /**
   * Generate an image using Stability AI
   */
  generate: protectedProcedure
    .input(generateImageInputSchema)
    .mutation(async ({ input }) => {
      const apiKey = process.env.STABILITY_AI_API_KEY;

      if (!apiKey) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Stability AI API key not configured",
        });
      }

      try {
        // Determine the endpoint based on model type
        let host: string;
        const params: Record<string, any> = {
          prompt: input.prompt,
          aspect_ratio: input.aspectRatio,
          output_format: input.outputFormat,
          seed: input.seed,
        };

        // Add negative prompt only if provided and model supports it
        if (input.negativePrompt) {
          if (input.model === "sd3") {
            // For SD3, check if the selected model supports negative prompts
            // SD3.5 Large Turbo and Flash don't support negative prompts
            if (
              input.sd3Model &&
              input.sd3Model !== "sd3.5-large-turbo" &&
              input.sd3Model !== "sd3.5-flash"
            ) {
              params.negative_prompt = input.negativePrompt;
            }
          } else {
            // Ultra and Core support negative prompts
            params.negative_prompt = input.negativePrompt;
          }
        }

        // Add style preset if provided
        if (input.stylePreset) {
          params.style_preset = input.stylePreset;
        }

        // Set endpoint and model-specific parameters
        switch (input.model) {
          case "ultra":
            host = "https://api.stability.ai/v2beta/stable-image/generate/ultra";
            break;
          case "core":
            host = "https://api.stability.ai/v2beta/stable-image/generate/core";
            break;
          case "sd3":
            host = "https://api.stability.ai/v2beta/stable-image/generate/sd3";
            params.model = input.sd3Model || "sd3.5-large";
            params.mode = "text-to-image";
            break;
          default:
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Invalid model type",
            });
        }

        // Make the request to Stability AI
        // Stability AI v2beta requires multipart/form-data
        // Use the global FormData (available in Node.js 18+)
        const formData = new (globalThis.FormData || FormData)();
        
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            // Convert all values to strings for FormData
            formData.append(key, String(value));
          }
        });

        // Log request for debugging
        const cleanParams: Record<string, any> = {};
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            cleanParams[key] = value;
          }
        });
        console.log("Stability AI Request:", {
          host,
          params: cleanParams,
        });

        const response = await fetch(host, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            Accept: "image/*",
            // Don't set Content-Type - fetch will set it with boundary for FormData
          },
          body: formData as any, // Type assertion for Node.js FormData compatibility
        });

        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage = `Stability AI API error: ${response.status}`;
          let errorDetails: any = {};
          
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.message || errorJson.error?.message || errorMessage;
            errorDetails = errorJson;
          } catch {
            // If parsing fails, use the text as is
            errorMessage = errorText || errorMessage;
          }

          // Log detailed error for debugging
          console.error("Stability AI API Error Details:", {
            status: response.status,
            statusText: response.statusText,
            url: host,
            params: cleanParams,
            errorResponse: errorDetails || errorText,
          });

          throw new TRPCError({
            code: response.status >= 400 && response.status < 500 ? "BAD_REQUEST" : "INTERNAL_SERVER_ERROR",
            message: errorMessage,
          });
        }

        // Check for NSFW classification
        const finishReason = response.headers.get("finish-reason");
        if (finishReason === "CONTENT_FILTERED") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Generation failed NSFW classifier",
          });
        }

        // Get the image data
        const imageBuffer = await response.arrayBuffer();
        const imageBase64 = Buffer.from(imageBuffer).toString("base64");

        // Get seed from response headers
        const seed = response.headers.get("seed");

        return {
          image: imageBase64,
          mimeType: `image/${input.outputFormat}`,
          seed: seed ? parseInt(seed, 10) : input.seed,
          finishReason: finishReason || "SUCCESS",
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        console.error("Stability AI generation error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to generate image",
        });
      }
    }),
});

