/**
 * Hosting plan fetching for the Zeepo AI Agent.
 *
 * Fetches web hosting and email hosting plans from the Nisc Cloud product
 * catalogue - the same data powering the customer-facing pricing tables on
 * the /$slug/hosting and /$slug/emails routes.  Results are returned in a
 * shape that the session-page can detect and render as a pricing card.
 */
import { and, eq, ilike, or } from "@npanel/db";
import { db } from "@npanel/db";
import { niscProduct, niscProductPlan } from "@npanel/db/schema/products";
async function fetchHostingPlans(toolName, nameFilters) {
    const whereCondition = nameFilters.length === 1
        ? and(eq(niscProduct.isActive, true), ilike(niscProduct.name, nameFilters[0]))
        : and(eq(niscProduct.isActive, true), or(...nameFilters.map((f) => ilike(niscProduct.name, f))));
    const products = await db.query.niscProduct.findMany({
        where: whereCondition,
        orderBy: (p, { asc: a, desc: d }) => [a(p.sortOrder), d(p.createdAt)],
        with: {
            plans: {
                where: and(eq(niscProductPlan.isActive, true), eq(niscProductPlan.pricingModel, "FIXED")),
                orderBy: (plan, { asc: a }) => [a(plan.sortOrder), a(plan.createdAt)],
            },
        },
    });
    // Build master feature list preserving order from the first product.
    const seenKeys = new Set();
    const productFeatures = [];
    for (const p of products) {
        const features = p.features ?? [];
        for (const f of features) {
            if (!seenKeys.has(f.key)) {
                seenKeys.add(f.key);
                productFeatures.push(f);
            }
        }
    }
    const plans = [];
    for (const product of products) {
        for (const plan of product.plans ?? []) {
            const planFeats = plan.planFeatures ?? [];
            const planFeatsByKey = new Map(planFeats.map((f) => [f.key, f]));
            const featureValues = productFeatures.map((pf) => {
                const entry = planFeatsByKey.get(pf.key);
                return {
                    available: !!entry?.available,
                    valueOverride: entry?.valueOverride != null && entry.valueOverride !== ""
                        ? String(entry.valueOverride)
                        : null,
                };
            });
            plans.push({
                id: plan.id,
                name: plan.name,
                niscPrice: plan.price ?? null,
                niscCurrency: plan.currency ?? "KES",
                billingCycle: plan.billingCycle ?? "MONTHLY",
                isPopular: plan.isPopular ?? false,
                isRecommended: plan.isRecommended ?? false,
                productId: product.id,
                productName: product.name,
                featureValues,
            });
        }
    }
    return {
        _tool: toolName,
        productFeatures,
        plans,
        checkedAt: new Date().toISOString(),
    };
}
/** Fetch web/website hosting plans from the Nisc Cloud catalogue. */
export async function agentGetWebHostingPlans() {
    return fetchHostingPlans("get_web_hosting_plans", [
        "%web hosting%",
        "%website hosting%",
    ]);
}
/** Fetch email hosting plans from the Nisc Cloud catalogue. */
export async function agentGetEmailHostingPlans() {
    return fetchHostingPlans("get_email_hosting_plans", ["%email hosting%"]);
}
