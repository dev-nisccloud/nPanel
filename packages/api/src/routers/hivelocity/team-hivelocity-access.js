import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { and, eq, ilike, sql } from "@npanel/db";
import { db } from "@npanel/db";
import { niscClientSubscription, niscProduct, niscProductPlan, } from "@npanel/db/schema/products";
import { team, teamMember } from "@npanel/db/schema/teams";
/** Optional team scope for Hivelocity device calls - both fields required together. */
export const teamHivelocityAccessSchema = z
    .object({
    teamSlug: z.string().min(1).optional(),
    teamResourceCategory: z.enum(["vps", "vds", "dedicated"]).optional(),
})
    .superRefine((v, ctx) => {
    if (Boolean(v.teamSlug) !== Boolean(v.teamResourceCategory)) {
        ctx.addIssue({
            code: "custom",
            message: "teamSlug and teamResourceCategory must both be set or both omitted",
            path: ["teamSlug"],
        });
    }
});
export const isAgencyUserRole = (role) => ["AGENCY_USER", "AGENCY_ADMIN", "AGENCY_SUPER_ADMIN"].includes(role ?? "");
function parseLinkedDeviceId(serviceRefs) {
    const refs = serviceRefs;
    const raw = refs?.hivelocityDeviceId;
    const n = typeof raw === "number" ? raw : typeof raw === "string" ? parseInt(raw, 10) : NaN;
    return !Number.isNaN(n) && n > 0 ? n : null;
}
/** Subscription rows linked to Hivelocity devices for a team + product category. */
export async function collectTeamHivelocitySubscriptionContext(teamId, category) {
    const productCond = productNameConditionForCategory(category);
    const rows = await db
        .select({
        subscriptionId: niscClientSubscription.id,
        status: niscClientSubscription.status,
        name: niscClientSubscription.name,
        agreedPrice: niscClientSubscription.agreedPrice,
        agreedCurrency: niscClientSubscription.agreedCurrency,
        billingCycle: niscClientSubscription.billingCycle,
        productId: niscClientSubscription.productId,
        productName: niscProduct.name,
        productPlanName: niscProductPlan.name,
        serviceRefs: niscClientSubscription.serviceRefs,
    })
        .from(niscClientSubscription)
        .innerJoin(niscProduct, eq(niscClientSubscription.productId, niscProduct.id))
        .leftJoin(niscProductPlan, eq(niscClientSubscription.productPlanId, niscProductPlan.id))
        .where(and(eq(niscClientSubscription.teamId, teamId), productCond));
    const out = new Map();
    for (const row of rows) {
        const deviceId = parseLinkedDeviceId(row.serviceRefs);
        if (deviceId == null)
            continue;
        out.set(deviceId, {
            subscriptionId: row.subscriptionId,
            status: row.status,
            name: row.name,
            agreedPrice: row.agreedPrice,
            agreedCurrency: row.agreedCurrency,
            billingCycle: row.billingCycle,
            productId: row.productId,
            productName: row.productName,
            productPlanName: row.productPlanName,
        });
    }
    return out;
}
export function buildHivelocitySubscriptionServiceLabel(ctx) {
    const trimmedName = ctx.name?.trim();
    if (trimmedName)
        return trimmedName;
    const base = ctx.productPlanName?.trim()
        ? `${ctx.productName} - ${ctx.productPlanName}`
        : ctx.productName;
    return base;
}
export function redactSuspendedHivelocityResourceForCustomer(deviceId, resourceType, sub) {
    const amount = sub.agreedPrice != null ? Number.parseFloat(sub.agreedPrice) : 0;
    return {
        deviceId,
        id: deviceId,
        resourceType,
        panelSuspended: true,
        subscriptionId: sub.subscriptionId,
        serviceLabel: buildHivelocitySubscriptionServiceLabel(sub),
        reactivationAmount: Number.isFinite(amount) ? amount : 0,
        reactivationCurrency: sub.agreedCurrency ?? "KES",
        billingCycle: sub.billingCycle,
        productId: sub.productId,
    };
}
function productNameConditionForCategory(category) {
    if (category === "vps")
        return ilike(niscProduct.name, "%vps hosting%");
    if (category === "vds")
        return ilike(niscProduct.name, "%vds hosting%");
    return ilike(niscProduct.name, "%dedicated servers hosting%");
}
export async function getTeamIdBySlugForHivelocity(slug) {
    const [row] = await db.select({ id: team.id }).from(team).where(eq(team.slug, slug)).limit(1);
    return row?.id ?? null;
}
export async function assertUserCanReadTeamCloud(teamId, userId, role) {
    if (isAgencyUserRole(role))
        return;
    const [memberRow, ownerRow] = await Promise.all([
        db.query.teamMember.findFirst({
            where: and(eq(teamMember.teamId, teamId), eq(teamMember.userId, userId)),
            columns: { id: true },
        }),
        db.query.team.findFirst({
            where: and(eq(team.id, teamId), eq(team.createdById, userId)),
            columns: { id: true },
        }),
    ]);
    if (!memberRow && !ownerRow) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You do not have access to this team" });
    }
}
/**
 * Device IDs linked to the team via nisc_client_subscription.serviceRefs.hivelocityDeviceId
 * for products whose names match the cloud category (same naming as subscription creation UI).
 */
export async function collectHivelocityDeviceIdsForTeam(teamId, category) {
    const productCond = productNameConditionForCategory(category);
    const rows = await db
        .select({ serviceRefs: niscClientSubscription.serviceRefs })
        .from(niscClientSubscription)
        .innerJoin(niscProduct, eq(niscClientSubscription.productId, niscProduct.id))
        .where(and(eq(niscClientSubscription.teamId, teamId), productCond));
    const out = new Set();
    for (const r of rows) {
        const refs = r.serviceRefs;
        const raw = refs?.hivelocityDeviceId;
        const n = typeof raw === "number" ? raw : typeof raw === "string" ? parseInt(raw, 10) : NaN;
        if (!Number.isNaN(n) && n > 0)
            out.add(n);
    }
    return out;
}
async function assertHivelocitySubscriptionActiveForCustomer(params) {
    if (isAgencyUserRole(params.role))
        return;
    const productCond = productNameConditionForCategory(params.category);
    const idStr = String(params.deviceId);
    const [row] = await db
        .select({ status: niscClientSubscription.status })
        .from(niscClientSubscription)
        .innerJoin(niscProduct, eq(niscClientSubscription.productId, niscProduct.id))
        .where(and(eq(niscClientSubscription.teamId, params.teamId), productCond, sql `(${niscClientSubscription.serviceRefs}->>'hivelocityDeviceId') = ${idStr}`))
        .limit(1);
    if (row?.status === "SUSPENDED") {
        throw new TRPCError({
            code: "FORBIDDEN",
            message: "This server has been suspended and is temporarily unavailable. Contact Nisc Cloud support to restore access.",
        });
    }
}
export async function assertHivelocityDeviceLinkedToTeam(params) {
    const teamId = await getTeamIdBySlugForHivelocity(params.teamSlug);
    if (!teamId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Team not found" });
    }
    await assertUserCanReadTeamCloud(teamId, params.userId, params.role);
    const allowed = await collectHivelocityDeviceIdsForTeam(teamId, params.category);
    if (!allowed.has(params.deviceId)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You do not have access to this server" });
    }
    await assertHivelocitySubscriptionActiveForCustomer({
        teamId,
        deviceId: params.deviceId,
        category: params.category,
        role: params.role,
    });
}
export async function maybeAssertTeamHivelocityDeviceAccess(params) {
    const { teamSlug, teamResourceCategory, deviceId } = params.input;
    if (!teamSlug || !teamResourceCategory || deviceId == null)
        return;
    const userId = params.ctx.session?.user?.id;
    if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "You must be logged in" });
    }
    await assertHivelocityDeviceLinkedToTeam({
        teamSlug,
        deviceId,
        category: teamResourceCategory,
        userId,
        role: params.ctx.session?.user?.role ?? null,
    });
}
