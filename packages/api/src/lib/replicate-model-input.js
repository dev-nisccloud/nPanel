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
function pickString(v) {
    return typeof v === "string" && v.trim() !== "" ? v : undefined;
}
function pickNumber(v) {
    if (typeof v === "number" && Number.isFinite(v))
        return v;
    if (typeof v === "string" && v.trim() !== "") {
        const n = Number(v);
        if (Number.isFinite(n))
            return n;
    }
    return undefined;
}
function pickBoolean(v) {
    if (typeof v === "boolean")
        return v;
    if (typeof v === "string") {
        if (v === "true")
            return true;
        if (v === "false")
            return false;
    }
    return undefined;
}
function stripVersion(modelId) {
    const i = modelId.indexOf(":");
    return i >= 0 ? modelId.slice(0, i) : modelId;
}
const MINIMAX_SPEECH_IDS = new Set([
    "minimax/speech-2.8-hd",
    "minimax/speech-2.8-turbo",
    "minimax/speech-02-hd",
]);
/** Nano Banana model family - uses image_input[] instead of reference_image_url. */
const NANO_BANANA_IDS = new Set([
    "google/nano-banana-pro",
    "google/nano-banana-2",
    "google/nano-banana",
]);
export function buildReplicateInput(params) {
    const { modelId, prompt, inputs } = params;
    const baseId = stripVersion(modelId);
    const userInputs = inputs && typeof inputs === "object" && !Array.isArray(inputs)
        ? inputs
        : {};
    const promptText = typeof prompt === "string" ? prompt.trim() : "";
    if (MINIMAX_SPEECH_IDS.has(baseId)) {
        const text = pickString(userInputs.text) ?? promptText;
        const voiceId = pickString(userInputs.voice_id) ?? pickString(userInputs.voice);
        return {
            text,
            voice_id: voiceId ?? "Wise_Woman",
            pitch: pickNumber(userInputs.pitch) ?? 0,
            speed: pickNumber(userInputs.speed) ?? 1,
            volume: pickNumber(userInputs.volume) ?? 1,
            bitrate: pickNumber(userInputs.bitrate) ?? 128_000,
            channel: pickString(userInputs.channel) ?? "mono",
            emotion: pickString(userInputs.emotion) ?? "auto",
            sample_rate: pickNumber(userInputs.sample_rate) ?? 32_000,
            audio_format: pickString(userInputs.audio_format) ?? "mp3",
            language_boost: pickString(userInputs.language_boost) ?? "None",
            subtitle_enable: pickBoolean(userInputs.subtitle_enable) ?? false,
            english_normalization: pickBoolean(userInputs.english_normalization) ?? false,
        };
    }
    if (baseId === "qwen/qwen3-tts") {
        const text = pickString(userInputs.text) ?? promptText;
        const speaker = pickString(userInputs.speaker) ?? pickString(userInputs.voice);
        return {
            mode: pickString(userInputs.mode) ?? "custom_voice",
            text,
            speaker: speaker ?? "Aiden",
            language: pickString(userInputs.language) ?? "auto",
        };
    }
    // Nano Banana family uses image_input: string[] instead of reference_image_url.
    if (NANO_BANANA_IDS.has(baseId)) {
        // Collect reference image URL from either the canonical field or a pre-built array.
        const refUrl = pickString(userInputs.reference_image_url);
        const existingArr = Array.isArray(userInputs.image_input)
            ? userInputs.image_input.filter((v) => typeof v === "string")
            : [];
        const imageInput = refUrl && !existingArr.includes(refUrl)
            ? [...existingArr, refUrl]
            : existingArr;
        // Build clean input, mapping our generic fields to nano-banana's schema.
        const out = {};
        out.prompt = promptText || "";
        if (userInputs.aspect_ratio)
            out.aspect_ratio = userInputs.aspect_ratio;
        if (userInputs.output_format)
            out.output_format = userInputs.output_format;
        if (userInputs.negative_prompt)
            out.negative_prompt = userInputs.negative_prompt;
        if (userInputs.seed != null)
            out.seed = userInputs.seed;
        // nano-banana-pro specific
        out.image_input = imageInput;
        out.safety_filter_level =
            pickString(userInputs.safety_filter_level) ?? "block_only_high";
        out.allow_fallback_model =
            pickBoolean(userInputs.allow_fallback_model) ?? false;
        if (userInputs.resolution)
            out.resolution = userInputs.resolution;
        return out;
    }
    const out = { ...userInputs };
    if (promptText !== "") {
        out.prompt = promptText;
    }
    else if (typeof out.prompt !== "string") {
        out.prompt = "";
    }
    return out;
}
