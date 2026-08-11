import { z } from "zod";

export const generateImagesArgsSchema = z
	.object({
		/** Single prompt used for every slot when `prompts` is omitted. */
		prompt: z.string().min(1).max(8000).optional(),
		/**
		 * Preferred for multi-image sets: one dedicated single-subject prompt per image.
		 * Length becomes the generation count when provided.
		 */
		prompts: z.array(z.string().min(1).max(4000)).min(1).max(8).optional(),
		count: z.number().int().min(1).max(8).default(1),
		aspect_ratio: z
			.enum(["1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"])
			.default("1:1"),
		intent: z
			.enum(["design", "photo", "draft", "logo", "mockup", "suite"])
			.default("photo"),
		reference_attachment_ids: z.array(z.string()).max(6).optional().default([]),
		title: z.string().max(200).optional(),
		/** Optional short labels shown in the UI per slot (same length as prompts when used). */
		titles: z.array(z.string().max(200)).max(8).optional(),
	})
	.superRefine((val, ctx) => {
		if (!val.prompt?.trim() && !(val.prompts && val.prompts.length > 0)) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "Provide prompt or prompts",
				path: ["prompt"],
			});
		}
	});

export type GenerateImagesArgs = z.infer<typeof generateImagesArgsSchema>;

/** Resolve per-slot prompts so multi-subject briefs do not all get the same collage prompt. */
export function resolveGenerateImageSlotPrompts(args: GenerateImagesArgs): {
	count: number;
	prompts: string[];
	titles: string[];
} {
	const fromList = (args.prompts ?? [])
		.map((p) => p.trim())
		.filter(Boolean)
		.slice(0, 8);
	if (fromList.length > 0) {
		const titles = fromList.map((p, i) => {
			const labeled = args.titles?.[i]?.trim();
			if (labeled) return labeled;
			const base = args.title?.trim();
			return fromList.length === 1
				? base || p.slice(0, 80)
				: `${base || "Image"} (${i + 1}/${fromList.length})`;
		});
		return { count: fromList.length, prompts: fromList, titles };
	}

	const shared = (args.prompt ?? "").trim();
	const count = Math.min(8, Math.max(1, args.count ?? 1));
	const titleBase = args.title?.trim() || shared.slice(0, 80);
	return {
		count,
		prompts: Array.from({ length: count }, () => shared),
		titles: Array.from({ length: count }, (_, i) =>
			count === 1 ? titleBase : `${titleBase} (${i + 1}/${count})`,
		),
	};
}

export const imagePresentationSlideSchema = z.object({
	prompt: z.string().min(1).max(4000),
	caption: z.string().max(200).optional(),
	notes: z.string().max(500).optional(),
	imageUrl: z.string().url().optional(),
});

export const createImagePresentationArgsSchema = z.object({
	title: z.string().min(1).max(200),
	slides: z.array(imagePresentationSlideSchema).min(1).max(20),
	aspect_ratio: z
		.enum(["1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"])
		.default("3:2"),
});

export type CreateImagePresentationArgs = z.infer<typeof createImagePresentationArgsSchema>;

/** Image edit schemas (Gemini-backed; Agent-parity surface). */
export const listZeepoAiImageEditHistorySchema = z.object({
	generationId: z.string(),
});

export const saveZeepoAiEditedImageSchema = z.object({
	sessionId: z.string(),
	generationId: z.string(),
	parentId: z.string().optional(),
	imageUrl: z.string().url(),
	operationType: z
		.enum([
			"original",
			"instruction",
			"style",
			"erase",
			"background_swap",
			"upscale",
			"text_edit",
			"variation",
		])
		.default("instruction"),
	label: z.string().max(120).optional(),
	prompt: z.string().max(1000).optional(),
	metadata: z.record(z.unknown()).optional(),
});

export const STYLE_PRESETS = [
	"watercolor",
	"oil_painting",
	"cinematic",
	"anime",
	"pixel_art",
	"neon",
	"pencil_sketch",
	"vintage",
] as const;

export const styleTransferSchema = z.object({
	sessionId: z.string(),
	generationId: z.string(),
	parentId: z.string().optional(),
	imageUrl: z.string().url(),
	style: z.enum(STYLE_PRESETS),
	customPrompt: z.string().max(500).optional(),
});

export const eraseObjectSchema = z.object({
	sessionId: z.string(),
	generationId: z.string(),
	parentId: z.string().optional(),
	imageUrl: z.string().url(),
	maskDataUrl: z.string().min(1),
});

export const BG_PRESETS = [
	"studio_white",
	"gradient_blue",
	"outdoor_park",
	"office_desk",
	"abstract_dark",
	"sunset_beach",
] as const;

export const swapBackgroundSchema = z.object({
	sessionId: z.string(),
	generationId: z.string(),
	parentId: z.string().optional(),
	imageUrl: z.string().url(),
	bgPrompt: z.string().min(1).max(500).trim(),
	bgPreset: z.enum(BG_PRESETS).optional(),
});

export const upscaleImageSchema = z.object({
	sessionId: z.string(),
	generationId: z.string(),
	parentId: z.string().optional(),
	imageUrl: z.string().url(),
});

export const editTextSchema = z.object({
	sessionId: z.string(),
	generationId: z.string(),
	parentId: z.string().optional(),
	imageUrl: z.string().url(),
	prompt: z.string().min(1).max(500).trim(),
});

export const generateVariationsSchema = z.object({
	sessionId: z.string(),
	generationId: z.string(),
	parentId: z.string().optional(),
	imageUrl: z.string().url(),
	prompt: z.string().max(500).optional(),
	count: z.number().int().min(1).max(3).default(3),
});

export const instructImageEditSchema = z.object({
	sessionId: z.string(),
	generationId: z.string().min(1),
	parentId: z.string().optional(),
	imageUrl: z.string().url(),
	prompt: z.string().min(1).max(1000).trim(),
	maskDataUrl: z.string().optional(),
});
