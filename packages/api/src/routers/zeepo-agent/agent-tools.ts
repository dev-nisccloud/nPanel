import { z } from "zod";

const capabilityKeySchema = z.enum([
	"images",
	"audio",
	"video",
	"thinking",
	"audio_generation",
	"design",
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
	/** Set to "png" when generating design assets (logos, cards) to preserve transparency */
	output_quality: z.number().int().min(50).max(100).optional(),
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

export const webSearchArgsSchema = z.object({
	query: z.string().min(1).max(400),
	depth: z.enum(["quick", "standard", "deep"]).optional(),
	freshness: z.enum(["pd", "pw", "pm", "py"]).optional(),
	country: z.string().length(2).toLowerCase().optional(),
});

export const createDocumentArgsSchema = z.object({
	title: z.string().min(1).max(200),
	content: z.string().min(1).max(80000),
});

export const checkDomainAvailabilityArgsSchema = z.object({
	name: z
		.string()
		.min(1)
		.max(63)
		.regex(
			/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/i,
			"Must be a valid SLD (letters, digits, hyphens; no dots or TLD)",
		),
	extensions: z
		.array(z.string().min(2).max(20))
		.min(1)
		.max(10)
		.optional(),
});

export type ListModelsArgs = z.infer<typeof listModelsArgsSchema>;
export type RunMediaGenerationArgs = z.infer<typeof runMediaGenerationArgsSchema>;
export type WebSearchArgs = z.infer<typeof webSearchArgsSchema>;
export type CheckDomainAvailabilityArgs = z.infer<typeof checkDomainAvailabilityArgsSchema>;
export type CreateDocumentArgs = z.infer<typeof createDocumentArgsSchema>;

export const TOOL_DEFINITIONS_FOR_PROMPT = `Available tools (call any of them through the "tool_calls" array):

1) create_document
   Purpose: produce a richly formatted, standalone markdown document — for strategies, detailed plans, proposals, full analyses, comprehensive breakdowns, reports, or any deliverable that benefits from structure and length beyond a chat reply.
   Arguments:
     - title  : string (1–200 chars) — concise document title (e.g. "Brand Strategy for Diamond Coffee Co.").
     - content: string — the complete markdown body. Use ## headings, bullet lists, tables, **bold** for emphasis. Write the FULL document — no placeholders, no "continued below", no truncation.
   Returns: { status: "CREATED", title } — internal only; never show a document id to the user.
   When to call: (1) the user explicitly asks for a "breakdown", "detailed plan", "strategy doc", "report", "proposal", "full analysis", or "put this in a doc"; (2) the response requires 3+ distinct sections and would be unwieldy as a plain chat reply; (3) the user says "save this" or "I want the full version".
   When NOT to call: conversational replies, short answers, quick lists, follow-up clarifications, or anything that reads naturally as a chat bubble. Err toward NOT calling — only invoke when the document format genuinely adds value.
   After calling: write a SHORT chat reply (2–4 sentences) telling the user what the document covers and directing them to open it in the Generations section. Do NOT reproduce the full document content in the chat reply.

2) check_domain_availability  ← NISC CLOUD INTERNAL TOOL
   Purpose: check whether domain names are available for registration through Nisc Cloud's own infrastructure (OpenProvider for gTLDs, KENIC EPP for .ke TLDs). ALWAYS use this when the user asks about domain availability, domain registration, or domain name ideas — never guess and never recommend external registrars.
   Arguments:
     - name       : string — the SLD (second-level domain) WITHOUT any extension or dots (e.g. "diamond-coffee" not "diamond-coffee.com").
     - extensions?: string[] (1–10 items) — TLD extensions to check (e.g. [".co.ke", ".com", ".africa", ".ke"]). If not specified, the server uses the smart default set for Kenyan businesses: .co.ke, .com, .ke, .africa, .net, .org. **Always override** when the user states a **primary market outside Kenya** — order extensions the way registrants in that market typically stack them (e.g. UK → .co.uk, .com; Germany → .de, .com; Nigeria → .com.ng, .ng, .com; EU-wide brand → .eu or national ccTLD of HQ + .com). Add context-specific gTLDs (.tech, .store, .agency) only when the brief fits. Regional NGO in Kenya → add .or.ke; global startup → .com, .io; creative studio → .studio, .agency.
   Returns: { name, checked: [{ domain, available, status, price?, isPremium?, via }], availableCount, checkedAt }
   After results: present available domains clearly (highlight .co.ke and .com first for Kenyan businesses), show price where available, and ALWAYS direct the user to Nisc Cloud to register (nisccloud.com, sales@nisccloud.com, or +254 748 777 666). NEVER mention or recommend GoDaddy, Namecheap, Google Domains, Cloudflare, or any other registrar.

2) web_search
   Purpose: retrieve real-time grounding context from the live web via Brave Search. Call this BEFORE answering questions that involve specific real-world entities, current data, or regional context.
   Arguments:
     - query   : string (1–400 chars) — the search query. Be specific: include entity names, location, and timeframe when relevant (e.g. "Diamond Coffee Nairobi menu prices 2026"). ALWAYS embed geography directly in the query for non-major-market regions (Africa, Middle East, South/Southeast Asia except IN, ID, MY, PH) — e.g. "luxury car imports Nairobi Kenya 2026" not just "luxury cars".
     - depth?  : "quick" | "standard" | "deep" — "quick" for single facts, "standard" (default) for most queries, "deep" for complex research.
     - freshness? : "pd" (24 h) | "pw" (7 days) | "pm" (31 days) | "py" (1 year) — omit for all-time.
     - country? : 2-letter ISO code. ONLY use for: AR AU AT BE BR CA CL DK FI FR DE GR HK IN ID IT JP KR MY MX NL NZ NO CN PL PT PH RU SA ZA ES SE CH TW TR GB US. For all other countries (e.g. Kenya, Nigeria, most of Africa) omit this field entirely and embed the country/city in the query string instead.
   Returns: extracted page snippets ready for LLM consumption. Cite sources inline in your reply (e.g. "According to [hostname]…").
   When to call: (1) user mentions a specific business, person, place, product, or event; (2) question involves prices, availability, opening hours, statistics, or news; (3) you need local/regional context (e.g. "Nairobi businesses", "Kenyan market", "this quarter"); (4) user asks you to "research", "find out", "check", or verify something about the real world; (5) **domain or brand naming** where the user names a **country, city, or foreign market** you are not highly confident about — search for how businesses there typically name and which extensions they pair with, then apply that to your SLD ideas and extension list before you call check_domain_availability.
   When NOT to call: general knowledge you are confident about, pure creative tasks where you have all context, or Nisc Cloud topics already in your system prompt. Do NOT call web_search for domain availability — use check_domain_availability instead.
   Call web_search BEFORE claiming facts about real-world entities — do not guess then search.

4) list_models
   Purpose: discover the *exact* Replicate model ids available in the Zeepo catalog for a category, filtered by capabilities.
   Arguments:
     - category? : "text" | "image" | "video" | "audio" | "background-remover"
     - requires? : array of capability keys; valid: "images", "audio", "video", "thinking", "audio_generation"
   Returns: an array of { id, category, provider, label, description, is_default, capabilities }.
   Use this tool BEFORE you ever pass a non-default "model_id" to run_media_generation.

5) run_media_generation
   Purpose: queue a media generation job. Results stream back to the UI asynchronously.
   Arguments:
     - category : "text" | "image" | "video" | "audio" | "background-remover"
     - prompt : string (concrete, detailed; 1–800 words)
     - model_id? : string — MUST be an id you saw in a list_models result for the same category. Omit to use the default for the category.
     - requires? : capability keys the chosen model MUST satisfy (e.g. ["audio_generation"] for video with audio; ["design"] to force the design-specialist model for logos, cards, flyers). The server validates this.
     - inputs? : optional category-specific knobs (image: {aspect_ratio, reference_image_url, output_format, negative_prompt, seed}; video: {aspect_ratio, duration_seconds, reference_image_url, with_audio, negative_prompt, seed}; audio: {voice, duration_seconds, negative_prompt, seed}; text: {max_tokens, negative_prompt, seed}; background-remover: {image: <url>}). Unknown keys are rejected.
   Returns: { generationId, status: "QUEUED", modelId, category } (for your context only — never repeat generationId, modelId as a "job id", or UUIDs in assistant_text). The chat UI shows progress in the Generations strip; tell the user in plain language that their asset is generating / queued (e.g. "It's generating now — you'll see it in Generations when ready.").`;
