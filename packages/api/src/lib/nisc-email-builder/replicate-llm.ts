import Replicate from "replicate";
import { collectReplicateText } from "./json-parse";

export async function runAnthropicOnReplicate(params: {
	replicate: Replicate;
	model: string;
	systemPrompt: string;
	userPrompt: string;
	maxTokens?: number;
	/** Public image URL for vision-capable Anthropic models on Replicate. */
	imageUrl?: string;
	/** Prefill the assistant turn — forces the model to continue from this string.
	 *  Pass "{" to prevent any preamble before the JSON object. */
	prefill?: string;
}): Promise<string> {
	const {
		replicate,
		model,
		systemPrompt,
		userPrompt,
		maxTokens = 8192,
		imageUrl,
		prefill,
	} = params;
	const output = await replicate.run(model as `${string}/${string}`, {
		input: {
			system_prompt: systemPrompt,
			prompt: userPrompt,
			max_tokens: maxTokens,
			...(imageUrl ? { image: imageUrl } : {}),
			...(prefill ? { assistant_prefill: prefill } : {}),
		},
	});
	const text = await collectReplicateText(output);
	// If we prefilled, the model continues from that prefix — prepend it back
	return prefill ? `${prefill}${text}` : text;
}
