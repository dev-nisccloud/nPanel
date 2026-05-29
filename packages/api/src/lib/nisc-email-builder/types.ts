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
	kind: z.enum(["photo", "icon", "hero"]).optional().default("photo"),
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
	/**
	 * Hex background of the email section behind this icon (metadata only).
	 * Server maps this to a plain-language fill for image gen — never put this hex in `prompt`.
	 */
	backgroundColor: z.string().optional(),
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

/** Output schema for the direct build path (template-guided, no vision spec). */
export const directBuildOutputSchema = z.object({
	html: z.string(),
	change_summary: z.string(),
	assistant_text: z.string(),
	subject: z.string().optional(),
	preheader: z.string().optional(),
	image_slots: z.array(imageSlotSchema).optional().default([]),
});

export type NebDirectBuildOutput = z.infer<typeof directBuildOutputSchema>;

const compSectionElementSchema = z.object({
	kind: z.string(),
	text: z.string().optional(),
	color: z.string().optional(),
	fontSizePx: z.number().optional(),
	fontWeight: z.string().optional(),
	alignment: z.string().optional(),
	imageKey: z.string().optional(),
	iconHtml: z.string().optional(),
});

const compSectionSchema = z.object({
	id: z.string(),
	order: z.number(),
	type: z.string(),
	backgroundColor: z.string().optional(),
	textColor: z.string().optional(),
	paddingTopPx: z.number().optional(),
	paddingBottomPx: z.number().optional(),
	elements: z.array(compSectionElementSchema).default([]),
});

export const compAnalysisOutputSchema = z.object({
	analysis_thinking: z.string().optional(),
	layout_blueprint: z.string(),
	exact_copy: z.object({
		subject: z.string(),
		preheader: z.string(),
		headlines: z.array(z.string()).default([]),
		subheadlines: z.array(z.string()).default([]),
		bodyParagraphs: z.array(z.string()).default([]),
		ctaLabels: z.array(z.string()).default([]),
		footerText: z.string().optional(),
	}),
	colors: z
		.object({
			pageBackground: z.string().optional(),
			sectionBackgrounds: z
				.array(z.object({ section: z.string(), color: z.string() }))
				.optional(),
			primaryText: z.string().optional(),
			secondaryText: z.string().optional(),
			accent: z.string().optional(),
			ctaBackground: z.string().optional(),
			ctaText: z.string().optional(),
		})
		.optional(),
	typography: z.string().optional(),
	sections: z.array(compSectionSchema).default([]),
	image_slots: z.array(imageSlotSchema).default([]),
	icons: z
		.array(
			z.object({
				key: z.string(),
				description: z.string(),
				htmlHint: z.string(),
				sectionId: z.string().optional(),
			}),
		)
		.default([]),
	fidelity_checklist: z.array(z.string()).default([]),
});

export type NebCompAnalysisOutput = z.infer<typeof compAnalysisOutputSchema>;

export type NebValidationReport = {
	ok: boolean;
	errors: string[];
	warnings: string[];
};

export const IMAGE_PLACEHOLDER_PREFIX = "{{NEB_IMG:";

export function imagePlaceholder(key: string): string {
	return `${IMAGE_PLACEHOLDER_PREFIX}${key}}}`;
}
