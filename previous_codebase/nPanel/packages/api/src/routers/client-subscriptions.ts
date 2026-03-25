import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../trpc";
import prisma, { Prisma } from "@npanel/db";

// ============================================================================
// ZOD SCHEMAS — independent from the database schema layer
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
    .record(z.union([z.string(), z.array(z.string())]))
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
        metadata: z.record(z.unknown()).optional(),
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
    metadata: z.record(z.unknown()).optional(),
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

            const where: Record<string, unknown> = {};
            if (input?.userId !== undefined) where.userId = input.userId;
            if (input?.teamId !== undefined) where.teamId = input.teamId;
            if (input?.productId !== undefined) where.productId = input.productId;
            if (input?.productPlanId !== undefined) where.productPlanId = input.productPlanId;
            if (input?.pricingModel !== undefined) where.pricingModel = input.pricingModel;
            if (input?.status !== undefined) where.status = input.status;

            if (input?.fromDate || input?.toDate) {
                where.subscriptionDate = {
                    ...(input.fromDate && { gte: input.fromDate }),
                    ...(input.toDate && { lte: input.toDate }),
                };
            }

            const subs = await prisma.niscClientSubscription.findMany({
                where,
                orderBy: { createdAt: "desc" },
                take: input?.limit ?? 50,
                skip: input?.offset ?? 0,
            });

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

            const where: { productId?: { in: string[] } } = {};
            if (input?.productFilter === "hosting") {
                const hostingProducts = await prisma.niscProduct.findMany({
                    where: { name: { contains: "hosting", mode: "insensitive" }, isActive: true },
                    select: { id: true },
                });
                const ids = hostingProducts.map((p) => p.id);
                if (ids.length > 0) where.productId = { in: ids };
                else {
                    // No hosting products: return empty list
                    return [];
                }
            }

            const subs = await prisma.niscClientSubscription.findMany({
                where,
                orderBy: { createdAt: "desc" },
                take: input?.limit ?? 100,
                skip: input?.offset ?? 0,
                include: {
                    product: { select: { name: true } },
                    productPlan: { select: { name: true } },
                    team: { select: { name: true } },
                },
            });

            const userIds = [...new Set(subs.map((s) => s.userId).filter(Boolean))] as string[];
            const users =
                userIds.length > 0
                    ? await prisma.user.findMany({
                          where: { id: { in: userIds } },
                          select: { id: true, name: true, email: true },
                      })
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

            const team = await prisma.team.findUnique({
                where: { slug: input.teamSlug },
                select: { id: true },
            });
            if (!team) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Team not found",
                });
            }

            const membership = await prisma.teamMember.findUnique({
                where: {
                    teamId_userId: { teamId: team.id, userId: session.user.id },
                },
                select: { id: true },
            });
            if (!membership) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have access to this team",
                });
            }

            const hostingProducts = await prisma.niscProduct.findMany({
                where: {
                    isActive: true,
                    OR: [
                        { name: { contains: "web hosting", mode: "insensitive" } },
                        { name: { contains: "website hosting", mode: "insensitive" } },
                    ],
                },
                select: { id: true },
            });
            const productIds = hostingProducts.map((p) => p.id);
            if (productIds.length === 0) return [];

            const subs = await prisma.niscClientSubscription.findMany({
                where: {
                    teamId: team.id,
                    productId: { in: productIds },
                },
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    name: true,
                    status: true,
                    subscriptionDate: true,
                    expiryDate: true,
                    primaryDomain: true,
                    serviceRefs: true,
                    pleskFilterId: true,
                    hostingSubscriptionId: true,
                    product: { select: { name: true } },
                    productPlan: { select: { name: true } },
                },
            });

            const hostingSubIds = [...new Set(subs.map((s) => s.hostingSubscriptionId).filter(Boolean))] as string[];
            const hostingPleskMap = new Map<string, string>();
            if (hostingSubIds.length > 0) {
                const hsList = await prisma.hostingSubscription.findMany({
                    where: { id: { in: hostingSubIds } },
                    select: { id: true, pleskFilterId: true },
                });
                for (const hs of hsList) {
                    if (hs.pleskFilterId) hostingPleskMap.set(hs.id, hs.pleskFilterId);
                }
            }

            return subs.map((sub) => {
                let pleskId: string | null = null;
                const refs = sub.serviceRefs as Record<string, unknown> | null;
                if (refs && (typeof refs.pleskSubscriptionId === "string" || typeof refs.pleskSubscriptionId === "number")) {
                    pleskId = String(refs.pleskSubscriptionId);
                }
                if (!pleskId && sub.pleskFilterId) pleskId = sub.pleskFilterId;
                if (!pleskId && sub.hostingSubscriptionId) pleskId = hostingPleskMap.get(sub.hostingSubscriptionId) ?? null;
                return {
                    id: sub.id,
                    pleskSubscriptionId: pleskId,
                    subscriptionName: sub.name ?? null,
                    status: sub.status,
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

            const team = await prisma.team.findUnique({
                where: { slug: input.teamSlug },
                select: { id: true },
            });
            if (!team) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Team not found",
                });
            }

            const membership = await prisma.teamMember.findUnique({
                where: {
                    teamId_userId: { teamId: team.id, userId: session.user.id },
                },
                select: { id: true },
            });
            if (!membership) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have access to this team",
                });
            }

            const emailHostingProducts = await prisma.niscProduct.findMany({
                where: {
                    isActive: true,
                    name: { contains: "email hosting", mode: "insensitive" },
                },
                select: { id: true },
            });
            const productIds = emailHostingProducts.map((p) => p.id);
            if (productIds.length === 0) return [];

            const subs = await prisma.niscClientSubscription.findMany({
                where: {
                    teamId: team.id,
                    productId: { in: productIds },
                },
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    name: true,
                    status: true,
                    subscriptionDate: true,
                    expiryDate: true,
                    primaryDomain: true,
                    serviceRefs: true,
                    pleskFilterId: true,
                    hostingSubscriptionId: true,
                    product: { select: { name: true } },
                    productPlan: { select: { name: true } },
                },
            });

            const hostingSubIds = [...new Set(subs.map((s) => s.hostingSubscriptionId).filter(Boolean))] as string[];
            const hostingPleskMap = new Map<string, string>();
            if (hostingSubIds.length > 0) {
                const hsList = await prisma.hostingSubscription.findMany({
                    where: { id: { in: hostingSubIds } },
                    select: { id: true, pleskFilterId: true },
                });
                for (const hs of hsList) {
                    if (hs.pleskFilterId) hostingPleskMap.set(hs.id, hs.pleskFilterId);
                }
            }

            return subs.map((sub) => {
                let pleskId: string | null = null;
                const refs = sub.serviceRefs as Record<string, unknown> | null;
                if (refs && (typeof refs.pleskSubscriptionId === "string" || typeof refs.pleskSubscriptionId === "number")) {
                    pleskId = String(refs.pleskSubscriptionId);
                }
                if (!pleskId && sub.pleskFilterId) pleskId = sub.pleskFilterId;
                if (!pleskId && sub.hostingSubscriptionId) pleskId = hostingPleskMap.get(sub.hostingSubscriptionId) ?? null;
                return {
                    id: sub.id,
                    pleskSubscriptionId: pleskId,
                    subscriptionName: sub.name ?? null,
                    status: sub.status,
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

            const team = await prisma.team.findUnique({
                where: { slug: input.teamSlug },
                select: { id: true },
            });
            if (!team) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Team not found",
                });
            }

            const membership = await prisma.teamMember.findUnique({
                where: {
                    teamId_userId: { teamId: team.id, userId: session.user.id },
                },
                select: { id: true },
            });
            if (!membership) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have access to this team",
                });
            }

            const domainProducts = await prisma.niscProduct.findMany({
                where: {
                    isActive: true,
                    name: { contains: "domains", mode: "insensitive" },
                },
                select: { id: true },
            });
            const productIds = domainProducts.map((p) => p.id);
            if (productIds.length === 0) return [];

            const subs = await prisma.niscClientSubscription.findMany({
                where: {
                    teamId: team.id,
                    productId: { in: productIds },
                },
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    name: true,
                    status: true,
                    subscriptionDate: true,
                    expiryDate: true,
                    primaryDomain: true,
                    serviceRefs: true,
                    pleskFilterId: true,
                    product: { select: { name: true } },
                    productPlan: { select: { name: true } },
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
                    status: sub.status,
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

            const team = await prisma.team.findUnique({
                where: { slug: input.teamSlug },
                select: { id: true },
            });
            if (!team) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Team not found",
                });
            }

            const membership = await prisma.teamMember.findUnique({
                where: {
                    teamId_userId: { teamId: team.id, userId: session.user.id },
                },
                select: { id: true },
            });
            if (!membership) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have access to this team",
                });
            }

            const subs = await prisma.niscClientSubscription.findMany({
                where: { teamId: team.id },
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    status: true,
                    subscriptionDate: true,
                    nextRenewalDate: true,
                    expiryDate: true,
                    name: true,
                    product: { select: { name: true } },
                    productPlan: { select: { name: true } },
                },
            });

            return subs.map((sub) => ({
                id: sub.id,
                productName: sub.name ?? sub.product.name,
                productPlanName: sub.productPlan?.name ?? null,
                subscriptionDate: sub.subscriptionDate,
                nextRenewalDate: sub.nextRenewalDate,
                expiryDate: sub.expiryDate,
                status: sub.status,
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

            const sub = await prisma.niscClientSubscription.findUnique({
                where: { id: input.id },
                include: {
                    product: true,
                    productPlan: true,
                    team: true,
                    ...(input.includeRenewals && {
                        renewals: { orderBy: { renewalDate: "desc" } },
                    }),
                    ...(input.includeCommissions && {
                        commissionEntries: { orderBy: { period: "desc" } },
                    }),
                },
            });

            if (!sub) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Subscription not found",
                });
            }

            if (input.teamSlug) {
                const team = await prisma.team.findUnique({
                    where: { slug: input.teamSlug },
                    select: { id: true },
                });
                if (!team) {
                    throw new TRPCError({
                        code: "NOT_FOUND",
                        message: "Team not found",
                    });
                }
                const membership = await prisma.teamMember.findUnique({
                    where: {
                        teamId_userId: { teamId: team.id, userId: session.user.id },
                    },
                    select: { id: true },
                });
                if (!membership) {
                    throw new TRPCError({
                        code: "FORBIDDEN",
                        message: "You do not have access to this team",
                    });
                }
                if (sub.teamId !== team.id) {
                    throw new TRPCError({
                        code: "FORBIDDEN",
                        message: "You do not have access to this subscription",
                    });
                }
            }

            let userName: string | null = null;
            if (sub.userId) {
                const u = await prisma.user.findUnique({
                    where: { id: sub.userId },
                    select: { name: true, email: true },
                });
                userName = u ? (u.name ?? u.email ?? null) : null;
            }

            return {
                ...mapSubscription(sub),
                product: sub.product,
                productPlan: sub.productPlan ?? null,
                team: sub.team ?? null,
                userName,
                ...((sub as any).renewals && { renewals: (sub as any).renewals }),
                ...((sub as any).commissionEntries && {
                    commissionEntries: (sub as any).commissionEntries.map(mapCommissionEntry),
                }),
            };
        }),

    /** Resolve product ID for "Domains" product (name contains "domain", case-insensitive). Used when creating domain subscriptions from portfolio. */
    getDomainsProductId: protectedProcedure.query(async () => {
        const product = await prisma.niscProduct.findFirst({
            where: {
                name: { contains: "domain", mode: "insensitive" },
                isActive: true,
            },
            select: { id: true },
        });
        return product?.id ?? null;
    }),

    /** Resolve product ID for domain transfer (serviceType domain_transfer). Used for transfer checkout → createFromPayment. */
    getTransferProductId: protectedProcedure.query(async () => {
        const product = await prisma.niscProduct.findFirst({
            where: {
                serviceType: "domain_transfer",
                isActive: true,
            },
            select: { id: true, name: true },
        });
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
            const sub = await prisma.niscClientSubscription.findFirst({
                where: { openProviderId: input.openProviderId },
            });
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
            const subs = await prisma.niscClientSubscription.findMany({
                where: { openProviderId: { in: input.openProviderIds } },
                select: { openProviderId: true },
            });
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
            const sub = await prisma.niscClientSubscription.findFirst({
                where: {
                    serviceRefs: { path: ["pleskSubscriptionId"], equals: idStr },
                },
                select: { id: true },
            });
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
            const subs = await prisma.niscClientSubscription.findMany({
                where: {
                    OR: idStrs.map((id) => ({
                        serviceRefs: { path: ["pleskSubscriptionId"], equals: id },
                    })),
                },
                select: { serviceRefs: true },
            });
            const found = new Set<string>();
            for (const sub of subs) {
                const refs = sub.serviceRefs as Record<string, unknown> | null;
                if (refs && typeof refs.pleskSubscriptionId === "string") {
                    found.add(refs.pleskSubscriptionId);
                }
            }
            return idStrs.filter((id) => found.has(id));
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

            // Verify product exists
            const product = await prisma.niscProduct.findUnique({
                where: { id: input.productId },
                include: { plans: { where: { id: input.productPlanId ?? "" } } },
            });
            if (!product) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
            }

            // If a plan is specified, verify it belongs to the product
            if (input.productPlanId) {
                const plan = await prisma.niscProductPlan.findFirst({
                    where: { id: input.productPlanId, productId: input.productId },
                });
                if (!plan) {
                    throw new TRPCError({
                        code: "NOT_FOUND",
                        message: "Plan not found or does not belong to the specified product",
                    });
                }
            }

            const sub = await prisma.niscClientSubscription.create({
                data: {
                    name: input.name ?? null,
                    userId: input.userId ?? null,
                    teamId: input.teamId ?? null,
                    productId: input.productId,
                    productPlanId: input.productPlanId ?? null,
                    orderId: input.orderId ?? null,
                    subscribedBy: input.subscribedBy ?? null,
                    recordedBy: input.recordedBy ?? session.user.id,
                    status: input.status as any,
                    subscriptionDate: input.subscriptionDate ?? null,
                    billingCycle: input.billingCycle ? (input.billingCycle as any) : null,
                    nextRenewalDate: input.nextRenewalDate ?? null,
                    expiryDate: input.expiryDate ?? null,
                    autoRenew: input.autoRenew,
                    pricingModel: input.pricingModel as any,
                    agreedPrice: input.agreedPrice ?? null,
                    agreedCurrency: input.agreedCurrency,
                    agreedCost: input.agreedCost ?? null,
                    agreedCostCurrency: input.agreedCostCurrency ?? null,
                    providerCost: input.providerCost ?? null,
                    providerCostCurrency: input.providerCostCurrency ?? null,
                    agreedCommissionRate: input.agreedCommissionRate ?? null,
                    agreedCommissionBase: input.agreedCommissionBase ?? null,
                    primaryDomain: input.primaryDomain ?? null,
                    pleskFilterId: input.pleskFilterId ?? null,
                    pleskOwnerId: input.pleskOwnerId ?? null,
                    pleskFtpLogin: input.pleskFtpLogin ?? null,
                    pleskFtpPassword: input.pleskFtpPassword ?? null,
                    hostingType: input.hostingType ? (input.hostingType as any) : null,
                    openProviderId: input.openProviderId ?? null,
                    domainAuthCode: input.domainAuthCode ?? null,
                    nameserverGroupId: input.nameserverGroupId ?? null,
                    wpInstallationId: input.wpInstallationId ?? null,
                    serviceRefs:
                        input.serviceRefs != null
                            ? (input.serviceRefs as Prisma.InputJsonValue)
                            : Prisma.JsonNull,
                    hostingSubscriptionId: input.hostingSubscriptionId ?? null,
                    notes: input.notes ?? null,
                    metadata:
                        input.metadata != null
                            ? (input.metadata as Prisma.InputJsonValue)
                            : Prisma.JsonNull,
                },
            });

            // Activity log
            await prisma.niscClientSubscriptionActivityLog.create({
                data: {
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
                },
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

            const existing = await prisma.niscClientSubscription.findUnique({
                where: { id: input.id },
            });
            if (!existing) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Subscription not found" });
            }

            const { id, ...rest } = input;
            const updated = await prisma.niscClientSubscription.update({
                where: { id },
                data: {
                    ...(rest.status !== undefined && { status: rest.status as any }),
                    ...(rest.subscriptionDate !== undefined && { subscriptionDate: rest.subscriptionDate }),
                    ...(rest.billingCycle !== undefined && { billingCycle: rest.billingCycle as any }),
                    ...(rest.nextRenewalDate !== undefined && { nextRenewalDate: rest.nextRenewalDate }),
                    ...(rest.expiryDate !== undefined && { expiryDate: rest.expiryDate }),
                    ...(rest.autoRenew !== undefined && { autoRenew: rest.autoRenew }),
                    ...(rest.agreedPrice !== undefined && { agreedPrice: rest.agreedPrice ?? null }),
                    ...(rest.agreedCurrency !== undefined && { agreedCurrency: rest.agreedCurrency }),
                    ...(rest.agreedCommissionRate !== undefined && {
                        agreedCommissionRate: rest.agreedCommissionRate ?? null,
                    }),
                    ...(rest.agreedCommissionBase !== undefined && {
                        agreedCommissionBase: rest.agreedCommissionBase ?? null,
                    }),
                    ...(rest.primaryDomain !== undefined && { primaryDomain: rest.primaryDomain ?? null }),
                    ...(rest.pleskFilterId !== undefined && { pleskFilterId: rest.pleskFilterId ?? null }),
                    ...(rest.pleskOwnerId !== undefined && { pleskOwnerId: rest.pleskOwnerId ?? null }),
                    ...(rest.pleskFtpLogin !== undefined && { pleskFtpLogin: rest.pleskFtpLogin ?? null }),
                    ...(rest.pleskFtpPassword !== undefined && {
                        pleskFtpPassword: rest.pleskFtpPassword ?? null,
                    }),
                    ...(rest.hostingType !== undefined && {
                        hostingType: rest.hostingType ? (rest.hostingType as any) : null,
                    }),
                    ...(rest.openProviderId !== undefined && { openProviderId: rest.openProviderId ?? null }),
                    ...(rest.domainAuthCode !== undefined && { domainAuthCode: rest.domainAuthCode ?? null }),
                    ...(rest.nameserverGroupId !== undefined && {
                        nameserverGroupId: rest.nameserverGroupId ?? null,
                    }),
                    ...(rest.wpInstallationId !== undefined && {
                        wpInstallationId: rest.wpInstallationId ?? null,
                    }),
                    ...(rest.serviceRefs !== undefined && {
                        serviceRefs:
                            rest.serviceRefs != null
                                ? (rest.serviceRefs as Prisma.InputJsonValue)
                                : Prisma.JsonNull,
                    }),
                    ...(rest.notes !== undefined && { notes: rest.notes ?? null }),
                    ...(rest.metadata !== undefined && {
                        metadata:
                            rest.metadata != null
                                ? (rest.metadata as Prisma.InputJsonValue)
                                : Prisma.JsonNull,
                    }),
                },
            });

            // Activity log
            await prisma.niscClientSubscriptionActivityLog.create({
                data: {
                    subscriptionId: id,
                    userId: session.user.id,
                    action: "UPDATE",
                    description: `Updated subscription`,
                    metadata: { previousStatus: existing.status, newStatus: rest.status ?? existing.status },
                },
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

            const existing = await prisma.niscClientSubscription.findUnique({
                where: { id: input.id },
            });
            if (!existing) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Subscription not found" });
            }
            if (existing.status === "CANCELLED") {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Subscription is already cancelled",
                });
            }

            const updated = await prisma.niscClientSubscription.update({
                where: { id: input.id },
                data: { status: "CANCELLED" },
            });

            await prisma.niscClientSubscriptionActivityLog.create({
                data: {
                    subscriptionId: input.id,
                    userId: session.user.id,
                    action: "CANCEL",
                    description: input.reason
                        ? `Cancelled subscription: ${input.reason}`
                        : "Cancelled subscription",
                    metadata: { previousStatus: existing.status, reason: input.reason ?? null },
                },
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

            const sub = await prisma.niscClientSubscription.findUnique({
                where: { id: input.subscriptionId },
                include: { product: { select: { name: true } }, productPlan: { select: { name: true } } },
            });
            if (!sub) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Subscription not found" });
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
                : "—";
            const expiryDateStr = sub.expiryDate ? new Date(sub.expiryDate).toLocaleDateString() : "—";

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

            await prisma.niscClientSubscriptionActivityLog.create({
                data: {
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
                },
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

            const existing = await prisma.niscClientSubscription.findUnique({
                where: { id: input.subscriptionId },
            });
            if (!existing) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Subscription not found" });
            }

            // Create the renewal record + update subscription dates in a transaction
            const [renewal, updatedSub] = await prisma.$transaction([
                prisma.niscClientSubscriptionRenewal.create({
                    data: {
                        subscriptionId: input.subscriptionId,
                        renewalType: input.renewalType as any,
                        renewedBy: input.renewedBy ?? session.user.id,
                        renewalDate: input.renewalDate,
                        newExpiryDate: input.newExpiryDate ?? null,
                        newNextRenewalDate: input.newNextRenewalDate ?? null,
                        billingCycle: input.billingCycle ? (input.billingCycle as any) : null,
                        status: input.status as any,
                        renewalPrice: input.renewalPrice ?? null,
                        renewalCurrency: input.renewalCurrency,
                        orderId: input.orderId ?? null,
                        notes: input.notes ?? null,
                    },
                }),
                prisma.niscClientSubscription.update({
                    where: { id: input.subscriptionId },
                    data: {
                        ...(input.newNextRenewalDate && { nextRenewalDate: input.newNextRenewalDate }),
                        ...(input.newExpiryDate && { expiryDate: input.newExpiryDate }),
                        status: "ACTIVE",
                    },
                }),
            ]);

            await prisma.niscClientSubscriptionActivityLog.create({
                data: {
                    subscriptionId: input.subscriptionId,
                    userId: session.user.id,
                    action: "RENEW",
                    description: `Renewed subscription (${input.renewalType})`,
                    metadata: {
                        renewalId: renewal.id,
                        renewalType: input.renewalType,
                        renewalDate: input.renewalDate,
                        newExpiryDate: input.newExpiryDate ?? null,
                    },
                },
            });

            return {
                renewalId: renewal.id,
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

            const sub = await prisma.niscClientSubscription.findUnique({
                where: { id: input.subscriptionId },
            });
            if (!sub) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Subscription not found" });
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

            // Compute commission: baseAmount × rate / 100
            const rate = Number(sub.agreedCommissionRate);
            const commissionAmount = (input.baseAmount * rate) / 100;

            // NiscCommissionEntry model may not exist in schema yet; cast to satisfy types until migration is added
            const entry = await (prisma as any).niscCommissionEntry.create({
                data: {
                    subscriptionId: input.subscriptionId,
                    productPlanId: sub.productPlanId,
                    teamId: sub.teamId ?? null,
                    period: input.period,
                    baseAmount: input.baseAmount,
                    baseAmountDescription: input.baseAmountDescription ?? null,
                    commissionRate: rate,
                    commissionAmount,
                    currency: input.currency,
                    status: "DRAFT",
                    notes: input.notes ?? null,
                    createdBy: session.user.id,
                },
            });

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

            const where: Record<string, unknown> = {};
            if (input?.subscriptionId !== undefined) where.subscriptionId = input.subscriptionId;
            if (input?.teamId !== undefined) where.teamId = input.teamId;
            if (input?.status !== undefined) where.status = input.status;

            if (input?.periodFrom || input?.periodTo) {
                where.period = {
                    ...(input.periodFrom && { gte: input.periodFrom }),
                    ...(input.periodTo && { lte: input.periodTo }),
                };
            }

            const entries = await (prisma as any).niscCommissionEntry.findMany({
                where,
                orderBy: { period: "desc" },
            });

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

            const existing = await (prisma as any).niscCommissionEntry.findUnique({
                where: { id: input.id },
            });
            if (!existing) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Commission entry not found" });
            }

            // Validate status transition
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

            const updated = await (prisma as any).niscCommissionEntry.update({
                where: { id: input.id },
                data: {
                    status: input.status as any,
                    ...(input.invoiceId !== undefined && { invoiceId: input.invoiceId ?? null }),
                    ...(input.notes !== undefined && { notes: input.notes ?? null }),
                },
            });

            return mapCommissionEntry(updated);
        }),

    /** List domain subscriptions for a user/team (product.serviceType === "domain_registration"). Used for domain dropdown in NISC orders. */
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

            const where: Prisma.NiscClientSubscriptionWhereInput = {
                product: {
                    OR: [
                        { serviceType: { contains: "domain", mode: "insensitive" } },
                        { name: { contains: "domain", mode: "insensitive" } },
                    ],
                },
            };
            if (input.userId != null) where.userId = input.userId;
            if (input.teamId != null) where.teamId = input.teamId;

            const subs = await prisma.niscClientSubscription.findMany({
                where,
                select: { id: true, name: true, primaryDomain: true },
                orderBy: { createdAt: "desc" },
            });

            return subs.map((s) => ({
                id: s.id,
                name: s.name ?? null,
                primaryDomain: s.primaryDomain ?? null,
            }));
        }),
});
