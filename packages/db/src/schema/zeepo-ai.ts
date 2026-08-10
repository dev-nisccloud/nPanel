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

/**
 * Zeepo AI (direct-provider chat product).
 *
 * Design rules:
 * - `kind`, `provider`, `status`, `action`, `operationType`, `eventType` are TEXT
 *   (app-validated) so new media kinds (e.g. video) and providers can be added
 *   without Postgres enum migrations.
 * - `zeepo_ai_usage_event` is the analytics/trace surface.
 * - `zeepo_ai_token_ledger` is the wallet debit/credit audit (balances).
 * - External provider ids live in `providerRequestId` (not Replicate-specific).
 */

// --- Session ------------------------------------------------------------------

export const zeepoAiSession = pgTable(
  "zeepo_ai_session",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),
    title: text("title"),
    /** ACTIVE | ARCHIVED | DELETED */
    status: text("status").notNull().default("ACTIVE"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("zeepo_ai_session_userId_idx").on(table.userId),
    index("zeepo_ai_session_teamId_idx").on(table.teamId),
    index("zeepo_ai_session_status_idx").on(table.status),
    index("zeepo_ai_session_updatedAt_idx").on(table.updatedAt),
  ],
);

// --- Message ------------------------------------------------------------------

export const zeepoAiMessage = pgTable(
  "zeepo_ai_message",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id")
      .notNull()
      .references(() => zeepoAiSession.id, { onDelete: "cascade" }),
    /** user | assistant | system | tool */
    role: text("role").notNull(),
    content: text("content"),
    /** Optional chain-of-thought / reasoning text shown in UI accordion. */
    reasoning: text("reasoning"),
    toolCalls: jsonb("tool_calls"),
    toolCallId: text("tool_call_id"),
    /** streaming | complete | error | cancelled */
    status: text("status").notNull().default("complete"),
    /** Provider token accounting for this turn (nullable until settled). */
    inputTokens: integer("input_tokens"),
    outputTokens: integer("output_tokens"),
    cacheReadTokens: integer("cache_read_tokens"),
    cacheWriteTokens: integer("cache_write_tokens"),
    /**
     * Flexible bag: skillId, clarifyingQuestions, attachments, searchEnabled,
     * provider message ids, stop reason, etc.
     */
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("zeepo_ai_message_sessionId_idx").on(table.sessionId),
    index("zeepo_ai_message_createdAt_idx").on(table.createdAt),
    index("zeepo_ai_message_sessionId_createdAt_idx").on(
      table.sessionId,
      table.createdAt,
    ),
    index("zeepo_ai_message_role_idx").on(table.role),
  ],
);

// --- Tool invocation (normalized tracing) -------------------------------------

export const zeepoAiToolInvocation = pgTable(
  "zeepo_ai_tool_invocation",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id")
      .notNull()
      .references(() => zeepoAiSession.id, { onDelete: "cascade" }),
    messageId: text("message_id").references(() => zeepoAiMessage.id, {
      onDelete: "set null",
    }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),
    /** e.g. check_domain_availability, create_document, web_search */
    toolName: text("tool_name").notNull(),
    /** queued | running | succeeded | failed | cancelled */
    status: text("status").notNull().default("queued"),
    args: jsonb("args"),
    result: jsonb("result"),
    errorMessage: text("error_message"),
    durationMs: integer("duration_ms"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    completedAt: timestamp("completed_at"),
  },
  (table) => [
    index("zeepo_ai_tool_invocation_sessionId_idx").on(table.sessionId),
    index("zeepo_ai_tool_invocation_messageId_idx").on(table.messageId),
    index("zeepo_ai_tool_invocation_userId_idx").on(table.userId),
    index("zeepo_ai_tool_invocation_toolName_idx").on(table.toolName),
    index("zeepo_ai_tool_invocation_status_idx").on(table.status),
    index("zeepo_ai_tool_invocation_createdAt_idx").on(table.createdAt),
  ],
);

// --- Generation (any artifact kind) -------------------------------------------

export const zeepoAiGeneration = pgTable(
  "zeepo_ai_generation",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id")
      .notNull()
      .references(() => zeepoAiSession.id, { onDelete: "cascade" }),
    messageId: text("message_id").references(() => zeepoAiMessage.id, {
      onDelete: "set null",
    }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),

    /**
     * Extensible kind: image | document | presentation | image-presentation |
     * video | audio | background-remover | text | …
     */
    kind: text("kind").notNull(),
    /** anthropic | google | internal | brave | … */
    provider: text("provider").notNull(),
    modelId: text("model_id").notNull(),

    /** QUEUED | PROCESSING | COMPLETED | FAILED | CANCELLED */
    status: text("status").notNull().default("QUEUED"),
    qstashMessageId: text("qstash_message_id"),
    /** Generic external job / response id (Anthropic message id, Google op name, etc.). */
    providerRequestId: text("provider_request_id"),

    /** Parent generation for variations / derived assets. */
    parentGenerationId: text("parent_generation_id"),

    tokensDebited: text("tokens_debited"),
    /** Internal provider cost in USD micro-dollars (1 USD = 1_000_000 micros). */
    providerCostUsdMicros: integer("provider_cost_usd_micros"),

    prompt: text("prompt"),
    inputs: jsonb("inputs"),
    outputs: jsonb("outputs"),
    errorMessage: text("error_message"),
    metadata: jsonb("metadata"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .defaultNow()
      .notNull(),
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
  },
  (table) => [
    index("zeepo_ai_generation_sessionId_idx").on(table.sessionId),
    index("zeepo_ai_generation_messageId_idx").on(table.messageId),
    index("zeepo_ai_generation_userId_idx").on(table.userId),
    index("zeepo_ai_generation_teamId_idx").on(table.teamId),
    index("zeepo_ai_generation_kind_idx").on(table.kind),
    index("zeepo_ai_generation_provider_idx").on(table.provider),
    index("zeepo_ai_generation_status_idx").on(table.status),
    index("zeepo_ai_generation_providerRequestId_idx").on(table.providerRequestId),
    index("zeepo_ai_generation_parentGenerationId_idx").on(table.parentGenerationId),
    index("zeepo_ai_generation_createdAt_idx").on(table.createdAt),
  ],
);

// --- Attachments --------------------------------------------------------------

export const zeepoAiAttachment = pgTable(
  "zeepo_ai_attachment",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id")
      .notNull()
      .references(() => zeepoAiSession.id, { onDelete: "cascade" }),
    messageId: text("message_id").references(() => zeepoAiMessage.id, {
      onDelete: "set null",
    }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    storageKey: text("storage_key"),
    name: text("name").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("zeepo_ai_attachment_sessionId_idx").on(table.sessionId),
    index("zeepo_ai_attachment_messageId_idx").on(table.messageId),
    index("zeepo_ai_attachment_userId_idx").on(table.userId),
    index("zeepo_ai_attachment_createdAt_idx").on(table.createdAt),
  ],
);

// --- Image edit history (schema-ready; UI may omit toolbar initially) ---------

export const zeepoAiImageEditHistory = pgTable(
  "zeepo_ai_image_edit_history",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id")
      .notNull()
      .references(() => zeepoAiSession.id, { onDelete: "cascade" }),
    generationId: text("generation_id")
      .notNull()
      .references(() => zeepoAiGeneration.id, { onDelete: "cascade" }),
    parentId: text("parent_id"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    imageUrl: text("image_url").notNull(),
    /** instruction | style | erase | background | upscale | text | variation | original | … */
    operationType: text("operation_type").notNull().default("instruction"),
    label: text("label"),
    prompt: text("prompt"),
    provider: text("provider"),
    modelId: text("model_id"),
    providerRequestId: text("provider_request_id"),
    tokensDebited: text("tokens_debited"),
    providerCostUsdMicros: integer("provider_cost_usd_micros"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("zeepo_ai_image_edit_history_sessionId_idx").on(table.sessionId),
    index("zeepo_ai_image_edit_history_generationId_idx").on(table.generationId),
    index("zeepo_ai_image_edit_history_userId_idx").on(table.userId),
    index("zeepo_ai_image_edit_history_createdAt_idx").on(table.createdAt),
  ],
);

// --- Usage events (analytics / trace) -----------------------------------------

export const zeepoAiUsageEvent = pgTable(
  "zeepo_ai_usage_event",
  {
    id: text("id").primaryKey(),
    teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    sessionId: text("session_id").references(() => zeepoAiSession.id, {
      onDelete: "set null",
    }),
    messageId: text("message_id").references(() => zeepoAiMessage.id, {
      onDelete: "set null",
    }),
    generationId: text("generation_id").references(() => zeepoAiGeneration.id, {
      onDelete: "set null",
    }),
    toolInvocationId: text("tool_invocation_id").references(
      () => zeepoAiToolInvocation.id,
      { onDelete: "set null" },
    ),
    /**
     * chat_turn | tool_call | generation | image_edit | title_gen | search |
     * skill_start | clarifying_questions | adjustment | …
     */
    eventType: text("event_type").notNull(),
    provider: text("provider"),
    modelId: text("model_id"),
    kind: text("kind"),
    /** succeeded | failed | cancelled | partial */
    status: text("status").notNull().default("succeeded"),
    tokensDebited: text("tokens_debited"),
    inputTokens: integer("input_tokens"),
    outputTokens: integer("output_tokens"),
    providerCostUsdMicros: integer("provider_cost_usd_micros"),
    latencyMs: integer("latency_ms"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("zeepo_ai_usage_event_teamId_idx").on(table.teamId),
    index("zeepo_ai_usage_event_userId_idx").on(table.userId),
    index("zeepo_ai_usage_event_sessionId_idx").on(table.sessionId),
    index("zeepo_ai_usage_event_eventType_idx").on(table.eventType),
    index("zeepo_ai_usage_event_provider_idx").on(table.provider),
    index("zeepo_ai_usage_event_kind_idx").on(table.kind),
    index("zeepo_ai_usage_event_createdAt_idx").on(table.createdAt),
    index("zeepo_ai_usage_event_teamId_createdAt_idx").on(
      table.teamId,
      table.createdAt,
    ),
  ],
);

// --- Activity log (support / audit) -------------------------------------------

export const zeepoAiActivityLog = pgTable(
  "zeepo_ai_activity_log",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id").references(() => zeepoAiSession.id, {
      onDelete: "cascade",
    }),
    userId: text("user_id").notNull(),
    teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),
    /** session.create | message.send | generation.complete | panel.open | … */
    action: text("action").notNull(),
    description: text("description"),
    metadata: jsonb("metadata"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("zeepo_ai_activity_log_sessionId_idx").on(table.sessionId),
    index("zeepo_ai_activity_log_userId_idx").on(table.userId),
    index("zeepo_ai_activity_log_teamId_idx").on(table.teamId),
    index("zeepo_ai_activity_log_action_idx").on(table.action),
    index("zeepo_ai_activity_log_createdAt_idx").on(table.createdAt),
  ],
);

// --- Token ledger (wallet debit/credit) ---------------------------------------

export const zeepoAiTokenLedger = pgTable(
  "zeepo_ai_token_ledger",
  {
    id: text("id").primaryKey(),
    teamId: text("team_id")
      .notNull()
      .references(() => team.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    sessionId: text("session_id").references(() => zeepoAiSession.id, {
      onDelete: "set null",
    }),
    subscriptionUsageId: text("subscription_usage_id").references(
      () => niscClientSubscriptionUsage.id,
      { onDelete: "set null" },
    ),
    usageEventId: text("usage_event_id").references(() => zeepoAiUsageEvent.id, {
      onDelete: "set null",
    }),
    /** DEBIT | CREDIT */
    direction: text("direction").notNull(),
    /** Decimal string, e.g. "12.5" */
    tokens: text("tokens").notNull(),
    balanceBefore: text("balance_before").notNull(),
    balanceAfter: text("balance_after").notNull(),
    /**
     * chat_orchestration | media_generation | image_edit | title_gen |
     * tool_call | top_up | subscription_grant | adjustment | …
     */
    operationType: text("operation_type").notNull(),
    description: text("description"),
    providerCostUsdMicros: integer("provider_cost_usd_micros"),
    providerRequestId: text("provider_request_id"),
    modelId: text("model_id"),
    provider: text("provider"),
    generationId: text("generation_id").references(() => zeepoAiGeneration.id, {
      onDelete: "set null",
    }),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("zeepo_ai_token_ledger_teamId_idx").on(table.teamId),
    index("zeepo_ai_token_ledger_userId_idx").on(table.userId),
    index("zeepo_ai_token_ledger_sessionId_idx").on(table.sessionId),
    index("zeepo_ai_token_ledger_operationType_idx").on(table.operationType),
    index("zeepo_ai_token_ledger_providerRequestId_idx").on(table.providerRequestId),
    index("zeepo_ai_token_ledger_createdAt_idx").on(table.createdAt),
    index("zeepo_ai_token_ledger_teamId_createdAt_idx").on(
      table.teamId,
      table.createdAt,
    ),
  ],
);

// --- Relations ----------------------------------------------------------------

export const zeepoAiSessionRelations = relations(zeepoAiSession, ({ one, many }) => ({
  user: one(user, {
    fields: [zeepoAiSession.userId],
    references: [user.id],
  }),
  team: one(team, {
    fields: [zeepoAiSession.teamId],
    references: [team.id],
  }),
  messages: many(zeepoAiMessage),
  toolInvocations: many(zeepoAiToolInvocation),
  generations: many(zeepoAiGeneration),
  attachments: many(zeepoAiAttachment),
  activityLogs: many(zeepoAiActivityLog),
  usageEvents: many(zeepoAiUsageEvent),
  imageEditHistory: many(zeepoAiImageEditHistory),
}));

export const zeepoAiMessageRelations = relations(zeepoAiMessage, ({ one, many }) => ({
  session: one(zeepoAiSession, {
    fields: [zeepoAiMessage.sessionId],
    references: [zeepoAiSession.id],
  }),
  generations: many(zeepoAiGeneration),
  toolInvocations: many(zeepoAiToolInvocation),
  attachments: many(zeepoAiAttachment),
}));

export const zeepoAiToolInvocationRelations = relations(
  zeepoAiToolInvocation,
  ({ one }) => ({
    session: one(zeepoAiSession, {
      fields: [zeepoAiToolInvocation.sessionId],
      references: [zeepoAiSession.id],
    }),
    message: one(zeepoAiMessage, {
      fields: [zeepoAiToolInvocation.messageId],
      references: [zeepoAiMessage.id],
    }),
    user: one(user, {
      fields: [zeepoAiToolInvocation.userId],
      references: [user.id],
    }),
    team: one(team, {
      fields: [zeepoAiToolInvocation.teamId],
      references: [team.id],
    }),
  }),
);

export const zeepoAiGenerationRelations = relations(
  zeepoAiGeneration,
  ({ one, many }) => ({
    session: one(zeepoAiSession, {
      fields: [zeepoAiGeneration.sessionId],
      references: [zeepoAiSession.id],
    }),
    message: one(zeepoAiMessage, {
      fields: [zeepoAiGeneration.messageId],
      references: [zeepoAiMessage.id],
    }),
    user: one(user, {
      fields: [zeepoAiGeneration.userId],
      references: [user.id],
    }),
    team: one(team, {
      fields: [zeepoAiGeneration.teamId],
      references: [team.id],
    }),
    parent: one(zeepoAiGeneration, {
      fields: [zeepoAiGeneration.parentGenerationId],
      references: [zeepoAiGeneration.id],
      relationName: "zeepoAiGenerationParent",
    }),
    children: many(zeepoAiGeneration, {
      relationName: "zeepoAiGenerationParent",
    }),
    imageEditHistory: many(zeepoAiImageEditHistory),
  }),
);

export const zeepoAiAttachmentRelations = relations(zeepoAiAttachment, ({ one }) => ({
  session: one(zeepoAiSession, {
    fields: [zeepoAiAttachment.sessionId],
    references: [zeepoAiSession.id],
  }),
  message: one(zeepoAiMessage, {
    fields: [zeepoAiAttachment.messageId],
    references: [zeepoAiMessage.id],
  }),
  user: one(user, {
    fields: [zeepoAiAttachment.userId],
    references: [user.id],
  }),
}));

export const zeepoAiImageEditHistoryRelations = relations(
  zeepoAiImageEditHistory,
  ({ one }) => ({
    session: one(zeepoAiSession, {
      fields: [zeepoAiImageEditHistory.sessionId],
      references: [zeepoAiSession.id],
    }),
    generation: one(zeepoAiGeneration, {
      fields: [zeepoAiImageEditHistory.generationId],
      references: [zeepoAiGeneration.id],
    }),
    user: one(user, {
      fields: [zeepoAiImageEditHistory.userId],
      references: [user.id],
    }),
    parent: one(zeepoAiImageEditHistory, {
      fields: [zeepoAiImageEditHistory.parentId],
      references: [zeepoAiImageEditHistory.id],
      relationName: "zeepoAiImageEditParent",
    }),
  }),
);

export const zeepoAiUsageEventRelations = relations(zeepoAiUsageEvent, ({ one }) => ({
  team: one(team, {
    fields: [zeepoAiUsageEvent.teamId],
    references: [team.id],
  }),
  user: one(user, {
    fields: [zeepoAiUsageEvent.userId],
    references: [user.id],
  }),
  session: one(zeepoAiSession, {
    fields: [zeepoAiUsageEvent.sessionId],
    references: [zeepoAiSession.id],
  }),
  message: one(zeepoAiMessage, {
    fields: [zeepoAiUsageEvent.messageId],
    references: [zeepoAiMessage.id],
  }),
  generation: one(zeepoAiGeneration, {
    fields: [zeepoAiUsageEvent.generationId],
    references: [zeepoAiGeneration.id],
  }),
  toolInvocation: one(zeepoAiToolInvocation, {
    fields: [zeepoAiUsageEvent.toolInvocationId],
    references: [zeepoAiToolInvocation.id],
  }),
}));

export const zeepoAiActivityLogRelations = relations(zeepoAiActivityLog, ({ one }) => ({
  session: one(zeepoAiSession, {
    fields: [zeepoAiActivityLog.sessionId],
    references: [zeepoAiSession.id],
  }),
  team: one(team, {
    fields: [zeepoAiActivityLog.teamId],
    references: [team.id],
  }),
}));

export const zeepoAiTokenLedgerRelations = relations(zeepoAiTokenLedger, ({ one }) => ({
  team: one(team, {
    fields: [zeepoAiTokenLedger.teamId],
    references: [team.id],
  }),
  user: one(user, {
    fields: [zeepoAiTokenLedger.userId],
    references: [user.id],
  }),
  session: one(zeepoAiSession, {
    fields: [zeepoAiTokenLedger.sessionId],
    references: [zeepoAiSession.id],
  }),
  subscriptionUsage: one(niscClientSubscriptionUsage, {
    fields: [zeepoAiTokenLedger.subscriptionUsageId],
    references: [niscClientSubscriptionUsage.id],
  }),
  usageEvent: one(zeepoAiUsageEvent, {
    fields: [zeepoAiTokenLedger.usageEventId],
    references: [zeepoAiUsageEvent.id],
  }),
  generation: one(zeepoAiGeneration, {
    fields: [zeepoAiTokenLedger.generationId],
    references: [zeepoAiGeneration.id],
  }),
}));
