import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../trpc";
import prisma from "@nPanel/db";

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
function calculateNextRenewalDate(
	subscriptionDate: Date | null,
	billingCycle: "YEARLY" | "MONTHLY" | "BIENNIALLY" | "CUSTOM"
): Date | null {
	if (!subscriptionDate) return null;

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
			const user = await prisma.user.findUnique({
				where: { id: session.user.id },
				select: { role: true },
			});

			if (!user || (user.role !== "AGENCY_ADMIN" && user.role !== "AGENCY_SUPER_ADMIN")) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have permission to link subscriptions",
				});
			}

			// Find or create hosting subscription by pleskFilterId
			let hostingSubscription = await prisma.hostingSubscription.findUnique({
				where: { pleskFilterId: input.pleskFilterId },
			});

			// If hosting subscription doesn't exist, create it
			if (!hostingSubscription) {
				// Get hosting plan - find or create from NiscServicePlan
				let hostingPlanId: string;

				// First, try to find existing HostingPlan by ID
				let hostingPlan = await prisma.hostingPlan.findUnique({
					where: { id: input.hostingPlanId },
				});

				if (hostingPlan) {
					if (!hostingPlan.isActive) {
						throw new TRPCError({
							code: "BAD_REQUEST",
							message: "Selected hosting plan is not active",
						});
					}
					hostingPlanId = hostingPlan.id;
				} else {
					// HostingPlan doesn't exist, try to find matching NiscServicePlan
					const niscServicePlan = await prisma.niscServicePlan.findUnique({
						where: { id: input.hostingPlanId },
					});

					if (!niscServicePlan) {
						throw new TRPCError({
							code: "NOT_FOUND",
							message: "Service plan not found",
						});
					}

					if (niscServicePlan.planType !== "HOSTING") {
						throw new TRPCError({
							code: "BAD_REQUEST",
							message: "Selected service plan is not a hosting plan",
						});
					}

					// Find or create corresponding HostingPlan for backward compatibility
					const existingHostingPlan = await prisma.hostingPlan.findFirst({
						where: {
							hostingType: niscServicePlan.hostingSubType!,
							pleskServicePlanId: niscServicePlan.pleskServicePlanId,
						},
					});

					if (existingHostingPlan) {
						hostingPlanId = existingHostingPlan.id;
					} else {
						// Create a HostingPlan record for backward compatibility
						const newHostingPlan = await prisma.hostingPlan.create({
							data: {
								id: crypto.randomUUID(),
								name: niscServicePlan.name,
								description: niscServicePlan.description,
								hostingType: niscServicePlan.hostingSubType!,
								pleskServicePlanId: niscServicePlan.pleskServicePlanId,
								pleskFilterId: niscServicePlan.pleskFilterId,
								pleskIpAddress: niscServicePlan.pleskIpAddress,
								features: niscServicePlan.features,
								highlights: niscServicePlan.highlights,
								isPopular: niscServicePlan.isPopular,
								isRecommended: niscServicePlan.isRecommended,
								niscPrice: niscServicePlan.niscPrice,
								niscCurrency: niscServicePlan.niscCurrency,
								billingCycle: niscServicePlan.billingCycle,
								setupFee: niscServicePlan.setupFee,
								isActive: niscServicePlan.isActive,
								isDefault: niscServicePlan.isDefault,
								createdAt: new Date(),
								updatedAt: new Date(),
							},
						});
						hostingPlanId = newHostingPlan.id;
					}
				}

				// Create the hosting subscription
				hostingSubscription = await prisma.hostingSubscription.create({
					data: {
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
					},
				});

				// Log activity for hosting subscription creation
				await prisma.hostingSubscriptionActivityLog.create({
					data: {
						id: crypto.randomUUID(),
						hostingSubscriptionId: hostingSubscription.id,
						userId: session.user.id,
						action: "CREATE",
						description: `Created hosting subscription and linked to service subscription`,
						metadata: {
							pleskFilterId: input.pleskFilterId,
							hostingPlanId: input.hostingPlanId,
							teamId: input.teamId,
						},
						createdAt: new Date(),
					},
				});
			} else {
				// Check if already linked to a service subscription
				const existingLink = await prisma.serviceSubscription.findUnique({
					where: { hostingSubscriptionId: hostingSubscription.id },
				});

				if (existingLink) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "This hosting subscription is already linked to a service subscription",
					});
				}
			}

			// Verify service plan exists and get plan details
			const servicePlan = await prisma.niscServicePlan.findUnique({
				where: { id: input.niscServicePlanId },
			});

			if (!servicePlan) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Service plan not found",
				});
			}

			// Verify team exists
			const team = await prisma.team.findUnique({
				where: { id: input.teamId },
			});

			if (!team) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Team not found",
				});
			}

			// Calculate next renewal date
			const nextRenewalDate = calculateNextRenewalDate(
				input.subscriptionDate || new Date(),
				input.billingCycle
			);

			// Create service subscription
			const serviceSubscription = await prisma.serviceSubscription.create({
				data: {
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
					hostingSubscriptionId: hostingSubscription.id,
					notes: input.notes || null,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			});

			// Log activity
			await prisma.serviceSubscriptionActivityLog.create({
				data: {
					id: crypto.randomUUID(),
					serviceSubscriptionId: serviceSubscription.id,
					userId: session.user.id,
					action: "CREATE",
					description: `Created service subscription and linked to hosting subscription`,
					metadata: {
						hostingSubscriptionId: hostingSubscription.id,
						niscServicePlanId: input.niscServicePlanId,
						teamId: input.teamId,
						billingCycle: input.billingCycle,
						status: input.status,
						pleskFilterId: input.pleskFilterId,
					},
					createdAt: new Date(),
				},
			});

			return {
				id: serviceSubscription.id,
				niscServicePlanId: serviceSubscription.niscServicePlanId,
				teamId: serviceSubscription.teamId,
				orderId: serviceSubscription.orderId,
				subscriptionDate: serviceSubscription.subscriptionDate,
				billingCycle: serviceSubscription.billingCycle as any,
				nextRenewalDate: serviceSubscription.nextRenewalDate,
				status: serviceSubscription.status as any,
				autoRenew: serviceSubscription.autoRenew,
				hostingSubscriptionId: serviceSubscription.hostingSubscriptionId,
				notes: serviceSubscription.notes,
				createdAt: serviceSubscription.createdAt,
				updatedAt: serviceSubscription.updatedAt,
				planType: servicePlan.planType as any,
				hostingSubType: servicePlan.hostingSubType as any,
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

			const serviceSubscription = await prisma.serviceSubscription.findUnique({
				where: { hostingSubscriptionId: input.hostingSubscriptionId },
				include: {
					niscServicePlan: {
						select: {
							name: true,
							planType: true,
							hostingSubType: true,
						},
					},
				},
			});

			if (!serviceSubscription) {
				return null;
			}

			return {
				id: serviceSubscription.id,
				niscServicePlanId: serviceSubscription.niscServicePlanId,
				teamId: serviceSubscription.teamId,
				orderId: serviceSubscription.orderId,
				subscriptionDate: serviceSubscription.subscriptionDate,
				billingCycle: serviceSubscription.billingCycle as any,
				nextRenewalDate: serviceSubscription.nextRenewalDate,
				status: serviceSubscription.status as any,
				autoRenew: serviceSubscription.autoRenew,
				hostingSubscriptionId: serviceSubscription.hostingSubscriptionId,
				notes: serviceSubscription.notes,
				createdAt: serviceSubscription.createdAt,
				updatedAt: serviceSubscription.updatedAt,
				planType: serviceSubscription.niscServicePlan.planType as any,
				hostingSubType: serviceSubscription.niscServicePlan.hostingSubType as any,
				planName: serviceSubscription.niscServicePlan.name,
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

			const where: any = {};

			if (input?.teamId) {
				where.teamId = input.teamId;
			}

			if (input?.status) {
				where.status = input.status;
			}

			// Filter by plan type and hosting sub-type through the relation
			if (input?.planType || input?.hostingSubType) {
				where.niscServicePlan = {};
				if (input.planType) {
					where.niscServicePlan.planType = input.planType;
				}
				if (input.hostingSubType) {
					where.niscServicePlan.hostingSubType = input.hostingSubType;
				}
			}

			const serviceSubscriptions = await prisma.serviceSubscription.findMany({
				where,
				include: {
					niscServicePlan: {
						select: {
							name: true,
							planType: true,
							hostingSubType: true,
						},
					},
				},
				orderBy: {
					createdAt: "desc",
				},
			});

			return serviceSubscriptions.map((subscription) => ({
				id: subscription.id,
				niscServicePlanId: subscription.niscServicePlanId,
				teamId: subscription.teamId,
				orderId: subscription.orderId,
				subscriptionDate: subscription.subscriptionDate,
				billingCycle: subscription.billingCycle as any,
				nextRenewalDate: subscription.nextRenewalDate,
				status: subscription.status as any,
				autoRenew: subscription.autoRenew,
				hostingSubscriptionId: subscription.hostingSubscriptionId,
				notes: subscription.notes,
				createdAt: subscription.createdAt,
				updatedAt: subscription.updatedAt,
				planType: subscription.niscServicePlan.planType as any,
				hostingSubType: subscription.niscServicePlan.hostingSubType as any,
				planName: subscription.niscServicePlan.name,
			}));
		}),
});

