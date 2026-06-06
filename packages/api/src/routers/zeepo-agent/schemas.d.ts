import { z } from "zod";
export declare const zeepoAgentModelCategorySchema: z.ZodEnum<{
    image: "image";
    video: "video";
    text: "text";
    audio: "audio";
    "background-remover": "background-remover";
}>;
export declare const createSessionSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    teamId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const listSessionsSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    teamId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const getSessionSchema: z.ZodObject<{
    id: z.ZodString;
}, z.core.$strip>;
export declare const deleteSessionSchema: z.ZodObject<{
    id: z.ZodString;
}, z.core.$strip>;
export declare const attachmentSchema: z.ZodObject<{
    url: z.ZodString;
    name: z.ZodString;
    mimeType: z.ZodString;
}, z.core.$strip>;
export type Attachment = z.infer<typeof attachmentSchema>;
export declare const sendMessageSchema: z.ZodObject<{
    sessionId: z.ZodString;
    content: z.ZodString;
    skillId: z.ZodOptional<z.ZodString>;
    attachments: z.ZodOptional<z.ZodArray<z.ZodObject<{
        url: z.ZodString;
        name: z.ZodString;
        mimeType: z.ZodString;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export declare const getGenerationSchema: z.ZodObject<{
    generationId: z.ZodString;
}, z.core.$strip>;
export declare const updateSessionTitleSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
}, z.core.$strip>;
export declare const generateSessionTitleSchema: z.ZodObject<{
    sessionId: z.ZodString;
}, z.core.$strip>;
export declare const listImageEditHistorySchema: z.ZodObject<{
    generationId: z.ZodString;
}, z.core.$strip>;
export declare const saveEditedImageSchema: z.ZodObject<{
    sessionId: z.ZodString;
    generationId: z.ZodString;
    parentId: z.ZodOptional<z.ZodString>;
    imageUrl: z.ZodString;
    operationType: z.ZodDefault<z.ZodEnum<{
        style: "style";
        instruction: "instruction";
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
export type StylePreset = (typeof STYLE_PRESETS)[number];
export declare const styleTransferSchema: z.ZodObject<{
    sessionId: z.ZodString;
    generationId: z.ZodString;
    parentId: z.ZodOptional<z.ZodString>;
    imageUrl: z.ZodString;
    style: z.ZodEnum<{
        anime: "anime";
        cinematic: "cinematic";
        watercolor: "watercolor";
        oil_painting: "oil_painting";
        pixel_art: "pixel_art";
        neon: "neon";
        pencil_sketch: "pencil_sketch";
        vintage: "vintage";
    }>;
    customPrompt: z.ZodOptional<z.ZodString>;
    outputFormat: z.ZodDefault<z.ZodEnum<{
        webp: "webp";
        png: "png";
    }>>;
    resolution: z.ZodDefault<z.ZodEnum<{
        "1 MP": "1 MP";
        "2 MP": "2 MP";
    }>>;
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
    outputFormat: z.ZodDefault<z.ZodEnum<{
        webp: "webp";
        png: "png";
    }>>;
}, z.core.$strip>;
export declare const imageEditSchema: z.ZodObject<{
    sessionId: z.ZodString;
    generationId: z.ZodOptional<z.ZodString>;
    parentId: z.ZodOptional<z.ZodString>;
    imageUrl: z.ZodString;
    prompt: z.ZodString;
    maskDataUrl: z.ZodOptional<z.ZodString>;
    outputFormat: z.ZodDefault<z.ZodEnum<{
        webp: "webp";
        png: "png";
    }>>;
    resolution: z.ZodDefault<z.ZodEnum<{
        "1 MP": "1 MP";
        "2 MP": "2 MP";
    }>>;
}, z.core.$strip>;
