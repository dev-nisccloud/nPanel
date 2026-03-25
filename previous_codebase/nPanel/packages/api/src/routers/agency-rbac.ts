import { TRPCError } from "@trpc/server";
import * as crypto from "node:crypto";
import { z } from "zod";

import prisma from "@npanel/db";
import { protectedProcedure, router } from "../trpc";
import { agencyMenuKeySchema, agencyMenuKeys } from "./agency-rbac/menu-keys";

// ============================================================================
// ZOD SCHEMAS – independent from database schema (including enums)
// ============================================================================

const agencyRoleOutputSchema = z.object({
	id: z.string(),
	name: z.string(),
	description: z.string().nullable(),
	isSystem: z.boolean(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

const agencyPermissionOutputSchema = z.object({
	id: z.string(),
	key: agencyMenuKeySchema,
	description: z.string().nullable(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

const listRolesOutputSchema = z.array(agencyRoleOutputSchema);
const listPermissionsOutputSchema = z.array(agencyPermissionOutputSchema);

const createRoleInputSchema = z.object({
	name: z.string().min(2).max(80),
	description: z.string().max(400).optional(),
});

const updateRoleInputSchema = z
	.object({
		roleId: z.string(),
		name: z.string().min(2).max(80).optional(),
		description: z.string().max(400).optional(),
	})
	.refine((data) => data.name !== undefined || data.description !== undefined, {
		message: "At least one field must be provided for update",
	});

const deleteRoleInputSchema = z.object({ roleId: z.string() });

const upsertPermissionInputSchema = z.object({
	key: agencyMenuKeySchema,
	description: z.string().max(400).optional(),
});

const setRolePermissionsInputSchema = z.object({
	roleId: z.string(),
	permissionKeys: z.array(agencyMenuKeySchema).default([]),
});

const assignUserAgencyRoleInputSchema = z.object({
	userId: z.string(),
	roleId: z.string().nullable(),
});

const okSchema = z.object({ success: z.boolean() });

const myMenuAccessOutputSchema = z.object({
	roleId: z.string().nullable(),
	roleName: z.string().nullable(),
	allowedKeys: z.array(agencyMenuKeySchema),
});

const getRoleByIdInputSchema = z.object({
	roleId: z.string(),
});

const roleWithPermissionsOutputSchema = agencyRoleOutputSchema.extend({
	permissionKeys: z.array(agencyMenuKeySchema),
});

function requireAgencySuperAdmin(userRole: string | undefined) {
	if (userRole !== "AGENCY_SUPER_ADMIN") {
		throw new TRPCError({ code: "FORBIDDEN", message: "Only AGENCY_SUPER_ADMIN can perform this action" });
	}
}

// ============================================================================
// tRPC ROUTER
// ============================================================================

export const agencyRbacRouter = router({
	permissionCatalog: protectedProcedure
		.output(z.array(agencyMenuKeySchema))
		.query(async ({ ctx }) => {
			requireAgencySuperAdmin(ctx.session?.user?.role);
			return [...agencyMenuKeys];
		}),

	rolesList: protectedProcedure.output(listRolesOutputSchema).query(async ({ ctx }) => {
		requireAgencySuperAdmin(ctx.session?.user?.role);

		const roles = await prisma.agencyRole.findMany({
			orderBy: [{ isSystem: "desc" }, { name: "asc" }],
		});

		return roles.map((r) => ({
			id: r.id,
			name: r.name,
			description: r.description ?? null,
			isSystem: r.isSystem,
			createdAt: r.createdAt,
			updatedAt: r.updatedAt,
		}));
	}),

	roleById: protectedProcedure
		.input(getRoleByIdInputSchema)
		.output(roleWithPermissionsOutputSchema)
		.query(async ({ ctx, input }) => {
			requireAgencySuperAdmin(ctx.session?.user?.role);

			const role = await prisma.agencyRole.findUnique({
				where: { id: input.roleId },
				include: {
					permissions: {
						select: {
							permission: {
								select: { key: true },
							},
						},
					},
				},
			});

			if (!role) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Role not found" });
			}

			const permissionKeys =
				role.permissions
					.map((rp) => rp.permission.key)
					.filter((key): key is z.infer<typeof agencyMenuKeySchema> => agencyMenuKeySchema.safeParse(key).success) ?? [];

			return {
				id: role.id,
				name: role.name,
				description: role.description ?? null,
				isSystem: role.isSystem,
				createdAt: role.createdAt,
				updatedAt: role.updatedAt,
				permissionKeys: Array.from(new Set(permissionKeys)),
			};
		}),

	roleCreate: protectedProcedure
		.input(createRoleInputSchema)
		.output(agencyRoleOutputSchema)
		.mutation(async ({ ctx, input }) => {
			requireAgencySuperAdmin(ctx.session?.user?.role);

			const role = await prisma.agencyRole.create({
				data: {
					id: crypto.randomUUID(),
					name: input.name,
					description: input.description ?? null,
					isSystem: false,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			});

			return {
				id: role.id,
				name: role.name,
				description: role.description ?? null,
				isSystem: role.isSystem,
				createdAt: role.createdAt,
				updatedAt: role.updatedAt,
			};
		}),

	roleUpdate: protectedProcedure
		.input(updateRoleInputSchema)
		.output(agencyRoleOutputSchema)
		.mutation(async ({ ctx, input }) => {
			requireAgencySuperAdmin(ctx.session?.user?.role);

			const existing = await prisma.agencyRole.findUnique({ where: { id: input.roleId } });
			if (!existing) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Role not found" });
			}

			const updated = await prisma.agencyRole.update({
				where: { id: input.roleId },
				data: {
					name: input.name ?? undefined,
					description: input.description ?? undefined,
					updatedAt: new Date(),
				},
			});

			return {
				id: updated.id,
				name: updated.name,
				description: updated.description ?? null,
				isSystem: updated.isSystem,
				createdAt: updated.createdAt,
				updatedAt: updated.updatedAt,
			};
		}),

	roleDelete: protectedProcedure
		.input(deleteRoleInputSchema)
		.output(okSchema)
		.mutation(async ({ ctx, input }) => {
			requireAgencySuperAdmin(ctx.session?.user?.role);

			const existing = await prisma.agencyRole.findUnique({ where: { id: input.roleId } });
			if (!existing) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Role not found" });
			}
			if (existing.isSystem) {
				throw new TRPCError({ code: "FORBIDDEN", message: "System roles cannot be deleted" });
			}

			await prisma.agencyRole.delete({ where: { id: input.roleId } });
			return { success: true };
		}),

	permissionsList: protectedProcedure.output(listPermissionsOutputSchema).query(async ({ ctx }) => {
		requireAgencySuperAdmin(ctx.session?.user?.role);

		const perms = await prisma.agencyPermission.findMany({
			orderBy: [{ key: "asc" }],
		});

		return perms.map((p) => ({
			id: p.id,
			key: p.key as z.infer<typeof agencyMenuKeySchema>,
			description: p.description ?? null,
			createdAt: p.createdAt,
			updatedAt: p.updatedAt,
		}));
	}),

	permissionUpsert: protectedProcedure
		.input(upsertPermissionInputSchema)
		.output(agencyPermissionOutputSchema)
		.mutation(async ({ ctx, input }) => {
			requireAgencySuperAdmin(ctx.session?.user?.role);

			const existing = await prisma.agencyPermission.findUnique({ where: { key: input.key } });
			if (existing) {
				const updated = await prisma.agencyPermission.update({
					where: { id: existing.id },
					data: {
						description: input.description ?? null,
						updatedAt: new Date(),
					},
				});
				return {
					id: updated.id,
					key: updated.key as z.infer<typeof agencyMenuKeySchema>,
					description: updated.description ?? null,
					createdAt: updated.createdAt,
					updatedAt: updated.updatedAt,
				};
			}

			const created = await prisma.agencyPermission.create({
				data: {
					id: crypto.randomUUID(),
					key: input.key,
					description: input.description ?? null,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			});

			return {
				id: created.id,
				key: created.key as z.infer<typeof agencyMenuKeySchema>,
				description: created.description ?? null,
				createdAt: created.createdAt,
				updatedAt: created.updatedAt,
			};
		}),

	rolePermissionsSet: protectedProcedure
		.input(setRolePermissionsInputSchema)
		.output(okSchema)
		.mutation(async ({ ctx, input }) => {
			requireAgencySuperAdmin(ctx.session?.user?.role);

			const role = await prisma.agencyRole.findUnique({ where: { id: input.roleId } });
			if (!role) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Role not found" });
			}

			const uniqueKeys = Array.from(new Set(input.permissionKeys));

			await prisma.$transaction(async (tx) => {
				// ensure all permissions exist
				for (const key of uniqueKeys) {
					await tx.agencyPermission.upsert({
						where: { key },
						create: {
							id: crypto.randomUUID(),
							key,
							description: null,
							createdAt: new Date(),
							updatedAt: new Date(),
						},
						update: {
							updatedAt: new Date(),
						},
					});
				}

				// clear existing mappings
				await tx.agencyRolePermission.deleteMany({ where: { roleId: input.roleId } });

				if (uniqueKeys.length === 0) {
					return;
				}

				const perms = await tx.agencyPermission.findMany({
					where: { key: { in: uniqueKeys } },
					select: { id: true },
				});

				await tx.agencyRolePermission.createMany({
					data: perms.map((p) => ({
						id: crypto.randomUUID(),
						roleId: input.roleId,
						permissionId: p.id,
						createdAt: new Date(),
					})),
				});
			});

			return { success: true };
		}),

	userAgencyRoleAssign: protectedProcedure
		.input(assignUserAgencyRoleInputSchema)
		.output(okSchema)
		.mutation(async ({ ctx, input }) => {
			requireAgencySuperAdmin(ctx.session?.user?.role);

			const user = await prisma.user.findUnique({ where: { id: input.userId } });
			if (!user) {
				throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
			}
			if (!["AGENCY_ADMIN", "AGENCY_SUPER_ADMIN", "AGENCY_USER"].includes(user.role)) {
				throw new TRPCError({ code: "FORBIDDEN", message: "This user is not an agency user" });
			}

			if (input.roleId !== null) {
				const role = await prisma.agencyRole.findUnique({ where: { id: input.roleId } });
				if (!role) {
					throw new TRPCError({ code: "NOT_FOUND", message: "Role not found" });
				}
			}

			await prisma.user.update({
				where: { id: input.userId },
				data: { agencyRoleId: input.roleId, updatedAt: new Date() },
			});

			return { success: true };
		}),

	myMenuAccess: protectedProcedure.output(myMenuAccessOutputSchema).query(async ({ ctx }) => {
		const userId = ctx.session?.user?.id;
		if (!userId) {
			throw new TRPCError({ code: "UNAUTHORIZED" });
		}

		// Only relevant for agency users; customers get empty keys by default.
		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: {
				role: true,
				agencyRoleId: true,
				agencyRole: {
					select: {
						id: true,
						name: true,
						permissions: {
							select: {
								permission: { select: { key: true } },
							},
						},
					},
				},
			},
		});

		if (!user) {
			throw new TRPCError({ code: "UNAUTHORIZED" });
		}

		if (!["AGENCY_ADMIN", "AGENCY_SUPER_ADMIN", "AGENCY_USER"].includes(user.role)) {
			return { roleId: null, roleName: null, allowedKeys: [] };
		}

		const keys =
			user.agencyRole?.permissions
				.map((p) => p.permission.key)
				.filter((k): k is z.infer<typeof agencyMenuKeySchema> => agencyMenuKeySchema.safeParse(k).success) ?? [];

		return {
			roleId: user.agencyRole?.id ?? null,
			roleName: user.agencyRole?.name ?? null,
			allowedKeys: Array.from(new Set(keys)),
		};
	}),
});

