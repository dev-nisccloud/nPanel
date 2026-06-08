/**
 * Provisions initial usage credits for a newly created subscription when the
 * product/plan has NiscProductPlanUsage (usage limits and overuse config).
 * Creates NiscClientSubscriptionUsage rows with credits = plan's limitValue
 * and logs each in NiscClientSubscriptionUsageActivityLog.
 */
import { and, eq, isNull } from "@npanel/db";
import { db } from "@npanel/db";
import { niscClientSubscriptionActivityLog, niscClientSubscriptionUsage, niscClientSubscriptionUsageActivityLog, niscProductPlan, niscProductPlanUsage, } from "@npanel/db/schema/products";
import { randomUUID } from "node:crypto";
export async function provisionInitialUsageCreditsForSubscription(params) {
    const { subscriptionId, productId, productPlanId, performedByUserId } = params;
    const mode = params.mode ?? "reset";
    if (!productPlanId) {
        return { created: 0 };
    }
    const plan = await db.query.niscProductPlan.findFirst({
        where: eq(niscProductPlan.id, productPlanId),
        columns: { metadata: true },
    });
    const planMeta = (plan?.metadata ?? {});
    const accumulateFromPlan = mode === "accumulate" || Boolean(planMeta.accumulateCredits);
    const planUsages = await db.query.niscProductPlanUsage.findMany({
        where: and(eq(niscProductPlanUsage.productId, productId), eq(niscProductPlanUsage.productPlanId, productPlanId), isNull(niscProductPlanUsage.userId), isNull(niscProductPlanUsage.teamId)),
    });
    let created = 0;
    for (const pu of planUsages) {
        const existing = await db.query.niscClientSubscriptionUsage.findFirst({
            where: and(eq(niscClientSubscriptionUsage.subscriptionId, subscriptionId), eq(niscClientSubscriptionUsage.usageKind, pu.usageKind)),
        });
        const limitNum = Number.parseFloat(pu.limitValue);
        const limitAdd = Number.isFinite(limitNum) ? limitNum : 0;
        const existingNum = existing ? Number.parseFloat(existing.credits) : 0;
        const existingBal = Number.isFinite(existingNum) ? existingNum : 0;
        const balanceBefore = existing?.credits ?? "0";
        const overrideCredits = params.tokenGrantOverride != null && Number.isFinite(params.tokenGrantOverride)
            ? String(Math.max(0, Math.floor(params.tokenGrantOverride)))
            : null;
        const newCredits = overrideCredits ??
            (existing && accumulateFromPlan
                ? String(existingBal + limitAdd)
                : pu.limitValue);
        const inserted = await db
            .insert(niscClientSubscriptionUsage)
            .values({
            id: randomUUID(),
            subscriptionId,
            usageKind: pu.usageKind,
            credits: newCredits,
        })
            .onConflictDoUpdate({
            target: [niscClientSubscriptionUsage.subscriptionId, niscClientSubscriptionUsage.usageKind],
            set: { credits: newCredits },
        })
            .returning({ id: niscClientSubscriptionUsage.id });
        const usage = inserted[0];
        if (!usage) {
            throw new Error("Failed to provision subscription usage");
        }
        await db.insert(niscClientSubscriptionUsageActivityLog).values({
            id: randomUUID(),
            subscriptionUsageId: usage.id,
            userId: performedByUserId,
            action: "CREDIT_ADD",
            description: accumulateFromPlan
                ? "Credits added from plan (accumulate)"
                : "Initial credits from plan (subscription creation)",
            metadata: {
                source: accumulateFromPlan ? "accumulate_from_plan" : "initial_from_plan",
                usageKind: pu.usageKind,
                limitValue: pu.limitValue,
                productPlanUsageId: pu.id,
                amount: accumulateFromPlan ? pu.limitValue : pu.limitValue,
                balanceBefore,
                balanceAfter: newCredits,
                reason: accumulateFromPlan ? "accumulate" : "initial_creation",
            },
        });
        created += 1;
    }
    if (created > 0) {
        await db.insert(niscClientSubscriptionActivityLog).values({
            id: randomUUID(),
            subscriptionId,
            userId: performedByUserId,
            action: "UPDATE",
            description: "Initial usage credits provisioned from plan",
            metadata: {
                source: "initial_from_plan",
                productId,
                productPlanId,
                usageKinds: planUsages.map((pu) => pu.usageKind),
                createdCount: created,
            },
        });
    }
    return { created };
}
