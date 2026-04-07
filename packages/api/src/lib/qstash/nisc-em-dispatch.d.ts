import type { NiscEmDispatchJobResult } from "./types";
/**
 * Enqueue a global NISC email marketing dispatcher run.
 * This worker is designed to be safe to call many times; a global advisory lock ensures only one run is active.
 */
export declare function enqueueNiscEmDispatch(scheduledFor?: Date | null): Promise<NiscEmDispatchJobResult>;
