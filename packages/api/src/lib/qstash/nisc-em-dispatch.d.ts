import type { NiscEmDispatchJobResult } from "./types";
/**
 * Enqueue a campaign-scoped Nisc email marketing dispatcher run.
 */
export declare function enqueueNiscEmDispatch(campaignId: string, scheduledFor?: Date | null): Promise<NiscEmDispatchJobResult>;
