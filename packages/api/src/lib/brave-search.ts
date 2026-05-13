/**
 * Brave Search LLM Context API client.
 * Docs: https://api.search.brave.com/app/documentation/llm-context/get-started
 *
 * Provides real-time web grounding optimised for LLM consumption.
 * The response is pre-extracted and chunked — no scraping needed.
 */

export type BraveSearchDepth = "quick" | "standard" | "deep";
export type BraveSearchFreshness = "pd" | "pw" | "pm" | "py";

interface BraveGroundingEntry {
	url: string;
	title: string;
	snippets: string[];
}

interface BraveSearchResponse {
	grounding?: {
		generic?: BraveGroundingEntry[];
	};
	sources?: Record<
		string,
		{ title: string; hostname: string; age: string[] | null }
	>;
}

/** Maps our friendly depth label to Brave context-size params from the docs. */
const DEPTH_CONFIG: Record<
	BraveSearchDepth,
	{
		count: number;
		maximum_number_of_tokens: number;
		maximum_number_of_urls: number;
		maximum_number_of_snippets: number;
	}
> = {
	// Simple factual lookups — fast, low cost.
	quick: {
		count: 5,
		maximum_number_of_tokens: 2048,
		maximum_number_of_urls: 5,
		maximum_number_of_snippets: 15,
	},
	// Standard queries — default for most tool calls.
	standard: {
		count: 20,
		maximum_number_of_tokens: 8192,
		maximum_number_of_urls: 10,
		maximum_number_of_snippets: 40,
	},
	// Complex research — broader coverage.
	deep: {
		count: 50,
		maximum_number_of_tokens: 16384,
		maximum_number_of_urls: 20,
		maximum_number_of_snippets: 80,
	},
};

export interface BraveSearchParams {
	apiKey: string;
	query: string;
	depth?: BraveSearchDepth;
	freshness?: BraveSearchFreshness;
	country?: string;
}

/**
 * Call Brave LLM Context endpoint and return a compact, LLM-ready grounding
 * string that can be dropped directly into a tool result message.
 */
export async function callBraveLlmContext(
	params: BraveSearchParams,
): Promise<string> {
	const { apiKey, query, depth = "standard", freshness, country } = params;
	const cfg = DEPTH_CONFIG[depth];

	const body: Record<string, unknown> = {
		q: query,
		count: cfg.count,
		maximum_number_of_tokens: cfg.maximum_number_of_tokens,
		maximum_number_of_urls: cfg.maximum_number_of_urls,
		maximum_number_of_snippets: cfg.maximum_number_of_snippets,
		context_threshold_mode: "balanced",
		...(freshness ? { freshness } : {}),
		...(country ? { country } : {}),
	};

	const res = await fetch("https://api.search.brave.com/res/v1/llm/context", {
		method: "POST",
		headers: {
			accept: "application/json",
			"Accept-Encoding": "gzip",
			"Content-Type": "application/json",
			"X-Subscription-Token": apiKey,
		},
		body: JSON.stringify(body),
		signal: AbortSignal.timeout(30_000),
	});

	if (!res.ok) {
		const text = await res.text().catch(() => "");
		throw new Error(
			`Brave Search API error ${res.status}${text ? `: ${text.slice(0, 300)}` : ""}`,
		);
	}

	const data = (await res.json()) as BraveSearchResponse;
	return formatGroundingForLlm(query, data);
}

function safeHostname(url: string): string {
	try {
		return new URL(url).hostname;
	} catch {
		return url;
	}
}

/**
 * Convert the Brave response into a compact, structured block the LLM
 * can read directly. Each source lists its snippets inline.
 */
function formatGroundingForLlm(
	query: string,
	data: BraveSearchResponse,
): string {
	const entries = data.grounding?.generic ?? [];

	if (entries.length === 0) {
		return `WEB SEARCH: "${query}"\n(No relevant results found for this query.)`;
	}

	const lines: string[] = [
		`WEB SEARCH RESULTS for "${query}" (${entries.length} source${entries.length !== 1 ? "s" : ""}):`,
		"",
	];

	for (let i = 0; i < entries.length; i++) {
		const entry = entries[i]!;
		const meta = data.sources?.[entry.url];
		const hostname = meta?.hostname ?? safeHostname(entry.url);
		const age = meta?.age?.[0] ?? null;

		lines.push(`[${i + 1}] ${entry.title}`);
		lines.push(`    Source: ${hostname} — ${entry.url}`);
		if (age) lines.push(`    Published: ${age}`);

		const snippets = entry.snippets.slice(0, 5);
		for (const snippet of snippets) {
			// Collapse internal newlines and hard-cap per snippet to keep the
			// block digestible without losing meaning.
			const clean = snippet.replace(/\s+/g, " ").trim().slice(0, 600);
			lines.push(`    > ${clean}`);
		}
		lines.push("");
	}

	return lines.join("\n").trimEnd();
}

/** Identifier prefix in stored tool results — used by the UI to hide them. */
export const BRAVE_SEARCH_RESULT_PREFIX = "WEB SEARCH";
