import { TRPCError } from "@trpc/server";
import { and, count, desc, eq, ilike, sql } from "@npanel/db";
import * as crypto from "crypto";
import { db } from "@npanel/db";
import {
  emailAudience,
  emailAudienceContact,
} from "@npanel/db/schema/email-marketing";
import { teamMember } from "@npanel/db/schema/teams";
import { z } from "zod";
import { protectedProcedure, router } from "../../trpc";
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
		contactsCount: number;
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
		contactsCount: audience.contactsCount,
		subscribedCount,
		unsubscribedCount,
	});
}

async function assertTeamMember(teamId: string, userId: string) {
	const [member] = await db
		.select({ id: teamMember.id })
		.from(teamMember)
		.where(and(eq(teamMember.teamId, teamId), eq(teamMember.userId, userId)))
		.limit(1);
	if (!member) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "You do not have access to this team",
		});
	}
}

const isAgencyUserRole = (role: string | null | undefined) =>
	["AGENCY_USER", "AGENCY_ADMIN", "AGENCY_SUPER_ADMIN"].includes(role ?? "");

const isAgencySuperAdminRole = (role: string | null | undefined) =>
	role === "AGENCY_SUPER_ADMIN";

async function fetchAudienceWithCounts(id: string) {
	const [row] = await db
		.select({
			id: emailAudience.id,
			name: emailAudience.name,
			description: emailAudience.description,
			userId: emailAudience.userId,
			teamId: emailAudience.teamId,
			createdAt: emailAudience.createdAt,
			updatedAt: emailAudience.updatedAt,
			contactsCount: count(emailAudienceContact.id).as("contactsCount"),
		})
		.from(emailAudience)
		.leftJoin(emailAudienceContact, eq(emailAudienceContact.audienceId, emailAudience.id))
		.where(eq(emailAudience.id, id))
		.groupBy(
			emailAudience.id,
			emailAudience.name,
			emailAudience.description,
			emailAudience.userId,
			emailAudience.teamId,
			emailAudience.createdAt,
			emailAudience.updatedAt,
		)
		.limit(1);
	return row ?? null;
}

async function assertAudienceReadAccess(
	audienceId: string,
	userId: string,
	userRole: string | null | undefined,
) {
	if (isAgencyUserRole(userRole)) {
		const [audience] = await db
			.select({
				id: emailAudience.id,
				userId: emailAudience.userId,
				teamId: emailAudience.teamId,
			})
			.from(emailAudience)
			.where(eq(emailAudience.id, audienceId))
			.limit(1);
		if (!audience) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Audience not found",
			});
		}
		return audience;
	}

	return assertAudienceMutationAccess(audienceId, userId, userRole);
}

async function assertAudienceMutationAccess(
	audienceId: string,
	userId: string,
	userRole: string | null | undefined,
) {
	const [audience] = await db
		.select({
			id: emailAudience.id,
			userId: emailAudience.userId,
			teamId: emailAudience.teamId,
		})
		.from(emailAudience)
		.where(eq(emailAudience.id, audienceId))
		.limit(1);

	if (!audience) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Audience not found",
		});
	}

	if (audience.userId === userId || isAgencySuperAdminRole(userRole)) {
		return audience;
	}

	throw new TRPCError({
		code: "FORBIDDEN",
		message: "Access denied",
	});
}

export const emailMarketingAudiencesRouter = router({
	create: protectedProcedure
		.input(audienceCreateInputSchema)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session?.user?.id;
			const userRole = ctx.session?.user?.role;
			if (!userId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "User session not found",
				});
			}

			const now = new Date();

			// If teamId is provided, ensure user is a member of the team
			if (input.teamId && !isAgencySuperAdminRole(userRole)) {
				await assertTeamMember(input.teamId, userId);
			}

			const id = crypto.randomUUID();

			await db.insert(emailAudience).values({
				id,
				name: input.name,
				description: input.description ?? null,
				userId,
				teamId: input.teamId ?? null,
				createdAt: now,
				updatedAt: now,
			});

			const withCount = await fetchAudienceWithCounts(id);

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
			const userRole = ctx.session?.user?.role;
			if (!userId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "User session not found",
				});
			}

			await assertAudienceReadAccess(input.id, userId, userRole);

			const withCount = await fetchAudienceWithCounts(input.id);

			if (!withCount) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to load audience",
				});
			}

			const [subscribedCount, unsubscribedCount] = await Promise.all([
				db
					.select({ value: count() })
					.from(emailAudienceContact)
					.where(
						and(
							eq(emailAudienceContact.audienceId, input.id),
							eq(emailAudienceContact.status, "SUBSCRIBED"),
						),
					)
					.then((rows) => Number(rows[0]?.value ?? 0)),
				db
					.select({ value: count() })
					.from(emailAudienceContact)
					.where(
						and(
							eq(emailAudienceContact.audienceId, input.id),
							eq(emailAudienceContact.status, "UNSUBSCRIBED"),
						),
					)
					.then((rows) => Number(rows[0]?.value ?? 0)),
			]);

			return mapAudience(withCount, subscribedCount, unsubscribedCount);
		}),

	list: protectedProcedure
		.input(audienceListFiltersSchema)
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
				const accessOr = [eq(emailAudience.userId, userId)];
				if (input.teamId) {
					accessOr.push(
						sql`(${emailAudience.teamId} = ${input.teamId} AND EXISTS (select 1 from ${teamMember} tm where tm.team_id = ${input.teamId} and tm.user_id = ${userId}))`,
					);
				}
				conditions.push(sql`(${or(...accessOr)})`);
			}

			if (input.teamId) {
				conditions.push(eq(emailAudience.teamId, input.teamId));
			}

			if (input.search) {
				conditions.push(ilike(emailAudience.name, `%${input.search}%`));
			}

			const whereClause =
				conditions.length > 0
					? and(...conditions)
					: sql`true`;

			const [audiences, totalRes] = await Promise.all([
				db
					.select({
						id: emailAudience.id,
						name: emailAudience.name,
						description: emailAudience.description,
						userId: emailAudience.userId,
						teamId: emailAudience.teamId,
						createdAt: emailAudience.createdAt,
						updatedAt: emailAudience.updatedAt,
						contactsCount: count(emailAudienceContact.id).as("contactsCount"),
					})
					.from(emailAudience)
					.leftJoin(
						emailAudienceContact,
						eq(emailAudienceContact.audienceId, emailAudience.id),
					)
					.where(whereClause)
					.groupBy(
						emailAudience.id,
						emailAudience.name,
						emailAudience.description,
						emailAudience.userId,
						emailAudience.teamId,
						emailAudience.createdAt,
						emailAudience.updatedAt,
					)
					.orderBy(desc(emailAudience.createdAt))
					.limit(input.limit)
					.offset(input.offset),
				db
					.select({ value: count() })
					.from(emailAudience)
					.where(whereClause),
			]);

			const total = Number(totalRes[0]?.value ?? 0);

			return audienceListResponseSchema.parse({
				audiences: audiences.map((a) => mapAudience(a)),
				total,
			});
		}),

	update: protectedProcedure
		.input(audienceUpdateInputSchema)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session?.user?.id;
			const userRole = ctx.session?.user?.role;
			if (!userId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "User session not found",
				});
			}

			await assertAudienceMutationAccess(input.id, userId, userRole);

			const now = new Date();

			await db
				.update(emailAudience)
				.set({
					...(input.name !== undefined && { name: input.name }),
					...(input.description !== undefined && {
						description: input.description,
					}),
					updatedAt: now,
				})
				.where(eq(emailAudience.id, input.id));

			const withCount = await fetchAudienceWithCounts(input.id);

			if (!withCount) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to load updated audience",
				});
			}

			const [subscribedCount, unsubscribedCount] = await Promise.all([
				db
					.select({ value: count() })
					.from(emailAudienceContact)
					.where(
						and(
							eq(emailAudienceContact.audienceId, input.id),
							eq(emailAudienceContact.status, "SUBSCRIBED"),
						),
					)
					.then((rows) => Number(rows[0]?.value ?? 0)),
				db
					.select({ value: count() })
					.from(emailAudienceContact)
					.where(
						and(
							eq(emailAudienceContact.audienceId, input.id),
							eq(emailAudienceContact.status, "UNSUBSCRIBED"),
						),
					)
					.then((rows) => Number(rows[0]?.value ?? 0)),
			]);

			return mapAudience(withCount, subscribedCount, unsubscribedCount);
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

			await assertAudienceMutationAccess(input.id, userId, userRole);

			await db.delete(emailAudience).where(eq(emailAudience.id, input.id));

			return { success: true };
		}),

	// CONTACTS
	addContact: protectedProcedure
		.input(audienceContactCreateInputSchema)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session?.user?.id;
			const userRole = ctx.session?.user?.role;
			if (!userId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "User session not found",
				});
			}

			await assertAudienceMutationAccess(input.audienceId, userId, userRole);

			const now = new Date();

			const id = crypto.randomUUID();

			await db.insert(emailAudienceContact).values({
				id,
				audienceId: input.audienceId,
				name: input.name ?? null,
				phoneNumber: input.phoneNumber ?? null,
				emailAddress: input.emailAddress ?? null,
				description: input.description ?? null,
				company: input.company ?? null,
				status: (input.status ?? "SUBSCRIBED") as "SUBSCRIBED" | "UNSUBSCRIBED" | null,
				createdAt: now,
				updatedAt: now,
			});

			const [contact] = await db
				.select()
				.from(emailAudienceContact)
				.where(eq(emailAudienceContact.id, id))
				.limit(1);

			if (!contact) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to load created contact",
				});
			}

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
			const userRole = ctx.session?.user?.role;
			if (!userId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "User session not found",
				});
			}

			await assertAudienceMutationAccess(input.audienceId, userId, userRole);

			const now = new Date();

			// Prepare rows, defaulting status to SUBSCRIBED when not specified
			const rows = input.contacts.map((c) => ({
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
				await db.insert(emailAudienceContact).values(chunk);
				added += chunk.length;
			}

			return { added };
		}),

	updateContact: protectedProcedure
		.input(audienceContactUpdateInputSchema)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session?.user?.id;
			const userRole = ctx.session?.user?.role;
			if (!userId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "User session not found",
				});
			}

			await assertAudienceMutationAccess(input.audienceId, userId, userRole);

			const now = new Date();

			await db
				.update(emailAudienceContact)
				.set({
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
				})
				.where(eq(emailAudienceContact.id, input.id));

			const [updated] = await db
				.select()
				.from(emailAudienceContact)
				.where(eq(emailAudienceContact.id, input.id))
				.limit(1);

			if (!updated) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Contact not found",
				});
			}

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
			const userRole = ctx.session?.user?.role;
			if (!userId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "User session not found",
				});
			}

			await assertAudienceMutationAccess(input.audienceId, userId, userRole);

			await db
				.delete(emailAudienceContact)
				.where(eq(emailAudienceContact.id, input.id));

			return { success: true };
		}),

	deleteAllContacts: protectedProcedure
		.input(z.object({ audienceId: z.string().min(1) }))
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session?.user?.id;
			const userRole = ctx.session?.user?.role;
			if (!userId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "User session not found",
				});
			}

			await assertAudienceMutationAccess(input.audienceId, userId, userRole);

			const result = await db
				.delete(emailAudienceContact)
				.where(eq(emailAudienceContact.audienceId, input.audienceId))
				.returning({ id: emailAudienceContact.id });

			return { deleted: result.length };
		}),

	listContacts: protectedProcedure
		.input(audienceContactListFiltersSchema)
		.query(async ({ ctx, input }) => {
			const userId = ctx.session?.user?.id;
			const userRole = ctx.session?.user?.role;
			if (!userId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "User session not found",
				});
			}

			await assertAudienceReadAccess(input.audienceId, userId, userRole);

			const conditions = [eq(emailAudienceContact.audienceId, input.audienceId)];

			if (
				input.status === "SUBSCRIBED" ||
				input.status === "UNSUBSCRIBED"
			) {
				conditions.push(eq(emailAudienceContact.status, input.status));
			}

			if (input.search) {
				const pattern = `%${input.search}%`;
				conditions.push(
					sql`(
            ${emailAudienceContact.name} ILIKE ${pattern}
            OR ${emailAudienceContact.emailAddress} ILIKE ${pattern}
            OR ${emailAudienceContact.company} ILIKE ${pattern}
          )`,
				);
			}

			if (input.from) {
				conditions.push(sql`${emailAudienceContact.createdAt} >= ${input.from}`);
			}
			if (input.to) {
				conditions.push(sql`${emailAudienceContact.createdAt} <= ${input.to}`);
			}

			const whereClause = and(...conditions);

			const [contacts, totalRes] = await Promise.all([
				db
					.select()
					.from(emailAudienceContact)
					.where(whereClause)
					.orderBy(desc(emailAudienceContact.createdAt))
					.limit(input.limit)
					.offset(input.offset),
				db
					.select({ value: count() })
					.from(emailAudienceContact)
					.where(whereClause),
			]);

			const total = Number(totalRes[0]?.value ?? 0);

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

