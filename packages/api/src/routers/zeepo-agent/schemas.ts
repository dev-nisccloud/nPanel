import { z } from "zod";

export const zeepoAgentModelCategorySchema = z.enum([
	"text",
	"image",
	"video",
	"audio",
	"background-remover",
]);

export const createSessionSchema = z.object({
	title: z.string().optional(),
	teamId: z.string().optional(),
});

export const listSessionsSchema = z.object({
	page: z.number().int().min(1).default(1),
	limit: z.number().int().min(1).max(50).default(20),
	teamId: z.string().optional(),
});

export const getSessionSchema = z.object({
	id: z.string(),
});

export const deleteSessionSchema = z.object({
	id: z.string(),
});

export const sendMessageSchema = z.object({
	sessionId: z.string(),
	content: z.string().min(1),
	/** When set, server applies skill-specific guidance for this turn and stores it on the user message. */
	skillId: z.string().optional(),
});

export const getGenerationSchema = z.object({
	generationId: z.string(),
});
