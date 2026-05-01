import { verifySignatureAppRouter } from "@/lib/qstash-verify";
import prisma from "@npanel/db";
import { getQStashSigningKeys } from "@npanel/api/lib/qstash/client";
import Replicate from "replicate";

interface ZeepoCanvasPayload {
	generationId: string;
}

/**
 * Worker: enqueue async Replicate predictions for Zeepo Canvas node generation.
 * Completion is handled by a separate Replicate webhook.
 */
export async function POST(request: Request) {
	try {
		const signingKeys = getQStashSigningKeys();
		await verifySignatureAppRouter(request as any, {
			currentSigningKey: signingKeys.current ?? undefined,
			nextSigningKey: signingKeys.next ?? undefined,
		});
	} catch (error) {
		return Response.json(
			{ error: "Invalid QStash signature" },
			{ status: 401 },
		);
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return Response.json(
			{ error: "Invalid JSON body" },
			{ status: 400 },
		);
	}

	const { generationId } = body as ZeepoCanvasPayload;
	if (!generationId) {
		return Response.json(
			{ error: "Missing generationId" },
			{ status: 400 },
		);
	}

	const generation = await prisma.zeepoCanvasGeneration.findUnique({
		where: { id: generationId },
	});

	if (!generation) {
		return Response.json(
			{ error: "Generation not found" },
			{ status: 404 },
		);
	}

	const terminal: string[] = ["COMPLETED", "FAILED"];
	if (terminal.includes(generation.status)) {
		return Response.json(
			{ message: "Generation already in terminal state", status: generation.status },
			{ status: 200 },
		);
	}

	const now = new Date();
	await prisma.zeepoCanvasGeneration.update({
		where: { id: generationId },
		data: {
			status: "PROCESSING",
			startedAt: now,
			updatedAt: now,
		},
	});

	const replicateClient = new Replicate({
		auth: process.env.REPLICATE_API_TOKEN,
	});

	const webhookUrl = process.env.REPLICATE_ZEEPO_CANVAS_WEBHOOK_URL;
	if (!webhookUrl) {
		console.warn(
			"REPLICATE_ZEEPO_CANVAS_WEBHOOK_URL is not set; predictions will be created without webhooks. They will remain in PROCESSING state.",
		);
	}

	try {
		// Construct Replicate inputs based on the model category
		// By default, Replicate takes `prompt`. For specific models, map `inputs` to their required fields.
		const baseInput: any = {
			...(typeof generation.inputs === 'object' && generation.inputs !== null ? generation.inputs : {})
		};

		if (generation.prompt && generation.prompt.trim() !== "") {
			baseInput.prompt = generation.prompt;
		}

		const prediction = await replicateClient.predictions.create({
			model: generation.modelId as any,
			input: baseInput,
			...(webhookUrl
				? {
					webhook: `${webhookUrl}?generationId=${generationId}`,
					webhook_events_filter: ["completed"],
				}
				: {}),
		});

		await prisma.zeepoCanvasGeneration.update({
			where: { id: generationId },
			data: {
				predictionId: prediction.id,
				updatedAt: new Date(),
			},
		});
	} catch (err) {
		let msg = err instanceof Error ? err.message : "Unknown error";
		if (
			msg.includes("429") ||
			msg.toLowerCase().includes("too many requests") ||
			msg.toLowerCase().includes("throttled")
		) {
			msg = "Replicate rate limit hit (HTTP 429). Please wait a few seconds or add credit, then try again.";
		}
		await prisma.zeepoCanvasGeneration.update({
			where: { id: generationId },
			data: {
				status: "FAILED",
				errorMessage: msg.slice(0, 500),
				updatedAt: new Date(),
			},
		});
	}

	return Response.json({
		success: true,
		generationId,
	});
}
