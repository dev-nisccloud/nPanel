import { z } from "zod";

const capabilityKeySchema = z.enum([
	"images",
	"audio",
	"video",
	"thinking",
	"audio_generation",
]);

export const listModelsArgsSchema = z.object({
	category: z
		.enum(["text", "image", "video", "audio", "background-remover"])
		.optional(),
	requires: z.array(capabilityKeySchema).optional(),
});

export const zeepoAgentCategorySchema = z.enum([
	"text",
	"image",
	"video",
	"audio",
	"background-remover",
]);

const sharedInputsSchema = z.object({
	negative_prompt: z.string().max(2000).optional(),
	seed: z.number().int().optional(),
});

/** Per-category whitelisted optional input bag. Unknown keys are dropped. */
const imageInputsSchema = sharedInputsSchema.extend({
	aspect_ratio: z.enum(["1:1", "3:2", "16:9", "9:16", "4:3", "3:4"]).optional(),
	reference_image_url: z.string().url().optional(),
	output_format: z.enum(["png", "jpg", "webp"]).optional(),
});

const videoInputsSchema = sharedInputsSchema.extend({
	aspect_ratio: z.enum(["16:9", "9:16", "1:1"]).optional(),
	duration_seconds: z.number().int().min(2).max(20).optional(),
	reference_image_url: z.string().url().optional(),
	with_audio: z.boolean().optional(),
});

const audioInputsSchema = sharedInputsSchema.extend({
	voice: z.string().max(120).optional(),
	duration_seconds: z.number().int().min(2).max(120).optional(),
});

const textInputsSchema = sharedInputsSchema.extend({
	max_tokens: z.number().int().min(64).max(16_000).optional(),
});

const bgRemoverInputsSchema = z.object({
	image: z.string().url(),
});

export const runMediaGenerationArgsSchema = z
	.object({
		category: zeepoAgentCategorySchema,
		prompt: z.string().min(1).max(8000),
		model_id: z.string().max(200).optional(),
		requires: z.array(capabilityKeySchema).optional(),
		inputs: z.record(z.string(), z.unknown()).optional(),
	})
	.superRefine((val, ctx) => {
		if (!val.inputs) return;
		let inputsSchema:
			| typeof imageInputsSchema
			| typeof videoInputsSchema
			| typeof audioInputsSchema
			| typeof textInputsSchema
			| typeof bgRemoverInputsSchema;
		switch (val.category) {
			case "image":
				inputsSchema = imageInputsSchema;
				break;
			case "video":
				inputsSchema = videoInputsSchema;
				break;
			case "audio":
				inputsSchema = audioInputsSchema;
				break;
			case "background-remover":
				inputsSchema = bgRemoverInputsSchema;
				break;
			default:
				inputsSchema = textInputsSchema;
				break;
		}
		const parsed = inputsSchema.safeParse(val.inputs);
		if (!parsed.success) {
			ctx.addIssue({
				code: "custom",
				message: `Invalid "inputs" for category "${val.category}": ${parsed.error.message}`,
				path: ["inputs"],
			});
		}
	});

export type ListModelsArgs = z.infer<typeof listModelsArgsSchema>;
export type RunMediaGenerationArgs = z.infer<typeof runMediaGenerationArgsSchema>;

export const TOOL_DEFINITIONS_FOR_PROMPT = `Available tools (call any of them through the "tool_calls" array):

1) list_models
   Purpose: discover the *exact* Replicate model ids available in the Zeepo catalog for a category, filtered by capabilities.
   Arguments:
     - category? : "text" | "image" | "video" | "audio" | "background-remover"
     - requires? : array of capability keys; valid: "images", "audio", "video", "thinking", "audio_generation"
   Returns: an array of { id, category, provider, label, description, is_default, capabilities }.
   Use this tool BEFORE you ever pass a non-default "model_id" to run_media_generation.

2) run_media_generation
   Purpose: queue a Replicate generation job. Results stream back to the UI asynchronously.
   Arguments:
     - category : "text" | "image" | "video" | "audio" | "background-remover"
     - prompt : string (concrete, detailed; 1–800 words)
     - model_id? : string — MUST be an id you saw in a list_models result for the same category. Omit to use the default for the category.
     - requires? : capability keys the chosen model MUST satisfy (e.g. ["audio_generation"] for video with audio). The server validates this.
     - inputs? : optional category-specific knobs (image: {aspect_ratio, reference_image_url, output_format, negative_prompt, seed}; video: {aspect_ratio, duration_seconds, reference_image_url, with_audio, negative_prompt, seed}; audio: {voice, duration_seconds, negative_prompt, seed}; text: {max_tokens, negative_prompt, seed}; background-remover: {image: <url>}). Unknown keys are rejected.
   Returns: { generationId, status: "QUEUED", modelId, category }. Tell the user the job is queued and reference the generationId; the UI will show the result once complete.`;
