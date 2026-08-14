/**
 * Official Gemini Developer API image pricing (paid / standard tier).
 * Source: https://ai.google.dev/gemini-api/docs/pricing
 *
 * Cost =
 *   (inputTokens / 1M) * inputUsdPerMTok
 * + (thoughtTokens / 1M) * thinkingUsdPerMTok
 * + (imageOutputTokens / 1M) * imageOutputUsdPerMTok
 */
export type ZeepoAiGeminiImageSize = "0.5K" | "1K" | "2K" | "4K";
export type ZeepoAiGeminiUsageLike = {
    inputTokens?: number | null;
    thoughtTokens?: number | null;
    /** Non-image text/output tokens when split; usually image pixels live here too. */
    outputTokens?: number | null;
    totalTokens?: number | null;
    /** When Google reports image tokens separately. */
    imageOutputTokens?: number | null;
};
export type ZeepoAiGeminiPriceTier = {
    inputUsdPerMTok: number;
    thinkingUsdPerMTok: number;
    imageOutputUsdPerMTok: number;
    /** Fixed image-token counts by resolution (official docs). */
    imageTokensBySize: Partial<Record<ZeepoAiGeminiImageSize, number>>;
};
/** gemini-3.1-flash-image (Nano Banana 2) */
export declare const ZEEPO_AI_GEMINI_FLASH_IMAGE_PRICES: ZeepoAiGeminiPriceTier;
/** gemini-3.1-flash-lite-image (Nano Banana 2 Lite) */
export declare const ZEEPO_AI_GEMINI_FLASH_LITE_IMAGE_PRICES: ZeepoAiGeminiPriceTier;
/** gemini-3-pro-image (Nano Banana Pro) */
export declare const ZEEPO_AI_GEMINI_PRO_IMAGE_PRICES: ZeepoAiGeminiPriceTier;
export declare function resolveZeepoAiGeminiImagePrices(modelId: string): ZeepoAiGeminiPriceTier;
export declare function resolveZeepoAiGeminiImageSizeForModel(modelId: string): ZeepoAiGeminiImageSize;
/**
 * Normalize Interactions / generateContent usage shapes into a single structure.
 * Official Interactions fields: total_input_tokens, total_output_tokens,
 * total_thought_tokens, total_tokens, output_tokens_by_modality.
 * @see https://ai.google.dev/gemini-api/docs/interactions/tokens
 */
export declare function normalizeZeepoAiGeminiUsage(raw: unknown): ZeepoAiGeminiUsageLike | null;
/**
 * Split billed buckets for image models.
 * Official billing (paid standard): input @ input rate, thoughts @ text/thinking rate,
 * image pixels @ image rate. Interactions returns thoughts separately from output.
 * @see https://ai.google.dev/gemini-api/docs/pricing
 */
export declare function splitZeepoAiGeminiImageUsage(params: {
    usage: ZeepoAiGeminiUsageLike | null | undefined;
    modelId: string;
    imageSize?: ZeepoAiGeminiImageSize;
}): {
    inputTokens: number;
    thoughtTokens: number;
    imageOutputTokens: number;
    /** Shown as "Out" in Activity: thoughts + image output. */
    outputTokensForDisplay: number;
};
/** Convert Gemini image usage → provider USD micros (1 USD = 1_000_000). */
export declare function estimateZeepoAiGeminiImageCostUsdMicros(params: {
    modelId: string;
    usage?: ZeepoAiGeminiUsageLike | null;
    imageSize?: ZeepoAiGeminiImageSize;
}): number;
