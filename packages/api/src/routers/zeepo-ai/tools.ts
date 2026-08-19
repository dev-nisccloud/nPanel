import { z } from "zod";

export const createDocumentArgsSchema = z.object({
	title: z.string().min(1).max(200),
	content: z.string().min(1).max(80000),
});

export type CreateDocumentArgs = z.infer<typeof createDocumentArgsSchema>;

export const presentationSlideSchema = z.object({
	layout: z
		.enum([
			"title",
			"content",
			"bullets",
			"image-full",
			"two-column",
			"quote",
			"section-break",
			"stats",
			"chart",
			"timeline",
			"big-number",
		])
		.default("content"),
	title: z.string().max(200).optional(),
	subtitle: z.string().max(300).optional(),
	body: z.string().max(2000).optional(),
	bullets: z.array(z.string().max(300)).max(7).optional(),
	leftContent: z.string().max(1000).optional(),
	rightContent: z.string().max(1000).optional(),
	imageUrl: z.string().url().optional(),
	imagePosition: z.enum(["background", "right", "left"]).optional(),
	bgColor: z.string().max(20).optional(),
	textColor: z.string().max(20).optional(),
	notes: z.string().max(500).optional(),
});

export const createPresentationArgsSchema = z.object({
	title: z.string().min(1).max(200),
	theme: z.enum(["dark", "light", "branded", "minimal"]).default("light"),
	slides: z.array(presentationSlideSchema).min(1).max(40),
});

export type CreatePresentationArgs = z.infer<typeof createPresentationArgsSchema>;

export {
	generateImagesArgsSchema,
	createImagePresentationArgsSchema,
	type GenerateImagesArgs,
	type CreateImagePresentationArgs,
} from "./image-schemas";

export const clarifyingQuestionSchema = z.object({
	question: z.string().min(1).max(300),
	options: z.array(z.string().min(1).max(120)).min(2).max(5),
	allow_upload: z.boolean().optional().default(false),
});

export const askClarifyingQuestionsArgsSchema = z.object({
	intro: z
		.string()
		.max(400)
		.optional()
		.describe("Short intro shown above the questions (1 sentence)."),
	questions: z.array(clarifyingQuestionSchema).min(1).max(3),
});

export type AskClarifyingQuestionsArgs = z.infer<typeof askClarifyingQuestionsArgsSchema>;
export type ClarifyingQuestion = z.infer<typeof clarifyingQuestionSchema>;

/** Anthropic client tools for Zeepo AI (documents + presentations + clarifying questions). */
export const ZEEPO_AI_CLIENT_TOOLS = [
	{
		name: "ask_clarifying_questions",
		description:
			"Ask the user 1–3 sharp clarifying questions with option chips before producing a deliverable. Use ONLY when context is missing. Do NOT call create_document or create_presentation in the same turn. Do NOT include an 'Other' option  the UI adds it.",
		input_schema: {
			type: "object" as const,
			properties: {
				intro: {
					type: "string",
					description: "Brief intro, e.g. Before I build this out, I have a couple of quick questions.",
				},
				questions: {
					type: "array",
					minItems: 1,
					maxItems: 3,
					items: {
						type: "object",
						properties: {
							question: { type: "string" },
							options: {
								type: "array",
								minItems: 2,
								maxItems: 5,
								items: { type: "string" },
							},
							allow_upload: {
								type: "boolean",
								description: "True when the answer could be a file/image upload",
							},
						},
						required: ["question", "options"],
					},
				},
			},
			required: ["questions"],
		},
	},
	{
		name: "create_document",
		description:
			"Create a long-form markdown document (report, brief, strategy, analysis). Put the COMPLETE markdown in content  do not truncate.",
		input_schema: {
			type: "object" as const,
			properties: {
				title: { type: "string", description: "Document title" },
				content: {
					type: "string",
					description: "Full markdown body of the document",
				},
			},
			required: ["title", "content"],
		},
	},
	{
		name: "create_presentation",
		description:
			"Create a structured text slide deck (title, content, bullets, stats). For photorealistic / full-bleed image decks use create_image_presentation instead.",
		input_schema: {
			type: "object" as const,
			properties: {
				title: { type: "string" },
				theme: {
					type: "string",
					enum: ["dark", "light", "branded", "minimal"],
				},
				slides: {
					type: "array",
					items: {
						type: "object",
						properties: {
							layout: { type: "string" },
							title: { type: "string" },
							subtitle: { type: "string" },
							body: { type: "string" },
							bullets: { type: "array", items: { type: "string" } },
							leftContent: { type: "string" },
							rightContent: { type: "string" },
							notes: { type: "string" },
						},
					},
				},
			},
			required: ["title", "slides"],
		},
	},
	{
		name: "generate_images",
		description:
			"Generate 1–8 images with the Zeepo design engine. Use for logos, brand assets, photos, mockups, ads, drafts. For N DISTINCT subjects (e.g. 6 products), pass prompts as an array of N single-subject prompts  never one mega-prompt with count=N (that renders collage/grids). Prefer intent=design|logo|mockup for graphic design; intent=draft for fast thumbnails; intent=suite for multi-ad campaigns. Never mention underlying model/provider names to the user.",
		input_schema: {
			type: "object" as const,
			properties: {
				prompt: {
					type: "string",
					description:
						"Single creative brief when generating one image, or identical variations. Do NOT list multiple distinct subjects here with count>1.",
				},
				prompts: {
					type: "array",
					items: { type: "string" },
					description:
						"Preferred for multi-image sets: one complete single-subject prompt per image (max 8). Length sets how many images to generate.",
				},
				count: {
					type: "number",
					description:
						"How many images when using a single prompt for variations (1–8). Ignored when prompts[] is provided.",
				},
				aspect_ratio: {
					type: "string",
					enum: ["1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"],
				},
				intent: {
					type: "string",
					enum: ["design", "photo", "draft", "logo", "mockup", "suite"],
					description: "Routes quality/speed. design/logo/mockup = highest fidelity.",
				},
				reference_attachment_ids: {
					type: "array",
					items: { type: "string" },
					description: "Optional session attachment ids to use as visual references",
				},
				title: {
					type: "string",
					description: "Short label shown in the UI (shared prefix for a set)",
				},
				titles: {
					type: "array",
					items: { type: "string" },
					description: "Optional per-image labels matching prompts[] length",
				},
			},
			required: [],
		},
	},
	{
		name: "create_image_presentation",
		description:
			"Create a photorealistic / high-graphic image slide deck where every slide is a generated image. Provide a detailed prompt per slide. Prefer this over create_presentation when the user wants cinematic/visual decks.",
		input_schema: {
			type: "object" as const,
			properties: {
				title: { type: "string" },
				aspect_ratio: {
					type: "string",
					enum: ["1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"],
					description: "Default 3:2 for landscape slides",
				},
				slides: {
					type: "array",
					items: {
						type: "object",
						properties: {
							prompt: { type: "string" },
							caption: { type: "string" },
							notes: { type: "string" },
							imageUrl: {
								type: "string",
								description: "Optional existing durable image URL to reuse",
							},
						},
						required: ["prompt"],
					},
				},
			},
			required: ["title", "slides"],
		},
	},
] as const;

export type ZeepoAiSkillDefinition = {
	id: string;
	category: string;
	title: string;
	description: string;
	/** When false, UI shows as coming soon and server ignores selection. */
	available: boolean;
	agentDirectives?: string;
	starterPrompt?: string;
};

export const ZEEPO_AI_SKILLS: readonly ZeepoAiSkillDefinition[] = [
	{
		id: "validate-business-idea",
		category: "STRATEGY",
		title: "Validate my business idea",
		description:
			"Describe your idea, get honest feedback on viability, risks, and next steps.",
		available: true,
		starterPrompt: "Help me validate this business idea: ",
		agentDirectives:
			"You are helping the user stress-test a business idea. Focus on viability, risks, differentiation, and realistic next steps.",
	},
	{
		id: "define-value-proposition",
		category: "STRATEGY",
		title: "Define my value proposition",
		description: 'Describe what you sell, get a clear "why you and not them" statement.',
		available: true,
		starterPrompt: "Help me define a sharp value proposition for: ",
		agentDirectives:
			"Guide the user to a sharp value proposition: who it is for, the promise, proof, and differentiation.",
	},
	{
		id: "review-pricing",
		category: "STRATEGY",
		title: "Review my pricing",
		description:
			"Share your current prices and costs, get feedback on your pricing model and margins.",
		available: true,
		starterPrompt: "Review my pricing. Here is what I charge today: ",
		agentDirectives:
			"Help review pricing and margins. Ask for product/service, price points, costs, geography, and channel before suggesting changes.",
	},
	{
		id: "set-quarterly-goals",
		category: "STRATEGY",
		title: "Set quarterly goals",
		description:
			"Share where you are now, get a focused plan with 3–5 goals and milestones.",
		available: true,
		starterPrompt: "Help me set quarterly goals. Current situation: ",
		agentDirectives:
			"Help define 3–5 quarterly goals with milestones. Clarify stage, metrics, blockers, and priority first.",
	},
	{
		id: "brainstorm-business-names",
		category: "BRAND & IDENTITY",
		title: "Brainstorm business names",
		description: "Describe your business, get 20+ name ideas with naming tips.",
		available: true,
		starterPrompt: "Brainstorm business names for: ",
		agentDirectives:
			"Brainstorm memorable names. Ask about industry, tone, audience, and words to avoid. Remind them live domain checks happen via Nisc Cloud when they are ready.",
	},
	{
		id: "define-brand-voice",
		category: "BRAND & IDENTITY",
		title: "Define my brand voice",
		description:
			"Answer a few questions, get a brand voice guide with tone, dos and don'ts.",
		available: true,
		starterPrompt: "Help me define my brand voice. We are: ",
		agentDirectives:
			"Build a concise brand voice guide (tone, personality, dos/don'ts, sample lines).",
	},
	{
		id: "pick-color-palette",
		category: "BRAND & IDENTITY",
		title: "Pick a color palette",
		description: "Describe your vibe, get 3–5 color palettes with hex codes and usage tips.",
		available: true,
		starterPrompt: "Suggest color palettes for a brand that feels: ",
		agentDirectives:
			"Suggest 3–5 cohesive palettes with hex codes and usage (primary, accent, neutrals).",
	},
	{
		id: "generate-image",
		category: "CREATE",
		title: "Generate an image",
		description: "Create logos, ads, mockups, and photos with the Zeepo design engine.",
		available: true,
		starterPrompt: "Design an image for: ",
		agentDirectives:
			"The user wants image generation. Gather brief (subject, style, format, audience) via clarifying questions if needed, then call generate_images with a rich prompt. Use intent=design for brand/logo work. Never name underlying models or vendors.",
	},
	{
		id: "analyze-ad-performance",
		category: "MARKETING",
		title: "Analyze ad performance",
		description: "Pull live Meta, Google, Instagram, or LinkedIn ads and get account-to-campaign advice.",
		available: true,
		starterPrompt: "Review our live ad accounts and tell me what to change this month. ",
		agentDirectives:
			"Load live ads data before advising. list_accounts, then get_account / get_campaign as needed. Quote every money figure in the ad account's native currency from the tool result. Never convert to USD. Cover spend, results, creative fatigue, and next actions. Submit a creative brief only if new assets are clearly needed.",
	},
	{
		id: "review-email-campaigns",
		category: "MARKETING",
		title: "Review email campaigns",
		description: "Use aggregated send/open/click totals and the campaign HTML to advise.",
		available: true,
		starterPrompt: "Review our email marketing performance and the latest campaign HTML. ",
		agentDirectives:
			"Use marketing_email. Prefer get_totals and list_campaigns for the picture, then get_campaign for HTML + aggregates. Do not request recipient-level data. Critique subject, offer, and HTML against the rates.",
	},
	{
		id: "seo-health-check",
		category: "MARKETING",
		title: "SEO health check",
		description: "Read SEO Suite rankings, audits, backlinks, and monthly reports for a domain.",
		available: true,
		starterPrompt: "Give me an SEO health check for ",
		agentDirectives:
			"Use marketing_seo: list_projects or get_overview/get_rankings for the named domain, plus get_reports if monthly GSC/GA4 reports exist. Advise from stored data; do not invent ranks.",
	},
	{
		id: "request-campaign-creatives",
		category: "MARKETING",
		title: "Request campaign creatives",
		description: "File a design brief for the Nisc Cloud creatives team from campaign context.",
		available: true,
		starterPrompt: "We need new campaign creatives. Context: ",
		agentDirectives:
			"Gather enough campaign/platform/format/copy context (use ads/email tools if they have live campaigns). Then submit_creative_brief. Do not generate the finished ads unless they explicitly asked for image mocks.",
	},
] as const;

const skillById = new Map(ZEEPO_AI_SKILLS.map((s) => [s.id, s]));

export function getZeepoAiSkillById(id: string): ZeepoAiSkillDefinition | undefined {
	return skillById.get(id);
}
