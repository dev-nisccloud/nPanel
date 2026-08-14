/**
 * Zeepo AI (direct Claude chat)  customer token billing constants.
 *
 * PAYG only: users buy token packs; no fixed monthly subscription tiers.
 * Agency roles are unlimited but usage is still logged for monitoring.
 */
/** Stable product id  seeded by apps/server/src/scripts/seed-zeepo-ai-product.ts */
export declare const ZEEPO_AI_PRODUCT_ID = "zeepo-ai";
/** Subscription usage row kind for token balance. */
export declare const ZEEPO_AI_USAGE_KIND = "zeepo_ai_tokens";
/**
 * Internal mapping: 1 customer token ≈ this many USD of provider cost.
 * Never expose this ratio in the UI.
 */
export declare const ZEEPO_AI_INTERNAL_USD_PER_TOKEN = 0.01;
/** Anthropic provider label stored on usage/ledger rows (internal only). */
export declare const ZEEPO_AI_PROVIDER = "anthropic";
/** Default Messages API model  overridable via env / future UI picker. */
export declare const ZEEPO_AI_DEFAULT_MODEL = "claude-sonnet-4-5";
export declare function resolveZeepoAiModelId(requested?: string | null): string;
/** Live AI Support never accepts a client-supplied model id. */
export declare function resolveZeepoAiSupportModelId(): string;
/** Approximate Anthropic Sonnet 4.5 list prices (USD per million tokens).
 * @see https://platform.claude.com/docs/en/about-claude/pricing
 */
export declare const ZEEPO_AI_PRICE_USD_PER_MTOK: {
    readonly input: 3;
    readonly output: 15;
    /** Cache hit / refresh  0.1× base input. */
    readonly cacheRead: 0.3;
    /** 5-minute ephemeral cache write  1.25× base input. */
    readonly cacheWrite5m: 3.75;
    /** 1-hour ephemeral cache write  2× base input. */
    readonly cacheWrite1h: 6;
    /** @deprecated Prefer cacheWrite5m; kept for older call sites. */
    readonly cacheWrite: 3.75;
};
/** Web search tool: USD per 1,000 searches (Anthropic list). Web fetch has no per-call fee. */
export declare const ZEEPO_AI_WEB_SEARCH_USD_PER_1K = 10;
export type ZeepoAiPlanType = "top_up" | "pay_as_you_go";
export declare const ZEEPO_AI_PLAN_IDS: {
    readonly topUp500: "zeepo-ai-plan-topup-500";
    readonly topUp1500: "zeepo-ai-plan-topup-1500";
    readonly topUp5000: "zeepo-ai-plan-topup-5000";
    readonly payAsYouGo: "zeepo-ai-plan-payg";
};
/** Minimum token balance required before starting a billable turn (customers). */
export declare const ZEEPO_AI_MIN_TOKENS_TO_START = 25;
/** One-time welcome grant for first-time Zeepo AI customers with an existing service. */
export declare const ZEEPO_AI_WELCOME_TOKEN_GRANT = 100;
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
export declare function mergeAnthropicUsage(prev: AnthropicUsageLike, next: AnthropicUsageLike | null | undefined): AnthropicUsageLike;
/** Convert Anthropic usage → provider USD micros (1 USD = 1_000_000). */
export declare function estimateZeepoAiProviderCostUsdMicros(usage: AnthropicUsageLike): number;
/** Fields we persist on usage-event metadata for audits / Activity. */
export declare function anthropicUsageBillingMeta(usage: AnthropicUsageLike): Record<string, unknown>;
/** Map provider USD micros → customer tokens to debit. */
export declare function providerMicrosToCustomerTokens(micros: number): number;
