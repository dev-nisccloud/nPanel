import { relations } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { team } from "./teams";
import { user } from "./auth";
import { niscClientSubscriptionUsage } from "./products";

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

    /** Tokens debited from the team balance after successful completion (customer billing). */
    tokensDebited: text("tokens_debited"),
    /** Internal provider cost in USD micro-dollars (1 USD = 1_000_000 micros). Not exposed in UI. */
    providerCostUsdMicros: integer("provider_cost_usd_micros"),

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

// --- Zeepo Agent Image Edit History ------------------------------------------
// Every edit applied to a generated image (instruction, style, erase, etc.)
// is persisted here. Records form a linked-list via parentId, giving a full
// version history for any generated image asset.

export const zeepoAgentImageEditHistory = pgTable(
  "zeepo_agent_image_edit_history",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id")
      .notNull()
      .references(() => zeepoAgentSession.id, { onDelete: "cascade" }),
    generationId: text("generation_id")
      .notNull()
      .references(() => zeepoAgentGeneration.id, { onDelete: "cascade" }),
    /** The edit this version was derived from (null for the initial "original" snapshot). */
    parentId: text("parent_id"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    /** Durable UploadThing URL for this image version. */
    imageUrl: text("image_url").notNull(),
    /** Human-readable operation label shown in the history timeline. */
    operationType: text("operation_type").notNull().default("instruction"),
    /** User-visible label, e.g. "Watercolor style" or "Background removed". */
    label: text("label"),
    /** Original text prompt / instructions used for this edit (if applicable). */
    prompt: text("prompt"),
    /** Arbitrary extra data (style preset name, seed, variation index, etc.). */
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("zeepo_agent_image_edit_history_sessionId_idx").on(table.sessionId),
    index("zeepo_agent_image_edit_history_generationId_idx").on(table.generationId),
    index("zeepo_agent_image_edit_history_userId_idx").on(table.userId),
    index("zeepo_agent_image_edit_history_createdAt_idx").on(table.createdAt),
  ]
);

// --- Zeepo Agent Token Ledger (customer balance audit) -----------------------

export const zeepoAgentTokenLedger = pgTable(
  "zeepo_agent_token_ledger",
  {
    id: text("id").primaryKey(),
    teamId: text("team_id")
      .notNull()
      .references(() => team.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    sessionId: text("session_id").references(() => zeepoAgentSession.id, {
      onDelete: "set null",
    }),
    subscriptionUsageId: text("subscription_usage_id").references(
      () => niscClientSubscriptionUsage.id,
      { onDelete: "set null" },
    ),
    /** DEBIT | CREDIT */
    direction: text("direction").notNull(),
    /** Token amount (decimal string, e.g. "12.5"). */
    tokens: text("tokens").notNull(),
    balanceBefore: text("balance_before").notNull(),
    balanceAfter: text("balance_after").notNull(),
    /** orchestration | media_generation | image_edit | title_gen | top_up | subscription_grant | adjustment */
    operationType: text("operation_type").notNull(),
    description: text("description"),
    /** Internal only - never return to customer UI. */
    providerCostUsdMicros: integer("provider_cost_usd_micros"),
    predictionId: text("prediction_id"),
    modelId: text("model_id"),
    generationId: text("generation_id").references(() => zeepoAgentGeneration.id, {
      onDelete: "set null",
    }),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("zeepo_agent_token_ledger_teamId_idx").on(table.teamId),
    index("zeepo_agent_token_ledger_userId_idx").on(table.userId),
    index("zeepo_agent_token_ledger_sessionId_idx").on(table.sessionId),
    index("zeepo_agent_token_ledger_operationType_idx").on(table.operationType),
    index("zeepo_agent_token_ledger_createdAt_idx").on(table.createdAt),
    index("zeepo_agent_token_ledger_predictionId_idx").on(table.predictionId),
  ],
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
    imageEditHistory: many(zeepoAgentImageEditHistory),
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

export const zeepoAgentImageEditHistoryRelations = relations(
  zeepoAgentImageEditHistory,
  ({ one }) => ({
    session: one(zeepoAgentSession, {
      fields: [zeepoAgentImageEditHistory.sessionId],
      references: [zeepoAgentSession.id],
    }),
    generation: one(zeepoAgentGeneration, {
      fields: [zeepoAgentImageEditHistory.generationId],
      references: [zeepoAgentGeneration.id],
    }),
    user: one(user, {
      fields: [zeepoAgentImageEditHistory.userId],
      references: [user.id],
    }),
    parent: one(zeepoAgentImageEditHistory, {
      fields: [zeepoAgentImageEditHistory.parentId],
      references: [zeepoAgentImageEditHistory.id],
    }),
  })
);

export const zeepoAgentTokenLedgerRelations = relations(
  zeepoAgentTokenLedger,
  ({ one }) => ({
    team: one(team, {
      fields: [zeepoAgentTokenLedger.teamId],
      references: [team.id],
    }),
    user: one(user, {
      fields: [zeepoAgentTokenLedger.userId],
      references: [user.id],
    }),
    session: one(zeepoAgentSession, {
      fields: [zeepoAgentTokenLedger.sessionId],
      references: [zeepoAgentSession.id],
    }),
    subscriptionUsage: one(niscClientSubscriptionUsage, {
      fields: [zeepoAgentTokenLedger.subscriptionUsageId],
      references: [niscClientSubscriptionUsage.id],
    }),
    generation: one(zeepoAgentGeneration, {
      fields: [zeepoAgentTokenLedger.generationId],
      references: [zeepoAgentGeneration.id],
    }),
  }),
);
