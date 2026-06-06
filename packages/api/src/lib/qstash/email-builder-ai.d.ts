import type { EmailBuilderAiJobResult } from "./types";
/**
 * Enqueue an AI generation job for Email Builder via QStash.
 * Delivers immediately. The worker will handle the async orchestration.
 */
export declare function enqueueEmailBuilderAiGeneration(designId: string): Promise<EmailBuilderAiJobResult>;
