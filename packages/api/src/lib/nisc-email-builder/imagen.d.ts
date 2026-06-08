import Replicate from "replicate";
export declare class NebImagePersistError extends Error {
    constructor(message: string, options?: {
        cause?: unknown;
    });
}
export declare function persistUrlToUploadThing(replicateUrl: string): Promise<{
    fileUrl: string;
    storageKey?: string;
}>;
export type Imagen4UltraInput = {
    prompt: string;
    imageSize?: "1K" | "2K";
    aspectRatio?: string;
    outputFormat?: "jpg" | "png";
    safetyFilterLevel?: "block_low_and_above" | "block_medium_and_above" | "block_only_high";
};
/**
 * google/imagen-4-ultra via Replicate predictions API.
 * Used for icon assets (sharp, clean rendering on any background color).
 */
export declare function generateImagen4Ultra(replicate: Replicate, input: Imagen4UltraInput): Promise<{
    fileUrl: string;
    storageKey?: string;
}>;
