/**
 * Bill a completed Replicate prediction against a team's Zeepo token balance.
 */
import { eq } from "@npanel/db";
import { db } from "@npanel/db";
import { zeepoAgentGeneration } from "@npanel/db/schema/zeepo-agent";
import { tokensFromPrediction } from "./zeepo-agent-cost";
import type { CompletedReplicatePrediction } from "./zeepo-agent-replicate";
import {
	debitZeepoAgentTokens,
	shouldBillZeepoAgentTokens,
	type ZeepoBillingContext,
} from "./zeepo-agent-tokens";

export async function billZeepoAgentPrediction(params: {
	billing: ZeepoBillingContext;
	prediction: CompletedReplicatePrediction;
	modelId: string;
	operationType: string;
	description?: string;
	generationId?: string | null;
}): Promise<{ tokensDebited: number } | null> {
	if (!shouldBillZeepoAgentTokens(params.billing) || !params.billing.teamId) {
		return null;
	}

	const { tokens, providerCostUsdMicros } = tokensFromPrediction({
		modelId: params.modelId,
		metrics: params.prediction.metrics,
		output: params.prediction.output,
	});

	const result = await debitZeepoAgentTokens({
		teamId: params.billing.teamId,
		userId: params.billing.userId,
		tokens,
		operationType: params.operationType,
		description: params.description,
		sessionId: params.billing.sessionId,
		generationId: params.generationId ?? null,
		predictionId: params.prediction.id,
		modelId: params.modelId,
		providerCostUsdMicros,
	});

	if (params.generationId && result) {
		await db
			.update(zeepoAgentGeneration)
			.set({
				tokensDebited: String(result.tokensDebited),
				providerCostUsdMicros,
				predictionId: params.prediction.id,
				updatedAt: new Date(),
			})
			.where(eq(zeepoAgentGeneration.id, params.generationId));
	}

	return result ? { tokensDebited: result.tokensDebited } : null;
}

/** Fetch a completed prediction and bill it (async media webhook path). */
export async function billZeepoAgentPredictionById(params: {
	replicate: import("replicate").default;
	billing: ZeepoBillingContext;
	predictionId: string;
	modelId: string;
	operationType: string;
	generationId?: string | null;
	output?: unknown;
}): Promise<{ tokensDebited: number } | null> {
	if (!shouldBillZeepoAgentTokens(params.billing)) return null;

	const prediction = await params.replicate.predictions.get(params.predictionId);
	if (prediction.status !== "succeeded") return null;

	const completed: CompletedReplicatePrediction = {
		id: prediction.id,
		status: prediction.status,
		output: params.output ?? prediction.output,
		metrics: prediction.metrics as CompletedReplicatePrediction["metrics"],
		model: typeof prediction.model === "string" ? prediction.model : params.modelId,
	};

	return billZeepoAgentPrediction({
		billing: params.billing,
		prediction: completed,
		modelId: params.modelId,
		operationType: params.operationType,
		generationId: params.generationId,
		description: "Media generation",
	});
}
