import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../../trpc";
import prisma, { Prisma } from "@npanel/db";
import {
	audienceCreateInputSchema,
	audienceUpdateInputSchema,
	audienceListFiltersSchema,
	audienceListResponseSchema,
	audienceDetailSchema,
	audienceContactCreateInputSchema,
	audienceContactUpdateInputSchema,
	audienceContactListFiltersSchema,
	audienceContactListResponseSchema,
	audienceContactSummarySchema,
	audienceContactBulkCreateInputSchema,
} from "./schemas";

function mapAudience(
	audience: {
		id: string;
		name: string;
		description: string | null;
		userId: string | null;
		teamId: string | null;
		createdAt: Date;
		updatedAt: Date;
		_count: { contacts: number };
	},
	subscribedCount = 0,
	unsubscribedCount = 0,
) {
	return audienceDetailSchema.parse({
		id: audience.id,
		name: audience.name,
		description: audience.description ?? null,
		userId: audience.userId ?? null,
		teamId: audience.teamId ?? null,
		createdAt: audience.createdAt,
		updatedAt: audience.updatedAt,
		contactsCount: audience._count.contacts,
		subscribedCount,
		unsubscribedCount,
	});
}

export const emailMarketingAudiencesRouter = router({
	create: protectedProcedure
		.input(audienceCreateInputSchema)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session?.user?.id;
			if (!userId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "User session not found",
				});
			}

			const now = new Date();

			// If teamId is provided, ensure user is a member of the team
			if (input.teamId) {
				const member = await prisma.teamMember.findUnique({
					where: {
						teamId_userId: { teamId: input.teamId, userId },
					},
				});
				if (!member) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "You do not have access to this team",
					});
				}
			}

			const audience = await prisma.emailAudience.create({
				data: {
					id: crypto.randomUUID(),
					name: input.name,
					description: input.description ?? null,
					userId,
					teamId: input.teamId ?? null,
					createdAt: now,
					updatedAt: now,
				},
			});

			const withCount = await prisma.emailAudience.findUnique({
				where: { id: audience.id },
				include: { _count: { select: { contacts: true } } },
			});

			if (!withCount) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to load created audience",
				});
			}

			return mapAudience(withCount);
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

			const audience = await prisma.emailAudience.findUnique({
				where: { id: input.id },
				include: { _count: { select: { contacts: true } } },
			});

			if (!audience) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Audience not found",
				});
			}

			if (audience.userId !== userId) {
				if (audience.teamId) {
					const member = await prisma.teamMember.findUnique({
						where: {
							teamId_userId: { teamId: audience.teamId, userId },
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

			const [subscribedCount, unsubscribedCount] = await Promise.all([
				prisma.emailAudienceContact.count({
					where: { audienceId: input.id, status: "SUBSCRIBED" },
				}),
				prisma.emailAudienceContact.count({
					where: { audienceId: input.id, status: "UNSUBSCRIBED" },
				}),
			]);

			return mapAudience(audience, subscribedCount, unsubscribedCount);
		}),

	list: protectedProcedure
		.input(audienceListFiltersSchema)
		.query(async ({ ctx, input }) => {
			const userId = ctx.session?.user?.id;
			if (!userId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "User session not found",
				});
			}

			// Agency-side listing: show all audiences (no creator filter),
			// with optional filters for teamId and name search.
			const where: {
				teamId?: string | null;
				name?: { contains: string; mode: "insensitive" };
			} = {};

			if (input.teamId) {
				where.teamId = input.teamId;
			}

			if (input.search) {
				where.name = {
					contains: input.search,
					mode: "insensitive",
				};
			}

			const [audiences, total] = await Promise.all([
				prisma.emailAudience.findMany({
					where,
					skip: input.offset,
					take: input.limit,
					orderBy: { createdAt: "desc" },
					include: { _count: { select: { contacts: true } } },
				}),
				prisma.emailAudience.count({ where }),
			]);

			return audienceListResponseSchema.parse({
				audiences: audiences.map((a) => mapAudience(a)),
				total,
			});
		}),

	update: protectedProcedure
		.input(audienceUpdateInputSchema)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session?.user?.id;
			if (!userId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "User session not found",
				});
			}

			const audience = await prisma.emailAudience.findUnique({
				where: { id: input.id },
			});

			if (!audience) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Audience not found",
				});
			}

			if (audience.userId !== userId) {
				if (audience.teamId) {
					const member = await prisma.teamMember.findUnique({
						where: {
							teamId_userId: { teamId: audience.teamId, userId },
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

			const now = new Date();

			const updated = await prisma.emailAudience.update({
				where: { id: input.id },
				data: {
					...(input.name !== undefined && { name: input.name }),
					...(input.description !== undefined && {
						description: input.description,
					}),
					updatedAt: now,
				},
			});

			const withCount = await prisma.emailAudience.findUnique({
				where: { id: updated.id },
				include: { _count: { select: { contacts: true } } },
			});

			if (!withCount) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to load updated audience",
				});
			}

			const [subscribedCount, unsubscribedCount] = await Promise.all([
				prisma.emailAudienceContact.count({
					where: { audienceId: updated.id, status: "SUBSCRIBED" },
				}),
				prisma.emailAudienceContact.count({
					where: { audienceId: updated.id, status: "UNSUBSCRIBED" },
				}),
			]);

			return mapAudience(withCount, subscribedCount, unsubscribedCount);
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

			const audience = await prisma.emailAudience.findUnique({
				where: { id: input.id },
			});

			if (!audience) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Audience not found",
				});
			}

			if (audience.userId !== userId) {
				if (audience.teamId) {
					const member = await prisma.teamMember.findUnique({
						where: {
							teamId_userId: { teamId: audience.teamId, userId },
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

			await prisma.emailAudience.delete({
				where: { id: input.id },
			});

			return { success: true };
		}),

	// CONTACTS
	addContact: protectedProcedure
		.input(audienceContactCreateInputSchema)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session?.user?.id;
			if (!userId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "User session not found",
				});
			}

			const audience = await prisma.emailAudience.findUnique({
				where: { id: input.audienceId },
			});

			if (!audience) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Audience not found",
				});
			}

			if (audience.userId !== userId) {
				if (audience.teamId) {
					const member = await prisma.teamMember.findUnique({
						where: {
							teamId_userId: { teamId: audience.teamId, userId },
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

			const now = new Date();

			const contact = await prisma.emailAudienceContact.create({
				data: {
					id: crypto.randomUUID(),
					audienceId: input.audienceId,
					name: input.name ?? null,
					phoneNumber: input.phoneNumber ?? null,
					emailAddress: input.emailAddress ?? null,
					description: input.description ?? null,
					company: input.company ?? null,
					status: input.status ?? "SUBSCRIBED",
					createdAt: now,
					updatedAt: now,
				},
			});

			return audienceContactSummarySchema.parse({
				...contact,
				name: contact.name ?? null,
				phoneNumber: contact.phoneNumber ?? null,
				emailAddress: contact.emailAddress ?? null,
				description: contact.description ?? null,
				company: contact.company ?? null,
				status: contact.status ?? null,
			});
		}),

	addContactsBulk: protectedProcedure
		.input(audienceContactBulkCreateInputSchema)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session?.user?.id;
			if (!userId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "User session not found",
				});
			}

			const audience = await prisma.emailAudience.findUnique({
				where: { id: input.audienceId },
			});

			if (!audience) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Audience not found",
				});
			}

			if (audience.userId !== userId) {
				if (audience.teamId) {
					const member = await prisma.teamMember.findUnique({
						where: {
							teamId_userId: { teamId: audience.teamId, userId },
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

			const now = new Date();

			// Prepare rows, defaulting status to SUBSCRIBED when not specified
			const rows = input.contacts.map((c, index) => ({
				id: crypto.randomUUID(),
				audienceId: input.audienceId,
				name: c.name ?? null,
				phoneNumber: c.phoneNumber ?? null,
				emailAddress: c.emailAddress ?? null,
				description: c.description ?? null,
				company: c.company ?? null,
				status: (c.status ?? "SUBSCRIBED") as "SUBSCRIBED" | "UNSUBSCRIBED",
				createdAt: now,
				updatedAt: now,
				// keep index for potential debugging; not stored
			}));

			// Chunk into batches to avoid exceeding parameter limits on large CSVs
			const CHUNK_SIZE = 500;
			let added = 0;

			for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
				const chunk = rows.slice(i, i + CHUNK_SIZE);
				if (chunk.length === 0) continue;
				const result = await prisma.emailAudienceContact.createMany({
					data: chunk,
				});
				added += result.count;
			}

			return { added };
		}),

	updateContact: protectedProcedure
		.input(audienceContactUpdateInputSchema)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session?.user?.id;
			if (!userId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "User session not found",
				});
			}

			const audience = await prisma.emailAudience.findUnique({
				where: { id: input.audienceId },
			});

			if (!audience) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Audience not found",
				});
			}

			if (audience.userId !== userId) {
				if (audience.teamId) {
					const member = await prisma.teamMember.findUnique({
						where: {
							teamId_userId: { teamId: audience.teamId, userId },
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

			const now = new Date();

			const updated = await prisma.emailAudienceContact.update({
				where: { id: input.id },
				data: {
					...(input.name !== undefined && { name: input.name }),
					...(input.phoneNumber !== undefined && {
						phoneNumber: input.phoneNumber,
					}),
					...(input.emailAddress !== undefined && {
						emailAddress: input.emailAddress,
					}),
					...(input.description !== undefined && {
						description: input.description,
					}),
					...(input.company !== undefined && { company: input.company }),
					...(input.status !== undefined && { status: input.status ?? null }),
					updatedAt: now,
				},
			});

			return audienceContactSummarySchema.parse({
				...updated,
				name: updated.name ?? null,
				phoneNumber: updated.phoneNumber ?? null,
				emailAddress: updated.emailAddress ?? null,
				description: updated.description ?? null,
				company: updated.company ?? null,
				status: updated.status ?? null,
			});
		}),

	deleteContact: protectedProcedure
		.input(z.object({ id: z.string().min(1), audienceId: z.string().min(1) }))
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session?.user?.id;
			if (!userId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "User session not found",
				});
			}

			const audience = await prisma.emailAudience.findUnique({
				where: { id: input.audienceId },
			});

			if (!audience) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Audience not found",
				});
			}

			if (audience.userId !== userId) {
				if (audience.teamId) {
					const member = await prisma.teamMember.findUnique({
						where: {
							teamId_userId: { teamId: audience.teamId, userId },
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

			await prisma.emailAudienceContact.delete({
				where: { id: input.id },
			});

			return { success: true };
		}),

	deleteAllContacts: protectedProcedure
		.input(z.object({ audienceId: z.string().min(1) }))
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session?.user?.id;
			if (!userId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "User session not found",
				});
			}

			const audience = await prisma.emailAudience.findUnique({
				where: { id: input.audienceId },
			});

			if (!audience) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Audience not found",
				});
			}

			if (audience.userId !== userId) {
				if (audience.teamId) {
					const member = await prisma.teamMember.findUnique({
						where: {
							teamId_userId: { teamId: audience.teamId, userId },
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

			const result = await prisma.emailAudienceContact.deleteMany({
				where: { audienceId: input.audienceId },
			});

			return { deleted: result.count };
		}),

	listContacts: protectedProcedure
		.input(audienceContactListFiltersSchema)
		.query(async ({ ctx, input }) => {
			const userId = ctx.session?.user?.id;
			if (!userId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "User session not found",
				});
			}

			const audience = await prisma.emailAudience.findUnique({
				where: { id: input.audienceId },
			});

			if (!audience) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Audience not found",
				});
			}

			if (audience.userId !== userId) {
				if (audience.teamId) {
					const member = await prisma.teamMember.findUnique({
						where: {
							teamId_userId: { teamId: audience.teamId, userId },
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

			const where: Prisma.EmailAudienceContactWhereInput = {
				audienceId: input.audienceId,
			};

			if (input.status) {
				where.status =
					input.status === "SUBSCRIBED" || input.status === "UNSUBSCRIBED"
						? input.status
						: undefined;
			}

			if (input.search) {
				where.OR = [
					{ name: { contains: input.search, mode: "insensitive" } },
					{ emailAddress: { contains: input.search, mode: "insensitive" } },
					{ company: { contains: input.search, mode: "insensitive" } },
				];
			}

			if (input.from || input.to) {
				where.createdAt = {};
				if (input.from) {
					where.createdAt.gte = input.from;
				}
				if (input.to) {
					where.createdAt.lte = input.to;
				}
			}

			const [contacts, total] = await Promise.all([
				prisma.emailAudienceContact.findMany({
					where,
					skip: input.offset,
					take: input.limit,
					orderBy: { createdAt: "desc" },
				}),
				prisma.emailAudienceContact.count({ where }),
			]);

			return audienceContactListResponseSchema.parse({
				contacts: contacts.map((c) =>
					audienceContactSummarySchema.parse({
						...c,
						name: c.name ?? null,
						phoneNumber: c.phoneNumber ?? null,
						emailAddress: c.emailAddress ?? null,
						description: c.description ?? null,
						company: c.company ?? null,
						status: c.status ?? null,
					}),
				),
				total,
			});
		}),
});

