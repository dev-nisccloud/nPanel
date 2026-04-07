import type { NiscOrderJobResult } from "./types";
/**
 * Enqueue a Nisc order for background processing via QStash.
 * Delivers immediately (no scheduling).
 */
export declare function enqueueNiscOrderProcessing(niscOrderId: string): Promise<NiscOrderJobResult>;
