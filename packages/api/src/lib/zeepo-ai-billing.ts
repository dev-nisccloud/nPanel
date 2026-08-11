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

/** Approximate Anthropic Sonnet 4.5 list prices (USD per million tokens).
 * @see https://platform.claude.com/docs/en/about-claude/pricing
 */
export const ZEEPO_AI_PRICE_USD_PER_MTOK = {
	input: 3,
	output: 15,
	/** Cache hit / refresh  0.1× base input. */
	cacheRead: 0.3,
	/** 5-minute ephemeral cache write  1.25× base input. */
	cacheWrite5m: 3.75,
	/** 1-hour ephemeral cache write  2× base input. */
	cacheWrite1h: 6,
	/** @deprecated Prefer cacheWrite5m; kept for older call sites. */
	cacheWrite: 3.75,
} as const;

/** Web search tool: USD per 1,000 searches (Anthropic list). Web fetch has no per-call fee. */
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

export type AnthropicCacheCreationLike = {
	ephemeral_5m_input_tokens?: number | null;
	ephemeral_1h_input_tokens?: number | null;
};

export type AnthropicUsageLike = {
	input_tokens?: number | null;
	output_tokens?: number | null;
	cache_creation_input_tokens?: number | null;
	cache_read_input_tokens?: number | null;
	/** Preferred when present  splits 5m vs 1h write rates. */
	cache_creation?: AnthropicCacheCreationLike | null;
	server_tool_use?: {
		web_search_requests?: number | null;
		web_fetch_requests?: number | null;
	} | null;
};

/** Normalize Anthropic usage + merge delta/final snapshots. */
export function mergeAnthropicUsage(
	prev: AnthropicUsageLike,
	next: AnthropicUsageLike | null | undefined,
): AnthropicUsageLike {
	if (!next) return prev;
	const cacheCreation = next.cache_creation ?? prev.cache_creation;
	return {
		input_tokens: next.input_tokens ?? prev.input_tokens,
		output_tokens: next.output_tokens ?? prev.output_tokens,
		cache_creation_input_tokens:
			next.cache_creation_input_tokens ?? prev.cache_creation_input_tokens,
		cache_read_input_tokens:
			next.cache_read_input_tokens ?? prev.cache_read_input_tokens,
		cache_creation: cacheCreation
			? {
					ephemeral_5m_input_tokens:
						cacheCreation.ephemeral_5m_input_tokens ??
						prev.cache_creation?.ephemeral_5m_input_tokens,
					ephemeral_1h_input_tokens:
						cacheCreation.ephemeral_1h_input_tokens ??
						prev.cache_creation?.ephemeral_1h_input_tokens,
				}
			: prev.cache_creation,
		server_tool_use: next.server_tool_use ?? prev.server_tool_use,
	};
}

function splitCacheWriteTokens(usage: AnthropicUsageLike): {
	cacheWrite5m: number;
	cacheWrite1h: number;
} {
	const five =
		usage.cache_creation?.ephemeral_5m_input_tokens ?? null;
	const oneHour =
		usage.cache_creation?.ephemeral_1h_input_tokens ?? null;
	if (five != null || oneHour != null) {
		return {
			cacheWrite5m: five ?? 0,
			cacheWrite1h: oneHour ?? 0,
		};
	}
	// Legacy flat field  Anthropic default TTL is 5 minutes.
	return {
		cacheWrite5m: usage.cache_creation_input_tokens ?? 0,
		cacheWrite1h: 0,
	};
}

/** Convert Anthropic usage → provider USD micros (1 USD = 1_000_000). */
export function estimateZeepoAiProviderCostUsdMicros(usage: AnthropicUsageLike): number {
	const input = usage.input_tokens ?? 0;
	const output = usage.output_tokens ?? 0;
	const cacheRead = usage.cache_read_input_tokens ?? 0;
	const { cacheWrite5m, cacheWrite1h } = splitCacheWriteTokens(usage);
	const searches = usage.server_tool_use?.web_search_requests ?? 0;

	const usd =
		(input / 1_000_000) * ZEEPO_AI_PRICE_USD_PER_MTOK.input +
		(output / 1_000_000) * ZEEPO_AI_PRICE_USD_PER_MTOK.output +
		(cacheWrite5m / 1_000_000) * ZEEPO_AI_PRICE_USD_PER_MTOK.cacheWrite5m +
		(cacheWrite1h / 1_000_000) * ZEEPO_AI_PRICE_USD_PER_MTOK.cacheWrite1h +
		(cacheRead / 1_000_000) * ZEEPO_AI_PRICE_USD_PER_MTOK.cacheRead +
		(searches / 1000) * ZEEPO_AI_WEB_SEARCH_USD_PER_1K;

	return Math.max(0, Math.round(usd * 1_000_000));
}

/** Fields we persist on usage-event metadata for audits / Activity. */
export function anthropicUsageBillingMeta(usage: AnthropicUsageLike): Record<string, unknown> {
	const { cacheWrite5m, cacheWrite1h } = splitCacheWriteTokens(usage);
	return {
		cacheReadInputTokens: usage.cache_read_input_tokens ?? 0,
		cacheCreationInputTokens: usage.cache_creation_input_tokens ?? 0,
		cacheWrite5mTokens: cacheWrite5m,
		cacheWrite1hTokens: cacheWrite1h,
		webSearchRequests: usage.server_tool_use?.web_search_requests ?? 0,
		webFetchRequests: usage.server_tool_use?.web_fetch_requests ?? 0,
		pricingSource: "https://platform.claude.com/docs/en/about-claude/pricing",
	};
}

/** Map provider USD micros → customer tokens to debit. */
export function providerMicrosToCustomerTokens(micros: number): number {
	if (!Number.isFinite(micros) || micros <= 0) return 0;
	const usd = micros / 1_000_000;
	const tokens = usd / ZEEPO_AI_INTERNAL_USD_PER_TOKEN;
	return Math.max(1, Math.ceil(tokens * 100) / 100);
}
