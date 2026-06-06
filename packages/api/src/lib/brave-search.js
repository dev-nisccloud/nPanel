/**
 * Brave Search LLM Context API client.
 * Docs: https://api.search.brave.com/app/documentation/llm-context/get-started
 *
 * Provides real-time web grounding optimised for LLM consumption.
 * The response is pre-extracted and chunked - no scraping needed.
 */
/**
 * Exhaustive set of country codes accepted by Brave's LLM Context API.
 * Any code outside this list will be silently dropped from the request to avoid 422s.
 * Regions not in this list (e.g. Kenya, most of Africa) should instead be embedded
 * directly in the query string (e.g. "luxury cars Nairobi Kenya market 2026").
 */
const BRAVE_SUPPORTED_COUNTRIES = new Set([
    "AR", "AU", "AT", "BE", "BR", "CA", "CL", "DK", "FI", "FR",
    "DE", "GR", "HK", "IN", "ID", "IT", "JP", "KR", "MY", "MX",
    "NL", "NZ", "NO", "CN", "PL", "PT", "PH", "RU", "SA", "ZA",
    "ES", "SE", "CH", "TW", "TR", "GB", "US",
]);
/** Maps our friendly depth label to Brave context-size params from the docs. */
const DEPTH_CONFIG = {
    // Simple factual lookups - fast, low cost.
    quick: {
        count: 5,
        maximum_number_of_tokens: 2048,
        maximum_number_of_urls: 5,
        maximum_number_of_snippets: 15,
    },
    // Standard queries - default for most tool calls.
    standard: {
        count: 20,
        maximum_number_of_tokens: 8192,
        maximum_number_of_urls: 10,
        maximum_number_of_snippets: 40,
    },
    // Complex research - broader coverage.
    deep: {
        count: 50,
        maximum_number_of_tokens: 16384,
        maximum_number_of_urls: 20,
        maximum_number_of_snippets: 80,
    },
};
/**
 * Call Brave LLM Context endpoint and return a compact, LLM-ready grounding
 * string that can be dropped directly into a tool result message.
 */
export async function callBraveLlmContext(params) {
    const { apiKey, query, depth = "standard", freshness, country, goggles } = params;
    const cfg = DEPTH_CONFIG[depth];
    // Only include country when Brave supports it; unsupported regions (e.g. most of Africa)
    // cause a 422 - include geography in the query string instead.
    const safeCountry = country && BRAVE_SUPPORTED_COUNTRIES.has(country.toUpperCase())
        ? country.toUpperCase()
        : undefined;
    const body = {
        q: query,
        count: cfg.count,
        maximum_number_of_tokens: cfg.maximum_number_of_tokens,
        maximum_number_of_urls: cfg.maximum_number_of_urls,
        maximum_number_of_snippets: cfg.maximum_number_of_snippets,
        context_threshold_mode: "balanced",
        ...(freshness ? { freshness } : {}),
        ...(safeCountry ? { country: safeCountry } : {}),
        ...(goggles ? { goggles } : {}),
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
        throw new Error(`Brave Search API error ${res.status}${text ? `: ${text.slice(0, 300)}` : ""}`);
    }
    const data = (await res.json());
    return formatGroundingForLlm(query, data);
}
function safeHostname(url) {
    try {
        return new URL(url).hostname;
    }
    catch {
        return url;
    }
}
/**
 * Convert the Brave response into a compact, structured block the LLM
 * can read directly. Each source lists its snippets inline.
 */
function formatGroundingForLlm(query, data) {
    const entries = data.grounding?.generic ?? [];
    if (entries.length === 0) {
        return `WEB SEARCH: "${query}"\n(No relevant results found for this query.)`;
    }
    const lines = [
        `WEB SEARCH RESULTS for "${query}" (${entries.length} source${entries.length !== 1 ? "s" : ""}):`,
        "",
    ];
    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        const meta = data.sources?.[entry.url];
        const hostname = meta?.hostname ?? safeHostname(entry.url);
        const age = meta?.age?.[0] ?? null;
        lines.push(`[${i + 1}] ${entry.title}`);
        lines.push(`    Source: ${hostname} - ${entry.url}`);
        if (age)
            lines.push(`    Published: ${age}`);
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
/** Identifier prefix in stored tool results - used by the UI to hide them. */
export const BRAVE_SEARCH_RESULT_PREFIX = "WEB SEARCH";
