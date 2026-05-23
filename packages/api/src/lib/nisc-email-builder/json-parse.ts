import type { z } from "zod";

export function stripCodeFences(raw: string): string {
	let t = raw.trim();
	// Strip leading fence (```json or ```)
	t = t.replace(/^```(?:json|javascript|text)?\s*/i, "");
	// Strip trailing fence
	t = t.replace(/\s*```\s*$/s, "");
	return t.trim();
}

/**
 * Strip ALL markdown code fences from any position in the string.
 * Handles the case where the model wraps output in code fences even
 * when prefixed with other characters.
 */
export function stripAllCodeFences(raw: string): string {
	return raw
		.replace(/```(?:json|javascript|text)?\s*/gi, "")
		.replace(/```\s*/g, "")
		.trim();
}

/**
 * Try to extract a complete JSON object starting at `start` position in `s`.
 * Returns the object string if a balanced object is found, otherwise null.
 */
function tryExtractAt(s: string, start: number): string | null {
	let depth = 0;
	let inString = false;
	let escape = false;
	let stringQuote: string | null = null;
	for (let i = start; i < s.length; i++) {
		const ch = s[i]!;
		if (escape) { escape = false; continue; }
		if (ch === "\\" && inString) { escape = true; continue; }
		if (!inString && (ch === '"' || ch === "'")) {
			inString = true; stringQuote = ch; continue;
		}
		if (inString && stringQuote && ch === stringQuote) {
			inString = false; stringQuote = null; continue;
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

/**
 * Try every `{` in the string as a potential JSON object start.
 * Returns the first candidate that is syntactically balanced.
 */
export function extractAllJsonObjects(s: string): string[] {
	const results: string[] = [];
	let pos = 0;
	while (pos < s.length) {
		const start = s.indexOf("{", pos);
		if (start < 0) break;
		const candidate = tryExtractAt(s, start);
		if (candidate) results.push(candidate);
		pos = start + 1;
	}
	return results;
}

/** @deprecated Use extractAllJsonObjects. Kept for backwards compatibility. */
export function extractFirstJsonObject(s: string): string | null {
	return extractAllJsonObjects(s)[0] ?? null;
}

/**
 * Repair common JSON issues that LLMs produce:
 * 1. Literal newlines inside string values (replace with \n)
 * 2. Trailing commas before } or ]
 */
export function repairJson(raw: string): string {
	let result = "";
	let inStr = false;
	let esc = false;
	for (let i = 0; i < raw.length; i++) {
		const ch = raw[i]!;
		if (esc) { result += ch; esc = false; continue; }
		if (ch === "\\" && inStr) { result += ch; esc = true; continue; }
		if (ch === '"') { inStr = !inStr; result += ch; continue; }
		if (inStr && ch === "\n") { result += "\\n"; continue; }
		if (inStr && ch === "\r") { result += "\\r"; continue; }
		if (inStr && ch === "\t") { result += "\\t"; continue; }
		result += ch;
	}
	// Remove trailing commas
	return result.replace(/,\s*([}\]])/g, "$1");
}

export async function collectReplicateText(output: unknown): Promise<string> {
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
	throw new Error(`Unexpected Replicate text output: ${typeof output}`);
}

export function parseJsonFromModel<T>(
	raw: string,
	schema: z.ZodType<T>,
): T {
	// Build a set of candidate strings to try, in order of confidence
	const variants: string[] = [];

	// 1. Strip outermost code fence (handles ``` at start/end)
	variants.push(stripCodeFences(raw));

	// 2. Strip ALL code fences from anywhere (handles {```json{...}``` pattern)
	variants.push(stripAllCodeFences(raw));

	// 3. Raw as-is
	variants.push(raw.trim());

	const candidates: string[] = [];
	for (const v of variants) {
		// Each variant: try the whole string, all extracted objects, and repaired versions
		candidates.push(v);
		candidates.push(repairJson(v));
		for (const obj of extractAllJsonObjects(v)) {
			candidates.push(obj);
			candidates.push(repairJson(obj));
		}
	}

	// Deduplicate while preserving order
	const seen = new Set<string>();
	const deduped = candidates.filter((c) => {
		if (!c || seen.has(c)) return false;
		seen.add(c);
		return true;
	});

	for (const candidate of deduped) {
		try {
			const parsed = JSON.parse(candidate);
			const result = schema.safeParse(parsed);
			if (result.success) return result.data;
		} catch {
			/* try next */
		}
	}

	console.error(
		"[parseJsonFromModel] All candidates failed. Raw output (first 800 chars):\n",
		raw.slice(0, 800),
	);
	throw new Error("Could not parse model JSON output");
}
