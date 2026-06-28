import Replicate from "replicate";

import { isReplicateHostedMediaUrl } from "../replicate-hosted-url";
import { NebImagePersistError, persistUrlToUploadThing } from "./imagen";

export type NanoBananaAspectRatio =
	| "1:1"
	| "2:3"
	| "3:2"
	| "3:4"
	| "4:3"
	| "4:5"
	| "5:4"
	| "9:16"
	| "16:9"
	| "21:9";

export type NanoBananaInput = {
	prompt: string;
	resolution?: "1K" | "2K";
	aspectRatio?: NanoBananaAspectRatio;
	outputFormat?: "png" | "jpg";
	imageInput?: string[];
};

function extractImageUrl(output: unknown): string {
	if (typeof output === "string" && output.startsWith("http")) return output;
	if (Array.isArray(output) && typeof output[0] === "string") return output[0];
	if (output && typeof output === "object" && "url" in output) {
		const u = (output as { url?: () => string }).url;
		if (typeof u === "function") return u();
	}
	throw new Error(
		`Unexpected Nano Banana output: ${JSON.stringify(output).slice(0, 200)}`,
	);
}

/**
 * google/nano-banana-pro - creative mockups and email asset imagery.
 */
export async function generateNanoBananaPro(
	replicate: Replicate,
	input: NanoBananaInput,
): Promise<{ fileUrl: string; storageKey?: string }> {
	const prediction = await replicate.predictions.create({
		model: "google/nano-banana-pro",
		input: {
			prompt: input.prompt,
			resolution: input.resolution ?? "2K",
			image_input: input.imageInput ?? [],
			aspect_ratio: input.aspectRatio ?? "3:4",
			output_format: input.outputFormat ?? "png",
			safety_filter_level: "block_only_high",
			allow_fallback_model: false,
		},
	});

	let result = prediction;
	const deadline = Date.now() + 180_000;
	while (
		result.status !== "succeeded" &&
		result.status !== "failed" &&
		result.status !== "canceled"
	) {
		if (Date.now() > deadline) {
			throw new Error(`Nano Banana prediction timed out: ${result.id}`);
		}
		await new Promise((r) => setTimeout(r, 2_000));
		result = await replicate.predictions.get(result.id);
	}

	if (result.status !== "succeeded") {
		throw new Error(
			result.error ?? `Nano Banana prediction ${result.status}: ${result.id}`,
		);
	}

	const replicateUrl = extractImageUrl(result.output);
	return persistUrlToUploadThing(replicateUrl);
}
