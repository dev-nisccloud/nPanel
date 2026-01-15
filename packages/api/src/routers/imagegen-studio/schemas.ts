import { z } from "zod";

// Project schemas
export const createProjectSchema = z.object({
  name: z.string().min(1),
  json: z.string(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  teamId: z.string().optional(),
});

export const updateProjectSchema = z.object({
  id: z.string(),
  name: z.string().min(1).optional(),
  json: z.string().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  thumbnailUrl: z.string().optional(),
});

export const getProjectSchema = z.object({
  id: z.string(),
});

export const getProjectsSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().default(10),
  teamId: z.string().optional(),
});

export const deleteProjectSchema = z.object({
  id: z.string(),
});

export const duplicateProjectSchema = z.object({
  id: z.string(),
});

// Template schemas
export const createTemplateSchema = z.object({
  name: z.string().min(1),
  json: z.string(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  isPublic: z.boolean().default(true),
});

export const updateTemplateSchema = z.object({
  id: z.string(),
  name: z.string().min(1).optional(),
  json: z.string().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  thumbnailUrl: z.string().optional(),
  isPublic: z.boolean().optional(),
});

export const getTemplateSchema = z.object({
  id: z.string(),
});

export const getTemplatesSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().default(10),
});

export const deleteTemplateSchema = z.object({
  id: z.string(),
});

// AI schemas
export const generateImageSchema = z.object({
  prompt: z.string().min(1),
  referenceImageUrls: z.array(z.string().url()).max(14).optional().default([]),
  teamId: z.string().optional(),
});

export const removeBgSchema = z.object({
  image: z.string(),
});

// AI Generation schemas
export const getAiGenerationsSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().default(20),
  teamId: z.string().optional(),
});

export const deleteAiGenerationSchema = z.object({
  id: z.string(),
});

// Upload schemas
export const createUploadSchema = z.object({
  fileUrl: z.string().url(),
  fileKey: z.string(),
  fileName: z.string().min(1),
  fileSize: z.number().int().positive(),
  mimeType: z.string().refine((val) => val.startsWith("image/"), {
    message: "Only image files are allowed",
  }),
  fileMetadata: z.record(z.string(), z.any()).optional(),
  teamId: z.string().optional(),
});

export const getUploadsSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().default(20),
  teamId: z.string().optional(),
});

export const deleteUploadSchema = z.object({
  id: z.string(),
});

// Images schemas
export const getImagesSchema = z.object({
  page: z.number().int().positive().default(1),
  perPage: z.number().int().positive().max(30).default(20),
  query: z.string().optional(),
});

// Response schemas for parsing DB data
export const imageGenAiGenerationSchema = z.object({
  id: z.string(),
  prompt: z.string(),
  referenceImageUrls: z.array(z.string().url()),
  imageUrl: z.string().url(),
  imageFileName: z.string(),
  imageSize: z.number().int(),
  imageMimeType: z.string(),
  imageMetadata: z.record(z.string(), z.any()).nullable(),
  modelId: z.string(),
  modelName: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const getAiGenerationsResponseSchema = z.object({
  data: z.array(imageGenAiGenerationSchema),
  nextPage: z.number().int().nullable(),
});

export const imageGenUploadSchema = z.object({
  id: z.string(),
  fileUrl: z.string().url(),
  fileName: z.string(),
  fileSize: z.number().int(),
  mimeType: z.string(),
  fileMetadata: z.record(z.string(), z.any()).nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const getUploadsResponseSchema = z.object({
  data: z.array(imageGenUploadSchema),
  nextPage: z.number().int().nullable(),
});

// AI Generation response schemas
export const generateImageResponseSchema = z.object({
  data: z.string().url(), // Generated image URL from Replicate
  generationId: z.string(), // ID for updating after UploadThing upload
});

export const updateGenerationAfterUploadResponseSchema = z.object({
  data: z.object({
    id: z.string(),
  }),
});

export const removeBgResponseSchema = z.object({
  data: z.string().url(), // Image URL with background removed
});








