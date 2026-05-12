import { env } from "@npanel/env/server";
import { Context } from "hono";
import { db, eq } from "@npanel/db";
import { zeepoAgentGeneration } from "@npanel/db/schema";
import { getQStashSigningKeys } from "@npanel/api/lib/qstash/client";
import Replicate from "replicate";
import { verifySignature } from "../../lib/qstash-verify";

interface ZeepoAgentPayload {
	generationId: string;
}

export async function handleZeepoAgent(c: Context) {
	const request = c.req.raw;
	try {
		const signingKeys = getQStashSigningKeys();
		await verifySignature(request, {
			currentSigningKey: signingKeys.current ?? undefined,
			nextSigningKey: signingKeys.next ?? undefined,
		});
	} catch (error) {
		console.error("[Worker][ZeepoAgent] Signature verification failed:", error);
		return c.json({ error: "Invalid QStash signature" }, 401);
	}

	let body: ZeepoAgentPayload;
	try {
		body = await request.clone().json();
	} catch {
		return c.json({ error: "Invalid JSON body" }, 400);
	}

	const { generationId } = body;
	if (!generationId) {
		return c.json({ error: "Missing generationId" }, 400);
	}

	const generation = await db.query.zeepoAgentGeneration.findFirst({
		where: eq(zeepoAgentGeneration.id, generationId),
	});

	if (!generation) {
		return c.json({ error: "Generation not found" }, 404);
	}

	const terminal: string[] = ["COMPLETED", "FAILED"];
	if (terminal.includes(generation.status)) {
		return c.json(
			{ message: "Generation already in terminal state", status: generation.status },
			200,
		);
	}

	const now = new Date();
	await db
		.update(zeepoAgentGeneration)
		.set({
			status: "PROCESSING",
			startedAt: now,
			updatedAt: now,
		})
		.where(eq(zeepoAgentGeneration.id, generationId));

	const replicateClient = new Replicate({
		auth: process.env.REPLICATE_API_TOKEN,
	});

	const webhookUrl = env.REPLICATE_ZEEPO_AGENT_WEBHOOK_URL;
	if (!webhookUrl) {
		console.warn(
			"REPLICATE_ZEEPO_AGENT_WEBHOOK_URL is not set; predictions will be created without webhooks.",
		);
	}

	try {
		const baseInput: Record<string, unknown> = {
			...(typeof generation.inputs === "object" && generation.inputs !== null
				? (generation.inputs as Record<string, unknown>)
				: {}),
		};

		baseInput.prompt =
			generation.prompt && generation.prompt.trim() !== ""
				? generation.prompt
				: "";

		const modelParts = (generation.modelId as string).split(":");
		const isVersioned = modelParts.length > 1;

		const prediction = await replicateClient.predictions.create({
			...(isVersioned ? { version: modelParts[1] } : { model: generation.modelId as any }),
			input: baseInput,
			...(webhookUrl
				? {
						webhook: `${webhookUrl}?generationId=${generationId}`,
						webhook_events_filter: ["completed"],
					}
				: {}),
		});

		await db
			.update(zeepoAgentGeneration)
			.set({
				predictionId: prediction.id,
				updatedAt: new Date(),
			})
			.where(eq(zeepoAgentGeneration.id, generationId));
	} catch (err) {
		let msg = err instanceof Error ? err.message : "Unknown error";
		if (
			msg.includes("429") ||
			msg.toLowerCase().includes("too many requests") ||
			msg.toLowerCase().includes("throttled")
		) {
			msg =
				"Replicate rate limit hit (HTTP 429). Please wait a few seconds or add credit, then try again.";
		}
		await db
			.update(zeepoAgentGeneration)
			.set({
				status: "FAILED",
				errorMessage: msg.slice(0, 500),
				updatedAt: new Date(),
			})
			.where(eq(zeepoAgentGeneration.id, generationId));
	}

	return c.json({
		success: true,
		generationId,
	});
}
