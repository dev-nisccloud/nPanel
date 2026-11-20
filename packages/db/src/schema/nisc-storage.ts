import { sql } from "drizzle-orm";
import {
	boolean,
	index,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
} from "drizzle-orm/pg-core";

import { user } from "./auth";
import { niscClientSubscription, niscProductPlan } from "./products";
import { team, teamMember } from "./teams";

/**
 * One live object-storage bucket per team. Deleted rows stay for the audit
 * trail and are excluded from the live unique indexes.
 */
export const niscStorageResource = pgTable(
	"nisc_storage_resource",
	{
		id: text("id").primaryKey(),
		/** CUSTOMER buckets belong to a team plan. INTERNAL buckets are staff-owned and have no plan. */
		kind: text("kind").default("CUSTOMER").notNull(),
		label: text("label"),
		teamId: text("team_id").references(() => team.id, { onDelete: "restrict" }),
		subscriptionId: text("subscription_id").references(() => niscClientSubscription.id, {
			onDelete: "restrict",
		}),
		productPlanId: text("product_plan_id").references(() => niscProductPlan.id, {
			onDelete: "restrict",
		}),
		storageClusterId: text("storage_cluster_id"),
		bucketName: text("bucket_name").notNull(),
		/** TEAM_SLUG when the team slug is a legal bucket name, otherwise GENERATED. */
		bucketNameSource: text("bucket_name_source").notNull(),
		iamUserName: text("iam_user_name").notNull(),
		/** Access key id only. The secret is secretCiphertext. */
		accessKeyId: text("access_key_id"),
		secretCiphertext: text("secret_ciphertext"),
		status: text("status").notNull(),
		quotaBytes: text("quota_bytes").notNull(),
		maxObjectBytes: text("max_object_bytes").notNull(),
		usedBytes: text("used_bytes").default("0").notNull(),
		encryptionStatus: text("encryption_status").default("UNKNOWN").notNull(),
		quotaSyncStatus: text("quota_sync_status").default("PENDING").notNull(),
		failedStep: text("failed_step"),
		failureReason: text("failure_reason"),
		correlationId: text("correlation_id").notNull(),
		credentialsCreatedAt: timestamp("credentials_created_at"),
		credentialsRotatedAt: timestamp("credentials_rotated_at"),
		suspendedAt: timestamp("suspended_at"),
		deletedAt: timestamp("deleted_at"),
		/** When a scheduled deletion becomes due. Null until a deletion is started. */
		deletionScheduledAt: timestamp("deletion_scheduled_at"),
		/** Status to restore if the scheduled deletion is cancelled. */
		statusBeforeDeletion: text("status_before_deletion"),
		lastHealthCheckAt: timestamp("last_health_check_at"),
		lastUsageSyncAt: timestamp("last_usage_sync_at"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [
		uniqueIndex("nisc_storage_team_live_uid")
			.on(table.teamId)
			.where(sql`${table.status} <> 'DELETED' AND ${table.teamId} IS NOT NULL`),
		uniqueIndex("nisc_storage_bucket_live_uid")
			.on(table.bucketName)
			.where(sql`${table.status} <> 'DELETED'`),
		uniqueIndex("nisc_storage_subscription_uid").on(table.subscriptionId),
		index("nisc_storage_resource_status_idx").on(table.status),
		index("nisc_storage_resource_teamId_idx").on(table.teamId),
		index("nisc_storage_resource_planId_idx").on(table.productPlanId),
	],
);

/** Per-member folder capabilities. Missing row means no access. Owners are not stored here. */
export const niscStorageFolderGrant = pgTable(
	"nisc_storage_folder_grant",
	{
		id: text("id").primaryKey(),
		resourceId: text("resource_id")
			.notNull()
			.references(() => niscStorageResource.id, { onDelete: "cascade" }),
		teamMemberId: text("team_member_id")
			.notNull()
			.references(() => teamMember.id, { onDelete: "cascade" }),
		/** Empty string grants the whole bucket. Otherwise a folder prefix without slashes on the ends. */
		prefix: text("prefix").notNull(),
		canList: boolean("can_list").default(false).notNull(),
		canGet: boolean("can_get").default(false).notNull(),
		canPut: boolean("can_put").default(false).notNull(),
		canDelete: boolean("can_delete").default(false).notNull(),
		createdById: text("created_by_id")
			.notNull()
			.references(() => user.id, { onDelete: "restrict" }),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [
		uniqueIndex("nisc_storage_grant_member_prefix_uid").on(
			table.resourceId,
			table.teamMemberId,
			table.prefix,
		),
		index("nisc_storage_grant_resource_idx").on(table.resourceId),
		index("nisc_storage_grant_member_idx").on(table.teamMemberId),
	],
);

/** Holds quota for an upload URL until the client finishes or the row expires. */
export const niscStorageUploadReservation = pgTable(
	"nisc_storage_upload_reservation",
	{
		id: text("id").primaryKey(),
		resourceId: text("resource_id")
			.notNull()
			.references(() => niscStorageResource.id, { onDelete: "cascade" }),
		objectKey: text("object_key").notNull(),
		bytes: text("bytes").notNull(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		expiresAt: timestamp("expires_at").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		uniqueIndex("nisc_storage_reservation_key_uid").on(table.resourceId, table.objectKey),
		index("nisc_storage_reservation_expiry_idx").on(table.expiresAt),
	],
);

export const niscStorageAudit = pgTable(
	"nisc_storage_audit",
	{
		id: text("id").primaryKey(),
		resourceId: text("resource_id").references(() => niscStorageResource.id, {
			onDelete: "set null",
		}),
		teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),
		actorUserId: text("actor_user_id"),
		action: text("action").notNull(),
		objectKey: text("object_key"),
		outcome: text("outcome").notNull(),
		detail: text("detail"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		index("nisc_storage_audit_resource_idx").on(table.resourceId),
		index("nisc_storage_audit_team_idx").on(table.teamId),
		index("nisc_storage_audit_actor_idx").on(table.actorUserId),
		index("nisc_storage_audit_created_idx").on(table.createdAt),
	],
);
