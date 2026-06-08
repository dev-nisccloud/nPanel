/**
 * Brave Search LLM Context API client.
 * Docs: https://api.search.brave.com/app/documentation/llm-context/get-started
 *
 * Provides real-time web grounding optimised for LLM consumption.
 * The response is pre-extracted and chunked - no scraping needed.
 */
export type BraveSearchDepth = "quick" | "standard" | "deep";
export type BraveSearchFreshness = "pd" | "pw" | "pm" | "py";
export interface BraveSearchParams {
    apiKey: string;
    query: string;
    depth?: BraveSearchDepth;
    freshness?: BraveSearchFreshness;
    country?: string;
    /** Inline goggle rules, e.g. `$discard\\n$site=example.com` */
    goggles?: string;
}
/**
 * Call Brave LLM Context endpoint and return a compact, LLM-ready grounding
 * string that can be dropped directly into a tool result message.
 */
export declare function callBraveLlmContext(params: BraveSearchParams): Promise<string>;
/** Identifier prefix in stored tool results - used by the UI to hide them. */
export declare const BRAVE_SEARCH_RESULT_PREFIX = "WEB SEARCH";
