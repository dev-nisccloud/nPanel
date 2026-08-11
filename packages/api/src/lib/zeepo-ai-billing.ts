/**
 * Zeepo AI (direct Claude chat)  customer token billing constants.
 *
 * PAYG only: users buy token packs; no fixed monthly subscription tiers.
 * Agency roles are unlimited but usage is still logged for monitoring.
 */

/** Stable product id  seeded by apps/server/src/scripts/seed-zeepo-ai-product.ts */
export const ZEEPO_AI_PRODUCT_ID = "zeepo-ai";

/** Subscription usage row kind for token balance. */
export const ZEEPO_AI_USAGE_KIND = "zeepo_ai_tokens";

/**
 * Internal mapping: 1 customer token ≈ this many USD of provider cost.
 * Never expose this ratio in the UI.
 */
export const ZEEPO_AI_INTERNAL_USD_PER_TOKEN = 0.01;

/** Anthropic provider label stored on usage/ledger rows (internal only). */
export const ZEEPO_AI_PROVIDER = "anthropic";

/** Default Messages API model  overridable via env / future UI picker. */
export const ZEEPO_AI_DEFAULT_MODEL = "claude-sonnet-4-5";

export function resolveZeepoAiModelId(requested?: string | null): string {
	const fromEnv = process.env.ZEEPO_AI_CHAT_MODEL_ID?.trim();
	const candidate = requested?.trim() || fromEnv || ZEEPO_AI_DEFAULT_MODEL;
	return candidate;
}

/** Approximate Anthropic Sonnet 4.5 list prices (USD per million tokens). */
export const ZEEPO_AI_PRICE_USD_PER_MTOK = {
	input: 3,
	output: 15,
	cacheRead: 0.3,
	cacheWrite: 3.75,
} as const;

/** Web search tool: USD per 1,000 searches (Anthropic list). */
export const ZEEPO_AI_WEB_SEARCH_USD_PER_1K = 10;

export type ZeepoAiPlanType = "top_up" | "pay_as_you_go";

export const ZEEPO_AI_PLAN_IDS = {
	topUp500: "zeepo-ai-plan-topup-500",
	topUp1500: "zeepo-ai-plan-topup-1500",
	topUp5000: "zeepo-ai-plan-topup-5000",
	payAsYouGo: "zeepo-ai-plan-payg",
} as const;

/** Minimum token balance required before starting a billable turn (customers). */
export const ZEEPO_AI_MIN_TOKENS_TO_START = 25;

/** One-time welcome grant for first-time Zeepo AI customers with an existing service. */
export const ZEEPO_AI_WELCOME_TOKEN_GRANT = 100;

export type AnthropicUsageLike = {
	input_tokens?: number | null;
	output_tokens?: number | null;
	cache_creation_input_tokens?: number | null;
	cache_read_input_tokens?: number | null;
	server_tool_use?: {
		web_search_requests?: number | null;
		web_fetch_requests?: number | null;
	} | null;
};

/** Convert Anthropic usage → provider USD micros (1 USD = 1_000_000). */
export function estimateZeepoAiProviderCostUsdMicros(usage: AnthropicUsageLike): number {
	const input = usage.input_tokens ?? 0;
	const output = usage.output_tokens ?? 0;
	const cacheWrite = usage.cache_creation_input_tokens ?? 0;
	const cacheRead = usage.cache_read_input_tokens ?? 0;
	const searches = usage.server_tool_use?.web_search_requests ?? 0;

	const usd =
		(input / 1_000_000) * ZEEPO_AI_PRICE_USD_PER_MTOK.input +
		(output / 1_000_000) * ZEEPO_AI_PRICE_USD_PER_MTOK.output +
		(cacheWrite / 1_000_000) * ZEEPO_AI_PRICE_USD_PER_MTOK.cacheWrite +
		(cacheRead / 1_000_000) * ZEEPO_AI_PRICE_USD_PER_MTOK.cacheRead +
		(searches / 1000) * ZEEPO_AI_WEB_SEARCH_USD_PER_1K;

	return Math.max(0, Math.round(usd * 1_000_000));
}

/** Map provider USD micros → customer tokens to debit. */
export function providerMicrosToCustomerTokens(micros: number): number {
	if (!Number.isFinite(micros) || micros <= 0) return 0;
	const usd = micros / 1_000_000;
	const tokens = usd / ZEEPO_AI_INTERNAL_USD_PER_TOKEN;
	return Math.max(1, Math.ceil(tokens * 100) / 100);
}
