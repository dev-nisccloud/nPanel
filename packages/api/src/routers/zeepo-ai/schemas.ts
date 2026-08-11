import { z } from "zod";

export const createSessionSchema = z.object({
	title: z.string().optional(),
	teamId: z.string().optional(),
});

export const listSessionsSchema = z.object({
	page: z.number().int().min(1).default(1),
	limit: z.number().int().min(1).max(50).default(20),
	teamId: z.string().optional(),
});

export const listLibrarySchema = z.object({
	page: z.number().int().min(1).default(1),
	limit: z.number().int().min(1).max(100).default(50),
	teamId: z.string().optional(),
	kind: z.enum(["image", "document", "presentation", "all"]).optional().default("all"),
});

export const getSessionSchema = z.object({
	id: z.string(),
});

export const deleteSessionSchema = z.object({
	id: z.string(),
});

export const updateSessionTitleSchema = z.object({
	id: z.string(),
	title: z.string().min(1).max(150).trim(),
});

export const messageFeedbackSchema = z.object({
	messageId: z.string(),
	feedback: z.enum(["like", "dislike", "clear"]),
});

export const registerAttachmentSchema = z.object({
	sessionId: z.string(),
	url: z.string().url(),
	name: z.string().min(1).max(200),
	mimeType: z
		.string()
		.min(1)
		.max(100)
		.refine((v) => v.toLowerCase().startsWith("image/"), {
			message: "Only image attachments are supported",
		}),
	storageKey: z.string().max(512).optional(),
	sizeBytes: z.number().int().positive().optional(),
});

export const streamTurnBodySchema = z.object({
	sessionId: z.string(),
	content: z.string().min(1).max(100_000),
	teamId: z.string().optional(),
	skillId: z.string().optional(),
	searchEnabled: z.boolean().optional().default(false),
	attachmentIds: z.array(z.string()).max(4).optional().default([]),
	modelId: z.string().optional(),
	/** Retry/edit: hard-delete this user message and everything after it before the new turn. */
	replaceFromUserMessageId: z.string().optional(),
});

export const listBillingActivitySchema = z.object({
	teamId: z.string(),
	limit: z.number().int().min(1).max(100).optional(),
});

export const getBalanceSchema = z.object({
	teamId: z.string().optional(),
});
