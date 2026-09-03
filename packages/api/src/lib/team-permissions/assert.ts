import { TRPCError } from "@trpc/server";
import { and, eq } from "@npanel/db";
import { db } from "@npanel/db";
import { teamMember, teamMemberPermission } from "@npanel/db/schema/teams";

import {
	TEAM_PERMISSION_KEY_SET,
	accessSatisfies,
	allWritePermissions,
	type TeamPermissionGrantedAccess,
	type TeamPermissionKey,
} from "./catalog";

export const AGENCY_USER_ROLES = [
	"AGENCY_USER",
	"AGENCY_ADMIN",
	"AGENCY_SUPER_ADMIN",
] as const;

export function isAgencyUserRole(role: string | null | undefined): boolean {
	return AGENCY_USER_ROLES.includes(
		(role ?? "") as (typeof AGENCY_USER_ROLES)[number],
	);
}

export type TeamPermissionMap = Partial<
	Record<TeamPermissionKey, TeamPermissionGrantedAccess>
>;

export type TeamPermissionContext = {
	teamId: string;
	memberId: string;
	role: string;
	isOwner: boolean;
	permissions: TeamPermissionMap;
};

function emptyPermissionMap(): TeamPermissionMap {
	return {};
}

export async function loadTeamPermissionContext(params: {
	teamId: string;
	userId: string;
}): Promise<TeamPermissionContext | null> {
	const membership = await db.query.teamMember.findFirst({
		where: and(
			eq(teamMember.teamId, params.teamId),
			eq(teamMember.userId, params.userId),
		),
		columns: { id: true, role: true },
	});

	if (!membership) return null;

	const isOwner = membership.role === "OWNER";
	if (isOwner) {
		return {
			teamId: params.teamId,
			memberId: membership.id,
			role: membership.role,
			isOwner: true,
			permissions: allWritePermissions(),
		};
	}

	const rows = await db
		.select({
			permissionKey: teamMemberPermission.permissionKey,
			access: teamMemberPermission.access,
		})
		.from(teamMemberPermission)
		.where(eq(teamMemberPermission.teamMemberId, membership.id));

	const permissions = emptyPermissionMap();
	for (const row of rows) {
		if (!TEAM_PERMISSION_KEY_SET.has(row.permissionKey)) continue;
		if (row.access !== "read" && row.access !== "write") continue;
		permissions[row.permissionKey as TeamPermissionKey] = row.access;
	}

	return {
		teamId: params.teamId,
		memberId: membership.id,
		role: membership.role,
		isOwner: false,
		permissions,
	};
}

export function contextHasPermission(
	ctx: TeamPermissionContext,
	key: TeamPermissionKey,
	access: TeamPermissionGrantedAccess,
): boolean {
	if (ctx.isOwner) return true;
	return accessSatisfies(ctx.permissions[key], access);
}

export function contextHasModulePermission(
	ctx: TeamPermissionContext,
	modulePrefix: string,
	access: TeamPermissionGrantedAccess,
): boolean {
	if (ctx.isOwner) return true;
	const prefix = modulePrefix.endsWith(".") ? modulePrefix : `${modulePrefix}.`;
	for (const [key, granted] of Object.entries(ctx.permissions)) {
		if (!key.startsWith(prefix)) continue;
		if (accessSatisfies(granted, access)) return true;
	}
	return false;
}

export async function assertTeamPermission(params: {
	teamId: string;
	userId: string;
	userRole: string | null | undefined;
	key: TeamPermissionKey;
	access: TeamPermissionGrantedAccess;
}): Promise<TeamPermissionContext> {
	if (isAgencyUserRole(params.userRole)) {
		return {
			teamId: params.teamId,
			memberId: "",
			role: "AGENCY",
			isOwner: true,
			permissions: allWritePermissions(),
		};
	}

	const ctx = await loadTeamPermissionContext({
		teamId: params.teamId,
		userId: params.userId,
	});
	if (!ctx) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "You do not have access to this team",
		});
	}
	if (!contextHasPermission(ctx, params.key, params.access)) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "You do not have permission to perform this action",
		});
	}
	return ctx;
}

export async function assertTeamModulePermission(params: {
	teamId: string;
	userId: string;
	userRole: string | null | undefined;
	module: string;
	access: TeamPermissionGrantedAccess;
}): Promise<TeamPermissionContext> {
	if (isAgencyUserRole(params.userRole)) {
		return {
			teamId: params.teamId,
			memberId: "",
			role: "AGENCY",
			isOwner: true,
			permissions: allWritePermissions(),
		};
	}

	const ctx = await loadTeamPermissionContext({
		teamId: params.teamId,
		userId: params.userId,
	});
	if (!ctx) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "You do not have access to this team",
		});
	}
	if (!contextHasModulePermission(ctx, params.module, params.access)) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "You do not have permission to perform this action",
		});
	}
	return ctx;
}

export async function assertAnyTeamPermission(params: {
	teamId: string;
	userId: string;
	userRole: string | null | undefined;
	keys: TeamPermissionKey[];
	access: TeamPermissionGrantedAccess;
}): Promise<TeamPermissionContext> {
	if (isAgencyUserRole(params.userRole)) {
		return {
			teamId: params.teamId,
			memberId: "",
			role: "AGENCY",
			isOwner: true,
			permissions: allWritePermissions(),
		};
	}

	const ctx = await loadTeamPermissionContext({
		teamId: params.teamId,
		userId: params.userId,
	});
	if (!ctx) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "You do not have access to this team",
		});
	}
	const allowed = params.keys.some((key) =>
		contextHasPermission(ctx, key, params.access),
	);
	if (!allowed) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "You do not have permission to perform this action",
		});
	}
	return ctx;
}

export async function assertAnyTeamModulePermission(params: {
	teamId: string;
	userId: string;
	userRole: string | null | undefined;
	modules: string[];
	access: TeamPermissionGrantedAccess;
}): Promise<TeamPermissionContext> {
	if (isAgencyUserRole(params.userRole)) {
		return {
			teamId: params.teamId,
			memberId: "",
			role: "AGENCY",
			isOwner: true,
			permissions: allWritePermissions(),
		};
	}

	const ctx = await loadTeamPermissionContext({
		teamId: params.teamId,
		userId: params.userId,
	});
	if (!ctx) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "You do not have access to this team",
		});
	}
	const allowed = params.modules.some((module) =>
		contextHasModulePermission(ctx, module, params.access),
	);
	if (!allowed) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "You do not have permission to perform this action",
		});
	}
	return ctx;
}
