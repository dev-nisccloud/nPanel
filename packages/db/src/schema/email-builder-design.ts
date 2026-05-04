import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { user } from "./auth";
import { team } from "./teams";

// --- EmailBuilderDesign ------------------------------------------------------

export const emailBuilderDesign = pgTable(
  "email_builder_design",
  {
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

    // AI Generation Fields
    isAiGenerated: boolean("is_ai_generated").default(false).notNull(),
    aiStatus: text("ai_status").default("IDLE").notNull(), // IDLE, PROCESSING, COMPLETED, FAILED
    aiContext: jsonb("ai_context"),

    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (table) => [
    index("email_builder_design_userId_idx").on(table.userId),
    index("email_builder_design_teamId_idx").on(table.teamId),
    index("email_builder_design_isPublic_idx").on(table.isPublic),
  ],
);

// --- EmailBuilderDesignActivityLog -------------------------------------------

export const emailBuilderDesignActivityLog = pgTable(
  "email_builder_design_activity_log",
  {
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
  },
  (table) => [
    index("email_builder_design_activity_emailBuilderDesignId_idx").on(
      table.emailBuilderDesignId,
    ),
    index("email_builder_design_activity_userId_idx").on(table.userId),
    index("email_builder_design_activity_action_idx").on(table.action),
    index("email_builder_design_activity_createdAt_idx").on(table.createdAt),
  ],
);

// --- EmailBuilderLibrary -----------------------------------------------------

export const emailBuilderLibrary = pgTable(
  "email_builder_library",
  {
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
  },
  (table) => [
    index("email_builder_library_userId_idx").on(table.userId),
    index("email_builder_library_teamId_idx").on(table.teamId),
    index("email_builder_library_createdAt_idx").on(table.createdAt),
  ],
);

// --- Relations ---------------------------------------------------------------

export const emailBuilderDesignRelations = relations(
  emailBuilderDesign,
  ({ one, many }) => ({
    user: one(user, {
      fields: [emailBuilderDesign.userId],
      references: [user.id],
    }),
    team: one(team, {
      fields: [emailBuilderDesign.teamId],
      references: [team.id],
    }),
    activityLogs: many(emailBuilderDesignActivityLog),
  }),
);

export const emailBuilderDesignActivityLogRelations = relations(
  emailBuilderDesignActivityLog,
  ({ one }) => ({
    emailBuilderDesign: one(emailBuilderDesign, {
      fields: [emailBuilderDesignActivityLog.emailBuilderDesignId],
      references: [emailBuilderDesign.id],
    }),
  }),
);

export const emailBuilderLibraryRelations = relations(
  emailBuilderLibrary,
  ({ one }) => ({
    user: one(user, {
      fields: [emailBuilderLibrary.userId],
      references: [user.id],
    }),
    team: one(team, {
      fields: [emailBuilderLibrary.teamId],
      references: [team.id],
    }),
  }),
);
