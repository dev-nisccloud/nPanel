/**
 * Zeepo AI order provisioning after payment (invoices via nisc orders).
 * Welcome free grant is separate and must never create an invoice.
 */
import { and, eq, sql } from "@npanel/db";
import { db } from "@npanel/db";
import { niscClientSubscription, niscClientSubscriptionUsage, niscProductPlan, } from "@npanel/db/schema/products";
import { zeepoAiTokenLedger } from "@npanel/db/schema/zeepo-ai";
import { randomUUID } from "node:crypto";
import { ZEEPO_AI_PRODUCT_ID, ZEEPO_AI_USAGE_KIND, } from "./zeepo-ai-billing";
import { agreedPriceIncVatFromOrderLine } from "./convert-price";
import { creditZeepoAiTokens } from "./zeepo-ai-tokens";
function parseZeepoAiPlanMeta(metadata) {
    const m = (metadata ?? {});
    const rawType = m.zeepoPlanType;
    const zeepoPlanType = rawType === "top_up" || rawType === "pay_as_you_go" ? rawType : "top_up";
    const tokenGrant = typeof m.tokenGrant === "number"
        ? m.tokenGrant
        : Number.parseInt(String(m.tokenGrant ?? "0"), 10) || 0;
    return { zeepoPlanType, tokenGrant };
}
async function findActiveZeepoAiSubscription(teamId) {
    return db.query.niscClientSubscription.findFirst({
        where: and(eq(niscClientSubscription.teamId, teamId), eq(niscClientSubscription.productId, ZEEPO_AI_PRODUCT_ID), eq(niscClientSubscription.status, "ACTIVE")),
    });
}
async function ensureTokenUsageRow(subscriptionId, initialCredits = "0") {
    const existing = await db.query.niscClientSubscriptionUsage.findFirst({
        where: and(eq(niscClientSubscriptionUsage.subscriptionId, subscriptionId), eq(niscClientSubscriptionUsage.usageKind, ZEEPO_AI_USAGE_KIND)),
    });
    if (existing)
        return existing;
    const inserted = await db
        .insert(niscClientSubscriptionUsage)
        .values({
        id: randomUUID(),
        subscriptionId,
        usageKind: ZEEPO_AI_USAGE_KIND,
        credits: initialCredits,
        metadata: {},
    })
        .returning();
    return inserted[0];
}
export function isZeepoAiProduct(productId) {
    return productId === ZEEPO_AI_PRODUCT_ID;
}
async function createZeepoAiPaygSubscription(order, item, meta) {
    const plan = item.productPlan;
    const subId = randomUUID();
    const now = new Date();
    const inserted = await db
        .insert(niscClientSubscription)
        .values({
        id: subId,
        name: `${item.product.name} - ${plan.name}`,
        description: item.description ?? "Pay-as-you-go Zeepo AI wallet",
        userId: order.userId,
        teamId: order.teamId,
        productId: item.productId,
        productPlanId: item.productPlanId,
        orderId: null,
        niscOrderId: order.orderId,
        subscribedBy: order.createdBy,
        status: "ACTIVE",
        subscriptionDate: now,
        billingCycle: item.billingCycle ?? "CUSTOM",
        pricingModel: "USAGE",
        agreedPrice: agreedPriceIncVatFromOrderLine(item),
        agreedCurrency: order.currency,
        agreedCost: plan.cost ?? null,
        agreedCostCurrency: "USD",
        providerCost: plan.cost ?? null,
        providerCostCurrency: "USD",
        agreedCommissionRate: null,
        agreedCommissionBase: null,
        metadata: { zeepoPlanType: meta.zeepoPlanType, source: "paid_order" },
    })
        .returning();
    const sub = inserted[0];
    if (!sub)
        throw new Error("Failed to create Zeepo AI subscription");
    return sub;
}
/**
 * Provision Zeepo AI after payment. Top-ups credit tokens; PAYG creates wallet only.
 * Free welcome tokens are NOT handled here (no invoice path).
 */
export async function provisionZeepoAiOrderItem(order, item) {
    if (!order.teamId) {
        throw new Error("Zeepo AI requires a team on the order.");
    }
    if (!item.productPlanId || !item.productPlan) {
        throw new Error("Zeepo AI order item requires a product plan.");
    }
    const meta = parseZeepoAiPlanMeta(item.productPlan.metadata);
    const performedBy = order.createdBy ?? order.userId;
    if (!performedBy) {
        throw new Error("Order must have createdBy or userId for Zeepo AI provisioning.");
    }
    let existingSub = await findActiveZeepoAiSubscription(order.teamId);
    if (meta.zeepoPlanType === "pay_as_you_go") {
        if (existingSub)
            return { subscriptionId: existingSub.id };
        const sub = await createZeepoAiPaygSubscription(order, item, meta);
        await ensureTokenUsageRow(sub.id, "0");
        return { subscriptionId: sub.id };
    }
    // top_up (default): ensure wallet, then credit purchased tokens
    if (!existingSub) {
        existingSub = await createZeepoAiPaygSubscription(order, item, {
            zeepoPlanType: "pay_as_you_go",
            tokenGrant: 0,
        });
        await ensureTokenUsageRow(existingSub.id, "0");
    }
    else {
        await ensureTokenUsageRow(existingSub.id);
    }
    if (meta.tokenGrant > 0) {
        // Idempotent: skip if this order already credited tokens (retry / crash recovery).
        const [alreadyCredited] = await db
            .select({ id: zeepoAiTokenLedger.id })
            .from(zeepoAiTokenLedger)
            .where(and(eq(zeepoAiTokenLedger.teamId, order.teamId), eq(zeepoAiTokenLedger.direction, "CREDIT"), eq(zeepoAiTokenLedger.operationType, "top_up"), sql `${zeepoAiTokenLedger.metadata}->>'niscOrderId' = ${order.orderId}`))
            .limit(1);
        if (!alreadyCredited) {
            await creditZeepoAiTokens({
                teamId: order.teamId,
                userId: performedBy,
                tokens: meta.tokenGrant,
                operationType: "top_up",
                description: `Token top-up: ${item.productPlan.name}`,
                metadata: {
                    niscOrderId: order.orderId,
                    productPlanId: item.productPlanId,
                    tokenGrant: meta.tokenGrant,
                },
            });
        }
    }
    return { subscriptionId: existingSub.id };
}
export async function getZeepoAiPlanMeta(productPlanId) {
    const plan = await db.query.niscProductPlan.findFirst({
        where: eq(niscProductPlan.id, productPlanId),
    });
    if (!plan)
        return null;
    return parseZeepoAiPlanMeta(plan.metadata);
}
