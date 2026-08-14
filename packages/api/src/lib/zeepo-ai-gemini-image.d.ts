import { type ZeepoAiGeminiUsageLike } from "./zeepo-ai-gemini-pricing";
export declare const ZEEPO_AI_IMAGE_PROVIDER: "google";
export declare const ZEEPO_AI_IMAGE_MODELS: {
    readonly pro: string;
    readonly flash: string;
    readonly lite: string;
};
export type ZeepoAiImageIntent = "design" | "logo" | "mockup" | "photo" | "draft" | "suite" | "edit";
export type ZeepoAiAspectRatio = "1:1" | "1:4" | "4:1" | "1:8" | "8:1" | "2:3" | "3:2" | "3:4" | "4:3" | "4:5" | "5:4" | "9:16" | "16:9" | "21:9";
export type ZeepoAiImageRef = {
    dataBase64: string;
    mimeType: string;
};
export type ZeepoAiImageResult = {
    buffer: Buffer;
    mimeType: string;
    interactionId: string | null;
    modelId: string;
    imageSize: "0.5K" | "1K" | "2K" | "4K";
    usage?: ZeepoAiGeminiUsageLike;
};
/** Pick model by intent / volume. Never expose model names to end users. */
export declare function pickZeepoAiImageModel(params: {
    intent?: ZeepoAiImageIntent | string | null;
    count?: number;
    hasReferences?: boolean;
    needsEdit?: boolean;
}): string;
export declare function createZeepoAiImage(params: {
    prompt: string;
    modelId?: string;
    aspectRatio?: ZeepoAiAspectRatio | string;
    mimeType?: "image/png" | "image/jpeg";
    references?: ZeepoAiImageRef[];
    previousInteractionId?: string | null;
    intent?: ZeepoAiImageIntent | string;
    signal?: AbortSignal;
}): Promise<ZeepoAiImageResult>;
export declare function editZeepoAiImage(params: {
    prompt: string;
    sourceImage: ZeepoAiImageRef;
    maskImage?: ZeepoAiImageRef | null;
    modelId?: string;
    aspectRatio?: ZeepoAiAspectRatio | string;
    mimeType?: "image/png" | "image/jpeg";
    previousInteractionId?: string | null;
}): Promise<ZeepoAiImageResult>;
export declare function persistZeepoAiImageBuffer(params: {
    buffer: Buffer;
    mimeType: string;
    userId?: string;
    fileName?: string;
}): Promise<{
    fileUrl: string;
    storageKey: string;
}>;
/** Run async work with a concurrency cap. */
export declare function mapWithConcurrency<T, R>(items: T[], concurrency: number, fn: (item: T, index: number) => Promise<R>): Promise<R[]>;
export declare function fetchImageAsRef(url: string, opts?: {
    signal?: AbortSignal;
}): Promise<ZeepoAiImageRef>;
