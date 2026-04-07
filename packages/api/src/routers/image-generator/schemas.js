import { z } from "zod";
// =============================================================================
// API layer only – independent from DB. Enums and shapes for input/output.
// =============================================================================
// --- Enums (API layer) ---
export const generationStatusSchema = z.enum([
    "QUEUED",
    "PROCESSING",
    "COMPLETED",
    "FAILED",
]);
export const variationStatusSchema = z.enum([
    "PROCESSING",
    "COMPLETED",
    "FAILED",
]);
// --- Input: aspect ratio, format, resolution ---
export const aspectRatioSchema = z.enum([
    "1:1",
    "2:3",
    "3:2",
    "3:4",
    "4:3",
    "4:5",
    "5:4",
    "9:16",
    "16:9",
    "21:9",
]);
export const outputFormatSchema = z.enum(["png", "jpg"]);
export const resolutionSchema = z.enum(["1K", "2K", "4K"]);
// --- Input: start generation (fire-and-forget, enqueued to QStash) ---
export const startGenerationSchema = z.object({
    prompt: z.string().min(1, "Prompt is required"),
    referenceImageUrls: z.array(z.string().url()).max(14).optional().default([]),
    aspectRatio: aspectRatioSchema.default("4:3"),
    outputFormat: outputFormatSchema.default("png"),
    resolution: resolutionSchema.default("2K"),
    variations: z.number().int().min(1).max(10).default(1),
    teamId: z.string().optional(),
});
// --- Output: start generation response ---
export const startGenerationResponseSchema = z.object({
    generationId: z.string(),
    status: generationStatusSchema,
    variationsCount: z.number().int(),
});
// --- Input: get generation by id ---
export const getGenerationByIdSchema = z.object({
    id: z.string(),
});
// --- Input: get generations ---
export const getGenerationsSchema = z.object({
    page: z.number().int().positive().default(1),
    limit: z.number().int().positive().default(20),
    teamId: z.string().optional(),
});
// --- Output: variation (API response shape) ---
export const imageGeneratorVariationSchema = z.object({
    id: z.string(),
    imageGeneratorGenerationId: z.string(),
    variationIndex: z.number().int(),
    status: variationStatusSchema,
    errorMessage: z.string().nullable(),
    imageUrl: z.string().url().nullable(),
    imageKey: z.string().nullable(),
    imageFileName: z.string().nullable(),
    imageSize: z.number().int().nullable(),
    imageMimeType: z.string().nullable(),
    imageMetadata: z.record(z.string(), z.any()).nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
});
// --- Output: generation (API response shape) ---
export const imageGeneratorGenerationSchema = z.object({
    id: z.string(),
    userId: z.string(),
    teamId: z.string().nullable(),
    prompt: z.string(),
    referenceImageUrls: z.array(z.string().url()).nullable(),
    aspectRatio: z.string(),
    outputFormat: z.string(),
    resolution: z.string(),
    variationsCount: z.number().int(),
    modelId: z.string(),
    modelName: z.string().nullable(),
    status: generationStatusSchema,
    errorMessage: z.string().nullable(),
    qstashMessageId: z.string().nullable(),
    startedAt: z.date().nullable(),
    completedAt: z.date().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
    variations: z.array(imageGeneratorVariationSchema),
});
export const getGenerationsResponseSchema = z.object({
    data: z.array(imageGeneratorGenerationSchema),
    pagination: z.object({
        page: z.number().int(),
        limit: z.number().int(),
        total: z.number().int(),
        totalPages: z.number().int(),
    }),
});
// --- Input: delete generation ---
export const deleteGenerationSchema = z.object({
    id: z.string(),
});
// --- Legacy: update variation after upload (worker updates DB directly; kept for backward compat) ---
export const updateVariationAfterUploadSchema = z.object({
    variationId: z.string(),
    imageUrl: z.string().url(),
    imageKey: z.string(),
    imageFileName: z.string(),
    imageSize: z.number().int().positive(),
    imageMimeType: z.string(),
});
// --- Legacy: synchronous generate (deprecated in favor of startGeneration) ---
export const generateImageSchema = z.object({
    prompt: z.string().min(1, "Prompt is required"),
    referenceImageUrls: z.array(z.string().url()).max(14).optional().default([]),
    aspectRatio: aspectRatioSchema.default("4:3"),
    outputFormat: outputFormatSchema.default("png"),
    resolution: resolutionSchema.default("2K"),
    variations: z.number().int().min(1).max(10).default(1),
    teamId: z.string().optional(),
});
