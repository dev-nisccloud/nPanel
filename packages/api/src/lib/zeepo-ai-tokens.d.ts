export declare function isZeepoAiAgencyUser(role: string | null | undefined): boolean;
declare function formatTokenBalance(n: number): string;
export type ZeepoAiTokenBalanceResult = {
    subscriptionId: string;
    subscriptionUsageId: string;
    tokens: number;
};
export declare function getZeepoAiTokensForTeam(teamId: string): Promise<ZeepoAiTokenBalanceResult | null>;
export type ZeepoAiBillingContext = {
    teamId: string | null;
    userId: string;
    userRole: string | null | undefined;
    sessionId?: string | null;
};
export declare function shouldBillZeepoAiTokens(ctx: ZeepoAiBillingContext): boolean;
export declare function assertZeepoAiCanStartTurn(ctx: ZeepoAiBillingContext): Promise<void>;
export type DebitZeepoAiTokensParams = {
    teamId: string;
    userId: string;
    tokens: number;
    operationType: string;
    description?: string;
    sessionId?: string | null;
    generationId?: string | null;
    usageEventId?: string | null;
    providerRequestId?: string | null;
    modelId?: string | null;
    providerCostUsdMicros?: number | null;
    metadata?: Record<string, unknown>;
};
export declare function debitZeepoAiTokens(params: DebitZeepoAiTokensParams): Promise<{
    tokensDebited: number;
    balanceAfter: number;
} | null>;
/** Require a successful full debit (or agency bypass). Throws if wallet cannot cover amount. */
export declare function debitZeepoAiTokensOrThrow(params: DebitZeepoAiTokensParams & {
    userRole?: string | null;
}): Promise<{
    tokensDebited: number;
    balanceAfter: number;
} | null>;
export type CreditZeepoAiTokensParams = {
    teamId: string;
    userId: string;
    tokens: number;
    operationType: string;
    description?: string;
    metadata?: Record<string, unknown>;
};
export declare function creditZeepoAiTokens(params: CreditZeepoAiTokensParams): Promise<{
    balanceAfter: number;
} | null>;
/** Agency monitoring row  no balance change, tokens recorded as 0. */
export declare function logZeepoAiAgencyUsage(params: {
    teamId: string | null;
    userId: string;
    sessionId?: string | null;
    usageEventId?: string | null;
    operationType: string;
    modelId: string;
    providerRequestId?: string | null;
    providerCostUsdMicros?: number | null;
    estimatedTokens: number;
    metadata?: Record<string, unknown>;
}): Promise<void>;
export declare function listZeepoAiTokenLedger(params: {
    teamId: string;
    limit?: number;
}): Promise<{
    id: string;
    createdAt: Date;
    description: string | null;
    modelId: string | null;
    operationType: string;
    direction: string;
    tokens: string;
    balanceAfter: string;
}[]>;
export { formatTokenBalance as formatZeepoAiTokenBalance };
