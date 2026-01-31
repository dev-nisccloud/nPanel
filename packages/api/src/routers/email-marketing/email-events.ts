import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../../trpc";
import prisma from "@nPanel/db";
import {
	emailEventListFiltersSchema,
	emailEventDetailSchema,
	emailEventListResponseSchema,
	campaignEventSummaryInputSchema,
	campaignEventSummarySchema,
	topClickedLinksInputSchema,
	topClickedLinksResponseSchema,
} from "./schemas";

export const emailMarketingEmailEventsRouter = router({
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

			const event = await prisma.emailEvent.findUnique({
				where: { id: input.id },
				include: {
					campaignRecipient: {
						include: {
							campaign: true,
						},
					},
				},
			});

			if (!event) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Email event not found",
				});
			}

			const campaign = event.campaignRecipient.campaign;
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

			return emailEventDetailSchema.parse({
				...event,
				resendEmailId: event.resendEmailId ?? null,
				data: event.data,
			});
		}),

	list: protectedProcedure
		.input(emailEventListFiltersSchema)
		.query(async ({ ctx, input }) => {
			const userId = ctx.session?.user?.id;
			if (!userId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "User session not found",
				});
			}

			const where: {
				campaignRecipientId?: string;
				campaignRecipient?: { campaignId: string };
				type?: "email_bounced" | "email_clicked" | "email_complained" | "email_delivered" | "email_delivery_delayed" | "email_failed" | "email_opened" | "email_received" | "email_scheduled" | "email_sent" | "email_suppressed";
			} = {};

			if (input.campaignRecipientId) {
				where.campaignRecipientId = input.campaignRecipientId;
			}
			if (input.campaignId) {
				where.campaignRecipient = { campaignId: input.campaignId };
			}
			if (input.type) {
				where.type = input.type;
			}

			// Must filter by at least one of campaignRecipientId or campaignId
			if (!where.campaignRecipientId && !where.campaignRecipient) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Provide campaignRecipientId or campaignId",
				});
			}

			// Access check: ensure user can see the campaign
			if (input.campaignId) {
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
			}
			if (input.campaignRecipientId) {
				const recipient = await prisma.campaignRecipient.findUnique({
					where: { id: input.campaignRecipientId },
					include: { campaign: true },
				});
				if (!recipient) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Recipient not found",
					});
				}
				const c = recipient.campaign;
				if (c.userId !== userId) {
					if (c.teamId) {
						const member = await prisma.teamMember.findUnique({
							where: {
								teamId_userId: { teamId: c.teamId, userId },
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
			}

			const [events, total] = await Promise.all([
				prisma.emailEvent.findMany({
					where,
					skip: input.offset,
					take: input.limit,
					orderBy: { eventCreatedAt: "desc" },
					include:
						input.campaignId
							? { campaignRecipient: { select: { toEmail: true } } }
							: undefined,
				}),
				prisma.emailEvent.count({ where }),
			]);

			type EventWithRecipient = (typeof events)[number] & {
				campaignRecipient?: { toEmail: string } | null;
			};
			return emailEventListResponseSchema.parse({
				events: events.map((e) => {
					const rec = (e as EventWithRecipient).campaignRecipient;
					const recipientEmail =
						rec != null && typeof rec === "object" && "toEmail" in rec
							? (rec as { toEmail: string }).toEmail
							: undefined;
					return {
						id: e.id,
						campaignRecipientId: e.campaignRecipientId,
						type: e.type,
						eventCreatedAt: e.eventCreatedAt,
						resendEmailId: e.resendEmailId ?? null,
						data: e.data,
						createdAt: e.createdAt,
						recipientEmail,
					};
				}),
				total,
			});
		}),

	getCampaignSummary: protectedProcedure
		.input(campaignEventSummaryInputSchema)
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

			const baseWhere = { campaignRecipient: { campaignId: input.campaignId } } as const;

			const [grouped, totalRecipients, openedUniqueRows, clickedUniqueRows] = await Promise.all([
				prisma.emailEvent.groupBy({
					by: ["type"],
					where: baseWhere,
					_count: { id: true },
				}),
				prisma.campaignRecipient.count({
					where: { campaignId: input.campaignId },
				}),
				prisma.emailEvent.groupBy({
					by: ["campaignRecipientId"],
					where: { ...baseWhere, type: "email_opened" },
				}),
				prisma.emailEvent.groupBy({
					by: ["campaignRecipientId"],
					where: { ...baseWhere, type: "email_clicked" },
				}),
			]);

			const byType: Record<string, number> = {};
			for (const row of grouped) {
				byType[row.type] = row._count.id;
			}

			return campaignEventSummarySchema.parse({
				delivered: byType["email_delivered"] ?? 0,
				bounced: byType["email_bounced"] ?? 0,
				suppressed: byType["email_suppressed"] ?? 0,
				opened: openedUniqueRows.length,
				openedTotal: byType["email_opened"] ?? 0,
				clicked: clickedUniqueRows.length,
				clickedTotal: byType["email_clicked"] ?? 0,
				complained: byType["email_complained"] ?? 0,
				unsubscribed: 0,
				totalRecipients,
			});
		}),

	getTopClickedLinks: protectedProcedure
		.input(topClickedLinksInputSchema)
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

			const clickEvents = await prisma.emailEvent.findMany({
				where: {
					type: "email_clicked",
					campaignRecipient: { campaignId: input.campaignId },
				},
				select: { data: true },
			});

			/** Extract clicked URL from Resend webhook data (jsonb). Stored shape: { click: { link: "..." }, to, from, ... } */
			function getLinkFromEventData(rawData: unknown): string | null {
				let data: Record<string, unknown> | null = null;
				if (rawData === null || rawData === undefined) return null;
				if (typeof rawData === "string") {
					try {
						data = JSON.parse(rawData) as Record<string, unknown>;
					} catch {
						return null;
					}
				} else if (typeof rawData === "object" && rawData !== null && !Array.isArray(rawData)) {
					data = rawData as Record<string, unknown>;
				}
				if (!data) return null;
				// Resend stores: data.click.link (nested object)
				const click = data["click"];
				if (click && typeof click === "object" && !Array.isArray(click) && click !== null) {
					const link = (click as Record<string, unknown>)["link"];
					if (typeof link === "string" && link.trim()) return link.trim();
				}
				// Fallbacks
				const link = data["link"] ?? data["url"] ?? data["href"] ?? data["clicked_link"];
				return typeof link === "string" && link.trim() ? link.trim() : null;
			}

			const urlToCount = new Map<string, number>();
			for (const event of clickEvents) {
				const url = getLinkFromEventData(event.data);
				if (!url) continue;
				urlToCount.set(url, (urlToCount.get(url) ?? 0) + 1);
			}

			const sorted = [...urlToCount.entries()]
				.sort((a, b) => b[1] - a[1])
				.slice(0, input.limit)
				.map(([url, clicks]) => ({ url, clicks }));

			return topClickedLinksResponseSchema.parse(sorted);
		}),
});
