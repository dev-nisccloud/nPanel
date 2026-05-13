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

export const attachmentSchema = z.object({
	url: z.string().url(),
	name: z.string().max(200),
	mimeType: z.string().max(100),
});

export type Attachment = z.infer<typeof attachmentSchema>;

export const sendMessageSchema = z.object({
	sessionId: z.string(),
	content: z.string().min(1),
	/** When set, server applies skill-specific guidance for this turn and stores it on the user message. */
	skillId: z.string().optional(),
	/** Image/file attachments the user added to this message. Stored in metadata and surfaced to the model. */
	attachments: z.array(attachmentSchema).max(4).optional(),
});

export const getGenerationSchema = z.object({
	generationId: z.string(),
});

export const updateSessionTitleSchema = z.object({
	id: z.string(),
	title: z.string().min(1).max(150).trim(),
});

export const generateSessionTitleSchema = z.object({
	sessionId: z.string(),
});

export const imageEditSchema = z.object({
	/** Session the edit belongs to — used for auth only. */
	sessionId: z.string(),
	/** URL of the source image to edit. */
	imageUrl: z.string().url(),
	/** Plain-English instruction ("change the shirt colour to blue"). */
	prompt: z.string().min(1).max(1000).trim(),
	/**
	 * Base64 PNG data URL of the brush mask (white = edit region, black = preserve).
	 * When present → flux-fill-dev (inpainting). Absent → flux-kontext-dev (instruction edit).
	 */
	maskDataUrl: z.string().optional(),
});
