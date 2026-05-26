import Replicate from "replicate";
import { z } from "zod";

/** Must match Creative Asset Analyzer configuration in UI / DB `model`. */
export const CREATIVE_ASSET_IMAGE_ANALYSIS_MODEL = "anthropic/claude-4.5-haiku";

const DEFAULT_MAX_MS = 180_000;

export const creativeAssetImageAnalysisDetailSchema = z.object({
	headline: z.string().min(1),
	modelLabel: z.string().optional(),
	overallRatingScaleMax: z.coerce.number().min(1).max(50).catch(10),
	overallRatingValue: z.coerce.number(),
	overallRatingReason: z.string().min(1),
	overallRatingBand: z.union([z.string().min(1), z.null()]).optional(),
	confidenceScore: z.union([z.coerce.number().min(0).max(1), z.null()]).optional(),
	ratingSummary: z.string().min(1),
	overallSummary: z.string().min(1),
	scores: z
		.array(
			z.object({
				id: z.string(),
				label: z.string(),
				value: z.coerce.number(),
				max: z.coerce.number().positive(),
				note: z.string(),
			}),
		)
		.min(1),
	sections: z.array(z.object({ title: z.string(), body: z.string() })).min(1),
	recommendations: z.array(z.string()).min(1),
});

export type CreativeAssetImageAnalysisDetail = z.infer<typeof creativeAssetImageAnalysisDetailSchema>;

export function stripOuterCodeFence(raw: string): string {
	let t = raw.trim();
	if (t.startsWith("```")) {
		t = t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/is, "").trim();
	}
	return t;
}

export async function collectTextOutput(output: unknown): Promise<string> {
	if (typeof output === "string") return output;
	if (Array.isArray(output)) {
		return output.map((x) => (typeof x === "string" ? x : JSON.stringify(x))).join("");
	}
	if (output != null && typeof output === "object" && Symbol.asyncIterator in output) {
		let acc = "";
		for await (const chunk of output as AsyncIterable<unknown>) {
			acc += typeof chunk === "string" ? chunk : String(chunk);
		}
		return acc;
	}
	throw new Error(`Unexpected Replicate output type: ${typeof output}`);
}

function extractFirstJsonObject(s: string): string | null {
	const start = s.indexOf("{");
	if (start < 0) return null;
	let depth = 0;
	let inString = false;
	let escape = false;
	let stringQuote: string | null = null;
	for (let i = start; i < s.length; i++) {
		const ch = s[i]!;
		if (escape) {
			escape = false;
			continue;
		}
		if (ch === "\\" && inString) {
			escape = true;
			continue;
		}
		if (!inString && (ch === '"' || ch === "'")) {
			inString = true;
			stringQuote = ch;
			continue;
		}
		if (inString && stringQuote && ch === stringQuote) {
			inString = false;
			stringQuote = null;
			continue;
		}
		if (inString) continue;
		if (ch === "{") depth++;
		else if (ch === "}") {
			depth--;
			if (depth === 0) return s.slice(start, i + 1);
		}
	}
	return null;
}

async function runReplicateWithTimeout(
	replicate: Replicate,
	input: Record<string, unknown>,
	maxMs: number,
): Promise<unknown> {
	const timeout = new Promise<never>((_, reject) =>
		setTimeout(
			() =>
				reject(
					new Error(`AI analysis timed out after ${Math.round(maxMs / 1000)}s — try again with a smaller file.`),
				),
			maxMs,
		),
	);
	return Promise.race([
		replicate.run(CREATIVE_ASSET_IMAGE_ANALYSIS_MODEL as `${string}/${string}`, { input }),
		timeout,
	]);
}

export function buildCreativeAssetImageAnalysisSystemPrompt(): string {
	return [
		"You are a senior creative director and performance marketer who reviews individual static image creatives for ads, landing pages, and brand materials.",
		"You receive the image visually (vision) plus light file metadata.",
		"When the user supplies optional context (campaign, channel, audience, brand, intended placement), treat it as ground truth for channel fit, messaging, and scoring — weigh it heavily in overallRatingReason and recommendations.",
		"",
		"## HARD OUTPUT RULE",
		"Respond with one JSON object only. No Markdown, no commentary, no text before or after the JSON.",
		"Never wrap JSON in Markdown code fences.",
		"",
		"## JSON SHAPE — use these exact camelCase keys",
		String.raw`{"headline": string,"modelLabel": string,"overallRatingScaleMax": number (almost always 10),"overallRatingValue": number,"overallRatingReason": string,"overallRatingBand": string | null,"confidenceScore": number | null,"ratingSummary": string,"overallSummary": string,"scores": [{"id","label","value","max","note"}] — at least 4,"sections": [{"title": string,"body": string}] — body MUST be a single string (join bullet lines with newlines; never use a JSON array for body),"recommendations": string[] — at least 3 plain strings}`,
		"",
		"## SCORING RUBRIC (CALIBRATE TO THE MEDIUM)",
		"Aim for nuanced scores — avoid collapsing everything to middling values.",
		"Judge composition, typography / text-on-image readability, hierarchy, branding fit, persuasion/clarity for the presumed channel, accessibility (contrast, small-size legibility), and technical quality.",
		"Always mention specific visual regions or elements rather than vague praise.",
		"",
		"## NOTES",
		"If branding context is ambiguous, infer from what is visible and state assumptions briefly inside overallRatingReason, not elsewhere.",
		"overallRatingBand MUST be SHORT_SNAKE or single-token ALL CAPS buckets like STRONG, NEEDS_WORK (underscores preferred). If unsure, omit with null.",
	].join("\n");
}

export function buildCreativeAssetImageAnalysisUserPrompt(ctx: {
	fileName: string;
	mimeType: string;
	internalVersionNumber: number;
	userContext?: string | null;
}): string {
	const lines = [
		"Analyze this creative asset IMAGE for readiness in digital marketing workflows.",
		"",
		"## METADATA",
		`- File name: ${ctx.fileName}`,
		`- MIME type: ${ctx.mimeType}`,
		`- Internal version number: ${ctx.internalVersionNumber}`,
	];

	const context = ctx.userContext?.trim();
	if (context) {
		lines.push(
			"",
			"## USER CONTEXT (use this to tailor channel fit, audience, and recommendations)",
			context,
		);
	}

	lines.push("", "Return ONLY the JSON object specified in your system prompt.");
	return lines.join("\n");
}

/** Coerce LLM quirks (array bodies, nested bullets, numeric strings) before Zod. */
function coerceToText(value: unknown): string {
	if (value == null) return "";
	if (typeof value === "string") return value.trim();
	if (typeof value === "number" || typeof value === "boolean") return String(value);
	if (Array.isArray(value)) {
		return value
			.map((item) => coerceToText(item))
			.filter((s) => s.length > 0)
			.join("\n");
	}
	if (typeof value === "object") {
		const o = value as Record<string, unknown>;
		if (typeof o.text === "string") return o.text.trim();
		if (typeof o.body === "string") return o.body.trim();
		if (typeof o.content === "string") return o.content.trim();
		if (Array.isArray(o.points)) return coerceToText(o.points);
		if (Array.isArray(o.bullets)) return coerceToText(o.bullets);
		return JSON.stringify(value);
	}
	return String(value);
}

function normalizeSections(raw: unknown): Array<{ title: string; body: string }> {
	if (!Array.isArray(raw)) return [];

	const out: Array<{ title: string; body: string }> = [];
	for (const item of raw) {
		if (item == null) continue;
		if (typeof item === "string") {
			const text = item.trim();
			if (text) out.push({ title: "Insight", body: text });
			continue;
		}
		if (typeof item !== "object") continue;
		const o = item as Record<string, unknown>;
		const title = coerceToText(o.title ?? o.name ?? o.heading ?? "Insight");
		const body = coerceToText(o.body ?? o.content ?? o.text ?? o.points ?? o.bullets ?? o.items);
		if (title || body) {
			out.push({
				title: title || "Insight",
				body: body || title,
			});
		}
	}
	return out;
}

function normalizeScores(raw: unknown): Array<{ id: string; label: string; value: number; max: number; note: string }> {
	if (!Array.isArray(raw)) return [];

	const out: Array<{ id: string; label: string; value: number; max: number; note: string }> = [];
	for (let i = 0; i < raw.length; i++) {
		const item = raw[i];
		if (item == null || typeof item !== "object") continue;
		const o = item as Record<string, unknown>;
		const label = coerceToText(o.label ?? o.name ?? o.dimension ?? `Dimension ${i + 1}`);
		const value = Number(o.value ?? o.score ?? 0);
		const max = Number(o.max ?? o.maxValue ?? 100);
		const note = coerceToText(o.note ?? o.notes ?? o.comment ?? o.rationale);
		const id = coerceToText(o.id) || `score-${i + 1}`;
		if (!label || !Number.isFinite(value) || !Number.isFinite(max) || max <= 0) continue;
		out.push({ id, label, value, max, note: note || "—" });
	}
	return out;
}

function normalizeRecommendations(raw: unknown): string[] {
	if (!Array.isArray(raw)) {
		const single = coerceToText(raw);
		return single ? [single] : [];
	}
	return raw.map((item) => coerceToText(item)).filter((s) => s.length > 0);
}

function normalizeModelPayload(parsed: Record<string, unknown>): Record<string, unknown> {
	const sections = normalizeSections(parsed.sections);
	const scores = normalizeScores(parsed.scores);
	const recommendations = normalizeRecommendations(parsed.recommendations);

	const ratingSummary = coerceToText(parsed.ratingSummary);
	const overallSummary = coerceToText(parsed.overallSummary) || ratingSummary;
	const overallRatingReason = coerceToText(parsed.overallRatingReason);
	const scaleMax = Number(parsed.overallRatingScaleMax) || 10;
	const ratingValue = Number(parsed.overallRatingValue);
	const bandRaw = parsed.overallRatingBand;
	const overallRatingBand =
		bandRaw == null ? null : coerceToText(bandRaw) || null;

	return {
		...parsed,
		headline: coerceToText(parsed.headline) || "Creative analysis",
		modelLabel: coerceToText(parsed.modelLabel) || undefined,
		overallRatingBand,
		overallRatingReason: overallRatingReason || overallSummary || ratingSummary || "No rationale provided.",
		ratingSummary: ratingSummary || overallRatingReason.slice(0, 200) || "Analysis complete",
		overallSummary: overallSummary || overallRatingReason || ratingSummary,
		sections: sections.length > 0 ? sections : [{ title: "Summary", body: overallRatingReason || ratingSummary }],
		scores:
			scores.length > 0
				? scores
				: [
						{
							id: "overall",
							label: "Overall",
							value: Number.isFinite(ratingValue)
								? Math.round((ratingValue / scaleMax) * 100)
								: 0,
							max: 100,
							note: "Derived from headline score when dimension scores were omitted.",
						},
					],
		recommendations:
			recommendations.length > 0
				? recommendations
				: ["Review the creative against brand guidelines and channel specs before publishing."],
	};
}

export function parseCreativeAssetImageAnalysisJson(rawText: string): CreativeAssetImageAnalysisDetail {
	const cleaned = stripOuterCodeFence(rawText.trim());

	let parsed: unknown;
	try {
		parsed = JSON.parse(cleaned);
	} catch {
		const slice = extractFirstJsonObject(cleaned);
		if (!slice) {
			throw new Error(`Model did not return valid JSON. First 280 chars:\n${cleaned.slice(0, 280)}`);
		}
		try {
			parsed = JSON.parse(slice);
		} catch {
			throw new Error(`Could not parse JSON from model response.`);
		}
	}

	let scaleMax = 10;
	if (parsed && typeof parsed === "object" && "overallRatingScaleMax" in parsed) {
		const raw = Number((parsed as Record<string, unknown>).overallRatingScaleMax);
		if (Number.isFinite(raw) && raw > 0 && raw <= 50) scaleMax = raw;
	}

	let ratingValue =
		parsed && typeof parsed === "object" && "overallRatingValue" in parsed
			? Number((parsed as Record<string, unknown>).overallRatingValue)
			: Number.NaN;
	if (!Number.isFinite(ratingValue)) {
		throw new Error("overallRatingValue missing or invalid in model JSON.");
	}
	ratingValue = Math.min(Math.max(ratingValue, 0), scaleMax);

	const merged =
		parsed && typeof parsed === "object"
			? normalizeModelPayload({
					...(parsed as Record<string, unknown>),
					overallRatingValue: ratingValue,
					overallRatingScaleMax: scaleMax,
				})
			: parsed;

	const validated = creativeAssetImageAnalysisDetailSchema.safeParse(merged);
	if (!validated.success) {
		const flat = validated.error.flatten();
		throw new Error(`Model JSON validation failed: ${JSON.stringify(flat)}`);
	}

	return validated.data;
}

export async function invokeCreativeAssetImageAnalysis(params: {
	replicate: Replicate;
	imageUrl: string;
	fileName: string;
	mimeType: string;
	internalVersionNumber: number;
	userContext?: string | null;
	maxMs?: number;
}): Promise<{ rawText: string; detail: CreativeAssetImageAnalysisDetail }> {
	const system_prompt = buildCreativeAssetImageAnalysisSystemPrompt();
	const prompt = buildCreativeAssetImageAnalysisUserPrompt({
		fileName: params.fileName,
		mimeType: params.mimeType,
		internalVersionNumber: params.internalVersionNumber,
		userContext: params.userContext,
	});

	const output = await runReplicateWithTimeout(
		params.replicate,
		{
			system_prompt,
			prompt,
			image: params.imageUrl,
			max_tokens: 8192,
		},
		params.maxMs ?? DEFAULT_MAX_MS,
	);

	const rawText = await collectTextOutput(output);
	const detailParsed = parseCreativeAssetImageAnalysisJson(rawText);

	const via = ` (${CREATIVE_ASSET_IMAGE_ANALYSIS_MODEL} via Replicate)`;
	const detail: CreativeAssetImageAnalysisDetail = {
		...detailParsed,
		modelLabel:
			detailParsed.modelLabel && detailParsed.modelLabel.trim().length > 0
				? `${detailParsed.modelLabel.trim()}${via}`
				: `${CREATIVE_ASSET_IMAGE_ANALYSIS_MODEL}${via}`,
	};

	return { rawText, detail };
}
