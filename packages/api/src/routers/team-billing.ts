import { router, protectedProcedure } from "../trpc";
import { z } from "zod";
import prisma from "@nPanel/db";
import * as crypto from "crypto";
import { TRPCError } from "@trpc/server";

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

const getAuthenticatedUser = async (session: { user?: { id?: string } } | null) => {
	if (!session?.user?.id) {
		throw new TRPCError({ code: "UNAUTHORIZED" });
	}

	const dbUser = await prisma.user.findUnique({
		where: { id: session.user.id },
		select: { id: true, role: true },
	});

	if (!dbUser) {
		throw new TRPCError({ code: "UNAUTHORIZED" });
	}

	return dbUser;
};

const isAgencyUser = (role: string) =>
	["AGENCY_USER", "AGENCY_ADMIN", "AGENCY_SUPER_ADMIN"].includes(role);

const getAccessibleTeamIds = async (userId: string) => {
	const memberships = await prisma.teamMember.findMany({
		where: { userId },
		select: { teamId: true },
	});

	return memberships.map((membership) => membership.teamId);
};

const ensureTeamAccess = async (teamId: string, userId: string, role: string) => {
	if (isAgencyUser(role)) {
		return;
	}

	const membership = await prisma.teamMember.findFirst({
		where: { teamId, userId },
		select: { id: true },
	});

	if (!membership) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "You do not have access to this team.",
		});
	}
};

export const teamBillingRouter = router({
	listTeams: protectedProcedure.output(listTeamsOutputSchema).query(async ({ ctx }) => {
		const user = await getAuthenticatedUser(ctx.session);

		// For agency users, return all teams regardless of membership or active status
		// For regular users, only return teams they are members of
		const isAgency = isAgencyUser(user.role);
		
		let whereClause: Record<string, unknown> = {};
		
		if (!isAgency) {
			const accessibleTeamIds = await getAccessibleTeamIds(user.id);
			whereClause = {
				id: { in: accessibleTeamIds },
			};
		}

		const teams = await prisma.team.findMany({
			where: whereClause,
			select: {
				id: true,
				name: true,
				slug: true,
				billingSettings: true,
			},
			orderBy: { name: "asc" },
		});

		return listTeamsOutputSchema.parse({
			teams: teams.map((team) => ({
				id: team.id,
				name: team.name,
				slug: team.slug,
				hasBillingSettings: Boolean(team.billingSettings),
				isBillingComplete: isBillingSettingsComplete(team.billingSettings ?? undefined),
				billingSettings: team.billingSettings
					? billingSettingsOutputSchema.parse({
							...team.billingSettings,
							createdAt: team.billingSettings.createdAt,
							updatedAt: team.billingSettings.updatedAt,
						})
					: null,
			})),
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
			const user = await getAuthenticatedUser(ctx.session);
			await ensureTeamAccess(input.teamId, user.id, user.role);

			const settings = await prisma.teamBillingSettings.findUnique({
				where: { teamId: input.teamId },
			});

			if (!settings) {
				return null;
			}

			return billingSettingsOutputSchema.parse(settings);
		}),

	upsert: protectedProcedure
		.input(billingSettingsInputSchema)
		.output(billingSettingsOutputSchema)
		.mutation(async ({ ctx, input }) => {
			const user = await getAuthenticatedUser(ctx.session);
			await ensureTeamAccess(input.teamId, user.id, user.role);

			const existing = await prisma.teamBillingSettings.findUnique({
				where: { teamId: input.teamId },
			});

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
				updatedBy: user.id,
				updatedAt: now,
			};

			const result = await prisma.$transaction(async (tx) => {
				if (existing) {
					const updated = await tx.teamBillingSettings.update({
						where: { id: existing.id },
						data,
					});

					await tx.teamBillingSettingsActivityLog.create({
						data: {
							id: crypto.randomUUID(),
							teamBillingSettingsId: existing.id,
							userId: user.id,
							action: "UPDATE",
							description: "Updated team billing settings",
							metadata: null,
							ipAddress: null,
							userAgent: null,
							createdAt: now,
						},
					});

					return updated;
				}

				const created = await tx.teamBillingSettings.create({
					data: {
						id: crypto.randomUUID(),
						teamId: input.teamId,
						createdAt: now,
						...data,
					},
				});

				await tx.teamBillingSettingsActivityLog.create({
					data: {
						id: crypto.randomUUID(),
						teamBillingSettingsId: created.id,
						userId: user.id,
						action: "CREATE",
						description: "Created team billing settings",
						metadata: null,
						ipAddress: null,
						userAgent: null,
						createdAt: now,
					},
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
			const user = await getAuthenticatedUser(ctx.session);
			await ensureTeamAccess(input.teamId, user.id, user.role);

			const settings = await prisma.teamBillingSettings.findUnique({
				where: { teamId: input.teamId },
				select: { id: true },
			});

			if (!settings) {
				return [];
			}

			const logs = await prisma.teamBillingSettingsActivityLog.findMany({
				where: { teamBillingSettingsId: settings.id },
				orderBy: { createdAt: "desc" },
			});

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
			const user = await getAuthenticatedUser(ctx.session);
			await ensureTeamAccess(input.teamId, user.id, user.role);

			const settings = await prisma.teamBillingSettings.findUnique({
				where: { teamId: input.teamId },
				select: { id: true },
			});

			if (!settings) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Billing settings not found for this team.",
				});
			}

			const now = new Date();

			await prisma.$transaction(async (tx) => {
				await tx.teamBillingSettingsActivityLog.create({
					data: {
						id: crypto.randomUUID(),
						teamBillingSettingsId: settings.id,
						userId: user.id,
						action: "DELETE",
						description: "Deleted team billing settings",
						metadata: null,
						ipAddress: null,
						userAgent: null,
						createdAt: now,
					},
				});

				await tx.teamBillingSettings.delete({
					where: { id: settings.id },
				});
			});

			return { success: true };
		}),
});

