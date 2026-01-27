import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../../trpc";
import prisma from "@nPanel/db";
import { getResendClient, handleResendError } from "../../lib/resend-client";
import {
	campaignCreateInputSchema,
	campaignUpdateInputSchema,
	campaignListFiltersSchema,
	campaignDetailSchema,
	campaignListResponseSchema,
	campaignSendInputSchema,
	campaignPauseInputSchema,
} from "./schemas";

/**
 * Send campaign emails via Resend
 * This function handles the actual sending logic
 */
async function sendCampaignEmails(campaignId: string) {
	const campaign = await prisma.campaign.findUnique({
		where: { id: campaignId },
		include: {
			emailTemplate: true,
		},
	});

	if (!campaign) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Campaign not found",
		});
	}

	// Get email content (from template or direct)
	let htmlContent = campaign.htmlContent;
	let textContent = campaign.textContent;
	let subject = campaign.subject;

	if (campaign.emailTemplateId && campaign.emailTemplate) {
		htmlContent = campaign.emailTemplate.htmlContent ?? htmlContent;
		textContent = campaign.emailTemplate.textContent ?? textContent;
		subject = campaign.emailTemplate.subject ?? subject;
	}

	if (!htmlContent && !textContent) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Campaign must have HTML or text content",
		});
	}

	// Verify domain if specified
	if (campaign.emailDomainId) {
		const emailDomain = await prisma.emailDomain.findUnique({
			where: { id: campaign.emailDomainId },
		});

		if (!emailDomain || emailDomain.status !== "VERIFIED") {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Email domain must be verified",
			});
		}
	}

	// Get recipient emails from campaign
	const recipientEmails = campaign.recipientEmails;

	if (recipientEmails.length === 0) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Campaign has no recipient emails",
		});
	}

	// Update campaign status
	await prisma.campaign.update({
		where: { id: campaignId },
		data: {
			status: "SENDING",
			totalRecipients: recipientEmails.length,
			updatedAt: new Date(),
		},
	});

	// Send emails via Resend using batch API (up to 100 emails per batch)
	const resend = getResendClient();
	const fromEmail = campaign.fromEmail;
	const fromName = campaign.fromName
		? `${campaign.fromName} <${fromEmail}>`
		: fromEmail;

	let sentCount = 0;
	let failedCount = 0;

	// Split emails into batches of 100 (Resend batch limit)
	const BATCH_SIZE = 100;
	const batches: string[][] = [];
	for (let i = 0; i < recipientEmails.length; i += BATCH_SIZE) {
		batches.push(recipientEmails.slice(i, i + BATCH_SIZE));
	}

	// Process each batch
	for (const batch of batches) {
		try {
			// Prepare batch emails with variable replacement
			const batchEmails = batch.map((recipientEmail) => {
				// Prepare email content (simple variable replacement with email)
				let finalHtml = htmlContent;
				let finalText = textContent;

				// Simple variable replacement (can be enhanced with contact lookup if needed)
				if (finalHtml) {
					finalHtml = finalHtml.replace(/\{\{email\}\}/g, recipientEmail);
				}

				if (finalText) {
					finalText = finalText.replace(/\{\{email\}\}/g, recipientEmail);
				}

				return {
					from: fromName,
					to: [recipientEmail], // Resend batch API expects array for 'to'
					subject,
					...(finalHtml && { html: finalHtml }),
					...(finalText && { text: finalText }),
				};
			});

			// Send batch via Resend
			// Type assertion needed because Resend types expect 'react' property for React Email,
			// but we're using HTML/text which is also valid
			const resendResponse = await resend.batch.send(batchEmails as any);

			if (resendResponse.error) {
				throw new Error(resendResponse.error.message);
			}

			// Process batch results
			// Resend batch API returns data as array: [{id: "..."}, {id: "..."}, ...]
			// IMPORTANT: Results are returned in the same order as the request
			// So results[index] corresponds to batch[index] (recipientEmail)
			const now = new Date();
			// Resend batch API returns data as array of email IDs
			const results: Array<{ id: string }> = Array.isArray(resendResponse.data) 
				? (resendResponse.data as unknown as Array<{ id: string }>)
				: [];

			// Validate that we got the expected number of results
			if (results.length !== batch.length) {
				console.warn(`Batch size mismatch: expected ${batch.length} results, got ${results.length}`);
			}

			// Create email logs for all emails in batch
			// Map each recipient email to its corresponding Resend email ID by index
			await prisma.$transaction(
				batch.map((recipientEmail, index) => {
					const result = results[index];
					const isSuccess = result && result.id;
					const resendEmailId = result?.id ?? null;

					// Prepare content with variable replacement for logging
					let finalHtml = htmlContent;
					let finalText = textContent;
					if (finalHtml) {
						finalHtml = finalHtml.replace(/\{\{email\}\}/g, recipientEmail);
					}
					if (finalText) {
						finalText = finalText.replace(/\{\{email\}\}/g, recipientEmail);
					}

					return prisma.emailLog.create({
						data: {
							id: crypto.randomUUID(),
							toEmail: recipientEmail,
							fromEmail,
							subject,
							type: "CAMPAIGN",
							status: isSuccess ? "SENT" : "FAILED",
							resendEmailId, // Resend email ID mapped from batch response by index
							resendMessageId: null, // Will be updated via webhook
							emailDomainId: campaign.emailDomainId ?? null,
							campaignId: campaign.id,
							contactId: null,
							htmlContent: finalHtml ?? null,
							textContent: finalText ?? null,
							errorMessage: !isSuccess ? "Failed to send via batch API" : null,
							userId: campaign.userId,
							teamId: campaign.teamId ?? null,
							createdAt: now,
							updatedAt: now,
							sentAt: isSuccess ? now : null,
						},
					});
				})
			);

			// Count successes and failures
			batch.forEach((_, index) => {
				const result = results[index] as { id: string } | undefined;
				if (result && result.id) {
					sentCount++;
				} else {
					failedCount++;
				}
			});

			// Update campaign sentCount in real-time after each batch for UI progress
			await prisma.campaign.update({
				where: { id: campaignId },
				data: {
					sentCount,
					updatedAt: new Date(),
				},
			});

			// Small delay between batches to respect rate limits
			if (batch !== batches[batches.length - 1]) {
				await new Promise((resolve) => setTimeout(resolve, 100));
			}
		} catch (error) {
			console.error(`Failed to send batch:`, error);
			// Mark all emails in this batch as failed
			const now = new Date();
			await prisma.$transaction(
				batch.map((recipientEmail) =>
					prisma.emailLog.create({
						data: {
							id: crypto.randomUUID(),
							toEmail: recipientEmail,
							fromEmail,
							subject,
							type: "CAMPAIGN",
							status: "FAILED",
							emailDomainId: campaign.emailDomainId ?? null,
							campaignId: campaign.id,
							contactId: null,
							errorMessage: error instanceof Error ? error.message : "Unknown error",
							userId: campaign.userId,
							teamId: campaign.teamId ?? null,
							createdAt: now,
							updatedAt: now,
						},
					})
				)
			);
			failedCount += batch.length;
		}
	}

	// Update campaign with final status
	// Only mark as FAILED if ALL emails failed, otherwise mark as SENT (even if some failed)
	const finalStatus = failedCount === recipientEmails.length && sentCount === 0 ? "FAILED" : "SENT";
	await prisma.campaign.update({
		where: { id: campaignId },
		data: {
			status: finalStatus,
			sentCount,
			totalRecipients: recipientEmails.length,
			sentAt: sentCount > 0 ? new Date() : null,
			updatedAt: new Date(),
		},
	});

	return {
		success: true,
		sentCount,
		failedCount,
		totalRecipients: recipientEmails.length,
	};
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

			// Validate template if provided
			if (input.emailTemplateId) {
				const template = await prisma.emailTemplate.findUnique({
					where: { id: input.emailTemplateId },
				});

				if (!template) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Email template not found",
					});
				}
			}

			// Validate domain if provided
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

			// Ensure either template or content is provided
			if (!input.emailTemplateId && !input.htmlContent && !input.textContent) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Either email template or content must be provided",
				});
			}

			// Create campaign and activity log in a single transaction
			const now = new Date();
			const campaign = await prisma.$transaction(async (tx) => {
				const newCampaign = await tx.campaign.create({
					data: {
						id: crypto.randomUUID(),
						name: input.name,
						description: input.description ?? null,
						subject: input.subject,
						fromEmail: input.fromEmail,
						fromName: input.fromName ?? null,
						type: input.type ?? "MARKETING",
						status: "DRAFT",
						recipientEmails: input.recipientEmails,
						emailDomainId: input.emailDomainId ?? null,
						emailTemplateId: input.emailTemplateId ?? null,
						htmlContent: input.htmlContent ?? null,
						textContent: input.textContent ?? null,
						scheduledAt: input.scheduledAt ?? null,
						metadata: input.metadata ?? undefined,
						userId,
						teamId: input.teamId ?? null,
						createdAt: now,
						updatedAt: now,
					},
				});

				await tx.campaignActivityLog.create({
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

			return campaignDetailSchema.parse({
				...campaign,
				recipientEmails: campaign.recipientEmails,
				description: campaign.description ?? null,
				fromName: campaign.fromName ?? null,
				emailDomainId: campaign.emailDomainId ?? null,
				emailTemplateId: campaign.emailTemplateId ?? null,
				htmlContent: campaign.htmlContent ?? null,
				textContent: campaign.textContent ?? null,
				metadata: campaign.metadata ?? null,
				teamId: campaign.teamId ?? null,
				scheduledAt: campaign.scheduledAt ?? null,
				sentAt: campaign.sentAt ?? null,
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

			const campaign = await prisma.campaign.findUnique({
				where: { id: input.id },
			});

			if (!campaign) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Campaign not found",
				});
			}

			// Check access
			if (campaign.userId !== userId) {
				if (campaign.teamId) {
					const teamMember = await prisma.teamMember.findUnique({
						where: {
							teamId_userId: {
								teamId: campaign.teamId,
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

			return campaignDetailSchema.parse({
				...campaign,
				description: campaign.description ?? null,
				fromName: campaign.fromName ?? null,
				emailDomainId: campaign.emailDomainId ?? null,
				emailTemplateId: campaign.emailTemplateId ?? null,
				htmlContent: campaign.htmlContent ?? null,
				textContent: campaign.textContent ?? null,
				metadata: campaign.metadata ?? null,
				teamId: campaign.teamId ?? null,
				scheduledAt: campaign.scheduledAt ?? null,
				sentAt: campaign.sentAt ?? null,
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

			if (input.type) {
				where.type = input.type;
			}

			if (input.search) {
				where.name = { contains: input.search, mode: "insensitive" };
			}

			const [campaigns, total] = await Promise.all([
				prisma.campaign.findMany({
					where,
					skip: input.offset,
					take: input.limit,
					orderBy: { createdAt: "desc" },
				}),
				prisma.campaign.count({ where }),
			]);

			return campaignListResponseSchema.parse({
				campaigns: campaigns.map((c) => ({
					...c,
					recipientEmails: c.recipientEmails,
					teamId: c.teamId ?? null,
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

			const campaign = await prisma.campaign.findUnique({
				where: { id: input.id },
			});

			if (!campaign) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Campaign not found",
				});
			}

			// Check access
			if (campaign.userId !== userId) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Access denied",
				});
			}

			// Can't update if already sent
			if (campaign.status === "SENT") {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Cannot update a sent campaign",
				});
			}

			// Update campaign and create activity log in a single transaction
			const updatedCampaign = await prisma.$transaction(async (tx) => {
				const updated = await tx.campaign.update({
					where: { id: input.id },
					data: {
						...(input.name && { name: input.name }),
						...(input.description !== undefined && {
							description: input.description,
						}),
						...(input.subject && { subject: input.subject }),
						...(input.fromEmail && { fromEmail: input.fromEmail }),
						...(input.fromName !== undefined && { fromName: input.fromName }),
						...(input.type && { type: input.type }),
						...(input.status && { status: input.status }),
						...(input.recipientEmails && { recipientEmails: input.recipientEmails }),
						...(input.emailDomainId !== undefined && {
							emailDomainId: input.emailDomainId ?? undefined,
						}),
						...(input.emailTemplateId !== undefined && {
							emailTemplateId: input.emailTemplateId,
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
						...(input.metadata !== undefined && { 
							metadata: input.metadata ?? undefined 
						}),
						updatedAt: new Date(),
					},
				});

				await tx.campaignActivityLog.create({
					data: {
						id: crypto.randomUUID(),
						userId,
						campaignId: campaign.id,
						action: "UPDATE",
						description: `Campaign ${campaign.name} updated`,
						createdAt: new Date(),
					},
				});

				return updated;
			});

			return campaignDetailSchema.parse({
				...updatedCampaign,
				recipientEmails: updatedCampaign.recipientEmails,
				description: updatedCampaign.description ?? null,
				fromName: updatedCampaign.fromName ?? null,
				emailDomainId: updatedCampaign.emailDomainId ?? null,
				emailTemplateId: updatedCampaign.emailTemplateId ?? null,
				htmlContent: updatedCampaign.htmlContent ?? null,
				textContent: updatedCampaign.textContent ?? null,
				metadata: updatedCampaign.metadata ?? null,
				teamId: updatedCampaign.teamId ?? null,
				scheduledAt: updatedCampaign.scheduledAt ?? null,
				sentAt: updatedCampaign.sentAt ?? null,
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

			const campaign = await prisma.campaign.findUnique({
				where: { id: input.id },
			});

			if (!campaign) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Campaign not found",
				});
			}

			// Check access
			if (campaign.userId !== userId) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Access denied",
				});
			}

			await prisma.campaign.delete({
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

			const campaign = await prisma.campaign.findUnique({
				where: { id: input.id },
			});

			if (!campaign) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Campaign not found",
				});
			}

			// Check access
			if (campaign.userId !== userId) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Access denied",
				});
			}

			// Can't send if already sent
			if (campaign.status === "SENT" || campaign.status === "SENDING") {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Campaign already sent or currently sending",
				});
			}

			// Update status to SENDING immediately
			await prisma.campaign.update({
				where: { id: input.id },
				data: {
					status: "SENDING",
					totalRecipients: campaign.recipientEmails.length,
					updatedAt: new Date(),
				},
			});

			// Create activity log for starting send
			await prisma.campaignActivityLog.create({
				data: {
					id: crypto.randomUUID(),
					userId,
					campaignId: campaign.id,
					action: "SEND",
					description: `Campaign ${campaign.name} sending started`,
					createdAt: new Date(),
				},
			});

			// Send emails synchronously (await completion)
			try {
				const result = await sendCampaignEmails(input.id);
				
				// Create activity log for completion
				await prisma.campaignActivityLog.create({
					data: {
						id: crypto.randomUUID(),
						userId,
						campaignId: campaign.id,
						action: "SEND",
						description: `Campaign ${campaign.name} sent to ${result.sentCount} recipients`,
						metadata: result,
						createdAt: new Date(),
					},
				});

				return { 
					success: true, 
					message: "Campaign sent successfully",
					sentCount: result.sentCount,
					failedCount: result.failedCount,
					totalRecipients: result.totalRecipients,
				};
			} catch (error) {
				console.error("Error sending campaign emails:", error);
				// Update campaign status to FAILED only if all emails failed
				// The sendCampaignEmails function already handles status updates
				// But if there's an exception, we need to handle it
				const campaignAfterError = await prisma.campaign.findUnique({
					where: { id: input.id },
				});
				
				// Only mark as FAILED if still in SENDING status (meaning no emails were sent)
				if (campaignAfterError?.status === "SENDING") {
					await prisma.campaign.update({
						where: { id: input.id },
						data: {
							status: "FAILED",
							updatedAt: new Date(),
						},
					});
				}

				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: error instanceof Error ? error.message : "Failed to send campaign emails",
				});
			}
		}),

	pause: protectedProcedure
		.input(campaignPauseInputSchema)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session?.user?.id;
			if (!userId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "User session not found",
				});
			}

			const campaign = await prisma.campaign.findUnique({
				where: { id: input.id },
			});

			if (!campaign) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Campaign not found",
				});
			}

			// Check access
			if (campaign.userId !== userId) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Access denied",
				});
			}

			if (campaign.status !== "SENDING" && campaign.status !== "SCHEDULED") {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Campaign is not sending or scheduled",
				});
			}

			// Update campaign and create activity log in a single transaction
			const updatedCampaign = await prisma.$transaction(async (tx) => {
				const updated = await tx.campaign.update({
					where: { id: input.id },
					data: {
						status: "PAUSED",
						updatedAt: new Date(),
					},
				});

				await tx.campaignActivityLog.create({
					data: {
						id: crypto.randomUUID(),
						userId,
						campaignId: campaign.id,
						action: "PAUSE",
						description: `Campaign ${campaign.name} paused`,
						createdAt: new Date(),
					},
				});

				return updated;
			});

			return campaignDetailSchema.parse({
				...updatedCampaign,
				recipientEmails: updatedCampaign.recipientEmails,
				description: updatedCampaign.description ?? null,
				fromName: updatedCampaign.fromName ?? null,
				emailDomainId: updatedCampaign.emailDomainId ?? null,
				emailTemplateId: updatedCampaign.emailTemplateId ?? null,
				htmlContent: updatedCampaign.htmlContent ?? null,
				textContent: updatedCampaign.textContent ?? null,
				metadata: updatedCampaign.metadata ?? null,
				teamId: updatedCampaign.teamId ?? null,
				scheduledAt: updatedCampaign.scheduledAt ?? null,
				sentAt: updatedCampaign.sentAt ?? null,
			});
		}),
});
