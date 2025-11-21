import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../trpc";
import prisma from "@nPanel/db";

// ============================================================================
// ZOD SCHEMAS - Independent from database schema
// ============================================================================

const linkToTeamInputSchema = z.object({
	subscriptionId: z.string(),
	teamId: z.string(),
	hostingPlanId: z.string().optional(),
	pleskFilterId: z.string().min(1, "Plesk Filter ID is required"),
	hostingType: z.enum(["WEB_HOSTING", "EMAIL_HOSTING", "RESELLER_HOSTING", "VPS_HOSTING", "DEDICATED_HOSTING"]).optional(),
	billingCycle: z.enum(["YEARLY", "MONTHLY", "BIENNIALLY", "CUSTOM"]).optional(),
	nextRenewalDate: z.coerce.date().optional(),
	expiryDate: z.coerce.date().optional(),
	primaryDomain: z.string().optional(),
	notes: z.string().optional(),
	autoRenew: z.boolean().default(true),
});

const linkToTeamOutputSchema = z.object({
	success: z.boolean(),
	id: z.string(),
});

const getByPleskFilterIdInputSchema = z.object({
	pleskFilterId: z.string().min(1, "Plesk Filter ID is required"),
});

const getByPleskFilterIdOutputSchema = z.object({
	id: z.string(),
	teamId: z.string().nullable(),
	hostingPlanId: z.string(),
	primaryDomain: z.string().nullable(),
	billingCycle: z.enum(["YEARLY", "MONTHLY", "BIENNIALLY", "CUSTOM"]),
	nextRenewalDate: z.date().nullable(),
	expiryDate: z.date().nullable(),
	notes: z.string().nullable(),
	autoRenew: z.boolean(),
	hostingType: z.enum(["WEB_HOSTING", "EMAIL_HOSTING", "RESELLER_HOSTING", "VPS_HOSTING", "DEDICATED_HOSTING"]),
}).nullable();

const unlinkFromTeamInputSchema = z.object({
	subscriptionId: z.string(),
});

const unlinkFromTeamOutputSchema = z.object({
	success: z.boolean(),
});

const updateSubscriptionInputSchema = z.object({
	subscriptionId: z.string(),
	hostingPlanId: z.string().optional(),
	billingCycle: z.enum(["YEARLY", "MONTHLY", "BIENNIALLY", "CUSTOM"]).optional(),
	nextRenewalDate: z.coerce.date().optional(),
	expiryDate: z.coerce.date().optional(),
	primaryDomain: z.string().optional(),
	notes: z.string().optional(),
	autoRenew: z.boolean().optional(),
}).refine(
	(data) => {
		// At least one field must be provided for update
		return (
			data.hostingPlanId !== undefined ||
			data.billingCycle !== undefined ||
			data.nextRenewalDate !== undefined ||
			data.expiryDate !== undefined ||
			data.primaryDomain !== undefined ||
			data.notes !== undefined ||
			data.autoRenew !== undefined
		);
	},
	{
		message: "At least one field must be provided for update",
	},
);

const updateSubscriptionOutputSchema = z.object({
	success: z.boolean(),
	id: z.string(),
});

export const hostingRouter = router({
	// Get subscription by Plesk Filter ID
	getByPleskFilterId: protectedProcedure
		.input(getByPleskFilterIdInputSchema)
		.output(getByPleskFilterIdOutputSchema)
		.query(async ({ ctx, input }) => {
			const session = ctx.session;
			if (!session?.user?.id) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You must be logged in to view subscriptions",
				});
			}

			const subscription = await prisma.hostingSubscription.findUnique({
				where: { pleskFilterId: input.pleskFilterId },
				select: {
					id: true,
					teamId: true,
					hostingPlanId: true,
					primaryDomain: true,
					billingCycle: true,
					nextRenewalDate: true,
					expiryDate: true,
					notes: true,
					autoRenew: true,
					hostingType: true,
				},
			});

			if (!subscription) {
				return null;
			}

			return {
				id: subscription.id,
				teamId: subscription.teamId,
				hostingPlanId: subscription.hostingPlanId,
				primaryDomain: subscription.primaryDomain,
				billingCycle: subscription.billingCycle as any,
				nextRenewalDate: subscription.nextRenewalDate,
				expiryDate: subscription.expiryDate,
				notes: subscription.notes,
				autoRenew: subscription.autoRenew,
				hostingType: subscription.hostingType as any,
			};
		}),
	// Link an existing Plesk subscription to a team
	linkToTeam: protectedProcedure
		.input(linkToTeamInputSchema)
		.output(linkToTeamOutputSchema)
		.mutation(async ({ ctx, input }) => {
			const session = ctx.session;
			if (!session?.user?.id) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You must be logged in to link subscriptions",
				});
			}

			const userId = session.user.id;

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

			// Check if subscription with this pleskFilterId already exists
			const existingSubscription = await prisma.hostingSubscription.findUnique({
				where: { pleskFilterId: input.pleskFilterId },
			});

			if (existingSubscription) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "A subscription with this Plesk Filter ID already exists",
				});
			}

			// Get hosting plan - use provided one or find a default/active plan
			let hostingPlanId: string;

			if (input.hostingPlanId) {
				// Verify the provided plan exists and is active
				const providedPlan = await prisma.hostingPlan.findUnique({
					where: { id: input.hostingPlanId },
				});

				if (!providedPlan) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Hosting plan not found",
					});
				}

				if (!providedPlan.isActive) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Selected hosting plan is not active",
					});
				}

				hostingPlanId = providedPlan.id;
			} else {
				// Try to find a default plan matching the hosting type
				const defaultPlan = await prisma.hostingPlan.findFirst({
					where: {
						isDefault: true,
						isActive: true,
						hostingType: input.hostingType || "WEB_HOSTING",
					},
				});

				if (!defaultPlan) {
					// If no default plan, get any active plan of the same type
					const anyPlan = await prisma.hostingPlan.findFirst({
						where: {
							isActive: true,
							hostingType: input.hostingType || "WEB_HOSTING",
						},
					});

					if (!anyPlan) {
						throw new TRPCError({
							code: "BAD_REQUEST",
							message: "No hosting plan found. Please select a hosting plan or create one first.",
						});
					}

					hostingPlanId = anyPlan.id;
				} else {
					hostingPlanId = defaultPlan.id;
				}
			}

			// Create the subscription record
			const subscription = await prisma.hostingSubscription.create({
				data: {
					id: crypto.randomUUID(),
					hostingPlanId,
					teamId: input.teamId,
					provisionedBy: userId,
					pleskFilterId: input.pleskFilterId,
					hostingType: input.hostingType || "WEB_HOSTING",
					billingCycle: input.billingCycle || "MONTHLY",
					nextRenewalDate: input.nextRenewalDate,
					expiryDate: input.expiryDate,
					primaryDomain: input.primaryDomain,
					notes: input.notes,
					autoRenew: input.autoRenew,
					status: "ACTIVE", // Default status for linked subscriptions
					provisioningMethod: "MANUAL", // Since we're manually linking
					operation: "PROVISION",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			});

			// Log activity
			await prisma.hostingSubscriptionActivityLog.create({
				data: {
					id: crypto.randomUUID(),
					hostingSubscriptionId: subscription.id,
					userId: userId,
					action: "LINK_TO_TEAM",
					description: `Linked subscription to team: ${team.name}`,
					metadata: {
						teamId: team.id,
						teamName: team.name,
						pleskFilterId: input.pleskFilterId,
					},
					createdAt: new Date(),
				},
			});

			return {
				success: true,
				id: subscription.id,
			};
		}),

	// Unlink subscription from team
	unlinkFromTeam: protectedProcedure
		.input(unlinkFromTeamInputSchema)
		.output(unlinkFromTeamOutputSchema)
		.mutation(async ({ ctx, input }) => {
			const session = ctx.session;
			if (!session?.user?.id) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You must be logged in to unlink subscriptions",
				});
			}

			const userId = session.user.id;

			// Find the subscription
			const subscription = await prisma.hostingSubscription.findUnique({
				where: { id: input.subscriptionId },
				include: {
					team: true,
				},
			});

			if (!subscription) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Subscription not found",
				});
			}

			if (!subscription.teamId) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Subscription is not linked to any team",
				});
			}

		const teamName = subscription.team?.name || "Unknown Team";
		const pleskFilterId = subscription.pleskFilterId;
		const now = new Date();

		// Log activity - UserActivityLog (before deletion)
		await prisma.userActivityLog.create({
			data: {
				id: crypto.randomUUID(),
				userId: userId,
				action: "HOSTING_SUBSCRIPTION_DELETION_STARTED",
				description: `Starting deletion of hosting subscription ${subscription.pleskName || subscription.id}`,
				metadata: {
					subscriptionId: subscription.id,
					teamId: subscription.teamId,
					teamName: teamName,
					pleskFilterId: subscription.pleskFilterId,
					pleskServiceId: subscription.pleskServiceId,
					status: subscription.status,
				},
				createdAt: now,
			},
		});

		// Log activity - HostingSubscriptionActivityLog (before deletion so subscription ID exists)
		await prisma.hostingSubscriptionActivityLog.create({
			data: {
				id: crypto.randomUUID(),
				hostingSubscriptionId: subscription.id,
				userId: userId,
				action: "TERMINATE",
				description: `Subscription terminated and unlinked from team: ${teamName}. Subscription deleted.`,
				metadata: {
					previousTeamId: subscription.teamId,
					previousTeamName: teamName,
					pleskFilterId: subscription.pleskFilterId,
					pleskServiceId: subscription.pleskServiceId,
					pleskName: subscription.pleskName,
					status: subscription.status,
					deleted: true,
					reason: "unlink_from_team",
				},
				createdAt: now,
			},
		});

		// Delete the subscription entirely so it can be linked to another team later
		await prisma.hostingSubscription.delete({
			where: { id: input.subscriptionId },
		});

		// Log activity - UserActivityLog (after deletion)
		await prisma.userActivityLog.create({
			data: {
				id: crypto.randomUUID(),
				userId: userId,
				action: "HOSTING_SUBSCRIPTION_DELETED",
				description: `Hosting subscription ${subscription.pleskName || subscription.id} deleted successfully`,
				metadata: {
					subscriptionId: subscription.id,
					teamId: subscription.teamId,
					teamName: teamName,
					pleskFilterId: subscription.pleskFilterId,
					pleskServiceId: subscription.pleskServiceId,
					status: subscription.status,
					deletedBy: userId,
				},
				createdAt: now,
			},
		});

		return {
			success: true,
		};
		}),

	// Update subscription
	updateSubscription: protectedProcedure
		.input(updateSubscriptionInputSchema)
		.output(updateSubscriptionOutputSchema)
		.mutation(async ({ ctx, input }) => {
			const session = ctx.session;
			if (!session?.user?.id) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You must be logged in to update subscriptions",
				});
			}

			const userId = session.user.id;

			// Find the subscription
			const existingSubscription = await prisma.hostingSubscription.findUnique({
				where: { id: input.subscriptionId },
			});

			if (!existingSubscription) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Subscription not found",
				});
			}

			// Build update data - only include fields that are provided
			const updateData: any = {
				updatedAt: new Date(),
			};

			if (input.hostingPlanId !== undefined) {
				// Verify the plan exists and is active
				const plan = await prisma.hostingPlan.findUnique({
					where: { id: input.hostingPlanId },
				});

				if (!plan) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Hosting plan not found",
					});
				}

				if (!plan.isActive) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Selected hosting plan is not active",
					});
				}

				updateData.hostingPlanId = input.hostingPlanId;
			}

			if (input.billingCycle !== undefined) {
				updateData.billingCycle = input.billingCycle;
			}

			if (input.nextRenewalDate !== undefined) {
				updateData.nextRenewalDate = input.nextRenewalDate;
			}

			if (input.expiryDate !== undefined) {
				updateData.expiryDate = input.expiryDate;
			}

			if (input.primaryDomain !== undefined) {
				updateData.primaryDomain = input.primaryDomain || null;
			}

			if (input.notes !== undefined) {
				updateData.notes = input.notes || null;
			}

			if (input.autoRenew !== undefined) {
				updateData.autoRenew = input.autoRenew;
			}

			// Build metadata for logging - capture before and after values
			const updatedFields = Object.keys(updateData).filter(key => key !== "updatedAt");
			const changesMetadata: Record<string, any> = {
				updatedFields,
			};

			// Capture old values for comparison
			updatedFields.forEach((field) => {
				changesMetadata[`old_${field}`] = (existingSubscription as any)[field];
				changesMetadata[`new_${field}`] = updateData[field];
			});

			// Update the subscription
			const updatedSubscription = await prisma.hostingSubscription.update({
				where: { id: input.subscriptionId },
				data: updateData,
			});

			// Log activity - UserActivityLog
			await prisma.userActivityLog.create({
				data: {
					id: crypto.randomUUID(),
					userId: userId,
					action: "HOSTING_SUBSCRIPTION_UPDATED",
					description: `Updated hosting subscription ${updatedSubscription.pleskName || updatedSubscription.id}`,
					metadata: {
						subscriptionId: updatedSubscription.id,
						teamId: updatedSubscription.teamId,
						updatedFields,
						changes: changesMetadata,
					},
					createdAt: new Date(),
				},
			});

			// Log activity - HostingSubscriptionActivityLog (subscription-specific audit trail)
			await prisma.hostingSubscriptionActivityLog.create({
				data: {
					id: crypto.randomUUID(),
					hostingSubscriptionId: updatedSubscription.id,
					userId: userId,
					action: "UPDATE",
					description: `Subscription updated: ${updatedFields.join(", ")}`,
					metadata: {
						updatedFields,
						changes: changesMetadata,
						previousStatus: existingSubscription.status,
						newStatus: updatedSubscription.status,
					},
					createdAt: new Date(),
				},
			});

			return {
				success: true,
				id: updatedSubscription.id,
			};
		}),
});

