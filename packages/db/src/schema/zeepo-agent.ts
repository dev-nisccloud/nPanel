import { relations } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { team } from "./teams";
import { user } from "./auth";

// --- Zeepo Agent Session (chat thread) ----------------------------------------

export const zeepoAgentSession = pgTable(
  "zeepo_agent_session",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),
    title: text("title"),
    status: text("status").notNull().default("ACTIVE"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("zeepo_agent_session_userId_idx").on(table.userId),
    index("zeepo_agent_session_teamId_idx").on(table.teamId),
    index("zeepo_agent_session_updatedAt_idx").on(table.updatedAt),
  ]
);

// --- Zeepo Agent Message --------------------------------------------------------

export const zeepoAgentMessage = pgTable(
  "zeepo_agent_message",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id")
      .notNull()
      .references(() => zeepoAgentSession.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    content: text("content"),
    toolCalls: jsonb("tool_calls"),
    toolCallId: text("tool_call_id"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("zeepo_agent_message_sessionId_idx").on(table.sessionId),
    index("zeepo_agent_message_createdAt_idx").on(table.createdAt),
    index("zeepo_agent_message_sessionId_createdAt_idx").on(
      table.sessionId,
      table.createdAt
    ),
  ]
);

// --- Zeepo Agent Generation (Replicate job) -----------------------------------

export const zeepoAgentGeneration = pgTable(
  "zeepo_agent_generation",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id")
      .notNull()
      .references(() => zeepoAgentSession.id, { onDelete: "cascade" }),
    messageId: text("message_id").references(() => zeepoAgentMessage.id, {
      onDelete: "set null",
    }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),

    modelCategory: text("model_category").notNull(),
    modelId: text("model_id").notNull(),

    status: text("status").notNull().default("QUEUED"),
    qstashMessageId: text("qstash_message_id"),
    predictionId: text("prediction_id"),

    prompt: text("prompt"),
    inputs: jsonb("inputs"),
    outputs: jsonb("outputs"),
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
    index("zeepo_agent_generation_sessionId_idx").on(table.sessionId),
    index("zeepo_agent_generation_userId_idx").on(table.userId),
    index("zeepo_agent_generation_teamId_idx").on(table.teamId),
    index("zeepo_agent_generation_status_idx").on(table.status),
    index("zeepo_agent_generation_createdAt_idx").on(table.createdAt),
  ]
);

// --- Zeepo Agent Activity Log -------------------------------------------------

export const zeepoAgentActivityLog = pgTable(
  "zeepo_agent_activity_log",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id")
      .notNull()
      .references(() => zeepoAgentSession.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    action: text("action").notNull(),
    description: text("description"),
    metadata: jsonb("metadata"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("zeepo_agent_activity_log_sessionId_idx").on(table.sessionId),
    index("zeepo_agent_activity_log_userId_idx").on(table.userId),
    index("zeepo_agent_activity_log_action_idx").on(table.action),
    index("zeepo_agent_activity_log_createdAt_idx").on(table.createdAt),
  ]
);

// --- Relations ----------------------------------------------------------------

export const zeepoAgentSessionRelations = relations(
  zeepoAgentSession,
  ({ one, many }) => ({
    user: one(user, {
      fields: [zeepoAgentSession.userId],
      references: [user.id],
    }),
    team: one(team, {
      fields: [zeepoAgentSession.teamId],
      references: [team.id],
    }),
    messages: many(zeepoAgentMessage),
    generations: many(zeepoAgentGeneration),
    activityLogs: many(zeepoAgentActivityLog),
  })
);

export const zeepoAgentMessageRelations = relations(
  zeepoAgentMessage,
  ({ one, many }) => ({
    session: one(zeepoAgentSession, {
      fields: [zeepoAgentMessage.sessionId],
      references: [zeepoAgentSession.id],
    }),
    generations: many(zeepoAgentGeneration),
  })
);

export const zeepoAgentGenerationRelations = relations(
  zeepoAgentGeneration,
  ({ one }) => ({
    session: one(zeepoAgentSession, {
      fields: [zeepoAgentGeneration.sessionId],
      references: [zeepoAgentSession.id],
    }),
    message: one(zeepoAgentMessage, {
      fields: [zeepoAgentGeneration.messageId],
      references: [zeepoAgentMessage.id],
    }),
    user: one(user, {
      fields: [zeepoAgentGeneration.userId],
      references: [user.id],
    }),
    team: one(team, {
      fields: [zeepoAgentGeneration.teamId],
      references: [team.id],
    }),
  })
);

export const zeepoAgentActivityLogRelations = relations(
  zeepoAgentActivityLog,
  ({ one }) => ({
    session: one(zeepoAgentSession, {
      fields: [zeepoAgentActivityLog.sessionId],
      references: [zeepoAgentSession.id],
    }),
  })
);
