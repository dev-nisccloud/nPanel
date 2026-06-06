import Replicate from "replicate";
export type NanoBananaAspectRatio = "1:1" | "2:3" | "3:2" | "3:4" | "4:3" | "4:5" | "5:4" | "9:16" | "16:9" | "21:9";
export type NanoBananaInput = {
    prompt: string;
    resolution?: "1K" | "2K";
    aspectRatio?: NanoBananaAspectRatio;
    outputFormat?: "png" | "jpg";
    imageInput?: string[];
};
/**
 * google/nano-banana-pro - creative mockups and email asset imagery.
 */
export declare function generateNanoBananaPro(replicate: Replicate, input: NanoBananaInput): Promise<{
    fileUrl: string;
    storageKey?: string;
}>;
