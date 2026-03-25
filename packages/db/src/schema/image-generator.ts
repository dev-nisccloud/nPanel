import { relations } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { user } from "./auth";
import { team } from "./teams";

// --- ImageGeneratorGeneration ------------------------------------------------

export const imageGeneratorGeneration = pgTable(
  "image_generator_generation",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),

    prompt: text("prompt").notNull(),
    referenceImageUrls: jsonb("reference_image_urls"),

    aspectRatio: text("aspect_ratio").notNull(),
    outputFormat: text("output_format").notNull(),
    resolution: text("resolution").notNull(),
    variationsCount: integer("variations_count").notNull(),

    modelId: text("model_id").notNull(),
    modelName: text("model_name"),

    status: text("status").default("QUEUED").notNull(),
    errorMessage: text("error_message"),
    qstashMessageId: text("qstash_message_id"),
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),

    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (table) => [
    index("image_generator_generation_userId_idx").on(table.userId),
    index("image_generator_generation_teamId_idx").on(table.teamId),
    index("image_generator_generation_createdAt_idx").on(table.createdAt),
    index("image_generator_generation_modelId_idx").on(table.modelId),
    index("image_generator_generation_status_idx").on(table.status),
  ],
);

// --- ImageGeneratorVariation -------------------------------------------------

export const imageGeneratorVariation = pgTable(
  "image_generator_variation",
  {
    id: text("id").primaryKey(),
    imageGeneratorGenerationId: text("image_generator_generation_id")
      .notNull()
      .references(() => imageGeneratorGeneration.id, { onDelete: "cascade" }),

    variationIndex: integer("variation_index").notNull(),

    status: text("status").default("PROCESSING").notNull(),
    errorMessage: text("error_message"),

    predictionId: text("prediction_id"),

    imageUrl: text("image_url"),
    imageKey: text("image_key"),
    imageFileName: text("image_file_name"),
    imageSize: integer("image_size"),
    imageMimeType: text("image_mime_type"),
    imageMetadata: jsonb("image_metadata"),

    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (table) => [
    index("image_generator_variation_imageGeneratorGenerationId_idx").on(
      table.imageGeneratorGenerationId,
    ),
    index("image_generator_variation_variationIndex_idx").on(table.variationIndex),
    index("image_generator_variation_status_idx").on(table.status),
    index("image_generator_variation_predictionId_idx").on(table.predictionId),
  ],
);

// --- ImageGeneratorGenerationActivityLog ------------------------------------

export const imageGeneratorGenerationActivityLog = pgTable(
  "image_generator_generation_activity_log",
  {
    id: text("id").primaryKey(),
    imageGeneratorGenerationId: text("image_generator_generation_id")
      .notNull()
      .references(() => imageGeneratorGeneration.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    action: text("action").notNull(),
    description: text("description"),
    metadata: jsonb("metadata"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").notNull(),
  },
  (table) => [
    index("image_gen_generation_activity_imageGeneratorGenerationId_idx").on(
      table.imageGeneratorGenerationId,
    ),
    index("image_gen_generation_activity_userId_idx").on(table.userId),
    index("image_gen_generation_activity_action_idx").on(table.action),
    index("image_gen_generation_activity_createdAt_idx").on(table.createdAt),
  ],
);

// --- BackgroundRemoverGeneration ----------------------------------------------

export const backgroundRemoverGeneration = pgTable(
  "background_remover_generation",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),

    originalImageUrl: text("original_image_url").notNull(),
    originalImageKey: text("original_image_key").notNull(),
    originalImageFileName: text("original_image_file_name").notNull(),
    originalImageSize: integer("original_image_size").notNull(),
    originalImageMimeType: text("original_image_mime_type").notNull(),
    originalImageMetadata: jsonb("original_image_metadata"),

    processedImageUrl: text("processed_image_url"),
    processedImageKey: text("processed_image_key"),
    processedImageFileName: text("processed_image_file_name"),
    processedImageSize: integer("processed_image_size"),
    processedImageMimeType: text("processed_image_mime_type"),
    processedImageMetadata: jsonb("processed_image_metadata"),

    modelId: text("model_id").notNull(),
    modelName: text("model_name"),

    status: text("status").default("QUEUED").notNull(),
    errorMessage: text("error_message"),
    qstashMessageId: text("qstash_message_id"),
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),

    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (table) => [
    index("background_remover_generation_userId_idx").on(table.userId),
    index("background_remover_generation_teamId_idx").on(table.teamId),
    index("background_remover_generation_createdAt_idx").on(table.createdAt),
    index("background_remover_generation_modelId_idx").on(table.modelId),
    index("background_remover_generation_status_idx").on(table.status),
  ],
);

// --- BackgroundRemoverGenerationActivityLog -----------------------------------

export const backgroundRemoverGenerationActivityLog = pgTable(
  "background_remover_generation_activity_log",
  {
    id: text("id").primaryKey(),
    backgroundRemoverGenerationId: text("background_remover_generation_id")
      .notNull()
      .references(() => backgroundRemoverGeneration.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    action: text("action").notNull(),
    description: text("description"),
    metadata: jsonb("metadata"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").notNull(),
  },
  (table) => [
    index("background_remover_activity_backgroundRemoverGenerationId_idx").on(
      table.backgroundRemoverGenerationId,
    ),
    index("background_remover_activity_userId_idx").on(table.userId),
    index("background_remover_activity_action_idx").on(table.action),
    index("background_remover_activity_createdAt_idx").on(table.createdAt),
  ],
);

// --- Relations ---------------------------------------------------------------

export const imageGeneratorGenerationRelations = relations(
  imageGeneratorGeneration,
  ({ one, many }) => ({
    user: one(user, {
      fields: [imageGeneratorGeneration.userId],
      references: [user.id],
    }),
    team: one(team, {
      fields: [imageGeneratorGeneration.teamId],
      references: [team.id],
    }),
    variations: many(imageGeneratorVariation),
    activityLogs: many(imageGeneratorGenerationActivityLog),
  }),
);

export const imageGeneratorVariationRelations = relations(
  imageGeneratorVariation,
  ({ one }) => ({
    imageGeneratorGeneration: one(imageGeneratorGeneration, {
      fields: [imageGeneratorVariation.imageGeneratorGenerationId],
      references: [imageGeneratorGeneration.id],
    }),
  }),
);

export const imageGeneratorGenerationActivityLogRelations = relations(
  imageGeneratorGenerationActivityLog,
  ({ one }) => ({
    imageGeneratorGeneration: one(imageGeneratorGeneration, {
      fields: [imageGeneratorGenerationActivityLog.imageGeneratorGenerationId],
      references: [imageGeneratorGeneration.id],
    }),
  }),
);

export const backgroundRemoverGenerationRelations = relations(
  backgroundRemoverGeneration,
  ({ one, many }) => ({
    user: one(user, {
      fields: [backgroundRemoverGeneration.userId],
      references: [user.id],
    }),
    team: one(team, {
      fields: [backgroundRemoverGeneration.teamId],
      references: [team.id],
    }),
    activityLogs: many(backgroundRemoverGenerationActivityLog),
  }),
);

export const backgroundRemoverGenerationActivityLogRelations = relations(
  backgroundRemoverGenerationActivityLog,
  ({ one }) => ({
    backgroundRemoverGeneration: one(backgroundRemoverGeneration, {
      fields: [backgroundRemoverGenerationActivityLog.backgroundRemoverGenerationId],
      references: [backgroundRemoverGeneration.id],
    }),
  }),
);
