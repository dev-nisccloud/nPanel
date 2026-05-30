/**
 * Estimate Replicate provider cost (USD) from prediction metrics + model pricing.
 * Replicate does not return dollar amounts — we compute them server-side.
 */
import {
	ZEEPO_INTERNAL_USD_PER_TOKEN,
} from "./zeepo-agent-billing";

export type ZeepoModelBillingType =
	| "gpu_time"
	| "per_image"
	| "per_video_second"
	| "per_token"
	| "flat";

export type ZeepoModelPricing = {
	modelId: string;
	billingType: ZeepoModelBillingType;
	/** USD per second of predict_time (gpu_time). */
	pricePerSecondUsd?: number;
	/** USD per output image (per_image). */
	pricePerOutputUsd?: number;
	/** USD per 1M input tokens (per_token LLMs). */
	inputPricePer1MUsd?: number;
	/** USD per 1M output tokens (per_token LLMs). */
	outputPricePer1MUsd?: number;
	/** Fallback flat USD when metrics are incomplete. */
	estimatedFlatUsd?: number;
};

/** Conservative defaults for models used by Zeepo Agent. Tune against Replicate invoices. */
export const ZEEPO_MODEL_PRICING: ZeepoModelPricing[] = [
	{
		modelId: "anthropic/claude-4.5-haiku",
		billingType: "per_token",
		inputPricePer1MUsd: 1,
		outputPricePer1MUsd: 5,
		estimatedFlatUsd: 0.002,
	},
	{
		modelId: "anthropic/claude-4.5-sonnet",
		billingType: "per_token",
		inputPricePer1MUsd: 3,
		outputPricePer1MUsd: 15,
		estimatedFlatUsd: 0.01,
	},
	{
		modelId: "black-forest-labs/flux-2-pro",
		billingType: "per_image",
		pricePerOutputUsd: 0.04,
		estimatedFlatUsd: 0.04,
	},
	{
		modelId: "black-forest-labs/flux-1.1-pro",
		billingType: "per_image",
		pricePerOutputUsd: 0.04,
		estimatedFlatUsd: 0.04,
	},
	{
		modelId: "bria/eraser",
		billingType: "per_image",
		pricePerOutputUsd: 0.02,
		estimatedFlatUsd: 0.02,
	},
	{
		modelId: "bria/generate-background",
		billingType: "per_image",
		pricePerOutputUsd: 0.03,
		estimatedFlatUsd: 0.03,
	},
	{
		modelId: "recraft-ai/recraft-crisp-upscale",
		billingType: "per_image",
		pricePerOutputUsd: 0.02,
		estimatedFlatUsd: 0.02,
	},
	{
		modelId: "qwen/qwen-image-edit-2511",
		billingType: "per_image",
		pricePerOutputUsd: 0.03,
		estimatedFlatUsd: 0.03,
	},
];

const PRICING_BY_MODEL = new Map(
	ZEEPO_MODEL_PRICING.map((p) => [p.modelId, p]),
);

/** Match "owner/name" or "owner/name:version" to a pricing row. */
export function resolveZeepoModelPricing(modelId: string): ZeepoModelPricing | null {
	const base = modelId.split(":")[0] ?? modelId;
	return PRICING_BY_MODEL.get(base) ?? null;
}

export type ReplicatePredictionMetrics = {
	predict_time?: number;
	total_time?: number;
	input_token_count?: number;
	output_token_count?: number;
};

function countOutputUnits(output: unknown, billingType: ZeepoModelBillingType): number {
	if (billingType === "per_image" || billingType === "per_video_second") {
		if (Array.isArray(output)) return Math.max(1, output.length);
		if (output != null) return 1;
		return 1;
	}
	return 1;
}

/** Small buffer for cold starts / pricing drift vs Replicate invoice. */
const COST_SAFETY_MULTIPLIER = 1.05;

export function estimateProviderCostUsd(params: {
	modelId: string;
	metrics?: ReplicatePredictionMetrics | null;
	output?: unknown;
	logInputTokens?: number;
	logOutputTokens?: number;
}): number {
	const pricing = resolveZeepoModelPricing(params.modelId);
	const metrics = params.metrics ?? {};
	const predictTime =
		typeof metrics.predict_time === "number" && Number.isFinite(metrics.predict_time)
			? metrics.predict_time
			: 0;

	let usd = 0;

	if (pricing) {
		switch (pricing.billingType) {
			case "gpu_time":
				usd = predictTime * (pricing.pricePerSecondUsd ?? 0.001);
				break;
			case "per_image":
			case "per_video_second": {
				const units = countOutputUnits(params.output, pricing.billingType);
				const rate =
					pricing.pricePerOutputUsd ??
					(pricing.billingType === "per_video_second"
						? predictTime * (pricing.pricePerSecondUsd ?? 0.09)
						: 0.04);
				usd =
					pricing.billingType === "per_video_second" && pricing.pricePerSecondUsd
						? predictTime * pricing.pricePerSecondUsd
						: units * rate;
				break;
			}
			case "per_token": {
				const inTok =
					params.logInputTokens ??
					(typeof metrics.input_token_count === "number"
						? metrics.input_token_count
						: 0);
				const outTok =
					params.logOutputTokens ??
					(typeof metrics.output_token_count === "number"
						? metrics.output_token_count
						: 0);
				if (inTok > 0 || outTok > 0) {
					usd =
						(inTok / 1_000_000) * (pricing.inputPricePer1MUsd ?? 1) +
						(outTok / 1_000_000) * (pricing.outputPricePer1MUsd ?? 5);
				} else if (predictTime > 0) {
					usd = predictTime * 0.001;
				} else {
					usd = pricing.estimatedFlatUsd ?? 0.002;
				}
				break;
			}
			case "flat":
				usd = pricing.estimatedFlatUsd ?? 0.01;
				break;
		}
	}

	if (usd <= 0) {
		if (predictTime > 0) {
			usd = predictTime * 0.001;
		} else {
			usd = pricing?.estimatedFlatUsd ?? 0.005;
		}
	}

	return usd * COST_SAFETY_MULTIPLIER;
}

export function usdToZeepoTokens(usd: number): number {
	if (!Number.isFinite(usd) || usd <= 0) return 0;
	return Math.max(1, Math.ceil(usd / ZEEPO_INTERNAL_USD_PER_TOKEN));
}

export function usdToMicros(usd: number): number {
	if (!Number.isFinite(usd) || usd <= 0) return 0;
	return Math.round(usd * 1_000_000);
}

export function tokensFromPrediction(params: {
	modelId: string;
	metrics?: ReplicatePredictionMetrics | null;
	output?: unknown;
	logInputTokens?: number;
	logOutputTokens?: number;
}): { tokens: number; providerCostUsd: number; providerCostUsdMicros: number } {
	const providerCostUsd = estimateProviderCostUsd(params);
	const tokens = usdToZeepoTokens(providerCostUsd);
	return {
		tokens,
		providerCostUsd,
		providerCostUsdMicros: usdToMicros(providerCostUsd),
	};
}
