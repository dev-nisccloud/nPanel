/**
 * Build the per-model Replicate `input` object from the generic
 * { prompt, inputs } that we persist per generation.
 *
 * Different Replicate models expect different field names for the
 * primary text content. For example:
 *  - Most image/video models:                  `prompt`
 *  - MiniMax speech models (speech-2.8-hd,
 *    speech-2.8-turbo, speech-02-hd):          `text`
 *  - Qwen3 TTS (qwen/qwen3-tts):               `text` (with extra `mode`/`speaker`/`language`)
 *
 * When the orchestrator (or canvas UI) hands us a generic `prompt`
 * for an audio/TTS model, we map it to the correct field and merge
 * sensible per-model defaults so we don't 422 on missing required
 * inputs.
 *
 * Unknown models fall back to the legacy behavior (`{...inputs, prompt}`).
 */
export declare function buildReplicateInput(params: {
    modelId: string;
    prompt: string | null | undefined;
    inputs: unknown;
}): Record<string, unknown>;
