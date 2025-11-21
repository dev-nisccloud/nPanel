import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import prisma from "@nPanel/db";
import * as crypto from "crypto";

// ============================================================================
// ZOD SCHEMAS - Independent from database schema
// ============================================================================

const linkToTeamInputSchema = z.object({
	teamId: z.string(),
	hostingPlanId: z.string().optional(), // Optional link to hosting subscription
	installationId: z.number().int().positive(), // WordPress installation ID from WP Toolkit
});

const linkToTeamOutputSchema = z.object({
	success: z.boolean(),
	id: z.string(),
});

const getByInstallationIdInputSchema = z.object({
	installationId: z.number().int().positive(),
});

const getByInstallationIdOutputSchema = z.object({
	id: z.string(),
	teamId: z.string().nullable(),
	installationId: z.number(),
	hostingSubscriptionId: z.string().nullable(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

const unlinkFromTeamInputSchema = z.object({
	subscriptionId: z.string(),
});

const unlinkFromTeamOutputSchema = z.object({
	success: z.boolean(),
});

const updateSubscriptionInputSchema = z.object({
	subscriptionId: z.string(),
	hostingPlanId: z.string().optional(),
}).refine(
	(data) => {
		// At least one field must be provided for update
		return data.hostingPlanId !== undefined;
	},
	{
		message: "At least one field must be provided for update",
	},
);

const updateSubscriptionOutputSchema = z.object({
	success: z.boolean(),
	id: z.string(),
});

const getDetailWithSubscriptionInputSchema = z.object({
	installationId: z.number().int().positive(),
});

const getDetailWithSubscriptionOutputSchema = z.object({
	installation: z.any(), // WordPress installation data from WP Toolkit
	subscription: getByInstallationIdOutputSchema.nullable(),
});

// ============================================================================
// tRPC ROUTER
// ============================================================================

export const wordpressSubscriptionsRouter = router({
	// Get WordPress installation detail with subscription link (batched)
	getDetailWithSubscription: protectedProcedure
		.input(getDetailWithSubscriptionInputSchema)
		.output(getDetailWithSubscriptionOutputSchema)
		.query(async ({ ctx, input }) => {
			const session = ctx.session;
			if (!session?.user?.id) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You must be logged in to view subscriptions",
				});
			}

			// Fetch WordPress installation and subscription link in parallel
			const [installationResult, subscriptionResult] = await Promise.allSettled([
				// Fetch from WP Toolkit
				(async () => {
					const { sendPleskRestRequest } = await import('../lib/plesk/rest-client');
					
					if (!process.env.PLESK_REST_ENDPOINT) {
						throw new TRPCError({
							code: "INTERNAL_SERVER_ERROR",
							message: "Server configuration error: PLESK_REST_ENDPOINT environment variable is not set",
						});
					}

					const endpoint = `/v1/installations/${input.installationId}`;
					const { data, isAuthError, isHostUnreachable, statusCode } =
						await sendPleskRestRequest(endpoint, 'GET');

					if (isHostUnreachable) {
						throw new TRPCError({
							code: "SERVICE_UNAVAILABLE",
							message: "Plesk host is unreachable",
						});
					}

					if (isAuthError) {
						throw new TRPCError({
							code: "UNAUTHORIZED",
							message: "Invalid Plesk credentials",
						});
					}

					if (statusCode === 404) {
						throw new TRPCError({
							code: "NOT_FOUND",
							message: `WordPress installation with ID ${input.installationId} not found`,
						});
					}

					if (statusCode < 200 || statusCode >= 300 || !data) {
						throw new TRPCError({
							code: "INTERNAL_SERVER_ERROR",
							message: `WP Toolkit API returned status ${statusCode}: ${JSON.stringify(data)}`,
						});
					}

					return data;
				})().catch((error) => {
					// Re-throw TRPCErrors as-is, wrap other errors
					if (error instanceof TRPCError) {
						throw error;
					}
					throw new TRPCError({
						code: "INTERNAL_SERVER_ERROR",
						message: error instanceof Error ? error.message : "Failed to fetch WordPress installation",
					});
				}),
				// Fetch subscription link from database
				prisma.wordPressInstance
					.findUnique({
						where: { installationId: input.installationId },
						select: {
							id: true,
							teamId: true,
							installationId: true,
							hostingSubscriptionId: true,
							createdAt: true,
							updatedAt: true,
						},
					})
					.then((sub) => {
						if (!sub) return null;
						return {
							id: sub.id,
							teamId: sub.teamId,
							installationId: sub.installationId,
							hostingSubscriptionId: sub.hostingSubscriptionId,
							createdAt: sub.createdAt,
							updatedAt: sub.updatedAt,
						};
					})
					.catch(() => null),
			]);

			// Handle installation result
			if (installationResult.status === 'rejected') {
				const error = installationResult.reason;
				// Re-throw TRPCErrors as-is
				if (error instanceof TRPCError) {
					throw error;
				}
				// Wrap other errors
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: error instanceof Error ? error.message : "Failed to fetch WordPress installation",
				});
			}

			const installation = installationResult.value;
			const subscription = subscriptionResult.status === 'fulfilled' 
				? subscriptionResult.value 
				: null;

			// If installation is null or undefined, throw NOT_FOUND error
			if (!installation) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: `WordPress installation with ID ${input.installationId} not found`,
				});
			}

			return {
				installation,
				subscription,
			};
		}),

	// Get subscription by WordPress installation ID
	getByInstallationId: protectedProcedure
		.input(getByInstallationIdInputSchema)
		.output(getByInstallationIdOutputSchema)
		.query(async ({ ctx, input }) => {
			const session = ctx.session;
			if (!session?.user?.id) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You must be logged in to view subscriptions",
				});
			}

			const subscription = await prisma.wordPressInstance.findUnique({
				where: { installationId: input.installationId },
				include: {
					team: true,
				},
			});

			if (!subscription) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "WordPress subscription not found",
				});
			}

			return {
				id: subscription.id,
				teamId: subscription.teamId,
				installationId: subscription.installationId,
				hostingSubscriptionId: subscription.hostingSubscriptionId,
				createdAt: subscription.createdAt,
				updatedAt: subscription.updatedAt,
			};
		}),

	// Link an existing WordPress installation to a team
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

			// Check if WordPress instance with this installationId already exists
			const existingInstance = await prisma.wordPressInstance.findUnique({
				where: { installationId: input.installationId },
			});

			if (existingInstance) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "A WordPress instance with this installation ID already exists",
				});
			}

			// Get hosting plan if provided
			let hostingPlanId: string | null = null;

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
			}

			// Create the WordPress instance record
			const instance = await prisma.wordPressInstance.create({
				data: {
					id: crypto.randomUUID(),
					teamId: input.teamId,
					installationId: input.installationId,
					hostingSubscriptionId: hostingPlanId, // Link to hosting subscription if provided
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			});

			// Log activity
			await prisma.wordPressInstanceActivityLog.create({
				data: {
					id: crypto.randomUUID(),
					wordpressInstanceId: instance.id,
					userId: userId,
					action: "LINK_TO_TEAM",
					description: `Linked WordPress instance to team: ${team.name}`,
					metadata: {
						teamId: team.id,
						teamName: team.name,
						installationId: input.installationId,
					},
					createdAt: new Date(),
				},
			});

			return {
				success: true,
				id: instance.id,
			};
		}),

	// Unlink WordPress instance from team
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

			// Find the WordPress instance
			const instance = await prisma.wordPressInstance.findUnique({
				where: { id: input.subscriptionId },
				include: {
					team: true,
				},
			});

			if (!instance) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "WordPress instance not found",
				});
			}

			if (!instance.teamId) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "WordPress instance is not linked to any team",
				});
			}

			const teamName = instance.team?.name || "Unknown Team";

			// Log activity before deletion (we need the instance ID)
			await prisma.wordPressInstanceActivityLog.create({
				data: {
					id: crypto.randomUUID(),
					wordpressInstanceId: instance.id,
					userId: userId,
					action: "UNLINK_FROM_TEAM",
					description: `Unlinked WordPress instance from team: ${teamName}. Instance deleted.`,
					metadata: {
						previousTeamId: instance.teamId,
						previousTeamName: teamName,
						installationId: instance.installationId,
						deleted: true,
					},
					createdAt: new Date(),
				},
			});

			// Delete the WordPress instance entirely so it can be linked to another team later
			await prisma.wordPressInstance.delete({
				where: { id: input.subscriptionId },
			});

			return {
				success: true,
			};
		}),

	// Update WordPress instance subscription
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

			// Find the WordPress instance
			const existingInstance = await prisma.wordPressInstance.findUnique({
				where: { id: input.subscriptionId },
			});

			if (!existingInstance) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "WordPress instance not found",
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

				updateData.hostingSubscriptionId = input.hostingPlanId;
			}

			// Update the WordPress instance
			const updatedInstance = await prisma.wordPressInstance.update({
				where: { id: input.subscriptionId },
				data: updateData,
			});

			// Log activity
			await prisma.wordPressInstanceActivityLog.create({
				data: {
					id: crypto.randomUUID(),
					wordpressInstanceId: updatedInstance.id,
					userId: userId,
					action: "UPDATE",
					description: "WordPress instance updated",
					metadata: {
						updatedFields: Object.keys(updateData).filter(key => key !== "updatedAt"),
					},
					createdAt: new Date(),
				},
			});

			return {
				success: true,
				id: updatedInstance.id,
			};
		}),
});

