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
});

export const removeBgSchema = z.object({
  image: z.string(),
});








