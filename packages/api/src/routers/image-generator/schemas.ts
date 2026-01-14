import { z } from "zod";

// Aspect ratio schema - Supported by Replicate nano-banana
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

// Output format schema (only PNG and JPG)
export const outputFormatSchema = z.enum(["png", "jpg"]);

// Resolution schema
export const resolutionSchema = z.enum(["1K", "2K", "4K"]);

// Generate image with variations schema
export const generateImageSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  referenceImageUrls: z.array(z.string().url()).max(14).optional().default([]),
  aspectRatio: aspectRatioSchema.default("4:3"),
  outputFormat: outputFormatSchema.default("png"),
  resolution: resolutionSchema.default("2K"),
  variations: z.number().int().min(1).max(10).default(2),
  teamId: z.string().optional(),
});

// Update variation after UploadThing upload
export const updateVariationAfterUploadSchema = z.object({
  variationId: z.string(),
  imageUrl: z.string().url(),
  imageKey: z.string(),
  imageFileName: z.string(),
  imageSize: z.number().int().positive(),
  imageMimeType: z.string(),
});

// Get generations schema
export const getGenerationsSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().default(20),
  teamId: z.string().optional(),
});

// Delete generation schema
export const deleteGenerationSchema = z.object({
  id: z.string(),
});
