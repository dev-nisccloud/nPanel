import { TRPCError } from "@trpc/server";
import { and, count, desc, eq, ilike, or, sql } from "@npanel/db";
import * as crypto from "crypto";
import { db } from "@npanel/db";
import { emailDomain, emailDomainActivityLog } from "@npanel/db/schema/email-marketing";
import { teamMember } from "@npanel/db/schema/teams";
import { z } from "zod";
import { protectedProcedure, router } from "../../trpc";
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

async function assertTeamMember(teamId: string, userId: string) {
	const [member] = await db
		.select({ id: teamMember.id, role: teamMember.role })
		.from(teamMember)
		.where(and(eq(teamMember.teamId, teamId), eq(teamMember.userId, userId)))
		.limit(1);
	return member ?? null;
}

async function assertDomainAccess(domainId: string, userId: string) {
	const [domain] = await db
		.select()
		.from(emailDomain)
		.where(eq(emailDomain.id, domainId))
		.limit(1);

	if (!domain) {
		throw new TRPCError({ code: "NOT_FOUND", message: "Domain not found" });
	}

	if (domain.userId === userId) return domain;

	if (domain.teamId) {
		const member = await assertTeamMember(domain.teamId, userId);
		if (!member) {
			throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
		}
		return domain;
	}

	throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
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
				const [existingDomain] = await db
					.select({ id: emailDomain.id })
					.from(emailDomain)
					.where(eq(emailDomain.domainName, input.domainName))
					.limit(1);

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
			const domainId = crypto.randomUUID();
			const domain = await db.transaction(async (tx: any) => {
				await tx.insert(emailDomain).values({
					id: domainId,
					domainName: input.domainName,
					resendDomainId,
					status: "PENDING",
					verificationStatus,
					verificationData: null,
					dnsRecords,
					userId,
					teamId: input.teamId ?? null,
					createdAt: now,
					updatedAt: now,
					verifiedAt: null,
				});

				await tx.insert(emailDomainActivityLog).values({
					id: crypto.randomUUID(),
					userId,
					emailDomainId: domainId,
					action: "CREATE",
					description: `Domain ${input.domainName} added`,
					metadata: null,
					ipAddress: null,
					userAgent: null,
					createdAt: now,
				});

				const [created] = await tx
					.select()
					.from(emailDomain)
					.where(eq(emailDomain.id, domainId))
					.limit(1);
				return created!;
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

				const domain = await assertDomainAccess(input.id, userId);

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

							await db
								.update(emailDomain)
								.set(updateData)
								.where(eq(emailDomain.id, domain.id));

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

				const accessOr = [eq(emailDomain.userId, userId)];
				if (input.teamId) {
					accessOr.push(
						sql`(${emailDomain.teamId} = ${input.teamId} AND EXISTS (select 1 from ${teamMember} tm where tm.team_id = ${input.teamId} and tm.user_id = ${userId}))`,
					);
				}

				const conditions = [or(...accessOr)];
				if (input.status) conditions.push(eq(emailDomain.status, input.status));
				if (input.search)
					conditions.push(ilike(emailDomain.domainName, `%${input.search}%`));

				const whereClause = and(...conditions);

				const [domains, totalRes] = await Promise.all([
					db
						.select()
						.from(emailDomain)
						.where(whereClause)
						.orderBy(desc(emailDomain.createdAt))
						.limit(input.limit)
						.offset(input.offset),
					db.select({ value: count() }).from(emailDomain).where(whereClause),
				]);

				const total = Number(totalRes[0]?.value ?? 0);

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

				const domain = await assertDomainAccess(input.id, userId);

				// Update domain and create activity log in a single transaction
				const updatedDomain = await db.transaction(async (tx: any) => {
					await tx
						.update(emailDomain)
						.set({
							...(input.domainName && { domainName: input.domainName }),
							...(input.status && { status: input.status }),
							...(input.verificationStatus !== undefined && {
								verificationStatus: input.verificationStatus,
							}),
							...(input.verificationData !== undefined && {
								verificationData: input.verificationData ?? null,
							}),
							...(input.dnsRecords !== undefined && {
								dnsRecords: input.dnsRecords ?? null,
							}),
							updatedAt: new Date(),
						})
						.where(eq(emailDomain.id, input.id));

					await tx.insert(emailDomainActivityLog).values({
						id: crypto.randomUUID(),
						userId,
						emailDomainId: domain.id,
						action: "UPDATE",
						description: `Domain ${domain.domainName} updated`,
						metadata: null,
						ipAddress: null,
						userAgent: null,
						createdAt: new Date(),
					});

					const [updated] = await tx
						.select()
						.from(emailDomain)
						.where(eq(emailDomain.id, input.id))
						.limit(1);
					return updated!;
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

				const domain = await assertDomainAccess(input.id, userId);
				if (domain.teamId) {
					const member = await assertTeamMember(domain.teamId, userId);
					if (!member || member.role !== "OWNER") {
						throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
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
				await db.delete(emailDomain).where(eq(emailDomain.id, input.id));

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

				const [domain] = await db
					.select()
					.from(emailDomain)
					.where(eq(emailDomain.id, input.id))
					.limit(1);

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

				const updatedDomain = await db.transaction(async (tx: any) => {
					await tx
						.update(emailDomain)
						.set(updateData)
						.where(eq(emailDomain.id, input.id));

					await tx.insert(emailDomainActivityLog).values({
						id: crypto.randomUUID(),
						userId,
						emailDomainId: domain.id,
						action: "VERIFY",
						description: `Domain ${domain.domainName} verification checked`,
						metadata: null,
						ipAddress: null,
						userAgent: null,
						createdAt: new Date(),
					});

					const [updated] = await tx
						.select()
						.from(emailDomain)
						.where(eq(emailDomain.id, input.id))
						.limit(1);
					return updated!;
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
