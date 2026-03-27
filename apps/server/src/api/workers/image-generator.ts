import { Context } from "hono";
import { db, eq, asc } from "@npanel/db";
import { imageGeneratorGeneration, imageGeneratorVariation } from "@npanel/db/schema";
import { getQStashSigningKeys } from "@npanel/api/lib/qstash/client";
import Replicate from "replicate";
import { verifySignature } from "../../lib/qstash-verify";

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

export async function handleImageGenerator(c: Context) {
	const request = c.req.raw;
	try {
		const signingKeys = getQStashSigningKeys();
		await verifySignature(request, {
			currentSigningKey: signingKeys.current ?? undefined,
			nextSigningKey: signingKeys.next ?? undefined,
		});
	} catch (error) {
		console.error("[Worker][ImageGenerator] Signature verification failed:", error);
		return c.json({ error: "Invalid QStash signature" }, 401);
	}

	let body: ImageGeneratorPayload;
	try {
		body = await request.clone().json();
	} catch {
		return c.json({ error: "Invalid JSON body" }, 400);
	}

	const { generationId } = body;
	if (!generationId) {
		return c.json({ error: "Missing generationId" }, 400);
	}

	// Use Drizzle to find generation with variations
	const generation = await db.query.imageGeneratorGeneration.findFirst({
		where: eq(imageGeneratorGeneration.id, generationId),
		with: {
			variations: {
				orderBy: asc(imageGeneratorVariation.variationIndex),
			},
		},
	});

	if (!generation) {
		return c.json({ error: "Generation not found" }, 404);
	}

	const terminal: string[] = ["COMPLETED", "FAILED"];
	if (terminal.includes(generation.status)) {
		return c.json({ message: "Generation already in terminal state", status: generation.status }, 200);
	}

	const now = new Date();
	await db.update(imageGeneratorGeneration)
		.set({
			status: "PROCESSING",
			startedAt: now,
			updatedAt: now,
		})
		.where(eq(imageGeneratorGeneration.id, generationId));

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

			await db.update(imageGeneratorVariation)
				.set({
					predictionId: prediction.id,
					updatedAt: new Date(),
				})
				.where(eq(imageGeneratorVariation.id, variation.id));
		} catch (err) {
			let msg = err instanceof Error ? err.message : "Unknown error";
			if (
				msg.includes("429") ||
				msg.toLowerCase().includes("too many requests") ||
				msg.toLowerCase().includes("throttled")
			) {
				msg = "Replicate rate limit hit (HTTP 429). Please wait a few seconds or add credit, then try again.";
			}
			await db.update(imageGeneratorVariation)
				.set({
					status: "FAILED",
					errorMessage: msg.slice(0, 500),
					updatedAt: new Date(),
				})
				.where(eq(imageGeneratorVariation.id, variation.id));
		}
	}

	return c.json({
		success: true,
		generationId,
	});
}
