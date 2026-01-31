import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../../trpc";
import prisma from "@nPanel/db";
import { enqueueCampaignSend } from "../../lib/qstash/campaign-send";
import {
	campaignCreateInputSchema,
	campaignUpdateInputSchema,
	campaignListFiltersSchema,
	campaignDetailSchema,
	campaignListResponseSchema,
	campaignSendInputSchema,
	campaignRecipientSummarySchema,
	campaignRecipientAddInputSchema,
	campaignRecipientListFiltersSchema,
	campaignRecipientListResponseSchema,
} from "./schemas";

function mapRecipient(r: {
	id: string;
	campaignId: string;
	toEmail: string;
	resendId: string | null;
	resendMessageId: string | null;
	createdAt: Date;
	updatedAt: Date;
}) {
	return campaignRecipientSummarySchema.parse({
		...r,
		resendId: r.resendId ?? null,
		resendMessageId: r.resendMessageId ?? null,
	});
}

export const emailMarketingCampaignsRouter = router({
	create: protectedProcedure
		.input(campaignCreateInputSchema)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session?.user?.id;
			if (!userId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "User session not found",
				});
			}

			if (input.emailDomainId) {
				const domain = await prisma.emailDomain.findUnique({
					where: { id: input.emailDomainId },
				});
				if (!domain || domain.status !== "VERIFIED") {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Email domain must be verified",
					});
				}
			}

			if (!input.htmlContent && !input.textContent) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "HTML or text content is required",
				});
			}

			const now = new Date();
			const campaign = await prisma.$transaction(async (tx) => {
				const newCampaign = await tx.emailCampaign.create({
					data: {
						id: crypto.randomUUID(),
						name: input.name,
						description: input.description ?? null,
						subject: input.subject,
						fromEmail: input.fromEmail,
						fromName: input.fromName ?? null,
						status: "DRAFT",
						htmlContent: input.htmlContent ?? null,
						textContent: input.textContent ?? null,
						scheduledAt: input.scheduledAt ?? null,
						emailDomainId: input.emailDomainId ?? null,
						userId,
						teamId: input.teamId ?? null,
						createdAt: now,
						updatedAt: now,
					},
				});

				for (const email of input.recipientEmails) {
					await tx.campaignRecipient.create({
						data: {
							id: crypto.randomUUID(),
							campaignId: newCampaign.id,
							toEmail: email,
							createdAt: now,
							updatedAt: now,
						},
					});
				}

				await tx.emailCampaignActivityLog.create({
					data: {
						id: crypto.randomUUID(),
						userId,
						campaignId: newCampaign.id,
						action: "CREATE",
						description: `Campaign ${input.name} created`,
						createdAt: now,
					},
				});

				return newCampaign;
			});

			const recipients = await prisma.campaignRecipient.findMany({
				where: { campaignId: campaign.id },
			});

			return campaignDetailSchema.parse({
				...campaign,
				description: campaign.description ?? null,
				fromName: campaign.fromName ?? null,
				emailDomainId: campaign.emailDomainId ?? null,
				htmlContent: campaign.htmlContent ?? null,
				textContent: campaign.textContent ?? null,
				scheduledAt: campaign.scheduledAt ?? null,
				sentAt: campaign.sentAt ?? null,
				recipientCount: recipients.length,
				recipients: recipients.map(mapRecipient),
			});
		}),

	getById: protectedProcedure
		.input(z.object({ id: z.string().min(1) }))
		.query(async ({ ctx, input }) => {
			const userId = ctx.session?.user?.id;
			if (!userId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "User session not found",
				});
			}

			const campaign = await prisma.emailCampaign.findUnique({
				where: { id: input.id },
				include: { recipients: true },
			});

			if (!campaign) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Campaign not found",
				});
			}

			if (campaign.userId !== userId) {
				if (campaign.teamId) {
					const member = await prisma.teamMember.findUnique({
						where: {
							teamId_userId: { teamId: campaign.teamId, userId },
						},
					});
					if (!member) {
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

			return campaignDetailSchema.parse({
				...campaign,
				description: campaign.description ?? null,
				fromName: campaign.fromName ?? null,
				emailDomainId: campaign.emailDomainId ?? null,
				htmlContent: campaign.htmlContent ?? null,
				textContent: campaign.textContent ?? null,
				scheduledAt: campaign.scheduledAt ?? null,
				sentAt: campaign.sentAt ?? null,
				recipientCount: campaign.recipients.length,
				recipients: campaign.recipients.map(mapRecipient),
			});
		}),

	list: protectedProcedure
		.input(campaignListFiltersSchema)
		.query(async ({ ctx, input }) => {
			const userId = ctx.session?.user?.id;
			if (!userId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "User session not found",
				});
			}

			const where: {
				OR: Array<Record<string, unknown>>;
				status?: "DRAFT" | "SCHEDULED" | "COMPLETED" | "FAILED";
				name?: { contains: string; mode: "insensitive" };
			} = {
				OR: [
					{ userId },
					...(input.teamId
						? [
								{
									teamId: input.teamId,
									team: {
										members: { some: { userId } },
									},
								},
							]
						: []),
				],
			};

			if (input.status) where.status = input.status;
			if (input.search) where.name = { contains: input.search, mode: "insensitive" };

			const [campaigns, total] = await Promise.all([
				prisma.emailCampaign.findMany({
					where,
					skip: input.offset,
					take: input.limit,
					orderBy: { createdAt: "desc" },
					include: { _count: { select: { recipients: true } } },
				}),
				prisma.emailCampaign.count({ where }),
			]);

			return campaignListResponseSchema.parse({
				campaigns: campaigns.map((c) => ({
					id: c.id,
					name: c.name,
					subject: c.subject,
					fromEmail: c.fromEmail,
					status: c.status,
					recipientCount: c._count.recipients,
					userId: c.userId,
					teamId: c.teamId ?? null,
					createdAt: c.createdAt,
					updatedAt: c.updatedAt,
					scheduledAt: c.scheduledAt ?? null,
					sentAt: c.sentAt ?? null,
				})),
				total,
			});
		}),

	update: protectedProcedure
		.input(campaignUpdateInputSchema)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session?.user?.id;
			if (!userId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "User session not found",
				});
			}

			const campaign = await prisma.emailCampaign.findUnique({
				where: { id: input.id },
				include: { recipients: true },
			});

			if (!campaign) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Campaign not found",
				});
			}

			if (campaign.userId !== userId) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Access denied",
				});
			}

			if (campaign.status === "COMPLETED" || campaign.status === "FAILED") {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Cannot update a campaign that has already been sent",
				});
			}

			const now = new Date();
			const updated = await prisma.$transaction(async (tx) => {
				const updatedCampaign = await tx.emailCampaign.update({
					where: { id: input.id },
					data: {
						...(input.name && { name: input.name }),
						...(input.description !== undefined && {
							description: input.description,
						}),
						...(input.subject && { subject: input.subject }),
						...(input.fromEmail && { fromEmail: input.fromEmail }),
						...(input.fromName !== undefined && { fromName: input.fromName }),
						...(input.emailDomainId !== undefined && {
							emailDomainId: input.emailDomainId ?? undefined,
						}),
						...(input.htmlContent !== undefined && {
							htmlContent: input.htmlContent,
						}),
						...(input.textContent !== undefined && {
							textContent: input.textContent,
						}),
						...(input.scheduledAt !== undefined && {
							scheduledAt: input.scheduledAt,
						}),
						updatedAt: now,
					},
				});

				if (input.recipientEmails !== undefined) {
					await tx.campaignRecipient.deleteMany({
						where: { campaignId: input.id },
					});
					for (const email of input.recipientEmails) {
						await tx.campaignRecipient.create({
							data: {
								id: crypto.randomUUID(),
								campaignId: input.id,
								toEmail: email,
								createdAt: now,
								updatedAt: now,
							},
						});
					}
				}

				await tx.emailCampaignActivityLog.create({
					data: {
						id: crypto.randomUUID(),
						userId,
						campaignId: campaign.id,
						action: "UPDATE",
						description: `Campaign ${campaign.name} updated`,
						createdAt: now,
					},
				});

				return updatedCampaign;
			});

			const recipients = await prisma.campaignRecipient.findMany({
				where: { campaignId: updated.id },
			});

			return campaignDetailSchema.parse({
				...updated,
				description: updated.description ?? null,
				fromName: updated.fromName ?? null,
				emailDomainId: updated.emailDomainId ?? null,
				htmlContent: updated.htmlContent ?? null,
				textContent: updated.textContent ?? null,
				scheduledAt: updated.scheduledAt ?? null,
				sentAt: updated.sentAt ?? null,
				recipientCount: recipients.length,
				recipients: recipients.map(mapRecipient),
			});
		}),

	delete: protectedProcedure
		.input(z.object({ id: z.string().min(1) }))
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session?.user?.id;
			if (!userId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "User session not found",
				});
			}

			const campaign = await prisma.emailCampaign.findUnique({
				where: { id: input.id },
			});

			if (!campaign) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Campaign not found",
				});
			}

			if (campaign.userId !== userId) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Access denied",
				});
			}

			await prisma.emailCampaign.delete({
				where: { id: input.id },
			});

			return { success: true };
		}),

	send: protectedProcedure
		.input(campaignSendInputSchema)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session?.user?.id;
			if (!userId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "User session not found",
				});
			}

			const campaign = await prisma.emailCampaign.findUnique({
				where: { id: input.id },
				include: { _count: { select: { recipients: true } } },
			});

			if (!campaign) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Campaign not found",
				});
			}

			if (campaign.userId !== userId) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Access denied",
				});
			}

			if (campaign.status === "COMPLETED" || campaign.status === "FAILED") {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Campaign already sent or failed",
				});
			}

			if (campaign._count.recipients === 0) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Campaign has no recipients",
				});
			}

			if (!campaign.htmlContent && !campaign.textContent) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Campaign must have HTML or text content",
				});
			}

			if (campaign.emailDomainId) {
				const domain = await prisma.emailDomain.findUnique({
					where: { id: campaign.emailDomainId },
				});
				if (!domain || domain.status !== "VERIFIED") {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Email domain must be verified",
					});
				}
			}

			const now = new Date();
			const scheduledFor =
				input.immediate === true
					? null
					: campaign.scheduledAt != null && campaign.scheduledAt.getTime() > now.getTime()
						? campaign.scheduledAt
						: null;

			const sendJob = await prisma.emailCampaignSendJob.create({
				data: {
					id: crypto.randomUUID(),
					campaignId: campaign.id,
					status: "QUEUED",
					scheduledFor: scheduledFor ?? undefined,
					createdAt: now,
					updatedAt: now,
				},
			});

			try {
				const result = await enqueueCampaignSend(
					campaign.id,
					sendJob.id,
					scheduledFor,
				);

				await prisma.emailCampaignSendJob.update({
					where: { id: sendJob.id },
					data: {
						qstashMessageId: result.messageId,
						updatedAt: new Date(),
					},
				});

				if (scheduledFor != null) {
					await prisma.emailCampaign.update({
						where: { id: campaign.id },
						data: { status: "SCHEDULED", updatedAt: new Date() },
					});
				}

				await prisma.emailCampaignActivityLog.create({
					data: {
						id: crypto.randomUUID(),
						userId,
						campaignId: campaign.id,
						action: "SEND",
						description:
							scheduledFor != null
								? `Campaign ${campaign.name} scheduled for ${scheduledFor.toISOString()}`
								: `Campaign ${campaign.name} send queued`,
						metadata: JSON.parse(
							JSON.stringify({
								sendJobId: sendJob.id,
								messageId: result.messageId,
								scheduledFor: result.scheduledFor ?? null,
							}),
						),
						createdAt: new Date(),
					},
				});

				return {
					success: true,
					message:
						scheduledFor != null
							? "Campaign scheduled; worker will send at the scheduled time"
							: "Campaign send queued; worker will process shortly",
					sendJobId: sendJob.id,
					messageId: result.messageId,
					scheduledFor: result.scheduledFor ?? null,
				};
			} catch (error) {
				await prisma.emailCampaignSendJob.update({
					where: { id: sendJob.id },
					data: {
						status: "FAILED",
						errorMessage:
							error instanceof Error ? error.message : "Failed to enqueue",
						updatedAt: new Date(),
					},
				});
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message:
						error instanceof Error
							? error.message
							: "Failed to enqueue campaign send",
					cause: error,
				});
			}
		}),

	addRecipients: protectedProcedure
		.input(campaignRecipientAddInputSchema)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session?.user?.id;
			if (!userId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "User session not found",
				});
			}

			const campaign = await prisma.emailCampaign.findUnique({
				where: { id: input.campaignId },
			});

			if (!campaign) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Campaign not found",
				});
			}

			if (campaign.userId !== userId) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Access denied",
				});
			}

			if (campaign.status !== "DRAFT") {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Can only add recipients to a draft campaign",
				});
			}

			const now = new Date();
			const existing = await prisma.campaignRecipient.findMany({
				where: { campaignId: input.campaignId },
				select: { toEmail: true },
			});
			const existingSet = new Set(existing.map((r) => r.toEmail.toLowerCase()));
			const toAdd = input.emails.filter(
				(e) => !existingSet.has(e.toLowerCase()),
			);

			for (const email of toAdd) {
				await prisma.campaignRecipient.create({
					data: {
						id: crypto.randomUUID(),
						campaignId: input.campaignId,
						toEmail: email,
						createdAt: now,
						updatedAt: now,
					},
				});
			}

			return { added: toAdd.length };
		}),

	listRecipients: protectedProcedure
		.input(campaignRecipientListFiltersSchema)
		.query(async ({ ctx, input }) => {
			const userId = ctx.session?.user?.id;
			if (!userId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "User session not found",
				});
			}

			const campaign = await prisma.emailCampaign.findUnique({
				where: { id: input.campaignId },
			});

			if (!campaign) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Campaign not found",
				});
			}

			if (campaign.userId !== userId) {
				if (campaign.teamId) {
					const member = await prisma.teamMember.findUnique({
						where: {
							teamId_userId: { teamId: campaign.teamId, userId },
						},
					});
					if (!member) {
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

			const where: { campaignId: string; toEmail?: { contains: string; mode: "insensitive" } } = {
				campaignId: input.campaignId,
			};
			if (input.search) {
				where.toEmail = { contains: input.search, mode: "insensitive" };
			}

			const [recipients, total] = await Promise.all([
				prisma.campaignRecipient.findMany({
					where,
					skip: input.offset,
					take: input.limit,
					orderBy: { createdAt: "desc" },
				}),
				prisma.campaignRecipient.count({ where }),
			]);

			return campaignRecipientListResponseSchema.parse({
				recipients: recipients.map(mapRecipient),
				total,
			});
		}),
});
