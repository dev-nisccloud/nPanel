import { verifySignatureAppRouter } from "@/lib/qstash-verify";
import prisma from "@npanel/db";
import { getQStashSigningKeys } from "@npanel/api/lib/qstash/client";
import Replicate from "replicate";
import { randomUUID } from "node:crypto";

// Worker only enqueues Replicate predictions; should finish quickly.

interface ImageGeneratorPayload {
	generationId: string;
}

function convertAspectRatio(aspectRatio: string): string {
	const ratioMap: Record<string, string> = {
		"1:1": "1:1",
		"2:3": "2:3",
		"3:2": "3:2",
		"3:4": "3:4",
		"4:3": "4:3",
		"4:5": "4:5",
		"5:4": "5:4",
		"9:16": "9:16",
		"16:9": "16:9",
		"21:9": "21:9",
	};
	return ratioMap[aspectRatio] ?? "4:3";
}

function convertResolution(resolution: string): string {
	return resolution === "1K" || resolution === "2K" || resolution === "4K"
		? resolution
		: "2K";
}

function convertOutputFormat(format: string): string {
	return format === "jpg" ? "jpeg" : "png";
}

/**
 * Worker: enqueue async Replicate predictions for each variation.
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

	const { generationId } = body as ImageGeneratorPayload;
	if (!generationId) {
		return Response.json(
			{ error: "Missing generationId" },
			{ status: 400 },
		);
	}

	const generation = await prisma.imageGeneratorGeneration.findUnique({
		where: { id: generationId },
		include: {
			variations: { orderBy: { variationIndex: "asc" } },
		},
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
	await prisma.imageGeneratorGeneration.update({
		where: { id: generationId },
		data: {
			status: "PROCESSING",
			startedAt: now,
			updatedAt: now,
		},
	});

	const referenceImageUrls: string[] = Array.isArray(generation.referenceImageUrls)
		? (generation.referenceImageUrls as string[])
		: typeof generation.referenceImageUrls === "string"
			? (() => {
				try {
					return JSON.parse(generation.referenceImageUrls as string) as string[];
				} catch {
					return [];
				}
			})()
			: [];

	const replicateClient = new Replicate({
		auth: process.env.REPLICATE_API_TOKEN,
	});

	const webhookUrl = process.env.REPLICATE_IMAGE_GENERATOR_WEBHOOK_URL;
	if (!webhookUrl) {
		console.warn(
			"REPLICATE_IMAGE_GENERATOR_WEBHOOK_URL is not set; predictions will be created without webhooks.",
		);
	}

	for (const variation of generation.variations) {
		try {
			const prediction = await replicateClient.predictions.create({
				model: "google/nano-banana-pro",
				input: {
					prompt: generation.prompt,
					resolution: convertResolution(generation.resolution),
					image_input: referenceImageUrls,
					aspect_ratio: convertAspectRatio(generation.aspectRatio),
					output_format: convertOutputFormat(generation.outputFormat),
					safety_filter_level: "block_only_high",
				},
				...(webhookUrl
					? {
						webhook: webhookUrl,
						webhook_events_filter: ["completed"],
					}
					: {}),
			});

			await prisma.imageGeneratorVariation.update({
				where: { id: variation.id },
				data: {
					predictionId: prediction.id,
					updatedAt: new Date(),
				},
			});
		} catch (err) {
			let msg =
				err instanceof Error ? err.message : "Unknown error";
			// Make Replicate 429 errors clearer for the UI.
			if (
				msg.includes("429") ||
				msg.toLowerCase().includes("too many requests") ||
				msg.toLowerCase().includes("throttled")
			) {
				msg =
					"Replicate rate limit hit (HTTP 429). Please wait a few seconds or add credit, then try again.";
			}
			await prisma.imageGeneratorVariation.update({
				where: { id: variation.id },
				data: {
					status: "FAILED",
					errorMessage: msg.slice(0, 500),
					updatedAt: new Date(),
				},
			});
		}
	}

	return Response.json({
		success: true,
		generationId,
	});
}
