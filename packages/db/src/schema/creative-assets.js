import { relations } from "drizzle-orm";
import { boolean, foreignKey, index, integer, jsonb, pgTable, text, timestamp, uniqueIndex, } from "drizzle-orm/pg-core";
import { team } from "./teams";
// --- CreativeAsset -----------------------------------------------------------
export const creativeAsset = pgTable("creative_asset", {
    id: text("id").primaryKey(),
    teamId: text("team_id")
        .notNull()
        .references(() => team.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    category: text("category"),
    status: text("status").default("DRAFT").notNull(),
    currentInternalVersion: integer("current_internal_version"),
    currentPublicVersion: integer("current_public_version"),
    isPublic: boolean("is_public").default(false).notNull(),
    createdBy: text("created_by").notNull(),
    lastModifiedBy: text("last_modified_by").notNull(),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
}, (table) => [
    index("creative_asset_teamId_idx").on(table.teamId),
    index("creative_asset_status_idx").on(table.status),
    index("creative_asset_createdBy_idx").on(table.createdBy),
    index("creative_asset_isPublic_idx").on(table.isPublic),
    index("creative_asset_createdAt_idx").on(table.createdAt),
]);
// --- CreativeAssetVersion ----------------------------------------------------
export const creativeAssetVersion = pgTable("creative_asset_version", {
    id: text("id").primaryKey(),
    creativeAssetId: text("creative_asset_id")
        .notNull()
        .references(() => creativeAsset.id, { onDelete: "cascade" }),
    internalVersionNumber: integer("internal_version_number").notNull(),
    publicVersionNumber: integer("public_version_number"),
    isPublic: boolean("is_public").default(false).notNull(),
    internalApprovalStatus: text("internal_approval_status")
        .default("PENDING")
        .notNull(),
    publicApprovalStatus: text("public_approval_status")
        .default("NOT_APPLICABLE")
        .notNull(),
    fileUrl: text("file_url").notNull(),
    fileKey: text("file_key").notNull(),
    fileName: text("file_name").notNull(),
    fileSize: integer("file_size").notNull(),
    mimeType: text("mime_type").notNull(),
    fileMetadata: jsonb("file_metadata"),
    versionNotes: text("version_notes"),
    changesSummary: text("changes_summary"),
    previousVersionId: text("previous_version_id"),
    internalApprovedBy: text("internal_approved_by"),
    internalApprovedAt: timestamp("internal_approved_at"),
    internalRejectedBy: text("internal_rejected_by"),
    internalRejectedAt: timestamp("internal_rejected_at"),
    internalRejectionReason: text("internal_rejection_reason"),
    publicApprovedBy: text("public_approved_by"),
    publicApprovedAt: timestamp("public_approved_at"),
    publicRejectedBy: text("public_rejected_by"),
    publicRejectedAt: timestamp("public_rejected_at"),
    publicRejectionReason: text("public_rejection_reason"),
    madePublicBy: text("made_public_by"),
    madePublicAt: timestamp("made_public_at"),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
}, (table) => [
    uniqueIndex("creative_asset_version_creativeAssetId_internalVersionNumber_unique").on(table.creativeAssetId, table.internalVersionNumber),
    index("creative_asset_version_creativeAssetId_idx").on(table.creativeAssetId),
    index("creative_asset_version_internalVersionNumber_idx").on(table.internalVersionNumber),
    index("creative_asset_version_publicVersionNumber_idx").on(table.publicVersionNumber),
    index("creative_asset_version_isPublic_idx").on(table.isPublic),
    index("creative_asset_version_internalApprovalStatus_idx").on(table.internalApprovalStatus),
    index("creative_asset_version_publicApprovalStatus_idx").on(table.publicApprovalStatus),
    index("creative_asset_version_createdAt_idx").on(table.createdAt),
]);
// --- CreativeAssetPermission -------------------------------------------------
export const creativeAssetPermission = pgTable("creative_asset_permission", {
    id: text("id").primaryKey(),
    creativeAssetId: text("creative_asset_id")
        .notNull()
        .references(() => creativeAsset.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    canView: boolean("can_view").default(true).notNull(),
    canEdit: boolean("can_edit").default(false).notNull(),
    canComment: boolean("can_comment").default(true).notNull(),
    canApprove: boolean("can_approve").default(false).notNull(),
    canPublish: boolean("can_publish").default(false).notNull(),
    canDelete: boolean("can_delete").default(false).notNull(),
    grantedBy: text("granted_by").notNull(),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
}, (table) => [
    uniqueIndex("creative_asset_permission_creativeAssetId_userId_unique").on(table.creativeAssetId, table.userId),
    index("creative_asset_permission_creativeAssetId_idx").on(table.creativeAssetId),
    index("creative_asset_permission_userId_idx").on(table.userId),
]);
// --- CreativeAssetComment ----------------------------------------------------
export const creativeAssetComment = pgTable("creative_asset_comment", {
    id: text("id").primaryKey(),
    creativeAssetVersionId: text("creative_asset_version_id")
        .notNull()
        .references(() => creativeAssetVersion.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    content: text("content").notNull(),
    isInternal: boolean("is_internal").notNull(),
    isResolved: boolean("is_resolved").default(false).notNull(),
    resolvedBy: text("resolved_by"),
    resolvedAt: timestamp("resolved_at"),
    parentCommentId: text("parent_comment_id"),
    replyCount: integer("reply_count").default(0).notNull(),
    // Prisma: `String[]` (required, no `@default`) — app supplies `[]` when needed.
    mentions: jsonb("mentions").notNull(),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
    editedAt: timestamp("edited_at"),
}, (table) => [
    foreignKey({
        columns: [table.parentCommentId],
        foreignColumns: [table.id],
    }).onDelete("cascade"),
    index("creative_asset_comment_creativeAssetVersionId_idx").on(table.creativeAssetVersionId),
    index("creative_asset_comment_userId_idx").on(table.userId),
    index("creative_asset_comment_isInternal_idx").on(table.isInternal),
    index("creative_asset_comment_parentCommentId_idx").on(table.parentCommentId),
    index("creative_asset_comment_isResolved_idx").on(table.isResolved),
    index("creative_asset_comment_createdAt_idx").on(table.createdAt),
]);
// --- CreativeAssetActivityLog ------------------------------------------------
export const creativeAssetActivityLog = pgTable("creative_asset_activity_log", {
    id: text("id").primaryKey(),
    creativeAssetId: text("creative_asset_id")
        .notNull()
        .references(() => creativeAsset.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    action: text("action").notNull(),
    description: text("description"),
    metadata: jsonb("metadata"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").notNull(),
}, (table) => [
    index("creative_asset_activity_log_creativeAssetId_idx").on(table.creativeAssetId),
    index("creative_asset_activity_log_userId_idx").on(table.userId),
    index("creative_asset_activity_log_action_idx").on(table.action),
    index("creative_asset_activity_log_createdAt_idx").on(table.createdAt),
]);
// --- CreativeAssetVersionActivityLog ----------------------------------------
export const creativeAssetVersionActivityLog = pgTable("creative_asset_version_activity_log", {
    id: text("id").primaryKey(),
    creativeAssetVersionId: text("creative_asset_version_id")
        .notNull()
        .references(() => creativeAssetVersion.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    action: text("action").notNull(),
    description: text("description"),
    metadata: jsonb("metadata"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").notNull(),
}, (table) => [
    index("creative_asset_version_activity_creativeAssetVersionId_idx").on(table.creativeAssetVersionId),
    index("creative_asset_version_activity_userId_idx").on(table.userId),
    index("creative_asset_version_activity_action_idx").on(table.action),
    index("creative_asset_version_activity_createdAt_idx").on(table.createdAt),
]);
// --- Relations ---------------------------------------------------------------
export const creativeAssetRelations = relations(creativeAsset, ({ one, many }) => ({
    team: one(team, {
        fields: [creativeAsset.teamId],
        references: [team.id],
    }),
    versions: many(creativeAssetVersion),
    permissions: many(creativeAssetPermission),
    activityLogs: many(creativeAssetActivityLog),
}));
export const creativeAssetVersionRelations = relations(creativeAssetVersion, ({ one, many }) => ({
    creativeAsset: one(creativeAsset, {
        fields: [creativeAssetVersion.creativeAssetId],
        references: [creativeAsset.id],
    }),
    comments: many(creativeAssetComment),
    activityLogs: many(creativeAssetVersionActivityLog),
}));
export const creativeAssetPermissionRelations = relations(creativeAssetPermission, ({ one }) => ({
    creativeAsset: one(creativeAsset, {
        fields: [creativeAssetPermission.creativeAssetId],
        references: [creativeAsset.id],
    }),
}));
export const creativeAssetCommentRelations = relations(creativeAssetComment, ({ one, many }) => ({
    creativeAssetVersion: one(creativeAssetVersion, {
        fields: [creativeAssetComment.creativeAssetVersionId],
        references: [creativeAssetVersion.id],
    }),
    parentComment: one(creativeAssetComment, {
        fields: [creativeAssetComment.parentCommentId],
        references: [creativeAssetComment.id],
        relationName: "CommentReplies",
    }),
    replies: many(creativeAssetComment, { relationName: "CommentReplies" }),
}));
export const creativeAssetActivityLogRelations = relations(creativeAssetActivityLog, ({ one }) => ({
    creativeAsset: one(creativeAsset, {
        fields: [creativeAssetActivityLog.creativeAssetId],
        references: [creativeAsset.id],
    }),
}));
export const creativeAssetVersionActivityLogRelations = relations(creativeAssetVersionActivityLog, ({ one }) => ({
    creativeAssetVersion: one(creativeAssetVersion, {
        fields: [creativeAssetVersionActivityLog.creativeAssetVersionId],
        references: [creativeAssetVersion.id],
    }),
}));
