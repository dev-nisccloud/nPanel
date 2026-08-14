export declare function isZeepoAgentAgencyUser(role: string | null | undefined): boolean;
export type ZeepoAgentTokenBalanceResult = {
    subscriptionId: string;
    subscriptionUsageId: string;
    tokens: number;
};
/** Active Zeepo AI Agent subscription + token usage row for a team.
 *  Source of truth for balance: `nisc_client_subscription_usage.credits` (usage_kind zeepo_agent_tokens).
 *  `zeepo_agent_token_ledger` is audit history only - editing it does not change the live balance.
 */
export declare function getZeepoAgentTokensForTeam(teamId: string): Promise<ZeepoAgentTokenBalanceResult | null>;
export type ZeepoBillingContext = {
    teamId: string | null;
    userId: string;
    userRole: string | null | undefined;
    sessionId?: string | null;
};
/** True when token billing applies for this request. */
export declare function shouldBillZeepoAgentTokens(ctx: ZeepoBillingContext): boolean;
/** Pre-flight: block customer turns when balance is too low. */
export declare function assertZeepoAgentCanStartTurn(ctx: ZeepoBillingContext): Promise<void>;
/** Returns false when a mid-turn operation should stop (balance exhausted). */
export declare function zeepoAgentHasTokensRemaining(teamId: string, minTokens?: number): Promise<boolean>;
export type DebitZeepoTokensParams = {
    teamId: string;
    userId: string;
    tokens: number;
    operationType: string;
    description?: string;
    sessionId?: string | null;
    generationId?: string | null;
    predictionId?: string | null;
    modelId?: string | null;
    providerCostUsdMicros?: number | null;
    metadata?: Record<string, unknown>;
};
export type DebitZeepoTokensResult = {
    tokensDebited: number;
    balanceAfter: number;
};
/** Debit tokens after a successful billable operation. No-op for zero/negative amounts. */
export declare function debitZeepoAgentTokens(params: DebitZeepoTokensParams): Promise<DebitZeepoTokensResult | null>;
export type CreditZeepoTokensParams = {
    teamId: string;
    userId: string;
    tokens: number;
    operationType: string;
    description?: string;
    metadata?: Record<string, unknown>;
};
/** Add tokens (top-up, subscription grant). */
export declare function creditZeepoAgentTokens(params: CreditZeepoTokensParams): Promise<{
    balanceAfter: number;
} | null>;
export type SetZeepoTokenBalanceParams = {
    teamId: string;
    userId: string;
    tokens: number;
    operationType: string;
    description?: string;
    metadata?: Record<string, unknown>;
};
/** Set token balance to an exact amount (agency overrides, admin adjustments). */
export declare function setZeepoAgentTokenBalance(params: SetZeepoTokenBalanceParams): Promise<{
    balanceAfter: number;
} | null>;
export declare function listZeepoAgentTokenLedger(params: {
    teamId: string;
    limit?: number;
}): Promise<{
    id: string;
    createdAt: Date;
    description: string | null;
    operationType: string;
    direction: string;
    tokens: string;
    balanceAfter: string;
}[]>;
