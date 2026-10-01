import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

import { user } from "./auth";

export const apiKey = pgTable(
  "api_key",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    keyHash: text("key_hash").notNull().unique(),
    permissions: jsonb("permissions").$type<string[]>().notNull(),
    expiresAt: timestamp("expires_at"),
    isActive: boolean("is_active").default(true).notNull(),
    lastUsedAt: timestamp("last_used_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("api_key_userId_idx").on(table.userId),
    index("api_key_keyHash_idx").on(table.keyHash),
  ]
);

export const customerIntegration = pgTable(
  "customer_integration",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    platform: text("platform").notNull(),

    platformCustomerId: text("platform_customer_id"),

    isActive: boolean("is_active").default(true).notNull(),
    isCreated: boolean("is_created").default(false).notNull(),

    createdBy: text("created_by"),
    createdAt: timestamp("created_at").notNull(),
    lastSyncedAt: timestamp("last_synced_at"),

    platformData: jsonb("platform_data"),

    updatedAt: timestamp("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("customer_integration_userId_platform_unique").on(
      table.userId,
      table.platform,
    ),
    index("customer_integration_userId_idx").on(table.userId),
    index("customer_integration_platform_idx").on(table.platform),
    index("customer_integration_platformCustomerId_idx").on(table.platformCustomerId),
    index("customer_integration_isActive_idx").on(table.isActive),
    index("customer_integration_isCreated_idx").on(table.isCreated),
  ],
);

export const customerIntegrationActivityLog = pgTable(
  "customer_integration_activity_log",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    customerIntegrationId: text("customer_integration_id")
      .notNull()
      .references(() => customerIntegration.id, { onDelete: "cascade" }),
    action: text("action").notNull(),
    description: text("description"),
    metadata: jsonb("metadata"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").notNull(),
  },
  (table) => [
    index("customer_integration_activity_userId_idx").on(table.userId),
    index("customer_integration_activity_customerIntegrationId_idx").on(
      table.customerIntegrationId,
    ),
    index("customer_integration_activity_action_idx").on(table.action),
    index("customer_integration_activity_createdAt_idx").on(table.createdAt),
  ],
);

export const userProfile = pgTable(
  "user_profile",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: "cascade" }),
    firstName: text("first_name"),
    lastName: text("last_name"),
    phone: text("phone"),
    address: text("address"),
    city: text("city"),
    state: text("state"),
    country: text("country"),
    postalCode: text("postal_code"),
    customerGuideCompletedAt: timestamp("customer_guide_completed_at"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (table) => [index("user_profile_userId_idx").on(table.userId)],
);

export const userActivityLog = pgTable(
  "user_activity_log",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    action: text("action").notNull(),
    description: text("description"),
    metadata: jsonb("metadata"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").notNull(),
  },
  (table) => [
    index("user_activity_log_userId_idx").on(table.userId),
    index("user_activity_log_action_idx").on(table.action),
    index("user_activity_log_createdAt_idx").on(table.createdAt),
  ],
);

export const customerIntegrationRelations = relations(
  customerIntegration,
  ({ one, many }) => ({
    user: one(user, {
      fields: [customerIntegration.userId],
      references: [user.id],
    }),
    activityLogs: many(customerIntegrationActivityLog),
  }),
);

export const customerIntegrationActivityLogRelations = relations(
  customerIntegrationActivityLog,
  ({ one }) => ({
    customerIntegration: one(customerIntegration, {
      fields: [customerIntegrationActivityLog.customerIntegrationId],
      references: [customerIntegration.id],
    }),
  }),
);

export const userProfileRelations = relations(userProfile, ({ one }) => ({
  user: one(user, {
    fields: [userProfile.userId],
    references: [user.id],
  }),
}));

export const userActivityLogRelations = relations(userActivityLog, ({ one }) => ({
  user: one(user, {
    fields: [userActivityLog.userId],
    references: [user.id],
  }),
}));

export const apiKeyRelations = relations(apiKey, ({ one }) => ({
  user: one(user, {
    fields: [apiKey.userId],
    references: [user.id],
  }),
}));

export const userMfaSettings = pgTable(
  "user_mfa_settings",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: "cascade" }),
    emailOtpEnabled: boolean("email_otp_enabled").default(false).notNull(),
    setupRequired: boolean("setup_required").default(false).notNull(),
    preferredMethod: text("preferred_method").default("EMAIL_OTP").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("user_mfa_settings_userId_idx").on(table.userId)],
);

export const userMfaSession = pgTable(
  "user_mfa_session",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    sessionId: text("session_id").notNull().unique(),
    requiredAt: timestamp("required_at").defaultNow().notNull(),
    verifiedAt: timestamp("verified_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("user_mfa_session_userId_idx").on(table.userId),
    index("user_mfa_session_sessionId_idx").on(table.sessionId),
    index("user_mfa_session_verifiedAt_idx").on(table.verifiedAt),
    index("user_mfa_session_pending_by_session_idx")
      .on(table.sessionId)
      .where(sql`${table.verifiedAt} IS NULL`),
  ],
);

export const userMfaChallenge = pgTable(
  "user_mfa_challenge",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    sessionId: text("session_id").notNull(),
    codeHash: text("code_hash").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    consumedAt: timestamp("consumed_at"),
    attempts: integer("attempts").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("user_mfa_challenge_userId_idx").on(table.userId),
    index("user_mfa_challenge_sessionId_idx").on(table.sessionId),
    index("user_mfa_challenge_expiresAt_idx").on(table.expiresAt),
  ],
);

export const userMfaSettingsRelations = relations(userMfaSettings, ({ one }) => ({
  user: one(user, {
    fields: [userMfaSettings.userId],
    references: [user.id],
  }),
}));

export const userMfaSessionRelations = relations(userMfaSession, ({ one }) => ({
  user: one(user, {
    fields: [userMfaSession.userId],
    references: [user.id],
  }),
}));

export const userMfaChallengeRelations = relations(userMfaChallenge, ({ one }) => ({
  user: one(user, {
    fields: [userMfaChallenge.userId],
    references: [user.id],
  }),
}));
