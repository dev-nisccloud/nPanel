/**
 * Replicate prediction runner that returns metrics for Zeepo token billing.
 */
import Replicate from "replicate";
import { collectTextOutput } from "../routers/zeepo-agent/replicate-agent-orchestration";

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

export async function runReplicatePrediction(params: {
	replicate: Replicate;
	modelId: string;
	input: Record<string, unknown>;
	maxMs?: number;
}): Promise<CompletedReplicatePrediction> {
	const { replicate, modelId, input, maxMs = 180_000 } = params;

	const modelParts = modelId.split(":");
	const isVersioned = modelParts.length > 1;

	let prediction = await replicate.predictions.create({
		...(isVersioned ? { version: modelParts[1]! } : { model: modelParts[0]! }),
		input,
	});

	const deadline = Date.now() + maxMs;
	while (
		prediction.status !== "succeeded" &&
		prediction.status !== "failed" &&
		prediction.status !== "canceled"
	) {
		if (Date.now() > deadline) {
			throw new Error(`Replicate prediction timed out after ${maxMs / 1000}s`);
		}
		await new Promise((r) => setTimeout(r, 500));
		prediction = await replicate.predictions.get(prediction.id);
	}

	if (prediction.status !== "succeeded") {
		const err =
			typeof prediction.error === "string"
				? prediction.error
				: `Prediction ${prediction.status}`;
		throw new Error(err);
	}

	return {
		id: prediction.id,
		status: prediction.status,
		output: prediction.output,
		input:
			prediction.input && typeof prediction.input === "object" && !Array.isArray(prediction.input)
				? (prediction.input as Record<string, unknown>)
				: input,
		metrics: prediction.metrics as CompletedReplicatePrediction["metrics"],
		model: typeof prediction.model === "string" ? prediction.model : modelId,
		error: prediction.error,
	};
}

/** Collect text from a completed prediction (LLM orchestration). */
export async function runReplicateTextPrediction(params: {
	replicate: Replicate;
	modelId: string;
	input: Record<string, unknown>;
	maxMs?: number;
}): Promise<{ text: string; prediction: CompletedReplicatePrediction }> {
	const prediction = await runReplicatePrediction(params);
	const text = await collectTextOutput(prediction.output);
	return { text, prediction };
}
