import { relations } from "drizzle-orm";
import { boolean, index, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { team } from "./teams";
// --- ImageGenProject ---------------------------------------------------------
export const imageGenProject = pgTable("imagegen_project", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),
    json: text("json").notNull(),
    height: integer("height").notNull(),
    width: integer("width").notNull(),
    thumbnailUrl: text("thumbnail_url"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
}, (table) => [
    index("imagegen_project_userId_idx").on(table.userId),
    index("imagegen_project_teamId_idx").on(table.teamId),
]);
// --- ImageGenTemplate --------------------------------------------------------
export const imageGenTemplate = pgTable("imagegen_template", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    json: text("json").notNull(),
    height: integer("height").notNull(),
    width: integer("width").notNull(),
    thumbnailUrl: text("thumbnail_url"),
    isPublic: boolean("is_public").default(true).notNull(),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
}, (table) => [
    index("imagegen_template_userId_idx").on(table.userId),
    index("imagegen_template_isPublic_idx").on(table.isPublic),
]);
// --- ImageGenProjectActivityLog ---------------------------------------------
export const imageGenProjectActivityLog = pgTable("imagegen_project_activity_log", {
    id: text("id").primaryKey(),
    imageGenProjectId: text("image_gen_project_id")
        .notNull()
        .references(() => imageGenProject.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    action: text("action").notNull(),
    description: text("description"),
    metadata: jsonb("metadata"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").notNull(),
}, (table) => [
    index("imagegen_project_activity_log_imageGenProjectId_idx").on(table.imageGenProjectId),
    index("imagegen_project_activity_log_userId_idx").on(table.userId),
    index("imagegen_project_activity_log_action_idx").on(table.action),
    index("imagegen_project_activity_log_createdAt_idx").on(table.createdAt),
]);
// --- ImageGenTemplateActivityLog --------------------------------------------
export const imageGenTemplateActivityLog = pgTable("imagegen_template_activity_log", {
    id: text("id").primaryKey(),
    imageGenTemplateId: text("image_gen_template_id")
        .notNull()
        .references(() => imageGenTemplate.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    action: text("action").notNull(),
    description: text("description"),
    metadata: jsonb("metadata"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").notNull(),
}, (table) => [
    index("imagegen_template_activity_log_imageGenTemplateId_idx").on(table.imageGenTemplateId),
    index("imagegen_template_activity_log_userId_idx").on(table.userId),
    index("imagegen_template_activity_log_action_idx").on(table.action),
    index("imagegen_template_activity_log_createdAt_idx").on(table.createdAt),
]);
// --- ImageGenUpload ----------------------------------------------------------
export const imageGenUpload = pgTable("imagegen_upload", {
    id: text("id").primaryKey(),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),
    fileUrl: text("file_url").notNull(),
    fileKey: text("file_key").notNull(),
    fileName: text("file_name").notNull(),
    fileSize: integer("file_size").notNull(),
    mimeType: text("mime_type").notNull(),
    fileMetadata: jsonb("file_metadata"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
}, (table) => [
    index("imagegen_upload_userId_idx").on(table.userId),
    index("imagegen_upload_teamId_idx").on(table.teamId),
    index("imagegen_upload_createdAt_idx").on(table.createdAt),
]);
// --- ImageGenUploadActivityLog ----------------------------------------------
export const imageGenUploadActivityLog = pgTable("imagegen_upload_activity_log", {
    id: text("id").primaryKey(),
    imageGenUploadId: text("image_gen_upload_id")
        .notNull()
        .references(() => imageGenUpload.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    action: text("action").notNull(),
    description: text("description"),
    metadata: jsonb("metadata"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").notNull(),
}, (table) => [
    index("imagegen_upload_activity_log_imageGenUploadId_idx").on(table.imageGenUploadId),
    index("imagegen_upload_activity_log_userId_idx").on(table.userId),
    index("imagegen_upload_activity_log_action_idx").on(table.action),
    index("imagegen_upload_activity_log_createdAt_idx").on(table.createdAt),
]);
// --- ImageGenAiGeneration ----------------------------------------------------
export const imageGenAiGeneration = pgTable("imagegen_ai_generation", {
    id: text("id").primaryKey(),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),
    prompt: text("prompt").notNull(),
    referenceImageUrls: jsonb("reference_image_urls"),
    imageUrl: text("image_url").notNull(),
    imageKey: text("image_key").notNull(),
    imageFileName: text("image_file_name").notNull(),
    imageSize: integer("image_size").notNull(),
    imageMimeType: text("image_mime_type").notNull(),
    imageMetadata: jsonb("image_metadata"),
    modelId: text("model_id").notNull(),
    modelName: text("model_name"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
}, (table) => [
    index("imagegen_ai_generation_userId_idx").on(table.userId),
    index("imagegen_ai_generation_teamId_idx").on(table.teamId),
    index("imagegen_ai_generation_createdAt_idx").on(table.createdAt),
    index("imagegen_ai_generation_modelId_idx").on(table.modelId),
]);
// --- ImageGenAiGenerationActivityLog ----------------------------------------
export const imageGenAiGenerationActivityLog = pgTable("imagegen_ai_generation_activity_log", {
    id: text("id").primaryKey(),
    imageGenAiGenerationId: text("image_gen_ai_generation_id")
        .notNull()
        .references(() => imageGenAiGeneration.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    action: text("action").notNull(),
    description: text("description"),
    metadata: jsonb("metadata"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").notNull(),
}, (table) => [
    index("imagegen_ai_generation_activity_log_imageGenAiGenerationId_idx").on(table.imageGenAiGenerationId),
    index("imagegen_ai_generation_activity_log_userId_idx").on(table.userId),
    index("imagegen_ai_generation_activity_log_action_idx").on(table.action),
    index("imagegen_ai_generation_activity_log_createdAt_idx").on(table.createdAt),
]);
// --- Relations ---------------------------------------------------------------
export const imageGenProjectRelations = relations(imageGenProject, ({ one, many }) => ({
    user: one(user, { fields: [imageGenProject.userId], references: [user.id] }),
    team: one(team, { fields: [imageGenProject.teamId], references: [team.id] }),
    activityLogs: many(imageGenProjectActivityLog),
}));
export const imageGenTemplateRelations = relations(imageGenTemplate, ({ one, many }) => ({
    user: one(user, { fields: [imageGenTemplate.userId], references: [user.id] }),
    activityLogs: many(imageGenTemplateActivityLog),
}));
export const imageGenProjectActivityLogRelations = relations(imageGenProjectActivityLog, ({ one }) => ({
    imageGenProject: one(imageGenProject, {
        fields: [imageGenProjectActivityLog.imageGenProjectId],
        references: [imageGenProject.id],
    }),
}));
export const imageGenTemplateActivityLogRelations = relations(imageGenTemplateActivityLog, ({ one }) => ({
    imageGenTemplate: one(imageGenTemplate, {
        fields: [imageGenTemplateActivityLog.imageGenTemplateId],
        references: [imageGenTemplate.id],
    }),
}));
export const imageGenUploadRelations = relations(imageGenUpload, ({ one, many }) => ({
    user: one(user, { fields: [imageGenUpload.userId], references: [user.id] }),
    team: one(team, { fields: [imageGenUpload.teamId], references: [team.id] }),
    activityLogs: many(imageGenUploadActivityLog),
}));
export const imageGenUploadActivityLogRelations = relations(imageGenUploadActivityLog, ({ one }) => ({
    imageGenUpload: one(imageGenUpload, {
        fields: [imageGenUploadActivityLog.imageGenUploadId],
        references: [imageGenUpload.id],
    }),
}));
export const imageGenAiGenerationRelations = relations(imageGenAiGeneration, ({ one, many }) => ({
    user: one(user, {
        fields: [imageGenAiGeneration.userId],
        references: [user.id],
    }),
    team: one(team, {
        fields: [imageGenAiGeneration.teamId],
        references: [team.id],
    }),
    activityLogs: many(imageGenAiGenerationActivityLog),
}));
export const imageGenAiGenerationActivityLogRelations = relations(imageGenAiGenerationActivityLog, ({ one }) => ({
    imageGenAiGeneration: one(imageGenAiGeneration, {
        fields: [imageGenAiGenerationActivityLog.imageGenAiGenerationId],
        references: [imageGenAiGeneration.id],
    }),
}));
