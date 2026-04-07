import type { BackgroundRemoverJobResult } from "./types";
/**
 * Enqueue a background-removal job for processing via QStash.
 * Delivers immediately (no schedule); worker processes at once.
 */
export declare function enqueueBackgroundRemoval(generationId: string): Promise<BackgroundRemoverJobResult>;
