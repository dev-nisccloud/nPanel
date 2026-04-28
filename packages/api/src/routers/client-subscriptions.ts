import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, type SQL, desc, eq, gte, ilike, inArray, lte, or, sql } from "@npanel/db";
import { db } from "@npanel/db";
import { user as userTable } from "@npanel/db/schema/auth";
import {
	niscClientSubscription,
	niscClientSubscriptionActivityLog,
	niscClientSubscriptionRenewal,
	niscCommissionEntry,
	niscProduct,
	niscProductPlan,
} from "@npanel/db/schema/products";
import { team, teamMember } from "@npanel/db/schema/teams";
import { protectedProcedure, router } from "../trpc";

// ============================================================================
// ZOD SCHEMAS   independent from the database schema layer
// ============================================================================

// --- Enum schemas ------------------------------------------------------------

const subscriptionStatusSchema = z.enum([
    "ACTIVE",
    "PENDING",
    "SUSPENDED",
    "CANCELLED",
    "EXPIRED",
    "PROCESSING",
    "FAILED",
    "UPGRADED",
    "DOWNGRADED",
]);

type SubscriptionStatus = z.infer<typeof subscriptionStatusSchema>;

const pricingModelSchema = z.enum(["FIXED", "COMMISSION"]);

const billingCycleSchema = z.enum([
    "YEARLY",
    "MONTHLY",
    "BIENNIALLY",
    "CUSTOM",
]);

const hostingTypeSchema = z.enum([
    "WEB_HOSTING",
    "EMAIL_HOSTING",
    "RESELLER_HOSTING",
    "VPS_HOSTING",
    "DEDICATED_HOSTING",
]);

const renewalTypeSchema = z.enum(["FIXED_BILLING", "DOMAIN", "HOSTING"]);
const adAccountPlatformSchema = z.enum(["META_ADS", "GOOGLE_ADS", "LINKEDIN_ADS", "INSTAGRAM_ADS"]);

const commissionEntryStatusSchema = z.enum([
    "DRAFT",
    "INVOICED",
    "PAID",
    "WAIVED",
]);

// --- serviceRefs schema ------------------------------------------------------
// A free-form map of string → string | string[] for cross-table references.
// Examples: { socialMediaPageTokenId: "x" } | { creativeBriefIds: ["a","b"] }
const serviceRefsSchema = z
    .record(z.string(), z.union([z.string(), z.array(z.string())]))
    .optional();

// --- Create subscription schema ----------------------------------------------

const createSubscriptionInputSchema = z
    .object({
        // Subscription display name (e.g. domain name for Domains product)
        name: z.string().optional(),

        // Ownership
        userId: z.string().optional(),
        teamId: z.string().optional(),

        // Product / plan
        productId: z.string(),
        productPlanId: z.string().optional(),
        orderId: z.string().optional(),
        subscribedBy: z.string().optional(),
        recordedBy: z.string().optional(),

        // Lifecycle
        status: subscriptionStatusSchema.default("PENDING"),
        subscriptionDate: z.coerce.date().optional(),
        billingCycle: billingCycleSchema.optional(),
        nextRenewalDate: z.coerce.date().optional(),
        expiryDate: z.coerce.date().optional(),
        autoRenew: z.boolean().default(false),

        // Pricing snapshot
        pricingModel: pricingModelSchema,
        agreedPrice: z.string().optional(),
        agreedCurrency: z.string().default("KES"),
        agreedCost: z.string().optional(),
        agreedCostCurrency: z.string().optional(),
        providerCost: z.string().optional(),
        providerCostCurrency: z.string().optional(),
        agreedCommissionRate: z.number().positive().optional(),
        agreedCommissionBase: z.string().optional(),

        // Hosting / Plesk typed fields
        primaryDomain: z.string().optional(),
        pleskFilterId: z.string().optional(),
        pleskOwnerId: z.string().optional(),
        pleskFtpLogin: z.string().optional(),
        pleskFtpPassword: z.string().optional(),
        hostingType: hostingTypeSchema.optional(),

        // Domain / OpenProvider typed fields
        openProviderId: z.number().int().optional(),
        domainAuthCode: z.string().optional(),
        nameserverGroupId: z.string().optional(),

        // WordPress
        wpInstallationId: z.number().int().optional(),

        // Flexible cross-table references (JSONB)
        serviceRefs: serviceRefsSchema,

        // Backward compat
        hostingSubscriptionId: z.string().optional(),

        notes: z.string().optional(),
        metadata: z.record(z.string(), z.unknown()).optional(),
    })
    .superRefine((data, ctx) => {
        if (data.pricingModel === "FIXED" && !data.billingCycle) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "billingCycle is required for FIXED pricing subscriptions",
                path: ["billingCycle"],
            });
        }
        if (data.pricingModel === "COMMISSION" && data.agreedCommissionRate === undefined) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "agreedCommissionRate is required for COMMISSION pricing subscriptions",
                path: ["agreedCommissionRate"],
            });
        }
        if (data.pricingModel === "COMMISSION" && !data.agreedCommissionBase) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "agreedCommissionBase is required for COMMISSION pricing subscriptions",
                path: ["agreedCommissionBase"],
            });
        }
    });

const updateSubscriptionInputSchema = z.object({
    id: z.string(),
    status: subscriptionStatusSchema.optional(),
    subscriptionDate: z.coerce.date().optional(),
    billingCycle: billingCycleSchema.optional(),
    nextRenewalDate: z.coerce.date().optional(),
    expiryDate: z.coerce.date().optional(),
    autoRenew: z.boolean().optional(),
    agreedPrice: z.string().optional(),
    agreedCurrency: z.string().optional(),
    agreedCommissionRate: z.number().positive().optional(),
    agreedCommissionBase: z.string().optional(),
    primaryDomain: z.string().optional(),
    pleskFilterId: z.string().optional(),
    pleskOwnerId: z.string().optional(),
    pleskFtpLogin: z.string().optional(),
    pleskFtpPassword: z.string().optional(),
    hostingType: hostingTypeSchema.optional(),
    openProviderId: z.number().int().optional(),
    domainAuthCode: z.string().optional(),
    nameserverGroupId: z.string().optional(),
    wpInstallationId: z.number().int().optional(),
    serviceRefs: serviceRefsSchema,
    notes: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
});

const cancelSubscriptionInputSchema = z.object({
    id: z.string(),
    reason: z.string().optional(),
});

// --- List schema -------------------------------------------------------------

const getSubscriptionsInputSchema = z.object({
    userId: z.string().optional(),
    teamId: z.string().optional(),
    productId: z.string().optional(),
    productPlanId: z.string().optional(),
    pricingModel: pricingModelSchema.optional(),
    status: subscriptionStatusSchema.optional(),
    // Date range filter on subscriptionDate
    fromDate: z.coerce.date().optional(),
    toDate: z.coerce.date().optional(),
    limit: z.number().int().min(1).max(200).default(50),
    offset: z.number().int().min(0).default(0),
});

const getSubscriptionByIdInputSchema = z.object({
    id: z.string(),
    /** When provided (e.g. customer detail at /[teamSlug]/domains-portfolio/[id]), enforces that the subscription belongs to this team and the user is a member. */
    teamSlug: z.string().optional(),
    includeRenewals: z.boolean().default(false),
    includeCommissions: z.boolean().default(false),
});

// --- Renewal schema ----------------------------------------------------------

const renewSubscriptionInputSchema = z.object({
    subscriptionId: z.string(),
    renewalType: renewalTypeSchema,
    renewedBy: z.string().optional(),
    renewalDate: z.coerce.date(),
    newExpiryDate: z.coerce.date().optional(),
    newNextRenewalDate: z.coerce.date().optional(),
    billingCycle: billingCycleSchema.optional(),
    status: subscriptionStatusSchema.default("ACTIVE"),
    renewalPrice: z.string().optional(),
    renewalCurrency: z.string().default("KES"),
    externalRenewalId: z.string().optional(),
    orderId: z.string().optional(),
    invoiceId: z.string().optional(),
    notes: z.string().optional(),
});

// --- Commission entry schemas ------------------------------------------------

const recordCommissionInputSchema = z.object({
    subscriptionId: z.string(),
    period: z
        .string()
        .regex(/^\d{4}-\d{2}$/, "period must be in YYYY-MM format"),
    baseAmount: z.number().positive(),
    baseAmountDescription: z.string().optional(),
    currency: z.string().default("KES"),
    notes: z.string().optional(),
});

const getCommissionEntriesInputSchema = z.object({
    subscriptionId: z.string().optional(),
    teamId: z.string().optional(),
    status: commissionEntryStatusSchema.optional(),
    periodFrom: z
        .string()
        .regex(/^\d{4}-\d{2}$/)
        .optional(),
    periodTo: z
        .string()
        .regex(/^\d{4}-\d{2}$/)
        .optional(),
});

const updateCommissionEntryInputSchema = z.object({
    id: z.string(),
    status: commissionEntryStatusSchema,
    invoiceId: z.string().optional(),
    notes: z.string().optional(),
});

const mediaBuyingProductOutputSchema = z.object({
    id: z.string(),
    name: z.string(),
    plans: z.array(
        z.object({
            id: z.string(),
            name: z.string(),
            pricingModel: pricingModelSchema,
            billingCycle: billingCycleSchema.nullable(),
            price: z.string().nullable(),
            currency: z.string().nullable(),
            agreedCommissionRate: z.number().nullable(),
            agreedCommissionBase: z.string().nullable(),
        }),
    ),
});

const adAccountLinkLookupInputSchema = z.object({
    platform: adAccountPlatformSchema,
    accountId: z.string().min(1),
});

const adAccountLinkLookupOutputSchema = z.object({
    hasLinkedSubscription: z.boolean(),
    subscriptionId: z.string().nullable(),
    teamId: z.string().nullable(),
    teamName: z.string().nullable(),
});

const linkedAdAccountsForTeamInputSchema = z.object({
    teamSlug: z.string().min(1),
    platform: adAccountPlatformSchema,
});
const linkedAdAccountItemSchema = z.object({
    accountId: z.string(),
    accountName: z.string().nullable(),
});

const createMediaBuyingSubscriptionInputSchema = z.object({
    teamId: z.string().min(1),
    productPlanId: z.string().min(1),
    platform: adAccountPlatformSchema,
    accountId: z.string().min(1),
    accountName: z.string().optional(),
    adServingFee: z.string().min(1),
    adServingFeeCurrency: z.enum(["USD", "EUR", "KES"]),
});

// --- Output schemas ----------------------------------------------------------

const subscriptionOutputSchema = z.object({
    id: z.string(),
    userId: z.string().nullable(),
    teamId: z.string().nullable(),
    productId: z.string(),
    productPlanId: z.string().nullable(),
    orderId: z.string().nullable(),
    subscribedBy: z.string().nullable(),
    recordedBy: z.string().nullable(),
    status: subscriptionStatusSchema,
    subscriptionDate: z.date().nullable(),
    billingCycle: billingCycleSchema.nullable(),
    nextRenewalDate: z.date().nullable(),
    expiryDate: z.date().nullable(),
    autoRenew: z.boolean(),
    pricingModel: pricingModelSchema,
    agreedPrice: z.string().nullable(),
    agreedCurrency: z.string().nullable(),
    agreedCommissionRate: z.unknown().nullable(),
    agreedCommissionBase: z.string().nullable(),
    primaryDomain: z.string().nullable(),
    pleskFilterId: z.string().nullable(),
    pleskOwnerId: z.string().nullable(),
    pleskFtpLogin: z.string().nullable(),
    hostingType: hostingTypeSchema.nullable(),
    openProviderId: z.number().nullable(),
    domainAuthCode: z.string().nullable(),
    nameserverGroupId: z.string().nullable(),
    wpInstallationId: z.number().nullable(),
    serviceRefs: z.unknown().nullable(),
    hostingSubscriptionId: z.string().nullable(),
    notes: z.string().nullable(),
    metadata: z.unknown().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

const commissionEntryOutputSchema = z.object({
    id: z.string(),
    subscriptionId: z.string(),
    productPlanId: z.string(),
    teamId: z.string().nullable(),
    period: z.string(),
    baseAmount: z.unknown(),
    baseAmountDescription: z.string().nullable(),
    commissionRate: z.unknown(),
    commissionAmount: z.unknown(),
    currency: z.string(),
    status: commissionEntryStatusSchema,
    invoiceId: z.string().nullable(),
    notes: z.string().nullable(),
    createdBy: z.string(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

// ============================================================================
// HELPERS
// ============================================================================

function mapSubscription(sub: any): z.infer<typeof subscriptionOutputSchema> {
    return {
        id: sub.id,
        userId: sub.userId ?? null,
        teamId: sub.teamId ?? null,
        productId: sub.productId,
        productPlanId: sub.productPlanId ?? null,
        orderId: sub.orderId ?? null,
        subscribedBy: sub.subscribedBy ?? null,
        recordedBy: sub.recordedBy ?? null,
        status: sub.status,
        subscriptionDate: sub.subscriptionDate ?? null,
        billingCycle: sub.billingCycle ?? null,
        nextRenewalDate: sub.nextRenewalDate ?? null,
        expiryDate: sub.expiryDate ?? null,
        autoRenew: sub.autoRenew,
        pricingModel: sub.pricingModel,
        agreedPrice: sub.agreedPrice ?? null,
        agreedCurrency: sub.agreedCurrency ?? "KES",
        agreedCommissionRate: sub.agreedCommissionRate ?? null,
        agreedCommissionBase: sub.agreedCommissionBase ?? null,
        primaryDomain: sub.primaryDomain ?? null,
        pleskFilterId: sub.pleskFilterId ?? null,
        pleskOwnerId: sub.pleskOwnerId ?? null,
        pleskFtpLogin: sub.pleskFtpLogin ?? null,
        hostingType: sub.hostingType ?? null,
        openProviderId: sub.openProviderId ?? null,
        domainAuthCode: sub.domainAuthCode ?? null,
        nameserverGroupId: sub.nameserverGroupId ?? null,
        wpInstallationId: sub.wpInstallationId ?? null,
        serviceRefs: sub.serviceRefs ?? null,
        hostingSubscriptionId: sub.hostingSubscriptionId ?? null,
        notes: sub.notes ?? null,
        metadata: sub.metadata ?? null,
        createdAt: sub.createdAt,
        updatedAt: sub.updatedAt,
    };
}

function mapCommissionEntry(entry: any): z.infer<typeof commissionEntryOutputSchema> {
    return {
        id: entry.id,
        subscriptionId: entry.subscriptionId,
        productPlanId: entry.productPlanId,
        teamId: entry.teamId ?? null,
        period: entry.period,
        baseAmount: entry.baseAmount,
        baseAmountDescription: entry.baseAmountDescription ?? null,
        commissionRate: entry.commissionRate,
        commissionAmount: entry.commissionAmount,
        currency: entry.currency,
        status: entry.status,
        invoiceId: entry.invoiceId ?? null,
        notes: entry.notes ?? null,
        createdBy: entry.createdBy,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
    };
}

function buildListSubscriptionFilters(
    input: z.infer<typeof getSubscriptionsInputSchema> | undefined,
) {
    const parts: SQL[] = [];
    if (input?.userId !== undefined) parts.push(eq(niscClientSubscription.userId, input.userId));
    if (input?.teamId !== undefined) parts.push(eq(niscClientSubscription.teamId, input.teamId));
    if (input?.productId !== undefined) parts.push(eq(niscClientSubscription.productId, input.productId));
    if (input?.productPlanId !== undefined)
        parts.push(eq(niscClientSubscription.productPlanId, input.productPlanId));
    if (input?.pricingModel !== undefined)
        parts.push(eq(niscClientSubscription.pricingModel, input.pricingModel));
    if (input?.status !== undefined) parts.push(eq(niscClientSubscription.status, input.status));
    if (input?.fromDate)
        parts.push(gte(niscClientSubscription.subscriptionDate, input.fromDate));
    if (input?.toDate) parts.push(lte(niscClientSubscription.subscriptionDate, input.toDate));
    return parts;
}

async function getTeamIdBySlug(slug: string) {
    const [row] = await db.select({ id: team.id }).from(team).where(eq(team.slug, slug)).limit(1);
    return row?.id ?? null;
}

async function isTeamMember(teamId: string, userId: string) {
    const [m] = await db
        .select({ id: teamMember.id })
        .from(teamMember)
        .where(and(eq(teamMember.teamId, teamId), eq(teamMember.userId, userId)))
        .limit(1);
    return !!m;
}

const isAgencyUserRole = (role: string | null | undefined) =>
    ["AGENCY_USER", "AGENCY_ADMIN", "AGENCY_SUPER_ADMIN"].includes(role ?? "");

const isAgencySuperAdminRole = (role: string | null | undefined) =>
    role === "AGENCY_SUPER_ADMIN";

async function getMemberTeamIds(userId: string) {
    const memberships = await db
        .select({ teamId: teamMember.teamId })
        .from(teamMember)
        .where(eq(teamMember.userId, userId));
    return memberships.map((m) => m.teamId);
}

async function buildSubscriptionReadScope(userId: string, role: string | null | undefined) {
    if (isAgencyUserRole(role)) return undefined;
    const memberTeamIds = await getMemberTeamIds(userId);
    const clauses: SQL[] = [eq(niscClientSubscription.userId, userId)];
    if (memberTeamIds.length > 0) {
        clauses.push(inArray(niscClientSubscription.teamId, memberTeamIds));
    }
    return clauses.length === 1 ? clauses[0] : or(...clauses);
}

async function canReadSubscription(
    subscription: { userId?: string | null; teamId?: string | null },
    userId: string,
    role: string | null | undefined,
) {
    if (isAgencyUserRole(role)) return true;
    if (subscription.userId === userId) return true;
    if (subscription.teamId) return isTeamMember(subscription.teamId, userId);
    return false;
}

async function canAssignTeamSubscription(params: {
    teamId: string;
    userId: string;
    role: string | null | undefined;
}) {
    if (isAgencyUserRole(params.role)) return true;
    return isTeamMember(params.teamId, params.userId);
}

function canMutateSubscription(
    subscription: { userId?: string | null; recordedBy?: string | null },
    userId: string,
    role: string | null | undefined,
) {
    if (isAgencySuperAdminRole(role)) return true;
    return subscription.userId === userId || subscription.recordedBy === userId;
}

// ============================================================================
// ROUTER
// ============================================================================

export const clientSubscriptionsRouter = router({
    // ── Subscriptions ─────────────────────────────────────────────────────────

    /** List subscriptions with optional filters */
    getAll: protectedProcedure
        .input(getSubscriptionsInputSchema.optional())
        .output(z.array(subscriptionOutputSchema))
        .query(async ({ ctx, input }) => {
            const session = ctx.session;
            if (!session?.user?.id) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "You must be logged in to view subscriptions",
                });
            }

            const filters = buildListSubscriptionFilters(input);
            const readScope = await buildSubscriptionReadScope(session.user.id, session.user.role);
            if (readScope) filters.push(readScope);
            const subs = await db
                .select()
                .from(niscClientSubscription)
                .where(filters.length ? and(...filters) : sql`true`)
                .orderBy(desc(niscClientSubscription.createdAt))
                .limit(input?.limit ?? 50)
                .offset(input?.offset ?? 0);

            return subs.map(mapSubscription);
        }),

    /** List subscriptions for agency UI with product/plan/team/user names. Optional productFilter: "hosting" restricts to products whose name contains "hosting". */
    listForAgency: protectedProcedure
        .input(
            z
                .object({
                    limit: z.number().int().min(1).max(200).default(100),
                    offset: z.number().int().min(0).default(0),
                    search: z.string().optional(),
                    productFilter: z.enum(["hosting"]).optional(),
                })
                .optional()
        )
        .output(
            z.array(
                subscriptionOutputSchema.extend({
                    productName: z.string(),
                    productPlanName: z.string().nullable(),
                    subscriptionName: z.string().nullable(),
                    teamName: z.string().nullable(),
                    userName: z.string().nullable(),
                })
            )
        )
        .query(async ({ ctx, input }) => {
            const session = ctx.session;
            if (!session?.user?.id) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "You must be logged in to view subscriptions",
                });
            }

            let productIdFilter: string[] | undefined;
            if (input?.productFilter === "hosting") {
                const hostingProducts = await db
                    .select({ id: niscProduct.id })
                    .from(niscProduct)
                    .where(and(eq(niscProduct.isActive, true), ilike(niscProduct.name, "%hosting%")));
                const ids = hostingProducts.map((p) => p.id);
                if (ids.length === 0) return [];
                productIdFilter = ids;
            }

            const readScope = await buildSubscriptionReadScope(session.user.id, session.user.role);
            const whereParts: SQL[] = [];
            if (productIdFilter) whereParts.push(inArray(niscClientSubscription.productId, productIdFilter));
            if (readScope) whereParts.push(readScope);

            const subs = await db.query.niscClientSubscription.findMany({
                where: whereParts.length ? and(...whereParts) : undefined,
                orderBy: (s, { desc: d }) => [d(s.createdAt)],
                limit: input?.limit ?? 100,
                offset: input?.offset ?? 0,
                with: {
                    product: { columns: { name: true } },
                    productPlan: { columns: { name: true } },
                    team: { columns: { name: true } },
                },
            });

            const userIds = [...new Set(subs.map((s) => s.userId).filter(Boolean))] as string[];
            const users =
                userIds.length > 0
                    ? await db
                          .select({
                              id: userTable.id,
                              name: userTable.name,
                              email: userTable.email,
                          })
                          .from(userTable)
                          .where(inArray(userTable.id, userIds))
                    : [];
            const userMap = new Map(users.map((u) => [u.id, u.name ?? u.email ?? u.id]));

            return subs.map((sub) => {
                const mapped = mapSubscription(sub);
                const userName = sub.userId ? userMap.get(sub.userId) ?? null : null;
                const teamName = sub.team?.name ?? null;
                return {
                    ...mapped,
                    productName: sub.product.name,
                    productPlanName: sub.productPlan?.name ?? null,
                    subscriptionName: sub.name ?? null,
                    teamName,
                    userName,
                };
            });
        }),

    /** List hosting subscriptions for a team (customer view). teamSlug is the route slug; returns only subscriptions for products named "web hosting" or "website hosting" (case-insensitive). Caller must be a member of the team. */
    listForTeamHosting: protectedProcedure
        .input(z.object({ teamSlug: z.string().min(1) }))
        .output(
            z.array(
                z.object({
                    id: z.string(),
                    /** Plesk subscription id for detail URL; use this for links when present. */
                    pleskSubscriptionId: z.string().nullable(),
                    subscriptionName: z.string().nullable(),
                    status: subscriptionStatusSchema,
                    productName: z.string(),
                    productPlanName: z.string().nullable(),
                    subscriptionDate: z.date().nullable(),
                    expiryDate: z.date().nullable(),
                    primaryDomain: z.string().nullable(),
                })
            )
        )
        .query(async ({ ctx, input }) => {
            const session = ctx.session;
            if (!session?.user?.id) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "You must be logged in to view subscriptions",
                });
            }

            const teamId = await getTeamIdBySlug(input.teamSlug);
            if (!teamId) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Team not found",
                });
            }

            if (!isAgencyUserRole(session.user.role) && !(await isTeamMember(teamId, session.user.id))) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have access to this team",
                });
            }

            const hostingProducts = await db
                .select({ id: niscProduct.id })
                .from(niscProduct)
                .where(
                    and(
                        eq(niscProduct.isActive, true),
                        or(
                            ilike(niscProduct.name, "%web hosting%"),
                            ilike(niscProduct.name, "%website hosting%"),
                        ),
                    ),
                );
            const productIds = hostingProducts.map((p) => p.id);
            if (productIds.length === 0) return [];

            const subs = await db.query.niscClientSubscription.findMany({
                where: and(
                    eq(niscClientSubscription.teamId, teamId),
                    inArray(niscClientSubscription.productId, productIds),
                ),
                orderBy: (s, { desc: d }) => [d(s.createdAt)],
                columns: {
                    id: true,
                    name: true,
                    status: true,
                    subscriptionDate: true,
                    expiryDate: true,
                    primaryDomain: true,
                    serviceRefs: true,
                    pleskFilterId: true,
                },
                with: {
                    product: { columns: { name: true } },
                    productPlan: { columns: { name: true } },
                },
            });

            return subs.map((sub) => {
                let pleskId: string | null = null;
                const refs = sub.serviceRefs as Record<string, unknown> | null;
                if (refs && (typeof refs.pleskSubscriptionId === "string" || typeof refs.pleskSubscriptionId === "number")) {
                    pleskId = String(refs.pleskSubscriptionId);
                }
                if (!pleskId && sub.pleskFilterId) pleskId = sub.pleskFilterId;
                return {
                    id: sub.id,
                    pleskSubscriptionId: pleskId,
                    subscriptionName: sub.name ?? null,
                    status: sub.status as SubscriptionStatus,
                    productName: sub.product.name,
                    productPlanName: sub.productPlan?.name ?? null,
                    subscriptionDate: sub.subscriptionDate,
                    expiryDate: sub.expiryDate,
                    primaryDomain: sub.primaryDomain,
                };
            });
        }),

    /** List email hosting subscriptions for a team (customer view). Same as listForTeamHosting but for products named "email hosting" (case-insensitive). */
    listForTeamEmailHosting: protectedProcedure
        .input(z.object({ teamSlug: z.string().min(1) }))
        .output(
            z.array(
                z.object({
                    id: z.string(),
                    pleskSubscriptionId: z.string().nullable(),
                    subscriptionName: z.string().nullable(),
                    status: subscriptionStatusSchema,
                    productName: z.string(),
                    productPlanName: z.string().nullable(),
                    subscriptionDate: z.date().nullable(),
                    expiryDate: z.date().nullable(),
                    primaryDomain: z.string().nullable(),
                })
            )
        )
        .query(async ({ ctx, input }) => {
            const session = ctx.session;
            if (!session?.user?.id) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "You must be logged in to view subscriptions",
                });
            }

            const teamId = await getTeamIdBySlug(input.teamSlug);
            if (!teamId) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Team not found",
                });
            }

            if (!isAgencyUserRole(session.user.role) && !(await isTeamMember(teamId, session.user.id))) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have access to this team",
                });
            }

            const emailHostingProducts = await db
                .select({ id: niscProduct.id })
                .from(niscProduct)
                .where(and(eq(niscProduct.isActive, true), ilike(niscProduct.name, "%email hosting%")));
            const productIds = emailHostingProducts.map((p) => p.id);
            if (productIds.length === 0) return [];

            const subs = await db.query.niscClientSubscription.findMany({
                where: and(
                    eq(niscClientSubscription.teamId, teamId),
                    inArray(niscClientSubscription.productId, productIds),
                ),
                orderBy: (s, { desc: d }) => [d(s.createdAt)],
                columns: {
                    id: true,
                    name: true,
                    status: true,
                    subscriptionDate: true,
                    expiryDate: true,
                    primaryDomain: true,
                    serviceRefs: true,
                    pleskFilterId: true,
                },
                with: {
                    product: { columns: { name: true } },
                    productPlan: { columns: { name: true } },
                },
            });

            return subs.map((sub) => {
                let pleskId: string | null = null;
                const refs = sub.serviceRefs as Record<string, unknown> | null;
                if (refs && (typeof refs.pleskSubscriptionId === "string" || typeof refs.pleskSubscriptionId === "number")) {
                    pleskId = String(refs.pleskSubscriptionId);
                }
                if (!pleskId && sub.pleskFilterId) pleskId = sub.pleskFilterId;
                return {
                    id: sub.id,
                    pleskSubscriptionId: pleskId,
                    subscriptionName: sub.name ?? null,
                    status: sub.status as SubscriptionStatus,
                    productName: sub.product.name,
                    productPlanName: sub.productPlan?.name ?? null,
                    subscriptionDate: sub.subscriptionDate,
                    expiryDate: sub.expiryDate,
                    primaryDomain: sub.primaryDomain,
                };
            });
        }),

    /**
     * List Nisc Email Marketing subscriptions for a team (customer view). Matches products whose name
     * contains "nisc email marketing" or "email marketing" (case-insensitive), same criteria as
     * products.getNiscEmailMarketingPlansForPricing. Caller must be a member of the team.
     */
    listForTeamNiscEmailMarketing: protectedProcedure
        .input(z.object({ teamSlug: z.string().min(1) }))
        .output(
            z.array(
                z.object({
                    id: z.string(),
                    pleskSubscriptionId: z.string().nullable(),
                    subscriptionName: z.string().nullable(),
                    status: subscriptionStatusSchema,
                    productName: z.string(),
                    productPlanName: z.string().nullable(),
                    subscriptionDate: z.date().nullable(),
                    expiryDate: z.date().nullable(),
                    primaryDomain: z.string().nullable(),
                }),
            ),
        )
        .query(async ({ ctx, input }) => {
            const session = ctx.session;
            if (!session?.user?.id) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "You must be logged in to view subscriptions",
                });
            }

            const teamId = await getTeamIdBySlug(input.teamSlug);
            if (!teamId) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Team not found",
                });
            }

            if (!isAgencyUserRole(session.user.role) && !(await isTeamMember(teamId, session.user.id))) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have access to this team",
                });
            }

            const emProducts = await db
                .select({ id: niscProduct.id })
                .from(niscProduct)
                .where(
                    and(
                        eq(niscProduct.isActive, true),
                        or(
                            ilike(niscProduct.name, "%nisc email marketing%"),
                            ilike(niscProduct.name, "%email marketing%"),
                        ),
                    ),
                );
            const productIds = emProducts.map((p) => p.id);
            if (productIds.length === 0) return [];

            const subs = await db.query.niscClientSubscription.findMany({
                where: and(
                    eq(niscClientSubscription.teamId, teamId),
                    inArray(niscClientSubscription.productId, productIds),
                ),
                orderBy: (s, { desc: d }) => [d(s.createdAt)],
                columns: {
                    id: true,
                    name: true,
                    status: true,
                    subscriptionDate: true,
                    expiryDate: true,
                    primaryDomain: true,
                    serviceRefs: true,
                    pleskFilterId: true,
                },
                with: {
                    product: { columns: { name: true } },
                    productPlan: { columns: { name: true } },
                },
            });

            return subs.map((sub) => {
                let pleskId: string | null = null;
                const refs = sub.serviceRefs as Record<string, unknown> | null;
                if (refs && (typeof refs.pleskSubscriptionId === "string" || typeof refs.pleskSubscriptionId === "number")) {
                    pleskId = String(refs.pleskSubscriptionId);
                }
                if (!pleskId && sub.pleskFilterId) pleskId = sub.pleskFilterId;
                return {
                    id: sub.id,
                    pleskSubscriptionId: pleskId,
                    subscriptionName: sub.name ?? null,
                    status: sub.status as SubscriptionStatus,
                    productName: sub.product.name,
                    productPlanName: sub.productPlan?.name ?? null,
                    subscriptionDate: sub.subscriptionDate,
                    expiryDate: sub.expiryDate,
                    primaryDomain: sub.primaryDomain,
                };
            });
        }),

    /** List domain subscriptions for a team (customer view). Returns subscriptions for products whose name contains "domains" (case-insensitive). Caller must be a member of the team. */
    listForTeamDomains: protectedProcedure
        .input(z.object({ teamSlug: z.string().min(1) }))
        .output(
            z.array(
                z.object({
                    id: z.string(),
                    pleskSubscriptionId: z.string().nullable(),
                    subscriptionName: z.string().nullable(),
                    status: subscriptionStatusSchema,
                    productName: z.string(),
                    productPlanName: z.string().nullable(),
                    subscriptionDate: z.date().nullable(),
                    expiryDate: z.date().nullable(),
                    primaryDomain: z.string().nullable(),
                })
            )
        )
        .query(async ({ ctx, input }) => {
            const session = ctx.session;
            if (!session?.user?.id) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "You must be logged in to view subscriptions",
                });
            }

            const teamId = await getTeamIdBySlug(input.teamSlug);
            if (!teamId) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Team not found",
                });
            }

            if (!isAgencyUserRole(session.user.role) && !(await isTeamMember(teamId, session.user.id))) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have access to this team",
                });
            }

            const domainProducts = await db
                .select({ id: niscProduct.id })
                .from(niscProduct)
                .where(and(eq(niscProduct.isActive, true), ilike(niscProduct.name, "%domains%")));
            const productIds = domainProducts.map((p) => p.id);
            if (productIds.length === 0) return [];

            const subs = await db.query.niscClientSubscription.findMany({
                where: and(
                    eq(niscClientSubscription.teamId, teamId),
                    inArray(niscClientSubscription.productId, productIds),
                ),
                orderBy: (s, { desc: d }) => [d(s.createdAt)],
                columns: {
                    id: true,
                    name: true,
                    status: true,
                    subscriptionDate: true,
                    expiryDate: true,
                    primaryDomain: true,
                    serviceRefs: true,
                    pleskFilterId: true,
                },
                with: {
                    product: { columns: { name: true } },
                    productPlan: { columns: { name: true } },
                },
            });

            return subs.map((sub) => {
                let pleskId: string | null = null;
                const refs = sub.serviceRefs as Record<string, unknown> | null;
                if (refs && (typeof refs.pleskSubscriptionId === "string" || typeof refs.pleskSubscriptionId === "number")) {
                    pleskId = String(refs.pleskSubscriptionId);
                }
                if (!pleskId && sub.pleskFilterId) pleskId = sub.pleskFilterId;
                return {
                    id: sub.id,
                    pleskSubscriptionId: pleskId,
                    subscriptionName: sub.name ?? null,
                    status: sub.status as SubscriptionStatus,
                    productName: sub.product.name,
                    productPlanName: sub.productPlan?.name ?? null,
                    subscriptionDate: sub.subscriptionDate,
                    expiryDate: sub.expiryDate,
                    primaryDomain: sub.primaryDomain,
                };
            });
        }),

    /** List all NiscClientSubscription for a team (customer dashboard). Same auth as listForTeamDomains; returns all products. */
    listForTeam: protectedProcedure
        .input(z.object({ teamSlug: z.string().min(1) }))
        .output(
            z.array(
                z.object({
                    id: z.string(),
                    productName: z.string(),
                    productPlanName: z.string().nullable(),
                    subscriptionDate: z.date().nullable(),
                    nextRenewalDate: z.date().nullable(),
                    expiryDate: z.date().nullable(),
                    status: subscriptionStatusSchema,
                })
            )
        )
        .query(async ({ ctx, input }) => {
            const session = ctx.session;
            if (!session?.user?.id) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "You must be logged in to view subscriptions",
                });
            }

            const teamId = await getTeamIdBySlug(input.teamSlug);
            if (!teamId) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Team not found",
                });
            }

            if (!isAgencyUserRole(session.user.role) && !(await isTeamMember(teamId, session.user.id))) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have access to this team",
                });
            }

            const subs = await db.query.niscClientSubscription.findMany({
                where: eq(niscClientSubscription.teamId, teamId),
                orderBy: (s, { desc: d }) => [d(s.createdAt)],
                columns: {
                    id: true,
                    status: true,
                    subscriptionDate: true,
                    nextRenewalDate: true,
                    expiryDate: true,
                    name: true,
                },
                with: {
                    product: { columns: { name: true } },
                    productPlan: { columns: { name: true } },
                },
            });

            return subs.map((sub) => ({
                id: sub.id,
                productName: sub.name ?? sub.product.name,
                productPlanName: sub.productPlan?.name ?? null,
                subscriptionDate: sub.subscriptionDate,
                nextRenewalDate: sub.nextRenewalDate,
                expiryDate: sub.expiryDate,
                status: sub.status as SubscriptionStatus,
            }));
        }),

    /** Get a single subscription by ID */
    getById: protectedProcedure
        .input(getSubscriptionByIdInputSchema)
        .query(async ({ ctx, input }) => {
            const session = ctx.session;
            if (!session?.user?.id) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "You must be logged in to view subscriptions",
                });
            }

            const sub = await db.query.niscClientSubscription.findFirst({
                where: eq(niscClientSubscription.id, input.id),
                with: {
                    product: true,
                    productPlan: true,
                    team: true,
                    ...(input.includeRenewals && {
                        renewals: { orderBy: (r, { desc: d }) => [d(r.renewalDate)] },
                    }),
                    ...(input.includeCommissions && {
                        commissionEntries: { orderBy: (c, { desc: d }) => [d(c.period)] },
                    }),
                },
            });

            if (!sub) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Subscription not found",
                });
            }

            const canRead = await canReadSubscription(sub, session.user.id, session.user.role);
            if (!canRead) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have access to this subscription",
                });
            }

            if (input.teamSlug) {
                const slugTeamId = await getTeamIdBySlug(input.teamSlug);
                if (!slugTeamId) {
                    throw new TRPCError({
                        code: "NOT_FOUND",
                        message: "Team not found",
                    });
                }
                if (!isAgencyUserRole(session.user.role) && !(await isTeamMember(slugTeamId, session.user.id))) {
                    throw new TRPCError({
                        code: "FORBIDDEN",
                        message: "You do not have access to this team",
                    });
                }
                if (sub.teamId !== slugTeamId) {
                    throw new TRPCError({
                        code: "FORBIDDEN",
                        message: "You do not have access to this subscription",
                    });
                }
            }

            let userName: string | null = null;
            if (sub.userId) {
                const [u] = await db
                    .select({ name: userTable.name, email: userTable.email })
                    .from(userTable)
                    .where(eq(userTable.id, sub.userId))
                    .limit(1);
                userName = u ? (u.name ?? u.email ?? null) : null;
            }

            const renewals = input.includeRenewals ? sub.renewals : undefined;
            const commissionEntries = input.includeCommissions
                ? sub.commissionEntries?.map(mapCommissionEntry)
                : undefined;

            return {
                ...mapSubscription(sub),
                product: sub.product,
                productPlan: sub.productPlan ?? null,
                team: sub.team ?? null,
                userName,
                ...(renewals && { renewals }),
                ...(commissionEntries && { commissionEntries }),
            };
        }),

    /** Resolve product ID for "Domains" product (name contains "domain", case-insensitive). Used when creating domain subscriptions from portfolio. */
    getDomainsProductId: protectedProcedure.query(async () => {
        const [product] = await db
            .select({ id: niscProduct.id })
            .from(niscProduct)
            .where(and(eq(niscProduct.isActive, true), ilike(niscProduct.name, "%domain%")))
            .limit(1);
        return product?.id ?? null;
    }),

    /** Resolve product ID for domain transfer (serviceType domain_transfer). Used for transfer checkout → createFromPayment. */
    getTransferProductId: protectedProcedure.query(async () => {
        const [product] = await db
            .select({ id: niscProduct.id, name: niscProduct.name })
            .from(niscProduct)
            .where(and(eq(niscProduct.isActive, true), eq(niscProduct.serviceType, "domain_transfer")))
            .limit(1);
        return product ? { id: product.id, name: product.name } : null;
    }),

    /** Get subscription by OpenProvider domain ID (for checking if domain already has a connected subscription). */
    getByOpenProviderId: protectedProcedure
        .input(z.object({ openProviderId: z.number().int().positive() }))
        .query(async ({ ctx, input }) => {
            const session = ctx.session;
            if (!session?.user?.id) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "You must be logged in to view subscriptions",
                });
            }
            const [sub] = await db
                .select()
                .from(niscClientSubscription)
                .where(eq(niscClientSubscription.openProviderId, input.openProviderId))
                .limit(1);
            if (sub) {
                const canRead = await canReadSubscription(sub, session.user.id, session.user.role);
                if (!canRead) {
                    throw new TRPCError({
                        code: "FORBIDDEN",
                        message: "You do not have access to this subscription",
                    });
                }
            }
            return sub ? mapSubscription(sub) : null;
        }),

    /** Return OpenProvider domain IDs that already have a subscription (for batch check on list). */
    getOpenProviderIdsWithSubscriptions: protectedProcedure
        .input(z.object({ openProviderIds: z.array(z.number().int()) }))
        .output(z.array(z.number().int()))
        .query(async ({ ctx, input }) => {
            const session = ctx.session;
            if (!session?.user?.id) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "You must be logged in to view subscriptions",
                });
            }
            if (input.openProviderIds.length === 0) return [];
            const readScope = await buildSubscriptionReadScope(session.user.id, session.user.role);
            const whereParts: SQL[] = [inArray(niscClientSubscription.openProviderId, input.openProviderIds)];
            if (readScope) whereParts.push(readScope);
            const subs = await db
                .select({ openProviderId: niscClientSubscription.openProviderId })
                .from(niscClientSubscription)
                .where(and(...whereParts));
            return subs
                .map((s) => s.openProviderId)
                .filter((id): id is number => id != null);
        }),

    /** Check if a Plesk subscription id already has a linked NiscClientSubscription (serviceRefs.pleskSubscriptionId). */
    getHasLinkedSubscriptionByPleskId: protectedProcedure
        .input(z.object({ pleskSubscriptionId: z.union([z.string(), z.number()]) }))
        .output(z.object({ hasLinked: z.boolean() }))
        .query(async ({ ctx, input }) => {
            const session = ctx.session;
            if (!session?.user?.id) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "You must be logged in to view subscriptions",
                });
            }
            const idStr = String(input.pleskSubscriptionId);
            const readScope = await buildSubscriptionReadScope(session.user.id, session.user.role);
            const [sub] = await db
                .select({ id: niscClientSubscription.id })
                .from(niscClientSubscription)
                .where(
                    and(
                        sql`(${niscClientSubscription.serviceRefs}->>'pleskSubscriptionId') = ${idStr}`,
                        readScope ?? sql`true`,
                    ),
                )
                .limit(1);
            return { hasLinked: !!sub };
        }),

    /** Return Plesk subscription ids that already have a linked NiscClientSubscription (for batch check on hosting list). */
    getPleskSubscriptionIdsWithLinkedSubscription: protectedProcedure
        .input(z.object({ pleskSubscriptionIds: z.array(z.union([z.string(), z.number()])) }))
        .output(z.array(z.string()))
        .query(async ({ ctx, input }) => {
            const session = ctx.session;
            if (!session?.user?.id) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "You must be logged in to view subscriptions",
                });
            }
            if (input.pleskSubscriptionIds.length === 0) return [];
            const idStrs = [...new Set(input.pleskSubscriptionIds.map((id) => String(id)))];
            const readScope = await buildSubscriptionReadScope(session.user.id, session.user.role);
            const subs = await db
                .select({ serviceRefs: niscClientSubscription.serviceRefs })
                .from(niscClientSubscription)
                .where(and(or(...idStrs.map((id) => sql`(${niscClientSubscription.serviceRefs}->>'pleskSubscriptionId') = ${id}`)), readScope ?? sql`true`));
            const found = new Set<string>();
            for (const sub of subs) {
                const refs = sub.serviceRefs as Record<string, unknown> | null;
                if (refs && typeof refs.pleskSubscriptionId === "string") {
                    found.add(refs.pleskSubscriptionId);
                }
            }
            return idStrs.filter((id) => found.has(id));
        }),

    /** Get active media buying product and its active plans for subscription creation. */
    getMediaBuyingProductForSubscription: protectedProcedure
        .output(mediaBuyingProductOutputSchema.nullable())
        .query(async () => {
            const product = await db.query.niscProduct.findFirst({
                where: and(
                    eq(niscProduct.isActive, true),
                    ilike(niscProduct.name, "%media buying%"),
                ),
                with: {
                    plans: {
                        where: eq(niscProductPlan.isActive, true),
                        orderBy: (plan, { asc: a }) => [a(plan.sortOrder), a(plan.createdAt)],
                    },
                },
            });

            if (!product) return null;

            return {
                id: product.id,
                name: product.name,
                plans: (product.plans ?? []).map((plan) => ({
                    id: plan.id,
                    name: plan.name,
                    pricingModel: plan.pricingModel as "FIXED" | "COMMISSION",
                    billingCycle: (plan.billingCycle as z.infer<typeof billingCycleSchema> | null) ?? null,
                    price: plan.price ?? null,
                    currency: plan.currency ?? null,
                    agreedCommissionRate:
                        plan.commissionRate != null ? Number(plan.commissionRate) : null,
                    agreedCommissionBase: plan.commissionBase ?? null,
                })),
            };
        }),

    /** Check whether an ad account already has a linked media buying subscription. */
    getLinkedMediaBuyingSubscriptionByAdAccount: protectedProcedure
        .input(adAccountLinkLookupInputSchema)
        .output(adAccountLinkLookupOutputSchema)
        .query(async ({ ctx, input }) => {
            const session = ctx.session;
            if (!session?.user?.id) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "You must be logged in to view linked subscriptions",
                });
            }

            const readScope = await buildSubscriptionReadScope(session.user.id, session.user.role);
            const [row] = await db
                .select({
                    id: niscClientSubscription.id,
                    teamId: niscClientSubscription.teamId,
                    teamName: team.name,
                })
                .from(niscClientSubscription)
                .leftJoin(team, eq(team.id, niscClientSubscription.teamId))
                .where(
                    and(
                        sql`(${niscClientSubscription.serviceRefs}->>'adPlatform') = ${input.platform}`,
                        sql`(${niscClientSubscription.serviceRefs}->>'adAccountId') = ${input.accountId}`,
                        readScope ?? sql`true`,
                    ),
                )
                .limit(1);

            return {
                hasLinkedSubscription: !!row,
                subscriptionId: row?.id ?? null,
                teamId: row?.teamId ?? null,
                teamName: row?.teamName ?? null,
            };
        }),

    /** Create a team-linked media buying subscription for a specific ad account. */
    createMediaBuyingSubscription: protectedProcedure
        .input(createMediaBuyingSubscriptionInputSchema)
        .output(subscriptionOutputSchema)
        .mutation(async ({ ctx, input }) => {
            const session = ctx.session;
            if (!session?.user?.id) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "You must be logged in to create subscriptions",
                });
            }

            const hasTeamAccess = await canAssignTeamSubscription({
                teamId: input.teamId,
                userId: session.user.id,
                role: session.user.role,
            });
            if (!hasTeamAccess) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have access to this team",
                });
            }

            const [selectedPlan] = await db
                .select({
                    id: niscProductPlan.id,
                    productId: niscProductPlan.productId,
                    pricingModel: niscProductPlan.pricingModel,
                    billingCycle: niscProductPlan.billingCycle,
                    price: niscProductPlan.price,
                    currency: niscProductPlan.currency,
                    commissionRate: niscProductPlan.commissionRate,
                    commissionBase: niscProductPlan.commissionBase,
                    productName: niscProduct.name,
                })
                .from(niscProductPlan)
                .innerJoin(niscProduct, eq(niscProduct.id, niscProductPlan.productId))
                .where(
                    and(
                        eq(niscProductPlan.id, input.productPlanId),
                        eq(niscProductPlan.isActive, true),
                        eq(niscProduct.isActive, true),
                        ilike(niscProduct.name, "%media buying%"),
                    ),
                )
                .limit(1);

            if (!selectedPlan) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Invalid media buying plan selected",
                });
            }

            const [existing] = await db
                .select({ id: niscClientSubscription.id })
                .from(niscClientSubscription)
                .where(
                    and(
                        sql`(${niscClientSubscription.serviceRefs}->>'adPlatform') = ${input.platform}`,
                        sql`(${niscClientSubscription.serviceRefs}->>'adAccountId') = ${input.accountId}`,
                    ),
                )
                .limit(1);
            if (existing) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "This ad account is already linked to a subscription",
                });
            }

            const now = new Date();
            const subId = crypto.randomUUID();
            const pricingModel = selectedPlan.pricingModel as "FIXED" | "COMMISSION";

            const [created] = await db
                .insert(niscClientSubscription)
                .values({
                    id: subId,
                    name: input.accountName?.trim() || `${selectedPlan.productName} - ${input.accountId}`,
                    teamId: input.teamId,
                    productId: selectedPlan.productId,
                    productPlanId: selectedPlan.id,
                    recordedBy: session.user.id,
                    subscribedBy: session.user.id,
                    status: "ACTIVE",
                    subscriptionDate: now,
                    billingCycle: pricingModel === "FIXED" ? selectedPlan.billingCycle ?? "MONTHLY" : null,
                    autoRenew: false,
                    pricingModel,
                    agreedPrice: pricingModel === "FIXED" ? selectedPlan.price ?? null : null,
                    agreedCurrency: selectedPlan.currency ?? "KES",
                    agreedCommissionRate:
                        pricingModel === "COMMISSION" && selectedPlan.commissionRate != null
                            ? String(selectedPlan.commissionRate)
                            : null,
                    agreedCommissionBase:
                        pricingModel === "COMMISSION" ? selectedPlan.commissionBase ?? null : null,
                    serviceRefs: {
                        adPlatform: input.platform,
                        adAccountId: input.accountId,
                        adAccountName: input.accountName?.trim() || null,
                    },
                    metadata: {
                        adServingFee: input.adServingFee,
                        adServingFeeCurrency: input.adServingFeeCurrency,
                    },
                })
                .returning();

            if (!created) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to create media buying subscription",
                });
            }

            await db.insert(niscClientSubscriptionActivityLog).values({
                id: crypto.randomUUID(),
                subscriptionId: created.id,
                userId: session.user.id,
                action: "CREATE_MEDIA_BUYING_SUBSCRIPTION",
                description: `Created media buying subscription for ${input.platform} account ${input.accountId}`,
                metadata: {
                    platform: input.platform,
                    accountId: input.accountId,
                    productPlanId: input.productPlanId,
                    adServingFee: input.adServingFee,
                    adServingFeeCurrency: input.adServingFeeCurrency,
                },
                ipAddress: null,
                userAgent: null,
            });

            return mapSubscription(created);
        }),

    /** Return ad account IDs linked to media buying subscriptions for a team/platform. */
    listLinkedAdAccountsForTeam: protectedProcedure
        .input(linkedAdAccountsForTeamInputSchema)
        .output(z.array(z.string()))
        .query(async ({ ctx, input }) => {
            const session = ctx.session;
            if (!session?.user?.id) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "You must be logged in to view linked ad accounts",
                });
            }

            const teamId = await getTeamIdBySlug(input.teamSlug);
            if (!teamId) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Team not found",
                });
            }

            if (!isAgencyUserRole(session.user.role) && !(await isTeamMember(teamId, session.user.id))) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have access to this team",
                });
            }

            const rows = await db
                .select({ serviceRefs: niscClientSubscription.serviceRefs })
                .from(niscClientSubscription)
                .innerJoin(niscProduct, eq(niscProduct.id, niscClientSubscription.productId))
                .where(
                    and(
                        eq(niscClientSubscription.teamId, teamId),
                        ilike(niscProduct.name, "%media buying%"),
                        sql`(${niscClientSubscription.serviceRefs}->>'adPlatform') = ${input.platform}`,
                    ),
                );

            const ids = new Set<string>();
            for (const row of rows) {
                const refs = row.serviceRefs as Record<string, unknown> | null;
                const accountId = refs?.adAccountId;
                if (typeof accountId === "string" && accountId.trim().length > 0) {
                    ids.add(accountId);
                }
            }

            return [...ids];
        }),

    /** Return linked ad accounts (id + name) from media buying subscriptions for a team/platform. */
    listLinkedAdAccountsForTeamDetailed: protectedProcedure
        .input(linkedAdAccountsForTeamInputSchema)
        .output(z.array(linkedAdAccountItemSchema))
        .query(async ({ ctx, input }) => {
            const session = ctx.session;
            if (!session?.user?.id) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "You must be logged in to view linked ad accounts",
                });
            }

            const teamId = await getTeamIdBySlug(input.teamSlug);
            if (!teamId) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Team not found",
                });
            }

            if (!isAgencyUserRole(session.user.role) && !(await isTeamMember(teamId, session.user.id))) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have access to this team",
                });
            }

            const rows = await db
                .select({
                    serviceRefs: niscClientSubscription.serviceRefs,
                    name: niscClientSubscription.name,
                })
                .from(niscClientSubscription)
                .innerJoin(niscProduct, eq(niscProduct.id, niscClientSubscription.productId))
                .where(
                    and(
                        eq(niscClientSubscription.teamId, teamId),
                        ilike(niscProduct.name, "%media buying%"),
                        sql`(${niscClientSubscription.serviceRefs}->>'adPlatform') = ${input.platform}`,
                    ),
                );

            const byId = new Map<string, { accountId: string; accountName: string | null }>();
            for (const row of rows) {
                const refs = row.serviceRefs as Record<string, unknown> | null;
                const accountId = refs?.adAccountId;
                if (typeof accountId !== "string" || accountId.trim().length === 0) continue;
                const accountNameRaw = refs?.adAccountName;
                const accountName =
                    typeof accountNameRaw === "string" && accountNameRaw.trim().length > 0
                        ? accountNameRaw.trim()
                        : row.name ?? null;
                if (!byId.has(accountId)) {
                    byId.set(accountId, { accountId, accountName });
                }
            }

            return [...byId.values()];
        }),

    /** Create a new subscription */
    create: protectedProcedure
        .input(createSubscriptionInputSchema)
        .output(subscriptionOutputSchema)
        .mutation(async ({ ctx, input }) => {
            const session = ctx.session;
            if (!session?.user?.id) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "You must be logged in to create subscriptions",
                });
            }

            if (!isAgencySuperAdminRole(session.user.role)) {
                if (input.userId && input.userId !== session.user.id) {
                    throw new TRPCError({
                        code: "FORBIDDEN",
                        message: "Only AGENCY_SUPER_ADMIN can create subscriptions for another user",
                    });
                }
                if (input.recordedBy && input.recordedBy !== session.user.id) {
                    throw new TRPCError({
                        code: "FORBIDDEN",
                        message: "Only AGENCY_SUPER_ADMIN can set recordedBy to another user",
                    });
                }
            }
            if (input.teamId && !isAgencyUserRole(session.user.role)) {
                const member = await isTeamMember(input.teamId, session.user.id);
                if (!member) {
                    throw new TRPCError({
                        code: "FORBIDDEN",
                        message: "You do not have access to this team",
                    });
                }
            }

            const [product] = await db
                .select({ id: niscProduct.id })
                .from(niscProduct)
                .where(eq(niscProduct.id, input.productId))
                .limit(1);
            if (!product) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
            }

            if (input.productPlanId) {
                const [plan] = await db
                    .select({ id: niscProductPlan.id })
                    .from(niscProductPlan)
                    .where(
                        and(
                            eq(niscProductPlan.id, input.productPlanId),
                            eq(niscProductPlan.productId, input.productId),
                        ),
                    )
                    .limit(1);
                if (!plan) {
                    throw new TRPCError({
                        code: "NOT_FOUND",
                        message: "Plan not found or does not belong to the specified product",
                    });
                }
            }

            const subId = crypto.randomUUID();
            const [sub] = await db
                .insert(niscClientSubscription)
                .values({
                    id: subId,
                    name: input.name ?? null,
                    userId: input.userId ?? null,
                    teamId: input.teamId ?? null,
                    productId: input.productId,
                    productPlanId: input.productPlanId ?? null,
                    orderId: input.orderId ?? null,
                    subscribedBy: input.subscribedBy ?? null,
                    recordedBy: input.recordedBy ?? session.user.id,
                    status: input.status,
                    subscriptionDate: input.subscriptionDate ?? null,
                    billingCycle: input.billingCycle ?? null,
                    nextRenewalDate: input.nextRenewalDate ?? null,
                    expiryDate: input.expiryDate ?? null,
                    autoRenew: input.autoRenew,
                    pricingModel: input.pricingModel,
                    agreedPrice: input.agreedPrice ?? null,
                    agreedCurrency: input.agreedCurrency,
                    agreedCost: input.agreedCost ?? null,
                    agreedCostCurrency: input.agreedCostCurrency ?? null,
                    providerCost: input.providerCost ?? null,
                    providerCostCurrency: input.providerCostCurrency ?? null,
                    agreedCommissionRate:
                        input.agreedCommissionRate != null
                            ? String(input.agreedCommissionRate)
                            : null,
                    agreedCommissionBase: input.agreedCommissionBase ?? null,
                    primaryDomain: input.primaryDomain ?? null,
                    pleskFilterId: input.pleskFilterId ?? null,
                    pleskOwnerId: input.pleskOwnerId ?? null,
                    pleskFtpLogin: input.pleskFtpLogin ?? null,
                    pleskFtpPassword: input.pleskFtpPassword ?? null,
                    hostingType: input.hostingType ?? null,
                    openProviderId: input.openProviderId ?? null,
                    domainAuthCode: input.domainAuthCode ?? null,
                    nameserverGroupId: input.nameserverGroupId ?? null,
                    wpInstallationId: input.wpInstallationId ?? null,
                    serviceRefs: input.serviceRefs ?? null,
                    hostingSubscriptionId: input.hostingSubscriptionId ?? null,
                    notes: input.notes ?? null,
                    metadata: input.metadata ?? null,
                })
                .returning();

            if (!sub) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to create subscription",
                });
            }

            await db.insert(niscClientSubscriptionActivityLog).values({
                id: crypto.randomUUID(),
                subscriptionId: sub.id,
                userId: session.user.id,
                action: "CREATE",
                description: `Created ${sub.pricingModel} subscription for product ${input.productId}`,
                metadata: {
                    productId: input.productId,
                    productPlanId: input.productPlanId ?? null,
                    pricingModel: input.pricingModel,
                    status: input.status,
                },
                ipAddress: null,
                userAgent: null,
            });

            return mapSubscription(sub);
        }),

    /** Update a subscription */
    update: protectedProcedure
        .input(updateSubscriptionInputSchema)
        .output(subscriptionOutputSchema)
        .mutation(async ({ ctx, input }) => {
            const session = ctx.session;
            if (!session?.user?.id) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "You must be logged in to update subscriptions",
                });
            }

            const [existing] = await db
                .select()
                .from(niscClientSubscription)
                .where(eq(niscClientSubscription.id, input.id))
                .limit(1);
            if (!existing) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Subscription not found" });
            }
            if (!canMutateSubscription(existing, session.user.id, session.user.role)) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "Only the owner can update this subscription",
                });
            }

            const { id, ...rest } = input;
            const patch: Record<string, unknown> = {};
            if (rest.status !== undefined) patch.status = rest.status;
            if (rest.subscriptionDate !== undefined) patch.subscriptionDate = rest.subscriptionDate;
            if (rest.billingCycle !== undefined) patch.billingCycle = rest.billingCycle;
            if (rest.nextRenewalDate !== undefined) patch.nextRenewalDate = rest.nextRenewalDate;
            if (rest.expiryDate !== undefined) patch.expiryDate = rest.expiryDate;
            if (rest.autoRenew !== undefined) patch.autoRenew = rest.autoRenew;
            if (rest.agreedPrice !== undefined) patch.agreedPrice = rest.agreedPrice ?? null;
            if (rest.agreedCurrency !== undefined) patch.agreedCurrency = rest.agreedCurrency;
            if (rest.agreedCommissionRate !== undefined)
                patch.agreedCommissionRate =
                    rest.agreedCommissionRate != null ? String(rest.agreedCommissionRate) : null;
            if (rest.agreedCommissionBase !== undefined)
                patch.agreedCommissionBase = rest.agreedCommissionBase ?? null;
            if (rest.primaryDomain !== undefined) patch.primaryDomain = rest.primaryDomain ?? null;
            if (rest.pleskFilterId !== undefined) patch.pleskFilterId = rest.pleskFilterId ?? null;
            if (rest.pleskOwnerId !== undefined) patch.pleskOwnerId = rest.pleskOwnerId ?? null;
            if (rest.pleskFtpLogin !== undefined) patch.pleskFtpLogin = rest.pleskFtpLogin ?? null;
            if (rest.pleskFtpPassword !== undefined) patch.pleskFtpPassword = rest.pleskFtpPassword ?? null;
            if (rest.hostingType !== undefined) patch.hostingType = rest.hostingType ?? null;
            if (rest.openProviderId !== undefined) patch.openProviderId = rest.openProviderId ?? null;
            if (rest.domainAuthCode !== undefined) patch.domainAuthCode = rest.domainAuthCode ?? null;
            if (rest.nameserverGroupId !== undefined)
                patch.nameserverGroupId = rest.nameserverGroupId ?? null;
            if (rest.wpInstallationId !== undefined) patch.wpInstallationId = rest.wpInstallationId ?? null;
            if (rest.serviceRefs !== undefined) patch.serviceRefs = rest.serviceRefs ?? null;
            if (rest.notes !== undefined) patch.notes = rest.notes ?? null;
            if (rest.metadata !== undefined) patch.metadata = rest.metadata ?? null;

            const [updated] = await db
                .update(niscClientSubscription)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .set(patch as any)
                .where(eq(niscClientSubscription.id, id))
                .returning();

            if (!updated) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Subscription not found" });
            }

            await db.insert(niscClientSubscriptionActivityLog).values({
                id: crypto.randomUUID(),
                subscriptionId: id,
                userId: session.user.id,
                action: "UPDATE",
                description: `Updated subscription`,
                metadata: { previousStatus: existing.status, newStatus: rest.status ?? existing.status },
                ipAddress: null,
                userAgent: null,
            });

            return mapSubscription(updated);
        }),

    /** Cancel a subscription */
    cancel: protectedProcedure
        .input(cancelSubscriptionInputSchema)
        .output(subscriptionOutputSchema)
        .mutation(async ({ ctx, input }) => {
            const session = ctx.session;
            if (!session?.user?.id) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "You must be logged in to cancel subscriptions",
                });
            }

            const [existing] = await db
                .select()
                .from(niscClientSubscription)
                .where(eq(niscClientSubscription.id, input.id))
                .limit(1);
            if (!existing) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Subscription not found" });
            }
            if (!canMutateSubscription(existing, session.user.id, session.user.role)) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "Only the owner can cancel this subscription",
                });
            }
            if (existing.status === "CANCELLED") {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Subscription is already cancelled",
                });
            }

            const [updated] = await db
                .update(niscClientSubscription)
                .set({ status: "CANCELLED" })
                .where(eq(niscClientSubscription.id, input.id))
                .returning();

            if (!updated) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Subscription not found" });
            }

            await db.insert(niscClientSubscriptionActivityLog).values({
                id: crypto.randomUUID(),
                subscriptionId: input.id,
                userId: session.user.id,
                action: "CANCEL",
                description: input.reason
                    ? `Cancelled subscription: ${input.reason}`
                    : "Cancelled subscription",
                metadata: { previousStatus: existing.status, reason: input.reason ?? null },
                ipAddress: null,
                userAgent: null,
            });

            return mapSubscription(updated);
        }),

    /** Send a service renewal reminder email. Grace period: 7 days before suspension for most services; for domains, suspension is immediate. */
    sendRenewalEmail: protectedProcedure
        .input(
            z.object({
                subscriptionId: z.string(),
                to: z.string().email(),
                ccOrBcc: z
                    .object({
                        type: z.enum(["cc", "bcc"]),
                        email: z.string().email(),
                    })
                    .optional(),
            })
        )
        .output(z.object({ sent: z.boolean() }))
        .mutation(async ({ ctx, input }) => {
            const session = ctx.session;
            if (!session?.user?.id) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "You must be logged in to send renewal emails",
                });
            }

            const sub = await db.query.niscClientSubscription.findFirst({
                where: eq(niscClientSubscription.id, input.subscriptionId),
                with: {
                    product: { columns: { name: true } },
                    productPlan: { columns: { name: true } },
                },
            });
            if (!sub) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Subscription not found" });
            }
            if (!canMutateSubscription(sub, session.user.id, session.user.role)) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "Only the owner can send renewal emails for this subscription",
                });
            }

            const productName = sub.product.name;
            const planName = sub.productPlan?.name ?? null;
            const serviceNameLabel = planName ? `${productName} - ${planName}` : productName;
            const subscriptionName = sub.name ?? null;
            const isDomain = productName.toLowerCase().includes("domain");
            const gracePeriodText = isDomain
                ? "For domain services, suspension is immediate after expiry."
                : "Your service will be suspended 7 days after the expiry date if not renewed.";
            const subscriptionDateStr = sub.subscriptionDate
                ? new Date(sub.subscriptionDate).toLocaleDateString()
                : " ";
            const expiryDateStr = sub.expiryDate ? new Date(sub.expiryDate).toLocaleDateString() : " ";

            const { renderServiceRenewalReminderEmail } = await import("../lib/email-templates");
            const html = await renderServiceRenewalReminderEmail({
                serviceName: serviceNameLabel,
                subscriptionName: subscriptionName ?? undefined,
                subscriptionDate: subscriptionDateStr,
                expiryDate: expiryDateStr,
                gracePeriodText,
            });

            const { sendEmail } = await import("../lib/email");
            const cc = input.ccOrBcc?.type === "cc" ? [input.ccOrBcc.email] : undefined;
            const bcc = input.ccOrBcc?.type === "bcc" ? [input.ccOrBcc.email] : undefined;
            const subject = `Renewal reminder: ${subscriptionName ?? serviceNameLabel}`;
            await sendEmail({
                to: input.to,
                subject,
                html,
                cc,
                bcc,
            });

            await db.insert(niscClientSubscriptionActivityLog).values({
                id: crypto.randomUUID(),
                subscriptionId: input.subscriptionId,
                userId: session.user.id,
                action: "SEND_RENEWAL_REMINDER",
                description: `Sent renewal reminder email to ${input.to}`,
                metadata: {
                    to: input.to,
                    cc: cc ?? null,
                    bcc: bcc ?? null,
                    subject,
                    serviceName: serviceNameLabel,
                    subscriptionName: subscriptionName ?? null,
                    subscriptionDate: subscriptionDateStr,
                    expiryDate: expiryDateStr,
                    gracePeriodText,
                    sentAt: new Date().toISOString(),
                },
                ipAddress: null,
                userAgent: null,
            });

            return { sent: true };
        }),

    /** Record a renewal for a subscription */
    renew: protectedProcedure
        .input(renewSubscriptionInputSchema)
        .output(
            z.object({
                renewalId: z.string(),
                subscription: subscriptionOutputSchema,
            }),
        )
        .mutation(async ({ ctx, input }) => {
            const session = ctx.session;
            if (!session?.user?.id) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "You must be logged in to renew subscriptions",
                });
            }

            const [existing] = await db
                .select()
                .from(niscClientSubscription)
                .where(eq(niscClientSubscription.id, input.subscriptionId))
                .limit(1);
            if (!existing) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Subscription not found" });
            }
            if (!canMutateSubscription(existing, session.user.id, session.user.role)) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "Only the owner can renew this subscription",
                });
            }

            const renewalId = crypto.randomUUID();
            const updatedSub = await db.transaction(async (tx) => {
                await tx.insert(niscClientSubscriptionRenewal).values({
                    id: renewalId,
                    subscriptionId: input.subscriptionId,
                    renewalType: input.renewalType,
                    renewedBy: input.renewedBy ?? session.user.id,
                    renewalDate: input.renewalDate,
                    newExpiryDate: input.newExpiryDate ?? null,
                    newNextRenewalDate: input.newNextRenewalDate ?? null,
                    billingCycle: input.billingCycle ?? null,
                    status: input.status,
                    renewalPrice: input.renewalPrice ?? null,
                    renewalCurrency: input.renewalCurrency,
                    orderId: input.orderId ?? null,
                    notes: input.notes ?? null,
                });
                const subPatch: Record<string, unknown> = { status: "ACTIVE" };
                if (input.newNextRenewalDate) subPatch.nextRenewalDate = input.newNextRenewalDate;
                if (input.newExpiryDate) subPatch.expiryDate = input.newExpiryDate;
                const [row] = await tx
                    .update(niscClientSubscription)
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    .set(subPatch as any)
                    .where(eq(niscClientSubscription.id, input.subscriptionId))
                    .returning();
                return row;
            });

            if (!updatedSub) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Renewal failed",
                });
            }

            await db.insert(niscClientSubscriptionActivityLog).values({
                id: crypto.randomUUID(),
                subscriptionId: input.subscriptionId,
                userId: session.user.id,
                action: "RENEW",
                description: `Renewed subscription (${input.renewalType})`,
                metadata: {
                    renewalId: renewalId,
                    renewalType: input.renewalType,
                    renewalDate: input.renewalDate,
                    newExpiryDate: input.newExpiryDate ?? null,
                },
                ipAddress: null,
                userAgent: null,
            });

            return {
                renewalId: renewalId,
                subscription: mapSubscription(updatedSub),
            };
        }),

    // ── Commission Entries ────────────────────────────────────────────────────

    /** Record a new commission entry for a COMMISSION subscription */
    recordCommission: protectedProcedure
        .input(recordCommissionInputSchema)
        .output(commissionEntryOutputSchema)
        .mutation(async ({ ctx, input }) => {
            const session = ctx.session;
            if (!session?.user?.id) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "You must be logged in to record commission entries",
                });
            }

            const [sub] = await db
                .select()
                .from(niscClientSubscription)
                .where(eq(niscClientSubscription.id, input.subscriptionId))
                .limit(1);
            if (!sub) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Subscription not found" });
            }
            if (!canMutateSubscription(sub, session.user.id, session.user.role)) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "Only the owner can record commission entries for this subscription",
                });
            }
            if (sub.pricingModel !== "COMMISSION") {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Commission entries can only be recorded for COMMISSION pricing subscriptions",
                });
            }
            if (!sub.productPlanId) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Subscription must have a product plan to record commission entries",
                });
            }
            if (!sub.agreedCommissionRate) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Subscription does not have an agreed commission rate",
                });
            }

            const rate = Number(sub.agreedCommissionRate);
            const commissionAmount = (input.baseAmount * rate) / 100;

            const entryId = crypto.randomUUID();
            const [entry] = await db
                .insert(niscCommissionEntry)
                .values({
                    id: entryId,
                    subscriptionId: input.subscriptionId,
                    productPlanId: sub.productPlanId,
                    teamId: sub.teamId ?? null,
                    period: input.period,
                    baseAmount: String(input.baseAmount),
                    baseAmountDescription: input.baseAmountDescription ?? null,
                    commissionRate: String(rate),
                    commissionAmount: String(commissionAmount),
                    currency: input.currency,
                    status: "DRAFT",
                    notes: input.notes ?? null,
                    createdBy: session.user.id,
                })
                .returning();

            if (!entry) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to record commission entry",
                });
            }

            return mapCommissionEntry(entry);
        }),

    /** List commission entries with optional filters */
    getCommissionEntries: protectedProcedure
        .input(getCommissionEntriesInputSchema.optional())
        .output(z.array(commissionEntryOutputSchema))
        .query(async ({ ctx, input }) => {
            const session = ctx.session;
            if (!session?.user?.id) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "You must be logged in to view commission entries",
                });
            }

            const parts: SQL[] = [];
            if (input?.subscriptionId !== undefined)
                parts.push(eq(niscCommissionEntry.subscriptionId, input.subscriptionId));
            if (input?.teamId !== undefined) parts.push(eq(niscCommissionEntry.teamId, input.teamId));
            if (input?.status !== undefined) parts.push(eq(niscCommissionEntry.status, input.status));
            if (input?.periodFrom) parts.push(gte(niscCommissionEntry.period, input.periodFrom));
            if (input?.periodTo) parts.push(lte(niscCommissionEntry.period, input.periodTo));
            if (!isAgencyUserRole(session.user.role)) {
                parts.push(eq(niscCommissionEntry.createdBy, session.user.id));
            }

            const entries = await db
                .select()
                .from(niscCommissionEntry)
                .where(parts.length ? and(...parts) : sql`true`)
                .orderBy(desc(niscCommissionEntry.period));

            return entries.map(mapCommissionEntry);
        }),

    /** Update a commission entry status (DRAFT → INVOICED → PAID / WAIVED) */
    updateCommissionEntry: protectedProcedure
        .input(updateCommissionEntryInputSchema)
        .output(commissionEntryOutputSchema)
        .mutation(async ({ ctx, input }) => {
            const session = ctx.session;
            if (!session?.user?.id) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "You must be logged in to update commission entries",
                });
            }

            const [existing] = await db
                .select()
                .from(niscCommissionEntry)
                .where(eq(niscCommissionEntry.id, input.id))
                .limit(1);
            if (!existing) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Commission entry not found" });
            }
            if (!isAgencySuperAdminRole(session.user.role) && existing.createdBy !== session.user.id) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "Only the owner can update this commission entry",
                });
            }

            const validTransitions: Record<string, string[]> = {
                DRAFT: ["INVOICED", "WAIVED"],
                INVOICED: ["PAID", "WAIVED"],
                PAID: [],
                WAIVED: [],
            };
            const allowed = validTransitions[existing.status] ?? [];
            if (!allowed.includes(input.status)) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: `Cannot transition commission entry from ${existing.status} to ${input.status}`,
                });
            }

            const patch: Record<string, unknown> = { status: input.status };
            if (input.invoiceId !== undefined) patch.invoiceId = input.invoiceId ?? null;
            if (input.notes !== undefined) patch.notes = input.notes ?? null;

            const [updated] = await db
                .update(niscCommissionEntry)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .set(patch as any)
                .where(eq(niscCommissionEntry.id, input.id))
                .returning();

            if (!updated) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Commission entry not found" });
            }

            return mapCommissionEntry(updated);
        }),

    /** List domain subscriptions for a user/team (product.serviceType === "domain_registration"). Used for domain dropdown in Nisc orders. */
    getDomainSubscriptions: protectedProcedure
        .input(
            z.object({
                userId: z.string().optional(),
                teamId: z.string().optional(),
            }).refine((data) => data.userId != null || data.teamId != null, {
                message: "At least one of userId or teamId is required",
            }),
        )
        .output(
            z.array(
                z.object({
                    id: z.string(),
                    name: z.string().nullable(),
                    primaryDomain: z.string().nullable(),
                }),
            ),
        )
        .query(async ({ ctx, input }) => {
            const session = ctx.session;
            if (!session?.user?.id) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "You must be logged in to list domain subscriptions",
                });
            }

            const domainParts: SQL[] = [
                or(
                    ilike(niscProduct.serviceType, "%domain%"),
                    ilike(niscProduct.name, "%domain%"),
                ) as SQL,
            ];
            if (!isAgencyUserRole(session.user.role)) {
                if (input.userId != null && input.userId !== session.user.id) {
                    throw new TRPCError({
                        code: "FORBIDDEN",
                        message: "You can only list your own domain subscriptions",
                    });
                }
                if (input.teamId != null && !(await isTeamMember(input.teamId, session.user.id))) {
                    throw new TRPCError({
                        code: "FORBIDDEN",
                        message: "You do not have access to this team",
                    });
                }
            }
            if (input.userId != null) domainParts.push(eq(niscClientSubscription.userId, input.userId));
            if (input.teamId != null) domainParts.push(eq(niscClientSubscription.teamId, input.teamId));

            const subs = await db
                .select({
                    id: niscClientSubscription.id,
                    name: niscClientSubscription.name,
                    primaryDomain: niscClientSubscription.primaryDomain,
                })
                .from(niscClientSubscription)
                .innerJoin(niscProduct, eq(niscClientSubscription.productId, niscProduct.id))
                .where(and(...domainParts))
                .orderBy(desc(niscClientSubscription.createdAt));

            return subs.map((s) => ({
                id: s.id,
                name: s.name ?? null,
                primaryDomain: s.primaryDomain ?? null,
            }));
        }),
});
