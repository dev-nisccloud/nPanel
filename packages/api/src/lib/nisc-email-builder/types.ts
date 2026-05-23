import { z } from "zod";

export const nebBriefSchema = z.object({
	companyName: z.string().optional(),
	productName: z.string().optional(),
	audience: z.string().optional(),
	goal: z.string().optional(),
	tone: z.string().optional(),
	emailType: z.string().optional(),
	instructions: z.string().optional(),
	brandColors: z.array(z.string()).optional(),
	ctaUrl: z.string().url().optional(),
	/** Optional — we fetch logo + colors from this URL when starting a build */
	websiteUrl: z.string().optional(),
	logoUrl: z.string().min(1).optional(),
	/** Markdown summary from web research (UI + agents). */
	companyContext: z.string().optional(),
	webSearchFound: z.boolean().optional(),
});

export type NebBrief = z.infer<typeof nebBriefSchema>;

const aspectRatios = ["1:1", "3:2", "16:9", "4:3", "9:16"] as const;

export const imageSlotSchema = z.object({
	key: z.string(),
	prompt: z.string(),
	alt: z.string(),
	aspectRatio: z
		.string()
		.optional()
		.transform((v) =>
			aspectRatios.includes(v as (typeof aspectRatios)[number])
				? (v as (typeof aspectRatios)[number])
				: "16:9",
		),
	imageSize: z
		.enum(["1K", "2K"])
		.optional()
		.transform((v) => v ?? "1K"),
});

export type NebImageSlot = z.infer<typeof imageSlotSchema>;

export const plannerOutputSchema = z.object({
	archetype: z.string(),
	subject: z.string(),
	preheader: z.string(),
	assistant_summary: z.string(),
	image_slots: z.array(imageSlotSchema).default([]),
	copy_strategy: z.string().optional(),
});

export type NebPlannerOutput = z.infer<typeof plannerOutputSchema>;

export const htmlArchitectOutputSchema = z.object({
	html: z.string(),
	change_summary: z.string(),
	assistant_text: z.string(),
});

export type NebHtmlArchitectOutput = z.infer<typeof htmlArchitectOutputSchema>;

export const revisionOutputSchema = z.object({
	html: z.string(),
	change_summary: z.string(),
	assistant_text: z.string(),
	image_slots: z.array(imageSlotSchema).optional(),
});

export type NebRevisionOutput = z.infer<typeof revisionOutputSchema>;

export type NebValidationReport = {
	ok: boolean;
	errors: string[];
	warnings: string[];
};

export const IMAGE_PLACEHOLDER_PREFIX = "{{NEB_IMG:";

export function imagePlaceholder(key: string): string {
	return `${IMAGE_PLACEHOLDER_PREFIX}${key}}}`;
}
