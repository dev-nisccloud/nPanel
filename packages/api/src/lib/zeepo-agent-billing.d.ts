/**
 * Zeepo AI Agent - customer token billing constants.
 *
 * Backend stores and computes provider costs in USD (Replicate bills in USD).
 * Customer UI converts retail USD plan prices to KES via the same FX + ceil
 * strategy used for domains (`convertPriceWithCeil` / `ceilConvertedPrice`).
 *
 * Customer-facing balances are always "tokens" - never USD equivalents.
 */
/** Stable product id - seeded by apps/server/src/scripts/seed-zeepo-ai-agent-product.ts */
export declare const ZEEPO_AI_AGENT_PRODUCT_ID = "zeepo-ai-agent";
/** Subscription usage row kind for token balance on nisc_client_subscription_usage. */
export declare const ZEEPO_AGENT_USAGE_KIND = "zeepo_agent_tokens";
/**
 * Internal mapping: 1 token debited from customer balance ≈ this many USD of
 * provider cost. Never expose this ratio in the UI.
 */
export declare const ZEEPO_INTERNAL_USD_PER_TOKEN = 0.01;
/** Agent tools / operations that do not debit customer tokens (absorbed by us). */
export declare const ZEEPO_AGENT_FREE_OPERATIONS: readonly ["web_search", "check_domain_availability"];
export type ZeepoAgentFreeOperation = (typeof ZEEPO_AGENT_FREE_OPERATIONS)[number];
export type ZeepoAgentPlanType = "subscription" | "top_up" | "pay_as_you_go";
export declare const ZEEPO_AI_AGENT_PLAN_IDS: {
    readonly starter: "zeepo-ai-agent-plan-starter";
    readonly standard: "zeepo-ai-agent-plan-standard";
    readonly pro: "zeepo-ai-agent-plan-pro";
    readonly topUp500: "zeepo-ai-agent-plan-topup-500";
    readonly topUp1500: "zeepo-ai-agent-plan-topup-1500";
    readonly topUp5000: "zeepo-ai-agent-plan-topup-5000";
    readonly payAsYouGo: "zeepo-ai-agent-plan-payg";
};
/** Free tokens granted on customer signup (Starter plan, no invoice). */
export declare const ZEEPO_SIGNUP_WELCOME_TOKEN_GRANT = 100;
export declare function isZeepoAgentFreeOperation(name: string): name is ZeepoAgentFreeOperation;
/** Minimum token balance required before starting a billable agent turn (customer side). */
export declare const ZEEPO_AGENT_MIN_TOKENS_TO_START = 25;
