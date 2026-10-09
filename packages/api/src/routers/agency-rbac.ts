import { TRPCError } from "@trpc/server";
import { eq, inArray, desc, asc } from "@npanel/db";
import * as crypto from "node:crypto";
import { z } from "zod";

import { db } from "@npanel/db";
import { user as userTable } from "@npanel/db/schema/auth";
import {
	agencyPermission,
	agencyPermissionDenialLog,
	agencyRole,
	agencyRolePermission,
} from "@npanel/db/schema/agency-rbac";
import { protectedProcedure, router } from "../trpc";
import {
	AGENCY_PERMISSION_CATALOG,
	AGENCY_PERMISSION_MODULES,
	isAgencyPermissionKey,
} from "../lib/agency-permissions/catalog";
import {
	grantsFromStoredRole,
	invalidateAgencyAccessCache,
	loadAgencyAccess,
} from "../lib/agency-permissions/assert";

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

const agencyGrantSchema = z.object({
	key: z.string(),
	access: z.enum(["read", "write"]),
});

const listRolesOutputSchema = z.array(
	agencyRoleOutputSchema.extend({ grantCount: z.number() }),
);

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

const setRolePermissionsInputSchema = z.object({
	roleId: z.string(),
	grants: z.array(agencyGrantSchema),
});

const assignUserAgencyRoleInputSchema = z.object({
	userId: z.string(),
	roleId: z.string().nullable(),
});

const okSchema = z.object({ success: z.boolean() });

const getRoleByIdInputSchema = z.object({
	roleId: z.string(),
});

const roleWithPermissionsOutputSchema = agencyRoleOutputSchema.extend({
	permissionKeys: z.array(z.string()),
	grants: z.array(agencyGrantSchema),
});

const catalogOutputSchema = z.object({
	entries: z.array(
		z.object({
			key: z.string(),
			module: z.string(),
			moduleLabel: z.string(),
			label: z.string(),
			description: z.string(),
		}),
	),
	modules: z.array(
		z.object({
			id: z.string(),
			label: z.string(),
			keys: z.array(z.string()),
		}),
	),
});

const myPermissionsOutputSchema = z.object({
	unrestricted: z.boolean(),
	roleId: z.string().nullable(),
	roleName: z.string().nullable(),
	permissions: z.record(z.string(), z.enum(["read", "write"])),
});

const denialLogOutputSchema = z.array(
	z.object({
		id: z.string(),
		createdAt: z.date(),
		userId: z.string(),
		userEmail: z.string().nullable(),
		agencyRoleId: z.string().nullable(),
		agencyRoleName: z.string().nullable(),
		procedurePath: z.string(),
		procedureType: z.string(),
		permissionKey: z.string(),
		requiredAccess: z.string(),
		grantedAccess: z.string().nullable(),
		ipAddress: z.string().nullable(),
	}),
);

function normalizeRoleGrants(
	grants: { key: string; access: "read" | "write" }[],
): { key: string; access: "read" | "write" }[] {
	const map = new Map<string, "read" | "write">();
	for (const grant of grants) {
		if (!isAgencyPermissionKey(grant.key)) continue;
		map.set(grant.key, grant.access);
	}
	return [...map.entries()].map(([key, access]) => ({ key, access }));
}

function requireAgencySuperAdmin(userRole: string | null | undefined) {
	if (userRole !== "AGENCY_SUPER_ADMIN") {
		throw new TRPCError({ code: "FORBIDDEN", message: "Only AGENCY_SUPER_ADMIN can perform this action" });
	}
}

const userAccessOutputSchema = z.object({
	userId: z.string(),
	name: z.string(),
	email: z.string(),
	role: z.string(),
	unrestricted: z.boolean(),
	grants: z.array(agencyGrantSchema),
});

const userAccessSetInputSchema = z.object({
	userId: z.string(),
	grants: z.array(agencyGrantSchema),
});

async function replaceRoleGrants(
	roleId: string,
	grants: { key: string; access: "read" | "write" }[],
) {
	await db.transaction(async (tx) => {
		for (const grant of grants) {
			await tx
				.insert(agencyPermission)
				.values({
					id: crypto.randomUUID(),
					key: grant.key,
					description: null,
					createdAt: new Date(),
					updatedAt: new Date(),
				})
				.onConflictDoUpdate({
					target: agencyPermission.key,
					set: { updatedAt: new Date() },
				});
		}

		await tx.delete(agencyRolePermission).where(eq(agencyRolePermission.roleId, roleId));

		if (grants.length > 0) {
			const perms = await tx.query.agencyPermission.findMany({
				where: inArray(
					agencyPermission.key,
					grants.map((grant) => grant.key),
				),
				columns: { id: true, key: true },
			});
			const accessByKey = new Map(grants.map((grant) => [grant.key, grant.access]));
			if (perms.length > 0) {
				await tx.insert(agencyRolePermission).values(
					perms.map((perm) => ({
						id: crypto.randomUUID(),
						roleId,
						permissionId: perm.id,
						access: accessByKey.get(perm.key) ?? "write",
						createdAt: new Date(),
					})),
				);
			}
		}

		await tx.update(agencyRole).set({ updatedAt: new Date() }).where(eq(agencyRole.id, roleId));
	});

	invalidateAgencyAccessCache();
}

async function ensurePersonalAccessRole(userId: string, label: string) {
	const name = `user-access:${userId}`;
	const existing = await db.query.agencyRole.findFirst({
		where: eq(agencyRole.name, name),
		columns: { id: true },
	});
	if (existing) return existing.id;

	const id = crypto.randomUUID();
	await db.insert(agencyRole).values({
		id,
		name,
		description: label,
		menus: [],
		isSystem: false,
		createdAt: new Date(),
		updatedAt: new Date(),
	});
	return id;
}

// ============================================================================
// tRPC ROUTER
// ============================================================================

export const agencyRbacRouter = router({
	rolesList: protectedProcedure.output(listRolesOutputSchema).query(async ({ ctx }) => {
		requireAgencySuperAdmin(ctx.session?.user?.role);

		const roles = await db.query.agencyRole.findMany({
			orderBy: [desc(agencyRole.isSystem), asc(agencyRole.name)],
			with: {
				permissions: {
					with: {
						permission: { columns: { key: true } },
					},
				},
			},
		});

		return roles.map((r) => {
			const grants = grantsFromStoredRole(
				r.permissions.map((row) => ({
					key: row.permission.key,
					access: row.access,
				})),
			);
			return {
				id: r.id,
				name: r.name,
				description: r.description ?? null,
				grantCount: Object.keys(grants).length,
				isSystem: r.isSystem,
				createdAt: r.createdAt,
				updatedAt: r.updatedAt,
			};
		});
	}),

	roleById: protectedProcedure
		.input(getRoleByIdInputSchema)
		.output(roleWithPermissionsOutputSchema)
		.query(async ({ ctx, input }) => {
			requireAgencySuperAdmin(ctx.session?.user?.role);

			const role = await db.query.agencyRole.findFirst({
				where: eq(agencyRole.id, input.roleId),
				with: {
					permissions: {
						with: {
							permission: {
								columns: { key: true },
							},
						},
					},
				},
			});

			if (!role) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Role not found" });
			}

			const grants = grantsFromStoredRole(
				role.permissions.map((rp) => ({
					key: rp.permission.key,
					access: rp.access,
				})),
			);
			const grantList = Object.entries(grants).map(([key, access]) => ({ key, access }));

			return {
				id: role.id,
				name: role.name,
				description: role.description ?? null,
				isSystem: role.isSystem,
				createdAt: role.createdAt,
				updatedAt: role.updatedAt,
				permissionKeys: grantList.map((grant) => grant.key),
				grants: grantList,
			};
		}),

	roleCreate: protectedProcedure
		.input(createRoleInputSchema)
		.output(agencyRoleOutputSchema)
		.mutation(async ({ ctx, input }) => {
			requireAgencySuperAdmin(ctx.session?.user?.role);

			const [role] = await db
				.insert(agencyRole)
				.values({
					id: crypto.randomUUID(),
					name: input.name,
					description: input.description ?? null,
					menus: [],
					isSystem: false,
					createdAt: new Date(),
					updatedAt: new Date(),
				})
				.returning();

			if (!role) {
				throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create role" });
			}

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

			const existing = await db.query.agencyRole.findFirst({
				where: eq(agencyRole.id, input.roleId),
			});
			if (!existing) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Role not found" });
			}

			const [updated] = await db
				.update(agencyRole)
				.set({
					name: input.name ?? undefined,
					description: input.description ?? undefined,
					updatedAt: new Date(),
				})
				.where(eq(agencyRole.id, input.roleId))
				.returning();

			if (!updated) {
				throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to update role" });
			}

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

			const existing = await db.query.agencyRole.findFirst({
				where: eq(agencyRole.id, input.roleId),
			});
			if (!existing) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Role not found" });
			}
			if (existing.isSystem) {
				throw new TRPCError({ code: "FORBIDDEN", message: "System roles cannot be deleted" });
			}

			await db.delete(agencyRole).where(eq(agencyRole.id, input.roleId));
			return { success: true };
		}),

	rolePermissionsSet: protectedProcedure
		.input(setRolePermissionsInputSchema)
		.output(okSchema)
		.mutation(async ({ ctx, input }) => {
			requireAgencySuperAdmin(ctx.session?.user?.role);

			const role = await db.query.agencyRole.findFirst({
				where: eq(agencyRole.id, input.roleId),
			});
			if (!role) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Role not found" });
			}

			await replaceRoleGrants(input.roleId, normalizeRoleGrants(input.grants));
			return { success: true };
		}),

	userAccessGet: protectedProcedure
		.input(z.object({ userId: z.string() }))
		.output(userAccessOutputSchema)
		.query(async ({ ctx, input }) => {
			requireAgencySuperAdmin(ctx.session?.user?.role);

			const userRes = await db.query.user.findFirst({
				where: eq(userTable.id, input.userId),
				columns: { id: true, name: true, email: true, role: true, agencyRoleId: true },
				with: {
					agencyRole: {
						with: {
							permissions: {
								with: { permission: { columns: { key: true } } },
							},
						},
					},
				},
			});
			if (!userRes || !["AGENCY_ADMIN", "AGENCY_SUPER_ADMIN", "AGENCY_USER"].includes(userRes.role)) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Agency user not found" });
			}

			const grants = grantsFromStoredRole(
				userRes.agencyRole?.permissions.map((row) => ({
					key: row.permission.key,
					access: row.access,
				})) ?? [],
			);

			return {
				userId: userRes.id,
				name: userRes.name,
				email: userRes.email,
				role: userRes.role,
				unrestricted: userRes.role === "AGENCY_SUPER_ADMIN" || !userRes.agencyRole,
				grants: Object.entries(grants).map(([key, access]) => ({ key, access })),
			};
		}),

	userAccessSet: protectedProcedure
		.input(userAccessSetInputSchema)
		.output(okSchema)
		.mutation(async ({ ctx, input }) => {
			requireAgencySuperAdmin(ctx.session?.user?.role);

			const userRes = await db.query.user.findFirst({
				where: eq(userTable.id, input.userId),
				columns: { id: true, name: true, email: true, role: true, agencyRoleId: true },
			});
			if (!userRes || !["AGENCY_ADMIN", "AGENCY_SUPER_ADMIN", "AGENCY_USER"].includes(userRes.role)) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Agency user not found" });
			}

			if (userRes.role === "AGENCY_SUPER_ADMIN") {
				return { success: true };
			}

			const roleId = await ensurePersonalAccessRole(userRes.id, userRes.email || userRes.name);
			if (userRes.agencyRoleId !== roleId) {
				await db
					.update(userTable)
					.set({ agencyRoleId: roleId, updatedAt: new Date() })
					.where(eq(userTable.id, userRes.id));
			}

			await replaceRoleGrants(roleId, normalizeRoleGrants(input.grants));
			invalidateAgencyAccessCache(userRes.id);
			return { success: true };
		}),

	userAgencyRoleAssign: protectedProcedure
		.input(assignUserAgencyRoleInputSchema)
		.output(okSchema)
		.mutation(async ({ ctx, input }) => {
			requireAgencySuperAdmin(ctx.session?.user?.role);

			const userRes = await db.query.user.findFirst({
				where: eq(userTable.id, input.userId),
			});
			if (!userRes) {
				throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
			}
			if (!["AGENCY_ADMIN", "AGENCY_SUPER_ADMIN", "AGENCY_USER"].includes(userRes.role)) {
				throw new TRPCError({ code: "FORBIDDEN", message: "This user is not an agency user" });
			}

			if (input.roleId !== null) {
				const role = await db.query.agencyRole.findFirst({
					where: eq(agencyRole.id, input.roleId),
				});
				if (!role) {
					throw new TRPCError({ code: "NOT_FOUND", message: "Role not found" });
				}
			}

			await db
				.update(userTable)
				.set({
					agencyRoleId: input.roleId,
					updatedAt: new Date(),
				})
				.where(eq(userTable.id, input.userId));

			invalidateAgencyAccessCache(input.userId);
			return { success: true };
		}),

	catalog: protectedProcedure.output(catalogOutputSchema).query(async ({ ctx }) => {
		requireAgencySuperAdmin(ctx.session?.user?.role);
		return {
			entries: AGENCY_PERMISSION_CATALOG.map((entry) => ({ ...entry })),
			modules: AGENCY_PERMISSION_MODULES.map((mod) => ({ ...mod, keys: [...mod.keys] })),
		};
	}),

	myPermissions: protectedProcedure.output(myPermissionsOutputSchema).query(async ({ ctx }) => {
		const userId = ctx.session?.user?.id;
		if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });
		const access = await loadAgencyAccess(userId);
		if (!access) {
			return { unrestricted: false, roleId: null, roleName: null, permissions: {} };
		}
		return {
			unrestricted: access.unrestricted,
			roleId: access.agencyRoleId,
			roleName: access.agencyRoleName,
			permissions: access.permissions,
		};
	}),

	denialLog: protectedProcedure
		.input(z.object({ limit: z.number().int().min(1).max(200).default(50) }).optional())
		.output(denialLogOutputSchema)
		.query(async ({ ctx, input }) => {
			requireAgencySuperAdmin(ctx.session?.user?.role);
			const rows = await db
				.select()
				.from(agencyPermissionDenialLog)
				.orderBy(desc(agencyPermissionDenialLog.createdAt))
				.limit(input?.limit ?? 50);
			return rows.map((row) => ({
				id: row.id,
				createdAt: row.createdAt,
				userId: row.userId,
				userEmail: row.userEmail,
				agencyRoleId: row.agencyRoleId,
				agencyRoleName: row.agencyRoleName,
				procedurePath: row.procedurePath,
				procedureType: row.procedureType,
				permissionKey: row.permissionKey,
				requiredAccess: row.requiredAccess,
				grantedAccess: row.grantedAccess,
				ipAddress: row.ipAddress,
			}));
		}),

});

