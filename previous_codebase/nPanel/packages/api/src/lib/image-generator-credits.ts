/**
 * Server-side helpers for AI Image Generator credit checks and deductions.
 * Used by: startGeneration (tRPC) to cap variations; Replicate webhook to deduct after save.
 * Keeps a single source of truth and minimal DB calls to avoid affecting generation speed.
 */
import prisma from "@npanel/db";

function parseCredits(value: string): number | null {
  const trimmed = value.trim().toLowerCase();
  if (trimmed === "unlimited" || trimmed === "") return null;
  const n = Number.parseFloat(trimmed);
  return Number.isFinite(n) ? n : null;
}

export type AiImageGeneratorCreditsResult = {
  subscriptionId: string;
  subscriptionUsageId: string;
  credits: number | null;
};

/**
 * Get the active AI Image Generator subscription usage for a team (by teamId).
 * Returns subscription id, usage row id, and parsed credits (null = unlimited).
 * Returns null if no active subscription or no usage row.
 */
export async function getAiImageGeneratorCreditsForTeam(
  teamId: string
): Promise<AiImageGeneratorCreditsResult | null> {
  const sub = await prisma.niscClientSubscription.findFirst({
    where: {
      teamId,
      status: "ACTIVE",
      product: {
        name: { contains: "AI Image Generator", mode: "insensitive" },
      },
    },
    select: { id: true },
  });
  if (!sub) return null;

  const usage = await prisma.niscClientSubscriptionUsage.findFirst({
    where: { subscriptionId: sub.id },
    orderBy: { usageKind: "asc" },
  });
  if (!usage) return null;

  return {
    subscriptionId: sub.id,
    subscriptionUsageId: usage.id,
    credits: parseCredits(usage.credits),
  };
}

/**
 * Deduct one credit from a subscription usage row and log.
 * Call after a variation is successfully saved to UploadThing + DB.
 * If credits are unlimited (null), no update is performed.
 * Non-blocking: single update + one log insert; run after the main work.
 */
export async function deductOneImageGeneratorCredit(params: {
  subscriptionUsageId: string;
  userId: string;
  metadata?: { generationId?: string; variationId?: string };
}): Promise<void> {
  const usage = await prisma.niscClientSubscriptionUsage.findUnique({
    where: { id: params.subscriptionUsageId },
  });
  if (!usage) return;

  const current = parseCredits(usage.credits);
  if (current === null) {
    // Unlimited: no deduct
    return;
  }

  const previousCredits = usage.credits;
  const newValue = Math.max(0, current - 1);
  const newCredits = String(newValue);

  await prisma.niscClientSubscriptionUsage.update({
    where: { id: params.subscriptionUsageId },
    data: { credits: newCredits },
  });

  await prisma.niscClientSubscriptionUsageActivityLog.create({
    data: {
      subscriptionUsageId: params.subscriptionUsageId,
      userId: params.userId,
      action: "CREDIT_USE",
      description: "1 credit used for AI image generation",
      metadata: {
        amount: "-1",
        previousCredits,
        newCredits,
        reason: "image_generator_variation",
        ...params.metadata,
      },
    },
  });
}

/**
 * Resolve team's AI Image Generator usage and deduct one credit.
 * No-op if teamId is null, no subscription/usage, or credits are unlimited.
 * Call from webhook after a variation is successfully saved to UploadThing + DB.
 */
export async function deductOneCreditForTeamImageGenerator(params: {
  teamId: string | null;
  userId: string;
  metadata?: { generationId?: string; variationId?: string };
}): Promise<void> {
  if (!params.teamId) return;
  const result = await getAiImageGeneratorCreditsForTeam(params.teamId);
  if (!result) return;
  await deductOneImageGeneratorCredit({
    subscriptionUsageId: result.subscriptionUsageId,
    userId: params.userId,
    metadata: params.metadata,
  });
}
