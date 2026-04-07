import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../../trpc";
import { fetch } from "undici";
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
            let host;
            const params = {
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
                    if (input.sd3Model &&
                        input.sd3Model !== "sd3.5-large-turbo" &&
                        input.sd3Model !== "sd3.5-flash") {
                        params.negative_prompt = input.negativePrompt;
                    }
                }
                else {
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
            // Use form-data package for proper multipart/form-data handling
            const FormDataClass = (await import("form-data")).default;
            const formData = new FormDataClass();
            // Append all parameters to form data
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== "") {
                    // Convert all values to strings for FormData
                    formData.append(key, String(value));
                }
            });
            // Get headers from form-data (includes Content-Type with boundary)
            const formHeaders = formData.getHeaders();
            // Log request for debugging
            const cleanParams = {};
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== "") {
                    cleanParams[key] = value;
                }
            });
            console.log("Stability AI Request:", {
                host,
                params: cleanParams,
                contentType: formHeaders["content-type"],
            });
            // Convert form-data to buffer - we must buffer it to ensure boundary is included
            const formDataBuffer = await new Promise((resolve, reject) => {
                const chunks = [];
                formData.on("data", (chunk) => {
                    // Ensure chunk is always a Buffer
                    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
                });
                formData.on("end", () => {
                    resolve(Buffer.concat(chunks));
                });
                formData.on("error", reject);
                // Important: form-data streams need to be resumed to start flowing
                formData.resume();
            });
            console.log("Form data buffered, size:", formDataBuffer.length);
            // Use undici fetch with the buffered form data
            const response = await fetch(host, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    Accept: "image/*",
                    ...formHeaders, // Include Content-Type with boundary from form-data
                },
                body: formDataBuffer,
            });
            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = `Stability AI API error: ${response.status}`;
                let errorDetails = {};
                try {
                    const errorJson = JSON.parse(errorText);
                    errorMessage = errorJson.message || errorJson.error?.message || errorMessage;
                    errorDetails = errorJson;
                }
                catch {
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
        }
        catch (error) {
            if (error instanceof TRPCError) {
                throw error;
            }
            console.error("Stability AI generation error:", error);
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: error instanceof Error
                    ? error.message
                    : "Failed to generate image",
            });
        }
    }),
    /**
     * Remove background from an image using Stability AI
     */
    removeBackground: protectedProcedure
        .input(z.object({
        image: z.string(), // Base64 encoded image
        outputFormat: z.enum(["webp", "jpeg", "png"]).default("png"),
    }))
        .mutation(async ({ input }) => {
        const apiKey = process.env.STABILITY_AI_API_KEY;
        if (!apiKey) {
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Stability AI API key not configured",
            });
        }
        try {
            const host = "https://api.stability.ai/v2beta/stable-image/edit/remove-background";
            // Convert base64 to buffer
            const imageBuffer = Buffer.from(input.image, "base64");
            // Detect image type from buffer (check magic bytes)
            let imageType = "image/png";
            let imageExtension = "png";
            if (imageBuffer[0] === 0xFF && imageBuffer[1] === 0xD8) {
                imageType = "image/jpeg";
                imageExtension = "jpg";
            }
            else if (imageBuffer[0] === 0x89 && imageBuffer[1] === 0x50) {
                imageType = "image/png";
                imageExtension = "png";
            }
            else if (imageBuffer[0] === 0x52 && imageBuffer[1] === 0x49) {
                imageType = "image/webp";
                imageExtension = "webp";
            }
            // Use form-data package for proper multipart/form-data file uploads
            const FormDataClass = (await import("form-data")).default;
            const formData = new FormDataClass();
            // Append image buffer as a file with detected content type
            formData.append("image", imageBuffer, {
                filename: `image.${imageExtension}`,
                contentType: imageType,
            });
            formData.append("output_format", input.outputFormat);
            // Get headers from form-data (includes Content-Type with boundary)
            const formHeaders = formData.getHeaders();
            // Log request for debugging
            console.log("Stability AI Remove Background Request:", {
                host,
                outputFormat: input.outputFormat,
                imageSize: imageBuffer.length,
                contentType: formHeaders["content-type"],
            });
            // Convert form-data to buffer - we must buffer it to ensure boundary is included
            const formDataBuffer = await new Promise((resolve, reject) => {
                const chunks = [];
                formData.on("data", (chunk) => {
                    // Ensure chunk is always a Buffer
                    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
                });
                formData.on("end", () => {
                    resolve(Buffer.concat(chunks));
                });
                formData.on("error", reject);
                // Important: form-data streams need to be resumed to start flowing
                formData.resume();
            });
            console.log("Form data buffered, size:", formDataBuffer.length);
            // Use undici fetch with the buffered form data
            const response = await fetch(host, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    Accept: "image/*",
                    ...formHeaders, // Include Content-Type with boundary from form-data
                },
                body: formDataBuffer,
            });
            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = `Stability AI API error: ${response.status}`;
                let errorDetails = {};
                try {
                    const errorJson = JSON.parse(errorText);
                    errorMessage = errorJson.message || errorJson.error?.message || errorJson.name || errorMessage;
                    errorDetails = errorJson;
                }
                catch {
                    errorMessage = errorText || errorMessage;
                    errorDetails = { raw: errorText };
                }
                console.error("Stability AI remove background error:", {
                    status: response.status,
                    statusText: response.statusText,
                    url: host,
                    outputFormat: input.outputFormat,
                    imageSize: imageBuffer.length,
                    errorMessage,
                    errorDetails,
                    errorText,
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
                    message: "Processing failed NSFW classifier",
                });
            }
            // Get the processed image
            const imageBufferResult = await response.arrayBuffer();
            const imageBase64 = Buffer.from(imageBufferResult).toString("base64");
            const seed = response.headers.get("seed");
            return {
                image: imageBase64,
                mimeType: `image/${input.outputFormat}`,
                seed: seed ? parseInt(seed, 10) : null,
                finishReason: finishReason || "SUCCESS",
            };
        }
        catch (error) {
            if (error instanceof TRPCError) {
                throw error;
            }
            console.error("Stability AI remove background error:", error);
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: error instanceof Error
                    ? error.message
                    : "Failed to remove background",
            });
        }
    }),
});
