import type { z } from "zod";

import {
	extractFirstJsonObject,
	parseJsonFromModel,
	stripCodeFences,
} from "./json-parse";
import type {
	NebCompAnalysisOutput,
	NebDirectBuildOutput,
	NebHtmlArchitectOutput,
	NebPlannerOutput,
	NebRevisionOutput,
} from "./types";
import {
	compAnalysisOutputSchema,
	directBuildOutputSchema,
	htmlArchitectOutputSchema,
	imageSlotSchema,
	plannerOutputSchema,
	revisionOutputSchema,
} from "./types";

const HTML_START = "<<<NEB_HTML>>>";
const HTML_END = "<<<END_NEB_HTML>>>";
const META_START = "<<<NEB_META>>>";
const META_END = "<<<END_NEB_META>>>";

export function extractHtmlDocument(raw: string): string | null {
	const delim = raw.match(
		new RegExp(
			`${escapeRe(HTML_START)}\\s*([\\s\\S]*?)\\s*${escapeRe(HTML_END)}`,
			"i",
		),
	);
	if (delim?.[1]?.trim()) return delim[1].trim();

	const doctype = raw.search(/<!DOCTYPE\s+html/i);
	const htmlTag = raw.search(/<html[\s>]/i);
	const start = doctype >= 0 ? doctype : htmlTag;
	if (start < 0) return null;

	const end = raw.lastIndexOf("</html>");
	if (end < 0) return raw.slice(start).trim();
	return raw.slice(start, end + "</html>".length).trim();
}

function escapeRe(s: string): string {
	return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseMetaBlock(metaRaw: string): {
	change_summary: string;
	assistant_text: string;
	image_slots?: NebRevisionOutput["image_slots"];
} {
	const defaults = {
		change_summary: "Email updated",
		assistant_text: "Your email has been updated.",
	};
	try {
		const jsonStr = extractFirstJsonObject(metaRaw.trim()) ?? metaRaw.trim();
		const parsed = JSON.parse(jsonStr) as Record<string, unknown>;
		return {
			change_summary:
				typeof parsed.change_summary === "string"
					? parsed.change_summary
					: defaults.change_summary,
			assistant_text:
				typeof parsed.assistant_text === "string"
					? parsed.assistant_text
					: defaults.assistant_text,
			...(Array.isArray(parsed.image_slots)
				? { image_slots: parsed.image_slots as NebRevisionOutput["image_slots"] }
				: {}),
		};
	} catch {
		return defaults;
	}
}

/** Parse HTML architect / revision output — delimiter format first, then JSON, then raw HTML. */
export function parseHtmlAgentResponse(
	raw: string,
	schema: z.ZodType<NebHtmlArchitectOutput | NebRevisionOutput>,
	label: string,
): NebHtmlArchitectOutput | NebRevisionOutput {
	const stripped = stripCodeFences(raw);

	// 1) Delimiter blocks (avoids JSON-escaping multi-KB HTML)
	const htmlFromDelim = extractHtmlDocument(stripped);
	const metaMatch = stripped.match(
		new RegExp(
			`${escapeRe(META_START)}\\s*([\\s\\S]*?)\\s*${escapeRe(META_END)}`,
			"i",
		),
	);
	if (htmlFromDelim && htmlFromDelim.length > 100) {
		const meta = metaMatch
			? parseMetaBlock(metaMatch[1]!)
			: {
					change_summary: "Email generated",
					assistant_text: "Your email design is ready in the preview.",
				};
		const candidate = { html: htmlFromDelim, ...meta };
		const validated = schema.safeParse(candidate);
		if (validated.success) return validated.data;
	}

	// 2) Plain JSON wrapper
	try {
		return parseJsonFromModel(stripped, schema);
	} catch {
		/* continue */
	}

	// 3) JSON with "html" key extracted manually (broken escape sequences)
	const manual = tryExtractHtmlFromBrokenJson(stripped);
	if (manual) {
		const validated = schema.safeParse(manual);
		if (validated.success) return validated.data;
	}

	// 4) Raw HTML document only
	const doc = extractHtmlDocument(stripped);
	if (doc && doc.length > 100) {
		const candidate = {
			html: doc,
			change_summary: "Email generated",
			assistant_text: "Your email design is ready in the preview.",
		};
		const validated = schema.safeParse(candidate);
		if (validated.success) return validated.data;
	}

	const preview = stripped.slice(0, 400).replace(/\s+/g, " ");
	throw new Error(
		`${label}: could not parse model output. Preview: ${preview}…`,
	);
}

/** Best-effort when model emits invalid JSON around a large html string. */
function tryExtractHtmlFromBrokenJson(
	raw: string,
): NebHtmlArchitectOutput | null {
	const htmlKey = raw.indexOf('"html"');
	if (htmlKey < 0) return null;

	const doc = extractHtmlDocument(raw);
	if (!doc || doc.length < 100) return null;

	let change_summary = "Email generated";
	let assistant_text = "Your email design is ready in the preview.";

	const cs = raw.match(/"change_summary"\s*:\s*"((?:\\.|[^"\\])*)"/);
	const at = raw.match(/"assistant_text"\s*:\s*"((?:\\.|[^"\\])*)"/);
	if (cs?.[1]) {
		try {
			change_summary = JSON.parse(`"${cs[1]}"`);
		} catch {
			change_summary = cs[1];
		}
	}
	if (at?.[1]) {
		try {
			assistant_text = JSON.parse(`"${at[1]}"`);
		} catch {
			assistant_text = at[1];
		}
	}

	return { html: doc, change_summary, assistant_text };
}

export function parseCompAnalysisResponse(raw: string): NebCompAnalysisOutput {
	const stripped = stripCodeFences(raw);
	try {
		return parseJsonFromModel(stripped, compAnalysisOutputSchema);
	} catch (firstErr) {
		const obj = extractFirstJsonObject(stripped);
		if (obj) {
			try {
				return compAnalysisOutputSchema.parse(JSON.parse(obj));
			} catch {
				/* fall through */
			}
		}
		const preview = stripped.slice(0, 300).replace(/\s+/g, " ");
		throw new Error(
			`Comp analyzer: could not parse JSON. ${firstErr instanceof Error ? firstErr.message : ""} Preview: ${preview}…`,
		);
	}
}

export function compAnalysisToPlan(comp: NebCompAnalysisOutput): NebPlannerOutput {
	return {
		archetype: "promotional",
		subject: comp.exact_copy.subject || "Your update",
		preheader: comp.exact_copy.preheader || "",
		assistant_summary: `Faithful HTML implementation of the approved creative comp (${comp.sections.length} sections).`,
		image_slots: comp.image_slots ?? [],
		copy_strategy: [comp.layout_blueprint, comp.typography]
			.filter(Boolean)
			.join("\n\n"),
	};
}

export function parsePlannerResponse(raw: string): NebPlannerOutput {
	const stripped = stripCodeFences(raw);
	try {
		const parsed = parseJsonFromModel(stripped, plannerOutputSchema);
		return parsed;
	} catch (firstErr) {
		const obj = extractFirstJsonObject(stripped);
		if (obj) {
			try {
				const loose = JSON.parse(obj) as Record<string, unknown>;
				const slots = Array.isArray(loose.image_slots)
					? loose.image_slots
					: [];
				const parsedSlots = slots
					.map((s) => imageSlotSchema.safeParse(s))
					.filter((r) => r.success)
					.map((r) => r.data!);

				return plannerOutputSchema.parse({
					archetype: String(loose.archetype ?? "promotional"),
					subject: String(loose.subject ?? "Your update"),
					preheader: String(loose.preheader ?? ""),
					assistant_summary: String(
						loose.assistant_summary ?? "Building your email.",
					),
					image_slots: parsedSlots,
					copy_strategy:
						typeof loose.copy_strategy === "string"
							? loose.copy_strategy
							: undefined,
				});
			} catch {
				/* fall through */
			}
		}
		const preview = stripped.slice(0, 300).replace(/\s+/g, " ");
		throw new Error(
			`Planner: could not parse JSON. ${firstErr instanceof Error ? firstErr.message : ""} Preview: ${preview}…`,
		);
	}
}

export const HTML_DELIMITER_INSTRUCTION = `
OUTPUT FORMAT (mandatory — do NOT put HTML inside a JSON string):

${HTML_START}
<!DOCTYPE html>
... your complete email document ...
${HTML_END}

${META_START}
{"change_summary":"one line","assistant_text":"friendly message to the user"}
${META_END}

Rules:
- The HTML block is raw HTML only (no JSON escaping).
- The meta block is small valid JSON only (no markdown fences).
- Do not output anything else outside these blocks.`;

/**
 * Extended delimiter format for direct builds — includes subject, preheader,
 * and image_slots in the meta block so we don't need a separate spec step.
 */
export const HTML_DIRECT_BUILD_DELIMITER_INSTRUCTION = `
OUTPUT FORMAT (mandatory — do NOT put HTML inside a JSON string):

${HTML_START}
<!DOCTYPE html>
... your complete email document ...
${HTML_END}

${META_START}
{
  "subject": "under 60 chars — specific, compelling email subject line",
  "preheader": "under 90 chars — preview text that extends the subject",
  "change_summary": "one line summary of what was built",
  "assistant_text": "friendly 1-2 sentence message to the user",
  "image_slots": [
    {
      "key": "hero",
      "kind": "photo",
      "prompt": "detailed image generation prompt — subject, scene, mood, colors, NO TEXT, NO LOGOS, NO WATERMARKS",
      "alt": "alt text",
      "aspectRatio": "16:9",
      "imageSize": "2K"
    },
    {
      "key": "icon_checkmark",
      "kind": "icon",
      "prompt": "minimal flat checkmark icon, solid green stroke, no text, no background elements",
      "alt": "Checkmark icon",
      "aspectRatio": "1:1",
      "imageSize": "1K",
      "backgroundColor": "#F0FDF4"
    }
  ]
}
${META_END}

Rules:
- The HTML block is raw HTML only (no JSON escaping). ZERO emoji characters in the HTML.
- The meta block is valid JSON with ALL fields populated.
- image_slots: include one entry per {{NEB_IMG:key}} placeholder used in the HTML.
- For icons (kind "icon"): set backgroundColor to the EXACT hex of the section <td> background behind the icon (metadata only — never repeat that hex in the prompt). Icon prompt describes ONLY the icon — no background, no scene, no text, no hex codes.
- For photos (kind "photo"): lifestyle/product scene prompt, end with NO TEXT, NO LOGOS, NO WATERMARKS.
- Do not output anything else outside these blocks.`;

/** Parse the extended direct-build output (includes subject, preheader, image_slots). */
export function parseDirectBuildResponse(raw: string): NebDirectBuildOutput {
	const stripped = stripCodeFences(raw);

	// Parse HTML block
	const htmlFromDelim = extractHtmlDocument(stripped);

	// Parse META block (extended with subject/preheader/image_slots)
	const metaMatch = stripped.match(
		new RegExp(
			`${escapeRe(META_START)}\\s*([\\s\\S]*?)\\s*${escapeRe(META_END)}`,
			"i",
		),
	);

	const defaults: Omit<NebDirectBuildOutput, "html"> = {
		change_summary: "Email generated",
		assistant_text: "Your email is ready in the preview tab.",
		subject: undefined,
		preheader: undefined,
		image_slots: [],
	};

	let meta = { ...defaults };

	if (metaMatch?.[1]) {
		try {
			const jsonStr = extractFirstJsonObject(metaMatch[1].trim()) ?? metaMatch[1].trim();
			const parsed = JSON.parse(jsonStr) as Record<string, unknown>;
			meta = {
				change_summary:
					typeof parsed.change_summary === "string"
						? parsed.change_summary
						: defaults.change_summary,
				assistant_text:
					typeof parsed.assistant_text === "string"
						? parsed.assistant_text
						: defaults.assistant_text,
				subject: typeof parsed.subject === "string" ? parsed.subject : undefined,
				preheader: typeof parsed.preheader === "string" ? parsed.preheader : undefined,
				image_slots: Array.isArray(parsed.image_slots)
					? (parsed.image_slots as NebDirectBuildOutput["image_slots"])
					: [],
			};
		} catch {
			/* keep defaults */
		}
	}

	if (htmlFromDelim && htmlFromDelim.length > 100) {
		const candidate = { html: htmlFromDelim, ...meta };
		const validated = directBuildOutputSchema.safeParse(candidate);
		if (validated.success) return validated.data;
		// Schema failed but we have HTML — return with defaults merged
		return { html: htmlFromDelim, ...meta };
	}

	// Fallback: raw HTML document only
	const doc = extractHtmlDocument(stripped);
	if (doc && doc.length > 100) {
		return { html: doc, ...meta };
	}

	const preview = stripped.slice(0, 400).replace(/\s+/g, " ");
	throw new Error(`Direct build: could not parse model output. Preview: ${preview}…`);
}
