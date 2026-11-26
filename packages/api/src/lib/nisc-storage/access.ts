import { randomUUID } from "node:crypto";

import { and, eq } from "@npanel/db";
import { db } from "@npanel/db";
import { niscStorageAudit, niscStorageFolderGrant, niscStorageResource } from "@npanel/db/schema/nisc-storage";
import { teamMember } from "@npanel/db/schema/teams";
import {
	assertTeamPermission,
	contextHasPermission,
	isAgencyUserRole,
	loadTeamPermissionContext,
} from "../team-permissions/assert";
import { StorageOperationError } from "./errors";
import { grantAllows, type FolderCapability, type FolderGrant } from "./grants";

export type StorageResource = typeof niscStorageResource.$inferSelect;

export type StorageActor = {
	userId: string;
	role: string | null | undefined;
};

export type StorageAccess = {
	resource: StorageResource;
	scope: "agency" | "owner" | "member";
	memberId: string | null;
	grants: FolderGrant[];
};

export function presentResource(
	row: StorageResource,
	options: { includeBucket: boolean; includeAccessKeyId: boolean },
) {
	return {
		id: row.id,
		kind: row.kind,
		label: row.label,
		teamId: row.teamId,
		subscriptionId: row.subscriptionId,
		productPlanId: row.productPlanId,
		status: row.status,
		quotaBytes: row.quotaBytes,
		maxObjectBytes: row.maxObjectBytes,
		usedBytes: row.usedBytes,
		encryptionStatus: row.encryptionStatus,
		quotaSyncStatus: row.quotaSyncStatus,
		bucketName: options.includeBucket ? row.bucketName : null,
		bucketNameSource: options.includeBucket ? row.bucketNameSource : null,
		accessKeyId:
			options.includeAccessKeyId && row.status === "ACTIVE" ? row.accessKeyId : null,
		suspendedAt: row.suspendedAt,
		deletionScheduledAt: row.deletionScheduledAt,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
	};
}

export async function writeStorageAudit(entry: {
	resourceId?: string | null;
	teamId?: string | null;
	actorUserId?: string | null;
	action: string;
	objectKey?: string | null;
	outcome: "ALLOW" | "DENY" | "ERROR";
	detail?: string | null;
}): Promise<void> {
	try {
		await db.insert(niscStorageAudit).values({
			id: randomUUID(),
			resourceId: entry.resourceId ?? null,
			teamId: entry.teamId ?? null,
			actorUserId: entry.actorUserId ?? null,
			action: entry.action.slice(0, 80),
			objectKey: entry.objectKey?.slice(0, 1024) ?? null,
			outcome: entry.outcome,
			detail: entry.detail?.slice(0, 400) ?? null,
		});
	} catch (error) {
		console.error("[nisc-storage] audit write failed", entry.action);
		void error;
	}
}

export async function loadStorageAccess(
	actor: StorageActor,
	resourceId: string,
): Promise<StorageAccess> {
	const [resource] = await db
		.select()
		.from(niscStorageResource)
		.where(eq(niscStorageResource.id, resourceId))
		.limit(1);
	if (!resource) throw new StorageOperationError("Storage was not found.", "NOT_FOUND");

	if (!resource.teamId && !isAgencyUserRole(actor.role)) {
		throw new StorageOperationError("Storage was not found.", "NOT_FOUND");
	}

	if (isAgencyUserRole(actor.role)) {
		return { resource, scope: "agency", memberId: null, grants: [] };
	}

	if (resource.status === "DELETED") {
		throw new StorageOperationError("Storage was not found.", "NOT_FOUND");
	}

	const [membership] = await db
		.select({ id: teamMember.id, role: teamMember.role })
		.from(teamMember)
		.where(and(eq(teamMember.teamId, resource.teamId), eq(teamMember.userId, actor.userId)))
		.limit(1);
	if (!membership) throw new StorageOperationError("Storage was not found.", "NOT_FOUND");

	if (membership.role === "OWNER") {
		return { resource, scope: "owner", memberId: membership.id, grants: [] };
	}

	const rows = await db
		.select({
			prefix: niscStorageFolderGrant.prefix,
			canList: niscStorageFolderGrant.canList,
			canGet: niscStorageFolderGrant.canGet,
			canPut: niscStorageFolderGrant.canPut,
			canDelete: niscStorageFolderGrant.canDelete,
		})
		.from(niscStorageFolderGrant)
		.where(
			and(
				eq(niscStorageFolderGrant.resourceId, resource.id),
				eq(niscStorageFolderGrant.teamMemberId, membership.id),
			),
		);

	return { resource, scope: "member", memberId: membership.id, grants: rows };
}

export async function memberCanSeeStorage(access: StorageAccess, actor: StorageActor): Promise<boolean> {
	if (access.scope !== "member") return true;
	if (access.grants.length > 0) return true;
	const ctx = await loadTeamPermissionContext({
		teamId: access.resource.teamId,
		userId: actor.userId,
	});
	return ctx != null && contextHasPermission(ctx, "storage.list", "read");
}

function assertUsable(access: StorageAccess, capability: FolderCapability): void {
	const status = access.resource.status;
	if (status === "ACTIVE") return;
	if (
		(status === "SUSPENDED" || status === "PENDING_DELETION") &&
		access.scope === "agency" &&
		(capability === "list" || capability === "get")
	) {
		return;
	}
	throw new StorageOperationError(
		status === "SUSPENDED"
			? "This storage plan is suspended."
			: status === "PENDING_DELETION"
				? "Deletion of this storage has been started."
				: "This storage plan is not active.",
		"DENIED",
	);
}

export async function assertFileAccess(
	access: StorageAccess,
	actor: StorageActor,
	capability: FolderCapability,
	objectKey: string,
): Promise<void> {
	assertUsable(access, capability);
	if (access.scope !== "member") return;

	await assertTeamPermission({
		teamId: access.resource.teamId,
		userId: actor.userId,
		userRole: actor.role,
		key: "storage.files",
		access: capability === "list" || capability === "get" ? "read" : "write",
	});

	if (!grantAllows(access.grants, capability, objectKey)) {
		throw new StorageOperationError("You do not have access to this folder.", "DENIED");
	}
}
