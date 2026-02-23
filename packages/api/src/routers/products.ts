import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../trpc";
import prisma, { Prisma } from "@nPanel/db";
import {
    getCached,
    setCached,
    invalidateProductsCache,
    listKey,
    idKey,
    addonsKey,
    hostingUpsellKey,
} from "../lib/products-cache";

// ============================================================================
// ZOD SCHEMAS — independent from the database schema layer
// ============================================================================

// --- Enum schemas ------------------------------------------------------------

const productCategorySchema = z.enum([
    "CLOUD",
    "MARKETING",
    "CONSULTING",
    "CUSTOM",
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

// --- Feature schemas ---------------------------------------------------------

// A single feature entry at the product level
const productFeatureSchema = z.object({
    key: z.string().min(1),
    label: z.string().min(1),
    description: z.string().optional(),
});

// A feature availability declaration at the plan level
const planFeatureSchema = z.object({
    key: z.string().min(1),
    available: z.boolean(),
    valueOverride: z.string().optional(), // e.g. "50GB" overrides product label
});

// --- Product schemas ---------------------------------------------------------

const createProductInputSchema = z.object({
    name: z.string().min(1).max(255),
    description: z.string().optional(),
    category: productCategorySchema,
    serviceType: z.string().min(1).max(100),
    isActive: z.boolean().default(true),
    sortOrder: z.number().int().default(0),
    features: z.array(productFeatureSchema).default([]),
    highlights: z.array(z.string()).default([]),
    metadata: z.record(z.unknown()).optional(),
});

const updateProductInputSchema = createProductInputSchema.partial().extend({
    id: z.string(),
});

const getProductsInputSchema = z.object({
    category: productCategorySchema.optional(),
    serviceType: z.string().optional(),
    isActive: z.boolean().optional(),
});

const getProductByIdInputSchema = z.object({
    id: z.string(),
    includePlans: z.boolean().default(false),
});

const deleteProductInputSchema = z.object({
    id: z.string(),
});

// --- Product output schemas --------------------------------------------------

const productOutputSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    category: productCategorySchema,
    serviceType: z.string(),
    isActive: z.boolean(),
    sortOrder: z.number(),
    features: z.array(z.unknown()),
    highlights: z.array(z.string()),
    metadata: z.unknown().nullable(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
});

// --- Product Plan schemas ----------------------------------------------------

const basePlanSchema = z.object({
    productId: z.string(),
    name: z.string().min(1).max(255),
    description: z.string().optional(),
    pricingModel: pricingModelSchema,

    // FIXED pricing
    billingCycle: billingCycleSchema.optional(),
    price: z.string().optional(),
    currency: z.string().default("KES"),
    setupFee: z.string().optional(),

    // COMMISSION pricing
    commissionRate: z.number().positive().optional(), // e.g. 11.0 = 11%
    commissionBase: z.string().optional(), // "ad_spend" | "gross_revenue" | etc.
    commissionBaseDescription: z.string().optional(),

    // Feature availability declarations.
    // Keys not included will be auto-filled with { available: false }.
    planFeatures: z.array(planFeatureSchema).default([]),

    highlights: z.array(z.string()).default([]),
    isPopular: z.boolean().default(false),
    isRecommended: z.boolean().default(false),
    isActive: z.boolean().default(true),
    isDefault: z.boolean().default(false),
    sortOrder: z.number().int().default(0),

    // Plesk / Hosting (CLOUD hosting plans only)
    pleskServicePlanId: z.string().optional(),
    pleskFilterId: z.string().optional(),
    pleskIpAddress: z.string().optional(),
    hostingType: hostingTypeSchema.optional(),

    metadata: z.record(z.unknown()).optional(),
});

const createPlanInputSchema = basePlanSchema.superRefine((data, ctx) => {
    if (data.pricingModel === "FIXED" && !data.billingCycle) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "billingCycle is required for FIXED pricing plans",
            path: ["billingCycle"],
        });
    }
    if (data.pricingModel === "COMMISSION" && data.commissionRate === undefined) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "commissionRate is required for COMMISSION pricing plans",
            path: ["commissionRate"],
        });
    }
    if (data.pricingModel === "COMMISSION" && !data.commissionBase) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "commissionBase is required for COMMISSION pricing plans",
            path: ["commissionBase"],
        });
    }
});

const updatePlanInputSchema = basePlanSchema.partial().extend({
    id: z.string(),
});

const getPlanByIdInputSchema = z.object({
    id: z.string(),
});

const deletePlanInputSchema = z.object({
    id: z.string(),
});

const planOutputSchema = z.object({
    id: z.string(),
    productId: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    pricingModel: pricingModelSchema,
    billingCycle: billingCycleSchema.nullable(),
    price: z.string().nullable(),
    currency: z.string().nullable(),
    setupFee: z.string().nullable(),
    commissionRate: z.unknown().nullable(),
    commissionBase: z.string().nullable(),
    commissionBaseDescription: z.string().nullable(),
    planFeatures: z.array(z.unknown()),
    highlights: z.array(z.string()),
    isPopular: z.boolean(),
    isRecommended: z.boolean(),
    isActive: z.boolean(),
    isDefault: z.boolean(),
    sortOrder: z.number(),
    pleskServicePlanId: z.string().nullable(),
    pleskFilterId: z.string().nullable(),
    pleskIpAddress: z.string().nullable(),
    hostingType: hostingTypeSchema.nullable(),
    metadata: z.unknown().nullable(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
});

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Given a product's feature list and the plan's declared planFeatures,
 * ensure every product feature key is present in the plan.
 * Any missing key is added with { available: false }.
 */
function normalisePlanFeatures(
    productFeatures: Array<{ key: string; label: string; description?: string }>,
    inputPlanFeatures: Array<{ key: string; available: boolean; valueOverride?: string }>,
): Array<{ key: string; available: boolean; valueOverride?: string }> {
    const declaredKeys = new Set(inputPlanFeatures.map((f) => f.key));
    const result = [...inputPlanFeatures];
    for (const pf of productFeatures) {
        if (!declaredKeys.has(pf.key)) {
            result.push({ key: pf.key, available: false });
        }
    }
    return result;
}

function mapPlan(plan: any): z.infer<typeof planOutputSchema> {
    return {
        id: plan.id,
        productId: plan.productId,
        name: plan.name,
        description: plan.description ?? null,
        pricingModel: plan.pricingModel,
        billingCycle: plan.billingCycle ?? null,
        price: plan.price ?? null,
        currency: plan.currency ?? "KES",
        setupFee: plan.setupFee ?? null,
        commissionRate: plan.commissionRate ?? null,
        commissionBase: plan.commissionBase ?? null,
        commissionBaseDescription: plan.commissionBaseDescription ?? null,
        planFeatures: plan.planFeatures ?? [],
        highlights: plan.highlights ?? [],
        isPopular: plan.isPopular,
        isRecommended: plan.isRecommended,
        isActive: plan.isActive,
        isDefault: plan.isDefault,
        sortOrder: plan.sortOrder,
        pleskServicePlanId: plan.pleskServicePlanId ?? null,
        pleskFilterId: plan.pleskFilterId ?? null,
        pleskIpAddress: plan.pleskIpAddress ?? null,
        hostingType: plan.hostingType ?? null,
        metadata: plan.metadata ?? null,
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt,
    };
}

function mapProduct(product: any): z.infer<typeof productOutputSchema> {
    return {
        id: product.id,
        name: product.name,
        description: product.description ?? null,
        category: product.category,
        serviceType: product.serviceType,
        isActive: product.isActive,
        sortOrder: product.sortOrder,
        features: product.features ?? [],
        highlights: product.highlights ?? [],
        metadata: product.metadata ?? null,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
    };
}

// ============================================================================
// ROUTER
// ============================================================================

export const productsRouter = router({
    // ── Products ─────────────────────────────────────────────────────────────

    /** List all products with optional filtering (cached via Upstash Redis) */
    getAll: protectedProcedure
        .input(getProductsInputSchema.optional())
        .output(z.array(productOutputSchema))
        .query(async ({ ctx, input }) => {
            const session = ctx.session;
            if (!session?.user?.id) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "You must be logged in to view products",
                });
            }

            const cacheInput = input ? { category: input.category, serviceType: input.serviceType, isActive: input.isActive } : undefined;
            const cached = await getCached<z.infer<typeof productOutputSchema>[]>(listKey(cacheInput));
            if (cached != null) return cached;

            const where: Record<string, unknown> = {};
            if (input?.category !== undefined) where.category = input.category;
            if (input?.serviceType !== undefined) where.serviceType = input.serviceType;
            if (input?.isActive !== undefined) where.isActive = input.isActive;

            const products = await prisma.niscProduct.findMany({
                where,
                orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
            });

            const result = products.map(mapProduct);
            await setCached(listKey(cacheInput), result);
            return result;
        }),

    /** Get a single product by ID, optionally including its plans (cached via Upstash Redis) */
    getById: protectedProcedure
        .input(getProductByIdInputSchema)
        .query(async ({ ctx, input }) => {
            const session = ctx.session;
            if (!session?.user?.id) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "You must be logged in to view products",
                });
            }

            const cached = await getCached<ReturnType<typeof mapProduct> & { plans?: ReturnType<typeof mapPlan>[] }>(idKey(input.id, input.includePlans));
            if (cached != null) return cached;

            const product = await prisma.niscProduct.findUnique({
                where: { id: input.id },
                include: input.includePlans
                    ? {
                        plans: {
                            where: { isActive: true },
                            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
                        },
                    }
                    : undefined,
            });

            if (!product) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Product not found",
                });
            }

            const result = {
                ...mapProduct(product),
                ...(input.includePlans && (product as any).plans
                    ? { plans: (product as any).plans.map(mapPlan) }
                    : {}),
            };
            await setCached(idKey(input.id, input.includePlans), result);
            return result;
        }),

    /** Get add-on products for a base product (cached via Upstash Redis) */
    getAddOnsForProduct: protectedProcedure
        .input(z.object({ baseProductId: z.string() }))
        .output(
            z.array(
                z.object({
                    product: productOutputSchema,
                    plans: z.array(z.unknown()),
                })
            )
        )
        .query(async ({ ctx, input }) => {
            const session = ctx.session;
            if (!session?.user?.id) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "You must be logged in to view products",
                });
            }
            const cached = await getCached<Array<{ product: z.infer<typeof productOutputSchema>; plans: unknown[] }>>(addonsKey(input.baseProductId));
            if (cached != null) return cached;

            const relations = await prisma.niscProductAddOn.findMany({
                where: { baseProductId: input.baseProductId },
                orderBy: { sortOrder: "asc" },
                include: {
                    addOnProduct: {
                        include: {
                            plans: {
                                where: { isActive: true },
                                orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
                            },
                        },
                    },
                },
            });
            const result = relations.map((r) => ({
                product: mapProduct(r.addOnProduct),
                plans: (r.addOnProduct as any).plans.map(mapPlan),
            }));
            await setCached(addonsKey(input.baseProductId), result);
            return result;
        }),

    /** Get products whose name contains "hosting" (cached via Upstash Redis) */
    getHostingProductsForUpsell: protectedProcedure
        .output(
            z.array(
                z.object({
                    product: productOutputSchema,
                    plans: z.array(z.unknown()),
                })
            )
        )
        .query(async ({ ctx }) => {
            const session = ctx.session;
            if (!session?.user?.id) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "You must be logged in to view products",
                });
            }
            const cached = await getCached<Array<{ product: z.infer<typeof productOutputSchema>; plans: unknown[] }>>(hostingUpsellKey());
            if (cached != null) return cached;

            const products = await prisma.niscProduct.findMany({
                where: {
                    isActive: true,
                    name: { contains: "hosting", mode: "insensitive" },
                },
                orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
                include: {
                    plans: {
                        where: { isActive: true },
                        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
                    },
                },
            });
            const result = products.map((p) => ({
                product: mapProduct(p),
                plans: (p as any).plans.map(mapPlan),
            }));
            await setCached(hostingUpsellKey(), result);
            return result;
        }),

    /** Create a new product */
    create: protectedProcedure
        .input(createProductInputSchema)
        .output(productOutputSchema)
        .mutation(async ({ ctx, input }) => {
            const session = ctx.session;
            if (!session?.user?.id) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "You must be logged in to create products",
                });
            }

            const product = await prisma.niscProduct.create({
                data: {
                    name: input.name,
                    description: input.description ?? null,
                    category: input.category as any,
                    serviceType: input.serviceType,
                    isActive: input.isActive,
                    sortOrder: input.sortOrder,
                    features: input.features as any[],
                    highlights: input.highlights,
                    metadata: input.metadata != null ? (input.metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
                },
            });

            await invalidateProductsCache();
            return mapProduct(product);
        }),

    /** Update an existing product */
    update: protectedProcedure
        .input(updateProductInputSchema)
        .output(productOutputSchema)
        .mutation(async ({ ctx, input }) => {
            const session = ctx.session;
            if (!session?.user?.id) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "You must be logged in to update products",
                });
            }

            const existing = await prisma.niscProduct.findUnique({
                where: { id: input.id },
            });
            if (!existing) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
            }

            const { id, ...rest } = input;
            const updated = await prisma.niscProduct.update({
                where: { id },
                data: {
                    ...(rest.name !== undefined && { name: rest.name }),
                    ...(rest.description !== undefined && { description: rest.description ?? null }),
                    ...(rest.category !== undefined && { category: rest.category as any }),
                    ...(rest.serviceType !== undefined && { serviceType: rest.serviceType }),
                    ...(rest.isActive !== undefined && { isActive: rest.isActive }),
                    ...(rest.sortOrder !== undefined && { sortOrder: rest.sortOrder }),
                    ...(rest.features !== undefined && { features: rest.features as any[] }),
                    ...(rest.highlights !== undefined && { highlights: rest.highlights }),
                    ...(rest.metadata !== undefined && {
                        metadata:
                            rest.metadata != null
                                ? (rest.metadata as Prisma.InputJsonValue)
                                : Prisma.JsonNull,
                    }),
                },
            });

            await invalidateProductsCache();
            return mapProduct(updated);
        }),

    /** Permanently delete a product from the database. Only allowed when product is inactive and has no subscriptions. */
    delete: protectedProcedure
        .input(deleteProductInputSchema)
        .output(z.object({ success: z.boolean() }))
        .mutation(async ({ ctx, input }) => {
            const session = ctx.session;
            if (!session?.user?.id) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "You must be logged in to delete products",
                });
            }

            const existing = await prisma.niscProduct.findUnique({
                where: { id: input.id },
                include: { _count: { select: { subscriptions: true } } },
            });
            if (!existing) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
            }
            if (existing.isActive) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Deactivate the product before deleting it",
                });
            }
            if (existing._count.subscriptions > 0) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Cannot delete product that has client subscriptions",
                });
            }

            await prisma.niscProduct.delete({
                where: { id: input.id },
            });

            await invalidateProductsCache();
            return { success: true };
        }),

    /** Get default (or first) active plan ID for a product. Used when creating orders from payment (e.g. domain registration). */
    getDefaultPlanIdForProduct: protectedProcedure
        .input(z.object({ productId: z.string() }))
        .output(z.string().nullable())
        .query(async ({ ctx, input }) => {
            const session = ctx.session;
            if (!session?.user?.id) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "You must be logged in to view products",
                });
            }
            const plan = await prisma.niscProductPlan.findFirst({
                where: {
                    productId: input.productId,
                    isActive: true,
                },
                orderBy: [
                    { isDefault: "desc" }, // default first
                    { sortOrder: "asc" },
                    { createdAt: "asc" },
                ],
                select: { id: true },
            });
            return plan?.id ?? null;
        }),

    // ── Product Plans ─────────────────────────────────────────────────────────

    /** Get a single plan by ID */
    getPlanById: protectedProcedure
        .input(getPlanByIdInputSchema)
        .output(planOutputSchema)
        .query(async ({ ctx, input }) => {
            const session = ctx.session;
            if (!session?.user?.id) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "You must be logged in to view plans",
                });
            }

            const plan = await prisma.niscProductPlan.findUnique({
                where: { id: input.id },
            });
            if (!plan) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Plan not found" });
            }

            return mapPlan(plan);
        }),

    /** Create a new plan within a product */
    createPlan: protectedProcedure
        .input(createPlanInputSchema)
        .output(planOutputSchema)
        .mutation(async ({ ctx, input }) => {
            const session = ctx.session;
            if (!session?.user?.id) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "You must be logged in to create plans",
                });
            }

            // Ensure product exists and fetch its feature master list
            const product = await prisma.niscProduct.findUnique({
                where: { id: input.productId },
            });
            if (!product) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
            }

            // Normalise planFeatures: auto-fill missing keys with available=false
            const normalisedFeatures = normalisePlanFeatures(
                product.features as Array<{ key: string; label: string; description?: string }>,
                input.planFeatures,
            );

            const plan = await prisma.niscProductPlan.create({
                data: {
                    productId: input.productId,
                    name: input.name,
                    description: input.description ?? null,
                    pricingModel: input.pricingModel as any,
                    billingCycle: input.pricingModel === "FIXED" ? (input.billingCycle as any) : null,
                    price: input.pricingModel === "FIXED" ? (input.price ?? null) : null,
                    currency: input.currency,
                    setupFee: input.pricingModel === "FIXED" ? (input.setupFee ?? null) : null,
                    commissionRate:
                        input.pricingModel === "COMMISSION" && input.commissionRate !== undefined
                            ? input.commissionRate
                            : null,
                    commissionBase: input.pricingModel === "COMMISSION" ? (input.commissionBase ?? null) : null,
                    commissionBaseDescription:
                        input.pricingModel === "COMMISSION"
                            ? (input.commissionBaseDescription ?? null)
                            : null,
                    planFeatures: normalisedFeatures as any[],
                    highlights: input.highlights,
                    isPopular: input.isPopular,
                    isRecommended: input.isRecommended,
                    isActive: input.isActive,
                    isDefault: input.isDefault,
                    sortOrder: input.sortOrder,
                    pleskServicePlanId: input.pleskServicePlanId ?? null,
                    pleskFilterId: input.pleskFilterId ?? null,
                    pleskIpAddress: input.pleskIpAddress ?? null,
                    hostingType: input.hostingType ? (input.hostingType as any) : null,
                    metadata: input.metadata != null ? (input.metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
                },
            });

            await invalidateProductsCache();
            return mapPlan(plan);
        }),

    /** Update an existing plan */
    updatePlan: protectedProcedure
        .input(updatePlanInputSchema)
        .output(planOutputSchema)
        .mutation(async ({ ctx, input }) => {
            const session = ctx.session;
            if (!session?.user?.id) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "You must be logged in to update plans",
                });
            }

            const existing = await prisma.niscProductPlan.findUnique({
                where: { id: input.id },
                include: { product: true },
            });
            if (!existing) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Plan not found" });
            }

            // If planFeatures are being updated, re-normalise them
            let normalisedFeatures: Array<{ key: string; available: boolean; valueOverride?: string }> | undefined;
            if (input.planFeatures !== undefined) {
                normalisedFeatures = normalisePlanFeatures(
                    existing.product.features as Array<{ key: string; label: string; description?: string }>,
                    input.planFeatures,
                );
            }

            const effectivePricingModel = input.pricingModel ?? existing.pricingModel;

            const updated = await prisma.niscProductPlan.update({
                where: { id: input.id },
                data: {
                    ...(input.name !== undefined && { name: input.name }),
                    ...(input.description !== undefined && { description: input.description ?? null }),
                    ...(input.pricingModel !== undefined && { pricingModel: input.pricingModel as any }),
                    ...(input.billingCycle !== undefined && {
                        billingCycle: effectivePricingModel === "FIXED" ? (input.billingCycle as any) : null,
                    }),
                    ...(input.price !== undefined && {
                        price: effectivePricingModel === "FIXED" ? (input.price ?? null) : null,
                    }),
                    ...(input.currency !== undefined && { currency: input.currency }),
                    ...(input.setupFee !== undefined && {
                        setupFee: effectivePricingModel === "FIXED" ? (input.setupFee ?? null) : null,
                    }),
                    ...(input.commissionRate !== undefined && {
                        commissionRate: effectivePricingModel === "COMMISSION" ? input.commissionRate : null,
                    }),
                    ...(input.commissionBase !== undefined && {
                        commissionBase: effectivePricingModel === "COMMISSION" ? (input.commissionBase ?? null) : null,
                    }),
                    ...(input.commissionBaseDescription !== undefined && {
                        commissionBaseDescription:
                            effectivePricingModel === "COMMISSION"
                                ? (input.commissionBaseDescription ?? null)
                                : null,
                    }),
                    ...(normalisedFeatures !== undefined && { planFeatures: normalisedFeatures as any[] }),
                    ...(input.highlights !== undefined && { highlights: input.highlights }),
                    ...(input.isPopular !== undefined && { isPopular: input.isPopular }),
                    ...(input.isRecommended !== undefined && { isRecommended: input.isRecommended }),
                    ...(input.isActive !== undefined && { isActive: input.isActive }),
                    ...(input.isDefault !== undefined && { isDefault: input.isDefault }),
                    ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
                    ...(input.pleskServicePlanId !== undefined && {
                        pleskServicePlanId: input.pleskServicePlanId ?? null,
                    }),
                    ...(input.pleskFilterId !== undefined && { pleskFilterId: input.pleskFilterId ?? null }),
                    ...(input.pleskIpAddress !== undefined && { pleskIpAddress: input.pleskIpAddress ?? null }),
                    ...(input.hostingType !== undefined && {
                        hostingType: input.hostingType ? (input.hostingType as any) : null,
                    }),
                    ...(input.metadata !== undefined && {
                        metadata:
                            input.metadata != null
                                ? (input.metadata as Prisma.InputJsonValue)
                                : Prisma.JsonNull,
                    }),
                },
            });

            await invalidateProductsCache();
            return mapPlan(updated);
        }),

    /** Soft-delete a plan (set isActive = false) */
    deletePlan: protectedProcedure
        .input(deletePlanInputSchema)
        .output(z.object({ success: z.boolean() }))
        .mutation(async ({ ctx, input }) => {
            const session = ctx.session;
            if (!session?.user?.id) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "You must be logged in to delete plans",
                });
            }

            const existing = await prisma.niscProductPlan.findUnique({
                where: { id: input.id },
            });
            if (!existing) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Plan not found" });
            }

            await prisma.niscProductPlan.update({
                where: { id: input.id },
                data: { isActive: false },
            });

            await invalidateProductsCache();
            return { success: true };
        }),
});
