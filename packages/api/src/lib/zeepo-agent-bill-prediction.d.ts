import type { CompletedReplicatePrediction } from "./zeepo-agent-replicate";
import { type ZeepoBillingContext } from "./zeepo-agent-tokens";
export declare function billZeepoAgentPrediction(params: {
    billing: ZeepoBillingContext;
    prediction: CompletedReplicatePrediction;
    modelId: string;
    operationType: string;
    description?: string;
    generationId?: string | null;
    /** Stored generation inputs when prediction.input is unavailable. */
    predictionInput?: Record<string, unknown> | null;
}): Promise<{
    tokensDebited: number;
} | null>;
/** Fetch a completed prediction and bill it (async media webhook path). */
export declare function billZeepoAgentPredictionById(params: {
    replicate: import("replicate").default;
    billing: ZeepoBillingContext;
    predictionId: string;
    modelId: string;
    operationType: string;
    generationId?: string | null;
    output?: unknown;
    predictionInput?: Record<string, unknown> | null;
}): Promise<{
    tokensDebited: number;
} | null>;
