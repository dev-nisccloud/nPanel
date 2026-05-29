import Replicate from "replicate";
import { UTApi } from "uploadthing/server";

import { isReplicateHostedMediaUrl } from "../replicate-hosted-url";

const utapi = new UTApi();

export class NebImagePersistError extends Error {
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
	const res = await utapi.uploadFilesFromUrl(replicateUrl);
	const result = Array.isArray(res) ? res[0] : res;
	if (result?.data) {
		const fileUrl = result.data.ufsUrl || result.data.url;
		return { fileUrl, storageKey: result.data.key };
	}
	const msg =
		result?.error &&
		typeof result.error === "object" &&
		"message" in result.error
			? String((result.error as { message?: string }).message)
			: "UploadThing returned no data";
	throw new NebImagePersistError(msg);
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
		throw new Error(
			result.error ?? `Imagen prediction ${result.status}: ${result.id}`,
		);
	}

	const replicateUrl = extractImageUrl(result.output);
	return persistUrlToUploadThing(replicateUrl);
}
