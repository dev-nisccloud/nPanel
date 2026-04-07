import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, isNull } from "@npanel/db";
import * as crypto from "node:crypto";
import { protectedProcedure, router } from "../trpc";
import { db } from "@npanel/db";
import { user } from "@npanel/db/schema/auth";
import { hostingPlan, hostingSubscription, hostingSubscriptionActivityLog, niscServicePlan, } from "@npanel/db/schema/hosting";
import { serviceSubscription, serviceSubscriptionActivityLog } from "@npanel/db/schema/service-subscriptions";
import { team } from "@npanel/db/schema/teams";
// ============================================================================
// ZOD SCHEMAS - Independent from database schema
// ============================================================================
// Service Subscription Status Enum
const serviceSubscriptionStatusSchema = z.enum([
    "ACTIVE",
    "PENDING",
    "SUSPENDED",
    "CANCELLED",
    "EXPIRED",
    "PROCESSING",
    "FAILED",
]);
// Billing Cycle Enum
const billingCycleSchema = z.enum(["YEARLY", "MONTHLY", "BIENNIALLY", "CUSTOM"]);
// Service Plan Type Enum
const servicePlanTypeSchema = z.enum([
    "HOSTING",
    "SEO",
    "VIDEOGRAPHY",
    "VISUAL_CREATIVE",
    "SOCIAL_MEDIA_MARKETING",
    "PAY_PER_CLICK_ADVERTISING",
]);
// Hosting Sub-Type Enum
const hostingSubTypeSchema = z.enum([
    "WEB_HOSTING",
    "EMAIL_HOSTING",
    "RESELLER_HOSTING",
    "VPS_HOSTING",
    "DEDICATED_HOSTING",
]);
// Link to Subscription Input Schema
const linkToSubscriptionInputSchema = z.object({
    subscriptionId: z.string(), // Plesk subscription ID
    pleskFilterId: z.string().min(1, "Plesk Filter ID is required"),
    niscServicePlanId: z.string().min(1, "Service plan is required"),
    teamId: z.string().min(1, "Team is required"),
    hostingPlanId: z.string().min(1, "Hosting plan is required"),
    hostingType: z.enum(["WEB_HOSTING", "EMAIL_HOSTING", "RESELLER_HOSTING", "VPS_HOSTING", "DEDICATED_HOSTING"]).optional(),
    subscriptionDate: z.coerce.date().optional(),
    billingCycle: billingCycleSchema,
    expiryDate: z.coerce.date().optional(),
    primaryDomain: z.string().optional(),
    status: serviceSubscriptionStatusSchema.default("PENDING"),
    autoRenew: z.boolean().default(false),
    notes: z.string().optional(),
});
// Link to Subscription Output Schema
const linkToSubscriptionOutputSchema = z.object({
    id: z.string(),
    niscServicePlanId: z.string(),
    teamId: z.string().nullable(),
    orderId: z.string().nullable(),
    subscriptionDate: z.date().nullable(),
    billingCycle: billingCycleSchema,
    nextRenewalDate: z.date().nullable(),
    status: serviceSubscriptionStatusSchema,
    autoRenew: z.boolean(),
    hostingSubscriptionId: z.string().nullable(),
    notes: z.string().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
    // Include plan type and sub-type in response
    planType: servicePlanTypeSchema,
    hostingSubType: hostingSubTypeSchema.nullable(),
});
// Get Service Subscriptions Input Schema
const getServiceSubscriptionsInputSchema = z.object({
    teamId: z.string().optional(),
    planType: servicePlanTypeSchema.optional(),
    hostingSubType: hostingSubTypeSchema.optional(),
    status: serviceSubscriptionStatusSchema.optional(),
});
// Service Subscription Output Schema (for list/get operations)
const serviceSubscriptionOutputSchema = z.object({
    id: z.string(),
    niscServicePlanId: z.string(),
    teamId: z.string().nullable(),
    teamName: z.string().nullable(),
    orderId: z.string().nullable(),
    subscriptionDate: z.date().nullable(),
    billingCycle: billingCycleSchema,
    nextRenewalDate: z.date().nullable(),
    status: serviceSubscriptionStatusSchema,
    autoRenew: z.boolean(),
    hostingSubscriptionId: z.string().nullable(),
    notes: z.string().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
    // Include plan type and sub-type in response
    planType: servicePlanTypeSchema,
    hostingSubType: hostingSubTypeSchema.nullable(),
    // Include plan name for convenience
    planName: z.string(),
});
// Get Service Subscription by Hosting Subscription ID Input Schema
const getByHostingSubscriptionIdInputSchema = z.object({
    hostingSubscriptionId: z.string().min(1, "Hosting subscription ID is required"),
});
// Get Service Subscription by Hosting Subscription ID Output Schema
const getByHostingSubscriptionIdOutputSchema = serviceSubscriptionOutputSchema.nullable();
// Helper function to calculate next renewal date
function calculateNextRenewalDate(subscriptionDate, billingCycle) {
    if (!subscriptionDate)
        return null;
    const date = new Date(subscriptionDate);
    switch (billingCycle) {
        case "MONTHLY":
            date.setMonth(date.getMonth() + 1);
            break;
        case "YEARLY":
            date.setFullYear(date.getFullYear() + 1);
            break;
        case "BIENNIALLY":
            date.setFullYear(date.getFullYear() + 2);
            break;
        case "CUSTOM":
            // For custom, we don't auto-calculate - return null
            return null;
    }
    return date;
}
export const serviceSubscriptionsRouter = router({
    // Link hosting subscription to service subscription
    linkToSubscription: protectedProcedure
        .input(linkToSubscriptionInputSchema)
        .output(linkToSubscriptionOutputSchema)
        .mutation(async ({ ctx, input }) => {
        const session = ctx.session;
        if (!session?.user?.id) {
            throw new TRPCError({
                code: "UNAUTHORIZED",
                message: "You must be logged in",
            });
        }
        // Check user role - only agency admins can link subscriptions
        const userRes = await db.query.user.findFirst({
            where: eq(user.id, session.user.id),
            columns: { role: true },
        });
        if (!userRes || (userRes.role !== "AGENCY_ADMIN" && userRes.role !== "AGENCY_SUPER_ADMIN")) {
            throw new TRPCError({
                code: "FORBIDDEN",
                message: "You do not have permission to link subscriptions",
            });
        }
        // Find or create hosting subscription by pleskFilterId
        let hostingSubscriptionRes = await db.query.hostingSubscription.findFirst({
            where: eq(hostingSubscription.pleskFilterId, input.pleskFilterId),
        });
        // If hosting subscription doesn't exist, create it
        if (!hostingSubscriptionRes) {
            // Get hosting plan - find or create from NiscServicePlan
            let hostingPlanId;
            // First, try to find existing HostingPlan by ID
            const existingHostingPlanById = await db.query.hostingPlan.findFirst({
                where: eq(hostingPlan.id, input.hostingPlanId),
            });
            if (existingHostingPlanById) {
                if (!existingHostingPlanById.isActive) {
                    throw new TRPCError({
                        code: "BAD_REQUEST",
                        message: "Selected hosting plan is not active",
                    });
                }
                hostingPlanId = existingHostingPlanById.id;
            }
            else {
                // HostingPlan doesn't exist, try to find matching NiscServicePlan
                const niscPlan = await db.query.niscServicePlan.findFirst({
                    where: eq(niscServicePlan.id, input.hostingPlanId),
                });
                if (!niscPlan) {
                    throw new TRPCError({
                        code: "NOT_FOUND",
                        message: "Service plan not found",
                    });
                }
                if (niscPlan.planType !== "HOSTING") {
                    throw new TRPCError({
                        code: "BAD_REQUEST",
                        message: "Selected service plan is not a hosting plan",
                    });
                }
                // Find or create corresponding HostingPlan for backward compatibility
                const pleskPlanMatch = niscPlan.pleskServicePlanId == null
                    ? isNull(hostingPlan.pleskServicePlanId)
                    : eq(hostingPlan.pleskServicePlanId, niscPlan.pleskServicePlanId);
                const existingHostingPlan = await db.query.hostingPlan.findFirst({
                    where: and(eq(hostingPlan.hostingType, niscPlan.hostingSubType ?? "WEB_HOSTING"), pleskPlanMatch),
                });
                if (existingHostingPlan) {
                    hostingPlanId = existingHostingPlan.id;
                }
                else {
                    // Create a HostingPlan record for backward compatibility
                    const [newHostingPlan] = await db
                        .insert(hostingPlan)
                        .values({
                        id: crypto.randomUUID(),
                        name: niscPlan.name,
                        description: niscPlan.description,
                        hostingType: niscPlan.hostingSubType ?? "WEB_HOSTING",
                        pleskServicePlanId: niscPlan.pleskServicePlanId,
                        pleskFilterId: niscPlan.pleskFilterId,
                        pleskIpAddress: niscPlan.pleskIpAddress,
                        features: niscPlan.features,
                        highlights: niscPlan.highlights,
                        isPopular: niscPlan.isPopular,
                        isRecommended: niscPlan.isRecommended,
                        niscPrice: niscPlan.niscPrice,
                        niscCurrency: niscPlan.niscCurrency,
                        billingCycle: niscPlan.billingCycle,
                        setupFee: niscPlan.setupFee,
                        isActive: niscPlan.isActive,
                        isDefault: niscPlan.isDefault,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    })
                        .returning();
                    if (!newHostingPlan) {
                        throw new TRPCError({
                            code: "INTERNAL_SERVER_ERROR",
                            message: "Failed to create hosting plan",
                        });
                    }
                    hostingPlanId = newHostingPlan.id;
                }
            }
            // Create the hosting subscription
            const [createdHostingSubscription] = await db
                .insert(hostingSubscription)
                .values({
                id: crypto.randomUUID(),
                hostingPlanId: hostingPlanId,
                teamId: input.teamId,
                provisionedBy: session.user.id,
                pleskFilterId: input.pleskFilterId,
                hostingType: input.hostingType || "WEB_HOSTING",
                billingCycle: input.billingCycle,
                expiryDate: input.expiryDate,
                primaryDomain: input.primaryDomain || null,
                notes: input.notes || null,
                autoRenew: input.autoRenew,
                status: "ACTIVE",
                provisioningMethod: "MANUAL",
                operation: "PROVISION",
                createdAt: new Date(),
                updatedAt: new Date(),
            })
                .returning();
            if (!createdHostingSubscription) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to create hosting subscription",
                });
            }
            hostingSubscriptionRes = createdHostingSubscription;
            // Log activity for hosting subscription creation
            await db.insert(hostingSubscriptionActivityLog).values({
                id: crypto.randomUUID(),
                hostingSubscriptionId: hostingSubscriptionRes.id,
                userId: session.user.id,
                action: "CREATE",
                description: `Created hosting subscription and linked to service subscription`,
                metadata: {
                    pleskFilterId: input.pleskFilterId,
                    hostingPlanId: input.hostingPlanId,
                    teamId: input.teamId,
                },
                createdAt: new Date(),
            });
        }
        else {
            // Check if already linked to a service subscription
            const existingLink = await db.query.serviceSubscription.findFirst({
                where: eq(serviceSubscription.hostingSubscriptionId, hostingSubscriptionRes.id),
            });
            if (existingLink) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "This hosting subscription is already linked to a service subscription",
                });
            }
        }
        if (!hostingSubscriptionRes) {
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Hosting subscription is missing",
            });
        }
        // Verify service plan exists and get plan details
        const servicePlan = await db.query.niscServicePlan.findFirst({
            where: eq(niscServicePlan.id, input.niscServicePlanId),
        });
        if (!servicePlan) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Service plan not found",
            });
        }
        // Verify team exists
        const teamRes = await db.query.team.findFirst({
            where: eq(team.id, input.teamId),
        });
        if (!teamRes) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Team not found",
            });
        }
        // Calculate next renewal date
        const nextRenewalDate = calculateNextRenewalDate(input.subscriptionDate || new Date(), input.billingCycle);
        // Create service subscription
        const [serviceSubscriptionRes] = await db
            .insert(serviceSubscription)
            .values({
            id: crypto.randomUUID(),
            niscServicePlanId: input.niscServicePlanId,
            teamId: input.teamId,
            orderId: null, // Manual connection, no order
            subscribedBy: session.user.id,
            subscriptionDate: input.subscriptionDate || new Date(),
            billingCycle: input.billingCycle,
            nextRenewalDate,
            status: input.status,
            autoRenew: input.autoRenew,
            hostingSubscriptionId: hostingSubscriptionRes.id,
            notes: input.notes || null,
            createdAt: new Date(),
            updatedAt: new Date(),
        })
            .returning();
        if (!serviceSubscriptionRes) {
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Failed to create service subscription",
            });
        }
        // Log activity
        await db.insert(serviceSubscriptionActivityLog).values({
            id: crypto.randomUUID(),
            serviceSubscriptionId: serviceSubscriptionRes.id,
            userId: session.user.id,
            action: "CREATE",
            description: `Created service subscription and linked to hosting subscription`,
            metadata: {
                hostingSubscriptionId: hostingSubscriptionRes.id,
                niscServicePlanId: input.niscServicePlanId,
                teamId: input.teamId,
                billingCycle: input.billingCycle,
                status: input.status,
                pleskFilterId: input.pleskFilterId,
            },
            createdAt: new Date(),
        });
        return {
            id: serviceSubscriptionRes.id,
            niscServicePlanId: serviceSubscriptionRes.niscServicePlanId,
            teamId: serviceSubscriptionRes.teamId,
            orderId: serviceSubscriptionRes.orderId,
            subscriptionDate: serviceSubscriptionRes.subscriptionDate,
            billingCycle: serviceSubscriptionRes.billingCycle,
            nextRenewalDate: serviceSubscriptionRes.nextRenewalDate,
            status: serviceSubscriptionRes.status,
            autoRenew: serviceSubscriptionRes.autoRenew,
            hostingSubscriptionId: serviceSubscriptionRes.hostingSubscriptionId,
            notes: serviceSubscriptionRes.notes,
            createdAt: serviceSubscriptionRes.createdAt,
            updatedAt: serviceSubscriptionRes.updatedAt,
            planType: servicePlan.planType,
            hostingSubType: servicePlan.hostingSubType,
        };
    }),
    // Get service subscription by hosting subscription ID
    getByHostingSubscriptionId: protectedProcedure
        .input(getByHostingSubscriptionIdInputSchema)
        .output(getByHostingSubscriptionIdOutputSchema)
        .query(async ({ ctx, input }) => {
        const session = ctx.session;
        if (!session?.user?.id) {
            throw new TRPCError({
                code: "UNAUTHORIZED",
                message: "You must be logged in",
            });
        }
        const serviceSubscriptionRes = await db.query.serviceSubscription.findFirst({
            where: eq(serviceSubscription.hostingSubscriptionId, input.hostingSubscriptionId),
            with: {
                niscServicePlan: {
                    columns: {
                        name: true,
                        planType: true,
                        hostingSubType: true,
                    },
                },
                team: { columns: { name: true } },
            },
        });
        if (!serviceSubscriptionRes) {
            return null;
        }
        return {
            id: serviceSubscriptionRes.id,
            niscServicePlanId: serviceSubscriptionRes.niscServicePlanId,
            teamId: serviceSubscriptionRes.teamId,
            teamName: serviceSubscriptionRes.team?.name ?? null,
            orderId: serviceSubscriptionRes.orderId,
            subscriptionDate: serviceSubscriptionRes.subscriptionDate,
            billingCycle: serviceSubscriptionRes.billingCycle,
            nextRenewalDate: serviceSubscriptionRes.nextRenewalDate,
            status: serviceSubscriptionRes.status,
            autoRenew: serviceSubscriptionRes.autoRenew,
            hostingSubscriptionId: serviceSubscriptionRes.hostingSubscriptionId,
            notes: serviceSubscriptionRes.notes,
            createdAt: serviceSubscriptionRes.createdAt,
            updatedAt: serviceSubscriptionRes.updatedAt,
            planType: serviceSubscriptionRes.niscServicePlan.planType,
            hostingSubType: serviceSubscriptionRes.niscServicePlan.hostingSubType,
            planName: serviceSubscriptionRes.niscServicePlan.name,
        };
    }),
    // Get all service subscriptions with optional filtering
    getAll: protectedProcedure
        .input(getServiceSubscriptionsInputSchema.optional())
        .output(z.array(serviceSubscriptionOutputSchema))
        .query(async ({ ctx, input }) => {
        const session = ctx.session;
        if (!session?.user?.id) {
            throw new TRPCError({
                code: "UNAUTHORIZED",
                message: "You must be logged in",
            });
        }
        const whereConditions = [];
        if (input?.teamId)
            whereConditions.push(eq(serviceSubscription.teamId, input.teamId));
        if (input?.status)
            whereConditions.push(eq(serviceSubscription.status, input.status));
        if (input?.planType)
            whereConditions.push(eq(niscServicePlan.planType, input.planType));
        if (input?.hostingSubType)
            whereConditions.push(eq(niscServicePlan.hostingSubType, input.hostingSubType));
        const rows = await db
            .select({
            id: serviceSubscription.id,
            niscServicePlanId: serviceSubscription.niscServicePlanId,
            teamId: serviceSubscription.teamId,
            teamName: team.name,
            orderId: serviceSubscription.orderId,
            subscriptionDate: serviceSubscription.subscriptionDate,
            billingCycle: serviceSubscription.billingCycle,
            nextRenewalDate: serviceSubscription.nextRenewalDate,
            status: serviceSubscription.status,
            autoRenew: serviceSubscription.autoRenew,
            hostingSubscriptionId: serviceSubscription.hostingSubscriptionId,
            notes: serviceSubscription.notes,
            createdAt: serviceSubscription.createdAt,
            updatedAt: serviceSubscription.updatedAt,
            planType: niscServicePlan.planType,
            hostingSubType: niscServicePlan.hostingSubType,
            planName: niscServicePlan.name,
        })
            .from(serviceSubscription)
            .innerJoin(niscServicePlan, eq(serviceSubscription.niscServicePlanId, niscServicePlan.id))
            .leftJoin(team, eq(serviceSubscription.teamId, team.id))
            .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
            .orderBy(desc(serviceSubscription.createdAt));
        return rows.map((subscription) => ({
            id: subscription.id,
            niscServicePlanId: subscription.niscServicePlanId,
            teamId: subscription.teamId,
            teamName: subscription.teamName ?? null,
            orderId: subscription.orderId,
            subscriptionDate: subscription.subscriptionDate,
            billingCycle: subscription.billingCycle,
            nextRenewalDate: subscription.nextRenewalDate,
            status: subscription.status,
            autoRenew: subscription.autoRenew,
            hostingSubscriptionId: subscription.hostingSubscriptionId,
            notes: subscription.notes,
            createdAt: subscription.createdAt,
            updatedAt: subscription.updatedAt,
            planType: subscription.planType,
            hostingSubType: subscription.hostingSubType,
            planName: subscription.planName,
        }));
    }),
});
