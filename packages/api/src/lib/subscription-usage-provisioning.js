/**
 * Provisions initial usage credits for a newly created subscription when the
 * product/plan has NiscProductPlanUsage (usage limits and overuse config).
 * Creates NiscClientSubscriptionUsage rows with credits = plan's limitValue
 * and logs each in NiscClientSubscriptionUsageActivityLog.
 */
import { and, eq, isNull } from "@npanel/db";
import { db } from "@npanel/db";
import { niscClientSubscriptionActivityLog, niscClientSubscriptionUsage, niscClientSubscriptionUsageActivityLog, niscProductPlanUsage, } from "@npanel/db/schema/products";
import { randomUUID } from "node:crypto";
export async function provisionInitialUsageCreditsForSubscription(params) {
    const { subscriptionId, productId, productPlanId, performedByUserId } = params;
    if (!productPlanId) {
        return { created: 0 };
    }
    const planUsages = await db.query.niscProductPlanUsage.findMany({
        where: and(eq(niscProductPlanUsage.productId, productId), eq(niscProductPlanUsage.productPlanId, productPlanId), isNull(niscProductPlanUsage.userId), isNull(niscProductPlanUsage.teamId)),
    });
    let created = 0;
    for (const pu of planUsages) {
        const inserted = await db
            .insert(niscClientSubscriptionUsage)
            .values({
            id: randomUUID(),
            subscriptionId,
            usageKind: pu.usageKind,
            credits: pu.limitValue,
        })
            .onConflictDoUpdate({
            target: [niscClientSubscriptionUsage.subscriptionId, niscClientSubscriptionUsage.usageKind],
            set: { credits: pu.limitValue },
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
            description: "Initial credits from plan (subscription creation)",
            metadata: {
                source: "initial_from_plan",
                usageKind: pu.usageKind,
                limitValue: pu.limitValue,
                productPlanUsageId: pu.id,
                amount: pu.limitValue,
                balanceBefore: "0",
                balanceAfter: pu.limitValue,
                reason: "initial_creation",
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
