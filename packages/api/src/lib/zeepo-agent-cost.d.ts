export type ReplicatePredictionMetrics = {
    predict_time?: number;
    total_time?: number;
    input_token_count?: number;
    output_token_count?: number;
    image_input_megapixel_count?: number;
    image_output_megapixel_count?: number;
    video_output_duration_seconds?: number;
    video_output_count?: number;
    character_input_count?: number;
    run_count?: number;
};
export declare function resolveBaseModelId(modelId: string): string;
export declare function estimateProviderCostUsd(params: {
    modelId: string;
    metrics?: ReplicatePredictionMetrics | null;
    output?: unknown;
    input?: Record<string, unknown> | null;
    logInputTokens?: number;
    logOutputTokens?: number;
}): number;
export declare function usdToZeepoTokens(usd: number): number;
export declare function usdToMicros(usd: number): number;
export declare function tokensFromPrediction(params: {
    modelId: string;
    metrics?: ReplicatePredictionMetrics | null;
    output?: unknown;
    input?: Record<string, unknown> | null;
    logInputTokens?: number;
    logOutputTokens?: number;
}): {
    tokens: number;
    providerCostUsd: number;
    providerCostUsdMicros: number;
};
