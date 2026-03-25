import { getQStashClient } from "./client";
import type { ImageGeneratorJobPayload, ImageGeneratorJobResult } from "./types";

/**
 * Worker URL must be set explicitly (Option A).
 * Use QSTASH_IMAGE_GENERATOR_WORKER_ENDPOINT, e.g.:
 * - Production: https://app.yourdomain.com/api/workers/image-generator
 * - Local (ngrok): https://your-subdomain.ngrok.io/api/workers/image-generator
 */
function getWorkerEndpoint(): string {
	const url = process.env.QSTASH_IMAGE_GENERATOR_WORKER_ENDPOINT?.trim();
	return url ? url.replace(/\/$/, "") : "";
}

function isLoopbackUrl(url: string): boolean {
	try {
		const u = new URL(url);
		const host = u.hostname.toLowerCase();
		return (
			host === "localhost" ||
			host === "127.0.0.1" ||
			host === "::1" ||
			host === "[::1]"
		);
	} catch {
		return false;
	}
}

/**
 * Enqueue an image generation for background processing via QStash.
 * Delivers immediately (no schedule); worker processes at once.
 */
export async function enqueueImageGeneration(
	generationId: string,
): Promise<ImageGeneratorJobResult> {
	const url = getWorkerEndpoint();
	if (!url) {
		throw new Error(
			"Image generator worker URL not configured. Set QSTASH_IMAGE_GENERATOR_WORKER_ENDPOINT (e.g. https://your-app.com/api/workers/image-generator).",
		);
	}
	if (isLoopbackUrl(url)) {
		throw new Error(
			"QStash cannot call localhost. For local development set QSTASH_IMAGE_GENERATOR_WORKER_ENDPOINT to a public URL (e.g. from ngrok).",
		);
	}

	const client = getQStashClient();
	const payload: ImageGeneratorJobPayload = { generationId };

	// Long‑running image generations can take many minutes.
	// Configure a generous QStash timeout (default 30 minutes, in seconds) so
	// the job is not marked as failed just because it runs long.
	const configuredTimeout =
		process.env.QSTASH_IMAGE_GENERATOR_TIMEOUT !== undefined
			? Number(process.env.QSTASH_IMAGE_GENERATOR_TIMEOUT) || 1800
			: 1800;
	// QStash httpTimeout quota on your plan is 900s; clamp to avoid errors.
	const timeout = Math.min(configuredTimeout, 900);
	const retries =
		process.env.QSTASH_IMAGE_GENERATOR_RETRIES !== undefined
			? Number(process.env.QSTASH_IMAGE_GENERATOR_RETRIES) || 0
			: undefined;

	const result = await client.publishJSON({
		url,
		body: payload,
		timeout,
		...(retries !== undefined ? { retries } : {}),
	});
	const messageId =
		"messageId" in result && typeof (result as any).messageId === "string"
			? (result as any).messageId
			: "";
	return { messageId };
}
