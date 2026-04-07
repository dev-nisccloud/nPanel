/**
 * Server-side helpers for Background Remover credit checks and deductions.
 * Used by: startBackgroundRemoval (tRPC) to enforce at least 1 credit; worker to deduct after completion.
 */
import { and, eq, ilike, asc } from "@npanel/db";
import { db } from "@npanel/db";
import { niscClientSubscription, niscClientSubscriptionUsage, niscClientSubscriptionUsageActivityLog, niscProduct, } from "@npanel/db/schema/products";
function parseCredits(value) {
    const trimmed = value.trim().toLowerCase();
    if (trimmed === "unlimited" || trimmed === "")
        return null;
    const n = Number.parseFloat(trimmed);
    return Number.isFinite(n) ? n : null;
}
/**
 * Get the active Background Remover subscription usage for a team (by teamId).
 * Returns subscription id, usage row id, and parsed credits (null = unlimited).
 * Returns null if no active subscription or no usage row.
 */
export async function getBackgroundRemoverCreditsForTeam(teamId) {
    const subRow = await db
        .select({ id: niscClientSubscription.id })
        .from(niscClientSubscription)
        .leftJoin(niscProduct, eq(niscClientSubscription.productId, niscProduct.id))
        .where(and(eq(niscClientSubscription.teamId, teamId), eq(niscClientSubscription.status, "ACTIVE"), ilike(niscProduct.name, "%Background Remover%")))
        .limit(1);
    const sub = subRow[0];
    if (!sub)
        return null;
    const usage = await db.query.niscClientSubscriptionUsage.findFirst({
        where: eq(niscClientSubscriptionUsage.subscriptionId, sub.id),
        orderBy: asc(niscClientSubscriptionUsage.usageKind),
    });
    if (!usage)
        return null;
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
export async function deductOneBackgroundRemoverCredit(params) {
    const usage = await db.query.niscClientSubscriptionUsage.findFirst({
        where: eq(niscClientSubscriptionUsage.id, params.subscriptionUsageId),
    });
    if (!usage)
        return;
    const current = parseCredits(usage.credits);
    if (current === null)
        return;
    const previousCredits = usage.credits;
    const newValue = Math.max(0, current - 1);
    const newCredits = String(newValue);
    await db
        .update(niscClientSubscriptionUsage)
        .set({ credits: newCredits })
        .where(eq(niscClientSubscriptionUsage.id, params.subscriptionUsageId));
    await db.insert(niscClientSubscriptionUsageActivityLog).values({
        id: crypto.randomUUID(),
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
        createdAt: new Date(),
    });
}
/**
 * Resolve team's Background Remover usage and deduct one credit.
 * No-op if teamId is null, no subscription/usage, or credits are unlimited.
 * Call from worker after a removal is successfully saved to UploadThing + DB.
 */
export async function deductOneCreditForTeamBackgroundRemover(params) {
    if (!params.teamId)
        return;
    const result = await getBackgroundRemoverCreditsForTeam(params.teamId);
    if (!result)
        return;
    await deductOneBackgroundRemoverCredit({
        subscriptionUsageId: result.subscriptionUsageId,
        userId: params.userId,
        metadata: params.metadata,
    });
}
