import { z } from "zod";
export const zeepoAgentModelCategorySchema = z.enum([
    "text",
    "image",
    "video",
    "audio",
    "background-remover",
]);
export const createSessionSchema = z.object({
    title: z.string().optional(),
    teamId: z.string().optional(),
});
export const listSessionsSchema = z.object({
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(50).default(20),
    teamId: z.string().optional(),
});
export const getSessionSchema = z.object({
    id: z.string(),
});
export const deleteSessionSchema = z.object({
    id: z.string(),
});
export const attachmentSchema = z.object({
    url: z.string().url(),
    name: z.string().max(200),
    mimeType: z.string().max(100),
    /** Object-storage key when uploaded via MinIO/S3 - used for cleanup on session delete. */
    storageKey: z.string().max(512).optional(),
});
export const sendMessageSchema = z.object({
    sessionId: z.string(),
    content: z.string().min(1),
    /** When set, server applies skill-specific guidance for this turn and stores it on the user message. */
    skillId: z.string().optional(),
    /** Image/file attachments the user added to this message. Stored in metadata and surfaced to the model. */
    attachments: z.array(attachmentSchema).max(4).optional(),
});
export const getGenerationSchema = z.object({
    generationId: z.string(),
});
export const updateSessionTitleSchema = z.object({
    id: z.string(),
    title: z.string().min(1).max(150).trim(),
});
export const generateSessionTitleSchema = z.object({
    sessionId: z.string(),
});
// ── Image edit history ────────────────────────────────────────────────────────
export const listImageEditHistorySchema = z.object({
    generationId: z.string(),
});
export const saveEditedImageSchema = z.object({
    sessionId: z.string(),
    generationId: z.string(),
    parentId: z.string().optional(),
    imageUrl: z.string().url(),
    operationType: z
        .enum([
        "original",
        "instruction",
        "style",
        "erase",
        "background_swap",
        "upscale",
        "text_edit",
        "variation",
    ])
        .default("instruction"),
    label: z.string().max(120).optional(),
    prompt: z.string().max(1000).optional(),
    metadata: z.record(z.unknown()).optional(),
});
// ── Style transfer ────────────────────────────────────────────────────────────
export const STYLE_PRESETS = [
    "watercolor",
    "oil_painting",
    "cinematic",
    "anime",
    "pixel_art",
    "neon",
    "pencil_sketch",
    "vintage",
];
export const styleTransferSchema = z.object({
    sessionId: z.string(),
    generationId: z.string(),
    parentId: z.string().optional(),
    imageUrl: z.string().url(),
    style: z.enum(STYLE_PRESETS),
    /** Custom prompt override (used when style is omitted). */
    customPrompt: z.string().max(500).optional(),
    outputFormat: z.enum(["webp", "png"]).default("webp"),
    resolution: z.enum(["1 MP", "2 MP"]).default("1 MP"),
});
// ── Object erase ──────────────────────────────────────────────────────────────
export const eraseObjectSchema = z.object({
    sessionId: z.string(),
    generationId: z.string(),
    parentId: z.string().optional(),
    imageUrl: z.string().url(),
    /**
     * Base64 PNG data URL of the brush mask drawn by the user.
     * White pixels = erase this area, black = preserve.
     */
    maskDataUrl: z.string().min(1),
});
// ── Background swap ───────────────────────────────────────────────────────────
export const BG_PRESETS = [
    "studio_white",
    "gradient_blue",
    "outdoor_park",
    "office_desk",
    "abstract_dark",
    "sunset_beach",
];
export const swapBackgroundSchema = z.object({
    sessionId: z.string(),
    generationId: z.string(),
    parentId: z.string().optional(),
    imageUrl: z.string().url(),
    /** Natural-language description of the desired background. */
    bgPrompt: z.string().min(1).max(500).trim(),
    /** Optional preset key (for labelling history entries). */
    bgPreset: z.enum(BG_PRESETS).optional(),
});
// ── Upscale ───────────────────────────────────────────────────────────────────
export const upscaleImageSchema = z.object({
    sessionId: z.string(),
    generationId: z.string(),
    parentId: z.string().optional(),
    imageUrl: z.string().url(),
});
// ── Text edit ─────────────────────────────────────────────────────────────────
export const editTextSchema = z.object({
    sessionId: z.string(),
    generationId: z.string(),
    parentId: z.string().optional(),
    imageUrl: z.string().url(),
    /** What text to change and how, e.g. "Change 'SALE' to 'SOLD OUT'". */
    prompt: z.string().min(1).max(500).trim(),
});
// ── Variations ────────────────────────────────────────────────────────────────
export const generateVariationsSchema = z.object({
    sessionId: z.string(),
    generationId: z.string(),
    parentId: z.string().optional(),
    imageUrl: z.string().url(),
    /** Optional extra instruction to apply to each variation. */
    prompt: z.string().max(500).optional(),
    outputFormat: z.enum(["webp", "png"]).default("webp"),
});
// ── Per-edit instruction edit (updated) ───────────────────────────────────────
export const imageEditSchema = z.object({
    sessionId: z.string(),
    /** The generation this edit applies to - used to persist history. */
    generationId: z.string().optional(),
    /** The parent history entry this was derived from. */
    parentId: z.string().optional(),
    imageUrl: z.string().url(),
    prompt: z.string().min(1).max(1000).trim(),
    /**
     * Base64 PNG data URL of the brush mask drawn by the user.
     * When present the prompt is prefixed with a region-specific instruction.
     */
    maskDataUrl: z.string().optional(),
    outputFormat: z.enum(["webp", "png"]).default("webp"),
    resolution: z.enum(["1 MP", "2 MP"]).default("1 MP"),
});
