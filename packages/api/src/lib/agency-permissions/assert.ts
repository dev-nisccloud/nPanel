import { TRPCError } from "@trpc/server";
import { eq } from "@npanel/db";
import { db } from "@npanel/db";
import { user as userTable } from "@npanel/db/schema/auth";
import { isAgencyUserRole } from "../team-permissions/assert";
import { recordAgencyPermissionDenial } from "./audit";
import {
	agencyAccessSatisfies,
	agencyModuleAccessSatisfies,
	agencyPermissionLabel,
	allAgencyWritePermissions,
	isAgencyPermissionKey,
	type AgencyPermissionGrantedAccess,
	type AgencyPermissionKey,
} from "./catalog";
import {
	requiredAccessForProcedureType,
	resolveAgencyProcedure,
	type AgencyRequirement,
} from "./procedure-rules";

export type AgencyPermissionMap = Partial<Record<AgencyPermissionKey, AgencyPermissionGrantedAccess>>;

export type AgencyAccessContext = {
	userId: string;
	userEmail: string | null;
	userRole: string;
	agencyRoleId: string | null;
	agencyRoleName: string | null;
	/** Super admins and agency users with no custom role keep full access. */
	unrestricted: boolean;
	permissions: AgencyPermissionMap;
};

type StoredPermission = { key: string; access: string | null };

const CACHE_TTL_MS = 20_000;
const cache = new Map<string, { at: number; value: AgencyAccessContext }>();

export function invalidateAgencyAccessCache(userId?: string) {
	if (userId) cache.delete(userId);
	else cache.clear();
}

export function grantsFromStoredRole(permissions: StoredPermission[]): AgencyPermissionMap {
	const grants: AgencyPermissionMap = {};
	for (const row of permissions) {
		if (!isAgencyPermissionKey(row.key)) continue;
		if (row.access !== "read" && row.access !== "write") continue;
		grants[row.key] = row.access;
	}
	return grants;
}

export function requirementSatisfied(
	permissions: AgencyPermissionMap,
	requirement: AgencyRequirement,
	access: AgencyPermissionGrantedAccess,
): boolean {
	if (requirement.type === "allow") return true;
	if (requirement.type === "key") return agencyAccessSatisfies(permissions[requirement.key], access);
	if (requirement.type === "module") {
		return agencyModuleAccessSatisfies(permissions, requirement.module, access);
	}
	if (requirement.type === "anyKeys") {
		return requirement.keys.some((permissionKey) =>
			agencyAccessSatisfies(permissions[permissionKey], access),
		);
	}
	return Object.values(permissions).some((granted) => agencyAccessSatisfies(granted, access));
}

function denialKey(requirement: AgencyRequirement | null): string {
	if (!requirement) return "unmapped";
	if (requirement.type === "key") return requirement.key;
	if (requirement.type === "module") return `${requirement.module}.*`;
	if (requirement.type === "anyKeys") return requirement.keys.join(" | ");
	if (requirement.type === "anyGranted") return "any";
	return "allow";
}

export async function loadAgencyAccess(userId: string): Promise<AgencyAccessContext | null> {
	const cached = cache.get(userId);
	if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.value;

	const userRes = await db.query.user.findFirst({
		where: eq(userTable.id, userId),
		columns: { id: true, email: true, role: true, agencyRoleId: true },
		with: {
			agencyRole: {
				columns: { id: true, name: true },
				with: {
					permissions: {
						with: {
							permission: { columns: { key: true } },
						},
					},
				},
			},
		},
	});

	if (!userRes || !isAgencyUserRole(userRes.role)) return null;

	const unrestricted = userRes.role === "AGENCY_SUPER_ADMIN" || !userRes.agencyRole;
	const permissions = unrestricted
		? allAgencyWritePermissions()
		: grantsFromStoredRole(
				userRes.agencyRole?.permissions.map((row) => ({
					key: row.permission.key,
					access: row.access,
				})) ?? [],
			);

	const value: AgencyAccessContext = {
		userId: userRes.id,
		userEmail: userRes.email ?? null,
		userRole: userRes.role,
		agencyRoleId: userRes.agencyRole?.id ?? null,
		agencyRoleName: userRes.agencyRole?.name ?? null,
		unrestricted,
		permissions,
	};
	cache.set(userId, { at: Date.now(), value });
	return value;
}

export async function assertAgencyProcedureAccess(params: {
	userId: string;
	userRole: string | null | undefined;
	path: string;
	type: "query" | "mutation" | "subscription";
	ipAddress?: string | null;
	input?: unknown;
}): Promise<void> {
	if (params.userRole === "AGENCY_SUPER_ADMIN") return;
	if (!isAgencyUserRole(params.userRole)) return;

	const access = await loadAgencyAccess(params.userId);
	if (!access || access.unrestricted) return;

	const requirement = resolveAgencyProcedure(params.path);
	const required = /password|credential|secret/i.test(params.path)
		? "write"
		: requiredAccessForProcedureType(params.type);
	if (requirement && requirementSatisfied(access.permissions, requirement, required)) return;

	const permissionKey = denialKey(requirement);
	await recordAgencyPermissionDenial({
		userId: access.userId,
		userEmail: access.userEmail,
		agencyRoleId: access.agencyRoleId,
		agencyRoleName: access.agencyRoleName,
		procedurePath: params.path,
		procedureType: params.type,
		permissionKey,
		requiredAccess: required,
		grantedAccess: requirement?.type === "key" ? (access.permissions[requirement.key] ?? "none") : "none",
		ipAddress: params.ipAddress ?? null,
		input: params.input,
	});

	const label =
		requirement?.type === "key"
			? agencyPermissionLabel(requirement.key)
			: permissionKey === "unmapped"
				? params.path
				: permissionKey;

	throw new TRPCError({
		code: "FORBIDDEN",
		message: `You do not have ${required} access for ${label}. This attempt was logged.`,
	});
}
