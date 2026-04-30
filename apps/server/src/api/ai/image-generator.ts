import { Context } from "hono";
import { db, eq } from "@npanel/db";
import { 
  imageGeneratorGeneration, 
  imageGeneratorVariation,
  imageGeneratorGenerationActivityLog
} from "@npanel/db/schema/image-generator";
import { randomUUID } from "node:crypto";
import Replicate from "replicate";
import { 
  getAiImageGeneratorCreditsForTeam, 
  deductOneCreditForTeamImageGenerator 
} from "@npanel/api/lib/image-generator-credits";
import { z } from "zod";

const generateSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  referenceImageUrls: z.array(z.string().url()).max(14).optional().default([]),
  aspectRatio: z.enum(["1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"]).default("4:3"),
  outputFormat: z.enum(["png", "jpg"]).default("png"),
  resolution: z.enum(["1K", "2K", "4K"]).default("2K"),
  teamId: z.string().optional(),
});

function convertAspectRatio(aspectRatio: string): string {
  const ratioMap: Record<string, string> = {
    "1:1": "1:1", "2:3": "2:3", "3:2": "3:2", "3:4": "3:4", "4:3": "4:3",
    "4:5": "4:5", "5:4": "5:4", "9:16": "9:16", "16:9": "16:9", "21:9": "21:9",
  };
  return ratioMap[aspectRatio] ?? "4:3";
}

function convertResolution(resolution: string): string {
  return ["1K", "2K", "4K"].includes(resolution) ? resolution : "2K";
}

function convertOutputFormat(format: string): string {
  return format === "jpg" ? "jpeg" : "png";
}

export async function handleExternalImageGeneration(c: Context) {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  let body;
  try {
    body = await c.req.json();
  } catch (err) {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const result = generateSchema.safeParse(body);
  if (!result.success) {
    return c.json({ error: result.error.flatten() }, 400);
  }

  const input = result.data;
  const teamId = input.teamId;

  // Credit check for CUSTOMER role
  const isCustomer = user.role === "CUSTOMER" || (Array.isArray(user.role) && user.role.includes("CUSTOMER"));
  if (isCustomer) {
    if (!teamId) {
      return c.json({ error: "teamId is required for customer accounts" }, 400);
    }
    const creditsResult = await getAiImageGeneratorCreditsForTeam(teamId);
    if (!creditsResult) {
      return c.json({ error: "No active AI Image Generator subscription found for this team" }, 403);
    }
    if (creditsResult.credits !== null && creditsResult.credits < 1) {
      return c.json({ error: "Insufficient credits" }, 403);
    }
  }

  const replicateClient = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
  });

  const generationId = randomUUID();
  const now = new Date();

  // Create record
  await db.insert(imageGeneratorGeneration).values({
    id: generationId,
    userId: user.id,
    teamId: teamId ?? null,
    prompt: input.prompt,
    referenceImageUrls: input.referenceImageUrls.length > 0 ? input.referenceImageUrls : null,
    aspectRatio: input.aspectRatio,
    outputFormat: input.outputFormat,
    resolution: input.resolution,
    variationsCount: 1,
    modelId: "google/imagen-4-ultra",
    modelName: "Imagen 4 Ultra",
    status: "PROCESSING",
    createdAt: now,
    updatedAt: now,
  });

  const variationId = randomUUID();
  await db.insert(imageGeneratorVariation).values({
    id: variationId,
    imageGeneratorGenerationId: generationId,
    variationIndex: 1,
    status: "PROCESSING",
    createdAt: now,
    updatedAt: now,
  });

  try {
    // Create and wait for prediction
    let prediction = await replicateClient.predictions.create({
      model: "google/imagen-4-ultra",
      input: {
        prompt: input.prompt,
        resolution: convertResolution(input.resolution),
        image_input: input.referenceImageUrls,
        aspect_ratio: convertAspectRatio(input.aspectRatio),
        output_format: convertOutputFormat(input.outputFormat),
        safety_filter_level: "block_only_high",
      },
    });

    prediction = await replicateClient.wait(prediction);
    const output = prediction.output;

    if (prediction.status === "failed") {
      throw new Error(`Model prediction failed: ${prediction.error || "Unknown error"}`);
    }

    let imageUrl: string;
    if (typeof output === "string") {
      imageUrl = output;
    } else if (Array.isArray(output) && output.length > 0) {
      imageUrl = output[0] as string;
    } else if (output && typeof output === "object" && "url" in output && typeof (output as any).url === "string") {
      imageUrl = (output as any).url;
    } else {
      console.error("[ExternalAPI][ImageGenerator] Unexpected output format from Replicate:", JSON.stringify(output));
      throw new Error("Unexpected output format from AI model");
    }

    // Update DB
    await db.update(imageGeneratorVariation)
      .set({
        status: "COMPLETED",
        imageUrl,
        updatedAt: new Date(),
      })
      .where(eq(imageGeneratorVariation.id, variationId));

    await db.update(imageGeneratorGeneration)
      .set({
        status: "COMPLETED",
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(imageGeneratorGeneration.id, generationId));

    // Deduct credit
    if (isCustomer && teamId) {
      await deductOneCreditForTeamImageGenerator({
        teamId,
        userId: user.id,
        metadata: { generationId, variationId },
      });
    }

    // Log activity
    await db.insert(imageGeneratorGenerationActivityLog).values({
      id: randomUUID(),
      imageGeneratorGenerationId: generationId,
      userId: user.id,
      action: "GENERATE",
      description: `Synchronous generation via API: ${input.prompt.substring(0, 50)}...`,
      metadata: { 
        prompt: input.prompt, 
        isExternalApi: true 
      },
      createdAt: new Date(),
    });

    return c.json({
      success: true,
      generationId,
      imageUrl,
    });

  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Generation failed";
    await db.update(imageGeneratorVariation)
      .set({
        status: "FAILED",
        errorMessage: errorMsg,
        updatedAt: new Date(),
      })
      .where(eq(imageGeneratorVariation.id, variationId));

    await db.update(imageGeneratorGeneration)
      .set({
        status: "FAILED",
        errorMessage: errorMsg,
        updatedAt: new Date(),
      })
      .where(eq(imageGeneratorGeneration.id, generationId));

    return c.json({ error: errorMsg }, 500);
  }
}
