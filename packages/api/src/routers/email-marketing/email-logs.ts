import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../../trpc";
import prisma from "@nPanel/db";
import {
	emailLogListFiltersSchema,
	emailLogDetailSchema,
	emailLogListResponseSchema,
} from "./schemas";

export const emailMarketingEmailLogsRouter = router({
	/**
	 * Get email log by ID
	 */
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

			const emailLog = await prisma.emailLog.findUnique({
				where: { id: input.id },
			});

			if (!emailLog) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Email log not found",
				});
			}

			// Check access
			if (emailLog.userId && emailLog.userId !== userId) {
				if (emailLog.teamId) {
					const teamMember = await prisma.teamMember.findUnique({
						where: {
							teamId_userId: {
								teamId: emailLog.teamId,
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

			return emailLogDetailSchema.parse({
				...emailLog,
				resendEmailId: emailLog.resendEmailId ?? null,
				resendMessageId: emailLog.resendMessageId ?? null,
				emailDomainId: emailLog.emailDomainId ?? null,
				campaignId: emailLog.campaignId ?? null,
				contactId: emailLog.contactId ?? null,
				htmlContent: emailLog.htmlContent ?? null,
				textContent: emailLog.textContent ?? null,
				openedAt: emailLog.openedAt ?? null,
				clickedAt: emailLog.clickedAt ?? null,
				bouncedAt: emailLog.bouncedAt ?? null,
				complainedAt: emailLog.complainedAt ?? null,
				unsubscribedAt: emailLog.unsubscribedAt ?? null,
				errorMessage: emailLog.errorMessage ?? null,
				metadata: emailLog.metadata ?? null,
				sentAt: emailLog.sentAt ?? null,
				deliveredAt: emailLog.deliveredAt ?? null,
				userId: emailLog.userId ?? null,
				teamId: emailLog.teamId ?? null,
			});
		}),

	/**
	 * List email logs with filters
	 */
	list: protectedProcedure
		.input(emailLogListFiltersSchema)
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

			if (input.campaignId) {
				where.campaignId = input.campaignId;
			}

			if (input.contactId) {
				where.contactId = input.contactId;
			}

			if (input.emailDomainId) {
				where.emailDomainId = input.emailDomainId;
			}

			if (input.status) {
				where.status = input.status;
			}

			if (input.type) {
				where.type = input.type;
			}

			if (input.toEmail) {
				where.toEmail = { contains: input.toEmail, mode: "insensitive" };
			}

			if (input.search) {
				where.OR = [
					...(where.OR || []),
					{ toEmail: { contains: input.search, mode: "insensitive" } },
					{ fromEmail: { contains: input.search, mode: "insensitive" } },
					{ subject: { contains: input.search, mode: "insensitive" } },
				];
			}

			const [emailLogs, total] = await Promise.all([
				prisma.emailLog.findMany({
					where,
					skip: input.offset,
					take: input.limit,
					orderBy: { createdAt: "desc" },
				}),
				prisma.emailLog.count({ where }),
			]);

			return emailLogListResponseSchema.parse({
				emailLogs: emailLogs.map((el) => ({
					...el,
					resendEmailId: el.resendEmailId ?? null,
					campaignId: el.campaignId ?? null,
					contactId: el.contactId ?? null,
					sentAt: el.sentAt ?? null,
					deliveredAt: el.deliveredAt ?? null,
				})),
				total,
			});
		}),
});
