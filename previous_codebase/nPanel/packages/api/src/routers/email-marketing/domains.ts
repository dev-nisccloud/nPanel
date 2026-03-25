import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../../trpc";
import prisma from "@npanel/db";
import { getResendClient, handleResendError } from "../../lib/resend-client";
import {
	emailDomainCreateInputSchema,
	emailDomainUpdateInputSchema,
	emailDomainListFiltersSchema,
	emailDomainDetailSchema,
	emailDomainListResponseSchema,
} from "./schemas";

/**
 * Map Resend domain status to our EmailDomainStatus enum
 * Always returns a valid status, defaulting to PENDING for unknown statuses
 */
function mapResendStatusToDbStatus(resendStatus: string | null | undefined): "PENDING" | "VERIFIED" | "FAILED" | "EXPIRED" {
	if (!resendStatus) return "PENDING";
	
	const status = resendStatus.toLowerCase();
	
	if (status === "verified") {
		return "VERIFIED";
	} else if (status === "not_started" || status === "pending") {
		return "PENDING";
	} else if (status === "failed" || status === "failure") {
		return "FAILED";
	} else if (status === "expired") {
		return "EXPIRED";
	}
	
	// Default to PENDING for any unknown status
	return "PENDING";
}

export const emailMarketingDomainsRouter = router({
	/**
	 * Create a new email domain
	 * Adds domain to Resend and stores in our database
	 */
	create: protectedProcedure
		.input(emailDomainCreateInputSchema)
		.mutation(async ({ ctx, input }) => {
			try {
				const userId = ctx.session?.user?.id;
				if (!userId) {
					throw new TRPCError({
						code: "UNAUTHORIZED",
						message: "User session not found",
					});
				}

				// Check if domain already exists
				const existingDomain = await prisma.emailDomain.findUnique({
					where: { domainName: input.domainName },
				});

				if (existingDomain) {
					throw new TRPCError({
						code: "CONFLICT",
						message: "Domain already exists",
					});
				}

			// Add domain to Resend
			const resend = getResendClient();
			let resendDomainId: string | null = null;
			let dnsRecords: any = null;
			let verificationStatus: string | null = null;

			try {
				const resendResponse = await resend.domains.create({
					name: input.domainName,
				});

				if (resendResponse.error) {
					throw new Error(resendResponse.error.message);
				}

				if (resendResponse.data) {
					resendDomainId = resendResponse.data.id;
					verificationStatus = resendResponse.data.status ?? null;
					// Store DNS records from Resend response
					if (resendResponse.data.records) {
						dnsRecords = JSON.parse(JSON.stringify(resendResponse.data.records));
					}
				}
			} catch (error) {
				// Log error but don't fail - we'll store the domain and verify later
				console.error("Error adding domain to Resend:", error);
			}

			// Create domain in database and activity log in a single transaction
			const now = new Date();
			const domain = await prisma.$transaction(async (tx) => {
				const newDomain = await tx.emailDomain.create({
					data: {
						id: crypto.randomUUID(),
						domainName: input.domainName,
						resendDomainId,
						status: "PENDING",
						verificationStatus,
						dnsRecords,
						userId,
						teamId: input.teamId ?? null,
						createdAt: now,
						updatedAt: now,
					},
				});

					await tx.emailDomainActivityLog.create({
						data: {
							id: crypto.randomUUID(),
							userId,
							emailDomainId: newDomain.id,
							action: "CREATE",
							description: `Domain ${input.domainName} added`,
							createdAt: now,
						},
					});

					return newDomain;
				});

				return emailDomainDetailSchema.parse({
					...domain,
					verificationStatus: domain.verificationStatus ?? null,
					verificationData: domain.verificationData ?? null,
					dnsRecords: domain.dnsRecords ?? null,
				});
			} catch (error) {
				if (error instanceof TRPCError) {
					throw error;
				}
				console.error("Error creating email domain:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to create email domain",
					cause: error,
				});
			}
		}),

	/**
	 * Get domain by ID
	 */
	getById: protectedProcedure
		.input(z.object({ id: z.string().min(1) }))
		.query(async ({ ctx, input }) => {
			try {
				const userId = ctx.session?.user?.id;
				if (!userId) {
					throw new TRPCError({
						code: "UNAUTHORIZED",
						message: "User session not found",
					});
				}

				const domain = await prisma.emailDomain.findUnique({
					where: { id: input.id },
				});

				if (!domain) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Domain not found",
					});
				}

				// Check access (user must own it or be in the team)
				if (domain.userId !== userId) {
					if (domain.teamId) {
						// Check if user is in the team
						const teamMember = await prisma.teamMember.findUnique({
							where: {
								teamId_userId: {
									teamId: domain.teamId,
									userId,
								},
							},
						});

						if (!teamMember) {
							throw new TRPCError({
								code: "FORBIDDEN",
								message: "Access denied",
							});
						}
					} else {
						throw new TRPCError({
							code: "FORBIDDEN",
							message: "Access denied",
						});
					}
				}

				// Sync with Resend to get latest verification status
				if (domain.resendDomainId) {
					try {
						const resend = getResendClient();
						const resendResponse = await resend.domains.get(
							domain.resendDomainId,
						);

						if (resendResponse.data && !resendResponse.error) {
							const resendDomain = resendResponse.data;

							// Map Resend status to our database status
							const status = mapResendStatusToDbStatus(resendDomain.status);

							// Update DNS records if available
							const dnsRecords = resendDomain.records
								? JSON.parse(JSON.stringify(resendDomain.records))
								: null;

							// Always update database with latest status from Resend
							const updateData: any = {
								status,
								verificationStatus: resendDomain.status ?? null,
								verifiedAt:
									status === "VERIFIED" && !domain.verifiedAt
										? new Date()
										: domain.verifiedAt,
								updatedAt: new Date(),
							};

							// Add JSON fields conditionally
							if (resendDomain) {
								updateData.verificationData = JSON.parse(JSON.stringify(resendDomain));
							}
							if (dnsRecords) {
								updateData.dnsRecords = dnsRecords;
							}

							await prisma.emailDomain.update({
								where: { id: domain.id },
								data: updateData,
							});

							// Update local domain object for return
							domain.status = status;
							domain.verificationStatus = resendDomain.status ?? null;
							domain.dnsRecords = dnsRecords;
						}
					} catch (error) {
						// Log but don't fail - return cached data
						console.error("Error syncing domain with Resend:", error);
					}
				}

				return emailDomainDetailSchema.parse({
					...domain,
					verificationStatus: domain.verificationStatus ?? null,
					verificationData: domain.verificationData ?? null,
					dnsRecords: domain.dnsRecords ?? null,
				});
			} catch (error) {
				if (error instanceof TRPCError) {
					throw error;
				}
				console.error("Error fetching email domain:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to fetch email domain",
					cause: error,
				});
			}
		}),

	/**
	 * List email domains with filters
	 */
	list: protectedProcedure
		.input(emailDomainListFiltersSchema)
		.query(async ({ ctx, input }) => {
			try {
				const userId = ctx.session?.user?.id;
				if (!userId) {
					throw new TRPCError({
						code: "UNAUTHORIZED",
						message: "User session not found",
					});
				}

				// Build where clause
				const where: any = {
					OR: [
						{ userId },
						...(input.teamId
							? [
									{
										teamId: input.teamId,
										team: {
											members: {
												some: { userId },
											},
										},
									},
								]
							: []),
					],
				};

				if (input.status) {
					where.status = input.status;
				}

				if (input.search) {
					where.domainName = {
						contains: input.search,
						mode: "insensitive",
					};
				}

				// Get domains
				const [domains, total] = await Promise.all([
					prisma.emailDomain.findMany({
						where,
						skip: input.offset,
						take: input.limit,
						orderBy: { createdAt: "desc" },
					}),
					prisma.emailDomain.count({ where }),
				]);

				return emailDomainListResponseSchema.parse({
					domains: domains.map((d) => ({
						...d,
						resendDomainId: d.resendDomainId ?? null,
						teamId: d.teamId ?? null,
						verifiedAt: d.verifiedAt ?? null,
					})),
					total,
				});
			} catch (error) {
				if (error instanceof TRPCError) {
					throw error;
				}
				console.error("Error listing email domains:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to list email domains",
					cause: error,
				});
			}
		}),

	/**
	 * Update email domain
	 */
	update: protectedProcedure
		.input(emailDomainUpdateInputSchema)
		.mutation(async ({ ctx, input }) => {
			try {
				const userId = ctx.session?.user?.id;
				if (!userId) {
					throw new TRPCError({
						code: "UNAUTHORIZED",
						message: "User session not found",
					});
				}

				const domain = await prisma.emailDomain.findUnique({
					where: { id: input.id },
				});

				if (!domain) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Domain not found",
					});
				}

				// Check access
				if (domain.userId !== userId) {
					if (domain.teamId) {
						const teamMember = await prisma.teamMember.findUnique({
							where: {
								teamId_userId: {
									teamId: domain.teamId,
									userId,
								},
							},
						});

						if (!teamMember) {
							throw new TRPCError({
								code: "FORBIDDEN",
								message: "Access denied",
							});
						}
					} else {
						throw new TRPCError({
							code: "FORBIDDEN",
							message: "Access denied",
						});
					}
				}

				// Update domain and create activity log in a single transaction
				const updatedDomain = await prisma.$transaction(async (tx) => {
					const updated = await tx.emailDomain.update({
						where: { id: input.id },
						data: {
							...(input.domainName && { domainName: input.domainName }),
							...(input.status && { status: input.status }),
							...(input.verificationStatus !== undefined && {
								verificationStatus: input.verificationStatus,
							}),
							...(input.verificationData !== undefined && {
								verificationData: input.verificationData ?? undefined,
							}),
							...(input.dnsRecords !== undefined && {
								dnsRecords: input.dnsRecords ?? undefined,
							}),
							updatedAt: new Date(),
						},
					});

					await tx.emailDomainActivityLog.create({
						data: {
							id: crypto.randomUUID(),
							userId,
							emailDomainId: domain.id,
							action: "UPDATE",
							description: `Domain ${domain.domainName} updated`,
							createdAt: new Date(),
						},
					});

					return updated;
				});

				return emailDomainDetailSchema.parse({
					...updatedDomain,
					verificationStatus: updatedDomain.verificationStatus ?? null,
					verificationData: updatedDomain.verificationData ?? null,
					dnsRecords: updatedDomain.dnsRecords ?? null,
				});
			} catch (error) {
				if (error instanceof TRPCError) {
					throw error;
				}
				console.error("Error updating email domain:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to update email domain",
					cause: error,
				});
			}
		}),

	/**
	 * Delete email domain
	 */
	delete: protectedProcedure
		.input(z.object({ id: z.string().min(1) }))
		.mutation(async ({ ctx, input }) => {
			try {
				const userId = ctx.session?.user?.id;
				if (!userId) {
					throw new TRPCError({
						code: "UNAUTHORIZED",
						message: "User session not found",
					});
				}

				const domain = await prisma.emailDomain.findUnique({
					where: { id: input.id },
				});

				if (!domain) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Domain not found",
					});
				}

				// Check access
				if (domain.userId !== userId) {
					if (domain.teamId) {
						const teamMember = await prisma.teamMember.findUnique({
							where: {
								teamId_userId: {
									teamId: domain.teamId,
									userId,
								},
							},
						});

						if (!teamMember || teamMember.role !== "OWNER") {
							throw new TRPCError({
								code: "FORBIDDEN",
								message: "Access denied",
							});
						}
					} else {
						throw new TRPCError({
							code: "FORBIDDEN",
							message: "Access denied",
						});
					}
				}

				// Remove from Resend if it exists
				if (domain.resendDomainId) {
					try {
						const resend = getResendClient();
						await resend.domains.remove(domain.resendDomainId);
					} catch (error) {
						// Log but continue with deletion
						console.error("Error removing domain from Resend:", error);
					}
				}

				// Delete from database (cascade will handle related records)
				await prisma.emailDomain.delete({
					where: { id: input.id },
				});

				return { success: true };
			} catch (error) {
				if (error instanceof TRPCError) {
					throw error;
				}
				console.error("Error deleting email domain:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to delete email domain",
					cause: error,
				});
			}
		}),

	/**
	 * Verify domain with Resend
	 */
	verify: protectedProcedure
		.input(z.object({ id: z.string().min(1) }))
		.mutation(async ({ ctx, input }) => {
			try {
				const userId = ctx.session?.user?.id;
				if (!userId) {
					throw new TRPCError({
						code: "UNAUTHORIZED",
						message: "User session not found",
					});
				}

				const domain = await prisma.emailDomain.findUnique({
					where: { id: input.id },
				});

				if (!domain || !domain.resendDomainId) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Domain not found or not added to Resend",
					});
				}

				// Check access
				if (domain.userId !== userId) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "Access denied",
					});
				}

				// Get latest status from Resend
				const resend = getResendClient();
				const resendResponse = await resend.domains.get(domain.resendDomainId);

				if (resendResponse.error) {
					handleResendError(resendResponse.error);
				}

				if (!resendResponse.data) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Domain not found in Resend",
					});
				}

				const resendDomain = resendResponse.data;

				// Map Resend status to our database status (always update, not just when changed)
				const status = mapResendStatusToDbStatus(resendDomain.status);

				const dnsRecords = resendDomain.records
					? JSON.parse(JSON.stringify(resendDomain.records))
					: null;

				// Update domain and create activity log in a single transaction
				// Always update with latest status from Resend
				const updateData: any = {
					status, // Always update with mapped status from Resend
					verificationStatus: resendDomain.status ?? null, // Store raw Resend status
					verifiedAt:
						status === "VERIFIED" && !domain.verifiedAt
							? new Date()
							: domain.verifiedAt,
					updatedAt: new Date(),
				};

				// Add JSON fields conditionally
				if (resendDomain) {
					updateData.verificationData = JSON.parse(JSON.stringify(resendDomain));
				}
				if (dnsRecords) {
					updateData.dnsRecords = dnsRecords;
				}

				const updatedDomain = await prisma.$transaction(async (tx) => {
					const updated = await tx.emailDomain.update({
						where: { id: input.id },
						data: updateData,
					});

					await tx.emailDomainActivityLog.create({
						data: {
							id: crypto.randomUUID(),
							userId,
							emailDomainId: domain.id,
							action: "VERIFY",
							description: `Domain ${domain.domainName} verification checked`,
							createdAt: new Date(),
						},
					});

					return updated;
				});

				return emailDomainDetailSchema.parse({
					...updatedDomain,
					verificationStatus: updatedDomain.verificationStatus ?? null,
					verificationData: updatedDomain.verificationData ?? null,
					dnsRecords: updatedDomain.dnsRecords ?? null,
				});
			} catch (error) {
				if (error instanceof TRPCError) {
					throw error;
				}
				console.error("Error verifying email domain:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to verify email domain",
					cause: error,
				});
			}
		}),
});
