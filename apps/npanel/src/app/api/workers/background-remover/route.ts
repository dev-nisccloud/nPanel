import { NextRequest, NextResponse } from "next/server";
import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import prisma from "@nPanel/db";
import { getQStashSigningKeys } from "@nPanel/api/lib/qstash/client";
import Replicate from "replicate";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 min for background removal job

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

export async function POST(request: NextRequest) {
  try {
    const signingKeys = getQStashSigningKeys();
    await verifySignatureAppRouter(request as any, {
      currentSigningKey: signingKeys.current ?? undefined,
      nextSigningKey: signingKeys.next ?? undefined,
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid QStash signature" },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const { generationId } = body as BackgroundRemoverPayload;
  if (!generationId) {
    return NextResponse.json(
      { error: "Missing generationId" },
      { status: 400 },
    );
  }

  const generation = await prisma.backgroundRemoverGeneration.findUnique({
    where: { id: generationId },
  });

  if (!generation) {
    return NextResponse.json(
      { error: "Generation not found" },
      { status: 404 },
    );
  }

  const terminal = ["COMPLETED", "FAILED"];
  if (terminal.includes(generation.status)) {
    return NextResponse.json(
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
    const processedImageUrl = parseOutput(output);
    if (!processedImageUrl || typeof processedImageUrl !== "string") {
      throw new Error("No image URL in Replicate response");
    }

    const imageResponse = await fetch(processedImageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to download result: ${imageResponse.statusText}`);
    }
    const contentType =
      imageResponse.headers.get("content-type") ?? "image/png";
    const arrayBuffer = await imageResponse.arrayBuffer();
    const size = arrayBuffer.byteLength;

    const completedAt = new Date();
    await prisma.backgroundRemoverGeneration.update({
      where: { id: generationId },
      data: {
        status: "COMPLETED",
        errorMessage: null,
        processedImageUrl,
        processedImageKey: "",
        processedImageFileName: `background-removed-${Date.now()}.png`,
        processedImageSize: size,
        processedImageMimeType: contentType,
        processedImageMetadata: {
          model: BACKGROUND_REMOVER_MODEL,
          contentType,
          size,
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
          processedImageFileName: `background-removed-${Date.now()}.png`,
        },
        ipAddress: null,
        userAgent: null,
        createdAt: completedAt,
      },
    });

    return NextResponse.json({
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

    return NextResponse.json(
      { success: false, generationId, error: message },
      { status: 500 },
    );
  }
}
