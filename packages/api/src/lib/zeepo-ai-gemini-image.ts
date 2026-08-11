/**
 * Zeepo AI image generation via Google Interactions API (Nano Banana family).
 * No Replicate / QStash  synchronous Interactions.create for real-time SSE UX.
 */
import { GoogleGenAI } from "@google/genai";
import { persistBufferToObjectStorage } from "./object-storage/persist";
import { STORAGE_PREFIXES } from "./object-storage/prefixes";
import {
	assertAllowedZeepoAiMediaUrl,
	isZeepoAiDataImageUrl,
} from "./zeepo-ai-media-url";
import {
	normalizeZeepoAiGeminiUsage,
	type ZeepoAiGeminiUsageLike,
} from "./zeepo-ai-gemini-pricing";

async function withAbortSignal<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> {
	if (!signal) return promise;
	if (signal.aborted) throw new Error("Cancelled");
	return new Promise<T>((resolve, reject) => {
		const onAbort = () => reject(new Error("Cancelled"));
		signal.addEventListener("abort", onAbort, { once: true });
		promise.then(
			(v) => {
				signal.removeEventListener("abort", onAbort);
				resolve(v);
			},
			(e) => {
				signal.removeEventListener("abort", onAbort);
				reject(e);
			},
		);
	});
}

export const ZEEPO_AI_IMAGE_PROVIDER = "google" as const;

export const ZEEPO_AI_IMAGE_MODELS = {
	pro: process.env.ZEEPO_AI_IMAGE_MODEL_PRO?.trim() || "gemini-3-pro-image",
	flash: process.env.ZEEPO_AI_IMAGE_MODEL_FLASH?.trim() || "gemini-3.1-flash-image",
	lite: process.env.ZEEPO_AI_IMAGE_MODEL_LITE?.trim() || "gemini-3.1-flash-lite-image",
} as const;

export type ZeepoAiImageIntent =
	| "design"
	| "logo"
	| "mockup"
	| "photo"
	| "draft"
	| "suite"
	| "edit";

export type ZeepoAiAspectRatio =
	| "1:1"
	| "1:4"
	| "4:1"
	| "1:8"
	| "8:1"
	| "2:3"
	| "3:2"
	| "3:4"
	| "4:3"
	| "4:5"
	| "5:4"
	| "9:16"
	| "16:9"
	| "21:9";

export type ZeepoAiImageRef = {
	dataBase64: string;
	mimeType: string;
};

export type ZeepoAiImageResult = {
	buffer: Buffer;
	mimeType: string;
	interactionId: string | null;
	modelId: string;
	imageSize: "0.5K" | "1K" | "2K" | "4K";
	usage?: ZeepoAiGeminiUsageLike;
};

function getGeminiClient(): GoogleGenAI {
	// The @google/genai SDK requires GOOGLE_API_KEY environment variable
	// Check both GOOGLE_API_KEY and GEMINI_API_KEY for backwards compatibility
	const apiKey = process.env.GOOGLE_API_KEY?.trim() || process.env.GEMINI_API_KEY?.trim();
	if (!apiKey) {
		throw new Error("GOOGLE_API_KEY or GEMINI_API_KEY environment variable is not configured");
	}
	// Ensure GOOGLE_API_KEY is set for the SDK
	if (!process.env.GOOGLE_API_KEY) {
		process.env.GOOGLE_API_KEY = apiKey;
	}
	return new GoogleGenAI({});
}

/** Pick model by intent / volume. Never expose model names to end users. */
export function pickZeepoAiImageModel(params: {
	intent?: ZeepoAiImageIntent | string | null;
	count?: number;
	hasReferences?: boolean;
	needsEdit?: boolean;
}): string {
	const intent = (params.intent ?? "photo").toLowerCase();
	const count = params.count ?? 1;

	if (
		intent === "design" ||
		intent === "logo" ||
		intent === "mockup" ||
		intent === "edit"
	) {
		return ZEEPO_AI_IMAGE_MODELS.pro;
	}

	if (intent === "draft" && count >= 4 && !params.hasReferences && !params.needsEdit) {
		return ZEEPO_AI_IMAGE_MODELS.lite;
	}

	return ZEEPO_AI_IMAGE_MODELS.flash;
}

function extractImageFromInteraction(interaction: unknown): {
	data: string;
	mimeType: string;
	interactionId: string | null;
	usage?: ZeepoAiGeminiUsageLike;
} {
	const ix = interaction as {
		id?: string;
		output_image?: { data?: string; mime_type?: string; mimeType?: string };
		outputs?: Array<{ type?: string; data?: string; mime_type?: string; mimeType?: string }>;
		steps?: Array<{
			type?: string;
			content?: Array<{
				type?: string;
				data?: string;
				mime_type?: string;
				mimeType?: string;
			}>;
		}>;
		usage?: unknown;
		usage_metadata?: unknown;
		usageMetadata?: unknown;
	};

	const usage =
		normalizeZeepoAiGeminiUsage(ix.usage) ??
		normalizeZeepoAiGeminiUsage(ix.usage_metadata) ??
		normalizeZeepoAiGeminiUsage(ix.usageMetadata) ??
		undefined;

	const fromConvenience = ix.output_image;
	if (fromConvenience?.data) {
		return {
			data: fromConvenience.data,
			mimeType: fromConvenience.mime_type ?? fromConvenience.mimeType ?? "image/png",
			interactionId: ix.id ?? null,
			usage,
		};
	}

	for (const step of ix.steps ?? []) {
		for (const block of step.content ?? []) {
			if (block.type === "image" && block.data) {
				return {
					data: block.data,
					mimeType: block.mime_type ?? block.mimeType ?? "image/png",
					interactionId: ix.id ?? null,
					usage,
				};
			}
		}
	}

	for (const out of ix.outputs ?? []) {
		if (out.type === "image" && out.data) {
			return {
				data: out.data,
				mimeType: out.mime_type ?? out.mimeType ?? "image/png",
				interactionId: ix.id ?? null,
				usage,
			};
		}
	}

	throw new Error("Image generation returned no image data");
}

function buildInputParts(params: {
	prompt: string;
	references?: ZeepoAiImageRef[];
}): Array<Record<string, unknown>> {
	const parts: Array<Record<string, unknown>> = [
		{ type: "text", text: params.prompt },
	];
	for (const ref of params.references ?? []) {
		parts.push({
			type: "image",
			data: ref.dataBase64,
			mime_type: ref.mimeType || "image/png",
		});
	}
	return parts;
}

export async function createZeepoAiImage(params: {
	prompt: string;
	modelId?: string;
	aspectRatio?: ZeepoAiAspectRatio | string;
	mimeType?: "image/png" | "image/jpeg";
	references?: ZeepoAiImageRef[];
	previousInteractionId?: string | null;
	intent?: ZeepoAiImageIntent | string;
	signal?: AbortSignal;
}): Promise<ZeepoAiImageResult> {
	const client = getGeminiClient();
	const modelId =
		params.modelId?.trim() ||
		pickZeepoAiImageModel({
			intent: params.intent,
			hasReferences: (params.references?.length ?? 0) > 0,
		});
	const aspectRatio = (params.aspectRatio ?? "1:1") as string;
	// Interactions API only supports image/jpeg
	const mimeType = "image/jpeg";
	const imageSize = modelId.includes("lite") ? ("1K" as const) : ("2K" as const);

	try {
		if (params.signal?.aborted) throw new Error("Cancelled");

		const interaction = await withAbortSignal(
			client.interactions.create({
				model: modelId,
				input: buildInputParts({
					prompt: params.prompt,
					references: params.references,
				}) as never,
				response_format: {
					type: "image",
					mime_type: mimeType,
					aspect_ratio: aspectRatio,
					image_size: imageSize,
				} as never,
				...(params.previousInteractionId
					? { previous_interaction_id: params.previousInteractionId }
					: {}),
				store: true,
			} as never),
			params.signal,
		);

		const extracted = extractImageFromInteraction(interaction);
		return {
			buffer: Buffer.from(extracted.data, "base64"),
			mimeType: extracted.mimeType,
			interactionId: extracted.interactionId,
			modelId,
			imageSize,
			usage: extracted.usage,
		};
	} catch (error: unknown) {
		const errorDetails = {
			modelId,
			aspectRatio,
			promptLength: params.prompt.length,
			hasReferences: (params.references?.length ?? 0) > 0,
			errorMessage: error instanceof Error ? error.message : String(error),
			errorType: error?.constructor?.name,
			// @ts-expect-error - checking for API error details
			status: error?.status || error?.statusCode,
			// @ts-expect-error - checking for API error details
			errorInfo: error?.error,
		};
		console.error("[zeepo-ai-gemini-image] Image generation failed:", errorDetails);
		
		// Provide user-friendly error messages based on error type
		if (errorDetails.status === 401 || errorDetails.errorMessage?.includes("UNAUTHENTICATED")) {
			throw new Error("Authentication failed. Please check your API key configuration.");
		}
		if (errorDetails.status === 429 || errorDetails.errorMessage?.includes("quota") || errorDetails.errorMessage?.includes("RESOURCE_EXHAUSTED")) {
			throw new Error("API quota exceeded. Please try again later or upgrade your plan.");
		}
		if (errorDetails.status === 400 || errorDetails.errorMessage?.includes("INVALID_ARGUMENT")) {
			throw new Error("Invalid request. Please check your prompt and settings.");
		}
		if (errorDetails.status === 503 || errorDetails.errorMessage?.includes("UNAVAILABLE")) {
			throw new Error("Service temporarily unavailable. Please try again in a moment.");
		}
		
		// Return generic but helpful message
		const userMessage = error instanceof Error ? error.message : "Image generation failed";
		throw new Error(userMessage.length > 150 ? "Image generation failed. Please try again." : userMessage);
	}
}

export async function editZeepoAiImage(params: {
	prompt: string;
	sourceImage: ZeepoAiImageRef;
	maskImage?: ZeepoAiImageRef | null;
	modelId?: string;
	aspectRatio?: ZeepoAiAspectRatio | string;
	mimeType?: "image/png" | "image/jpeg";
	previousInteractionId?: string | null;
}): Promise<ZeepoAiImageResult> {
	const refs: ZeepoAiImageRef[] = [params.sourceImage];
	if (params.maskImage) refs.push(params.maskImage);

	let prompt = params.prompt;
	if (params.maskImage) {
		prompt = `${params.prompt}\n\nA mask image is provided after the source: apply the edit only in the masked (painted) region.`;
	}

	return createZeepoAiImage({
		prompt,
		modelId: params.modelId ?? ZEEPO_AI_IMAGE_MODELS.pro,
		aspectRatio: params.aspectRatio,
		mimeType: params.mimeType,
		references: refs,
		previousInteractionId: params.previousInteractionId,
		intent: "edit",
	});
}

export async function persistZeepoAiImageBuffer(params: {
	buffer: Buffer;
	mimeType: string;
	userId?: string;
	fileName?: string;
}): Promise<{ fileUrl: string; storageKey: string }> {
	const ext =
		params.mimeType.includes("jpeg") || params.mimeType.includes("jpg")
			? "jpg"
			: params.mimeType.includes("webp")
				? "webp"
				: "png";
	return persistBufferToObjectStorage({
		buffer: params.buffer,
		contentType: params.mimeType,
		fileName: params.fileName ?? `zeepo-ai-${Date.now()}.${ext}`,
		prefix: STORAGE_PREFIXES.ZEEPO_AI,
		userId: params.userId,
	});
}

/** Run async work with a concurrency cap. */
export async function mapWithConcurrency<T, R>(
	items: T[],
	concurrency: number,
	fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
	const results: R[] = new Array(items.length);
	let next = 0;
	const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
		while (true) {
			const i = next++;
			if (i >= items.length) return;
			results[i] = await fn(items[i]!, i);
		}
	});
	await Promise.all(workers);
	return results;
}

export async function fetchImageAsRef(
	url: string,
	opts?: { signal?: AbortSignal },
): Promise<ZeepoAiImageRef> {
	assertAllowedZeepoAiMediaUrl(url, "Reference image");

	if (isZeepoAiDataImageUrl(url) || url.startsWith("data:")) {
		const [header, b64] = url.split(",");
		const mime = header?.match(/data:([^;]+)/)?.[1] ?? "image/png";
		return { dataBase64: b64 ?? "", mimeType: mime };
	}
	const res = await fetch(url, { signal: opts?.signal });
	if (!res.ok) throw new Error(`Failed to fetch reference image (${res.status})`);
	const mime = res.headers.get("content-type")?.split(";")[0]?.trim() ?? "image/png";
	const buf = Buffer.from(await res.arrayBuffer());
	return { dataBase64: buf.toString("base64"), mimeType: mime };
}
