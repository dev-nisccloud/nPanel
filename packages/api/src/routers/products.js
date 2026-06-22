import { randomUUID } from "node:crypto";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, asc, count, desc, eq, ilike, or } from "@npanel/db";
import { db } from "@npanel/db";
import { niscOrderItem } from "@npanel/db/schema/nisc-orders";
import { niscClientSubscription, niscProduct, niscProductAddOn, niscProductPlan, niscProductPlanUsage, } from "@npanel/db/schema/products";
import { protectedProcedure, publicProcedure, router } from "../trpc";
import { getCached, setCached, invalidateProductsCache, listKey, idKey, addonsKey, hostingUpsellKey, digitalMarketingUpsellKey, } from "../lib/products-cache";
import { CREATIVES_DESIGN_PRODUCT_ID } from "../lib/creatives-design-billing";
import { NISC_SEO_REPORTS_PRODUCT_ID, SEO_PRODUCT_FEATURES } from "../lib/seo-reports-billing";
import { NISC_MEDIA_BUYING_PRODUCT_ID } from "../lib/media-buying-billing";
import { getEtimsContext } from "../lib/etims-config";
import { eTimsItem } from "@npanel/db/schema/etims";
// ============================================================================
// ZOD SCHEMAS   independent from the database schema layer
// ============================================================================
// --- Enum schemas ------------------------------------------------------------
const productCategorySchema = z.enum([
    "CLOUD",
    "MARKETING",
    "CONSULTING",
    "CUSTOM",
    "AI",
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
const etimsTaxTyCdSchema = z.enum(["A", "B", "C", "D", "E"]);
const productEtimsFieldsSchema = z.object({
    etimsItemCd: z.string().max(20).nullable().optional(),
    etimsItemClsCd: z.string().max(10).nullable().optional(),
    etimsTaxTyCd: etimsTaxTyCdSchema.nullable().optional(),
    etimsDefaultPrice: z.string().nullable().optional(),
    etimsPkgUnitCd: z.string().max(5).nullable().optional(),
    etimsQtyUnitCd: z.string().max(5).nullable().optional(),
});
const createProductInputSchema = z.object({
    name: z.string().min(1).max(255),
    description: z.string().optional(),
    category: productCategorySchema,
    serviceType: z.string().min(1).max(100),
    isActive: z.boolean().default(true),
    sortOrder: z.number().int().default(0),
    features: z.array(productFeatureSchema).default([]),
    highlights: z.array(z.string()).default([]),
    metadata: z.record(z.string(), z.unknown()).optional(),
}).merge(productEtimsFieldsSchema);
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
    etimsItemCd: z.string().nullable(),
    etimsItemClsCd: z.string().nullable(),
    etimsTaxTyCd: etimsTaxTyCdSchema.nullable(),
    etimsDefaultPrice: z.string().nullable(),
    etimsPkgUnitCd: z.string().nullable(),
    etimsQtyUnitCd: z.string().nullable(),
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
    metadata: z.record(z.string(), z.unknown()).optional(),
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
// --- Product Plan Usage schemas (independent from DB enums) ------------------
const usageOveruseSchema = z.enum(["HARD", "SOFT"]);
const createPlanUsageInputSchema = z.object({
    productId: z.string().min(1),
    productPlanId: z.string().min(1),
    userId: z.string().optional(),
    teamId: z.string().optional(),
    usageKind: z.string().min(1).max(100),
    limitValue: z.string().min(1),
    overuse: usageOveruseSchema,
    period: z.string().max(50).optional(),
});
const updatePlanUsageInputSchema = z.object({
    id: z.string(),
    userId: z.string().optional().nullable(),
    teamId: z.string().optional().nullable(),
    usageKind: z.string().min(1).max(100).optional(),
    limitValue: z.string().min(1).optional(),
    overuse: usageOveruseSchema.optional(),
    period: z.string().max(50).optional().nullable(),
});
const listPlanUsagesInputSchema = z.object({
    productId: z.string().optional(),
    productPlanId: z.string().optional(),
    usageKind: z.string().optional(),
});
const planUsageOutputSchema = z.object({
    id: z.string(),
    productId: z.string(),
    productPlanId: z.string(),
    userId: z.string().nullable(),
    teamId: z.string().nullable(),
    usageKind: z.string(),
    limitValue: z.string(),
    overuse: usageOveruseSchema,
    period: z.string().nullable(),
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
function normalisePlanFeatures(productFeatures, inputPlanFeatures) {
    const declaredKeys = new Set(inputPlanFeatures.map((f) => f.key));
    const result = [...inputPlanFeatures];
    for (const pf of productFeatures) {
        if (!declaredKeys.has(pf.key)) {
            result.push({ key: pf.key, available: false });
        }
    }
    return result;
}
function mapPlan(plan) {
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
function normalizeProductCategory(category) {
    const upper = category.toUpperCase();
    if (productCategorySchema.safeParse(upper).success) {
        return upper;
    }
    const aliases = {
        Marketing: "MARKETING",
        Creative: "CUSTOM",
        Cloud: "CLOUD",
        Consulting: "CONSULTING",
        Custom: "CUSTOM",
        Ai: "AI",
    };
    return aliases[category] ?? "CUSTOM";
}
function mapProduct(product) {
    return {
        id: product.id,
        name: product.name,
        description: product.description ?? null,
        category: normalizeProductCategory(product.category),
        serviceType: product.serviceType,
        isActive: product.isActive,
        sortOrder: product.sortOrder,
        features: product.features ?? [],
        highlights: product.highlights ?? [],
        metadata: product.metadata ?? null,
        etimsItemCd: product.etimsItemCd ?? null,
        etimsItemClsCd: product.etimsItemClsCd ?? null,
        etimsTaxTyCd: product.etimsTaxTyCd ?? null,
        etimsDefaultPrice: product.etimsDefaultPrice ?? null,
        etimsPkgUnitCd: product.etimsPkgUnitCd ?? null,
        etimsQtyUnitCd: product.etimsQtyUnitCd ?? null,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
    };
}
function mapPlanUsage(row) {
    return {
        id: row.id,
        productId: row.productId,
        productPlanId: row.productPlanId,
        userId: row.userId ?? null,
        teamId: row.teamId ?? null,
        usageKind: row.usageKind,
        limitValue: row.limitValue,
        overuse: row.overuse,
        period: row.period ?? null,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
    };
}
/** Map marketplace slug to product name search terms (case-insensitive contains). Enables flexible matching e.g. website-hosting → "website hosting", "web hosting". */
function getSearchTermsForMarketplaceSlug(slug) {
    const normalized = slug.trim().toLowerCase();
    const bySlug = {
        "business-email": ["business email", "email hosting", "professional email"],
        "email-marketing": ["email marketing", "newsletter", "email campaigns"],
        "website-hosting": ["website hosting", "web hosting", "web host"],
        "vps-hosting": ["vps hosting", "vps", "virtual private server"],
        "background-remover": ["background remover", "background removal", "bg remove"],
        "ai-image-generator": ["ai image", "image generator", "ai image generator"],
        "creatives-design": ["creatives", "design", "creative assets", "creatives & design"],
        "seo": ["seo", "search engine", "search engine optimization"],
        "media-buying": ["media buying", "ad campaigns", "ads", "meta ads", "google ads"],
    };
    const terms = bySlug[normalized];
    if (terms?.length)
        return terms;
    return [normalized.replace(/-/g, " ")];
}
function isAgencyUserRole(role) {
    return role === "AGENCY_USER" || role === "AGENCY_ADMIN" || role === "AGENCY_SUPER_ADMIN";
}
function isAgencySuperAdminRole(role) {
    return role === "AGENCY_SUPER_ADMIN";
}
function getAuthenticatedActor(ctx) {
    const user = ctx.session?.user;
    if (!user?.id) {
        throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "You must be logged in",
        });
    }
    return { userId: user.id, role: user.role ?? null };
}
function assertAgencyReadAccess(role) {
    if (!isAgencyUserRole(role)) {
        throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only agency users can access this resource",
        });
    }
}
function assertAgencySuperAdminMutationAccess(role) {
    if (!isAgencySuperAdminRole(role)) {
        throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only agency super admins can modify this resource",
        });
    }
}
// ============================================================================
// ROUTER
// ============================================================================
export const productsRouter = router({
    // ── Products ─────────────────────────────────────────────────────────────
    /** List all products with optional filtering (cached via Upstash Redis). Public catalog read. */
    getAll: publicProcedure
        .input(getProductsInputSchema.optional())
        .output(z.array(productOutputSchema))
        .query(async ({ input }) => {
        const cacheInput = input ? { category: input.category, serviceType: input.serviceType, isActive: input.isActive } : undefined;
        const cached = await getCached(listKey(cacheInput));
        if (cached != null)
            return cached;
        const conditions = [];
        if (input?.category !== undefined) {
            conditions.push(eq(niscProduct.category, input.category));
        }
        if (input?.serviceType !== undefined) {
            conditions.push(eq(niscProduct.serviceType, input.serviceType));
        }
        if (input?.isActive !== undefined) {
            conditions.push(eq(niscProduct.isActive, input.isActive));
        }
        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
        const products = await db.query.niscProduct.findMany({
            where: whereClause,
            orderBy: (p, { asc: a, desc: d }) => [a(p.sortOrder), d(p.createdAt)],
        });
        const result = products.map(mapProduct);
        await setCached(listKey(cacheInput), result);
        return result;
    }),
    /** Get a single product by ID, optionally including its plans (cached via Upstash Redis) */
    getById: protectedProcedure
        .input(getProductByIdInputSchema)
        .query(async ({ ctx, input }) => {
        const actor = getAuthenticatedActor(ctx);
        assertAgencyReadAccess(actor.role);
        const cached = await getCached(idKey(input.id, input.includePlans));
        if (cached != null)
            return cached;
        const product = await db.query.niscProduct.findFirst({
            where: eq(niscProduct.id, input.id),
            ...(input.includePlans && {
                with: {
                    plans: {
                        where: eq(niscProductPlan.isActive, true),
                        orderBy: (plan, { asc: a }) => [
                            a(plan.sortOrder),
                            a(plan.createdAt),
                        ],
                    },
                },
            }),
        });
        if (!product) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Product not found",
            });
        }
        const result = {
            ...mapProduct(product),
            ...(input.includePlans && product.plans
                ? { plans: product.plans.map(mapPlan) }
                : {}),
        };
        await setCached(idKey(input.id, input.includePlans), result);
        return result;
    }),
    /** Get add-on products for a base product (cached via Upstash Redis) */
    getAddOnsForProduct: protectedProcedure
        .input(z.object({ baseProductId: z.string() }))
        .output(z.array(z.object({
        product: productOutputSchema,
        plans: z.array(z.unknown()),
    })))
        .query(async ({ ctx, input }) => {
        const actor = getAuthenticatedActor(ctx);
        assertAgencyReadAccess(actor.role);
        const cached = await getCached(addonsKey(input.baseProductId));
        if (cached != null)
            return cached;
        const relations = await db.query.niscProductAddOn.findMany({
            where: eq(niscProductAddOn.baseProductId, input.baseProductId),
            orderBy: asc(niscProductAddOn.sortOrder),
            with: {
                addOnProduct: {
                    with: {
                        plans: {
                            where: eq(niscProductPlan.isActive, true),
                            orderBy: (plan, { asc: a }) => [
                                a(plan.sortOrder),
                                a(plan.createdAt),
                            ],
                        },
                    },
                },
            },
        });
        const result = relations.map((r) => ({
            product: mapProduct(r.addOnProduct),
            plans: r.addOnProduct.plans.map(mapPlan),
        }));
        await setCached(addonsKey(input.baseProductId), result);
        return result;
    }),
    /** Get products whose name contains "hosting" (cached via Upstash Redis) */
    getHostingProductsForUpsell: protectedProcedure
        .output(z.array(z.object({
        product: productOutputSchema,
        plans: z.array(z.unknown()),
    })))
        .query(async ({ ctx }) => {
        const actor = getAuthenticatedActor(ctx);
        assertAgencyReadAccess(actor.role);
        const cached = await getCached(hostingUpsellKey());
        if (cached != null)
            return cached;
        const products = await db.query.niscProduct.findMany({
            where: and(eq(niscProduct.isActive, true), or(ilike(niscProduct.name, "%web hosting%"), ilike(niscProduct.name, "%website hosting%"), ilike(niscProduct.name, "%email hosting%"))),
            orderBy: (p, { asc: a, desc: d }) => [a(p.sortOrder), d(p.createdAt)],
            with: {
                plans: {
                    where: eq(niscProductPlan.isActive, true),
                    orderBy: (plan, { asc: a }) => [
                        a(plan.sortOrder),
                        a(plan.createdAt),
                    ],
                },
            },
        });
        const result = products.map((p) => ({
            product: mapProduct(p),
            plans: p.plans.map(mapPlan),
        }));
        await setCached(hostingUpsellKey(), result);
        return result;
    }),
    /** Get plans for pricing table from products named "web hosting" or "website hosting" (case-insensitive). Returns product-level feature list (table rows) and plans with per-feature values (enabled + valueOverride exactly as stored, no number conversion). */
    getHostingPlansForPricing: publicProcedure
        .output(z.object({
        productFeatures: z.array(z.object({ key: z.string(), label: z.string(), description: z.string().optional() })),
        plans: z.array(z.object({
            id: z.string(),
            name: z.string(),
            niscPrice: z.string().nullable(),
            niscCurrency: z.string(),
            billingCycle: z.string(),
            isPopular: z.boolean(),
            isRecommended: z.boolean(),
            productId: z.string(),
            productName: z.string(),
            featureValues: z.array(z.object({
                available: z.boolean(),
                valueOverride: z.string().nullable(),
            })),
        })),
    }))
        .query(async () => {
        const products = await db.query.niscProduct.findMany({
            where: and(eq(niscProduct.isActive, true), or(ilike(niscProduct.name, "%web hosting%"), ilike(niscProduct.name, "%website hosting%"))),
            orderBy: (p, { asc: a, desc: d }) => [a(p.sortOrder), d(p.createdAt)],
            with: {
                plans: {
                    where: and(eq(niscProductPlan.isActive, true), eq(niscProductPlan.pricingModel, "FIXED")),
                    orderBy: (plan, { asc: a }) => [
                        a(plan.sortOrder),
                        a(plan.createdAt),
                    ],
                },
            },
        });
        // Master feature list from products (first product's order, then any keys from other products)
        const seenKeys = new Set();
        const productFeatures = [];
        for (const p of products) {
            const features = p.features ?? [];
            for (const f of features) {
                if (!seenKeys.has(f.key)) {
                    seenKeys.add(f.key);
                    productFeatures.push({ key: f.key, label: f.label, description: f.description });
                }
            }
        }
        const plans = [];
        for (const product of products) {
            for (const plan of product.plans ?? []) {
                const planFeats = plan.planFeatures ?? [];
                const planFeatsByKey = new Map(planFeats.map((f) => [f.key, f]));
                // One cell per productFeatures row: from plan we use enabled + valueOverride (exact, no conversion)
                const featureValues = productFeatures.map((pf) => {
                    const entry = planFeatsByKey.get(pf.key);
                    const available = !!entry?.available;
                    const valueOverride = entry?.valueOverride != null && entry.valueOverride !== ""
                        ? String(entry.valueOverride)
                        : null;
                    return { available, valueOverride };
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
        return { productFeatures, plans };
    }),
    /** Get plans for pricing table from products named "email hosting" (case-insensitive). Same shape as getHostingPlansForPricing. */
    getEmailHostingPlansForPricing: publicProcedure
        .output(z.object({
        productFeatures: z.array(z.object({ key: z.string(), label: z.string(), description: z.string().optional() })),
        plans: z.array(z.object({
            id: z.string(),
            name: z.string(),
            niscPrice: z.string().nullable(),
            niscCurrency: z.string(),
            billingCycle: z.string(),
            isPopular: z.boolean(),
            isRecommended: z.boolean(),
            productId: z.string(),
            productName: z.string(),
            featureValues: z.array(z.object({
                available: z.boolean(),
                valueOverride: z.string().nullable(),
            })),
        })),
    }))
        .query(async () => {
        const products = await db.query.niscProduct.findMany({
            where: and(eq(niscProduct.isActive, true), ilike(niscProduct.name, "%email hosting%")),
            orderBy: (p, { asc: a, desc: d }) => [a(p.sortOrder), d(p.createdAt)],
            with: {
                plans: {
                    where: and(eq(niscProductPlan.isActive, true), eq(niscProductPlan.pricingModel, "FIXED")),
                    orderBy: (plan, { asc: a }) => [
                        a(plan.sortOrder),
                        a(plan.createdAt),
                    ],
                },
            },
        });
        const seenKeys = new Set();
        const productFeatures = [];
        for (const p of products) {
            const features = p.features ?? [];
            for (const f of features) {
                if (!seenKeys.has(f.key)) {
                    seenKeys.add(f.key);
                    productFeatures.push({ key: f.key, label: f.label, description: f.description });
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
                    const available = !!entry?.available;
                    const valueOverride = entry?.valueOverride != null && entry.valueOverride !== ""
                        ? String(entry.valueOverride)
                        : null;
                    return { available, valueOverride };
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
        return { productFeatures, plans };
    }),
    /** Get plans for pricing table from products named "wordpress hosting" or "wordpress managed" (case-insensitive). Same shape as getHostingPlansForPricing. */
    getWordPressPlansForPricing: publicProcedure
        .output(z.object({
        productFeatures: z.array(z.object({ key: z.string(), label: z.string(), description: z.string().optional() })),
        plans: z.array(z.object({
            id: z.string(),
            name: z.string(),
            niscPrice: z.string().nullable(),
            niscCurrency: z.string(),
            billingCycle: z.string(),
            isPopular: z.boolean(),
            isRecommended: z.boolean(),
            productId: z.string(),
            productName: z.string(),
            featureValues: z.array(z.object({
                available: z.boolean(),
                valueOverride: z.string().nullable(),
            })),
        })),
    }))
        .query(async () => {
        const products = await db.query.niscProduct.findMany({
            where: and(eq(niscProduct.isActive, true), or(ilike(niscProduct.name, "%wordpress hosting%"), ilike(niscProduct.name, "%wordpress managed%"))),
            orderBy: (p, { asc: a, desc: d }) => [a(p.sortOrder), d(p.createdAt)],
            with: {
                plans: {
                    where: and(eq(niscProductPlan.isActive, true), eq(niscProductPlan.pricingModel, "FIXED")),
                    orderBy: (plan, { asc: a }) => [
                        a(plan.sortOrder),
                        a(plan.createdAt),
                    ],
                },
            },
        });
        const seenKeys = new Set();
        const productFeatures = [];
        for (const p of products) {
            const features = p.features ?? [];
            for (const f of features) {
                if (!seenKeys.has(f.key)) {
                    seenKeys.add(f.key);
                    productFeatures.push({ key: f.key, label: f.label, description: f.description });
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
                    const available = !!entry?.available;
                    const valueOverride = entry?.valueOverride != null && entry.valueOverride !== ""
                        ? String(entry.valueOverride)
                        : null;
                    return { available, valueOverride };
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
        return { productFeatures, plans };
    }),
    /**
     * Digital marketing upsell catalog (category MARKETING) for domain checkout.
     * Returns each active product with fixed-price plans; excludes add-ons.
     */
    getDigitalMarketingPlansForUpsell: publicProcedure
        .output(z.object({
        productFeatures: z.array(z.object({ key: z.string(), label: z.string(), description: z.string().optional() })),
        products: z.array(z.object({
            id: z.string(),
            name: z.string(),
            description: z.string().nullable(),
            plans: z.array(z.object({
                id: z.string(),
                name: z.string(),
                niscPrice: z.string().nullable(),
                niscCurrency: z.string(),
                billingCycle: z.string(),
                isPopular: z.boolean(),
                isRecommended: z.boolean(),
                productId: z.string(),
                productName: z.string(),
                featureValues: z.array(z.object({
                    available: z.boolean(),
                    valueOverride: z.string().nullable(),
                })),
            })),
        })),
    }))
        .query(async () => {
        const cached = await getCached(digitalMarketingUpsellKey());
        if (cached != null)
            return cached;
        const products = await db.query.niscProduct.findMany({
            where: and(eq(niscProduct.isActive, true), eq(niscProduct.category, "MARKETING"), eq(niscProduct.isAddOn, false)),
            orderBy: (p, { asc: a, desc: d }) => [a(p.sortOrder), d(p.createdAt)],
            with: {
                plans: {
                    where: and(eq(niscProductPlan.isActive, true), eq(niscProductPlan.pricingModel, "FIXED")),
                    orderBy: (plan, { asc: a }) => [a(plan.sortOrder), a(plan.createdAt)],
                },
            },
        });
        const seenKeys = new Set();
        const productFeatures = [];
        for (const p of products) {
            const features = p.features ?? [];
            for (const f of features) {
                if (!seenKeys.has(f.key)) {
                    seenKeys.add(f.key);
                    productFeatures.push({ key: f.key, label: f.label, description: f.description });
                }
            }
        }
        const catalogProducts = [];
        for (const product of products) {
            const productPlans = [];
            for (const plan of product.plans ?? []) {
                const planRow = plan;
                const planFeats = planRow.planFeatures ?? [];
                const planFeatsByKey = new Map(planFeats.map((f) => [f.key, f]));
                const featureValues = productFeatures.map((pf) => {
                    const entry = planFeatsByKey.get(pf.key);
                    const available = !!entry?.available;
                    const valueOverride = entry?.valueOverride != null && entry.valueOverride !== ""
                        ? String(entry.valueOverride)
                        : null;
                    return { available, valueOverride };
                });
                productPlans.push({
                    id: planRow.id,
                    name: planRow.name,
                    niscPrice: planRow.price ?? null,
                    niscCurrency: planRow.currency ?? "KES",
                    billingCycle: planRow.billingCycle ?? "MONTHLY",
                    isPopular: planRow.isPopular ?? false,
                    isRecommended: planRow.isRecommended ?? false,
                    productId: product.id,
                    productName: product.name,
                    featureValues,
                });
            }
            if (productPlans.length > 0) {
                catalogProducts.push({
                    id: product.id,
                    name: product.name,
                    description: product.description ?? null,
                    plans: productPlans,
                });
            }
        }
        const result = { productFeatures, products: catalogProducts };
        await setCached(digitalMarketingUpsellKey(), result);
        return result;
    }),
    /** Plans for SEO customer pricing table. Matches products whose name contains "seo" (case-insensitive). Same shape as getHostingPlansForPricing. */
    getSeoPlansForPricing: publicProcedure
        .output(z.object({
        productFeatures: z.array(z.object({ key: z.string(), label: z.string(), description: z.string().optional() })),
        plans: z.array(z.object({
            id: z.string(),
            name: z.string(),
            niscPrice: z.string().nullable(),
            niscCurrency: z.string(),
            billingCycle: z.string(),
            isPopular: z.boolean(),
            isRecommended: z.boolean(),
            productId: z.string(),
            productName: z.string(),
            featureValues: z.array(z.object({
                available: z.boolean(),
                valueOverride: z.string().nullable(),
            })),
        })),
    }))
        .query(async () => {
        const products = await db.query.niscProduct.findMany({
            where: and(eq(niscProduct.isActive, true), or(eq(niscProduct.id, NISC_SEO_REPORTS_PRODUCT_ID), ilike(niscProduct.name, "%seo report%"), ilike(niscProduct.name, "%seo%"))),
            orderBy: (p, { asc: a, desc: d }) => [a(p.sortOrder), d(p.createdAt)],
            with: {
                plans: {
                    where: and(eq(niscProductPlan.isActive, true), eq(niscProductPlan.pricingModel, "FIXED")),
                    orderBy: (plan, { asc: a }) => [
                        a(plan.sortOrder),
                        a(plan.createdAt),
                    ],
                },
            },
        });
        const seenKeys = new Set();
        const productFeatures = [];
        const canonicalProduct = products.find((p) => p.id === NISC_SEO_REPORTS_PRODUCT_ID);
        const productsForFeatures = canonicalProduct
            ? [canonicalProduct, ...products.filter((p) => p.id !== NISC_SEO_REPORTS_PRODUCT_ID)]
            : products;
        for (const p of productsForFeatures) {
            const features = p.features ?? [];
            for (const f of features) {
                if (!seenKeys.has(f.key)) {
                    seenKeys.add(f.key);
                    productFeatures.push({ key: f.key, label: f.label, description: f.description });
                }
            }
        }
        if (productFeatures.length === 0) {
            for (const f of SEO_PRODUCT_FEATURES) {
                if (!seenKeys.has(f.key)) {
                    seenKeys.add(f.key);
                    productFeatures.push({ key: f.key, label: f.label, description: f.description });
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
                    const available = !!entry?.available;
                    const valueOverride = entry?.valueOverride != null && entry.valueOverride !== ""
                        ? String(entry.valueOverride)
                        : null;
                    return { available, valueOverride };
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
        return { productFeatures, plans };
    }),
    /** Media buying customer pricing (Meta / Google / LinkedIn). COMMISSION plans only. */
    getMediaBuyingPlansForPricing: publicProcedure
        .output(z.object({
        productFeatures: z.array(z.object({ key: z.string(), label: z.string(), description: z.string().optional() })),
        productName: z.string(),
        plans: z.array(z.object({
            id: z.string(),
            name: z.string(),
            niscPrice: z.string().nullable(),
            niscCurrency: z.string(),
            billingCycle: z.string(),
            pricingModel: z.enum(["FIXED", "COMMISSION"]),
            commissionRate: z.number().nullable(),
            commissionBase: z.string().nullable(),
            isPopular: z.boolean(),
            isRecommended: z.boolean(),
            productId: z.string(),
            productName: z.string(),
            featureValues: z.array(z.object({
                available: z.boolean(),
                valueOverride: z.string().nullable(),
            })),
        })),
    }))
        .query(async () => {
        const products = await db.query.niscProduct.findMany({
            where: and(eq(niscProduct.isActive, true), or(eq(niscProduct.id, NISC_MEDIA_BUYING_PRODUCT_ID), ilike(niscProduct.name, "%media buying%"))),
            orderBy: (p, { asc: a, desc: d }) => [a(p.sortOrder), d(p.createdAt)],
            with: {
                plans: {
                    where: and(eq(niscProductPlan.isActive, true), eq(niscProductPlan.pricingModel, "COMMISSION")),
                    orderBy: (plan, { asc: a }) => [a(plan.sortOrder), a(plan.createdAt)],
                },
            },
        });
        const seenKeys = new Set();
        const productFeatures = [];
        for (const p of products) {
            const features = p.features ?? [];
            for (const f of features) {
                if (!seenKeys.has(f.key)) {
                    seenKeys.add(f.key);
                    productFeatures.push({ key: f.key, label: f.label, description: f.description });
                }
            }
        }
        const plans = [];
        let productName = "Media Buying";
        for (const product of products) {
            productName = product.name;
            for (const plan of product.plans ?? []) {
                const planFeats = plan.planFeatures ?? [];
                const planFeatsByKey = new Map(planFeats.map((f) => [f.key, f]));
                const featureValues = productFeatures.map((pf) => {
                    const entry = planFeatsByKey.get(pf.key);
                    const available = !!entry?.available;
                    const valueOverride = entry?.valueOverride != null && entry.valueOverride !== ""
                        ? String(entry.valueOverride)
                        : null;
                    return { available, valueOverride };
                });
                plans.push({
                    id: plan.id,
                    name: plan.name,
                    niscPrice: null,
                    niscCurrency: plan.currency ?? "KES",
                    billingCycle: "MONTHLY",
                    pricingModel: "COMMISSION",
                    commissionRate: plan.commissionRate != null ? Number(plan.commissionRate) : null,
                    commissionBase: plan.commissionBase ?? null,
                    isPopular: plan.isPopular ?? false,
                    isRecommended: plan.isRecommended ?? false,
                    productId: product.id,
                    productName: product.name,
                    featureValues,
                });
            }
        }
        return { productFeatures, productName, plans };
    }),
    /**
     * Creative / design customer pricing (e.g. Creative Assets empty state). Matches products whose name
     * contains "creatives design", "creative_design", or "creatives_design" (case-insensitive).
     * Same output shape as getHostingPlansForPricing.
     */
    getCreativesDesignPlansForPricing: publicProcedure
        .output(z.object({
        productFeatures: z.array(z.object({ key: z.string(), label: z.string(), description: z.string().optional() })),
        plans: z.array(z.object({
            id: z.string(),
            name: z.string(),
            niscPrice: z.string().nullable(),
            niscCurrency: z.string(),
            billingCycle: z.string(),
            isPopular: z.boolean(),
            isRecommended: z.boolean(),
            productId: z.string(),
            productName: z.string(),
            featureValues: z.array(z.object({
                available: z.boolean(),
                valueOverride: z.string().nullable(),
            })),
        })),
    }))
        .query(async () => {
        const products = await db.query.niscProduct.findMany({
            where: and(eq(niscProduct.isActive, true), or(eq(niscProduct.id, CREATIVES_DESIGN_PRODUCT_ID), ilike(niscProduct.name, "%creatives design%"), ilike(niscProduct.name, "%creative_design%"), ilike(niscProduct.name, "%creatives_design%"))),
            orderBy: (p, { asc: a, desc: d }) => [a(p.sortOrder), d(p.createdAt)],
            with: {
                plans: {
                    where: and(eq(niscProductPlan.isActive, true), eq(niscProductPlan.pricingModel, "FIXED")),
                    orderBy: (plan, { asc: a }) => [
                        a(plan.sortOrder),
                        a(plan.createdAt),
                    ],
                },
            },
        });
        const seenKeys = new Set();
        const productFeatures = [];
        for (const p of products) {
            const features = p.features ?? [];
            for (const f of features) {
                if (!seenKeys.has(f.key)) {
                    seenKeys.add(f.key);
                    productFeatures.push({ key: f.key, label: f.label, description: f.description });
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
                    const available = !!entry?.available;
                    const valueOverride = entry?.valueOverride != null && entry.valueOverride !== ""
                        ? String(entry.valueOverride)
                        : null;
                    return { available, valueOverride };
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
        return { productFeatures, plans };
    }),
    /**
     * Plans for the Nisc Email Marketing customer app pricing table. Matches products named
     * "Nisc Email Marketing" or "Email Marketing" (case-insensitive, substring). Same output shape
     * as getHostingPlansForPricing.
     */
    getNiscEmailMarketingPlansForPricing: publicProcedure
        .output(z.object({
        productFeatures: z.array(z.object({ key: z.string(), label: z.string(), description: z.string().optional() })),
        plans: z.array(z.object({
            id: z.string(),
            name: z.string(),
            niscPrice: z.string().nullable(),
            niscCurrency: z.string(),
            billingCycle: z.string(),
            isPopular: z.boolean(),
            isRecommended: z.boolean(),
            productId: z.string(),
            productName: z.string(),
            featureValues: z.array(z.object({
                available: z.boolean(),
                valueOverride: z.string().nullable(),
            })),
        })),
    }))
        .query(async () => {
        const products = await db.query.niscProduct.findMany({
            where: and(eq(niscProduct.isActive, true), or(ilike(niscProduct.name, "%nisc email marketing%"), ilike(niscProduct.name, "%email marketing%"))),
            orderBy: (p, { asc: a, desc: d }) => [a(p.sortOrder), d(p.createdAt)],
            with: {
                plans: {
                    where: and(eq(niscProductPlan.isActive, true), eq(niscProductPlan.pricingModel, "FIXED")),
                    orderBy: (plan, { asc: a }) => [a(plan.sortOrder), a(plan.createdAt)],
                },
            },
        });
        const seenKeys = new Set();
        const productFeatures = [];
        for (const p of products) {
            const features = p.features ?? [];
            for (const f of features) {
                if (!seenKeys.has(f.key)) {
                    seenKeys.add(f.key);
                    productFeatures.push({ key: f.key, label: f.label, description: f.description });
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
                    const available = !!entry?.available;
                    const valueOverride = entry?.valueOverride != null && entry.valueOverride !== ""
                        ? String(entry.valueOverride)
                        : null;
                    return { available, valueOverride };
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
        return { productFeatures, plans };
    }),
    /** Get plans for pricing by marketplace slug. Searches products by name using slug-derived or predefined search terms (e.g. website-hosting → "website hosting", "web hosting"). Same output shape as getHostingPlansForPricing. */
    getPlansForPricingBySlug: publicProcedure
        .input(z.object({ slug: z.string().min(1) }))
        .output(z.object({
        productFeatures: z.array(z.object({ key: z.string(), label: z.string() })),
        plans: z.array(z.object({
            id: z.string(),
            name: z.string(),
            niscPrice: z.string().nullable(),
            niscCurrency: z.string(),
            billingCycle: z.string(),
            isPopular: z.boolean(),
            isRecommended: z.boolean(),
            productId: z.string(),
            productName: z.string(),
            featureValues: z.array(z.object({
                available: z.boolean(),
                valueOverride: z.string().nullable(),
            })),
        })),
    }))
        .query(async ({ input }) => {
        const slug = input.slug.trim().toLowerCase();
        const searchTerms = getSearchTermsForMarketplaceSlug(slug);
        const nameMatch = or(...searchTerms.map((term) => ilike(niscProduct.name, `%${term}%`)));
        const products = await db.query.niscProduct.findMany({
            where: and(eq(niscProduct.isActive, true), nameMatch),
            orderBy: (p, { asc: a, desc: d }) => [a(p.sortOrder), d(p.createdAt)],
            with: {
                plans: {
                    where: and(eq(niscProductPlan.isActive, true), eq(niscProductPlan.pricingModel, "FIXED")),
                    orderBy: (plan, { asc: a }) => [
                        a(plan.sortOrder),
                        a(plan.createdAt),
                    ],
                },
            },
        });
        const seenKeys = new Set();
        const productFeatures = [];
        for (const p of products) {
            const features = p.features ?? [];
            for (const f of features) {
                if (!seenKeys.has(f.key)) {
                    seenKeys.add(f.key);
                    productFeatures.push({ key: f.key, label: f.label, description: f.description });
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
                    const available = !!entry?.available;
                    const valueOverride = entry?.valueOverride != null && entry.valueOverride !== ""
                        ? String(entry.valueOverride)
                        : null;
                    return { available, valueOverride };
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
        return { productFeatures, plans };
    }),
    /** Create a new product */
    create: protectedProcedure
        .input(createProductInputSchema)
        .output(productOutputSchema)
        .mutation(async ({ ctx, input }) => {
        const actor = getAuthenticatedActor(ctx);
        assertAgencySuperAdminMutationAccess(actor.role);
        const id = randomUUID();
        const [product] = await db
            .insert(niscProduct)
            .values({
            id,
            name: input.name,
            description: input.description ?? null,
            category: input.category,
            serviceType: input.serviceType,
            isActive: input.isActive,
            sortOrder: input.sortOrder,
            features: input.features,
            highlights: input.highlights,
            metadata: input.metadata ?? null,
            etimsItemCd: input.etimsItemCd ?? null,
            etimsItemClsCd: input.etimsItemClsCd ?? null,
            etimsTaxTyCd: input.etimsTaxTyCd ?? null,
            etimsDefaultPrice: input.etimsDefaultPrice ?? null,
            etimsPkgUnitCd: input.etimsPkgUnitCd ?? null,
            etimsQtyUnitCd: input.etimsQtyUnitCd ?? null,
        })
            .returning();
        if (!product) {
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Failed to create product",
            });
        }
        await invalidateProductsCache();
        return mapProduct(product);
    }),
    /** Update an existing product */
    update: protectedProcedure
        .input(updateProductInputSchema)
        .output(productOutputSchema)
        .mutation(async ({ ctx, input }) => {
        const actor = getAuthenticatedActor(ctx);
        assertAgencySuperAdminMutationAccess(actor.role);
        const existing = await db.query.niscProduct.findFirst({
            where: eq(niscProduct.id, input.id),
        });
        if (!existing) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
        }
        const { id, ...rest } = input;
        const set = {};
        if (rest.name !== undefined)
            set.name = rest.name;
        if (rest.description !== undefined)
            set.description = rest.description ?? null;
        if (rest.category !== undefined)
            set.category = rest.category;
        if (rest.serviceType !== undefined)
            set.serviceType = rest.serviceType;
        if (rest.isActive !== undefined)
            set.isActive = rest.isActive;
        if (rest.sortOrder !== undefined)
            set.sortOrder = rest.sortOrder;
        if (rest.features !== undefined)
            set.features = rest.features;
        if (rest.highlights !== undefined)
            set.highlights = rest.highlights;
        if (rest.metadata !== undefined) {
            set.metadata = rest.metadata ?? null;
        }
        if (rest.etimsItemCd !== undefined)
            set.etimsItemCd = rest.etimsItemCd ?? null;
        if (rest.etimsItemClsCd !== undefined)
            set.etimsItemClsCd = rest.etimsItemClsCd ?? null;
        if (rest.etimsTaxTyCd !== undefined)
            set.etimsTaxTyCd = rest.etimsTaxTyCd ?? null;
        if (rest.etimsDefaultPrice !== undefined)
            set.etimsDefaultPrice = rest.etimsDefaultPrice ?? null;
        if (rest.etimsPkgUnitCd !== undefined)
            set.etimsPkgUnitCd = rest.etimsPkgUnitCd ?? null;
        if (rest.etimsQtyUnitCd !== undefined)
            set.etimsQtyUnitCd = rest.etimsQtyUnitCd ?? null;
        const [updated] = await db
            .update(niscProduct)
            .set(set)
            .where(eq(niscProduct.id, id))
            .returning();
        if (!updated) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
        }
        await invalidateProductsCache();
        return mapProduct(updated);
    }),
    /**
     * Deactivate a Nisc product on KRA eTIMS (useYn=N) and clear local eTIMS fields.
     * Agency super admin only.
     */
    unregisterFromKra: protectedProcedure
        .input(z.object({ id: z.string().min(1) }))
        .output(z.object({ success: z.boolean() }))
        .mutation(async ({ ctx, input }) => {
        const actor = getAuthenticatedActor(ctx);
        assertAgencySuperAdminMutationAccess(actor.role);
        const product = await db.query.niscProduct.findFirst({
            where: eq(niscProduct.id, input.id),
        });
        if (!product) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
        }
        if (!product.etimsItemCd) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "This product is not registered on KRA eTIMS",
            });
        }
        if (!product.etimsItemClsCd || !product.etimsTaxTyCd) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Missing KRA classification or tax data on this product",
            });
        }
        const taxTyCd = product.etimsTaxTyCd;
        if (taxTyCd !== "A" && taxTyCd !== "B" && taxTyCd !== "C" && taxTyCd !== "D" && taxTyCd !== "E") {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Invalid KRA tax type stored on this product",
            });
        }
        const dftPrc = Number(product.etimsDefaultPrice ?? 0) || 0;
        const modrId = actor.userId.slice(0, 20);
        const modrNm = (ctx.session?.user?.name ?? "Administrator").slice(0, 60);
        const { client, oscu } = await getEtimsContext();
        const result = await client.saveItem(oscu, {
            itemCd: product.etimsItemCd,
            itemClsCd: product.etimsItemClsCd,
            itemTyCd: "3",
            itemNm: product.name,
            itemStdNm: null,
            orgnNatCd: "KE",
            pkgUnitCd: product.etimsPkgUnitCd ?? "OU",
            qtyUnitCd: product.etimsQtyUnitCd ?? "U",
            taxTyCd,
            btchNo: null,
            bcd: null,
            dftPrc,
            grpPrcL1: dftPrc,
            grpPrcL2: dftPrc,
            grpPrcL3: dftPrc,
            grpPrcL4: dftPrc,
            grpPrcL5: 0,
            addInfo: null,
            sftyQty: 0,
            isrcAplcbYn: "N",
            useYn: "N",
            regrId: modrId,
            regrNm: modrNm,
            modrId: modrId,
            modrNm: modrNm,
        });
        const resultCd = result.resultCd;
        const resultMsg = result.resultMsg ?? "KRA rejected the unregister request";
        if (resultCd && resultCd !== "000" && resultCd !== "001") {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: resultMsg,
            });
        }
        await db
            .update(niscProduct)
            .set({
            etimsItemCd: null,
            etimsItemClsCd: null,
            etimsTaxTyCd: null,
            etimsDefaultPrice: null,
            etimsPkgUnitCd: null,
            etimsQtyUnitCd: null,
        })
            .where(eq(niscProduct.id, input.id));
        await db.delete(eTimsItem).where(eq(eTimsItem.itemCd, product.etimsItemCd));
        await invalidateProductsCache();
        return { success: true };
    }),
    /** Permanently delete a product from the database. Only allowed when product is inactive and has no subscriptions. */
    delete: protectedProcedure
        .input(deleteProductInputSchema)
        .output(z.object({ success: z.boolean() }))
        .mutation(async ({ ctx, input }) => {
        const actor = getAuthenticatedActor(ctx);
        assertAgencySuperAdminMutationAccess(actor.role);
        const existing = await db.query.niscProduct.findFirst({
            where: eq(niscProduct.id, input.id),
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
        const [subCountRow] = await db
            .select({ c: count() })
            .from(niscClientSubscription)
            .where(eq(niscClientSubscription.productId, input.id));
        const subscriptionCount = Number(subCountRow?.c ?? 0);
        if (subscriptionCount > 0) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Cannot delete product that has client subscriptions",
            });
        }
        const [orderItemCountRow] = await db
            .select({ c: count() })
            .from(niscOrderItem)
            .where(eq(niscOrderItem.productId, input.id));
        const orderItemCount = Number(orderItemCountRow?.c ?? 0);
        if (orderItemCount > 0) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: `Cannot delete product referenced by ${orderItemCount} order item(s). Migrate or reassign them first.`,
            });
        }
        try {
            await db.delete(niscProduct).where(eq(niscProduct.id, input.id));
        }
        catch (err) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Cannot delete product while it is still referenced by orders, plans, or other records. Deactivate it instead, or run the relevant product migration script.",
                cause: err,
            });
        }
        await invalidateProductsCache();
        return { success: true };
    }),
    /** Get default (or first) active plan ID for a product. Used when creating orders from payment (e.g. domain registration). */
    getDefaultPlanIdForProduct: protectedProcedure
        .input(z.object({ productId: z.string() }))
        .output(z.string().nullable())
        .query(async ({ ctx, input }) => {
        const actor = getAuthenticatedActor(ctx);
        assertAgencyReadAccess(actor.role);
        const rows = await db
            .select({ id: niscProductPlan.id })
            .from(niscProductPlan)
            .where(and(eq(niscProductPlan.productId, input.productId), eq(niscProductPlan.isActive, true)))
            .orderBy(desc(niscProductPlan.isDefault), asc(niscProductPlan.sortOrder), asc(niscProductPlan.createdAt))
            .limit(1);
        return rows[0]?.id ?? null;
    }),
    // ── Product Plans ─────────────────────────────────────────────────────────
    /** Get a single plan by ID */
    getPlanById: protectedProcedure
        .input(getPlanByIdInputSchema)
        .output(planOutputSchema)
        .query(async ({ ctx, input }) => {
        const actor = getAuthenticatedActor(ctx);
        assertAgencyReadAccess(actor.role);
        const plan = await db.query.niscProductPlan.findFirst({
            where: eq(niscProductPlan.id, input.id),
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
        const actor = getAuthenticatedActor(ctx);
        assertAgencySuperAdminMutationAccess(actor.role);
        // Ensure product exists and fetch its feature master list
        const product = await db.query.niscProduct.findFirst({
            where: eq(niscProduct.id, input.productId),
        });
        if (!product) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
        }
        // Normalise planFeatures: auto-fill missing keys with available=false
        const normalisedFeatures = normalisePlanFeatures(product.features, input.planFeatures);
        const planId = randomUUID();
        const [plan] = await db
            .insert(niscProductPlan)
            .values({
            id: planId,
            productId: input.productId,
            name: input.name,
            description: input.description ?? null,
            pricingModel: input.pricingModel,
            billingCycle: input.pricingModel === "FIXED" ? (input.billingCycle ?? null) : null,
            price: input.pricingModel === "FIXED" ? (input.price ?? null) : null,
            currency: input.currency,
            setupFee: input.pricingModel === "FIXED" ? (input.setupFee ?? null) : null,
            commissionRate: input.pricingModel === "COMMISSION" &&
                input.commissionRate !== undefined
                ? String(input.commissionRate)
                : null,
            commissionBase: input.pricingModel === "COMMISSION"
                ? (input.commissionBase ?? null)
                : null,
            commissionBaseDescription: input.pricingModel === "COMMISSION"
                ? (input.commissionBaseDescription ?? null)
                : null,
            planFeatures: normalisedFeatures,
            highlights: input.highlights,
            isPopular: input.isPopular,
            isRecommended: input.isRecommended,
            isActive: input.isActive,
            isDefault: input.isDefault,
            sortOrder: input.sortOrder,
            pleskServicePlanId: input.pleskServicePlanId ?? null,
            pleskFilterId: input.pleskFilterId ?? null,
            pleskIpAddress: input.pleskIpAddress ?? null,
            hostingType: input.hostingType ?? null,
            metadata: input.metadata ?? null,
        })
            .returning();
        if (!plan) {
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Failed to create plan",
            });
        }
        await invalidateProductsCache();
        return mapPlan(plan);
    }),
    /** Update an existing plan */
    updatePlan: protectedProcedure
        .input(updatePlanInputSchema)
        .output(planOutputSchema)
        .mutation(async ({ ctx, input }) => {
        const actor = getAuthenticatedActor(ctx);
        assertAgencySuperAdminMutationAccess(actor.role);
        const existing = await db.query.niscProductPlan.findFirst({
            where: eq(niscProductPlan.id, input.id),
            with: { product: true },
        });
        if (!existing) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Plan not found" });
        }
        // If planFeatures are being updated, re-normalise them
        let normalisedFeatures;
        if (input.planFeatures !== undefined) {
            normalisedFeatures = normalisePlanFeatures(existing.product.features, input.planFeatures);
        }
        const effectivePricingModel = input.pricingModel ?? existing.pricingModel;
        const set = {};
        if (input.name !== undefined)
            set.name = input.name;
        if (input.description !== undefined)
            set.description = input.description ?? null;
        if (input.pricingModel !== undefined)
            set.pricingModel = input.pricingModel;
        if (input.billingCycle !== undefined) {
            set.billingCycle =
                effectivePricingModel === "FIXED" ? (input.billingCycle ?? null) : null;
        }
        if (input.price !== undefined) {
            set.price =
                effectivePricingModel === "FIXED" ? (input.price ?? null) : null;
        }
        if (input.currency !== undefined)
            set.currency = input.currency;
        if (input.setupFee !== undefined) {
            set.setupFee =
                effectivePricingModel === "FIXED" ? (input.setupFee ?? null) : null;
        }
        if (input.commissionRate !== undefined) {
            set.commissionRate =
                effectivePricingModel === "COMMISSION" && input.commissionRate !== undefined
                    ? String(input.commissionRate)
                    : null;
        }
        if (input.commissionBase !== undefined) {
            set.commissionBase =
                effectivePricingModel === "COMMISSION"
                    ? (input.commissionBase ?? null)
                    : null;
        }
        if (input.commissionBaseDescription !== undefined) {
            set.commissionBaseDescription =
                effectivePricingModel === "COMMISSION"
                    ? (input.commissionBaseDescription ?? null)
                    : null;
        }
        if (normalisedFeatures !== undefined) {
            set.planFeatures = normalisedFeatures;
        }
        if (input.highlights !== undefined)
            set.highlights = input.highlights;
        if (input.isPopular !== undefined)
            set.isPopular = input.isPopular;
        if (input.isRecommended !== undefined)
            set.isRecommended = input.isRecommended;
        if (input.isActive !== undefined)
            set.isActive = input.isActive;
        if (input.isDefault !== undefined)
            set.isDefault = input.isDefault;
        if (input.sortOrder !== undefined)
            set.sortOrder = input.sortOrder;
        if (input.pleskServicePlanId !== undefined) {
            set.pleskServicePlanId = input.pleskServicePlanId ?? null;
        }
        if (input.pleskFilterId !== undefined) {
            set.pleskFilterId = input.pleskFilterId ?? null;
        }
        if (input.pleskIpAddress !== undefined) {
            set.pleskIpAddress = input.pleskIpAddress ?? null;
        }
        if (input.hostingType !== undefined) {
            set.hostingType = input.hostingType ?? null;
        }
        if (input.metadata !== undefined) {
            set.metadata = input.metadata ?? null;
        }
        const [updated] = await db
            .update(niscProductPlan)
            .set(set)
            .where(eq(niscProductPlan.id, input.id))
            .returning();
        if (!updated) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Plan not found" });
        }
        await invalidateProductsCache();
        return mapPlan(updated);
    }),
    /** Soft-delete a plan (set isActive = false) */
    deletePlan: protectedProcedure
        .input(deletePlanInputSchema)
        .output(z.object({ success: z.boolean() }))
        .mutation(async ({ ctx, input }) => {
        const actor = getAuthenticatedActor(ctx);
        assertAgencySuperAdminMutationAccess(actor.role);
        const existing = await db.query.niscProductPlan.findFirst({
            where: eq(niscProductPlan.id, input.id),
        });
        if (!existing) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Plan not found" });
        }
        await db
            .update(niscProductPlan)
            .set({ isActive: false })
            .where(eq(niscProductPlan.id, input.id));
        await invalidateProductsCache();
        return { success: true };
    }),
    // ── Product Plan Usage (usage limits & overuse config) ───────────────────
    listPlanUsages: protectedProcedure
        .input(listPlanUsagesInputSchema.optional())
        .output(z.array(planUsageOutputSchema))
        .query(async ({ ctx, input }) => {
        const actor = getAuthenticatedActor(ctx);
        assertAgencyReadAccess(actor.role);
        const usageConditions = [];
        if (input?.productId) {
            usageConditions.push(eq(niscProductPlanUsage.productId, input.productId));
        }
        if (input?.productPlanId) {
            usageConditions.push(eq(niscProductPlanUsage.productPlanId, input.productPlanId));
        }
        if (input?.usageKind) {
            usageConditions.push(eq(niscProductPlanUsage.usageKind, input.usageKind));
        }
        const usageWhere = usageConditions.length > 0 ? and(...usageConditions) : undefined;
        const rows = await db.query.niscProductPlanUsage.findMany({
            where: usageWhere,
            orderBy: (u, { asc: a }) => [
                a(u.productId),
                a(u.productPlanId),
                a(u.usageKind),
            ],
        });
        return rows.map(mapPlanUsage);
    }),
    getPlanUsageById: protectedProcedure
        .input(z.object({ id: z.string() }))
        .output(planUsageOutputSchema)
        .query(async ({ ctx, input }) => {
        const actor = getAuthenticatedActor(ctx);
        assertAgencyReadAccess(actor.role);
        const row = await db.query.niscProductPlanUsage.findFirst({
            where: eq(niscProductPlanUsage.id, input.id),
        });
        if (!row)
            throw new TRPCError({ code: "NOT_FOUND", message: "Plan usage not found" });
        return mapPlanUsage(row);
    }),
    createPlanUsage: protectedProcedure
        .input(createPlanUsageInputSchema)
        .output(planUsageOutputSchema)
        .mutation(async ({ ctx, input }) => {
        const actor = getAuthenticatedActor(ctx);
        assertAgencySuperAdminMutationAccess(actor.role);
        const product = await db.query.niscProduct.findFirst({
            where: eq(niscProduct.id, input.productId),
        });
        if (!product)
            throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
        const plan = await db.query.niscProductPlan.findFirst({
            where: eq(niscProductPlan.id, input.productPlanId),
        });
        if (!plan)
            throw new TRPCError({ code: "NOT_FOUND", message: "Plan not found" });
        const usageId = randomUUID();
        const [row] = await db
            .insert(niscProductPlanUsage)
            .values({
            id: usageId,
            productId: input.productId,
            productPlanId: input.productPlanId,
            userId: input.userId ?? null,
            teamId: input.teamId ?? null,
            usageKind: input.usageKind,
            limitValue: input.limitValue,
            overuse: input.overuse,
            period: input.period ?? null,
        })
            .returning();
        if (!row) {
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Failed to create plan usage",
            });
        }
        return mapPlanUsage(row);
    }),
    updatePlanUsage: protectedProcedure
        .input(updatePlanUsageInputSchema)
        .output(planUsageOutputSchema)
        .mutation(async ({ ctx, input }) => {
        const actor = getAuthenticatedActor(ctx);
        assertAgencySuperAdminMutationAccess(actor.role);
        const existing = await db.query.niscProductPlanUsage.findFirst({
            where: eq(niscProductPlanUsage.id, input.id),
        });
        if (!existing)
            throw new TRPCError({ code: "NOT_FOUND", message: "Plan usage not found" });
        const usageSet = {};
        if (input.userId !== undefined)
            usageSet.userId = input.userId;
        if (input.teamId !== undefined)
            usageSet.teamId = input.teamId;
        if (input.usageKind !== undefined)
            usageSet.usageKind = input.usageKind;
        if (input.limitValue !== undefined)
            usageSet.limitValue = input.limitValue;
        if (input.overuse !== undefined)
            usageSet.overuse = input.overuse;
        if (input.period !== undefined)
            usageSet.period = input.period;
        const [row] = await db
            .update(niscProductPlanUsage)
            .set(usageSet)
            .where(eq(niscProductPlanUsage.id, input.id))
            .returning();
        if (!row) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Plan usage not found" });
        }
        return mapPlanUsage(row);
    }),
    deletePlanUsage: protectedProcedure
        .input(z.object({ id: z.string() }))
        .output(z.object({ success: z.boolean() }))
        .mutation(async ({ ctx, input }) => {
        const actor = getAuthenticatedActor(ctx);
        assertAgencySuperAdminMutationAccess(actor.role);
        await db
            .delete(niscProductPlanUsage)
            .where(eq(niscProductPlanUsage.id, input.id));
        return { success: true };
    }),
});
