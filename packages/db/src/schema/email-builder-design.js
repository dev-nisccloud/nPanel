import { relations } from "drizzle-orm";
import { boolean, index, integer, jsonb, pgTable, text, timestamp, } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { team } from "./teams";
// --- EmailBuilderDesign ------------------------------------------------------
export const emailBuilderDesign = pgTable("email_builder_design", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),
    // Prisma: `String @db.Text`   large JSON/document payload
    json: text("json").notNull(),
    thumbnailUrl: text("thumbnail_url"),
    isPublic: boolean("is_public").default(false).notNull(),
    // Save State Tracking (like Zeepo messages)
    // SAVED: All changes persisted successfully
    // SAVING: Changes being persisted to DB/storage
    // SAVE_FAILED: Last save attempt failed (network/validation error)
    // DIRTY: Local changes not yet persisted (optimistic state)
    saveStatus: text("save_status").default("SAVED").notNull(),
    lastSaveError: text("last_save_error"),
    // AI Generation Fields
    isAiGenerated: boolean("is_ai_generated").default(false).notNull(),
    aiStatus: text("ai_status").default("IDLE").notNull(), // IDLE, PROCESSING, COMPLETED, FAILED
    aiContext: jsonb("ai_context"),
    // Optimistic update tracking
    clientVersion: integer("client_version").default(0).notNull(),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
    lastSavedAt: timestamp("last_saved_at"),
}, (table) => [
    index("email_builder_design_userId_idx").on(table.userId),
    index("email_builder_design_teamId_idx").on(table.teamId),
    index("email_builder_design_isPublic_idx").on(table.isPublic),
    index("email_builder_design_saveStatus_idx").on(table.saveStatus),
]);
// --- EmailBuilderDesignActivityLog -------------------------------------------
export const emailBuilderDesignActivityLog = pgTable("email_builder_design_activity_log", {
    id: text("id").primaryKey(),
    emailBuilderDesignId: text("email_builder_design_id")
        .notNull()
        .references(() => emailBuilderDesign.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    action: text("action").notNull(),
    description: text("description"),
    metadata: jsonb("metadata"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").notNull(),
}, (table) => [
    index("email_builder_design_activity_emailBuilderDesignId_idx").on(table.emailBuilderDesignId),
    index("email_builder_design_activity_userId_idx").on(table.userId),
    index("email_builder_design_activity_action_idx").on(table.action),
    index("email_builder_design_activity_createdAt_idx").on(table.createdAt),
]);
// --- EmailBuilderOperation ---------------------------------------------------
// Background operation tracker (like zeepoAgentGeneration)
// Tracks auto-saves, AI generation, exports, etc. so they survive network interruptions
export const emailBuilderOperation = pgTable("email_builder_operation", {
    id: text("id").primaryKey(),
    designId: text("design_id")
        .notNull()
        .references(() => emailBuilderDesign.id, { onDelete: "cascade" }),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),
    // Operation type: AUTO_SAVE | AI_GENERATION | IMAGE_UPLOAD
    operationType: text("operation_type").notNull(),
    // QUEUED | PROCESSING | COMPLETED | FAILED
    status: text("status").default("QUEUED").notNull(),
    // QStash message ID for background jobs
    qstashMessageId: text("qstash_message_id"),
    // Operation payload (save data, AI params, export config)
    payload: jsonb("payload"),
    // Result data after completion
    result: jsonb("result"),
    // Error message if failed
    errorMessage: text("error_message"),
    // Client version for optimistic updates conflict resolution
    clientVersion: integer("client_version"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .$onUpdate(() => new Date())
        .defaultNow()
        .notNull(),
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
}, (table) => [
    index("email_builder_operation_designId_idx").on(table.designId),
    index("email_builder_operation_userId_idx").on(table.userId),
    index("email_builder_operation_status_idx").on(table.status),
    index("email_builder_operation_operationType_idx").on(table.operationType),
    index("email_builder_operation_createdAt_idx").on(table.createdAt),
]);
// --- EmailBuilderLibrary -----------------------------------------------------
export const emailBuilderLibrary = pgTable("email_builder_library", {
    id: text("id").primaryKey(),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),
    fileName: text("file_name").notNull(),
    fileSize: integer("file_size").notNull(),
    mimeType: text("mime_type").notNull(),
    fileUrl: text("file_url").notNull(),
    storageKey: text("storage_key"),
    description: text("description"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
    index("email_builder_library_userId_idx").on(table.userId),
    index("email_builder_library_teamId_idx").on(table.teamId),
    index("email_builder_library_createdAt_idx").on(table.createdAt),
]);
// --- Relations ---------------------------------------------------------------
export const emailBuilderDesignRelations = relations(emailBuilderDesign, ({ one, many }) => ({
    user: one(user, {
        fields: [emailBuilderDesign.userId],
        references: [user.id],
    }),
    team: one(team, {
        fields: [emailBuilderDesign.teamId],
        references: [team.id],
    }),
    activityLogs: many(emailBuilderDesignActivityLog),
    operations: many(emailBuilderOperation),
}));
export const emailBuilderDesignActivityLogRelations = relations(emailBuilderDesignActivityLog, ({ one }) => ({
    emailBuilderDesign: one(emailBuilderDesign, {
        fields: [emailBuilderDesignActivityLog.emailBuilderDesignId],
        references: [emailBuilderDesign.id],
    }),
}));
export const emailBuilderOperationRelations = relations(emailBuilderOperation, ({ one }) => ({
    design: one(emailBuilderDesign, {
        fields: [emailBuilderOperation.designId],
        references: [emailBuilderDesign.id],
    }),
    user: one(user, {
        fields: [emailBuilderOperation.userId],
        references: [user.id],
    }),
    team: one(team, {
        fields: [emailBuilderOperation.teamId],
        references: [team.id],
    }),
}));
export const emailBuilderLibraryRelations = relations(emailBuilderLibrary, ({ one }) => ({
    user: one(user, {
        fields: [emailBuilderLibrary.userId],
        references: [user.id],
    }),
    team: one(team, {
        fields: [emailBuilderLibrary.teamId],
        references: [team.id],
    }),
}));
