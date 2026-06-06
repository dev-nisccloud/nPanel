/**
 * Replicate prediction runner that returns metrics for Zeepo token billing.
 */
import Replicate from "replicate";
import type { ReplicatePredictionMetrics } from "./zeepo-agent-cost";
export type CompletedReplicatePrediction = {
    id: string;
    status: string;
    output: unknown;
    input?: Record<string, unknown>;
    metrics?: ReplicatePredictionMetrics;
    model?: string;
    error?: string | null;
};
export declare function runReplicatePrediction(params: {
    replicate: Replicate;
    modelId: string;
    input: Record<string, unknown>;
    maxMs?: number;
}): Promise<CompletedReplicatePrediction>;
/** Collect text from a completed prediction (LLM orchestration). */
export declare function runReplicateTextPrediction(params: {
    replicate: Replicate;
    modelId: string;
    input: Record<string, unknown>;
    maxMs?: number;
}): Promise<{
    text: string;
    prediction: CompletedReplicatePrediction;
}>;
