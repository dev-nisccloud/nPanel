import { randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { eq } from "@npanel/db";
import { db } from "@npanel/db";
import { teamMember, teamMemberPermission } from "@npanel/db/schema/teams";
import { protectedProcedure, router } from "../trpc";

import {
	TEAM_PERMISSION_CATALOG,
	TEAM_PERMISSION_KEYS,
	TEAM_PERMISSION_MODULES,
	allWritePermissions,
	type TeamPermissionGrantedAccess,
	type TeamPermissionKey,
} from "../lib/team-permissions/catalog";
import {
	isAgencyUserRole,
	loadTeamPermissionContext,
} from "../lib/team-permissions/assert";

const teamPermissionKeySchema = z.enum(TEAM_PERMISSION_KEYS);
const accessSchema = z.enum(["none", "read", "write"]);
const grantedAccessSchema = z.enum(["read", "write"]);

const catalogEntrySchema = z.object({
	key: z.string(),
	module: z.string(),
	moduleLabel: z.string(),
	label: z.string(),
	description: z.string(),
});

const permissionMapSchema = z.record(z.string(), grantedAccessSchema);

const myPermissionsOutputSchema = z.object({
	teamId: z.string(),
	memberId: z.string(),
	role: z.string(),
	isOwner: z.boolean(),
	permissions: permissionMapSchema,
});

async function requireOwnerMembership(params: {
	teamId: string;
	userId: string;
	userRole: string | null | undefined;
}) {
	if (isAgencyUserRole(params.userRole)) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "Agency users cannot edit customer team permissions here",
		});
	}
	const ctx = await loadTeamPermissionContext({
		teamId: params.teamId,
		userId: params.userId,
	});
	if (!ctx || !ctx.isOwner) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "Only team owners can manage user permissions",
		});
	}
	return ctx;
}

export const teamPermissionsRouter = router({
	catalog: protectedProcedure
		.output(
			z.object({
				entries: z.array(catalogEntrySchema),
				modules: z.array(
					z.object({
						id: z.string(),
						label: z.string(),
						keys: z.array(z.string()),
					}),
				),
			}),
		)
		.query(() => ({
			entries: TEAM_PERMISSION_CATALOG.map((e) => ({
				key: e.key,
				module: e.module,
				moduleLabel: e.moduleLabel,
				label: e.label,
				description: e.description,
			})),
			modules: TEAM_PERMISSION_MODULES.map((m) => ({
				id: m.id,
				label: m.label,
				keys: [...m.keys],
			})),
		})),

	myPermissions: protectedProcedure
		.input(z.object({ teamId: z.string() }))
		.output(myPermissionsOutputSchema)
		.query(async ({ ctx, input }) => {
			const userId = ctx.session?.user?.id;
			if (!userId) {
				throw new TRPCError({ code: "UNAUTHORIZED", message: "You must be logged in" });
			}

			if (isAgencyUserRole(ctx.session.user.role)) {
				return {
					teamId: input.teamId,
					memberId: "",
					role: "AGENCY",
					isOwner: true,
					permissions: allWritePermissions(),
				};
			}

			const membership = await loadTeamPermissionContext({
				teamId: input.teamId,
				userId,
			});
			if (!membership) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have access to this team",
				});
			}

			return {
				teamId: membership.teamId,
				memberId: membership.memberId,
				role: membership.role,
				isOwner: membership.isOwner,
				permissions: membership.permissions,
			};
		}),

	getMemberPermissions: protectedProcedure
		.input(z.object({ teamId: z.string(), memberId: z.string() }))
		.output(
			z.object({
				memberId: z.string(),
				userId: z.string(),
				role: z.string(),
				isOwner: z.boolean(),
				permissions: permissionMapSchema,
			}),
		)
		.query(async ({ ctx, input }) => {
			const userId = ctx.session?.user?.id;
			if (!userId) {
				throw new TRPCError({ code: "UNAUTHORIZED", message: "You must be logged in" });
			}
			await requireOwnerMembership({
				teamId: input.teamId,
				userId,
				userRole: ctx.session.user.role,
			});

			const member = await db.query.teamMember.findFirst({
				where: eq(teamMember.id, input.memberId),
				columns: { id: true, userId: true, role: true, teamId: true },
			});
			if (!member || member.teamId !== input.teamId) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Member not found" });
			}

			if (member.role === "OWNER") {
				return {
					memberId: member.id,
					userId: member.userId,
					role: member.role,
					isOwner: true,
					permissions: allWritePermissions(),
				};
			}

			const loaded = await loadTeamPermissionContext({
				teamId: input.teamId,
				userId: member.userId,
			});
			return {
				memberId: member.id,
				userId: member.userId,
				role: member.role,
				isOwner: false,
				permissions: loaded?.permissions ?? {},
			};
		}),

	setMemberPermissions: protectedProcedure
		.input(
			z.object({
				teamId: z.string(),
				memberId: z.string(),
				permissions: z.array(
					z.object({
						key: teamPermissionKeySchema,
						access: accessSchema,
					}),
				),
			}),
		)
		.output(z.object({ success: z.boolean() }))
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session?.user?.id;
			if (!userId) {
				throw new TRPCError({ code: "UNAUTHORIZED", message: "You must be logged in" });
			}
			await requireOwnerMembership({
				teamId: input.teamId,
				userId,
				userRole: ctx.session.user.role,
			});

			const member = await db.query.teamMember.findFirst({
				where: eq(teamMember.id, input.memberId),
				columns: { id: true, role: true, teamId: true },
			});
			if (!member || member.teamId !== input.teamId) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Member not found" });
			}
			if (member.role === "OWNER") {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Owner permissions cannot be changed",
				});
			}

			const granted = input.permissions.filter(
				(row) => row.access === "read" || row.access === "write",
			);

			await db.transaction(async (tx) => {
				await tx
					.delete(teamMemberPermission)
					.where(eq(teamMemberPermission.teamMemberId, member.id));

				if (granted.length === 0) return;

				const now = new Date();
				await tx.insert(teamMemberPermission).values(
					granted.map((row) => ({
						id: randomUUID(),
						teamMemberId: member.id,
						permissionKey: row.key,
						access: row.access as TeamPermissionGrantedAccess,
						createdAt: now,
						updatedAt: now,
					})),
				);
			});

			return { success: true };
		}),
});

export type { TeamPermissionKey };
