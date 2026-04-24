import { TRPCError } from "@trpc/server";
import { and, count, desc, eq, ilike, or, sql } from "@npanel/db";
import * as crypto from "crypto";
import { db } from "@npanel/db";
import { user as userTable } from "@npanel/db/schema/auth";
import { teamMember } from "@npanel/db/schema/teams";
import { notification } from "@npanel/db/schema/notifications";
import {
	campaignRecipient,
	emailCampaign,
	emailCampaignActivityLog,
	emailCampaignSendJob,
	emailDomain,
} from "@npanel/db/schema/email-marketing";
import { enqueueCampaignSend, cancelCampaignSend } from "../../lib/qstash/campaign-send";
import { sendEmail } from "../../lib/email";
import {
	renderCampaignCreatedEmail,
	renderCampaignScheduledEmail,
	renderCampaignCancelledEmail,
} from "../../lib/email-templates";
import {
	campaignCreateInputSchema,
	campaignUpdateInputSchema,
	campaignListFiltersSchema,
	campaignDetailSchema,
	campaignListResponseSchema,
	campaignSendInputSchema,
	campaignCancelInputSchema,
	campaignRecipientSummarySchema,
	campaignRecipientAddInputSchema,
	campaignRecipientListFiltersSchema,
	campaignRecipientListResponseSchema,
} from "./schemas";
import { z } from "zod";
import { protectedProcedure, router } from "../../trpc";

/** Build campaign view link using VITE_PUBLIC_APP_URL as-is (no extra redirects). */
function getCampaignViewLink(campaignId: string): string {
	const base = (process.env.VITE_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
	return `${base}/agency/email-marketing/campaigns/${campaignId}`;
}

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

async function assertTeamMember(teamId: string, userId: string) {
	const [member] = await db
		.select({ id: teamMember.id })
		.from(teamMember)
		.where(and(eq(teamMember.teamId, teamId), eq(teamMember.userId, userId)))
		.limit(1);

	if (!member) {
		throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
	}
}

const isAgencyUserRole = (role: string | null | undefined) =>
	["AGENCY_USER", "AGENCY_ADMIN", "AGENCY_SUPER_ADMIN"].includes(role ?? "");

const isAgencySuperAdminRole = (role: string | null | undefined) =>
	role === "AGENCY_SUPER_ADMIN";

async function assertCampaignReadAccess(
	campaignId: string,
	userId: string,
	userRole: string | null | undefined,
) {
	if (isAgencyUserRole(userRole)) {
		const [campaign] = await db
			.select({
				id: emailCampaign.id,
				userId: emailCampaign.userId,
				teamId: emailCampaign.teamId,
				name: emailCampaign.name,
				status: emailCampaign.status,
				emailDomainId: emailCampaign.emailDomainId,
				subject: emailCampaign.subject,
				fromEmail: emailCampaign.fromEmail,
				fromName: emailCampaign.fromName,
				description: emailCampaign.description,
				htmlContent: emailCampaign.htmlContent,
				textContent: emailCampaign.textContent,
				scheduledAt: emailCampaign.scheduledAt,
				sentAt: emailCampaign.sentAt,
				createdAt: emailCampaign.createdAt,
				updatedAt: emailCampaign.updatedAt,
			})
			.from(emailCampaign)
			.where(eq(emailCampaign.id, campaignId))
			.limit(1);
		if (!campaign) {
			throw new TRPCError({ code: "NOT_FOUND", message: "Campaign not found" });
		}
		return campaign;
	}

	return assertCampaignOwnerAccess(campaignId, userId, userRole);
}

async function assertCampaignOwnerAccess(
	campaignId: string,
	userId: string,
	userRole: string | null | undefined,
) {
	const [campaign] = await db
		.select({
			id: emailCampaign.id,
			userId: emailCampaign.userId,
			teamId: emailCampaign.teamId,
			name: emailCampaign.name,
			status: emailCampaign.status,
			emailDomainId: emailCampaign.emailDomainId,
			subject: emailCampaign.subject,
			fromEmail: emailCampaign.fromEmail,
			fromName: emailCampaign.fromName,
			description: emailCampaign.description,
			htmlContent: emailCampaign.htmlContent,
			textContent: emailCampaign.textContent,
			scheduledAt: emailCampaign.scheduledAt,
			sentAt: emailCampaign.sentAt,
			createdAt: emailCampaign.createdAt,
			updatedAt: emailCampaign.updatedAt,
		})
		.from(emailCampaign)
		.where(eq(emailCampaign.id, campaignId))
		.limit(1);

	if (!campaign) {
		throw new TRPCError({ code: "NOT_FOUND", message: "Campaign not found" });
	}

	if (campaign.userId === userId || isAgencySuperAdminRole(userRole)) {
		return campaign;
	}

	throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
}

async function fetchRecipients(campaignId: string) {
	return await db
		.select()
		.from(campaignRecipient)
		.where(eq(campaignRecipient.campaignId, campaignId))
		.orderBy(desc(campaignRecipient.createdAt));
}

export const emailMarketingCampaignsRouter = router({
	create: protectedProcedure
		.input(campaignCreateInputSchema)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session?.user?.id;
			const userRole = ctx.session?.user?.role;
			if (!userId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "User session not found",
				});
			}

			if (input.emailDomainId) {
				const [domain] = await db
					.select({ id: emailDomain.id, status: emailDomain.status })
					.from(emailDomain)
					.where(eq(emailDomain.id, input.emailDomainId))
					.limit(1);
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
			const campaignId = await db.transaction(async (tx: any) => {
				const id = crypto.randomUUID();
				await tx.insert(emailCampaign).values({
					id,
					name: input.name,
					description: input.description ?? null,
					subject: input.subject,
					fromEmail: input.fromEmail,
					fromName: input.fromName ?? null,
					status: "DRAFT",
					htmlContent: input.htmlContent ?? null,
					textContent: input.textContent ?? null,
					scheduledAt: input.scheduledAt ?? null,
					sentAt: null,
					emailDomainId: input.emailDomainId ?? null,
					userId,
					teamId: input.teamId ?? null,
					createdAt: now,
					updatedAt: now,
				});

				if (input.recipientEmails.length > 0) {
					await tx.insert(campaignRecipient).values(
						input.recipientEmails.map((email) => ({
							id: crypto.randomUUID(),
							campaignId: id,
							toEmail: email,
							resendId: null,
							resendMessageId: null,
							createdAt: now,
							updatedAt: now,
						})),
					);
				}

				await tx.insert(emailCampaignActivityLog).values({
					id: crypto.randomUUID(),
					userId,
					campaignId: id,
					action: "CREATE",
					description: `Campaign ${input.name} created`,
					metadata: null,
					ipAddress: null,
					userAgent: null,
					createdAt: now,
				});

				return id;
			});

			const campaign = await assertCampaignReadAccess(campaignId, userId, userRole);
			const recipients = await fetchRecipients(campaignId);

			// Notify creator: email + in-app notification (fire-and-forget style; don't block response)
			const viewCampaignLink = getCampaignViewLink(campaign.id);
			try {
				const [u] = await db
					.select({ name: userTable.name, email: userTable.email })
					.from(userTable)
					.where(eq(userTable.id, userId))
					.limit(1);
				if (u?.email) {
					const html = await renderCampaignCreatedEmail({
						recipientName: u.name ?? undefined,
						campaignName: campaign.name,
						subject: campaign.subject,
						recipientCount: recipients.length,
						viewCampaignLink,
					});
					await sendEmail({
						to: u.email,
						subject: `Campaign created: ${campaign.name}`,
						html,
					});
				}
				await db.insert(notification).values({
					id: crypto.randomUUID(),
					userId,
					teamId: campaign.teamId ?? null,
					type: "EMAIL_MARKETING",
					priority: "NORMAL",
					title: "Campaign created",
					message: `Your campaign "${campaign.name}" has been created.`,
					link: viewCampaignLink,
					seen: false,
					readAt: null,
					createdAt: new Date(),
					updatedAt: new Date(),
				});
			} catch (err) {
				// Log but don't fail the create mutation
				console.error("Campaign created notification/email failed:", err);
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
				recipientCount: recipients.length,
				recipients: recipients.map(mapRecipient),
			});
		}),

	getById: protectedProcedure
		.input(z.object({ id: z.string().min(1) }))
		.query(async ({ ctx, input }) => {
			const userId = ctx.session?.user?.id;
			const userRole = ctx.session?.user?.role;
			if (!userId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "User session not found",
				});
			}

			const campaign = await assertCampaignReadAccess(input.id, userId, userRole);
			const recipients = await fetchRecipients(input.id);

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

	list: protectedProcedure
		.input(campaignListFiltersSchema)
		.query(async ({ ctx, input }) => {
			const userId = ctx.session?.user?.id;
			const userRole = ctx.session?.user?.role;
			if (!userId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "User session not found",
				});
			}

			const conditions = [];
			if (!isAgencyUserRole(userRole)) {
				const accessOr = [eq(emailCampaign.userId, userId)];
				if (input.teamId) {
					accessOr.push(
						sql`(${emailCampaign.teamId} = ${input.teamId} AND EXISTS (select 1 from ${teamMember} tm where tm.team_id = ${input.teamId} and tm.user_id = ${userId}))`,
					);
				}
				conditions.push(or(...accessOr));
			}
			if (input.status) conditions.push(eq(emailCampaign.status, input.status));
			if (input.search) conditions.push(ilike(emailCampaign.name, `%${input.search}%`));
			if (input.teamId) conditions.push(eq(emailCampaign.teamId, input.teamId));

			const whereClause = conditions.length > 0 ? and(...conditions) : sql`true`;

			const [campaigns, totalRes] = await Promise.all([
				db
					.select({
						id: emailCampaign.id,
						name: emailCampaign.name,
						subject: emailCampaign.subject,
						fromEmail: emailCampaign.fromEmail,
						status: emailCampaign.status,
						userId: emailCampaign.userId,
						teamId: emailCampaign.teamId,
						createdAt: emailCampaign.createdAt,
						updatedAt: emailCampaign.updatedAt,
						scheduledAt: emailCampaign.scheduledAt,
						sentAt: emailCampaign.sentAt,
						recipientCount: count(campaignRecipient.id).as("recipientCount"),
					})
					.from(emailCampaign)
					.leftJoin(campaignRecipient, eq(campaignRecipient.campaignId, emailCampaign.id))
					.where(whereClause)
					.groupBy(
						emailCampaign.id,
						emailCampaign.name,
						emailCampaign.subject,
						emailCampaign.fromEmail,
						emailCampaign.status,
						emailCampaign.userId,
						emailCampaign.teamId,
						emailCampaign.createdAt,
						emailCampaign.updatedAt,
						emailCampaign.scheduledAt,
						emailCampaign.sentAt,
					)
					.orderBy(desc(emailCampaign.createdAt))
					.limit(input.limit)
					.offset(input.offset),
				db.select({ value: count() }).from(emailCampaign).where(whereClause),
			]);

			const total = Number(totalRes[0]?.value ?? 0);

			return campaignListResponseSchema.parse({
				campaigns: campaigns.map((c) => ({
					id: c.id,
					name: c.name,
					subject: c.subject,
					fromEmail: c.fromEmail,
					status: c.status,
					recipientCount: Number((c as any).recipientCount ?? 0),
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
			const userRole = ctx.session?.user?.role;
			if (!userId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "User session not found",
				});
			}

			const campaign = await assertCampaignOwnerAccess(input.id, userId, userRole);

			if (campaign.status === "COMPLETED" || campaign.status === "FAILED") {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Cannot update a campaign that has already been sent",
				});
			}

			const now = new Date();

			await db.transaction(async (tx) => {
				await tx
					.update(emailCampaign)
					.set({
						...(input.name && { name: input.name }),
						...(input.description !== undefined && {
							description: input.description ?? null,
						}),
						...(input.subject && { subject: input.subject }),
						...(input.fromEmail && { fromEmail: input.fromEmail }),
						...(input.fromName !== undefined && { fromName: input.fromName ?? null }),
						...(input.emailDomainId !== undefined && {
							emailDomainId: input.emailDomainId ?? null,
						}),
						...(input.htmlContent !== undefined && {
							htmlContent: input.htmlContent ?? null,
						}),
						...(input.textContent !== undefined && {
							textContent: input.textContent ?? null,
						}),
						...(input.scheduledAt !== undefined && {
							scheduledAt: input.scheduledAt ?? null,
						}),
						updatedAt: now,
					})
					.where(eq(emailCampaign.id, input.id));

				if (input.recipientEmails !== undefined) {
					await tx
						.delete(campaignRecipient)
						.where(eq(campaignRecipient.campaignId, input.id));

					if (input.recipientEmails.length > 0) {
						await tx.insert(campaignRecipient).values(
							input.recipientEmails.map((email) => ({
								id: crypto.randomUUID(),
								campaignId: input.id,
								toEmail: email,
								resendId: null,
								resendMessageId: null,
								createdAt: now,
								updatedAt: now,
							})),
						);
					}
				}

				await tx.insert(emailCampaignActivityLog).values({
					id: crypto.randomUUID(),
					userId,
					campaignId: campaign.id,
					action: "UPDATE",
					description: `Campaign ${campaign.name} updated`,
					metadata: null,
					ipAddress: null,
					userAgent: null,
					createdAt: now,
				});
			});

			const updated = await assertCampaignReadAccess(input.id, userId, userRole);
			const recipients = await fetchRecipients(input.id);

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
			const userRole = ctx.session?.user?.role;
			if (!userId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "User session not found",
				});
			}

			await assertCampaignOwnerAccess(input.id, userId, userRole);

			await db.delete(emailCampaign).where(eq(emailCampaign.id, input.id));

			return { success: true };
		}),

	send: protectedProcedure
		.input(campaignSendInputSchema)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session?.user?.id;
			const userRole = ctx.session?.user?.role;
			if (!userId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "User session not found",
				});
			}

			const campaign = await assertCampaignOwnerAccess(input.id, userId, userRole);

			if (campaign.status === "COMPLETED" || campaign.status === "FAILED") {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Campaign already sent or failed",
				});
			}

			const [{ value: recipientsCountValue } = { value: 0 }] = await db
				.select({ value: count(campaignRecipient.id) })
				.from(campaignRecipient)
				.where(eq(campaignRecipient.campaignId, campaign.id));
			const recipientsCount = Number(recipientsCountValue ?? 0);

			if (recipientsCount === 0) {
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
				const [domain] = await db
					.select({
						id: emailDomain.id,
						status: emailDomain.status,
					})
					.from(emailDomain)
					.where(eq(emailDomain.id, campaign.emailDomainId))
					.limit(1);

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
					: campaign.scheduledAt != null &&
						campaign.scheduledAt.getTime() > now.getTime()
						? campaign.scheduledAt
						: null;

			const [sendJob] = await db
				.insert(emailCampaignSendJob)
				.values({
					id: crypto.randomUUID(),
					campaignId: campaign.id,
					status: "QUEUED",
					scheduledFor,
					createdAt: now,
					updatedAt: now,
				})
				.returning({
					id: emailCampaignSendJob.id,
				});

			if (!sendJob) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to create campaign send job",
				});
			}

			try {
				const result = await enqueueCampaignSend(
					campaign.id,
					sendJob.id,
					scheduledFor,
				);

				await db
					.update(emailCampaignSendJob)
					.set({
						qstashMessageId: result.messageId,
						updatedAt: new Date(),
					})
					.where(eq(emailCampaignSendJob.id, sendJob.id));

				if (scheduledFor != null) {
					await db
						.update(emailCampaign)
						.set({ status: "SCHEDULED", updatedAt: new Date() })
						.where(eq(emailCampaign.id, campaign.id));
				}

				await db.insert(emailCampaignActivityLog).values({
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
					ipAddress: null,
					userAgent: null,
					createdAt: new Date(),
				});

				// When scheduled: send Campaign Scheduled email + in-app notification
				if (scheduledFor != null) {
					try {
						const viewCampaignLink = getCampaignViewLink(campaign.id);
						const [user] = await db
							.select({ name: userTable.name, email: userTable.email })
							.from(userTable)
							.where(eq(userTable.id, userId))
							.limit(1);
						const scheduledAtFormatted = scheduledFor.toLocaleString(
							undefined,
							{
								dateStyle: "medium",
								timeStyle: "short",
							},
						);
						if (user?.email) {
							const html = await renderCampaignScheduledEmail({
								recipientName: user.name ?? undefined,
								campaignName: campaign.name,
								subject: campaign.subject,
								scheduledAt: scheduledAtFormatted,
								recipientCount: recipientsCount,
								viewCampaignLink,
							});
							await sendEmail({
								to: user.email,
								subject: `Campaign scheduled: ${campaign.name}`,
								html,
							});
						}
						await db.insert(notification).values({
							id: crypto.randomUUID(),
							userId,
							teamId: campaign.teamId ?? null,
							type: "EMAIL_MARKETING",
							priority: "NORMAL",
							title: "Campaign scheduled",
							message: `"${campaign.name}" is scheduled for ${scheduledAtFormatted}.`,
							link: viewCampaignLink,
							seen: false,
							readAt: null,
							createdAt: new Date(),
							updatedAt: new Date(),
						});
					} catch (err) {
						console.error("Campaign scheduled notification/email failed:", err);
					}
				}

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
				await db
					.update(emailCampaignSendJob)
					.set({
						status: "FAILED",
						errorMessage:
							error instanceof Error
								? error.message
								: "Failed to enqueue",
						updatedAt: new Date(),
					})
					.where(eq(emailCampaignSendJob.id, sendJob.id));
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

	cancel: protectedProcedure
		.input(campaignCancelInputSchema)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session?.user?.id;
			const userRole = ctx.session?.user?.role;
			if (!userId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "User session not found",
				});
			}

			// Always fetch fresh from DB to avoid stale cache (e.g. UI showed SCHEDULED but campaign was already sent)
			const campaign = await assertCampaignOwnerAccess(input.id, userId, userRole);

			if (campaign.status !== "SCHEDULED") {
				const statusMessage =
					campaign.status === "COMPLETED"
						? "Campaign has already been sent."
						: campaign.status === "CANCELLED"
							? "Campaign has already been cancelled."
							: campaign.status === "FAILED"
								? "Campaign send failed."
								: "Only scheduled campaigns can be cancelled.";
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: statusMessage,
				});
			}

			const [queuedJob] = await db
				.select()
				.from(emailCampaignSendJob)
				.where(
					and(
						eq(emailCampaignSendJob.campaignId, input.id),
						eq(emailCampaignSendJob.status, "QUEUED"),
					),
				)
				.orderBy(desc(emailCampaignSendJob.createdAt))
				.limit(1);

			if (!queuedJob) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message:
						"No scheduled send found for this campaign. It may have already run or been cancelled.",
				});
			}

			const now = new Date();
			const cancelledAtFormatted = now.toLocaleString(undefined, {
				dateStyle: "medium",
				timeStyle: "short",
			});

			// Cancel QStash message if we have an ID (best-effort; worker will skip if job is CANCELLED)
			if (queuedJob.qstashMessageId) {
				try {
					await cancelCampaignSend(queuedJob.qstashMessageId);
				} catch (err) {
					console.error("QStash cancel failed (job will still be marked cancelled):", err);
				}
			}

			await db.transaction(async (tx) => {
				await tx
					.update(emailCampaignSendJob)
					.set({ status: "CANCELLED", updatedAt: now })
					.where(eq(emailCampaignSendJob.id, queuedJob.id));
				await tx
					.update(emailCampaign)
					.set({ status: "CANCELLED", updatedAt: now })
					.where(eq(emailCampaign.id, input.id));
				await tx.insert(emailCampaignActivityLog).values({
					id: crypto.randomUUID(),
					userId,
					campaignId: input.id,
					action: "CANCEL",
					description: `Scheduled campaign ${campaign.name} cancelled at ${cancelledAtFormatted}`,
					metadata: null,
					ipAddress: null,
					userAgent: null,
					createdAt: now,
				});
			});

			// Notify: email + in-app notification
			const viewCampaignLink = getCampaignViewLink(input.id);
			const campaignsListLink = (process.env.VITE_PUBLIC_APP_URL ?? "").replace(/\/$/, "") + "/agency/email-marketing/campaigns";
			try {
				const [user] = await db.select({ name: userTable.name, email: userTable.email }).from(userTable).where(eq(userTable.id, userId)).limit(1);
				if (user?.email) {
					const html = await renderCampaignCancelledEmail({
						recipientName: user.name ?? undefined,
						campaignName: campaign.name,
						subject: campaign.subject,
						cancelledAt: cancelledAtFormatted,
						viewCampaignLink: campaignsListLink,
					});
					await sendEmail({
						to: user.email,
						subject: `Scheduled campaign cancelled: ${campaign.name}`,
						html,
					});
				}
				await db.insert(notification).values({
					id: crypto.randomUUID(),
					userId,
					teamId: campaign.teamId ?? null,
					type: "EMAIL_MARKETING",
					priority: "NORMAL",
					title: "Scheduled campaign cancelled",
					message: `You cancelled "${campaign.name}" at ${cancelledAtFormatted}.`,
					link: viewCampaignLink,
					seen: false,
					readAt: null,
					createdAt: now,
					updatedAt: now,
				});
			} catch (err) {
				console.error("Campaign cancelled notification/email failed:", err);
			}

			return { success: true, cancelledAt: cancelledAtFormatted };
		}),

	addRecipients: protectedProcedure
		.input(campaignRecipientAddInputSchema)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session?.user?.id;
			const userRole = ctx.session?.user?.role;
			if (!userId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "User session not found",
				});
			}

			const campaign = await assertCampaignOwnerAccess(
				input.campaignId,
				userId,
				userRole,
			);

			if (campaign.status !== "DRAFT") {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Can only add recipients to a draft campaign",
				});
			}

			const now = new Date();
			const existing = await db
				.select({ toEmail: campaignRecipient.toEmail })
				.from(campaignRecipient)
				.where(eq(campaignRecipient.campaignId, input.campaignId));
			const existingSet = new Set(
				existing.map((r) => r.toEmail.toLowerCase()),
			);
			const toAdd = input.emails.filter(
				(e) => !existingSet.has(e.toLowerCase()),
			);

			if (toAdd.length > 0) {
				await db.insert(campaignRecipient).values(
					toAdd.map((email) => ({
						id: crypto.randomUUID(),
						campaignId: input.campaignId,
						toEmail: email,
						resendId: null,
						resendMessageId: null,
						createdAt: now,
						updatedAt: now,
					})),
				);
			}

			return { added: toAdd.length };
		}),

	listRecipients: protectedProcedure
		.input(campaignRecipientListFiltersSchema)
		.query(async ({ ctx, input }) => {
			const userId = ctx.session?.user?.id;
			const userRole = ctx.session?.user?.role;
			if (!userId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "User session not found",
				});
			}

			await assertCampaignReadAccess(input.campaignId, userId, userRole);

			const conditions = [eq(campaignRecipient.campaignId, input.campaignId)];
			if (input.search) {
				conditions.push(
					ilike(campaignRecipient.toEmail, `%${input.search}%`),
				);
			}

			const whereClause =
				conditions.length === 1 ? conditions[0] : and(...conditions);

			const [recipients, totalRes] = await Promise.all([
				db
					.select()
					.from(campaignRecipient)
					.where(whereClause)
					.orderBy(desc(campaignRecipient.createdAt))
					.limit(input.limit)
					.offset(input.offset),
				db
					.select({ value: count(campaignRecipient.id) })
					.from(campaignRecipient)
					.where(whereClause),
			]);

			const total = Number(totalRes[0]?.value ?? 0);

			return campaignRecipientListResponseSchema.parse({
				recipients: recipients.map(mapRecipient),
				total,
			});
		}),
});
