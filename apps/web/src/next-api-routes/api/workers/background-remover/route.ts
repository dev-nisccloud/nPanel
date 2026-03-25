import { verifySignatureAppRouter } from "@/lib/qstash-verify";
import prisma from "@npanel/db";
import { getQStashSigningKeys } from "@npanel/api/lib/qstash/client";
import { deductOneCreditForTeamBackgroundRemover } from "@npanel/api/lib/background-remover-credits";
import Replicate from "replicate";
import { UTApi } from "uploadthing/server";
import { randomUUID } from "node:crypto";

const utapi = new UTApi();

const BACKGROUND_REMOVER_MODEL =
  "851-labs/background-remover:a029dff38972b5fda4ec5d75d7d1cd25aeff621d2cf4946a41055d7db66b80bc";

interface BackgroundRemoverPayload {
  generationId: string;
}

function parseOutput(output: unknown): string {
  if (typeof output === "string") return output;
  if (Array.isArray(output) && output.length > 0) return output[0] as string;
  if (output && typeof output === "object" && "url" in output) {
    const u = (output as { url?: string }).url;
    return typeof u === "string" ? u : String(u);
  }
  if (output && typeof output === "object" && typeof (output as { url?: () => string }).url === "function") {
    return (output as { url: () => string }).url();
  }
  throw new Error(`Unexpected Replicate output: ${JSON.stringify(output)}`);
}

export async function POST(request: Request) {
  try {
    const signingKeys = getQStashSigningKeys();
    await verifySignatureAppRouter(request as any, {
      currentSigningKey: signingKeys.current ?? undefined,
      nextSigningKey: signingKeys.next ?? undefined,
    });
  } catch {
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

  const { generationId } = body as BackgroundRemoverPayload;
  if (!generationId) {
    return Response.json(
      { error: "Missing generationId" },
      { status: 400 },
    );
  }

  const generation = await prisma.backgroundRemoverGeneration.findUnique({
    where: { id: generationId },
  });

  if (!generation) {
    return Response.json(
      { error: "Generation not found" },
      { status: 404 },
    );
  }

  const terminal = ["COMPLETED", "FAILED"];
  if (terminal.includes(generation.status)) {
    return Response.json(
      { message: "Already in terminal state", status: generation.status },
      { status: 200 },
    );
  }

  const now = new Date();
  await prisma.backgroundRemoverGeneration.update({
    where: { id: generationId },
    data: {
      status: "PROCESSING",
      startedAt: now,
      updatedAt: now,
    },
  });

  const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
  });

  try {
    const output = await replicate.run(
      BACKGROUND_REMOVER_MODEL as `${string}/${string}`,
      { input: { image: generation.originalImageUrl } },
    );
    const replicateImageUrl = parseOutput(output);
    if (!replicateImageUrl || typeof replicateImageUrl !== "string") {
      throw new Error("No image URL in Replicate response");
    }

    // Upload to UploadThing so we store a persistent URL (Replicate URLs expire)
    const uploadResult = await utapi.uploadFilesFromUrl(replicateImageUrl);
    const result = Array.isArray(uploadResult) ? uploadResult[0] : uploadResult;
    if (!result?.data) {
      throw new Error("Failed to store processed image");
    }

    const processedImageUrl = result.data.ufsUrl ?? result.data.url;
    const completedAt = new Date();
    await prisma.backgroundRemoverGeneration.update({
      where: { id: generationId },
      data: {
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
      },
    });

    await prisma.backgroundRemoverGenerationActivityLog.create({
      data: {
        id: randomUUID(),
        backgroundRemoverGenerationId: generationId,
        userId: generation.userId,
        action: "GENERATE",
        description: "Background removal completed",
        metadata: {
          model: BACKGROUND_REMOVER_MODEL,
          processedImageFileName: result.data.name,
        },
        ipAddress: null,
        userAgent: null,
        createdAt: completedAt,
      },
    });

    await deductOneCreditForTeamBackgroundRemover({
      teamId: generation.teamId,
      userId: generation.userId,
      metadata: { generationId },
    });

    return Response.json({
      success: true,
      generationId,
      status: "COMPLETED",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const completedAt = new Date();
    await prisma.backgroundRemoverGeneration.update({
      where: { id: generationId },
      data: {
        status: "FAILED",
        errorMessage: message.slice(0, 500),
        completedAt,
        updatedAt: completedAt,
      },
    });

    await prisma.backgroundRemoverGenerationActivityLog.create({
      data: {
        id: randomUUID(),
        backgroundRemoverGenerationId: generationId,
        userId: generation.userId,
        action: "GENERATE",
        description: `Background removal failed: ${message.slice(0, 200)}`,
        metadata: { model: BACKGROUND_REMOVER_MODEL, error: message.slice(0, 500) },
        ipAddress: null,
        userAgent: null,
        createdAt: completedAt,
      },
    });

    return Response.json(
      { success: false, generationId, error: message },
      { status: 500 },
    );
  }
}
