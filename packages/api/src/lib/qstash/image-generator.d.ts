import type { ImageGeneratorJobResult } from "./types";
/**
 * Enqueue an image generation for background processing via QStash.
 * Delivers immediately (no schedule); worker processes at once.
 */
export declare function enqueueImageGeneration(generationId: string): Promise<ImageGeneratorJobResult>;
