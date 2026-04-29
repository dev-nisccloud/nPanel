import { TRPCError } from "@trpc/server";
import { eq, inArray, desc, asc } from "@npanel/db";
import * as crypto from "node:crypto";
import { z } from "zod";
import { db } from "@npanel/db";
import { user as userTable } from "@npanel/db/schema/auth";
import { agencyPermission, agencyRole, agencyRolePermission, } from "@npanel/db/schema/agency-rbac";
import { protectedProcedure, router } from "../trpc";
import { agencyMenuKeySchema, agencyMenuKeys } from "./agency-rbac/menu-keys";
// ============================================================================
// ZOD SCHEMAS – independent from database schema (including enums)
// ============================================================================
const agencyRoleOutputSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    menus: z.array(z.string()),
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
    menus: z.array(z.string()).default([]),
});
const updateRoleInputSchema = z
    .object({
    roleId: z.string(),
    name: z.string().min(2).max(80).optional(),
    description: z.string().max(400).optional(),
    menus: z.array(z.string()).optional(),
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
    allowedKeys: z.array(z.string()),
});
const getRoleByIdInputSchema = z.object({
    roleId: z.string(),
});
const roleWithPermissionsOutputSchema = agencyRoleOutputSchema.extend({
    permissionKeys: z.array(agencyMenuKeySchema),
});
function requireAgencySuperAdmin(userRole) {
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
        const roles = await db.query.agencyRole.findMany({
            orderBy: [desc(agencyRole.isSystem), asc(agencyRole.name)],
        });
        return roles.map((r) => ({
            id: r.id,
            name: r.name,
            description: r.description ?? null,
            menus: r.menus,
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
        const dbMenus = role.menus ?? [];
        const permissionKeys = role.permissions
            .map((rp) => rp.permission.key)
            .filter((key) => agencyMenuKeySchema.safeParse(key).success) ?? [];
        return {
            id: role.id,
            name: role.name,
            description: role.description ?? null,
            menus: dbMenus,
            isSystem: role.isSystem,
            createdAt: role.createdAt,
            updatedAt: role.updatedAt,
            permissionKeys: Array.from(new Set([...dbMenus, ...permissionKeys])),
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
            menus: input.menus,
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
            menus: role.menus,
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
            menus: input.menus ?? undefined,
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
            menus: updated.menus,
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
    permissionsList: protectedProcedure.output(listPermissionsOutputSchema).query(async ({ ctx }) => {
        requireAgencySuperAdmin(ctx.session?.user?.role);
        const perms = await db.query.agencyPermission.findMany({
            orderBy: [asc(agencyPermission.key)],
        });
        return perms.map((p) => ({
            id: p.id,
            key: p.key,
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
        const [upserted] = await db
            .insert(agencyPermission)
            .values({
            id: crypto.randomUUID(),
            key: input.key,
            description: input.description ?? null,
            createdAt: new Date(),
            updatedAt: new Date(),
        })
            .onConflictDoUpdate({
            target: agencyPermission.key,
            set: {
                description: input.description ?? null,
                updatedAt: new Date(),
            },
        })
            .returning();
        if (!upserted) {
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to upsert permission" });
        }
        return {
            id: upserted.id,
            key: upserted.key,
            description: upserted.description ?? null,
            createdAt: upserted.createdAt,
            updatedAt: upserted.updatedAt,
        };
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
        const uniqueKeys = Array.from(new Set(input.permissionKeys));
        await db.transaction(async (tx) => {
            // ensure all permissions exist
            for (const key of uniqueKeys) {
                await tx
                    .insert(agencyPermission)
                    .values({
                    id: crypto.randomUUID(),
                    key,
                    description: null,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                })
                    .onConflictDoUpdate({
                    target: agencyPermission.key,
                    set: {
                        updatedAt: new Date(),
                    },
                });
            }
            // clear existing mappings
            await tx.delete(agencyRolePermission).where(eq(agencyRolePermission.roleId, input.roleId));
            if (uniqueKeys.length === 0) {
                return;
            }
            const perms = await tx.query.agencyPermission.findMany({
                where: inArray(agencyPermission.key, uniqueKeys),
                columns: { id: true },
            });
            if (perms.length > 0) {
                await tx.insert(agencyRolePermission).values(perms.map((p) => ({
                    id: crypto.randomUUID(),
                    roleId: input.roleId,
                    permissionId: p.id,
                    createdAt: new Date(),
                })));
            }
        });
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
        return { success: true };
    }),
    myMenuAccess: protectedProcedure.output(myMenuAccessOutputSchema).query(async ({ ctx }) => {
        const userId = ctx.session?.user?.id;
        if (!userId) {
            throw new TRPCError({ code: "UNAUTHORIZED" });
        }
        // Only relevant for agency users; customers get empty keys by default.
        const userRes = await db.query.user.findFirst({
            where: eq(userTable.id, userId),
            with: {
                agencyRole: {
                    with: {
                        permissions: {
                            with: {
                                permission: {
                                    columns: { key: true },
                                },
                            },
                        },
                    },
                },
            },
        });
        if (!userRes) {
            throw new TRPCError({ code: "UNAUTHORIZED" });
        }
        if (!["AGENCY_ADMIN", "AGENCY_SUPER_ADMIN", "AGENCY_USER"].includes(userRes.role)) {
            return { roleId: null, roleName: null, allowedKeys: [] };
        }
        if (userRes.role === "AGENCY_SUPER_ADMIN") {
            return {
                roleId: userRes.agencyRole?.id ?? null,
                roleName: userRes.agencyRole?.name ?? null,
                allowedKeys: Array.from(agencyMenuKeys),
            };
        }
        const dbMenus = userRes.agencyRole?.menus ?? [];
        const permissionKeys = userRes.agencyRole?.permissions
            .map((p) => p.permission.key)
            .filter((k) => agencyMenuKeySchema.safeParse(k).success) ?? [];
        return {
            roleId: userRes.agencyRole?.id ?? null,
            roleName: userRes.agencyRole?.name ?? null,
            allowedKeys: Array.from(new Set([...dbMenus, ...permissionKeys])),
        };
    }),
});
