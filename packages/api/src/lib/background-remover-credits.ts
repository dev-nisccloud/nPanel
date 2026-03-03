/**
 * Server-side helpers for Background Remover credit checks and deductions.
 * Used by: startBackgroundRemoval (tRPC) to enforce at least 1 credit; worker to deduct after completion.
 */
import prisma from "@nPanel/db";

function parseCredits(value: string): number | null {
  const trimmed = value.trim().toLowerCase();
  if (trimmed === "unlimited" || trimmed === "") return null;
  const n = Number.parseFloat(trimmed);
  return Number.isFinite(n) ? n : null;
}

export type BackgroundRemoverCreditsResult = {
  subscriptionId: string;
  subscriptionUsageId: string;
  credits: number | null;
};

/**
 * Get the active Background Remover subscription usage for a team (by teamId).
 * Returns subscription id, usage row id, and parsed credits (null = unlimited).
 * Returns null if no active subscription or no usage row.
 */
export async function getBackgroundRemoverCreditsForTeam(
  teamId: string
): Promise<BackgroundRemoverCreditsResult | null> {
  const sub = await prisma.niscClientSubscription.findFirst({
    where: {
      teamId,
      status: "ACTIVE",
      product: {
        name: { contains: "Background Remover", mode: "insensitive" },
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
 * Call after a background removal is successfully saved to UploadThing + DB.
 * If credits are unlimited (null), no update is performed.
 */
export async function deductOneBackgroundRemoverCredit(params: {
  subscriptionUsageId: string;
  userId: string;
  metadata?: { generationId?: string };
}): Promise<void> {
  const usage = await prisma.niscClientSubscriptionUsage.findUnique({
    where: { id: params.subscriptionUsageId },
  });
  if (!usage) return;

  const current = parseCredits(usage.credits);
  if (current === null) return;

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
      description: "1 credit used for background removal",
      metadata: {
        amount: "-1",
        previousCredits,
        newCredits,
        reason: "background_removal",
        ...params.metadata,
      },
    },
  });
}

/**
 * Resolve team's Background Remover usage and deduct one credit.
 * No-op if teamId is null, no subscription/usage, or credits are unlimited.
 * Call from worker after a removal is successfully saved to UploadThing + DB.
 */
export async function deductOneCreditForTeamBackgroundRemover(params: {
  teamId: string | null;
  userId: string;
  metadata?: { generationId?: string };
}): Promise<void> {
  if (!params.teamId) return;
  const result = await getBackgroundRemoverCreditsForTeam(params.teamId);
  if (!result) return;
  await deductOneBackgroundRemoverCredit({
    subscriptionUsageId: result.subscriptionUsageId,
    userId: params.userId,
    metadata: params.metadata,
  });
}
