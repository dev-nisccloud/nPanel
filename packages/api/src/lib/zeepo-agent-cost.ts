/**
 * Estimate Replicate provider cost (USD) from official billingConfig pricing.
 * Replicate does not return dollar amounts - we compute them server-side.
 */
import { ZEEPO_INTERNAL_USD_PER_TOKEN } from "./zeepo-agent-billing";
import {
	ZEEPO_REPLICATE_PRICING_BY_ID,
	type ReplicateBillingMetric,
	type ReplicateModelPricing,
	type ReplicatePriceEntry,
} from "./zeepo-replicate-pricing-data";

export type ReplicatePredictionMetrics = {
	predict_time?: number;
	total_time?: number;
	input_token_count?: number;
	output_token_count?: number;
	image_input_megapixel_count?: number;
	image_output_megapixel_count?: number;
	video_output_duration_seconds?: number;
	video_output_count?: number;
	character_input_count?: number;
	run_count?: number;
};

/** Small buffer for cold starts / pricing drift vs Replicate invoice. */
const COST_SAFETY_MULTIPLIER = 1.05;

/** Default GPU rate (L40S) for models without billingConfig. */
const DEFAULT_GPU_USD_PER_SECOND = 0.000975;

const CLAUDE_MODEL_PREFIX = "anthropic/";

type CostContext = {
	modelId: string;
	baseId: string;
	input: Record<string, unknown>;
	metrics: ReplicatePredictionMetrics;
	output: unknown;
	logInputTokens?: number;
	logOutputTokens?: number;
};

function pickString(v: unknown): string | undefined {
	return typeof v === "string" && v.trim() !== "" ? v.trim() : undefined;
}

function pickNumber(v: unknown): number | undefined {
	if (typeof v === "number" && Number.isFinite(v)) return v;
	if (typeof v === "string" && v.trim() !== "") {
		const n = Number(v);
		if (Number.isFinite(n)) return n;
	}
	return undefined;
}

function pickBoolean(v: unknown): boolean | undefined {
	if (typeof v === "boolean") return v;
	if (v === "true") return true;
	if (v === "false") return false;
	return undefined;
}

export function resolveBaseModelId(modelId: string): string {
	return modelId.split(":")[0] ?? modelId;
}

function metricCost(entry: ReplicatePriceEntry, quantity: number): number {
	if (quantity <= 0) return 0;
	return (quantity / entry.unitSize) * entry.priceUsd;
}

function tiersCompatible(priceTier: string, selected: string): boolean {
	const pt = priceTier.toLowerCase();
	return selected
		.toLowerCase()
		.split(";")
		.every((part) => pt.includes(part.trim()));
}

function getPriceForMetric(
	pricing: ReplicateModelPricing,
	metric: ReplicateBillingMetric,
	tier: string | null,
): ReplicatePriceEntry | null {
	const matches = pricing.prices.filter((p) => p.metric === metric);
	if (matches.length === 0) return null;

	if (tier) {
		const exact = matches.find((p) => p.tier === tier);
		if (exact) return exact;
		const partial = matches.find((p) => p.tier && tiersCompatible(p.tier, tier));
		if (partial) return partial;
	}

	const untiered = matches.find((p) => p.tier === null);
	if (untiered) return untiered;

	return matches[0] ?? null;
}

function parseMegapixelsFromResolution(resolution: unknown): number {
	const n = pickNumber(resolution);
	if (n != null && n > 0 && n < 100) return n;

	if (typeof resolution !== "string") return 1;
	const s = resolution.trim().toLowerCase();
	const mpMatch = s.match(/([\d.]+)\s*mp/);
	if (mpMatch) return Number(mpMatch[1]!);

	const dimMatch = s.match(/(\d+)\s*[x×]\s*(\d+)/);
	if (dimMatch) {
		return (Number(dimMatch[1]) * Number(dimMatch[2])) / 1_000_000;
	}

	if (s === "0.5" || s.includes("0.5")) return 0.5;
	if (s === "1k" || s === "1") return 1;
	if (s === "2k" || s === "2") return 2;
	if (s === "3k" || s === "3") return 3;
	if (s === "4k" || s === "4") return 4;

	return 1;
}

function parseResolutionTier(input: Record<string, unknown>): string {
	const raw =
		pickString(input.resolution) ??
		pickString(input.size) ??
		pickString(input.video_size) ??
		"720p";
	const s = raw.toLowerCase();
	if (s.includes("1080")) return "1080p";
	if (s.includes("480")) return "480p";
	if (s.includes("720")) return "720p";
	if (s.includes("4k")) return "4k";
	return "720p";
}

function hasVideoInput(input: Record<string, unknown>): boolean {
	return Boolean(
		input.video ??
			input.video_input ??
			input.input_video ??
			input.reference_video ??
			(Array.isArray(input.reference_images) &&
				input.reference_images.some(
					(v) => typeof v === "string" && /\.(mp4|webm|mov)/i.test(v),
				)),
	);
}

function countOutputImages(output: unknown): number {
	if (Array.isArray(output)) return Math.max(1, output.length);
	if (output != null) return 1;
	return 1;
}

function countOutputVideos(output: unknown): number {
	return countOutputImages(output);
}

function estimateInputMegapixels(input: Record<string, unknown>): number {
	if (typeof input.image_input_megapixel_count === "number") {
		return input.image_input_megapixel_count;
	}

	const images =
		input.input_images ?? input.image_input ?? input.image ?? input.images;
	let count = 0;
	if (Array.isArray(images)) count = images.length;
	else if (images) count = 1;

	if (count === 0) return 0;
	const perImage = parseMegapixelsFromResolution(input.resolution);
	return count * perImage;
}

function estimateOutputMegapixels(input: Record<string, unknown>): number {
	return parseMegapixelsFromResolution(input.resolution);
}

function estimateVideoDurationSeconds(
	input: Record<string, unknown>,
	metrics: ReplicatePredictionMetrics,
): number {
	if (
		typeof metrics.video_output_duration_seconds === "number" &&
		metrics.video_output_duration_seconds > 0
	) {
		return metrics.video_output_duration_seconds;
	}

	for (const key of [
		"duration",
		"video_length",
		"length",
		"seconds",
		"num_seconds",
	]) {
		const n = pickNumber(input[key]);
		if (n != null && n > 0) return n;
		const s = pickString(input[key]);
		if (s) {
			const m = s.match(/([\d.]+)/);
			if (m) return Number(m[1]);
		}
	}

	return 5;
}

function estimateCharacterCount(input: Record<string, unknown>): number {
	if (typeof input.character_input_count === "number") {
		return input.character_input_count;
	}
	const text = pickString(input.text) ?? pickString(input.prompt) ?? "";
	return text.length;
}

/** Claude vision: image tokens = (width × height) / 750 per image. */
function claudeVisionImageTokens(input: Record<string, unknown>): number {
	if (!input.image) return 0;
	const w = pickNumber(input.image_width) ?? 1024;
	const h = pickNumber(input.image_height) ?? 1024;
	return Math.ceil((w * h) / 750);
}

function resolveInputTokenCount(ctx: CostContext): number {
	let tokens =
		ctx.logInputTokens ??
		(typeof ctx.metrics.input_token_count === "number"
			? ctx.metrics.input_token_count
			: 0);

	if (ctx.baseId.startsWith(CLAUDE_MODEL_PREFIX)) {
		tokens += claudeVisionImageTokens(ctx.input);
	}

	return tokens;
}

function resolveOutputTokenCount(ctx: CostContext): number {
	return (
		ctx.logOutputTokens ??
		(typeof ctx.metrics.output_token_count === "number"
			? ctx.metrics.output_token_count
			: 0)
	);
}

function resolvePricingTier(ctx: CostContext): string | null {
	const { baseId, input, metrics } = ctx;
	const inputTokens =
		ctx.logInputTokens ??
		(typeof metrics.input_token_count === "number" ? metrics.input_token_count : 0);

	switch (baseId) {
		case "google/gemini-3.1-pro":
		case "google/gemini-3-pro":
			return inputTokens <= 200_000 ? "≤ 200,000" : "> 200,000";

		case "openai/gpt-image-2":
		case "openai/gpt-image-1.5": {
			const q = (pickString(input.quality) ?? "medium").toLowerCase();
			return q;
		}

		case "google/nano-banana-2":
		case "google/nano-banana-pro": {
			const res = (pickString(input.resolution) ?? "1K").toUpperCase();
			if (baseId === "google/nano-banana-pro" && !["1K", "2K", "4K"].includes(res)) {
				return "fallback";
			}
			return res;
		}

		case "prunaai/z-image-turbo": {
			const mp = estimateOutputMegapixels(input);
			if (mp <= 0.5) return "0.5";
			if (mp <= 1) return "1";
			if (mp <= 2) return "2";
			if (mp <= 3) return "3";
			return "4";
		}

		case "google/veo-3.1-fast":
		case "google/veo-3.1":
		case "google/veo-3":
		case "google/veo-3-fast":
			return (pickBoolean(input.generate_audio) ?? true) ? "with_audio" : "without_audio";

		case "kwaivgi/kling-v2.6":
			return (pickBoolean(input.generate_audio) ?? false) ? "yes" : "no";

		case "kwaivgi/kling-v2.1": {
			const mode = (pickString(input.mode) ?? "standard").toLowerCase();
			return mode === "pro" ? "pro" : "standard";
		}

		case "kwaivgi/kling-v3-omni-video":
		case "kwaivgi/kling-v3-video": {
			const audio = (pickBoolean(input.generate_audio) ?? false) ? "yes" : "no";
			const modeRaw = (pickString(input.mode) ?? "standard").toLowerCase();
			const mode =
				modeRaw === "pro" ? "pro" : modeRaw === "4k" ? "4k" : "standard";
			return `${audio}; ${mode}`;
		}

		case "prunaai/p-video": {
			const draft = pickBoolean(input.draft) ?? false;
			const res = parseResolutionTier(input);
			return `${draft ? "draft" : "base"}; ${res}`;
		}

		case "bytedance/seedance-2.0": {
			const prefix = hasVideoInput(input) ? "video_in" : "non_video_in";
			return `${prefix}; ${parseResolutionTier(input)}`;
		}

		case "bytedance/seedance-1-lite":
		case "bytedance/seedance-1-pro":
			return parseResolutionTier(input);

		case "wan-video/wan-2.2-i2v-fast": {
			const mode = (pickBoolean(input.interpolate) ?? false) ? "interpolate" : "base";
			return `${mode}; ${parseResolutionTier(input)}`;
		}

		default:
			return null;
	}
}

function getMetricQuantity(
	metric: ReplicateBillingMetric,
	ctx: CostContext,
): number {
	const { input, metrics, output } = ctx;

	switch (metric) {
		case "token_input_count":
			return resolveInputTokenCount(ctx);

		case "token_output_count":
			return resolveOutputTokenCount(ctx);

		case "image_output_count":
			return countOutputImages(output);

		case "image_input_megapixel_count":
			return (
				metrics.image_input_megapixel_count ?? estimateInputMegapixels(input)
			);

		case "image_output_megapixel_count":
			return (
				metrics.image_output_megapixel_count ?? estimateOutputMegapixels(input)
			);

		case "run_count":
			return metrics.run_count ?? 1;

		case "video_output_duration_seconds":
			return estimateVideoDurationSeconds(input, metrics);

		case "video_output_count":
			return metrics.video_output_count ?? countOutputVideos(output);

		case "character_input_count":
			return metrics.character_input_count ?? estimateCharacterCount(input);

		default:
			return 0;
	}
}

function estimateFromOfficialPricing(ctx: CostContext): number {
	const pricing = ZEEPO_REPLICATE_PRICING_BY_ID.get(ctx.baseId);
	if (!pricing) return 0;

	const tier = resolvePricingTier(ctx);
	const billedMetrics = new Set(pricing.prices.map((p) => p.metric));
	let usd = 0;

	for (const metric of billedMetrics) {
		const entry = getPriceForMetric(pricing, metric, tier);
		if (!entry) continue;
		const qty = getMetricQuantity(metric, ctx);
		usd += metricCost(entry, qty);
	}

	if (usd <= 0 && pricing.gpuFallbackUsdPerSecond) {
		const predictTime =
			typeof ctx.metrics.predict_time === "number" ? ctx.metrics.predict_time : 0;
		if (predictTime > 0) {
			usd = predictTime * pricing.gpuFallbackUsdPerSecond;
		}
	}

	if (usd <= 0 && pricing.prices.some((p) => p.metric.startsWith("token_"))) {
		const inEntry = getPriceForMetric(pricing, "token_input_count", tier);
		const outEntry = getPriceForMetric(pricing, "token_output_count", tier);
		if (inEntry) usd += metricCost(inEntry, 4_000);
		if (outEntry) usd += metricCost(outEntry, 800);
	}

	return usd;
}

function gpuFallbackUsd(ctx: CostContext, pricing: ReplicateModelPricing | undefined): number {
	const predictTime =
		typeof ctx.metrics.predict_time === "number" && ctx.metrics.predict_time > 0
			? ctx.metrics.predict_time
			: 0;
	if (predictTime <= 0) return 0;

	const rate =
		pricing?.gpuFallbackUsdPerSecond ??
		DEFAULT_GPU_USD_PER_SECOND;
	return predictTime * rate;
}

export function estimateProviderCostUsd(params: {
	modelId: string;
	metrics?: ReplicatePredictionMetrics | null;
	output?: unknown;
	input?: Record<string, unknown> | null;
	logInputTokens?: number;
	logOutputTokens?: number;
}): number {
	const baseId = resolveBaseModelId(params.modelId);
	const pricing = ZEEPO_REPLICATE_PRICING_BY_ID.get(baseId);
	const ctx: CostContext = {
		modelId: params.modelId,
		baseId,
		input: params.input ?? {},
		metrics: params.metrics ?? {},
		output: params.output,
		logInputTokens: params.logInputTokens,
		logOutputTokens: params.logOutputTokens,
	};

	let usd = estimateFromOfficialPricing(ctx);

	if (usd <= 0) {
		usd = gpuFallbackUsd(ctx, pricing);
	}

	if (usd <= 0) {
		// Last resort for unknown models: short LLM-style flat minimum.
		usd = 0.002;
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
	input?: Record<string, unknown> | null;
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
