import { NextRequest, NextResponse } from "next/server";
import prisma from "@nPanel/db";
import Replicate, { validateWebhook } from "replicate";

export const runtime = "nodejs";
export const maxDuration = 60;

type PredictionStatus = "starting" | "processing" | "succeeded" | "failed" | "canceled";

interface ReplicatePredictionPayload {
	id: string;
	status: PredictionStatus;
	error: string | null;
	output: unknown;
}

function extractImageUrl(output: unknown): string | null {
	if (!output) return null;
	if (typeof output === "string") return output;
	if (Array.isArray(output) && output.length > 0) {
		const first = output[0] as any;
		if (typeof first === "string") return first;
		if (first && typeof first === "object" && "url" in first) {
			const u = (first as { url?: string }).url;
			return typeof u === "string" ? u : String(u);
		}
	}
	if (output && typeof output === "object" && "url" in (output as any)) {
		const u = (output as { url?: string }).url;
		return typeof u === "string" ? u : String(u);
	}
	return null;
}

export async function POST(request: NextRequest) {
	let payload: ReplicatePredictionPayload | null = null;

	try {
		const secret = process.env.REPLICATE_WEBHOOK_SIGNING_SECRET;
		if (secret) {
			// Use a cloned request for validation so we can still read the original body.
			const cloned = request.clone();
			const isValid = await validateWebhook(cloned as any, secret);
			if (!isValid) {
				return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
			}
			const rawBody = await request.text();
			payload = JSON.parse(rawBody) as ReplicatePredictionPayload;
		} else {
			// If no signing secret configured, fall back to trusting JSON body (dev only).
			payload = (await request.json()) as ReplicatePredictionPayload;
		}
	} catch (err) {
		console.error("Error validating Replicate webhook:", err);
		return NextResponse.json({ error: "Invalid webhook" }, { status: 400 });
	}

	if (!payload?.id) {
		return NextResponse.json({ error: "Missing prediction id" }, { status: 400 });
	}

	const predictionId = payload.id;
	const status = payload.status;

	// We only care about terminal states here; intermediate events can be ignored.
	if (status !== "succeeded" && status !== "failed" && status !== "canceled") {
		return NextResponse.json({ ok: true });
	}

	const variation = await prisma.imageGeneratorVariation.findFirst({
		where: { predictionId },
		include: { imageGeneratorGeneration: true },
	});

	// If we don't find a matching variation, nothing to do.
	if (!variation) {
		return NextResponse.json({ ok: true });
	}

	const now = new Date();
	let imageUrl: string | null = null;
	let variationStatus: "COMPLETED" | "FAILED" = "FAILED";
	let errorMessage: string | null = null;

	if (status === "succeeded") {
		imageUrl = extractImageUrl(payload.output);
		if (!imageUrl) {
			variationStatus = "FAILED";
			errorMessage = "No image URL in Replicate output";
		} else {
			variationStatus = "COMPLETED";
		}
	} else {
		variationStatus = "FAILED";
		errorMessage = payload.error ?? "Prediction failed or canceled";
	}

	if (variationStatus === "COMPLETED" && imageUrl) {
		await prisma.imageGeneratorVariation.update({
			where: { id: variation.id },
			data: {
				status: "COMPLETED",
				errorMessage: null,
				imageUrl,
				imageKey: "",
				imageFileName: variation.imageFileName ?? `ai-generated-${Date.now()}-${variation.variationIndex}.${variation.imageGeneratorGeneration.outputFormat}`,
				imageSize: variation.imageSize ?? 0,
				imageMimeType: variation.imageMimeType ?? `image/${variation.imageGeneratorGeneration.outputFormat === "jpg" ? "jpeg" : "png"}`,
				imageMetadata: {
					model: "google/nano-banana-pro",
					resolution: variation.imageGeneratorGeneration.resolution,
					aspectRatio: variation.imageGeneratorGeneration.aspectRatio,
					outputFormat: variation.imageGeneratorGeneration.outputFormat,
				},
				updatedAt: now,
			},
		});
	} else {
		await prisma.imageGeneratorVariation.update({
			where: { id: variation.id },
			data: {
				status: "FAILED",
				errorMessage: errorMessage?.slice(0, 500) ?? "Unknown error",
				updatedAt: now,
			},
		});
	}

	// Recompute generation-level status
	const siblings = await prisma.imageGeneratorVariation.findMany({
		where: { imageGeneratorGenerationId: variation.imageGeneratorGenerationId },
	});

	const allTerminal = siblings.every((v) =>
		["COMPLETED", "FAILED"].includes(v.status),
	);

	if (allTerminal) {
		const anyCompleted = siblings.some((v) => v.status === "COMPLETED");
		await prisma.imageGeneratorGeneration.update({
			where: { id: variation.imageGeneratorGenerationId },
			data: {
				status: anyCompleted ? "COMPLETED" : "FAILED",
				errorMessage: anyCompleted ? null : "All variations failed",
				completedAt: now,
				updatedAt: now,
			},
		});
	}

	return NextResponse.json({ ok: true });
}

