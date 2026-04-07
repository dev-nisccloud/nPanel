import { relations } from "drizzle-orm";
import { index, integer, jsonb, pgTable, text, timestamp, } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { team } from "./teams";
// --- CreativeBrief -----------------------------------------------------------
export const creativeBrief = pgTable("creative_brief", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),
    status: text("status").default("DRAFT").notNull(),
    background: text("background").notNull(),
    objectives: text("objectives").notNull(),
    requirements: text("requirements").notNull(),
    comments: text("comments"),
    style: text("style"),
    copy: text("copy"),
    mandatoryElements: text("mandatory_elements"),
    designPreference: text("design_preference"),
    approverUserId: text("approver_user_id").references(() => user.id, {
        onDelete: "set null",
    }),
    approvedBy: text("approved_by"),
    approvedAt: timestamp("approved_at"),
    rejectedBy: text("rejected_by"),
    rejectedAt: timestamp("rejected_at"),
    timelineStartDate: timestamp("timeline_start_date"),
    timelineEndDate: timestamp("timeline_end_date"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
}, (table) => [
    index("creative_brief_userId_idx").on(table.userId),
    index("creative_brief_approverUserId_idx").on(table.approverUserId),
    index("creative_brief_teamId_idx").on(table.teamId),
    index("creative_brief_status_idx").on(table.status),
    index("creative_brief_createdAt_idx").on(table.createdAt),
]);
// --- CreativeBriefReferenceImage ---------------------------------------------
export const creativeBriefReferenceImage = pgTable("creative_brief_reference_image", {
    id: text("id").primaryKey(),
    creativeBriefId: text("creative_brief_id")
        .notNull()
        .references(() => creativeBrief.id, { onDelete: "cascade" }),
    fileUrl: text("file_url").notNull(),
    fileKey: text("file_key").notNull(),
    fileName: text("file_name").notNull(),
    fileSize: integer("file_size").notNull(),
    mimeType: text("mime_type").notNull(),
    fileMetadata: jsonb("file_metadata"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
}, (table) => [
    index("creative_brief_reference_image_creativeBriefId_idx").on(table.creativeBriefId),
    index("creative_brief_reference_image_createdAt_idx").on(table.createdAt),
]);
// --- CreativeBriefActivityLog ------------------------------------------------
export const creativeBriefActivityLog = pgTable("creative_brief_activity_log", {
    id: text("id").primaryKey(),
    creativeBriefId: text("creative_brief_id")
        .notNull()
        .references(() => creativeBrief.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    action: text("action").notNull(),
    description: text("description"),
    comment: text("comment"),
    metadata: jsonb("metadata"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").notNull(),
}, (table) => [
    index("creative_brief_activity_log_creativeBriefId_idx").on(table.creativeBriefId),
    index("creative_brief_activity_log_userId_idx").on(table.userId),
    index("creative_brief_activity_log_action_idx").on(table.action),
    index("creative_brief_activity_log_createdAt_idx").on(table.createdAt),
]);
// --- Relations ---------------------------------------------------------------
export const creativeBriefRelations = relations(creativeBrief, ({ one, many }) => ({
    user: one(user, {
        fields: [creativeBrief.userId],
        references: [user.id],
        relationName: "CreatedBriefs",
    }),
    approver: one(user, {
        fields: [creativeBrief.approverUserId],
        references: [user.id],
        relationName: "ApprovedBriefs",
    }),
    team: one(team, {
        fields: [creativeBrief.teamId],
        references: [team.id],
    }),
    referenceImages: many(creativeBriefReferenceImage),
    activityLogs: many(creativeBriefActivityLog),
}));
export const creativeBriefReferenceImageRelations = relations(creativeBriefReferenceImage, ({ one }) => ({
    creativeBrief: one(creativeBrief, {
        fields: [creativeBriefReferenceImage.creativeBriefId],
        references: [creativeBrief.id],
    }),
}));
export const creativeBriefActivityLogRelations = relations(creativeBriefActivityLog, ({ one }) => ({
    creativeBrief: one(creativeBrief, {
        fields: [creativeBriefActivityLog.creativeBriefId],
        references: [creativeBrief.id],
    }),
}));
