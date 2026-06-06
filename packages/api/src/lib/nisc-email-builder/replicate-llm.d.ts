import Replicate from "replicate";
export declare function runAnthropicOnReplicate(params: {
    replicate: Replicate;
    model: string;
    systemPrompt: string;
    userPrompt: string;
    maxTokens?: number;
    /** Public image URL for vision-capable Anthropic models on Replicate. */
    imageUrl?: string;
    /** Prefill the assistant turn - forces the model to continue from this string.
     *  Pass "{" to prevent any preamble before the JSON object. */
    prefill?: string;
}): Promise<string>;
