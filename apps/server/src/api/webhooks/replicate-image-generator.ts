import { Context } from "hono";
import { db, eq } from "@npanel/db";
import {
  imageGeneratorVariation,
  imageGeneratorGeneration,
  emailBuilderLibrary
} from "@npanel/db/schema";
import { validateWebhook } from "replicate";
import { UTApi } from "uploadthing/server";
import { randomUUID } from "node:crypto";
import { deductOneCreditForTeamImageGenerator } from "@npanel/api/lib/image-generator-credits";

const utapi = new UTApi();

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

export async function handleReplicateWebhook(c: Context) {
  const request = c.req.raw;
  let payload: ReplicatePredictionPayload | null = null;

  try {
    const secret = process.env.REPLICATE_WEBHOOK_SIGNING_SECRET;
    if (secret) {
      // Use a cloned request for validation so we can still read the original body.
      const cloned = request.clone();
      const isValid = await validateWebhook(cloned as any, secret);
      if (!isValid) {
        console.error("[Webhook][Replicate] Invalid signature");
        return c.json({ error: "Invalid webhook signature" }, 401);
      }
      const rawBody = await request.text();
      payload = JSON.parse(rawBody) as ReplicatePredictionPayload;
    } else {
      // If no signing secret configured, fall back to trusting JSON body (dev only).
      payload = (await request.json()) as ReplicatePredictionPayload;
    }
  } catch (err) {
    console.error("[Webhook][Replicate] Validation failed:", err);
    return c.json({ error: "Invalid webhook" }, 400);
  }

  if (!payload?.id) {
    return c.json({ error: "Missing prediction id" }, 400);
  }

  const predictionId = payload.id;
  const status = payload.status;

  // We only care about terminal states here; intermediate events can be ignored.
  if (status !== "succeeded" && status !== "failed" && status !== "canceled") {
    return c.json({ ok: true });
  }

  const variation = await db.query.imageGeneratorVariation.findFirst({
    where: eq(imageGeneratorVariation.predictionId, predictionId),
    with: { imageGeneratorGeneration: true },
  });

  // If we don't find a matching variation, nothing to do.
  if (!variation) {
    console.warn(`[Webhook][Replicate] Variation not found for predictionId: ${predictionId}`);
    return c.json({ ok: true });
  }

  const now = new Date();
  let imageUrl: string | null = null;
  let variationStatus: "COMPLETED" | "FAILED" = "FAILED";
  let errorMessage: string | null = null;

  if (status === "succeeded") {
    const replicateImageUrl = extractImageUrl(payload.output);
    if (!replicateImageUrl) {
      variationStatus = "FAILED";
      errorMessage = "No image URL in Replicate output";
    } else {
      // Upload to UploadThing so we store a persistent URL (Replicate URLs expire)
      try {
        const uploadResult = await utapi.uploadFilesFromUrl(replicateImageUrl);
        const result = Array.isArray(uploadResult) ? uploadResult[0] : uploadResult;
        if (result?.data) {
          imageUrl = result.data.ufsUrl ?? result.data.url;
          variationStatus = "COMPLETED";

          // Save UploadThing URL and key
          await db.update(imageGeneratorVariation)
            .set({
              status: "COMPLETED",
              errorMessage: null,
              imageUrl,
              imageKey: result.data.key,
              imageFileName: result.data.name,
              imageSize: result.data.size,
              imageMimeType: result.data.type,
              imageMetadata: {
                model: "google/nano-banana-pro",
                resolution: variation.imageGeneratorGeneration.resolution,
                aspectRatio: variation.imageGeneratorGeneration.aspectRatio,
                outputFormat: variation.imageGeneratorGeneration.outputFormat,
              },
              updatedAt: now,
            })
            .where(eq(imageGeneratorVariation.id, variation.id));

          // Deduct 1 credit for customer (per variation, after save to DB)
          await deductOneCreditForTeamImageGenerator({
            teamId: variation.imageGeneratorGeneration.teamId as string,
            userId: variation.imageGeneratorGeneration.userId,
            metadata: {
              generationId: variation.imageGeneratorGenerationId,
              variationId: variation.id,
            },
          });

          // Also persist in EmailBuilderLibrary
          if (imageUrl) {
            const existingLibraryEntry = await db.query.emailBuilderLibrary.findFirst({
              where: eq(emailBuilderLibrary.storageKey, result.data.key ?? ""),
            });

            if (!existingLibraryEntry) {
              await db.insert(emailBuilderLibrary).values({
                id: randomUUID(),
                userId: variation.imageGeneratorGeneration.userId,
                teamId: variation.imageGeneratorGeneration.teamId,
                fileName: result.data.name,
                fileSize: result.data.size,
                mimeType: result.data.type,
                fileUrl: imageUrl,
                storageKey: result.data.key,
                description: "AI generated image",
                metadata: {
                  source: "imageGenerator",
                  generationId: variation.imageGeneratorGenerationId,
                  variationId: variation.id,
                },
                createdAt: now,
              });
            }
          }
        } else {
          variationStatus = "FAILED";
          errorMessage = "Failed to store image";
        }
      } catch (e) {
        console.error("[Webhook][Replicate] Upload failed:", e);
        variationStatus = "FAILED";
        errorMessage = "Failed to store image";
      }
    }
  } else {
    variationStatus = "FAILED";
    errorMessage = payload.error ?? "Prediction failed or canceled";
  }

  if (variationStatus !== "COMPLETED") {
    await db.update(imageGeneratorVariation)
      .set({
        status: "FAILED",
        errorMessage: errorMessage?.slice(0, 500) ?? "Unknown error",
        updatedAt: now,
      })
      .where(eq(imageGeneratorVariation.id, variation.id));
  }

  // Recompute generation-level status
  const siblings = await db.query.imageGeneratorVariation.findMany({
    where: eq(imageGeneratorVariation.imageGeneratorGenerationId, variation.imageGeneratorGenerationId),
  });

  const allTerminal = siblings.every((v) =>
    ["COMPLETED", "FAILED"].includes(v.status),
  );

  if (allTerminal) {
    const anyCompleted = siblings.some((v) => v.status === "COMPLETED");
    await db.update(imageGeneratorGeneration)
      .set({
        status: anyCompleted ? "COMPLETED" : "FAILED",
        errorMessage: anyCompleted ? null : "All variations failed",
        completedAt: now,
        updatedAt: now,
      })
      .where(eq(imageGeneratorGeneration.id, variation.imageGeneratorGenerationId));
  }

  return c.json({ ok: true });
}
