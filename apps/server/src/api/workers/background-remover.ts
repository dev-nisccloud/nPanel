import { Context } from "hono";
import { db, eq } from "@npanel/db";
import { backgroundRemoverGeneration, backgroundRemoverGenerationActivityLog } from "@npanel/db/schema";
import { getQStashSigningKeys } from "@npanel/api/lib/qstash/client";
import { deductOneCreditForTeamBackgroundRemover } from "@npanel/api/lib/background-remover-credits";
import Replicate from "replicate";
import { UTApi } from "uploadthing/server";
import { randomUUID } from "node:crypto";
import { verifySignature } from "../../lib/qstash-verify";

const utapi = new UTApi();

const BACKGROUND_REMOVER_MODEL =
  "851-labs/background-remover:a029dff38972b5fda4ec5d75d7d1cd25aeff621d2cf4946a41055d7db66b80bc";

interface BackgroundRemoverPayload {
  generationId: string;
}

function parseOutput(output: unknown): string {
  console.log("[Worker][BackgroundRemover] Raw Replicate output type:", typeof output);
  if (typeof output === "string") return output;
  if (Array.isArray(output) && output.length > 0) return String(output[0]);
  if (output && typeof output === "object") {
    const obj = output as any;
    if (typeof obj.url === "function") return String(obj.url());
    if (typeof obj.url === "string") return obj.url;
    if ("url" in obj) return String(obj.url);
    
    // Some Replicate outputs can be stringified directly to a URL
    const str = String(output);
    if (str.startsWith("http")) return str;
  }
  throw new Error(`Unexpected Replicate output: ${JSON.stringify(output)}`);
}

export async function handleBackgroundRemover(c: Context) {
  const request = c.req.raw;
  try {
    const signingKeys = getQStashSigningKeys();
    await verifySignature(request, {
      currentSigningKey: signingKeys.current ?? undefined,
      nextSigningKey: signingKeys.next ?? undefined,
    });
  } catch (error) {
    console.error("[Worker][BackgroundRemover] Signature verification failed:", error);
    return c.json({ error: "Invalid QStash signature" }, 401);
  }

  let body: BackgroundRemoverPayload;
  try {
    body = await request.clone().json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const { generationId } = body;
  if (!generationId) {
    return c.json({ error: "Missing generationId" }, 400);
  }

  const generation = await db.query.backgroundRemoverGeneration.findFirst({
    where: eq(backgroundRemoverGeneration.id, generationId),
  });

  if (!generation) {
    return c.json({ error: "Generation not found" }, 404);
  }

  const terminal = ["COMPLETED", "FAILED"];
  if (terminal.includes(generation.status)) {
    return c.json({ message: "Already in terminal state", status: generation.status }, 200);
  }

  const now = new Date();
  await db.update(backgroundRemoverGeneration)
    .set({
      status: "PROCESSING",
      startedAt: now,
      updatedAt: now,
    })
    .where(eq(backgroundRemoverGeneration.id, generationId));

  const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
  });

  try {
    console.log(`[Worker][BackgroundRemover] Starting for generationId: ${generationId}`);
    const output = await replicate.run(
      BACKGROUND_REMOVER_MODEL as `${string}/${string}`,
      { input: { image: generation.originalImageUrl } },
    );
    
    console.log(`[Worker][BackgroundRemover] Replicate output received`);
    const replicateImageUrl = parseOutput(output);
    if (!replicateImageUrl || typeof replicateImageUrl !== "string") {
      throw new Error("No image URL in Replicate response");
    }

    console.log(`[Worker][BackgroundRemover] Uploading to UploadThing: ${replicateImageUrl}`);
    const uploadResult = await utapi.uploadFilesFromUrl(replicateImageUrl);
    const result = Array.isArray(uploadResult) ? uploadResult[0] : uploadResult;
    
    if (result?.error) {
       console.error("[Worker][BackgroundRemover] UploadThing error:", result.error);
       throw new Error(`UploadThing error: ${result.error.message}`);
    }

    if (!result?.data) {
      throw new Error("Failed to store processed image - no data in result");
    }

    const processedImageUrl = result.data.ufsUrl ?? result.data.url;
    console.log(`[Worker][BackgroundRemover] Image stored: ${processedImageUrl}`);
    
    const completedAt = new Date();
    await db.update(backgroundRemoverGeneration)
      .set({
        status: "COMPLETED",
        errorMessage: null,
        processedImageUrl,
        processedImageKey: result.data.key,
        processedImageFileName: result.data.name,
        processedImageSize: result.data.size,
        processedImageMimeType: result.data.type,
        processedImageMetadata: {
          model: BACKGROUND_REMOVER_MODEL,
          contentType: result.data.type,
          size: result.data.size,
        },
        completedAt,
        updatedAt: completedAt,
      })
      .where(eq(backgroundRemoverGeneration.id, generationId));

    await db.insert(backgroundRemoverGenerationActivityLog).values({
      id: randomUUID(),
      backgroundRemoverGenerationId: generationId,
      userId: generation.userId,
      action: "GENERATE",
      description: "Background removal completed",
      metadata: {
        model: BACKGROUND_REMOVER_MODEL,
        processedImageFileName: result.data.name,
      },
      createdAt: completedAt,
    });

    console.log(`[Worker][BackgroundRemover] Deducting credits for team: ${generation.teamId}`);
    await deductOneCreditForTeamBackgroundRemover({
      teamId: generation.teamId as string,
      userId: generation.userId,
      metadata: { generationId },
    });

    console.log(`[Worker][BackgroundRemover] Completed successfully`);
    return c.json({
      success: true,
      generationId,
      status: "COMPLETED",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`[Worker][BackgroundRemover] Failed: ${message}`, err);
    // ...
    const completedAt = new Date();
    await db.update(backgroundRemoverGeneration)
      .set({
        status: "FAILED",
        errorMessage: message.slice(0, 500),
        completedAt,
        updatedAt: completedAt,
      })
      .where(eq(backgroundRemoverGeneration.id, generationId));

    await db.insert(backgroundRemoverGenerationActivityLog).values({
      id: randomUUID(),
      backgroundRemoverGenerationId: generationId,
      userId: generation.userId,
      action: "GENERATE",
      description: `Background removal failed: ${message.slice(0, 200)}`,
      metadata: { model: BACKGROUND_REMOVER_MODEL, error: message.slice(0, 500) },
      createdAt: completedAt,
    });

    return c.json({ success: false, generationId, error: message }, 500);
  }
}
