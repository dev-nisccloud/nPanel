import { z } from "zod";
export declare const generateImagesArgsSchema: z.ZodObject<{
    prompt: z.ZodOptional<z.ZodString>;
    prompts: z.ZodOptional<z.ZodArray<z.ZodString>>;
    count: z.ZodDefault<z.ZodNumber>;
    aspect_ratio: z.ZodDefault<z.ZodEnum<{
        "1:1": "1:1";
        "2:3": "2:3";
        "3:2": "3:2";
        "3:4": "3:4";
        "4:3": "4:3";
        "4:5": "4:5";
        "5:4": "5:4";
        "9:16": "9:16";
        "16:9": "16:9";
        "21:9": "21:9";
    }>>;
    intent: z.ZodDefault<z.ZodEnum<{
        design: "design";
        draft: "draft";
        photo: "photo";
        logo: "logo";
        mockup: "mockup";
        suite: "suite";
    }>>;
    reference_attachment_ids: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString>>>;
    title: z.ZodOptional<z.ZodString>;
    titles: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export type GenerateImagesArgs = z.infer<typeof generateImagesArgsSchema>;
/** Resolve per-slot prompts so multi-subject briefs do not all get the same collage prompt. */
export declare function resolveGenerateImageSlotPrompts(args: GenerateImagesArgs): {
    count: number;
    prompts: string[];
    titles: string[];
};
export declare const imagePresentationSlideSchema: z.ZodObject<{
    prompt: z.ZodString;
    caption: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
    imageUrl: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const createImagePresentationArgsSchema: z.ZodObject<{
    title: z.ZodString;
    slides: z.ZodArray<z.ZodObject<{
        prompt: z.ZodString;
        caption: z.ZodOptional<z.ZodString>;
        notes: z.ZodOptional<z.ZodString>;
        imageUrl: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    aspect_ratio: z.ZodDefault<z.ZodEnum<{
        "1:1": "1:1";
        "2:3": "2:3";
        "3:2": "3:2";
        "3:4": "3:4";
        "4:3": "4:3";
        "4:5": "4:5";
        "5:4": "5:4";
        "9:16": "9:16";
        "16:9": "16:9";
        "21:9": "21:9";
    }>>;
}, z.core.$strip>;
export type CreateImagePresentationArgs = z.infer<typeof createImagePresentationArgsSchema>;
/** Image edit schemas (Gemini-backed; Agent-parity surface). */
export declare const listZeepoAiImageEditHistorySchema: z.ZodObject<{
    generationId: z.ZodString;
}, z.core.$strip>;
export declare const saveZeepoAiEditedImageSchema: z.ZodObject<{
    sessionId: z.ZodString;
    generationId: z.ZodString;
    parentId: z.ZodOptional<z.ZodString>;
    imageUrl: z.ZodString;
    operationType: z.ZodDefault<z.ZodEnum<{
        instruction: "instruction";
        style: "style";
        original: "original";
        erase: "erase";
        background_swap: "background_swap";
        upscale: "upscale";
        text_edit: "text_edit";
        variation: "variation";
    }>>;
    label: z.ZodOptional<z.ZodString>;
    prompt: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.core.$ZodRecordKey, z.core.SomeType>>;
}, z.core.$strip>;
export declare const STYLE_PRESETS: readonly ["watercolor", "oil_painting", "cinematic", "anime", "pixel_art", "neon", "pencil_sketch", "vintage"];
export declare const styleTransferSchema: z.ZodObject<{
    sessionId: z.ZodString;
    generationId: z.ZodString;
    parentId: z.ZodOptional<z.ZodString>;
    imageUrl: z.ZodString;
    style: z.ZodEnum<{
        watercolor: "watercolor";
        oil_painting: "oil_painting";
        cinematic: "cinematic";
        anime: "anime";
        pixel_art: "pixel_art";
        neon: "neon";
        pencil_sketch: "pencil_sketch";
        vintage: "vintage";
    }>;
    customPrompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const eraseObjectSchema: z.ZodObject<{
    sessionId: z.ZodString;
    generationId: z.ZodString;
    parentId: z.ZodOptional<z.ZodString>;
    imageUrl: z.ZodString;
    maskDataUrl: z.ZodString;
}, z.core.$strip>;
export declare const BG_PRESETS: readonly ["studio_white", "gradient_blue", "outdoor_park", "office_desk", "abstract_dark", "sunset_beach"];
export declare const swapBackgroundSchema: z.ZodObject<{
    sessionId: z.ZodString;
    generationId: z.ZodString;
    parentId: z.ZodOptional<z.ZodString>;
    imageUrl: z.ZodString;
    bgPrompt: z.ZodString;
    bgPreset: z.ZodOptional<z.ZodEnum<{
        studio_white: "studio_white";
        gradient_blue: "gradient_blue";
        outdoor_park: "outdoor_park";
        office_desk: "office_desk";
        abstract_dark: "abstract_dark";
        sunset_beach: "sunset_beach";
    }>>;
}, z.core.$strip>;
export declare const upscaleImageSchema: z.ZodObject<{
    sessionId: z.ZodString;
    generationId: z.ZodString;
    parentId: z.ZodOptional<z.ZodString>;
    imageUrl: z.ZodString;
}, z.core.$strip>;
export declare const editTextSchema: z.ZodObject<{
    sessionId: z.ZodString;
    generationId: z.ZodString;
    parentId: z.ZodOptional<z.ZodString>;
    imageUrl: z.ZodString;
    prompt: z.ZodString;
}, z.core.$strip>;
export declare const generateVariationsSchema: z.ZodObject<{
    sessionId: z.ZodString;
    generationId: z.ZodString;
    parentId: z.ZodOptional<z.ZodString>;
    imageUrl: z.ZodString;
    prompt: z.ZodOptional<z.ZodString>;
    count: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip>;
export declare const instructImageEditSchema: z.ZodObject<{
    sessionId: z.ZodString;
    generationId: z.ZodString;
    parentId: z.ZodOptional<z.ZodString>;
    imageUrl: z.ZodString;
    prompt: z.ZodString;
    maskDataUrl: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
