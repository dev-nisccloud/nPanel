import { relations } from "drizzle-orm";
import { boolean, index, integer, jsonb, pgTable, text, timestamp, uniqueIndex, } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { team } from "./teams";
// =============================================================================
// Nisc Email Builder (neb_*) - standalone; no relation to email_builder_*
// =============================================================================
export const nebDesign = pgTable("neb_design", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),
    status: text("status").default("DRAFT").notNull(), // DRAFT | READY
    subject: text("subject"),
    preheader: text("preheader"),
    htmlContent: text("html_content").default("").notNull(),
    textContent: text("text_content"),
    thumbnailUrl: text("thumbnail_url"),
    brandKitId: text("brand_kit_id"),
    brief: jsonb("brief"),
    metadata: jsonb("metadata"),
    /** Full email mockup from Nano Banana Pro - visual guideline for HTML build */
    creativeDesignUrl: text("creative_design_url"),
    creativeDesignPrompt: text("creative_design_prompt"),
    /** Planner output saved after creative approval */
    designPlan: jsonb("design_plan"),
    currentVersionId: text("current_version_id"),
    workflowPhase: text("workflow_phase").default("BRIEF").notNull(),
    // BRIEF | DESIGNING | AWAITING_APPROVAL | BUILDING | READY | FAILED
    aiStatus: text("ai_status").default("IDLE").notNull(),
    // IDLE | GENERATING | HYDRATING_IMAGES | FAILED
    // Save status tracking for network resilience
    saveStatus: text("save_status").default("SAVED").notNull(),
    // SAVED | SAVING | SAVE_FAILED
    lastSaveError: text("last_save_error"),
    clientVersion: integer("client_version").default(0).notNull(),
    lastSavedAt: timestamp("last_saved_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .$onUpdate(() => new Date())
        .defaultNow()
        .notNull(),
}, (table) => [
    index("neb_design_userId_idx").on(table.userId),
    index("neb_design_teamId_idx").on(table.teamId),
    index("neb_design_updatedAt_idx").on(table.updatedAt),
    index("neb_design_status_idx").on(table.status),
    index("neb_design_saveStatus_idx").on(table.saveStatus),
]);
export const nebDesignVersion = pgTable("neb_design_version", {
    id: text("id").primaryKey(),
    designId: text("design_id")
        .notNull()
        .references(() => nebDesign.id, { onDelete: "cascade" }),
    versionNumber: integer("version_number").notNull(),
    htmlContent: text("html_content").notNull(),
    textContent: text("text_content"),
    changeSummary: text("change_summary"),
    trigger: text("trigger").notNull(), // INITIAL | CHAT_REVISION | REGENERATE | RESTORE | IMAGE_HYDRATION
    messageId: text("message_id"),
    validationReport: jsonb("validation_report"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
    uniqueIndex("neb_design_version_design_version_uq").on(table.designId, table.versionNumber),
    index("neb_design_version_designId_idx").on(table.designId),
]);
export const nebSession = pgTable("neb_session", {
    id: text("id").primaryKey(),
    designId: text("design_id")
        .notNull()
        .references(() => nebDesign.id, { onDelete: "cascade" }),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .$onUpdate(() => new Date())
        .defaultNow()
        .notNull(),
}, (table) => [
    uniqueIndex("neb_session_designId_uq").on(table.designId),
    index("neb_session_userId_idx").on(table.userId),
]);
export const nebMessage = pgTable("neb_message", {
    id: text("id").primaryKey(),
    sessionId: text("session_id")
        .notNull()
        .references(() => nebSession.id, { onDelete: "cascade" }),
    role: text("role").notNull(), // user | assistant | system
    content: text("content").notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
    index("neb_message_sessionId_idx").on(table.sessionId),
    index("neb_message_sessionId_createdAt_idx").on(table.sessionId, table.createdAt),
]);
export const nebGenerationJob = pgTable("neb_generation_job", {
    id: text("id").primaryKey(),
    designId: text("design_id")
        .notNull()
        .references(() => nebDesign.id, { onDelete: "cascade" }),
    messageId: text("message_id"),
    type: text("type").notNull(), // FULL_BUILD | REVISION | IMAGE | THUMBNAIL
    status: text("status").default("QUEUED").notNull(),
    // QUEUED | RUNNING | SUCCEEDED | FAILED
    qstashMessageId: text("qstash_message_id"),
    input: jsonb("input"),
    output: jsonb("output"),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    completedAt: timestamp("completed_at"),
}, (table) => [
    index("neb_generation_job_designId_idx").on(table.designId),
    index("neb_generation_job_status_idx").on(table.status),
]);
export const nebBrandKit = pgTable("neb_brand_kit", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),
    logoAssetId: text("logo_asset_id"),
    colors: jsonb("colors"),
    fonts: jsonb("fonts"),
    footerLegal: text("footer_legal"),
    socialLinks: jsonb("social_links"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .$onUpdate(() => new Date())
        .defaultNow()
        .notNull(),
}, (table) => [
    index("neb_brand_kit_teamId_idx").on(table.teamId),
    index("neb_brand_kit_userId_idx").on(table.userId),
]);
export const nebAsset = pgTable("neb_asset", {
    id: text("id").primaryKey(),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),
    designId: text("design_id").references(() => nebDesign.id, {
        onDelete: "set null",
    }),
    kind: text("kind").notNull(), // LOGO | HERO | INLINE | ICON
    fileUrl: text("file_url").notNull(),
    storageKey: text("storage_key"),
    mimeType: text("mime_type").notNull(),
    width: integer("width"),
    height: integer("height"),
    altText: text("alt_text"),
    prompt: text("prompt"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
    index("neb_asset_designId_idx").on(table.designId),
    index("neb_asset_userId_idx").on(table.userId),
]);
export const nebActivityLog = pgTable("neb_activity_log", {
    id: text("id").primaryKey(),
    designId: text("design_id")
        .notNull()
        .references(() => nebDesign.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    action: text("action").notNull(),
    description: text("description"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
    index("neb_activity_log_designId_idx").on(table.designId),
    index("neb_activity_log_createdAt_idx").on(table.createdAt),
]);
// --- NebMediaLibrary ---------------------------------------------------------
// User-owned images for Nisc Email Builder - not tied to a design; reusable across projects.
export const nebMediaLibrary = pgTable("neb_media_library", {
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
    index("neb_media_library_userId_idx").on(table.userId),
    index("neb_media_library_teamId_idx").on(table.teamId),
    index("neb_media_library_createdAt_idx").on(table.createdAt),
]);
// --- Relations ---------------------------------------------------------------
export const nebDesignRelations = relations(nebDesign, ({ one, many }) => ({
    user: one(user, { fields: [nebDesign.userId], references: [user.id] }),
    team: one(team, { fields: [nebDesign.teamId], references: [team.id] }),
    versions: many(nebDesignVersion),
    session: one(nebSession),
    jobs: many(nebGenerationJob),
    assets: many(nebAsset),
    activityLogs: many(nebActivityLog),
}));
export const nebDesignVersionRelations = relations(nebDesignVersion, ({ one }) => ({
    design: one(nebDesign, {
        fields: [nebDesignVersion.designId],
        references: [nebDesign.id],
    }),
}));
export const nebSessionRelations = relations(nebSession, ({ one, many }) => ({
    design: one(nebDesign, {
        fields: [nebSession.designId],
        references: [nebDesign.id],
    }),
    messages: many(nebMessage),
}));
export const nebMessageRelations = relations(nebMessage, ({ one }) => ({
    session: one(nebSession, {
        fields: [nebMessage.sessionId],
        references: [nebSession.id],
    }),
}));
export const nebGenerationJobRelations = relations(nebGenerationJob, ({ one }) => ({
    design: one(nebDesign, {
        fields: [nebGenerationJob.designId],
        references: [nebDesign.id],
    }),
}));
export const nebBrandKitRelations = relations(nebBrandKit, ({ one }) => ({
    user: one(user, { fields: [nebBrandKit.userId], references: [user.id] }),
    team: one(team, { fields: [nebBrandKit.teamId], references: [team.id] }),
}));
export const nebAssetRelations = relations(nebAsset, ({ one }) => ({
    design: one(nebDesign, {
        fields: [nebAsset.designId],
        references: [nebDesign.id],
    }),
}));
export const nebMediaLibraryRelations = relations(nebMediaLibrary, ({ one }) => ({
    user: one(user, { fields: [nebMediaLibrary.userId], references: [user.id] }),
    team: one(team, { fields: [nebMediaLibrary.teamId], references: [team.id] }),
}));
