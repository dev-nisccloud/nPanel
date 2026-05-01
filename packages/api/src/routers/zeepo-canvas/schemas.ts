import { z } from "zod";

export const zeepoCanvasProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  userId: z.string(),
  teamId: z.string().nullable(),
  canvasJson: z.any(),
  width: z.number(),
  height: z.number(),
  thumbnailUrl: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createProjectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  teamId: z.string().optional(),
  canvasJson: z.any().optional(),
  width: z.number().default(1200),
  height: z.number().default(800),
});

export const getProjectSchema = z.object({
  id: z.string(),
});

export const getProjectsSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  teamId: z.string().optional(),
});

export const updateProjectSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  canvasJson: z.any().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  thumbnailUrl: z.string().nullable().optional(),
});

export const deleteProjectSchema = z.object({
  id: z.string(),
});

export const duplicateProjectSchema = z.object({
  id: z.string(),
});

// AI Generation schemas
export const startGenerationSchema = z.object({
  projectId: z.string(),
  nodeId: z.string(),
  teamId: z.string().optional(),
  
  modelCategory: z.string(), // 'text', 'image', 'video', 'audio', etc.
  modelId: z.string(),
  
  prompt: z.string().optional(),
  inputs: z.any().optional(), // e.g., { image: url } or other Replicate params
});

export const getGenerationSchema = z.object({
  generationId: z.string(),
});

export const getGenerationsByNodeSchema = z.object({
  projectId: z.string(),
  nodeId: z.string(),
});
