import Replicate from "replicate";
import { collectReplicateText } from "./json-parse";
export async function runAnthropicOnReplicate(params) {
    const { replicate, model, systemPrompt, userPrompt, maxTokens = 8192, imageUrl, prefill, } = params;
    const output = await replicate.run(model, {
        input: {
            system_prompt: systemPrompt,
            prompt: userPrompt,
            max_tokens: maxTokens,
            ...(imageUrl ? { image: imageUrl } : {}),
            ...(prefill ? { assistant_prefill: prefill } : {}),
        },
    });
    const text = await collectReplicateText(output);
    // If we prefilled, the model continues from that prefix - prepend it back
    return prefill ? `${prefill}${text}` : text;
}
