import type { ZeepoCanvasJobResult } from "./types";
/**
 * Enqueue an AI generation job for Zeepo Canvas via QStash.
 * Delivers immediately. The worker will make the async request to Replicate.
 */
export declare function enqueueZeepoCanvasGeneration(generationId: string): Promise<ZeepoCanvasJobResult>;
