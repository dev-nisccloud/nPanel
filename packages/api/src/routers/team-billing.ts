import * as crypto from "node:crypto";
import { router, protectedProcedure } from "../trpc";
import { z } from "zod";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { db } from "@npanel/db";
import { user } from "@npanel/db/schema/auth";
import {
	team,
	teamBillingSettings,
	teamBillingSettingsActivityLog,
	teamMember,
} from "@npanel/db/schema/teams";

const billingSettingsBaseSchema = z.object({
	legalName: z.string().min(1, "Legal name is required"),
	billingEmail: z.string().email("Enter a valid billing email"),
	billingPhone: z.string().optional().nullable(),
	addressLine1: z.string().min(1, "Address line 1 is required"),
	addressLine2: z.string().optional().nullable(),
	city: z.string().min(1, "City is required"),
	state: z.string().optional().nullable(),
	country: z.string().min(1, "Country is required"),
	postalCode: z.string().optional().nullable(),
	taxId: z.string().optional().nullable(),
	additionalNotes: z.string().optional().nullable(),
});

const billingSettingsInputSchema = billingSettingsBaseSchema.extend({
	teamId: z.string().min(1),
});

const billingSettingsOutputSchema = billingSettingsBaseSchema.extend({
	id: z.string(),
	teamId: z.string(),
	updatedBy: z.string(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

const billingSettingsActivityLogSchema = z.object({
	id: z.string(),
	teamBillingSettingsId: z.string(),
	userId: z.string(),
	action: z.string(),
	description: z.string().nullable(),
	metadata: z.any().nullable(),
	ipAddress: z.string().nullable(),
	userAgent: z.string().nullable(),
	createdAt: z.date(),
});

const teamBillingSummarySchema = z.object({
	id: z.string(),
	name: z.string(),
	slug: z.string(),
	hasBillingSettings: z.boolean(),
	isBillingComplete: z.boolean(),
	billingSettings: billingSettingsOutputSchema.nullable(),
});

const listTeamsOutputSchema = z.object({
	teams: z.array(teamBillingSummarySchema),
});

const completenessRequiredFields = [
	"legalName",
	"billingEmail",
	"addressLine1",
	"city",
	"country",
] as const;

type CompletenessField = (typeof completenessRequiredFields)[number];

const isBillingSettingsComplete = (
	settings: Partial<z.infer<typeof billingSettingsBaseSchema>> | null | undefined,
) => {
	if (!settings) {
		return false;
	}

	return completenessRequiredFields.every((field: CompletenessField) => {
		const value = settings[field];
		return typeof value === "string" && value.trim().length > 0;
	});
};

/**
 * Get authenticated user - optimized to use session role when available
 * Falls back to database query if role not in session
 */
const getAuthenticatedUser = async (
	session: { user?: { id?: string; role?: string | null | undefined } } | null,
) => {
	if (!session?.user?.id) {
		throw new TRPCError({ code: "UNAUTHORIZED" });
	}

	// Optimize: Use role from session if available (set by auth hooks)
	// This avoids unnecessary database queries
	const sessionRole = session.user.role ?? undefined;

	if (sessionRole) {
		// Role is in session, only need to verify user exists
		const [dbUser] = await db
			.select({ id: user.id })
			.from(user)
			.where(eq(user.id, session.user.id))
			.limit(1);

		if (!dbUser) {
			throw new TRPCError({ code: "UNAUTHORIZED" });
		}

		return { id: dbUser.id, role: sessionRole };
	}

	// Fallback: Query database for role if not in session
	const [dbUser] = await db
		.select({ id: user.id, role: user.role })
		.from(user)
		.where(eq(user.id, session.user.id))
		.limit(1);

	if (!dbUser) {
		throw new TRPCError({ code: "UNAUTHORIZED" });
	}

	return dbUser;
};

const isAgencyUser = (role: string) =>
	["AGENCY_USER", "AGENCY_ADMIN", "AGENCY_SUPER_ADMIN"].includes(role);

const getAccessibleTeamIds = async (userId: string) => {
	const memberships = await db
		.select({ teamId: teamMember.teamId })
		.from(teamMember)
		.where(eq(teamMember.userId, userId));

	return memberships.map((membership) => membership.teamId);
};

const ensureTeamAccess = async (teamId: string, userId: string, role: string) => {
	if (isAgencyUser(role)) {
		return;
	}

	const [membership] = await db
		.select({ id: teamMember.id })
		.from(teamMember)
		.where(and(eq(teamMember.teamId, teamId), eq(teamMember.userId, userId)))
		.limit(1);

	if (!membership) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "You do not have access to this team.",
		});
	}
};

/** Drizzle relation is `many`; DB enforces one row per team via unique teamId. */
function firstBillingSettings(
	settings: (typeof teamBillingSettings.$inferSelect)[] | undefined,
): (typeof teamBillingSettings.$inferSelect) | null {
	if (!settings?.length) return null;
	return settings[0] ?? null;
}

export const teamBillingRouter = router({
	listTeams: protectedProcedure.output(listTeamsOutputSchema).query(async ({ ctx }) => {
		const userRes = await getAuthenticatedUser(ctx.session);

		// For agency users, return all teams regardless of membership or active status
		// For regular users, only return teams they are members of
		const isAgency = isAgencyUser(userRes.role);

		if (!isAgency) {
			const accessibleTeamIds = await getAccessibleTeamIds(userRes.id);
			if (accessibleTeamIds.length === 0) {
				return listTeamsOutputSchema.parse({ teams: [] });
			}

			const teamsList = await db.query.team.findMany({
				where: inArray(team.id, accessibleTeamIds),
				orderBy: [asc(team.name)],
				with: {
					billingSettings: true,
				},
			});

			return listTeamsOutputSchema.parse({
				teams: teamsList.map((t) => {
					const billing = firstBillingSettings(t.billingSettings);
					return {
						id: t.id,
						name: t.name,
						slug: t.slug,
						hasBillingSettings: Boolean(billing),
						isBillingComplete: isBillingSettingsComplete(billing ?? undefined),
						billingSettings: billing
							? billingSettingsOutputSchema.parse({
									...billing,
									createdAt: billing.createdAt,
									updatedAt: billing.updatedAt,
								})
							: null,
					};
				}),
			});
		}

		const teamsList = await db.query.team.findMany({
			orderBy: [asc(team.name)],
			with: {
				billingSettings: true,
			},
		});

		return listTeamsOutputSchema.parse({
			teams: teamsList.map((t) => {
				const billing = firstBillingSettings(t.billingSettings);
				return {
					id: t.id,
					name: t.name,
					slug: t.slug,
					hasBillingSettings: Boolean(billing),
					isBillingComplete: isBillingSettingsComplete(billing ?? undefined),
					billingSettings: billing
						? billingSettingsOutputSchema.parse({
								...billing,
								createdAt: billing.createdAt,
								updatedAt: billing.updatedAt,
							})
						: null,
				};
			}),
		});
	}),

	getByTeam: protectedProcedure
		.input(
			z.object({
				teamId: z.string().min(1),
			}),
		)
		.output(billingSettingsOutputSchema.nullable())
		.query(async ({ ctx, input }) => {
			const userRes = await getAuthenticatedUser(ctx.session);
			await ensureTeamAccess(input.teamId, userRes.id, userRes.role);

			const [settings] = await db
				.select()
				.from(teamBillingSettings)
				.where(eq(teamBillingSettings.teamId, input.teamId))
				.limit(1);

			if (!settings) {
				return null;
			}

			return billingSettingsOutputSchema.parse(settings);
		}),

	upsert: protectedProcedure
		.input(billingSettingsInputSchema)
		.output(billingSettingsOutputSchema)
		.mutation(async ({ ctx, input }) => {
			const userRes = await getAuthenticatedUser(ctx.session);
			await ensureTeamAccess(input.teamId, userRes.id, userRes.role);

			const [existing] = await db
				.select()
				.from(teamBillingSettings)
				.where(eq(teamBillingSettings.teamId, input.teamId))
				.limit(1);

			const now = new Date();
			const data = {
				legalName: input.legalName,
				billingEmail: input.billingEmail,
				billingPhone: input.billingPhone ?? null,
				addressLine1: input.addressLine1,
				addressLine2: input.addressLine2 ?? null,
				city: input.city,
				state: input.state ?? null,
				country: input.country,
				postalCode: input.postalCode ?? null,
				taxId: input.taxId ?? null,
				additionalNotes: input.additionalNotes ?? null,
				updatedBy: userRes.id,
				updatedAt: now,
			};

			const result = await db.transaction(async (tx) => {
				if (existing) {
					const [updated] = await tx
						.update(teamBillingSettings)
						.set(data)
						.where(eq(teamBillingSettings.id, existing.id))
						.returning();

					if (!updated) {
						throw new TRPCError({
							code: "INTERNAL_SERVER_ERROR",
							message: "Failed to update billing settings",
						});
					}

					await tx.insert(teamBillingSettingsActivityLog).values({
						id: crypto.randomUUID(),
						teamBillingSettingsId: existing.id,
						userId: userRes.id,
						action: "UPDATE",
						description: "Updated team billing settings",
						metadata: null,
						ipAddress: null,
						userAgent: null,
						createdAt: now,
					});

					return updated;
				}

				const [created] = await tx
					.insert(teamBillingSettings)
					.values({
						id: crypto.randomUUID(),
						teamId: input.teamId,
						createdAt: now,
						...data,
					})
					.returning();

				if (!created) {
					throw new TRPCError({
						code: "INTERNAL_SERVER_ERROR",
						message: "Failed to create billing settings",
					});
				}

				await tx.insert(teamBillingSettingsActivityLog).values({
					id: crypto.randomUUID(),
					teamBillingSettingsId: created.id,
					userId: userRes.id,
					action: "CREATE",
					description: "Created team billing settings",
					metadata: null,
					ipAddress: null,
					userAgent: null,
					createdAt: now,
				});

				return created;
			});

			return billingSettingsOutputSchema.parse(result);
		}),

	getActivityLog: protectedProcedure
		.input(
			z.object({
				teamId: z.string().min(1),
			}),
		)
		.output(z.array(billingSettingsActivityLogSchema))
		.query(async ({ ctx, input }) => {
			const userRes = await getAuthenticatedUser(ctx.session);
			await ensureTeamAccess(input.teamId, userRes.id, userRes.role);

			const [settings] = await db
				.select({ id: teamBillingSettings.id })
				.from(teamBillingSettings)
				.where(eq(teamBillingSettings.teamId, input.teamId))
				.limit(1);

			if (!settings) {
				return [];
			}

			const logs = await db
				.select()
				.from(teamBillingSettingsActivityLog)
				.where(eq(teamBillingSettingsActivityLog.teamBillingSettingsId, settings.id))
				.orderBy(desc(teamBillingSettingsActivityLog.createdAt));

			return logs.map((log) =>
				billingSettingsActivityLogSchema.parse({
					...log,
					description: log.description ?? null,
					metadata: log.metadata ?? null,
					ipAddress: log.ipAddress ?? null,
					userAgent: log.userAgent ?? null,
				}),
			);
		}),

	delete: protectedProcedure
		.input(
			z.object({
				teamId: z.string().min(1),
			}),
		)
		.output(z.object({ success: z.boolean() }))
		.mutation(async ({ ctx, input }) => {
			const userRes = await getAuthenticatedUser(ctx.session);
			await ensureTeamAccess(input.teamId, userRes.id, userRes.role);

			const [settings] = await db
				.select({ id: teamBillingSettings.id })
				.from(teamBillingSettings)
				.where(eq(teamBillingSettings.teamId, input.teamId))
				.limit(1);

			if (!settings) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Billing settings not found for this team.",
				});
			}

			const now = new Date();

			await db.transaction(async (tx) => {
				await tx.insert(teamBillingSettingsActivityLog).values({
					id: crypto.randomUUID(),
					teamBillingSettingsId: settings.id,
					userId: userRes.id,
					action: "DELETE",
					description: "Deleted team billing settings",
					metadata: null,
					ipAddress: null,
					userAgent: null,
					createdAt: now,
				});

				await tx.delete(teamBillingSettings).where(eq(teamBillingSettings.id, settings.id));
			});

			return { success: true };
		}),
});
