/**
 * Official Gemini Developer API image pricing (paid / standard tier).
 * Source: https://ai.google.dev/gemini-api/docs/pricing
 *
 * Cost =
 *   (inputTokens / 1M) * inputUsdPerMTok
 * + (thoughtTokens / 1M) * thinkingUsdPerMTok
 * + (imageOutputTokens / 1M) * imageOutputUsdPerMTok
 */
/** gemini-3.1-flash-image (Nano Banana 2) */
export const ZEEPO_AI_GEMINI_FLASH_IMAGE_PRICES = {
    inputUsdPerMTok: 0.5,
    thinkingUsdPerMTok: 3,
    imageOutputUsdPerMTok: 60,
    imageTokensBySize: {
        "0.5K": 747,
        "1K": 1120,
        "2K": 1680,
        "4K": 2520,
    },
};
/** gemini-3.1-flash-lite-image (Nano Banana 2 Lite) */
export const ZEEPO_AI_GEMINI_FLASH_LITE_IMAGE_PRICES = {
    inputUsdPerMTok: 0.25,
    thinkingUsdPerMTok: 1.5,
    imageOutputUsdPerMTok: 30,
    imageTokensBySize: {
        "1K": 1120,
    },
};
/** gemini-3-pro-image (Nano Banana Pro) */
export const ZEEPO_AI_GEMINI_PRO_IMAGE_PRICES = {
    inputUsdPerMTok: 2,
    thinkingUsdPerMTok: 12,
    imageOutputUsdPerMTok: 120,
    imageTokensBySize: {
        "1K": 1120,
        "2K": 1120,
        "4K": 2000,
    },
};
export function resolveZeepoAiGeminiImagePrices(modelId) {
    const id = modelId.toLowerCase();
    if (id.includes("lite"))
        return ZEEPO_AI_GEMINI_FLASH_LITE_IMAGE_PRICES;
    if (id.includes("pro"))
        return ZEEPO_AI_GEMINI_PRO_IMAGE_PRICES;
    // gemini-2.5-flash-image (legacy Nano Banana)  $30/MTok image, 1290 @ 1K
    if (id.includes("2.5") && id.includes("flash-image")) {
        return {
            inputUsdPerMTok: 0.3,
            thinkingUsdPerMTok: 2.5,
            imageOutputUsdPerMTok: 30,
            imageTokensBySize: { "1K": 1290 },
        };
    }
    return ZEEPO_AI_GEMINI_FLASH_IMAGE_PRICES;
}
export function resolveZeepoAiGeminiImageSizeForModel(modelId) {
    return modelId.toLowerCase().includes("lite") ? "1K" : "2K";
}
function n(v) {
    const x = typeof v === "number" ? v : Number(v);
    return Number.isFinite(x) && x > 0 ? x : 0;
}
/** Pull IMAGE modality tokens from Interactions / generateContent usage. */
function modalityImageTokens(raw) {
    const buckets = [
        raw.output_tokens_by_modality,
        raw.outputTokensByModality,
        raw.candidates_tokens_details,
        raw.candidatesTokensDetails,
    ];
    for (const bucket of buckets) {
        if (!Array.isArray(bucket))
            continue;
        for (const row of bucket) {
            if (!row || typeof row !== "object")
                continue;
            const r = row;
            const modality = String(r.modality ?? r.type ?? "").toLowerCase();
            if (modality === "image") {
                return n(r.tokens ?? r.token_count ?? r.tokenCount);
            }
        }
    }
    return 0;
}
/**
 * Normalize Interactions / generateContent usage shapes into a single structure.
 * Official Interactions fields: total_input_tokens, total_output_tokens,
 * total_thought_tokens, total_tokens, output_tokens_by_modality.
 * @see https://ai.google.dev/gemini-api/docs/interactions/tokens
 */
export function normalizeZeepoAiGeminiUsage(raw) {
    if (!raw || typeof raw !== "object")
        return null;
    const u = raw;
    const inputTokens = n(u.total_input_tokens ??
        u.totalInputTokens ??
        u.input_tokens ??
        u.inputTokens ??
        u.prompt_token_count ??
        u.promptTokenCount);
    const thoughtTokens = n(u.total_thought_tokens ??
        u.totalThoughtTokens ??
        u.thoughts_tokens ??
        u.thoughtsTokens ??
        u.thought_token_count ??
        u.thoughtTokenCount ??
        u.thinking_tokens ??
        u.thinkingTokens);
    const outputTokens = n(u.total_output_tokens ??
        u.totalOutputTokens ??
        u.output_tokens ??
        u.outputTokens ??
        u.candidates_token_count ??
        u.candidatesTokenCount);
    const imageOutputTokens = n(u.image_output_tokens ??
        u.imageOutputTokens ??
        u.total_image_tokens ??
        u.totalImageTokens) || modalityImageTokens(u);
    const totalTokens = n(u.total_tokens ?? u.totalTokens);
    if (!inputTokens && !thoughtTokens && !outputTokens && !imageOutputTokens && !totalTokens) {
        return null;
    }
    return {
        inputTokens: inputTokens || null,
        thoughtTokens: thoughtTokens || null,
        outputTokens: outputTokens || null,
        imageOutputTokens: imageOutputTokens || null,
        totalTokens: totalTokens || null,
    };
}
/**
 * Split billed buckets for image models.
 * Official billing (paid standard): input @ input rate, thoughts @ text/thinking rate,
 * image pixels @ image rate. Interactions returns thoughts separately from output.
 * @see https://ai.google.dev/gemini-api/docs/pricing
 */
export function splitZeepoAiGeminiImageUsage(params) {
    const prices = resolveZeepoAiGeminiImagePrices(params.modelId);
    const size = params.imageSize ?? resolveZeepoAiGeminiImageSizeForModel(params.modelId);
    const expectedImage = prices.imageTokensBySize[size] ?? prices.imageTokensBySize["1K"] ?? 1120;
    const usage = params.usage;
    const inputTokens = n(usage?.inputTokens);
    const thoughtTokens = n(usage?.thoughtTokens);
    const reportedOutput = n(usage?.outputTokens);
    let imageOutputTokens = n(usage?.imageOutputTokens);
    if (!imageOutputTokens) {
        if (reportedOutput > 0 && thoughtTokens > 0) {
            // Official Interactions shape: thoughts separate; output is image (+ any text).
            imageOutputTokens = reportedOutput;
        }
        else if (reportedOutput > 0) {
            // Output may include thinking when thoughtTokens omitted.
            imageOutputTokens =
                reportedOutput >= expectedImage ? expectedImage : reportedOutput;
        }
        else {
            imageOutputTokens = expectedImage;
        }
    }
    let thoughts = thoughtTokens;
    if (!thoughts && reportedOutput > imageOutputTokens) {
        thoughts = reportedOutput - imageOutputTokens;
    }
    return {
        inputTokens,
        thoughtTokens: thoughts,
        imageOutputTokens,
        outputTokensForDisplay: thoughts + imageOutputTokens,
    };
}
/** Convert Gemini image usage → provider USD micros (1 USD = 1_000_000). */
export function estimateZeepoAiGeminiImageCostUsdMicros(params) {
    const prices = resolveZeepoAiGeminiImagePrices(params.modelId);
    const split = splitZeepoAiGeminiImageUsage({
        usage: params.usage,
        modelId: params.modelId,
        imageSize: params.imageSize,
    });
    const usd = (split.inputTokens / 1_000_000) * prices.inputUsdPerMTok +
        (split.thoughtTokens / 1_000_000) * prices.thinkingUsdPerMTok +
        (split.imageOutputTokens / 1_000_000) * prices.imageOutputUsdPerMTok;
    return Math.max(1, Math.round(usd * 1_000_000));
}
