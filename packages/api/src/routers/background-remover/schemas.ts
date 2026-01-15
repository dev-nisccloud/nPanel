import { z } from "zod";

// Remove background schema
export const removeBackgroundSchema = z.object({
  image: z.string(), // Image URL or base64
  teamId: z.string().optional(),
});

// Update generation after UploadThing upload schema
export const updateBackgroundRemovalAfterUploadSchema = z.object({
  generationId: z.string(),
  originalImageUrl: z.string().url(),
  originalImageKey: z.string(),
  originalImageFileName: z.string(),
  originalImageSize: z.number().int().positive(),
  originalImageMimeType: z.string(),
  processedImageUrl: z.string().url(),
  processedImageKey: z.string(),
  processedImageFileName: z.string(),
  processedImageSize: z.number().int().positive(),
  processedImageMimeType: z.string(),
});

// Get generations schema
export const getBackgroundRemovalsSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().default(20),
  teamId: z.string().optional(),
});

// Delete generation schema
export const deleteBackgroundRemovalSchema = z.object({
  id: z.string(),
});

// Response schemas for parsing DB data
export const backgroundRemoverGenerationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  teamId: z.string().nullable(),
  originalImageUrl: z.string().url(),
  originalImageKey: z.string(),
  originalImageFileName: z.string(),
  originalImageSize: z.number().int(),
  originalImageMimeType: z.string(),
  originalImageMetadata: z.record(z.string(), z.any()).nullable(),
  processedImageUrl: z.string().url(),
  processedImageKey: z.string(),
  processedImageFileName: z.string(),
  processedImageSize: z.number().int(),
  processedImageMimeType: z.string(),
  processedImageMetadata: z.record(z.string(), z.any()).nullable(),
  modelId: z.string(),
  modelName: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const getBackgroundRemovalsResponseSchema = z.object({
  data: z.array(backgroundRemoverGenerationSchema),
  pagination: z.object({
    page: z.number().int(),
    limit: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
  }),
});

export const removeBackgroundResponseSchema = z.object({
  data: z.string().url(), // Processed image URL from Replicate
  generationId: z.string(), // ID for updating after UploadThing upload
});

export const updateBackgroundRemovalAfterUploadResponseSchema = z.object({
  data: z.object({
    id: z.string(),
  }),
});
