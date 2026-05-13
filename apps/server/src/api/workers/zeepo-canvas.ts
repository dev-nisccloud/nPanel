import { env } from "@npanel/env/server";
import { Context } from "hono";
import { db, eq } from "@npanel/db";
import { zeepoCanvasGeneration } from "@npanel/db/schema";
import { getQStashSigningKeys } from "@npanel/api/lib/qstash/client";
import { buildReplicateInput } from "@npanel/api/lib/replicate-model-input";
import Replicate from "replicate";
import { verifySignature } from "../../lib/qstash-verify";

interface ZeepoCanvasPayload {
	generationId: string;
}

/**
 * Worker: enqueue async Replicate predictions for Zeepo Canvas node generation.
 * Completion is handled by a separate Replicate webhook.
 */
export async function handleZeepoCanvas(c: Context) {
	const request = c.req.raw;
	try {
		const signingKeys = getQStashSigningKeys();
		await verifySignature(request, {
			currentSigningKey: signingKeys.current ?? undefined,
			nextSigningKey: signingKeys.next ?? undefined,
		});
	} catch (error) {
		console.error("[Worker][ZeepoCanvas] Signature verification failed:", error);
		return c.json({ error: "Invalid QStash signature" }, 401);
	}

	let body: ZeepoCanvasPayload;
	try {
		body = await request.clone().json();
	} catch {
		return c.json({ error: "Invalid JSON body" }, 400);
	}

	const { generationId } = body;
	if (!generationId) {
		return c.json({ error: "Missing generationId" }, 400);
	}

	const generation = await db.query.zeepoCanvasGeneration.findFirst({
		where: eq(zeepoCanvasGeneration.id, generationId),
	});

	if (!generation) {
		return c.json({ error: "Generation not found" }, 404);
	}

	const terminal: string[] = ["COMPLETED", "FAILED"];
	if (terminal.includes(generation.status)) {
		return c.json({ message: "Generation already in terminal state", status: generation.status }, 200);
	}

	const now = new Date();
	await db.update(zeepoCanvasGeneration)
		.set({
			status: "PROCESSING",
			startedAt: now,
			updatedAt: now,
		})
		.where(eq(zeepoCanvasGeneration.id, generationId));

	const replicateClient = new Replicate({
		auth: process.env.REPLICATE_API_TOKEN,
	});

	const webhookUrl = env.REPLICATE_ZEEPO_CANVAS_WEBHOOK_URL;
	if (!webhookUrl) {
		console.warn(
			"REPLICATE_ZEEPO_CANVAS_WEBHOOK_URL is not set; predictions will be created without webhooks. They will remain in PROCESSING state.",
		);
	}

	try {
		// Model-aware input mapping (e.g. minimax/qwen TTS need `text`, not `prompt`).
		const baseInput = buildReplicateInput({
			modelId: generation.modelId as string,
			prompt: generation.prompt,
			inputs: generation.inputs,
		});

		// Handle model identifiers with version hashes (e.g., "owner/name:hash")
		const modelParts = (generation.modelId as string).split(":");
		const isVersioned = modelParts.length > 1;

		const prediction = await replicateClient.predictions.create({
			...(isVersioned 
				? { version: modelParts[1] } 
				: { model: generation.modelId as any }),
			input: baseInput,
			...(webhookUrl
				? {
					webhook: `${webhookUrl}?generationId=${generationId}`,
					webhook_events_filter: ["completed"],
				}
				: {}),
		});

		await db.update(zeepoCanvasGeneration)
			.set({
				predictionId: prediction.id,
				updatedAt: new Date(),
			})
			.where(eq(zeepoCanvasGeneration.id, generationId));
	} catch (err) {
		let msg = err instanceof Error ? err.message : "Unknown error";
		if (
			msg.includes("429") ||
			msg.toLowerCase().includes("too many requests") ||
			msg.toLowerCase().includes("throttled")
		) {
			msg = "Replicate rate limit hit (HTTP 429). Please wait a few seconds or add credit, then try again.";
		}
		await db.update(zeepoCanvasGeneration)
			.set({
				status: "FAILED",
				errorMessage: msg.slice(0, 500),
				updatedAt: new Date(),
			})
			.where(eq(zeepoCanvasGeneration.id, generationId));
	}

	return c.json({
		success: true,
		generationId,
	});
}
