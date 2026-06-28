import Replicate from "replicate";

import { isReplicateHostedMediaUrl } from "../replicate-hosted-url";
import {
	ObjectStoragePersistError,
	persistRemoteUrlToObjectStorage,
} from "../object-storage/persist";

export class NebImagePersistError extends ObjectStoragePersistError {
	constructor(message: string, options?: { cause?: unknown }) {
		super(message, options);
		this.name = "NebImagePersistError";
	}
}

export async function persistUrlToUploadThing(
	replicateUrl: string,
): Promise<{ fileUrl: string; storageKey?: string }> {
	if (!isReplicateHostedMediaUrl(replicateUrl)) {
		return { fileUrl: replicateUrl };
	}
	try {
		const result = await persistRemoteUrlToObjectStorage(replicateUrl, {
			skipNonReplicate: false,
		});
		return { fileUrl: result.fileUrl, storageKey: result.storageKey || undefined };
	} catch (e) {
		const msg = e instanceof Error ? e.message : "Object storage returned no data";
		throw new NebImagePersistError(msg, { cause: e });
	}
}

function extractImageUrl(output: unknown): string {
	if (typeof output === "string" && output.startsWith("http")) return output;
	if (Array.isArray(output) && typeof output[0] === "string") return output[0];
	if (output && typeof output === "object" && "url" in output) {
		const u = (output as { url?: () => string }).url;
		if (typeof u === "function") return u();
	}
	throw new Error(`Unexpected Imagen output: ${JSON.stringify(output).slice(0, 200)}`);
}

export type Imagen4UltraInput = {
	prompt: string;
	imageSize?: "1K" | "2K";
	aspectRatio?: string;
	outputFormat?: "jpg" | "png";
	safetyFilterLevel?: "block_low_and_above" | "block_medium_and_above" | "block_only_high";
};

/**
 * google/imagen-4-ultra via Replicate predictions API.
 * Used for icon assets (sharp, clean rendering on any background color).
 */
export async function generateImagen4Ultra(
	replicate: Replicate,
	input: Imagen4UltraInput,
): Promise<{ fileUrl: string; storageKey?: string }> {
	const prediction = await replicate.predictions.create({
		model: "google/imagen-4-ultra",
		input: {
			prompt: input.prompt,
			image_size: input.imageSize ?? "1K",
			aspect_ratio: input.aspectRatio ?? "1:1",
			output_format: input.outputFormat ?? "png",
			safety_filter_level: input.safetyFilterLevel ?? "block_only_high",
		},
	});

	let result = prediction;
	const deadline = Date.now() + 120_000;
	while (
		result.status !== "succeeded" &&
		result.status !== "failed" &&
		result.status !== "canceled"
	) {
		if (Date.now() > deadline) {
			throw new Error(`Imagen prediction timed out: ${result.id}`);
		}
		await new Promise((r) => setTimeout(r, 2_000));
		result = await replicate.predictions.get(result.id);
	}

	if (result.status !== "succeeded") {
		throw new Error(result.error ?? `Imagen prediction ${result.status}: ${result.id}`);
	}

	const replicateUrl = extractImageUrl(result.output);
	return persistUrlToUploadThing(replicateUrl);
}
