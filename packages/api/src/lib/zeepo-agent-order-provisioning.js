/**
 * Zeepo AI Agent order provisioning: subscriptions, top-ups, pay-as-you-go.
 */
import { and, eq, sql } from "@npanel/db";
import { db } from "@npanel/db";
import { niscClientSubscription, niscClientSubscriptionUsage, niscProductPlan, } from "@npanel/db/schema/products";
import { zeepoAgentTokenLedger } from "@npanel/db/schema/zeepo-agent";
import { randomUUID } from "node:crypto";
import { ZEEPO_AGENT_USAGE_KIND, ZEEPO_AI_AGENT_PRODUCT_ID, } from "./zeepo-agent-billing";
import { creditZeepoAgentTokens, setZeepoAgentTokenBalance } from "./zeepo-agent-tokens";
import { agreedPriceIncVatFromOrderLine } from "./convert-price";
import { provisionInitialUsageCreditsForSubscription } from "./subscription-usage-provisioning";
function parseZeepoPlanMeta(metadata) {
    const m = (metadata ?? {});
    const rawType = m.zeepoPlanType;
    const zeepoPlanType = rawType === "top_up" || rawType === "pay_as_you_go" || rawType === "subscription"
        ? rawType
        : "subscription";
    const tokenGrant = typeof m.tokenGrant === "number"
        ? m.tokenGrant
        : Number.parseInt(String(m.tokenGrant ?? "0"), 10) || 0;
    return {
        zeepoPlanType,
        tokenGrant,
        accumulateCredits: Boolean(m.accumulateCredits),
    };
}
async function findActiveZeepoSubscription(teamId) {
    return db.query.niscClientSubscription.findFirst({
        where: and(eq(niscClientSubscription.teamId, teamId), eq(niscClientSubscription.productId, ZEEPO_AI_AGENT_PRODUCT_ID), eq(niscClientSubscription.status, "ACTIVE")),
    });
}
async function ensureTokenUsageRow(subscriptionId, initialCredits = "0") {
    const existing = await db.query.niscClientSubscriptionUsage.findFirst({
        where: and(eq(niscClientSubscriptionUsage.subscriptionId, subscriptionId), eq(niscClientSubscriptionUsage.usageKind, ZEEPO_AGENT_USAGE_KIND)),
    });
    if (existing)
        return existing;
    const inserted = await db
        .insert(niscClientSubscriptionUsage)
        .values({
        id: randomUUID(),
        subscriptionId,
        usageKind: ZEEPO_AGENT_USAGE_KIND,
        credits: initialCredits,
    })
        .returning();
    return inserted[0];
}
export const ZEEPO_TOKEN_GRANT_OVERRIDE_METADATA_KEY = "zeepoTokenGrantOverride";
function parseTokenGrantOverride(metadata) {
    if (!metadata || typeof metadata !== "object")
        return null;
    const raw = metadata[ZEEPO_TOKEN_GRANT_OVERRIDE_METADATA_KEY];
    if (typeof raw === "number" && Number.isFinite(raw) && raw >= 0) {
        return Math.floor(raw);
    }
    if (typeof raw === "string" && raw.trim()) {
        const n = Number.parseInt(raw, 10);
        return Number.isFinite(n) && n >= 0 ? n : null;
    }
    return null;
}
export function isZeepoAiAgentProduct(productId) {
    return productId === ZEEPO_AI_AGENT_PRODUCT_ID;
}
/**
 * Provision Zeepo AI Agent after payment. Returns subscription id to link on order item.
 */
export async function provisionZeepoAgentOrderItem(order, item) {
    if (!order.teamId) {
        throw new Error("Zeepo AI Agent requires a team on the order.");
    }
    if (!item.productPlanId || !item.productPlan) {
        throw new Error("Zeepo AI Agent order item requires a product plan.");
    }
    const meta = parseZeepoPlanMeta(item.productPlan.metadata);
    const tokenOverride = parseTokenGrantOverride(item.metadata);
    const effectiveTokenGrant = tokenOverride ?? meta.tokenGrant;
    const performedBy = order.createdBy ?? order.userId;
    if (!performedBy) {
        throw new Error("Order must have createdBy or userId for Zeepo provisioning.");
    }
    const existingSub = await findActiveZeepoSubscription(order.teamId);
    // --- Top-up: add tokens to existing subscription ---
    if (meta.zeepoPlanType === "top_up") {
        if (!existingSub) {
            throw new Error("Token top-up requires an active Zeepo AI Agent subscription. Choose a plan first.");
        }
        await ensureTokenUsageRow(existingSub.id);
        if (effectiveTokenGrant > 0) {
            const [alreadyCredited] = await db
                .select({ id: zeepoAgentTokenLedger.id })
                .from(zeepoAgentTokenLedger)
                .where(and(eq(zeepoAgentTokenLedger.teamId, order.teamId), eq(zeepoAgentTokenLedger.direction, "CREDIT"), eq(zeepoAgentTokenLedger.operationType, "top_up"), sql `${zeepoAgentTokenLedger.metadata}->>'niscOrderId' = ${order.orderId}`))
                .limit(1);
            if (!alreadyCredited) {
                await creditZeepoAgentTokens({
                    teamId: order.teamId,
                    userId: performedBy,
                    tokens: effectiveTokenGrant,
                    operationType: "top_up",
                    description: `Token top-up: ${item.productPlan.name}`,
                    metadata: {
                        niscOrderId: order.orderId,
                        productPlanId: item.productPlanId,
                        tokenGrant: effectiveTokenGrant,
                        ...(tokenOverride != null ? { agencyTokenOverride: tokenOverride } : {}),
                    },
                });
            }
        }
        return { subscriptionId: existingSub.id };
    }
    // --- Pay-as-you-go signup: create $0 sub if none exists ---
    if (meta.zeepoPlanType === "pay_as_you_go") {
        if (existingSub) {
            return { subscriptionId: existingSub.id };
        }
        const sub = await createZeepoSubscription(order, item, meta);
        await ensureTokenUsageRow(sub.id, "0");
        return { subscriptionId: sub.id };
    }
    // --- Monthly subscription: one active sub per team; reset tokens on (re)purchase ---
    if (existingSub) {
        const existingMeta = (existingSub.metadata ?? {});
        const alreadyAppliedForOrder = existingMeta.lastAppliedNiscOrderId === order.orderId ||
            (await db
                .select({ id: zeepoAgentTokenLedger.id })
                .from(zeepoAgentTokenLedger)
                .where(and(eq(zeepoAgentTokenLedger.teamId, order.teamId), eq(zeepoAgentTokenLedger.direction, "CREDIT"), sql `${zeepoAgentTokenLedger.metadata}->>'niscOrderId' = ${order.orderId}`, sql `${zeepoAgentTokenLedger.operationType} in ('subscription', 'subscription_reset', 'agency_token_override')`))
                .limit(1)
                .then((rows) => Boolean(rows[0])));
        await db
            .update(niscClientSubscription)
            .set({
            productPlanId: item.productPlanId,
            billingCycle: item.billingCycle ?? "MONTHLY",
            agreedPrice: agreedPriceIncVatFromOrderLine(item),
            updatedAt: new Date(),
        })
            .where(eq(niscClientSubscription.id, existingSub.id));
        if (!alreadyAppliedForOrder) {
            await provisionInitialUsageCreditsForSubscription({
                subscriptionId: existingSub.id,
                productId: item.productId,
                productPlanId: item.productPlanId,
                performedByUserId: performedBy,
                mode: "reset",
            });
            if (tokenOverride != null) {
                await ensureTokenUsageRow(existingSub.id);
                await setZeepoAgentTokenBalance({
                    teamId: order.teamId,
                    userId: performedBy,
                    tokens: tokenOverride,
                    operationType: "agency_token_override",
                    description: `Agency token grant override (${tokenOverride} tokens)`,
                    metadata: {
                        niscOrderId: order.orderId,
                        productPlanId: item.productPlanId,
                        planTokenGrant: meta.tokenGrant,
                    },
                });
            }
            await db
                .update(niscClientSubscription)
                .set({
                metadata: { ...existingMeta, lastAppliedNiscOrderId: order.orderId },
                updatedAt: new Date(),
            })
                .where(eq(niscClientSubscription.id, existingSub.id));
        }
        return { subscriptionId: existingSub.id };
    }
    const sub = await createZeepoSubscription(order, item, meta);
    const subMeta = (sub.metadata ?? {});
    const alreadyAppliedNewSub = subMeta.lastAppliedNiscOrderId === order.orderId ||
        (await db
            .select({ id: zeepoAgentTokenLedger.id })
            .from(zeepoAgentTokenLedger)
            .where(and(eq(zeepoAgentTokenLedger.teamId, order.teamId), eq(zeepoAgentTokenLedger.direction, "CREDIT"), sql `${zeepoAgentTokenLedger.metadata}->>'niscOrderId' = ${order.orderId}`, sql `${zeepoAgentTokenLedger.operationType} in ('subscription', 'subscription_reset', 'agency_token_override')`))
            .limit(1)
            .then((rows) => Boolean(rows[0])));
    if (!alreadyAppliedNewSub) {
        await provisionInitialUsageCreditsForSubscription({
            subscriptionId: sub.id,
            productId: item.productId,
            productPlanId: item.productPlanId,
            performedByUserId: performedBy,
            mode: "reset",
        });
        if (tokenOverride != null) {
            await ensureTokenUsageRow(sub.id);
            await setZeepoAgentTokenBalance({
                teamId: order.teamId,
                userId: performedBy,
                tokens: tokenOverride,
                operationType: "agency_token_override",
                description: `Agency token grant override (${tokenOverride} tokens)`,
                metadata: {
                    niscOrderId: order.orderId,
                    productPlanId: item.productPlanId,
                    planTokenGrant: meta.tokenGrant,
                },
            });
        }
        await db
            .update(niscClientSubscription)
            .set({
            metadata: { ...subMeta, lastAppliedNiscOrderId: order.orderId },
            updatedAt: new Date(),
        })
            .where(eq(niscClientSubscription.id, sub.id));
    }
    return { subscriptionId: sub.id };
}
async function createZeepoSubscription(order, item, meta) {
    const plan = item.productPlan;
    const name = `${item.product.name} - ${plan.name}`;
    const subId = randomUUID();
    const now = new Date();
    const inserted = await db
        .insert(niscClientSubscription)
        .values({
        id: subId,
        name,
        description: item.description ?? null,
        userId: order.userId,
        teamId: order.teamId,
        productId: item.productId,
        productPlanId: item.productPlanId,
        orderId: null,
        niscOrderId: order.orderId,
        subscribedBy: order.createdBy,
        status: "ACTIVE",
        subscriptionDate: now,
        billingCycle: item.billingCycle ?? null,
        pricingModel: "FIXED",
        agreedPrice: agreedPriceIncVatFromOrderLine(item),
        agreedCurrency: order.currency,
        agreedCost: plan.cost ?? null,
        agreedCostCurrency: "USD",
        providerCost: plan.cost ?? null,
        providerCostCurrency: "USD",
        agreedCommissionRate: null,
        agreedCommissionBase: null,
        metadata: { zeepoPlanType: meta.zeepoPlanType },
    })
        .returning();
    const sub = inserted[0];
    if (!sub)
        throw new Error("Failed to create Zeepo AI Agent subscription");
    return sub;
}
/** Read plan metadata for checkout / UI. */
export async function getZeepoAgentPlanMeta(productPlanId) {
    const plan = await db.query.niscProductPlan.findFirst({
        where: eq(niscProductPlan.id, productPlanId),
    });
    if (!plan)
        return null;
    return parseZeepoPlanMeta(plan.metadata);
}
