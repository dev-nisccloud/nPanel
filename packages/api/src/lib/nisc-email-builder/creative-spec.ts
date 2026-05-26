import { z } from "zod";

import { parseJsonFromModel, stripCodeFences } from "./json-parse";
import {
	buildCreativeSpecContinuationSystemPrompt,
	buildCreativeSpecContinuationUserPrompt,
	buildCreativeSpecSystemPrompt,
	buildCreativeSpecUserPrompt,
	SPEC_END_MARKER,
	SPEC_META_END,
	SPEC_META_START,
	SPEC_START_MARKER,
} from "./prompts-build";
import { runAnthropicOnReplicate } from "./replicate-llm";
import { NEB_SPEC_MODEL } from "./constants";
import type { NebBrief } from "./types";
import { imageSlotSchema } from "./types";
import type Replicate from "replicate";

const specMetaSchema = z.object({
	subject: z.string().default("Your update"),
	preheader: z.string().default(""),
	image_slots: z.array(imageSlotSchema).default([]),
});

export type CreativeDesignSpec = {
	designSpecification: string;
	subject: string;
	preheader: string;
	imageSlots: z.infer<typeof imageSlotSchema>[];
};

function extractBetween(raw: string, start: string, end: string): string | null {
	const startIdx = raw.indexOf(start);
	if (startIdx < 0) return null;
	const contentStart = startIdx + start.length;
	const endIdx = raw.indexOf(end, contentStart);
	if (endIdx < 0) return null;
	return raw.slice(contentStart, endIdx).trim();
}

function parseSpecMeta(raw: string): z.infer<typeof specMetaSchema> {
	const metaBlock =
		extractBetween(raw, SPEC_META_START, SPEC_META_END) ??
		extractBetween(raw, "```json", "```") ??
		"";

	if (metaBlock) {
		try {
			return specMetaSchema.parse(JSON.parse(metaBlock));
		} catch {
			const parsed = parseJsonFromModel(metaBlock, specMetaSchema);
			return parsed;
		}
	}

	// Fallback: find JSON object with image_slots anywhere in response
	const jsonMatch = raw.match(/\{[\s\S]*"image_slots"[\s\S]*\}/);
	if (jsonMatch) {
		try {
			return specMetaSchema.parse(JSON.parse(jsonMatch[0]));
		} catch {
			/* fall through */
		}
	}

	return { subject: "Your update", preheader: "", image_slots: [] };
}

function extractSpecBody(raw: string): string {
	const stripped = stripCodeFences(raw);
	const delimited = extractBetween(stripped, SPEC_START_MARKER, SPEC_END_MARKER);
	if (delimited) return delimited;

	// Partial first chunk before end marker
	const startIdx = stripped.indexOf(SPEC_START_MARKER);
	if (startIdx >= 0) {
		return stripped.slice(startIdx + SPEC_START_MARKER.length).trim();
	}

	// Continuation chunk (no start marker)
	return stripped.replace(SPEC_END_MARKER, "").trim();
}

function isSpecComplete(raw: string): boolean {
	return raw.includes(SPEC_END_MARKER);
}

const MAX_SPEC_CONTINUATIONS = 4;

export async function generateCreativeDesignSpec(params: {
	replicate: Replicate;
	brief: NebBrief;
	brandBlock: string;
	creativeDesignUrl: string;
	designNotes?: string;
	webContext?: string | null;
}): Promise<CreativeDesignSpec> {
	let combinedRaw = "";
	let specText = "";

	for (let round = 0; round <= MAX_SPEC_CONTINUATIONS; round++) {
		const isContinuation = round > 0;
		const raw = await runAnthropicOnReplicate({
			replicate: params.replicate,
			model: NEB_SPEC_MODEL,
			systemPrompt: isContinuation
				? buildCreativeSpecContinuationSystemPrompt()
				: buildCreativeSpecSystemPrompt(),
			userPrompt: isContinuation
				? buildCreativeSpecContinuationUserPrompt({
						partialSpec: specText,
						creativeDesignUrl: params.creativeDesignUrl,
					})
				: buildCreativeSpecUserPrompt({
						brief: params.brief,
						brandBlock: params.brandBlock,
						creativeDesignUrl: params.creativeDesignUrl,
						designNotes: params.designNotes,
						webContext: params.webContext,
					}),
			imageUrl: params.creativeDesignUrl,
			maxTokens: 16384,
		});

		combinedRaw += `\n${raw}`;
		const chunk = extractSpecBody(raw);
		specText = isContinuation ? `${specText}\n${chunk}` : chunk;

		if (isSpecComplete(combinedRaw)) break;
		if (round === MAX_SPEC_CONTINUATIONS) break;
	}

	if (!specText.trim()) {
		throw new Error("Creative design specification was empty");
	}

	const meta = parseSpecMeta(combinedRaw);

	return {
		designSpecification: specText.trim(),
		subject: meta.subject,
		preheader: meta.preheader,
		imageSlots: meta.image_slots,
	};
}
