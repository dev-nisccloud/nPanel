import { relations } from "drizzle-orm";
import {
  jsonb,
  pgTable,
  text,
  timestamp,
  index,
  integer,
} from "drizzle-orm/pg-core";

import { team } from "./teams";
import { user } from "./auth";

// --- Zeepo Canvas Project -----------------------------------------------------

export const zeepoCanvasProject = pgTable(
  "zeepo_canvas_project",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull().default("Untitled Canvas"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),

    // The full ReactFlow graph: { nodes: Node[], edges: Edge[] }
    canvasJson: jsonb("canvas_json")
      .notNull()
      .default('{"nodes":[],"edges":[]}'),

    width: integer("width").notNull().default(1200),
    height: integer("height").notNull().default(800),
    thumbnailUrl: text("thumbnail_url"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("zeepo_canvas_project_userId_idx").on(table.userId),
    index("zeepo_canvas_project_teamId_idx").on(table.teamId),
    index("zeepo_canvas_project_updatedAt_idx").on(table.updatedAt),
  ]
);

// --- Zeepo Canvas Activity Log ------------------------------------------------

export const zeepoCanvasActivityLog = pgTable(
  "zeepo_canvas_activity_log",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => zeepoCanvasProject.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    action: text("action").notNull(), // CREATE, UPDATE, DELETE, GENERATE
    description: text("description"),
    metadata: jsonb("metadata"),
    
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("zeepo_canvas_activity_log_projectId_idx").on(table.projectId),
    index("zeepo_canvas_activity_log_userId_idx").on(table.userId),
    index("zeepo_canvas_activity_log_action_idx").on(table.action),
    index("zeepo_canvas_activity_log_createdAt_idx").on(table.createdAt),
  ]
);

// --- Zeepo Canvas Generation --------------------------------------------------

export const zeepoCanvasGeneration = pgTable(
  "zeepo_canvas_generation",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => zeepoCanvasProject.id, { onDelete: "cascade" }),
    
    nodeId: text("node_id").notNull(), // Links back to the specific node in canvasJson
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),

    // Model Data
    modelCategory: text("model_category").notNull(), // "text", "image", "video", "audio"
    modelId: text("model_id").notNull(), // e.g., "meta/llama-3.1-8b-instruct"

    // Job Tracking
    status: text("status").notNull().default("QUEUED"), // QUEUED, PROCESSING, COMPLETED, FAILED
    qstashMessageId: text("qstash_message_id"),
    predictionId: text("prediction_id"), // Replicate ID

    // Inputs & Outputs
    prompt: text("prompt"),
    inputs: jsonb("inputs"), // e.g., source images, audio clips
    outputs: jsonb("outputs"), // e.g., generated URLs or text payload
    errorMessage: text("error_message"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .defaultNow()
      .notNull(),
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
  },
  (table) => [
    index("zeepo_canvas_generation_projectId_idx").on(table.projectId),
    index("zeepo_canvas_generation_userId_idx").on(table.userId),
    index("zeepo_canvas_generation_teamId_idx").on(table.teamId),
    index("zeepo_canvas_generation_status_idx").on(table.status),
    index("zeepo_canvas_generation_createdAt_idx").on(table.createdAt),
  ]
);

// --- Relations ----------------------------------------------------------------

export const zeepoCanvasProjectRelations = relations(
  zeepoCanvasProject,
  ({ one, many }) => ({
    user: one(user, { fields: [zeepoCanvasProject.userId], references: [user.id] }),
    team: one(team, { fields: [zeepoCanvasProject.teamId], references: [team.id] }),
    activityLogs: many(zeepoCanvasActivityLog),
    generations: many(zeepoCanvasGeneration),
  })
);

export const zeepoCanvasActivityLogRelations = relations(
  zeepoCanvasActivityLog,
  ({ one }) => ({
    project: one(zeepoCanvasProject, {
      fields: [zeepoCanvasActivityLog.projectId],
      references: [zeepoCanvasProject.id],
    }),
  })
);

export const zeepoCanvasGenerationRelations = relations(
  zeepoCanvasGeneration,
  ({ one }) => ({
    project: one(zeepoCanvasProject, {
      fields: [zeepoCanvasGeneration.projectId],
      references: [zeepoCanvasProject.id],
    }),
    user: one(user, { fields: [zeepoCanvasGeneration.userId], references: [user.id] }),
    team: one(team, { fields: [zeepoCanvasGeneration.teamId], references: [team.id] }),
  })
);
