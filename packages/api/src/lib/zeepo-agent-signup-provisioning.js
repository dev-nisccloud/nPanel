/**
 * Grant new customers a free Starter Zeepo AI Agent subscription with welcome tokens.
 * No order or invoice - subscription is created directly at $0.
 */
import { and, eq } from "@npanel/db";
import { db } from "@npanel/db";
import { niscClientSubscription, niscClientSubscriptionActivityLog, niscClientSubscriptionUsage, niscProductPlan, } from "@npanel/db/schema/products";
import { randomUUID } from "node:crypto";
import { ZEEPO_AGENT_USAGE_KIND, ZEEPO_AI_AGENT_PLAN_IDS, ZEEPO_AI_AGENT_PRODUCT_ID, ZEEPO_SIGNUP_WELCOME_TOKEN_GRANT, } from "./zeepo-agent-billing";
import { creditZeepoAgentTokens, isZeepoAgentAgencyUser } from "./zeepo-agent-tokens";
async function findActiveZeepoSubscription(teamId) {
    return db.query.niscClientSubscription.findFirst({
        where: and(eq(niscClientSubscription.teamId, teamId), eq(niscClientSubscription.productId, ZEEPO_AI_AGENT_PRODUCT_ID), eq(niscClientSubscription.status, "ACTIVE")),
    });
}
/** One signup welcome grant per customer - tied to the org they create at sign-up. */
async function customerAlreadyReceivedSignupWelcome(userId) {
    const rows = await db
        .select({ metadata: niscClientSubscription.metadata })
        .from(niscClientSubscription)
        .where(and(eq(niscClientSubscription.productId, ZEEPO_AI_AGENT_PRODUCT_ID), eq(niscClientSubscription.subscribedBy, userId)));
    return rows.some((row) => {
        const meta = row.metadata;
        return meta?.signupWelcome === true;
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
/**
 * Assign Starter subscription + welcome tokens to the team the customer created at sign-up.
 * One grant per customer lifetime; no order or invoice.
 */
export async function provisionZeepoCustomerSignupWelcome(params) {
    if (isZeepoAgentAgencyUser(params.userRole))
        return null;
    if ((params.userRole ?? "CUSTOMER") !== "CUSTOMER")
        return null;
    if (await customerAlreadyReceivedSignupWelcome(params.userId)) {
        return null;
    }
    if (await findActiveZeepoSubscription(params.teamId)) {
        return null;
    }
    const plan = await db.query.niscProductPlan.findFirst({
        where: eq(niscProductPlan.id, ZEEPO_AI_AGENT_PLAN_IDS.starter),
        columns: { id: true, name: true, metadata: true },
        with: { product: { columns: { name: true } } },
    });
    if (!plan) {
        console.warn("[ZeepoSignup] Starter plan not found - run apps/server seed:zeepo-ai-agent");
        return null;
    }
    const subId = randomUUID();
    const now = new Date();
    const planMeta = (plan.metadata ?? {});
    const planTokenGrant = typeof planMeta.tokenGrant === "number" ? planMeta.tokenGrant : 650;
    await db.insert(niscClientSubscription).values({
        id: subId,
        name: `${plan.product?.name ?? "Zeepo AI Agent"} - ${plan.name}`,
        description: "Free welcome subscription for new customer sign-up",
        userId: params.userId,
        teamId: params.teamId,
        productId: ZEEPO_AI_AGENT_PRODUCT_ID,
        productPlanId: plan.id,
        orderId: null,
        niscOrderId: null,
        subscribedBy: params.userId,
        status: "ACTIVE",
        subscriptionDate: now,
        billingCycle: "MONTHLY",
        pricingModel: "FIXED",
        agreedPrice: "0",
        agreedCurrency: "USD",
        agreedCost: "0",
        agreedCostCurrency: "USD",
        providerCost: "0",
        providerCostCurrency: "USD",
        autoRenew: false,
        metadata: {
            zeepoPlanType: "subscription",
            signupWelcome: true,
            welcomeTokenGrant: ZEEPO_SIGNUP_WELCOME_TOKEN_GRANT,
            planTokenGrant,
            noInvoice: true,
        },
    });
    await ensureTokenUsageRow(subId, "0");
    await creditZeepoAgentTokens({
        teamId: params.teamId,
        userId: params.userId,
        tokens: ZEEPO_SIGNUP_WELCOME_TOKEN_GRANT,
        operationType: "signup_welcome",
        description: `Welcome bonus: ${ZEEPO_SIGNUP_WELCOME_TOKEN_GRANT} free tokens`,
        metadata: {
            source: "customer_signup",
            teamId: params.teamId,
            productPlanId: plan.id,
            subscriptionId: subId,
            noInvoice: true,
        },
    });
    await db.insert(niscClientSubscriptionActivityLog).values({
        id: randomUUID(),
        subscriptionId: subId,
        userId: params.userId,
        action: "CREATE",
        description: "Zeepo AI Agent Starter welcome subscription (signup, no invoice)",
        metadata: {
            source: "customer_signup_welcome",
            teamId: params.teamId,
            tokenGrant: ZEEPO_SIGNUP_WELCOME_TOKEN_GRANT,
            productPlanId: plan.id,
            noInvoice: true,
        },
    });
    return { subscriptionId: subId };
}
